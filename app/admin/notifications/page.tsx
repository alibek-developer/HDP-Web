'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  BellRing,
  Check,
  Eye,
  Link2,
  Megaphone,
  Send,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  SearchInput,
  Segmented,
  Select,
  Tabs,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, number, percent } from '@/lib/format'
import { REGION_NAMES } from '@/lib/mock'
import type { NotificationAudience, NotificationRecord, NotificationType } from '@/lib/types'

const AUDIENCE_LABEL: Record<NotificationAudience, string> = {
  all: 'Hamma foydalanuvchilar',
  pro: 'Faqat Pro',
  free: 'Faqat bepul',
  custom: 'Maxsus (filter bo‘yicha)',
}

const TYPE_LABEL: Record<NotificationType, string> = {
  push: 'Push notification',
  inapp: 'In-app banner',
  both: 'Ikkalasi ham',
}

const TYPE_TONE: Record<NotificationType, 'info' | 'violet' | 'brand'> = {
  push: 'info',
  inapp: 'violet',
  both: 'brand',
}

const DEFAULT_SCHEDULE = () => {
  const next = new Date('2026-11-08T09:00:00+05:00')
  next.setHours(next.getHours() + 2)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}T${String(next.getHours()).padStart(2, '0')}:00`
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
  const [detail, setDetail] = useState<NotificationRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NotificationRecord | null>(null)

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

  const recipients =
    audience === 'all' ? users.length : audience === 'pro' ? proCount : audience === 'free' ? freeCount : customRecipients

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notifications
      .filter((notification) => {
        if (audienceFilter !== 'any' && notification.audience !== audienceFilter) return false
        if (term && !notification.title.toLowerCase().includes(term)) return false
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
    if (title.length > 50) return toast({ title: 'Sarlavha 50 belgidan oshmasligi kerak', tone: 'warning' })
    if (body.length > 200) return toast({ title: 'Matn 200 belgidan oshmasligi kerak', tone: 'warning' })
    if (schedule === 'later' && new Date(scheduledAt) <= new Date('2026-11-08T09:00:00+05:00')) {
      return toast({ title: 'Rejalashtirilgan vaqt kelajakda bo‘lishi kerak', tone: 'warning' })
    }

    sendNotification({
      title: title.trim(),
      body: body.trim(),
      link: link.trim(),
      audience,
      type,
      recipients,
      scheduled: schedule === 'later',
    })

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
    setDeleteTarget(null)
    setDetail(null)
  }

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Bildirishnomalar <Badge tone="brand">{notifications.length} ta</Badge>
          </span>
        }
        subtitle="Push va in-app xabarlarni yuboring, tarix va statistikani kuzating"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Bildirishnomalar' }]}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'send', label: 'Yuborish' },
          { value: 'history', label: 'Tarix', count: notifications.length },
        ]}
        className="mb-5"
      />

      {tab === 'send' ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="card p-0">
              <header className="border-b border-line-2 px-5 py-4">
                <h3 className="h4 text-ink">Qabul qiluvchilar</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Xabar kimlarga yuborilishini tanlang</p>
              </header>
              <div className="space-y-2.5 p-5">
                {(
                  [
                    { value: 'all', title: 'Hamma foydalanuvchilar', count: users.length },
                    { value: 'pro', title: 'Faqat Pro', count: proCount },
                    { value: 'free', title: 'Faqat bepul', count: freeCount },
                    { value: 'custom', title: 'Maxsus (filter bo‘yicha)', count: customRecipients },
                  ] as Array<{ value: NotificationAudience; title: string; count: number }>
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAudience(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition',
                      audience === option.value ? 'border-brand bg-brand-soft/40' : 'border-line-2 bg-white hover:border-line',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', audience === option.value ? 'border-brand' : 'border-[#d1d5db]')}>
                        {audience === option.value ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                      </span>
                      <span className="text-[13px] font-semibold text-ink">{option.title}</span>
                    </span>
                    <span className="text-[12px] tabular text-ink-3">{number(option.count)} kishi</span>
                  </button>
                ))}

                {audience === 'custom' ? (
                  <div className="grid gap-3 rounded-xl border border-dashed border-line bg-canvas p-3 sm:grid-cols-3">
                    <Field label="Plan">
                      <Select value={customPlan} onChange={(event) => setCustomPlan(event.target.value as typeof customPlan)}>
                        <option value="all">Barchasi</option>
                        <option value="free">Bepul</option>
                        <option value="pro">Pro</option>
                      </Select>
                    </Field>
                    <Field label="Holat">
                      <Select value={customStatus} onChange={(event) => setCustomStatus(event.target.value as typeof customStatus)}>
                        <option value="all">Barchasi</option>
                        <option value="active">Faol</option>
                        <option value="inactive">Nofaol</option>
                        <option value="blocked">Bloklangan</option>
                      </Select>
                    </Field>
                    <Field label="Viloyat">
                      <Select value={customRegion} onChange={(event) => setCustomRegion(event.target.value)}>
                        <option value="all">Barchasi</option>
                        {REGION_NAMES.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="card p-0">
              <header className="border-b border-line-2 px-5 py-4">
                <h3 className="h4 text-ink">Bildirishnoma turi</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Yetkazib berish kanalini tanlang</p>
              </header>
              <div className="grid gap-2.5 p-5 sm:grid-cols-3">
                {(
                  [
                    { value: 'push', title: 'Push notification', hint: 'Qurilma ekraniga', icon: Smartphone },
                    { value: 'inapp', title: 'In-app banner', hint: 'Ilova ichida', icon: Bell },
                    { value: 'both', title: 'Ikkalasi ham', hint: 'Push + in-app', icon: BellRing },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition',
                      type === option.value ? 'border-brand bg-brand-soft/40' : 'border-line-2 bg-white hover:border-line',
                    )}
                  >
                    <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', type === option.value ? 'border-brand' : 'border-[#d1d5db]')}>
                      {type === option.value ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><option.icon className="h-3.5 w-3.5" /> {option.title}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-3">{option.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card p-0">
              <header className="border-b border-line-2 px-5 py-4">
                <h3 className="h4 text-ink">Matn</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Qisqa va aniq bo'ling</p>
              </header>
              <div className="space-y-4 p-5">
                <Field
                  label={`Sarlavha (${title.length}/50)`}
                  required
                  error={title.length > 50 ? '50 belgidan oshdi' : undefined}
                >
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value.slice(0, 50))}
                    maxLength={50}
                    placeholder="Masalan: Yangi yil aksiyasi boshlandi"
                  />
                </Field>
                <Field
                  label={`Matn (${body.length}/200)`}
                  required
                  error={body.length > 200 ? '200 belgidan oshdi' : undefined}
                >
                  <Textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value.slice(0, 200))}
                    rows={4}
                    maxLength={200}
                    placeholder="Bildirishnoma matnini yozing..."
                  />
                </Field>
                <Field label="Havola (ixtiyoriy)" hint="Foydalanuvchi bosganda ochiladigan manzil">
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
                    <Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://hdp.uz/pro" className="pl-9" />
                  </div>
                </Field>
              </div>
            </section>

            <section className="card p-0">
              <header className="border-b border-line-2 px-5 py-4">
                <h3 className="h4 text-ink">Rejalash</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Hoziroq yoki belgilangan vaqtda yuboring</p>
              </header>
              <div className="space-y-3 p-5">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      { value: 'now', title: 'Hozir yuborish', hint: 'Darhol yetkaziladi' },
                      { value: 'later', title: 'Keyinroq', hint: 'Sana va vaqtni tanlang' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSchedule(option.value)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition',
                        schedule === option.value ? 'border-brand bg-brand-soft/40' : 'border-line-2 bg-white hover:border-line',
                      )}
                    >
                      <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', schedule === option.value ? 'border-brand' : 'border-[#d1d5db]')}>
                        {schedule === option.value ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                      </span>
                      <span>
                        <span className="block text-[12.5px] font-semibold text-ink">{option.title}</span>
                        <span className="text-[11px] text-ink-3">{option.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {schedule === 'later' ? (
                  <Field label="Yuborish vaqti" required>
                    <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                  </Field>
                ) : null}
              </div>
            </section>
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className="card">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Preview</p>
              <div className="mt-3 rounded-2xl border border-line-2 bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#16a34a] p-3.5 text-white shadow-brand">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-white/90">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-white/15"><BellRing className="h-3.5 w-3.5" /></span>
                  HDP Matematika
                  <span className="ml-auto text-[10px] font-medium text-white/70">hozir</span>
                </div>
                <p className="mt-3 text-[14px] font-bold leading-snug">{title || 'Sarlavha shu yerda ko‘rinadi'}</p>
                <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-white/85">{body || 'Bildirishnoma matni. Qisqa va tushunarli bo‘lishi tavsiya etiladi.'}</p>
                {link ? <p className="mt-2 truncate text-[10.5px] text-white/60">{link}</p> : null}
              </div>
            </section>

            <section className="card space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink-3">Qabul qiluvchilar</span>
                <span className="font-semibold text-ink">{number(recipients)} kishi</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink-3">Auditoriya</span>
                <span className="font-semibold text-ink">{AUDIENCE_LABEL[audience]}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink-3">Turi</span>
                <Badge tone={TYPE_TONE[type]}>{TYPE_LABEL[type]}</Badge>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink-3">Vaqt</span>
                <span className="font-semibold text-ink">{schedule === 'now' ? 'Hozir' : dateTime(scheduledAt)}</span>
              </div>
              <Button className="w-full" onClick={submit} disabled={!title.trim() || !body.trim()}>
                <Send className="h-4 w-4" /> {schedule === 'later' ? 'Rejalashtirish' : 'Yuborish'}
              </Button>
            </section>
          </div>
        </div>
      ) : (
        <div className="card p-0">
          <div className="flex flex-col gap-3 border-b border-line-2 p-4 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Sarlavha bo'yicha qidirish..." className="sm:max-w-xs" />
            <div className="overflow-x-auto no-scrollbar">
              <Segmented
                value={audienceFilter}
                onChange={setAudienceFilter}
                options={[
                  { value: 'any', label: 'Barchasi', count: notifications.length },
                  { value: 'all', label: 'Hamma', count: notifications.filter((item) => item.audience === 'all').length },
                  { value: 'pro', label: 'Pro', count: notifications.filter((item) => item.audience === 'pro').length },
                  { value: 'free', label: 'Bepul', count: notifications.filter((item) => item.audience === 'free').length },
                  { value: 'custom', label: 'Maxsus', count: notifications.filter((item) => item.audience === 'custom').length },
                ]}
              />
            </div>
            <span className="text-[12px] text-ink-3 sm:ml-auto">Jami {number(notifications.length)} ta yuborilgan</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Bell className="h-6 w-6" />} title="Bildirishnoma yo'q" text="Yuborilgan xabarlar tarixi shu yerda ko'rinadi." action={<Button onClick={() => setTab('send')}><Send className="h-4 w-4" /> Yuborish</Button>} />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[840px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                      <th className="px-4 py-3 font-semibold">Sana</th>
                      <th className="px-4 py-3 font-semibold">Sarlavha</th>
                      <th className="px-4 py-3 font-semibold">Qabul qildi</th>
                      <th className="px-4 py-3 font-semibold">O'qidi</th>
                      <th className="px-4 py-3 font-semibold">O'qish %</th>
                      <th className="px-4 py-3 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {filteredHistory.map((notification) => {
                      const readRate = notification.recipients ? (notification.read / notification.recipients) * 100 : 0
                      return (
                        <tr key={notification.id} className="cursor-pointer transition hover:bg-canvas" onClick={() => setDetail(notification)}>
                          <td className="px-4 py-3 text-ink-3">
                            {dateTime(notification.sentAt)}
                            {notification.scheduled ? <Badge tone="info" className="ml-2">Rejalashtirilgan</Badge> : null}
                          </td>
                          <td className="max-w-[260px] px-4 py-3">
                            <p className="truncate font-semibold text-ink">{notification.title}</p>
                            <p className="truncate text-[11.5px] text-ink-3">{notification.body}</p>
                          </td>
                          <td className="px-4 py-3 tabular text-ink-2">{number(notification.recipients)}</td>
                          <td className="px-4 py-3 tabular text-ink-2">{number(notification.read)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16"><ProgressBar value={readRate} /></div>
                              <span className="text-[12px] font-semibold tabular text-ink">{percent(readRate, 1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); setDetail(notification) }}><Eye className="h-3.5 w-3.5" /> Ko'rish</Button>
                              <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setDeleteTarget(notification) }} aria-label="O'chirish"><Trash2 className="h-3.5 w-3.5 text-error" /></Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line-2 md:hidden">
                {filteredHistory.map((notification) => {
                  const readRate = notification.recipients ? (notification.read / notification.recipients) * 100 : 0
                  return (
                    <li key={notification.id} className="space-y-2.5 p-4">
                      <button type="button" className="w-full text-left" onClick={() => setDetail(notification)}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink">{notification.title}</p>
                          <Badge tone={TYPE_TONE[notification.type]}>{TYPE_LABEL[notification.type]}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11.5px] text-ink-3">{notification.body}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
                          <span>{dateTime(notification.sentAt)}</span>
                          <span>Qabul: {number(notification.recipients)}</span>
                          <span>O'qidi: {number(notification.read)}</span>
                          <span className="font-semibold text-ink">{percent(readRate, 1)}</span>
                        </div>
                      </button>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setDetail(notification)}><Eye className="h-3.5 w-3.5" /> Ko'rish</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(notification)} aria-label="O'chirish"><Trash2 className="h-3.5 w-3.5 text-error" /></Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.title ?? 'Bildirishnoma'}
        description={detail ? dateTime(detail.sentAt) : undefined}
        size="md"
        footer={
          detail ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>Yopish</Button>
              <Button variant="secondary" onClick={() => setDeleteTarget(detail)}><Trash2 className="h-4 w-4" /> O'chirish</Button>
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line-2 bg-canvas p-4">
              <p className="text-[13px] font-semibold text-ink">{detail.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{detail.body}</p>
              {detail.link ? <p className="mt-2 truncate text-[11.5px] text-brand-text">{detail.link}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{AUDIENCE_LABEL[detail.audience]}</Badge>
              <Badge tone={TYPE_TONE[detail.type]}>{TYPE_LABEL[detail.type]}</Badge>
              {detail.scheduled ? <Badge tone="info">Rejalashtirilgan</Badge> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line-2 p-3.5">
                <div className="flex items-center justify-between text-[12px] text-ink-3">
                  <span>Qabul qildi</span>
                  <Users className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1 font-display text-[22px] font-extrabold text-ink">{number(detail.recipients)}</p>
              </div>
              <div className="rounded-xl border border-line-2 p-3.5">
                <div className="flex items-center justify-between text-[12px] text-ink-3">
                  <span>O'qidi</span>
                  <Eye className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1 font-display text-[22px] font-extrabold text-ink">{number(detail.read)}</p>
                <div className="mt-2"><ProgressBar value={detail.recipients ? (detail.read / detail.recipients) * 100 : 0} /></div>
                <p className="mt-1 text-[11px] text-ink-3">{percent(detail.recipients ? (detail.read / detail.recipients) * 100 : 0, 1)} ochilgan</p>
              </div>
              <div className="rounded-xl border border-line-2 p-3.5">
                <div className="flex items-center justify-between text-[12px] text-ink-3">
                  <span>Bosdi</span>
                  <Megaphone className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1 font-display text-[22px] font-extrabold text-ink">{number(detail.clicked)}</p>
                <div className="mt-2"><ProgressBar value={detail.recipients ? (detail.clicked / detail.recipients) * 100 : 0} tone="info" /></div>
                <p className="mt-1 text-[11px] text-ink-3">{percent(detail.recipients ? (detail.clicked / detail.recipients) * 100 : 0, 1)} bosilgan</p>
              </div>
              <div className="rounded-xl border border-line-2 p-3.5">
                <div className="flex items-center justify-between text-[12px] text-ink-3">
                  <span>O'qish darajasi</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="mt-1 font-display text-[22px] font-extrabold text-ink">{percent(detail.recipients ? (detail.read / detail.recipients) * 100 : 0, 1)}</p>
                <p className="mt-1 text-[11px] text-ink-3">O'qiganlar / qabul qilganlar</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Bildirishnomani o'chirish"
        description={deleteTarget?.title}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> O'chirish</Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">Tarixdan <b>{deleteTarget?.title}</b> yozuvi o'chiriladi. Foydalanuvchilar allaqachon olgan xabarlarga ta'sir qilmaydi.</p>
      </Modal>
    </PageTransition>
  )
}
