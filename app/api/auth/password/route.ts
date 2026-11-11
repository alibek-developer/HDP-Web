import { NextResponse } from 'next/server'
import { changePassword, readSession } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) {
    return NextResponse.json({ error: 'Sessiya topilmadi. Qayta kiring.' }, { status: 401 })
  }

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = (await request.json()) as { currentPassword?: string; newPassword?: string }
  } catch {
    return NextResponse.json({ error: "So'rov formati noto'g'ri" }, { status: 400 })
  }

  const currentPassword = body.currentPassword ?? ''
  const newPassword = body.newPassword ?? ''

  if (!currentPassword) {
    return NextResponse.json({ error: 'Joriy parolni kiriting' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Yangi parol kamida 6 belgi bo‘lishi kerak' }, { status: 400 })
  }
  if (!changePassword(currentPassword, newPassword)) {
    return NextResponse.json({ error: 'Joriy parol noto‘g‘ri' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
