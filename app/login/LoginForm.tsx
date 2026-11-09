'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'

const schema = z.object({
  email: z.string().min(1, 'Emailni kiriting').email("Email formati noto'g'ri"),
  password: z.string().min(4, "Parol kamida 4 belgidan iborat"),
})

type FormValues = z.infer<typeof schema>

const inputClass = (invalid: boolean) =>
  [
    'h-12 w-full rounded-[14px] border bg-white pl-11 pr-3 font-geist text-[14.5px] font-medium text-ink outline-none transition',
    'placeholder:font-normal placeholder:text-placeholder',
    'focus:ring-4 focus:ring-brand/10 disabled:opacity-60',
    invalid
      ? 'border-error focus:border-error focus:ring-error/10'
      : 'border-line hover:border-line-brand focus:border-brand',
    '[@media(max-height:760px)]:h-[46px]',
  ].join(' ')

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
        setServerError(data.error ?? 'Kirishda xatolik yuz berdi')
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
      noValidate
      className="mt-7 space-y-4 [@media(max-height:760px)]:mt-5 [@media(max-height:760px)]:space-y-3.5"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block font-geist text-[13px] font-semibold text-ink-2"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@hdp.uz"
            className={inputClass(Boolean(errors.email))}
            {...register('email')}
          />
        </div>
        {errors.email ? (
          <p className="mt-1.5 font-geist text-[12px] font-medium text-error">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block font-geist text-[13px] font-semibold text-ink-2"
        >
          Parol
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${inputClass(Boolean(errors.password))} pr-12`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[10px] text-ink-3 transition hover:bg-muted hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-1.5 font-geist text-[12px] font-medium text-error">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <label className="inline-flex cursor-pointer select-none items-center gap-2.5 font-geist text-[13px] font-medium text-ink-2">
          <span className="relative grid h-[18px] w-[18px] place-items-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[6px] border border-line bg-white transition checked:border-brand checked:bg-brand"
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
          className="font-geist text-[13px] font-semibold text-brand-text transition hover:text-brand-hover"
        >
          Parolni unutdingizmi?
        </a>
      </div>

      {serverError ? (
        <div className="flex items-start gap-2.5 rounded-[12px] border border-error/25 bg-error-bg px-3.5 py-3 font-geist text-[13px] font-medium leading-snug text-error">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" />
          {serverError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-4 font-geist text-[15px] font-bold text-white transition hover:bg-brand active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 [@media(max-height:760px)]:h-[48px]"
      >
        {isSubmitting ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
        {isSubmitting ? 'Kirilmoqda...' : 'Kirish'}
        {!isSubmitting ? (
          <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
        ) : null}
      </button>

      {demo ? (
        <>
          <div className="relative py-0.5 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
            <span className="relative bg-white px-3 font-geist text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
              yoki
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setValue('email', demo.email, { shouldValidate: true })
              setValue('password', demo.password, { shouldValidate: true })
            }}
            className="inline-flex h-12 w-full items-center justify-center rounded-[14px] border border-dashed border-line-brand bg-white font-geist text-[13.5px] font-semibold text-brand-text transition hover:border-brand/40 hover:bg-brand-soft active:translate-y-px [@media(max-height:760px)]:h-[46px]"
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
