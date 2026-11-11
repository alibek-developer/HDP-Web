'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  BellRing,
  Check,
  Eye,
  Link2,
  Megaphone,
  MousePointerClick,
  Send,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  ProgressBar,
  SearchInput,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { MOCK_NOW, dateTime, number, percent } from '@/lib/format'
import { REGION_NAMES } from '@/lib/mock'
import type { NotificationAudience, NotificationRecord, NotificationType } from '@/lib/types'

const AUDIENCE_LABEL: Record<NotificationAudience, string> = {
  all: 'Hamma',
  pro: 'Faqat Pro',
  free: 'Faqat bepul',
  custom: 'Maxsus',
}

const AUDIENCE_FULL: Record<NotificationAudience, string> = {
  all: 'Hamma foydalanuvchilar',
  pro: 'Faqat Pro',
  free: 'Faqat bepul',
  custom: 'Maxsus (filter bo‘yicha)',
}

const TYPE_LABEL: Record<NotificationType, string> = {
  push: 'Push',
  inapp: 'In-app',
  both: 'Push + in-app',
}

const TYPE_TONE: Record<NotificationType, 'info' | 'violet' | 'brand'> = {
  push: 'info',
  inapp: 'violet',
  both: 'brand',
}

const DEFAULT_SCHEDULE = () => {
  const next = new Date(MOCK_NOW)
  next.setHours(next.getHours() + 2)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:00`
}

const readRate = (record: NotificationRecord) => (record.recipients ? (record.read / record.recipients) * 100 : 0)
const clickRate = (record: NotificationRecord) => (record.recipients ? (record.clicked / record.recipients) * 100 : 0)

function PushBanner({ title, body, link, primary }: { title: string; body: string; link: string; primary?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-3">
        <span className="grid h-4 w-4 place-items-center rounded bg-brand text-white"><BellRing className="h-2.5 w-2.5" /></span>
        HDP Matematika
        <span className="ml-auto font-medium text-ink-3">hozir</span>
      </div>
      <p {...(primary ? { 'data-preview-title': true } : {})} className="mt-1.5 line-clamp-1 text-[12px] font-bold text-ink">
        {title || 'Sarlavha shu yerda ko‘rinadi'}
      </p>
      <p {...(primary ? { 'data-preview-body': true } : {})} className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-2">
        {body || 'Bildirishnoma matni. Qisqa va tushunarli bo‘lishi tavsiya etiladi.'}
      </p>
      {link ? <p className="mt-1 truncate text-[9.5px] text-ink-3">{link}</p> : null}
    </div>
  )
}

function InAppBanner({ title, body, primary }: { title: string; body: string; primary?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line-brand bg-brand-soft p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white"><Megaphone className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p {...(primary ? { 'data-preview-title': true } : {})} className="line-clamp-1 text-[12px] font-bold text-ink">{title || 'Sarlavha'}</p>
        <p {...(primary ? { 'data-preview-body': true } : {})} className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-2">{body || 'Bildirishnoma matni'}</p>
      </div>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white text-ink-3"><Eye className="h-3 w-3" /></span>
    </div>
  )
}

function PhonePreview({ type, title, body, link }: { type: NotificationType; title: string; body: string; link: string }) {
  const lockScreen = type !== 'inapp'
  return (
    <div data-preview-mode={type} className="flex flex-col items-center gap-3">
      <div className="relative w-[220px] shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink p-1.5 shadow-modal">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0b1220]">
          <span className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />
          {lockScreen ? (
            <div className="flex min-h-[380px] flex-col px-3 pb-4 pt-9">
              <p className="text-center text-[11px] font-medium text-white/70">{dateTime(MOCK_NOW).split(',')[0]}</p>
              <p className="text-center font-display text-[40px] font-extrabold leading-none tracking-tight text-white">09:00</p>
              <div className="mt-5 space-y-2">
                <PushBanner title={title} body={body} link={link} primary />
              </div>
              <div className="mt-auto flex items-center justify-between px-4 pt-4 text-white/60">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10"><Smartphone className="h-3.5 w-3.5" /></span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10"><Bell className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[380px] flex-col px-3 pb-4 pt-9">
              <div className="flex items-center gap-2 text-white">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white"><BellRing className="h-3.5 w-3.5" /></span>
                <span className="text-[12px] font-bold">HDP Matematika</span>
              </div>
              <div className="mt-3"><InAppBanner title={title} body={body} primary /></div>
              <div className="mt-3 space-y-2">
                <div className="h-16 rounded-xl bg-white/10" />
                <div className="h-16 rounded-xl bg-white/10" />
                <div className="h-16 rounded-xl bg-white/10" />
              </div>
            </div>
          )}
        </div>
      </div>
      {type === 'both' ? (
        <div className="w-full">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">In-app banner</p>
          <InAppBanner title={title} body={body} />
        </div>
      ) : null}
      <p className="text-[11.5px] text-ink-3">{type === 'inapp' ? 'Ilova ichida banner' : type === 'both' ? 'Lock screen + ilova ichida' : 'Lock screen push'}</p>
    </div>
  )
}

function MobilePreview({ type, title, body, link }: { type: NotificationType; title: string; body: string; link: string }) {
  return (
    <div data-preview-mode={type} className="card space-y-2 p-3 lg:hidden">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">Jonli preview · {TYPE_LABEL[type]}</p>
      {type === 'inapp' ? <InAppBanner title={title} body={body} primary /> : <PushBanner title={title} body={body} link={link} primary />}
      {type === 'both' ? <InAppBanner title={title} body={body} /> : null}
    </div>
  )
}

export default function NotificationsPage() {
  const users = useAppStore((state) => state.users)
  const notifications = useAppStore((state) => state.notifications)
  const sendNotification = useAppStore((state) => state.sendNotification)
  const deleteNotification = useAppStore((state) => state.deleteNotification)
  const { toast } = useToast()

  const [tab, setTab] = useState<'send' | 'history'>('send')
  const [audience, setAudience] = useState<NotificationAudience>('all')
  const [type, setType] = useState<NotificationType>('push')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [schedule, setSchedule] = useState<'now' | 'later'>('now')
  const [scheduledAt, setScheduledAt] = useState(DEFAULT_SCHEDULE)
  const [customPlan, setCustomPlan] = useState<'all' | 'free' | 'pro'>('all')
  const [customStatus, setCustomStatus] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all')
  const [customRegion, setCustomRegion] = useState('all')

  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState<'any' | NotificationAudience>('any')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NotificationRecord | null>(null)

  const detail = notifications.find((record) => record.id === detailId) ?? null

  const proCount = useMemo(() => users.filter((user) => user.plan === 'pro').length, [users])
  const freeCount = users.length - proCount
  const customRecipients = useMemo(
    () =>
      users.filter((user) => {
        if (customPlan !== 'all' && user.plan !== customPlan) return false
        if (customStatus !== 'all' && user.status !== customStatus) return false
        if (customRegion !== 'all' && user.region !== customRegion) return false
        return true
      }).length,
    [users, customPlan, customStatus, customRegion],
  )
  const recipients = audience === 'all' ? users.length : audience === 'pro' ? proCount : audience === 'free' ? freeCount : customRecipients

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notifications
      .filter((record) => {
        if (audienceFilter !== 'any' && record.audience !== audienceFilter) return false
        if (term && !record.title.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.sentAt.localeCompare(left.sentAt))
  }, [notifications, audienceFilter, search])

  const resetForm = () => {
    setTitle('')
    setBody('')
    setLink('')
    setAudience('all')
    setType('push')
    setSchedule('now')
    setCustomPlan('all')
    setCustomStatus('all')
    setCustomRegion('all')
  }

  const submit = () => {
    if (!title.trim()) return toast({ title: 'Sarlavhani kiriting', tone: 'warning' })
    if (!body.trim()) return toast({ title: 'Bildirishnoma matnini kiriting', tone: 'warning' })
    if (schedule === 'later' && new Date(scheduledAt) <= MOCK_NOW) {
      return toast({ title: 'Rejalashtirilgan vaqt kelajakda bo‘lishi kerak', tone: 'warning' })
    }
    sendNotification({ title: title.trim(), body: body.trim(), link: link.trim(), audience, type, recipients, scheduled: schedule === 'later' })
    toast({
      title: schedule === 'later' ? 'Bildirishnoma rejalashtirildi' : 'Bildirishnoma yuborildi',
      description: `${number(recipients)} foydalanuvchiga · ${TYPE_LABEL[type]}`,
      tone: 'success',
    })
    resetForm()
    setTab('history')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteNotification(deleteTarget.id)
    toast({ title: 'Bildirishnoma o‘chirildi', description: deleteTarget.title, tone: 'success' })
    if (detailId === deleteTarget.id) setDetailId(null)
    setDeleteTarget(null)
  }

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-brand">
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-[12px] text-ink-3" aria-label="Breadcrumb">
              <Link href="/admin" className="transition hover:text-brand">Dashboard</Link>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-ink-2">Bildirishnomalar</span>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <h1 className="h2 text-ink">Bildirishnomalar</h1>
              <Badge tone="brand">{number(notifications.length)} ta</Badge>
            </div>
          </div>
          <div role="group" aria-label="Bildirishnomalar bo‘limi" className="grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:inline-flex">
            <button type="button" aria-pressed={tab === 'send'} onClick={() => setTab('send')} className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition', tab === 'send' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}>
              <Send className="h-4 w-4" /> Yuborish
            </button>
            <button type="button" aria-pressed={tab === 'history'} onClick={() => setTab('history')} className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition', tab === 'history' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}>
              <Bell className="h-4 w-4" /> Tarix
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] tabular', tab === 'history' ? 'bg-brand-soft text-brand-text' : 'bg-white/70 text-ink-3')}>{notifications.length}</span>
            </button>
          </div>
        </div>

        {tab === 'send' ? (
          <>
            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1fr_300px]">
              <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain pb-1 [contain:paint]">
                <MobilePreview type={type} title={title} body={body} link={link} />

                <section className="card p-4">
                  <h3 className="h4 text-ink">Qabul qiluvchilar</h3>
                  <div role="group" aria-label="Auditoriya" className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(['all', 'pro', 'free', 'custom'] as NotificationAudience[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        data-audience={value}
                        aria-pressed={audience === value}
                        onClick={() => setAudience(value)}
                        className={cn('flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition', audience === value ? 'border-brand bg-brand-soft/50' : 'border-line-2 bg-white hover:border-line')}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', audience === value ? 'border-brand' : 'border-[#d1d5db]')}>
                            {audience === value ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                          </span>
                          <span className="text-[12.5px] font-semibold text-ink">{AUDIENCE_FULL[value]}</span>
                        </span>
                        <span className="text-[11.5px] tabular text-ink-3">{number(value === 'all' ? users.length : value === 'pro' ? proCount : value === 'free' ? freeCount : customRecipients)}</span>
                      </button>
                    ))}
                  </div>
                  {audience === 'custom' ? (
                    <div className="mt-3 grid gap-2 rounded-xl border border-dashed border-line bg-canvas p-3 sm:grid-cols-3">
                      <Field label="Plan">
                        <Select aria-label="Plan filtri" value={customPlan} onChange={(event) => setCustomPlan(event.target.value as typeof customPlan)} className="w-full">
                          <option value="all">Barchasi</option>
                          <option value="free">Bepul</option>
                          <option value="pro">Pro</option>
                        </Select>
                      </Field>
                      <Field label="Holat">
                        <Select aria-label="Holat filtri" value={customStatus} onChange={(event) => setCustomStatus(event.target.value as typeof customStatus)} className="w-full">
                          <option value="all">Barchasi</option>
                          <option value="active">Faol</option>
                          <option value="inactive">Nofaol</option>
                          <option value="blocked">Bloklangan</option>
                        </Select>
                      </Field>
                      <Field label="Viloyat">
                        <Select aria-label="Viloyat filtri" value={customRegion} onChange={(event) => setCustomRegion(event.target.value)} className="w-full">
                          <option value="all">Barchasi</option>
                          {REGION_NAMES.map((region) => <option key={region} value={region}>{region}</option>)}
                        </Select>
                      </Field>
                    </div>
                  ) : null}
                </section>

                <section className="card p-4">
                  <h3 className="h4 text-ink">Kanal</h3>
                  <div role="group" aria-label="Kanal" className="mt-3 grid gap-2 sm:grid-cols-3">
                    {([
                      { value: 'push', title: 'Push', hint: 'Qurilma ekraniga', icon: Smartphone },
                      { value: 'inapp', title: 'In-app', hint: 'Ilova ichida', icon: Bell },
                      { value: 'both', title: 'Ikkalasi', hint: 'Push + in-app', icon: BellRing },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-type={option.value}
                        aria-pressed={type === option.value}
                        onClick={() => setType(option.value)}
                        className={cn('flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition', type === option.value ? 'border-brand bg-brand-soft/50' : 'border-line-2 bg-white hover:border-line')}
                      >
                        <option.icon className={cn('mt-0.5 h-4 w-4 shrink-0', type === option.value ? 'text-brand' : 'text-ink-3')} />
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-semibold text-ink">{option.title}</span>
                          <span className="block text-[11px] text-ink-3">{option.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="card space-y-3 p-4">
                  <h3 className="h4 text-ink">Matn</h3>
                  <Field label={`Sarlavha (${title.length}/50)`} required>
                    <Input aria-label="Bildirishnoma sarlavhasi" value={title} onChange={(event) => setTitle(event.target.value.slice(0, 50))} maxLength={50} placeholder="Masalan: Yangi yil aksiyasi boshlandi" />
                  </Field>
                  <Field label={`Matn (${body.length}/200)`} required>
                    <Textarea aria-label="Bildirishnoma matni" value={body} onChange={(event) => setBody(event.target.value.slice(0, 200))} rows={3} maxLength={200} placeholder="Bildirishnoma matnini yozing..." />
                  </Field>
                  <Field label="Havola (ixtiyoriy)">
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
                      <Input aria-label="Bildirishnoma havolasi" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://hdp.uz/pro" className="pl-9" />
                    </div>
                  </Field>
                </section>

                <section className="card p-4">
                  <h3 className="h4 text-ink">Rejalash</h3>
                  <div role="group" aria-label="Rejalash" className="mt-3 grid gap-2 sm:grid-cols-2">
                    {([
                      { value: 'now', title: 'Hozir yuborish', hint: 'Darhol yetkaziladi' },
                      { value: 'later', title: 'Keyinroq', hint: 'Sana va vaqtni tanlang' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-schedule={option.value}
                        aria-pressed={schedule === option.value}
                        onClick={() => setSchedule(option.value)}
                        className={cn('flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition', schedule === option.value ? 'border-brand bg-brand-soft/50' : 'border-line-2 bg-white hover:border-line')}
                      >
                        <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', schedule === option.value ? 'border-brand' : 'border-[#d1d5db]')}>
                          {schedule === option.value ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                        </span>
                        <span>
                          <span className="block text-[12.5px] font-semibold text-ink">{option.title}</span>
                          <span className="block text-[11px] text-ink-3">{option.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {schedule === 'later' ? (
                    <Field label="Yuborish vaqti" required className="mt-3">
                      <Input type="datetime-local" aria-label="Yuborish vaqti" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                    </Field>
                  ) : null}
                </section>
              </div>

              <div className="hidden min-h-0 flex-col items-center gap-3 overflow-y-auto overscroll-contain pb-1 [contain:paint] lg:flex">
                <PhonePreview type={type} title={title} body={body} link={link} />
              </div>
            </div>

            <div className="card flex shrink-0 flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <Users className="h-4 w-4" />
                <span data-recipients={recipients} className="font-display text-[16px] font-extrabold text-ink tabular">{number(recipients)}</span>
                kishi
              </span>
              <Badge tone="gray">{AUDIENCE_LABEL[audience]}</Badge>
              <Badge tone={TYPE_TONE[type]}>{TYPE_LABEL[type]}</Badge>
              <span className="hidden text-[12px] text-ink-3 sm:inline">{schedule === 'now' ? 'Hozir' : dateTime(scheduledAt)}</span>
              <Button aria-label="Bildirishnomani yuborish" onClick={submit} className="ml-auto">
                <Send className="h-4 w-4" /> {schedule === 'later' ? 'Rejalashtirish' : 'Yuborish'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="card shrink-0 space-y-2 p-3">
              <div className="flex items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Sarlavha bo‘yicha qidirish..." className="min-w-0 flex-1" />
              </div>
              <div role="group" aria-label="Auditoriya bo‘yicha filtr" className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
                {(['any', 'all', 'pro', 'free', 'custom'] as Array<'any' | NotificationAudience>).map((value) => (
                  <button
                    key={value}
                    type="button"
                    data-audience={value}
                    aria-pressed={audienceFilter === value}
                    onClick={() => setAudienceFilter(value)}
                    className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition', audienceFilter === value ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}
                  >
                    {value === 'any' ? 'Barchasi' : AUDIENCE_LABEL[value]}
                    <span className="text-[11px] tabular opacity-70">{value === 'any' ? notifications.length : notifications.filter((record) => record.audience === value).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
              {filteredHistory.length === 0 ? (
                <div className="card">
                  <EmptyState icon={<Bell className="h-6 w-6" />} title="Bildirishnoma topilmadi" text="Filtrlarni o‘zgartiring yoki yangi xabar yuboring." action={<Button onClick={() => setTab('send')}><Send className="h-4 w-4" /> Yuborish</Button>} />
                </div>
              ) : (
                <ul className="space-y-2 pb-1">
                  {filteredHistory.map((record) => (
                    <li key={record.id} data-notif-row data-audience={record.audience} className="card card-hover flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-4">
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', record.type === 'push' ? 'bg-info-bg text-info' : record.type === 'inapp' ? 'bg-[#ede9fe] text-[#6d28d9]' : 'bg-brand-soft text-brand')}>
                        {record.type === 'push' ? <Smartphone className="h-5 w-5" /> : record.type === 'inapp' ? <Bell className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
                      </span>
                      <button type="button" data-notif-open onClick={() => setDetailId(record.id)} className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <p data-notif-title className="truncate text-[13.5px] font-semibold text-ink">{record.title}</p>
                          {record.scheduled ? <Badge tone="info">Rejalashtirilgan</Badge> : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-3">{record.body}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-ink-3">
                          <span>{dateTime(record.sentAt)}</span>
                          <Badge tone="gray">{AUDIENCE_LABEL[record.audience]}</Badge>
                          <Badge tone={TYPE_TONE[record.type]}>{TYPE_LABEL[record.type]}</Badge>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-4 sm:w-[220px]">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-[11px] text-ink-3">
                            <span>O‘qildi</span>
                            <span className="font-semibold text-ink tabular">{percent(readRate(record), 1)}</span>
                          </div>
                          <div className="mt-1"><ProgressBar value={readRate(record)} /></div>
                          <p className="mt-1 text-[11px] text-ink-3 tabular">{number(record.read)} / {number(record.recipients)}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <IconButton label={`${record.title} bildirishnomasini o‘chirish`} onClick={() => setDeleteTarget(record)}>
                            <Trash2 className="h-4 w-4 text-error" />
                          </IconButton>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between text-[12px] text-ink-3">
              <span>Topildi: <span className="font-semibold text-ink">{filteredHistory.length}</span> · Jami: <span className="font-semibold text-ink">{notifications.length}</span></span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Yetkazilgan xabarlar</span>
            </div>
          </>
        )}
      </div>

      <Modal
        open={detail !== null}
        onClose={() => setDetailId(null)}
        title={detail?.title ?? 'Bildirishnoma'}
        description={detail ? dateTime(detail.sentAt) : undefined}
        size="lg"
        footer={
          detail ? (
            <>
              <Button variant="ghost" onClick={() => setDetailId(null)} className="mr-auto">Yopish</Button>
              <IconButton label="Bildirishnomani o‘chirish" onClick={() => setDeleteTarget(detail)} className="text-error">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="grid gap-5 md:grid-cols-[1fr_240px]">
            <div className="space-y-4">
              <div className="rounded-xl border border-line-2 bg-canvas p-4">
                <p className="text-[13.5px] font-semibold text-ink">{detail.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{detail.body}</p>
                {detail.link ? <p className="mt-2 truncate text-[11.5px] text-brand-text">{detail.link}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="brand">{AUDIENCE_FULL[detail.audience]}</Badge>
                <Badge tone={TYPE_TONE[detail.type]}>{TYPE_LABEL[detail.type]}</Badge>
                {detail.scheduled ? <Badge tone="info">Rejalashtirilgan</Badge> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line-2 p-3.5">
                  <div className="flex items-center justify-between text-[12px] text-ink-3"><span>Qabul qildi</span><Users className="h-3.5 w-3.5" /></div>
                  <p className="mt-1 font-display text-[22px] font-extrabold text-ink tabular">{number(detail.recipients)}</p>
                </div>
                <div className="rounded-xl border border-line-2 p-3.5">
                  <div className="flex items-center justify-between text-[12px] text-ink-3"><span>O‘qidi</span><Eye className="h-3.5 w-3.5" /></div>
                  <p className="mt-1 font-display text-[22px] font-extrabold text-ink tabular">{number(detail.read)}</p>
                  <div className="mt-2"><ProgressBar value={readRate(detail)} /></div>
                </div>
                <div className="rounded-xl border border-line-2 p-3.5">
                  <div className="flex items-center justify-between text-[12px] text-ink-3"><span>Bosdi</span><MousePointerClick className="h-3.5 w-3.5" /></div>
                  <p className="mt-1 font-display text-[22px] font-extrabold text-ink tabular">{number(detail.clicked)}</p>
                  <div className="mt-2"><ProgressBar value={clickRate(detail)} tone="info" /></div>
                </div>
                <div className="rounded-xl border border-line-2 p-3.5">
                  <div className="flex items-center justify-between text-[12px] text-ink-3"><span>O‘qish darajasi</span><Check className="h-3.5 w-3.5" /></div>
                  <p className="mt-1 font-display text-[22px] font-extrabold text-ink tabular">{percent(readRate(detail), 1)}</p>
                  <p className="mt-1 text-[11px] text-ink-3">O‘qiganlar / qabul qilganlar</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <PhonePreview type={detail.type} title={detail.title} body={detail.body} link={detail.link} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Bildirishnomani o‘chirish"
        description={deleteTarget?.title}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> O‘chirish</Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">Tarixdan <b>{deleteTarget?.title}</b> yozuvi o‘chiriladi. Foydalanuvchilar allaqachon olgan xabarlarga ta’sir qilmaydi.</p>
      </Modal>
    </PageTransition>
  )
}