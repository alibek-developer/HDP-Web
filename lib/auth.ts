import { createHmac, timingSafeEqual, createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const COOKIE_NAME = 'hdp_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8
export const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@hdp.uz'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'hdp2026'
const SECRET = process.env.AUTH_SECRET ?? 'hdp-admin-demo-secret-2026'

const sign = (payload: string) => createHmac('sha256', SECRET).update(payload).digest('base64url')

const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(createHash('sha256').update(left).digest())
  const b = Buffer.from(createHash('sha256').update(right).digest())
  return timingSafeEqual(a, b)
}

export const verifyCredentials = (email: string, password: string): boolean =>
  safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase()) && safeEqual(password, ADMIN_PASSWORD)

export interface Session {
  email: string
  expiresAt: number
}

export const createSessionToken = (email: string, ttlSeconds: number = SESSION_TTL_SECONDS): string => {
  const expiresAt = Date.now() + ttlSeconds * 1000
  const payload = Buffer.from(JSON.stringify({ email, exp: expiresAt })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export const verifySessionToken = (token: string | undefined): Session | null => {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  if (!safeEqual(sign(payload), signature)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    if (!parsed.email || parsed.expiresAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export const readSession = async (): Promise<Session | null> => {
  const store = await cookies()
  return verifySessionToken(store.get(COOKIE_NAME)?.value)
}

export const requireSession = async (): Promise<Session> => {
  const session = await readSession()
  if (!session) redirect('/login')
  return session
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  },
}
export const demoHintVisible = !process.env.ADMIN_PASSWORD
