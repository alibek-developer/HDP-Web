'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  FileQuestion,
  MoreHorizontal,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { Button, Dropdown, EmptyState, Modal, Segmented, cn, useToast } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { MOCK_NOW, compact, date, number, time } from '@/lib/format'
import type { Olympiad, OlympiadStatus } from '@/lib/types'

const DAY = 86_400_000
const MONTHS = ['YAN', 'FEV', 'MAR', 'APR', 'MAY', 'IYN', 'IYL', 'AVG', 'SEN', 'OKT', 'NOY', 'DEK']

const STATUS: Record<OlympiadStatus, { label: string; dot: string; soft: string; text: string }> = {
  live: { label: 'Jonli', dot: 'bg-error', soft: 'bg-error-bg', text: 'text-error' },
  scheduled: { label: 'Rejalashtirilgan', dot: 'bg-info', soft: 'bg-info-bg', text: 'text-info' },
  draft: { label: 'Qoralama', dot: 'bg-warning', soft: 'bg-warning-bg', text: 'text-warning' },
  finished: { label: 'Yakunlangan', dot: 'bg-ink-3/50', soft: 'bg-muted', text: 'text-ink-3' },
}

const STATUS_WEIGHT: Record<OlympiadStatus, number> = { live: 0, scheduled: 1, draft: 2, finished: 3 }

const FILTERS: Array<{ value: OlympiadStatus | 'all'; label: string; mobileLabel: string }> = [
  { value: 'all', label: 'Barchasi', mobileLabel: 'Barchasi' },
  { value: 'scheduled', label: 'Rejalashtirilgan', mobileLabel: 'Reja' },
  { value: 'live', label: 'Jonli', mobileLabel: 'Jonli' },
  { value: 'finished', label: 'Yakunlangan', mobileLabel: 'Tugagan' },
  { value: 'draft', label: 'Qoralama', mobileLabel: 'Draft' },
]

const dateParts = (iso: string) => {
  const [day, month] = date(iso).split('.')
  return { day, month: MONTHS[Number(month) - 1] ?? '', clock: time(iso) }
}

const daysUntil = (iso: string) =>
  Math.max(0, Math.round((new Date(iso).getTime() - MOCK_NOW.getTime()) / DAY))

const minutesLeft = (olympiad: Olympiad) =>
  Math.max(
    0,
    Math.round((new Date(olympiad.startAt).getTime() + olympiad.duration * 60_000 - MOCK_NOW.getTime()) / 60_000),
  )

const rewardPool = (olympiad: Olympiad) => olympiad.rewards.reduce((sum, value) => sum + value, 0)

const LivePulse = () => (
  <span className="inline-flex items-center gap-1.5 font-geist text-[10px] font-bold uppercase tracking-[0.14em] text-brand-light">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
    </span>
    Jonli efir
  </span>
)

