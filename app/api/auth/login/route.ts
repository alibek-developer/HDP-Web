import { NextResponse } from 'next/server'
import {
  clearLoginAttempts,
  createSessionToken,
  loginAttemptKey,
  loginRateLimit,
  recordFailedLogin,
  REMEMBER_TTL_SECONDS,
  sessionCookie,
  verifyCredentials,
} from '@/lib/auth'

export async function POST(request: Request) {
  let body: { email?: string; password?: string; remember?: boolean }
  try {
    body = (await request.json()) as { email?: string; password?: string; remember?: boolean }
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri" }, { status: 400 })
  }

  const email = body.email?.trim() ?? ''
  const password = body.password ?? ''
  const remember = body.remember === true

  if (!email || !password) {
    return NextResponse.json({ error: 'Email va parolni kiriting' }, { status: 400 })
  }

  const attemptKey = loginAttemptKey(email, request)
  const limit = loginRateLimit(attemptKey)
  if (limit.limited) {
    return NextResponse.json(
      { error: `Juda ko‘p urinish. ${limit.retryAfter} soniyadan so‘ng qayta harakat qiling.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  if (!verifyCredentials(email, password)) {
    recordFailedLogin(attemptKey)
    return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 })
  }

  clearLoginAttempts(attemptKey)

  const response = NextResponse.json({ ok: true })
  const options = remember
    ? { ...sessionCookie.options, maxAge: REMEMBER_TTL_SECONDS }
    : sessionCookie.options
  const token = remember
    ? createSessionToken(email.toLowerCase(), REMEMBER_TTL_SECONDS)
    : createSessionToken(email.toLowerCase())
  response.cookies.set(sessionCookie.name, token, options)
  return response
}
