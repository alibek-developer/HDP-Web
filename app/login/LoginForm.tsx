'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'

const schema = z.object({
  email: z.string().min(1, 'Emailni kiriting').email("Email formati noto'g'ri"),
  password: z.string().min(4, "Parol kamida 4 belgidan iborat"),
})

type FormValues = z.infer<typeof schema>

export default function LoginForm({ demo }: { demo: { email: string; password: string } | null }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: FormValues) => {
    setServerError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, remember }),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        setServerError(data.error ?? "Kirishda xatolik yuz berdi")
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setServerError("Server bilan aloqa yo'q. Qayta urinib ko'ring.")
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 space-y-4 [@media(max-height:820px)]:mt-4 [@media(max-height:820px)]:space-y-3"
    >
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink-2 [@media(max-height:820px)]:mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@hdp.uz"
            className={`h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-[14px] text-ink outline-none transition placeholder:text-placeholder focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 [@media(max-height:820px)]:h-10 ${
              errors.email ? 'border-error focus:border-error focus:ring-error/10' : ''
            }`}
            {...register('email')}
          />
        </div>
        {errors.email ? <p className="mt-1.5 text-[12px] text-error">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-ink-2 [@media(max-height:820px)]:mb-1">
          Parol
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-11 text-[14px] text-ink outline-none transition placeholder:text-placeholder focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 [@media(max-height:820px)]:h-10 ${
              errors.password ? 'border-error focus:border-error focus:ring-error/10' : ''
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition hover:bg-muted hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="mt-1.5 text-[12px] text-error">{errors.password.message}</p> : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-ink-2">
          <span className="relative grid h-4 w-4 place-items-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="peer h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-line bg-white transition checked:border-brand checked:bg-brand"
            />
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Meni eslab qol
        </label>
        <a
          href="mailto:support@hdp.uz?subject=Parolni%20tiklash"
          className="text-[13px] font-semibold text-brand-text hover:underline"
        >
          Parolni unutdingizmi?
        </a>
      </div>

      {serverError ? (
        <div className="rounded-xl border border-[#fecaca] bg-error-bg px-3.5 py-2.5 text-[13px] text-error">
          {serverError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[14px] font-semibold text-white shadow-brand transition hover:bg-brand-hover hover:shadow-brand-hover active:translate-y-px active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-70 [@media(max-height:820px)]:h-10"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {isSubmitting ? 'Kirilmoqda...' : 'Kirish'}
        {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      {demo ? (
        <>
          <div className="relative py-1 text-center [@media(max-height:820px)]:py-0.5">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
            <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              yoki
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setValue('email', demo.email, { shouldValidate: true })
              setValue('password', demo.password, { shouldValidate: true })
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-brand bg-brand-soft text-[14px] font-semibold text-brand-text transition hover:border-brand/40 hover:bg-[#e6f6ec] active:translate-y-px [@media(max-height:820px)]:h-10"
          >
            Demo hisobni to'ldirish
          </button>
          <p className="text-center font-mono text-[11px] text-ink-3">
            {demo.email} · {demo.password}
          </p>
        </>
      ) : null}
    </motion.form>
  )
}