function LiveHero({ olympiad }: { olympiad: Olympiad }) {
  const total = Math.max(1, olympiad.registered)
  const playing = Math.min(100, (olympiad.playing / total) * 100)
  const finished = Math.min(100 - playing, (olympiad.finished / total) * 100)
  const remaining = minutesLeft(olympiad)
  const elapsed = Math.max(0, Math.min(100, Math.round(((olympiad.duration - remaining) / olympiad.duration) * 100)))
  const parts = dateParts(olympiad.startAt)

  return (
    <section
      aria-label="Jonli olimpiada"
      className="relative shrink-0 overflow-hidden rounded-[18px] bg-ink px-4 py-3.5 text-white sm:px-5 sm:py-4 [@media(max-height:700px)]:py-3"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/25 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <LivePulse />
            <span className="font-geist text-[10px] text-white/45">
              {parts.day} {parts.month.toLowerCase()}, {parts.clock} da boshlangan
            </span>
          </div>
          <h2 className="mt-1 line-clamp-2 font-geist text-[17px] font-extrabold leading-tight sm:text-[21px]">
            {olympiad.name}
          </h2>
          <p className="mt-0.5 hidden truncate font-geist text-[11.5px] text-white/55 sm:block">
            {olympiad.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 max-sm:w-full">
          <Link
            href={`/admin/olympiads/${olympiad.id}`}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-white/20 px-3 font-geist text-[12px] font-semibold text-white/85 transition hover:bg-white/10 max-sm:h-10 max-sm:flex-1"
          >
            Batafsil
          </Link>
          <Link
            href={`/admin/olympiads/${olympiad.id}/live`}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white px-3 font-geist text-[12px] font-bold text-ink transition hover:bg-brand-soft max-sm:h-10 max-sm:flex-1"
          >
            <Radio className="h-3.5 w-3.5" /> Monitoring
          </Link>
        </div>
      </div>

      <div className="relative mt-2.5 hidden items-center gap-6 sm:flex">
        <div>
          <p className="font-geist text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">Qatnashmoqda</p>
          <p className="mt-0.5 font-geist text-[17px] font-extrabold leading-none tabular text-brand-light">
            {number(olympiad.playing)}
          </p>
        </div>
        <div className="h-7 w-px bg-white/15" />
        <div>
          <p className="font-geist text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">Yakunladi</p>
          <p className="mt-0.5 font-geist text-[17px] font-extrabold leading-none tabular text-white">
            {number(olympiad.finished)}
          </p>
        </div>
        <div className="h-7 w-px bg-white/15" />
        <div>
          <p className="font-geist text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">Qoldi</p>
          <p className="mt-0.5 font-geist text-[17px] font-extrabold leading-none tabular text-white">
            {number(olympiad.left)}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 font-geist text-[11px] font-semibold text-white/70">
          <Clock3 className="h-3.5 w-3.5" /> {remaining} daqiqa qoldi
        </span>
      </div>

      <div className="relative mt-2 flex items-center justify-between gap-3 sm:hidden">
        <span className="font-geist text-[11px] text-white/60">
          <span className="font-bold text-white tabular">{number(olympiad.playing)}</span> qatnashmoqda
        </span>
        <span className="inline-flex items-center gap-1 font-geist text-[11px] font-semibold text-brand-light">
          <Clock3 className="h-3 w-3" /> {remaining} daq qoldi
        </span>
      </div>

      <span className="relative mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/15">
        <span className="bg-brand-light" style={{ width: `${playing}%` }} />
        <span className="bg-success" style={{ width: `${finished}%` }} />
      </span>
      <div className="relative mt-1.5 hidden items-center justify-between font-geist text-[9.5px] text-white/45 sm:flex">
        <span>
          {number(olympiad.playing)} faol · {number(olympiad.finished)} yakunlagan · {number(olympiad.left)} kutilmoqda
        </span>
        <span>{elapsed}% vaqt o'tdi</span>
      </div>
    </section>
  )
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      {children}
    </span>
  )
}

