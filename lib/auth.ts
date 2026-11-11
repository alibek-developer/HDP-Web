import { createHmac, timingSafeEqual, createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const COOKIE_NAME = 'hdp_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8
export const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@hdp.uz'
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'hdp2026'

interface AuthState {
  password: string
  secret: string
  attempts: Map<string, { count: number; resetAt: number }>
}

const globalAuth = globalThis as typeof globalThis & { __hdpAuth?: AuthState; __hdpWarned?: boolean }
const authState = (): AuthState =>
  (globalAuth.__hdpAuth ??= {
    password: DEFAULT_ADMIN_PASSWORD,
    secret: process.env.AUTH_SECRET ?? randomBytes(32).toString('base64url'),
    attempts: new Map(),
  })

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.AUTH_SECRET &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  !globalAuth.__hdpWarned
) {
  globalAuth.__hdpWarned = true
  console.warn('[auth] AUTH_SECRET o‘rnatilmagan — har ishga tushishda tasodifiy sessiya kaliti ishlatiladi.')
}

const sign = (payload: string) => createHmac('sha256', authState().secret).update(payload).digest('base64url')

const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(createHash('sha256').update(left).digest())
  const b = Buffer.from(createHash('sha256').update(right).digest())
  return timingSafeEqual(a, b)
}

export const verifyCredentials = (email: string, password: string): boolean =>
  safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase()) &&
  safeEqual(password, authState().password)

export const changePassword = (current: string, next: string): boolean => {
  if (!safeEqual(current, authState().password)) return false
  authState().password = next
  return true
}

const RATE_LIMIT_MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 60_000

export const loginRateLimit = (key: string): { limited: boolean; retryAfter: number } => {
  const now = Date.now()
  const attempts = authState().attempts
  const entry = attempts.get(key)
  if (!entry || entry.resetAt <= now) {
    if (entry) attempts.delete(key)
    return { limited: false, retryAfter: 0 }
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { limited: false, retryAfter: 0 }
}

export const recordFailedLogin = (key: string): void => {
  const now = Date.now()
  const attempts = authState().attempts
  if (attempts.size > 5_000) {
    for (const [entryKey, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(entryKey)
    }
  }
  const entry = attempts.get(key)
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }
  entry.count += 1
}

export const clearLoginAttempts = (key: string): void => {
  authState().attempts.delete(key)
}

export const loginAttemptKey = (email: string, request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip') || 'local'
  return `${ip}:${email.trim().toLowerCase()}`
}

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

export const demoCredentials = (): { email: string; password: string } | null =>
  !process.env.ADMIN_PASSWORD && authState().password === DEFAULT_ADMIN_PASSWORD
    ? { email: ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD }
    : null
