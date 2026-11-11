'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileQuestion,
  OctagonX,
  Radio,
  Trophy,
  UserCheck,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { Avatar, Badge, Button, EmptyState, Modal, cn, useToast } from '@/components/ui'
import { MOCK_NOW, clock, number } from '@/lib/format'
import { olympiadParticipants, shortName } from '@/lib/olympiads'
import { useAppStore } from '@/lib/store'

interface LeaderRow {
  userId: string
  name: string
  score: number
  total: number
  delta: number
  prev: number
}

function PanelStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Clock3
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/40">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div
        className={cn(
          'mt-1 text-[22px] font-geist leading-none tabular-nums',
          accent ? 'text-brand-light' : 'text-white',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export default function LiveOlympiadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const olympiad = useAppStore((state) => state.olympiads.find((item) => item.id === params.id))
  const users = useAppStore((state) => state.users)
  const stopOlympiad = useAppStore((state) => state.stopOlympiad)
  const { toast } = useToast()

  const [now, setNow] = useState(() => MOCK_NOW.getTime())
  const [showStop, setShowStop] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow((value) => value + 1000), 1000)
    return () => clearInterval(timer)
  }, [])

  const startsAt = useMemo(
    () => (olympiad ? Date.parse(olympiad.startAt) : 0),
    [olympiad],
  )
  const durationMs = (olympiad ? olympiad.duration : 0) * 60_000
  const endsAt = startsAt + durationMs
  const elapsed = Math.max(0, Math.min(now - startsAt, durationMs))
  const remaining = Math.max(0, endsAt - now)
  const progress = durationMs > 0 ? elapsed / durationMs : 0

  const [liveTick, setLiveTick] = useState(0)
  const [leadersTick, setLeadersTick] = useState(0)
  useEffect(() => {
    const liveTimer = setInterval(() => setLiveTick((value) => value + 1), 4000)
    const leadersTimer = setInterval(() => setLeadersTick((value) => value + 1), 7000)
    return () => {
      clearInterval(liveTimer)
      clearInterval(leadersTimer)
    }
  }, [])

  const participants = useMemo(
    () => (olympiad ? olympiadParticipants(olympiad, users) : []),
    [olympiad, users],
  )
  const playing = participants.filter((row) => row.status === 'playing')
  const finished = participants.filter((row) => row.status === 'finished')

  const leaders = useMemo<LeaderRow[]>(() => {
    if (!olympiad) return []
    const base = [...playing, ...finished]
      .map((row, index) => {
        const total = olympiad.questionIds.length || 30
        const score = Math.max(1, Math.round((total / (index + 4)) * 2.6))
        return {
          userId: row.user.id,
          name: row.user.name,
          score,
          total,
          delta: index % 4 === 0 ? 1 : 0,
          prev: Math.max(1, score - (index % 3 === 0 ? 2 : index % 3)),
        }
      })
      .slice(0, 12)
    return base
      .map((row, index) => {
        const shift = (leadersTick + index) % 4 === 0 ? row.delta : 0
        return { ...row, score: row.score + shift }
      })
      .sort((a, b) => b.score - a.score || a.prev - b.prev)
  }, [olympiad, playing, finished, leadersTick])

  const questionStats = useMemo(() => {
    if (!olympiad) return []
    const totalQuestions = olympiad.questionIds.length || 30
    return Array.from({ length: Math.min(10, totalQuestions) }, (_, index) => {
      const wrongRate = 18 + ((index * 13 + liveTick * 3) % 55)
      const answered = olympiad.playing + olympiad.finished
      return {
        index,
        correct: Math.max(1, Math.round((answered * (100 - wrongRate)) / 100)),
        wrongRate,
        answered,
      }
    })
  }, [olympiad, liveTick])

  if (!olympiad || olympiad.status !== 'live') {
    return (
      <PageTransition>
        <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3.5  [@media(max-height:720px)]:gap-2">
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/olympiads"
              className="inline-flex h-8 items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar
            </Link>
          </div>
          <div className="grid min-h-0 flex-1 place-items-center rounded-[18px] border border-dashed border-line bg-white">
            <EmptyState
              title="Jonli olimpiada emas"
              text="Bu sahifa faqat hozir o'tayotgan olimpiadalar uchun ishlaydi."
              icon={<Radio className="h-5 w-5" />}
              action={
                <Link href="/admin/olympiads">
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="h-3.5 w-3.5" /> Ro'yxatga qaytish
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  const handleStop = () => {
    stopOlympiad(olympiad.id)
    toast({ title: "Olimpiada to'xtatildi", tone: 'warning' })
    setShowStop(false)
    router.push(`/admin/olympiads/${olympiad.id}/results`)
  }

  const playingCount = olympiad.playing
  const finishedCount = olympiad.finished
  const leftCount = olympiad.left
  const registeredCount = olympiad.registered

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3.5  [@media(max-height:720px)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
              <Link
                href="/admin/olympiads"
                className="inline-flex h-7 items-center gap-1 transition hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar
              </Link>
              <span className="text-placeholder">/</span>
              <span className="truncate">{olympiad.name}</span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="h2 truncate text-ink">Jonli monitoring</h1>
              <Badge tone="danger" dot>
                JONLI
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/admin/olympiads/${olympiad.id}/edit`} className="hidden sm:inline-flex">
              <Button variant="ghost">Tahrirlash</Button>
            </Link>
            <Button variant="destructive" onClick={() => setShowStop(true)} className="h-10 sm:h-11">
              <OctagonX className="h-4 w-4" /> To'xtatish
            </Button>
          </div>
        </div>

        <section className="flex shrink-0 flex-col gap-3 rounded-[18px] bg-ink px-4 py-3 text-white shadow-card sm:px-5 sm:py-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/50">
              <Clock3 className="h-3 w-3" /> Qolgan vaqt
            </div>
            <div className="mt-1 text-[38px] font-geist leading-none tabular-nums text-brand-light sm:text-[46px]">
              {clock(remaining)}
            </div>
            <div className="mt-1.5 text-[11px] text-white/50">
              {olympiad.duration} daqiqalik · {Math.round(progress * 100)}% bajarildi
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-light to-brand transition-[width] duration-1000"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[420px]">
            <PanelStat icon={UserCheck} label="Ro'yxatdan o'tgan" value={number(registeredCount)} />
            <PanelStat icon={Radio} label="Qatnashmoqda" value={number(playingCount)} accent />
            <PanelStat icon={CheckCircle2} label="Tugatdi" value={number(finishedCount)} />
            <PanelStat icon={OctagonX} label="Tark etdi" value={number(leftCount)} />
          </div>
        </section>

        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] font-semibold text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-light" /> Faol
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" /> Yakunlagan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink-3/50" /> Kutilmoqda
          </span>
          <span className="ml-auto text-ink-2">
            {number(Math.max(0, registeredCount - playingCount - finishedCount - leftCount))} kishi hali
            kirmagan
          </span>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
            <header className="flex shrink-0 items-center gap-2 border-b border-line-2 px-3 py-2.5 sm:px-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-brand-text">
                <Trophy className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-[12.5px] font-bold text-ink">Jonli reyting</h2>
              <span className="ml-auto text-[10px] font-semibold text-ink-3">
                7 soniyada yangilanadi
              </span>
            </header>
            <ol className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint]">
              {leaders.map((row, index) => {
                const medal =
                  index === 0
                    ? 'bg-[#b45309]/10 text-[#b45309]'
                    : index === 1
                      ? 'bg-ink-3/10 text-ink-3'
                      : index === 2
                        ? 'bg-[#c2865a]/15 text-[#c2865a]'
                        : 'bg-muted text-ink-3'
                return (
                  <li
                    key={row.userId}
                    className="flex items-center gap-2.5 px-3 py-2 sm:px-4"
                  >
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-[7px] text-[10px] font-bold',
                        medal,
                      )}
                    >
                      {index + 1}
                    </span>
                    <Avatar name={row.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">
                        {shortName(row.name)}
                      </p>
                      <p className="text-[10px] text-ink-3">
                        {row.score}/{row.total} ball
                      </p>
                    </div>
                    <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:w-24">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.min(100, (row.score / row.total) * 100)}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums text-ink">
                      {row.score}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
            <header className="flex shrink-0 items-center gap-2 border-b border-line-2 px-3 py-2.5 sm:px-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-brand-text">
                <FileQuestion className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-[12.5px] font-bold text-ink">Savollar statistikasi</h2>
              <span className="ml-auto text-[10px] font-semibold text-ink-3">4 soniyada</span>
            </header>
            <div className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint]">
              {questionStats.map((row) => {
                const correctPct =
                  row.answered > 0 ? Math.round((row.correct / row.answered) * 100) : 0
                return (
                  <div key={row.index} className="px-3 py-2 sm:px-4">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-muted text-[10px] font-bold text-ink-3">
                        {row.index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink-2">
                        Savol {row.index + 1}
                      </span>
                      <Badge tone={row.wrongRate > 50 ? 'danger' : 'gray'}>
                        {row.wrongRate > 50 ? 'qiyin' : `${correctPct}% to'g'ri`}
                      </Badge>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-light to-brand"
                        style={{ width: `${correctPct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <footer className="shrink-0 border-t border-line-2 px-3 py-2 text-[10px] font-semibold text-ink-3 sm:px-4">
              Yana {Math.max(0, (olympiad.questionIds.length || 30) - questionStats.length)} ta savol
              kuzatilmoqda
            </footer>
          </section>
        </div>

        <Modal
          open={showStop}
          onClose={() => setShowStop(false)}
          title="Olimpiadani to'xtatish"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowStop(false)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={handleStop} className="h-11 sm:h-10">
                Ha, to'xtatish
              </Button>
            </>
          }
        >
          <p className="text-[13px] leading-relaxed text-ink-2">
            {olympiad.name} hozirda davom etmoqda va {number(playingCount)} kishi qatnashyapti.
            To'xtatilsa, barcha ishtirokchilar chiqariladi va olimpiada yakunlanadi. Bu amalni ortga
            qaytarib bo'lmaydi.
          </p>
        </Modal>
      </div>
    </PageTransition>
  )
}
