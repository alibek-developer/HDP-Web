'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  BellRing,
  Check,
  Clock,
  Eye,
  Link2,
  Megaphone,
  MousePointerClick,
  PencilLine,
  Play,
  Plus,
  Send,
  Smartphone,
  Trash2,
  Users,
  Zap,
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
  Switch,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { MOCK_NOW, dateTime, number, percent, relative } from '@/lib/format'
import { REGION_NAMES } from '@/lib/mock'
import type {
  AutomationTrigger,
  NotificationAudience,
  NotificationAutomation,
  NotificationRecord,
  NotificationType,
} from '@/lib/types'

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

const TRIGGERS: Record<AutomationTrigger, { label: string; hint: string; tone: 'success' | 'warning' | 'gray' | 'brand' | 'danger' }> = {
  signup: { label: "Ro'yxatdan o'tish", hint: "Yangi foydalanuvchi qo'shilganda darhol yoki N soatdan keyin", tone: 'success' },
  plan_expiring: { label: 'Obuna tugashi', hint: 'Pro obuna tugashiga N soat qolganda', tone: 'warning' },
  inactive: { label: 'Nofaollik', hint: 'N soat davomida tizimga kirmaganlarga', tone: 'gray' },
  streak: { label: 'Streak', hint: 'Faol kunlik seriyasi bor foydalanuvchilarga', tone: 'brand' },
  payment_failed: { label: "To'lov xatosi", hint: "Bekor qilingan to'lovdan keyin", tone: 'danger' },
}

interface AutomationDraft {
  id: string | null
  name: string
  trigger: AutomationTrigger
  audience: NotificationAudience
  type: NotificationType
  delayHours: number
  enabled: boolean
  title: string
  body: string
  link: string
  lastRunAt?: string
  sent: number
}

