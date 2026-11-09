import { redirect } from 'next/navigation'
import { Library, Trophy, Users } from 'lucide-react'
import { ADMIN_EMAIL, ADMIN_PASSWORD, demoHintVisible, readSession } from '@/lib/auth'
import LoginForm from './LoginForm'

export const metadata = { title: 'Kirish — HDP Academy' }

const MODULES = [
  {
    icon: Users,
    title: 'Foydalanuvchilar',
    subtitle: "O'quvchilar bazasi, profillar va progress",
  },
  {
    icon: Library,
    title: 'Kontent',
    subtitle: 'Fanlar, mavzular, videolar va testlar',
  },
  {
    icon: Trophy,
    title: 'Olimpiadalar',
    subtitle: "Musobaqalar, jonli monitoring va natijalar",
  },
]

export default async function LoginPage() {
  const session = await readSession()
  if (session) redirect('/admin')

  return (
    <main className="admin-theme h-dvh overflow-hidden bg-white">
      <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_minmax(440px,44%)]">
        <section className="flex h-full min-h-0 flex-col px-5 py-5 sm:px-10 sm:py-7 lg:px-14 xl:px-20">
          <header className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-brand font-geist text-[18px] font-extrabold text-white shadow-brand">
              H
            </div>
            <div>
              <p className="font-geist text-[15.5px] font-extrabold leading-tight text-ink">
                HDP Academy
              </p>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink-3">
                Admin panel
              </p>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
            <div className="mx-auto w-full max-w-[430px] lg:mx-0 lg:max-w-[420px]">
              <span className="inline-flex items-center gap-2 font-geist text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                <span className="h-px w-6 bg-brand" />
                Boshqaruv paneli · 2026
              </span>

              <h1 className="mt-3 font-geist text-[38px] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[46px] xl:text-[52px] [@media(max-height:760px)]:text-[34px]">
                Xush kelibsiz<span className="text-brand">.</span>
              </h1>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink-3 sm:text-[15px]">
                Panelga kirish uchun admin hisobingizdan foydalaning.
              </p>

              <LoginForm
                demo={demoHintVisible ? { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } : null}
              />
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line-2 pt-3.5 text-[12px] text-ink-3">
            <span>© 2026 HDP Academy</span>
            <a
              href="mailto:support@hdp.uz"
              className="font-semibold text-brand-text transition hover:text-brand-hover"
            >
              support@hdp.uz
            </a>
          </footer>
        </section>

        <aside className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-28 h-[460px] w-[460px] rounded-full bg-brand/25 blur-[130px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-44 -left-28 h-[400px] w-[400px] rounded-full bg-brand/[0.14] blur-[120px]"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 font-geist text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/75">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
              HDP Academy
            </span>
          </div>

          <div className="relative max-w-[440px]">
            <h2 className="font-geist text-[34px] font-extrabold leading-[1.08] tracking-[-0.025em] text-white xl:text-[42px]">
              Butun akademiya — <span className="text-brand-light">bitta panelda.</span>
            </h2>
            <p className="mt-4 max-w-[380px] text-[14px] leading-relaxed text-white/55">
              Kontent, o'quvchilar, olimpiadalar va to'lovlar — har kuni kerak bo'ladigan barcha
              vositalar bir joyda.
            </p>

            <ul className="mt-8 space-y-2.5">
              {MODULES.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center gap-3.5 rounded-[14px] border border-white/10 bg-white/[0.04] px-3.5 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-brand/15 text-brand-light">
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-geist text-[13.5px] font-bold text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-white/45">
                      {item.subtitle}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center justify-between text-[11px] text-white/35">
            <span>Xavfsiz admin sessiyasi</span>
            <span className="font-geist font-semibold tracking-[0.08em]">hdp.uz</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
