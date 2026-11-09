import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ADMIN_EMAIL, ADMIN_PASSWORD, demoHintVisible, readSession } from '@/lib/auth'
import LoginForm from './LoginForm'

export const metadata = { title: 'Kirish — HDP Academy Admin' }

export default async function LoginPage() {
  const session = await readSession()
  if (session) redirect('/admin')

  return (
    <main className="relative h-dvh overflow-hidden bg-[#eaeFec] p-3 sm:p-5 lg:p-8">
      <div className="pointer-events-none absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[#86efac]/45 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-48 right-[-10%] h-[560px] w-[560px] rounded-full bg-[#93c5fd]/35 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-[380px] w-[380px] rounded-full bg-[#fef3c7]/50 blur-[100px]" />

      <div className="relative mx-auto flex h-full w-full max-w-[1200px] rounded-[30px] border border-white/70 bg-white/55 p-1.5 shadow-[0_40px_90px_-40px_rgba(12,45,28,0.35)] backdrop-blur-xl sm:p-2">
        <div className="grid h-full w-full gap-2 lg:grid-cols-[minmax(0,470px)_1fr]">
          <section className="no-scrollbar flex min-h-0 flex-col overflow-y-auto rounded-[24px] bg-white px-6 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10 [@media(max-height:820px)]:py-3">
            <div className="mx-auto flex w-full max-w-[430px] items-center gap-3 lg:max-w-none">
              <div className="grid h-11 w-11 place-items-center rounded-2xl brand-gradient font-display text-xl font-extrabold text-white shadow-brand">
                H
              </div>
              <div>
                <p className="font-display text-[15px] font-bold leading-tight text-ink">HDP Academy</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">Admin panel</p>
              </div>
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-[430px] flex-1 flex-col justify-center lg:max-w-none [@media(max-height:820px)]:mt-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line-brand bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-text">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Xavfsiz kirish
              </span>
              <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[34px] [@media(max-height:820px)]:text-[28px]">
                Xush kelibsiz
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-3 [@media(max-height:820px)]:mt-1 [@media(max-height:820px)]:text-[13px]">
                Panelga kirish uchun admin hisobingizdan foydalaning.
              </p>

              <LoginForm
                demo={demoHintVisible ? { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } : null}
              />
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-[430px] flex-wrap items-center justify-between gap-2 border-t border-line-2 pt-4 text-[12px] text-ink-3 lg:max-w-none [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:pt-2">
              <span>© 2026 HDP Academy</span>
              <a href="mailto:support@hdp.uz" className="font-semibold text-brand-text hover:underline">
                support@hdp.uz
              </a>
            </div>
          </section>

          <aside className="relative hidden overflow-hidden rounded-[24px] bg-[#e7f4ec] lg:block">
            <Image
              src="/login-hero.png"
              alt="Matematika o'quv platformasi illyustratsiyasi"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 0px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3a22]/85 via-[#0b3a22]/15 to-transparent" />

            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
              Boshqaruv paneli · 2026
            </div>

            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/25 bg-white/15 p-5 text-white backdrop-blur-md">
              <p className="font-display text-[22px] font-bold leading-snug tracking-[-0.01em]">
                Matematika platformasini bitta panelda boshqaring
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                O'quvchilar, kontent, testlar, olimpiadalar va to'lovlar — barchasi yagona, tez va
                ishonchli joyda.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
