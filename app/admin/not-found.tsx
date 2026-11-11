import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-line-2 bg-white p-6 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-text">
          <Compass className="h-6 w-6" />
        </span>
        <p className="mt-4 font-geist text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">404</p>
        <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-ink">Sahifa topilmadi</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
          Havola eskirgan yoki bo‘lim manzili o‘zgargan bo‘lishi mumkin.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white transition hover:bg-brand-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboardga qaytish
        </Link>
      </div>
    </div>
  )
}