function EventCard({ olympiad, onDelete }: { olympiad: Olympiad; onDelete: (olympiad: Olympiad) => void }) {
  const router = useRouter()
  const duplicateOlympiad = useAppStore((state) => state.duplicateOlympiad)
  const { toast } = useToast()
  const meta = STATUS[olympiad.status]
  const parts = dateParts(olympiad.startAt)
  const pool = rewardPool(olympiad)
  const detail = `/admin/olympiads/${olympiad.id}`
  const total = Math.max(1, olympiad.registered)
  const finishedShare = Math.min(100, Math.round((olympiad.finished / total) * 100))
  const playingShare = Math.min(100, Math.round((olympiad.playing / total) * 100))
  const finishedLiveShare = Math.min(100 - playingShare, Math.round((olympiad.finished / total) * 100))
  const days = daysUntil(olympiad.startAt)

  return (
    <article className="flex flex-col rounded-[16px] border border-line bg-white p-3.5 shadow-card transition hover:border-line-brand">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className={cn(
              'hidden h-[54px] w-[50px] shrink-0 flex-col items-center justify-center rounded-[11px] border border-line-2 bg-canvas min-[380px]:flex',
              olympiad.status === 'finished' && 'opacity-65',
            )}
          >
            <span className="font-geist text-[8px] font-bold uppercase tracking-[0.12em] text-ink-3">{parts.month}</span>
            <span className="font-geist text-[19px] font-extrabold leading-[1.05] tabular text-ink">{parts.day}</span>
            <span className="font-geist text-[8.5px] font-semibold tabular text-ink-3">{parts.clock}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-geist text-[9.5px] font-bold uppercase tracking-[0.06em]',
                  meta.soft,
                  meta.text,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                {meta.label}
              </span>
              {olympiad.gradeLimit ? (
                <span className="rounded-full border border-line bg-white px-2 py-0.5 font-geist text-[9.5px] font-semibold text-ink-3">
                  {olympiad.gradeLimit} sinf
                </span>
              ) : null}
              {olympiad.audience === 'pro' ? (
                <span className="rounded-full border border-line bg-white px-2 py-0.5 font-geist text-[9.5px] font-semibold text-ink-3">
                  Pro
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 line-clamp-2 font-geist text-[15px] font-bold leading-tight text-ink">
              {olympiad.name}
            </h3>
          </div>
        </div>
        <Dropdown
          className="shrink-0"
          trigger={
            <button
              type="button"
              aria-label="Amallar"
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition hover:bg-hover hover:text-ink"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            ...(olympiad.status === 'finished'
              ? [
                  {
                    label: 'Tahrirlash',
                    icon: <Pencil className="h-3.5 w-3.5" />,
                    onClick: () => router.push(`${detail}/edit`),
                  },
                ]
              : []),
            {
              label: 'Nusxa yaratish',
              icon: <Copy className="h-3.5 w-3.5" />,
              onClick: () => {
                duplicateOlympiad(olympiad.id)
                toast({ title: 'Nusxa yaratildi', description: `${olympiad.name} qoralama sifatida saqlandi.` })
              },
            },
            { separator: true, label: 'sep' },
            {
              label: "O'chirish",
              danger: true,
              icon: <Trash2 className="h-3.5 w-3.5" />,
              onClick: () => onDelete(olympiad),
            },
          ]}
        />
      </div>

      <p className="mt-2 line-clamp-2 font-geist text-[11.5px] leading-relaxed text-ink-3">{olympiad.description}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-geist text-[10.5px] text-ink-3">
        <Meta icon={<Users className="h-3 w-3" />}>{number(olympiad.registered)} ishtirokchi</Meta>
        <Meta icon={<FileQuestion className="h-3 w-3" />}>{olympiad.questionIds.length} savol</Meta>
        <Meta icon={<Clock3 className="h-3 w-3" />}>{olympiad.duration} daq</Meta>
        <Meta icon={<Trophy className="h-3 w-3" />}>{compact(pool)} so'm</Meta>
        <span className="min-[380px]:hidden">
          {parts.day} {parts.month.toLowerCase()} · {parts.clock}
        </span>
      </div>

      {olympiad.status === 'live' ? (
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="bg-brand" style={{ width: `${playingShare}%` }} />
            <span className="bg-success" style={{ width: `${finishedLiveShare}%` }} />
          </span>
          <span className="font-geist text-[10px] font-semibold text-error">{number(olympiad.playing)} faol</span>
          <span className="font-geist text-[10px] text-ink-3">{minutesLeft(olympiad)} daq</span>
        </div>
      ) : olympiad.status === 'scheduled' ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-info-bg px-2 py-1 font-geist text-[10px] font-semibold text-info">
            <CalendarDays className="h-3 w-3" />
            {days > 0 ? `${days} kun qoldi` : 'Bugun boshlanadi'}
          </span>
          <span className="font-geist text-[10px] text-ink-3">{number(olympiad.registered)} ro'yxatdan o'tgan</span>
        </div>
      ) : olympiad.status === 'finished' ? (
        <div className="mt-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="bg-success" style={{ width: `${finishedShare}%` }} />
            </span>
            <span className="font-geist text-[10px] tabular text-ink-3">
              {number(olympiad.finished)} / {number(olympiad.registered)}
            </span>
          </div>
          {olympiad.resultsPublished ? (
            <p className="mt-1 inline-flex items-center gap-1 font-geist text-[10px] font-semibold text-success">
              <CheckCircle2 className="h-3 w-3" /> Natijalar e'lon qilingan
            </p>
          ) : (
            <p className="mt-1 inline-flex items-center gap-1 font-geist text-[10px] font-semibold text-warning">
              <AlertTriangle className="h-3 w-3" /> Natijalar hali e'lon qilinmagan
            </p>
          )}
          {olympiad.results.length > 0 ? (
            <p className="mt-1 flex items-center gap-1.5 font-geist text-[10.5px] text-ink-2">
              <Award className="h-3 w-3 shrink-0 text-[#b45309]" />
              <span className="truncate">{olympiad.results[0].name}</span>
              <span className="ml-auto shrink-0 font-semibold tabular text-ink">
                {olympiad.results[0].score}/{olympiad.results[0].total}
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {olympiad.questionIds.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-bg px-2 py-1 font-geist text-[10px] font-semibold text-warning">
              <AlertTriangle className="h-3 w-3" /> Savollar tanlanmagan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-geist text-[10px] font-semibold text-ink-3">
              <FileQuestion className="h-3 w-3" /> {olympiad.questionIds.length} savol tayyor
            </span>
          )}
          <span className="font-geist text-[10px] text-ink-3">Ro'yxat hali ochilmagan</span>
        </div>
      )}

      <div className="mt-auto flex items-center gap-1.5 pt-3">
        {olympiad.status === 'finished' ? (
          <Link href={`${detail}/results`} className="flex-1">
            <Button size="sm" className="h-9 w-full">
              <Trophy className="h-3.5 w-3.5" /> Natijalar
            </Button>
          </Link>
        ) : (
          <Link href={`${detail}/edit`} className="flex-1">
            <Button size="sm" className="h-9 w-full">
              <Pencil className="h-3.5 w-3.5" />
              {olympiad.status === 'draft' ? 'Davom ettirish' : 'Tahrirlash'}
            </Button>
          </Link>
        )}
        <Link href={detail}>
          <Button size="sm" variant="secondary" className="h-9">
            <Eye className="h-3.5 w-3.5" /> Batafsil
          </Button>
        </Link>
      </div>
    </article>
  )
}