const EMPTY_AUTOMATION: AutomationDraft = {
  id: null,
  name: '',
  trigger: 'signup',
  audience: 'all',
  type: 'inapp',
  delayHours: 0,
  enabled: true,
  title: '',
  body: '',
  link: '',
  sent: 0,
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
  const automations = useAppStore((state) => state.automations)
  const sendNotification = useAppStore((state) => state.sendNotification)
  const updateNotification = useAppStore((state) => state.updateNotification)
  const deleteNotification = useAppStore((state) => state.deleteNotification)
  const upsertAutomation = useAppStore((state) => state.upsertAutomation)
  const deleteAutomation = useAppStore((state) => state.deleteAutomation)
  const toggleAutomation = useAppStore((state) => state.toggleAutomation)
  const runAutomation = useAppStore((state) => state.runAutomation)
  const { toast } = useToast()

  const [tab, setTab] = useState<'send' | 'history' | 'automations'>('send')
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
  const [editingId, setEditingId] = useState<string | null>(null)

  const [automationDraft, setAutomationDraft] = useState<AutomationDraft>(EMPTY_AUTOMATION)
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [automationDelete, setAutomationDelete] = useState<NotificationAutomation | null>(null)

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
    setEditingId(null)
  }

  const toInputValue = (iso?: string) => {
    if (!iso) return DEFAULT_SCHEDULE()
    const value = new Date(iso)
    if (Number.isNaN(value.getTime())) return DEFAULT_SCHEDULE()
    const pad = (part: number) => String(part).padStart(2, '0')
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
  }

  const startEdit = (record: NotificationRecord) => {
    if (!record.scheduled) return
    setEditingId(record.id)
    setTitle(record.title)
    setBody(record.body)
    setLink(record.link)
    setAudience(record.audience)
    setType(record.type)
    setSchedule('later')
    setScheduledAt(toInputValue(record.scheduledAt))
    setCustomPlan('all')
    setCustomStatus('all')
    setCustomRegion('all')
    setDetailId(null)
    setTab('send')
  }

  const submit = () => {
    if (!title.trim()) return toast({ title: 'Sarlavhani kiriting', tone: 'warning' })
    if (!body.trim()) return toast({ title: 'Bildirishnoma matnini kiriting', tone: 'warning' })
    if (schedule === 'later' && new Date(scheduledAt) <= MOCK_NOW) {
      return toast({ title: 'Rejalashtirilgan vaqt kelajakda bo‘lishi kerak', tone: 'warning' })
    }
    const payload = {
      title: title.trim(),
      body: body.trim(),
      link: link.trim(),
      audience,
      type,
      recipients,
      scheduled: schedule === 'later',
      scheduledAt: schedule === 'later' ? new Date(scheduledAt).toISOString() : undefined,
    }
    if (editingId) {
      updateNotification(
        editingId,
        schedule === 'later' ? payload : { ...payload, sentAt: new Date().toISOString() },
      )
      toast({
        title: schedule === 'later' ? 'Reja yangilandi' : 'Bildirishnoma yuborildi',
        description: `${number(recipients)} foydalanuvchiga · ${TYPE_LABEL[type]}`,
        tone: 'success',
      })
      resetForm()
      setTab('history')
      return
    }
    sendNotification(payload)
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

  const enabledCount = automations.filter((rule) => rule.enabled).length
  const totalAutomated = automations.reduce((sum, rule) => sum + rule.sent, 0)
  const lastAutomationAt = automations.reduce<string | undefined>((latest, rule) => {
    if (!rule.lastRunAt) return latest
    return !latest || rule.lastRunAt > latest ? rule.lastRunAt : latest
  }, undefined)

  const openAutomation = (rule?: NotificationAutomation) => {
    setAutomationDraft(rule ? { ...rule } : { ...EMPTY_AUTOMATION })
    setAutomationModalOpen(true)
  }

  const saveAutomation = () => {
    const name = automationDraft.name.trim()
    const autoTitle = automationDraft.title.trim()
    const autoBody = automationDraft.body.trim()
    if (!name) return toast({ title: 'Qoida nomini kiriting', tone: 'warning' })
    if (!autoTitle) return toast({ title: 'Xabar sarlavhasini kiriting', tone: 'warning' })
    if (!autoBody) return toast({ title: 'Xabar matnini kiriting', tone: 'warning' })
    if (!Number.isFinite(automationDraft.delayHours) || automationDraft.delayHours < 0) {
      return toast({ title: 'Kechikish soati noto‘g‘ri', description: '0 yoki undan katta butun son kiriting', tone: 'warning' })
    }
    const automation: NotificationAutomation = {
      id: automationDraft.id ?? `auto-${Date.now().toString(36)}`,
      name,
      trigger: automationDraft.trigger,
      audience: automationDraft.audience,
      type: automationDraft.type,
      delayHours: Math.round(automationDraft.delayHours),
      enabled: automationDraft.enabled,
      title: autoTitle,
      body: autoBody,
      link: automationDraft.link.trim(),
      lastRunAt: automationDraft.lastRunAt,
      sent: automationDraft.sent,
    }
    upsertAutomation(automation)
    setAutomationModalOpen(false)
    toast({
      title: automationDraft.id ? 'Qoida yangilandi' : 'Avtomatik qoida qo‘shildi',
      description: `${name} · ${TRIGGERS[automation.trigger].label}`,
      tone: 'success',
    })
  }

  const removeAutomation = () => {
    if (!automationDelete) return
    deleteAutomation(automationDelete.id)
    toast({ title: 'Qoida o‘chirildi', description: automationDelete.name, tone: 'success' })
    setAutomationDelete(null)
  }

  const runNow = (rule: NotificationAutomation) => {
    const count = runAutomation(rule.id)
    toast({
      title: count ? 'Qoida ishga tushirildi' : 'Mos foydalanuvchi topilmadi',
      description: count ? `${rule.name} · ${number(count)} qabul qiluvchi` : 'Shartlarga mos foydalanuvchi yo‘q, xabar yuborilmadi',
      tone: count ? 'success' : 'warning',
    })
  }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3  [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-brand">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="h2 truncate text-ink">Bildirishnomalar</h1>
            <Badge tone="brand">{number(notifications.length)} ta</Badge>
            {enabledCount ? <Badge tone="success">{enabledCount} avtomatik</Badge> : null}
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Bildirishnomalar bo‘limi" className="grid shrink-0 grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              <button type="button" aria-pressed={tab === 'send'} onClick={() => setTab('send')} className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition', tab === 'send' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}>
                <Send className="h-3.5 w-3.5" /> Yuborish
              </button>
              <button type="button" aria-pressed={tab === 'history'} onClick={() => setTab('history')} className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition', tab === 'history' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}>
                <Bell className="h-3.5 w-3.5" /> Tarix
                <span className={cn('rounded-full px-1.5 text-[10.5px] tabular', tab === 'history' ? 'bg-brand-soft text-brand-text' : 'bg-white/70 text-ink-3')}>{notifications.length}</span>
              </button>
              <button type="button" aria-pressed={tab === 'automations'} onClick={() => setTab('automations')} className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition', tab === 'automations' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}>
                <Zap className="h-3.5 w-3.5" /> Avtomatik
              </button>
            </div>
            {tab === 'automations' ? (
              <Button size="sm" onClick={() => openAutomation()}>
                <Plus className="h-4 w-4" /> Qoida
              </Button>
            ) : null}
          </div>
        </div>

        {tab === 'send' ? (
          <>
            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1fr_300px]">
              <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain pb-1 [contain:paint]">
                <MobilePreview type={type} title={title} body={body} link={link} />

                {editingId ? (
                  <div className="card flex flex-wrap items-center gap-2 border-brand/40 bg-brand-soft/40 p-3">
                    <PencilLine className="h-4 w-4 text-brand" />
                    <span className="text-[12.5px] font-semibold text-ink">Rejalashtirilgan xabar tahrirlanmoqda</span>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={resetForm}>
                      Bekor qilish
                    </Button>
                  </div>
                ) : null}

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
                      <Field label="Tuman">
                        <Select aria-label="Tuman filtri" value={customRegion} onChange={(event) => setCustomRegion(event.target.value)} className="w-full">
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
                <Send className="h-4 w-4" /> {editingId ? 'Rejani saqlash' : schedule === 'later' ? 'Rejalashtirish' : 'Yuborish'}
              </Button>
            </div>
          </>
        ) : tab === 'automations' ? (
          <>
            <div className="grid shrink-0 grid-cols-3 divide-x divide-line-2 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              {[
                { label: 'Faol qoidalar', value: `${enabledCount}/${automations.length}`, foot: 'Yoqilgan avtomatik qoidalar' },
                { label: 'Yuborilgan', value: number(totalAutomated), foot: 'Barcha avtomatik xabarlar' },
                { label: 'Oxirgi ishga tushish', value: lastAutomationAt ? relative(lastAutomationAt) : '—', foot: 'Eng so‘nggi avtomatik yuborish' },
              ].map((cell) => (
                <div key={cell.label} className="min-w-0 px-2.5 py-2 sm:px-4 sm:py-2.5">
                  <p className="truncate text-[11px] font-medium text-ink-3 sm:text-xs">{cell.label}</p>
                  <p className="mt-1 truncate font-display text-[19px] leading-none text-ink tabular sm:text-[22px]">{cell.value}</p>
                  <p className="mt-1 hidden truncate text-[11px] text-ink-3 sm:block">{cell.foot}</p>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
              {automations.length === 0 ? (
                <div className="card">
                  <EmptyState
                    icon={<Zap className="h-6 w-6" />}
                    title="Avtomatik qoida yo‘q"
                    text="Ro‘yxatdan o‘tish, obuna tugashi yoki nofaollik kabi hodisalarga avtomatik xabar sozlang."
                    action={<Button onClick={() => openAutomation()}><Plus className="h-4 w-4" /> Qoida qo‘shish</Button>}
                  />
                </div>
              ) : (
                <ul className="space-y-2 pb-1">
                  {automations.map((rule) => (
                    <li key={rule.id} data-automation-row className="card flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:gap-3">
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', rule.enabled ? 'bg-brand-soft text-brand' : 'bg-muted text-ink-3')}>
                        <Zap className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-[13px] font-semibold text-ink">{rule.name}</p>
                          <Badge tone={TRIGGERS[rule.trigger].tone}>{TRIGGERS[rule.trigger].label}</Badge>
                          <Badge tone="gray">{rule.delayHours > 0 ? `${rule.delayHours} soat` : 'Darhol'}</Badge>
                          {!rule.enabled ? <Badge tone="gray">O‘chirilgan</Badge> : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11.5px] text-ink-3">{rule.title} — {rule.body}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-3">
                          <span>{AUDIENCE_LABEL[rule.audience]}</span>
                          <span>{TYPE_LABEL[rule.type]}</span>
                          <span>Yuborilgan: <span className="font-semibold text-ink tabular">{number(rule.sent)}</span></span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rule.lastRunAt ? `Oxirgi: ${relative(rule.lastRunAt)}` : 'Hali ishlamagan'}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Switch
                          checked={rule.enabled}
                          onChange={() => {
                            toggleAutomation(rule.id)
                            toast({ title: rule.enabled ? 'Qoida o‘chirildi' : 'Qoida yoqildi', description: rule.name, tone: 'success' })
                          }}
                          label={`${rule.name} faolligi`}
                          size="sm"
                        />
                        <IconButton label={`${rule.name} ni hozir ishga tushirish`} onClick={() => runNow(rule)} disabled={!rule.enabled}>
                          <Play className="h-4 w-4 text-success" />
                        </IconButton>
                        <IconButton label={`${rule.name} ni tahrirlash`} onClick={() => openAutomation(rule)}>
                          <PencilLine className="h-4 w-4 text-ink-3" />
                        </IconButton>
                        <IconButton label={`${rule.name} ni o‘chirish`} onClick={() => setAutomationDelete(rule)}>
                          <Trash2 className="h-4 w-4 text-error" />
                        </IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
              <span><span className="font-semibold text-ink">{automations.length}</span> ta qoida</span>
              <span>·</span>
              <span>{enabledCount} ta faol</span>
              <span className="ml-auto inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-brand" /> Hodisalar bo‘yicha avtomatik yuborish</span>
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
                          <span>
                            {record.scheduled && record.scheduledAt
                              ? `${dateTime(record.scheduledAt)} ga rejalashtirilgan`
                              : dateTime(record.sentAt)}
                          </span>
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
                          {record.scheduled ? (
                            <IconButton label={`${record.title} rejasini tahrirlash`} onClick={() => startEdit(record)}>
                              <PencilLine className="h-4 w-4 text-ink-3" />
                            </IconButton>
                          ) : null}
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
        description={
          detail
            ? detail.scheduled && detail.scheduledAt
              ? `${dateTime(detail.scheduledAt)} ga rejalashtirilgan`
              : dateTime(detail.sentAt)
            : undefined
        }
        size="lg"
        footer={
          detail ? (
            <>
              <Button variant="ghost" onClick={() => setDetailId(null)} className="mr-auto">Yopish</Button>
              {detail.scheduled ? (
                <Button variant="secondary" size="sm" onClick={() => startEdit(detail)}>
                  <PencilLine className="h-4 w-4" /> Tahrirlash
                </Button>
              ) : null}
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

      <Modal
        open={automationModalOpen}
        onClose={() => setAutomationModalOpen(false)}
        title={automationDraft.id ? 'Qoidani tahrirlash' : 'Avtomatik qoida'}
        description={TRIGGERS[automationDraft.trigger].hint}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAutomationModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={saveAutomation}>
              <Check className="h-4 w-4" /> {automationDraft.id ? 'Saqlash' : 'Qo‘shish'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Qoida nomi" required className="sm:col-span-2">
            <Input
              aria-label="Qoida nomi"
              value={automationDraft.name}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, name: event.target.value }))}
              placeholder="Masalan: Obuna tugash eslatmasi"
            />
          </Field>
          <Field label="Hodisa">
            <Select
              aria-label="Hodisa"
              value={automationDraft.trigger}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, trigger: event.target.value as AutomationTrigger }))}
              className="w-full"
            >
              {(Object.keys(TRIGGERS) as AutomationTrigger[]).map((trigger) => (
                <option key={trigger} value={trigger}>{TRIGGERS[trigger].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kechikish (soat)">
            <Input
              type="number"
              min={0}
              max={720}
              aria-label="Kechikish soati"
              value={automationDraft.delayHours}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, delayHours: Number(event.target.value) }))}
            />
          </Field>
          <Field label="Auditoriya">
            <Select
              aria-label="Auditoriya"
              value={automationDraft.audience}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, audience: event.target.value as NotificationAudience }))}
              className="w-full"
            >
              {(Object.keys(AUDIENCE_FULL) as NotificationAudience[]).map((value) => (
                <option key={value} value={value}>{AUDIENCE_FULL[value]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kanal">
            <Select
              aria-label="Kanal"
              value={automationDraft.type}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, type: event.target.value as NotificationType }))}
              className="w-full"
            >
              {(Object.keys(TYPE_LABEL) as NotificationType[]).map((value) => (
                <option key={value} value={value}>{TYPE_LABEL[value]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Xabar sarlavhasi" required className="sm:col-span-2">
            <Input
              aria-label="Xabar sarlavhasi"
              value={automationDraft.title}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, title: event.target.value.slice(0, 50) }))}
              maxLength={50}
              placeholder="Masalan: Pro obunangiz tugamoqda"
            />
          </Field>
          <Field label="Xabar matni" required className="sm:col-span-2">
            <Textarea
              aria-label="Xabar matni"
              value={automationDraft.body}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, body: event.target.value.slice(0, 200) }))}
              rows={3}
              maxLength={200}
              placeholder="Avtomatik yuboriladigan xabar matni"
            />
          </Field>
          <Field label="Havola (ixtiyoriy)" className="sm:col-span-2">
            <Input
              aria-label="Xabar havolasi"
              value={automationDraft.link}
              onChange={(event) => setAutomationDraft((draft) => ({ ...draft, link: event.target.value }))}
              placeholder="https://hdp.uz/subscription"
            />
          </Field>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line-2 px-3.5 py-2.5 sm:col-span-2">
            <div>
              <p className="text-[12.5px] font-semibold text-ink">Qoida faol</p>
              <p className="text-[11px] text-ink-3">O‘chirilgan qoida avtomatik ishlamaydi.</p>
            </div>
            <Switch
              checked={automationDraft.enabled}
              onChange={(checked) => setAutomationDraft((draft) => ({ ...draft, enabled: checked }))}
              label="Qoida faolligi"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={automationDelete !== null}
        onClose={() => setAutomationDelete(null)}
        title="Qoidani o‘chirish"
        description={automationDelete?.name}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAutomationDelete(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={removeAutomation}><Trash2 className="h-4 w-4" /> O‘chirish</Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2"><b>{automationDelete?.name}</b> qoidasi o‘chiriladi. Allaqachon yuborilgan xabarlar tarixda qoladi.</p>
      </Modal>
    </PageTransition>
  )
}