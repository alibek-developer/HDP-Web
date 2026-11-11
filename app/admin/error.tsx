'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-line-2 bg-white p-6 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-error-bg text-error">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.03em] text-ink">Sahifani yuklab bo‘lmadi</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
          Kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring — ma’lumotlar saqlangan.
        </p>
        {error.digest ? <p className="mt-3 font-mono text-[11px] text-ink-3">Xatolik kodi: {error.digest}</p> : null}
        <Button className="mt-5" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Qayta yuklash
        </Button>
      </div>
    </div>
  )
}