export default function OlympiadsPage() {
  const olympiads = useAppStore((state) => state.olympiads)
  const deleteOlympiad = useAppStore((state) => state.deleteOlympiad)
  const { toast } = useToast()
  const [status, setStatus] = useState<OlympiadStatus | 'all'>('all')
  const [deleting, setDeleting] = useState<Olympiad | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: olympiads.length }
    for (const item of olympiads) map[item.status] = (map[item.status] ?? 0) + 1
    return map
  }, [olympiads])

  const filtered = useMemo(
    () => (status === 'all' ? olympiads : olympiads.filter((item) => item.status === status)),
    [olympiads, status],
  )

  const liveHero = useMemo(() => {
    if (status !== 'all' && status !== 'live') return undefined
    return olympiads.find((item) => item.status === 'live')
  }, [olympiads, status])

  const cards = useMemo(() => {
    return filtered
      .filter((item) => item.id !== liveHero?.id)
      .sort((left, right) => {
        if (STATUS_WEIGHT[left.status] !== STATUS_WEIGHT[right.status]) {
          return STATUS_WEIGHT[left.status] - STATUS_WEIGHT[right.status]
        }
        if (left.status === 'finished') return right.startAt.localeCompare(left.startAt)
        if (left.status === 'draft') return right.createdAt.localeCompare(left.createdAt)
        return left.startAt.localeCompare(right.startAt)
      })
  }, [filtered, liveHero])

  const totals = useMemo(
    () => ({
      registered: filtered.reduce((sum, item) => sum + item.registered, 0),
      pool: filtered.reduce((sum, item) => sum + rewardPool(item), 0),
    }),
    [filtered],
  )

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-3 overflow-hidden  sm:gap-3.5  [@media(max-height:720px)]:gap-2">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="h2 truncate text-ink">Olimpiadalar</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 font-geist text-[11px] font-bold tabular text-ink-2">
              {number(olympiads.length)}
            </span>
          </div>
          <Link
            href="/admin/olympiads/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-2.5 font-geist text-[12.5px] font-bold text-white transition hover:bg-brand sm:px-3"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Yangi olimpiada</span>
            <span className="sm:hidden">Yangi</span>
          </Link>
        </header>

        {liveHero ? <LiveHero olympiad={liveHero} /> : null}

        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
          <div className="w-full sm:w-auto">
            <div className="hidden sm:block">
              <Segmented
                value={status}
                onChange={setStatus}
                options={FILTERS.map((item) => ({
                  value: item.value,
                  label: item.label,
                  count: counts[item.value] ?? 0,
                }))}
              />
            </div>
            <div className="grid grid-cols-5 gap-1 rounded-[12px] bg-muted p-1 sm:hidden">
              {FILTERS.map((item) => {
                const active = status === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(item.value)}
                    className={cn(
                      'flex h-11 flex-col items-center justify-center gap-1 rounded-lg font-geist text-[10.5px] font-semibold leading-none transition',
                      active ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3',
                    )}
                  >
                    {item.mobileLabel}
                    <span className={cn('text-[9px] font-bold tabular', active ? 'text-brand-text/60' : 'text-ink-3/55')}>
                      {counts[item.value] ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-3 font-geist text-[10.5px] tabular text-ink-3 xl:flex">
            <span>
              <b className="font-semibold text-ink-2">{number(totals.registered)}</b> ishtirokchi
            </span>
            <span className="h-3 w-px bg-line" />
            <span>
              <b className="font-semibold text-ink-2">{compact(totals.pool)} so'm</b> sovrin jamg'armasi
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [contain:paint]">
          {cards.length === 0 && !liveHero ? (
            <div className="grid h-full min-h-[220px] place-items-center rounded-[16px] border border-dashed border-line bg-white/60 px-4 text-center">
              <EmptyState
                title="Olimpiada topilmadi"
                text="Tanlangan holat bo'yicha musobaqa yo'q. Yangi olimpiada yarating."
                icon={<Trophy className="h-5 w-5" />}
                action={
                  <Link href="/admin/olympiads/new">
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5" /> Yangi olimpiada
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid gap-2.5 pb-1 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((olympiad) => (
                <EventCard key={olympiad.id} olympiad={olympiad} onDelete={setDeleting} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Olimpiadani o'chirish"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-10"
              onClick={() => {
                if (!deleting) return
                deleteOlympiad(deleting.id)
                toast({ title: "Olimpiada o'chirildi", description: deleting.name, tone: 'warning' })
                setDeleting(null)
              }}
            >
              <Trash2 className="h-4 w-4" /> O'chirish
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold text-ink">{deleting?.name}</span> olimpiadasi butunlay o'chiriladi.
          Ishtirokchilar va natijalar ham o'chib ketadi. Bu amalni bekor qilish mumkin emas.
        </p>
      </Modal>
    </PageTransition>
  )
}
