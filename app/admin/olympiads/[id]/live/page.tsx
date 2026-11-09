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
  Pencil,
  Radio,
  Trophy,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  ProgressBar,
  SectionCard,
  StatCard,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { MOCK_NOW, clock, number } from '@/lib/format'
import { shortName } from '@/lib/olympiads'

interface LeaderRow {
  id: string
  name: string
  tone: string
  score: number
}

export default function LiveOlympiadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const olympiad = useAppStore((state) => state.olympiads.find((item) => item.id === params.id))
  const users = useAppStore((state) => state.users)
  const tests = useAppStore((state) => state.tests)
  const stopOlympiad = useAppStore((state) => state.stopOlympiad)
  const [confirmStop, setConfirmStop] = useState(false)

  const total = olympiad?.questionIds.length || 30

  const initialRemaining = useMemo(() => {
    if (!olympiad) return 0
    return Math.max(
      0,
      Math.round(
        (new Date(olympiad.startAt).getTime() + olympiad.duration * 60_000 - MOCK_NOW.getTime()) / 1000,
      ),
    )
  }, [olympiad])

  const [remaining, setRemaining] = useState(initialRemaining)
  const [live, setLive] = useState(() => ({
    playing: olympiad?.playing ?? 0,
    finished: olympiad?.finished ?? 0,
    left: olympiad?.left ?? 0,
  }))
  const [leaders, setLeaders] = useState<LeaderRow[]>([])

  useEffect(() => {
    setRemaining(initialRemaining)
  }, [initialRemaining])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!olympiad) return
    setLive({
      playing: olympiad.playing,
      finished: olympiad.finished,
      left: olympiad.left,
    })
    const base = olympiad.playing
    const timer = window.setInterval(() => {
      setLive((current) => {
        const playing = Math.max(0, Math.min(olympiad.registered, base + Math.floor(Math.random() * 7) - 3))
        const finished = current.finished + (Math.random() > 0.72 ? 1 : 0)
        const left = Math.max(0, current.left + (Math.random() > 0.85 ? 1 : 0))
        return {
          playing: Math.max(0, playing - left + olympiad.left),
          finished,
          left,
        }
      })
    }, 4000)
    return () => window.clearInterval(timer)
  }, [olympiad])

  useEffect(() => {
    if (!olympiad) return
    const seed = users.slice(0, 12).map((user, index) => ({
      id: user.id,
      name: user.name,
      tone: user.tone,
      score: Math.max(1, total - 2 - index),
    }))
    setLeaders(seed)
    const timer = window.setInterval(() => {
      setLeaders((current) =>
        current
          .map((row, index) => {
            const canGrow = row.score < total && index < 6
            const grows = canGrow && Math.random() > 0.6
            return grows ? { ...row, score: row.score + 1 } : row
          })
          .sort((left, right) => right.score - left.score),
      )
    }, 7000)
    return () => window.clearInterval(timer)
  }, [olympiad, users, total])

  const questionRows = useMemo(() => {
    if (!olympiad) return []
    return olympiad.questionIds
      .slice(0, 10)
      .map((id, index) => {
        const test = tests.find((item) => item.id === id)
        if (!test) return null
        return {
          id,
          label: `Savol ${index + 1}`,
          correct: Math.max(0, Math.min(100, 100 - test.errorRate)),
          question: test.question,
        }
      })
      .filter(Boolean) as Array<{ id: string; label: string; correct: number; question: string }>
  }, [olympiad, tests])

  if (!olympiad) {
    return (
      <Card>
        <EmptyState
          title="Olimpiada topilmadi"
          text="Bu olimpiada o'chirilgan yoki mavjud emas."
          icon={<Trophy className="h-5 w-5" />}
          action={
            <Link href="/admin/olympiads">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar ro'yxati
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  if (olympiad.status !== 'live') {
    return (
      <Card>
        <EmptyState
          title="Olimpiada jonli emas"
          text="Jonli monitoring faqat davom etayotgan olimpiadalar uchun mavjud."
          icon={<Radio className="h-5 w-5" />}
          action={
            <Link href={`/admin/olympiads/${olympiad.id}`}>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadaga qaytish
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const progress = olympiad.duration > 0 ? ((olympiad.duration * 60 - remaining) / (olympiad.duration * 60)) * 100 : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/olympiads/${olympiad.id}`}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Olimpiada
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
            </span>
            <h1 className="h2 text-ink">JONLI — {olympiad.name}</h1>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            Real vaqtda kuzatuv. Ma'lumotlar avtomatik yangilanadi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
            <Button variant="ghost">
              <Pencil className="h-4 w-4" /> Tahrirlash
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setConfirmStop(true)}>
            <OctagonX className="h-4 w-4" /> Olimpiadani to'xtatish
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden p-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-[#22c55e] to-[#86efac]" />
        <div className="flex flex-col items-center px-5 py-7 text-center">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3">
            <Clock3 className="h-3.5 w-3.5" /> Qolgan vaqt
          </p>
          <p className="mt-2 font-display text-[46px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular sm:text-[58px]">
            {clock(remaining)}
          </p>
          <div className="mt-5 w-full max-w-2xl">
            <ProgressBar value={progress} height={8} tone="gradient" />
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-3">
              <span>{olympiad.duration} daqiqalik olimpiada</span>
              <span>{Math.round(progress)}% bajarildi</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ro'yxatdan o'tgan"
          value={number(olympiad.registered)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Qatnashmoqda"
          value={number(live.playing)}
          icon={<UserCheck className="h-5 w-5" />}
          iconClass="bg-brand-soft text-brand"
          hint="Real vaqtda yangilanadi"
        />
        <StatCard
          label="Tugatdi"
          value={number(live.finished)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-success-bg text-success"
        />
        <StatCard
          label="Tark etdi"
          value={number(live.left)}
          icon={<UserX className="h-5 w-5" />}
          iconClass="bg-error-bg text-error"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Jonli reyting" subtitle="Top 12 ishtirokchi">
          <div className="space-y-1">
            {leaders.map((row, index) => (
              <div key={row.id} className="flex items-center gap-3 border-b border-line-2 py-2.5 last:border-0">
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                    index === 0
                      ? 'bg-coin text-white'
                      : index === 1
                        ? 'bg-[#94a3b8] text-white'
                        : index === 2
                          ? 'bg-[#c2865a] text-white'
                          : 'bg-muted text-ink-3',
                  )}
                >
                  {index + 1}
                </span>
                <Avatar name={row.name} tone={row.tone} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-ink">{shortName(row.name)}</p>
                    <p className="text-[12px] font-bold text-ink tabular">
                      {row.score}/{total}
                    </p>
                  </div>
                  <ProgressBar
                    value={(row.score / total) * 100}
                    height={4}
                    tone={index === 0 ? 'gradient' : 'brand'}
                    className="mt-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Savollar statistikasi" subtitle="To'g'ri javob foizi">
          {questionRows.length === 0 ? (
            <EmptyState
              title="Savollar yo'q"
              text="Olimpiadaga savollar qo'shilmagan."
              icon={<FileQuestion className="h-5 w-5" />}
            />
          ) : (
            <div className="space-y-2.5">
              {questionRows.map((row) => (
                <div key={row.id} className="rounded-xl border border-line bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-ink">{row.label}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[12px] font-bold tabular',
                          row.correct < 50 ? 'text-error' : 'text-ink-2',
                        )}
                      >
                        {row.correct}% to'g'ri
                      </span>
                      {row.correct < 50 ? <Badge tone="danger">qiyin savol</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-ink-3">{row.question}</p>
                  <ProgressBar
                    value={row.correct}
                    height={5}
                    tone={row.correct < 50 ? 'danger' : 'brand'}
                    className="mt-1.5"
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <Modal
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Olimpiadani to'xtatish"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmStop(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                stopOlympiad(olympiad.id)
                toast({
                  title: "Olimpiada to'xtatildi",
                  description: "Natijalarni e'lon qilish sahifasiga o'tildi.",
                  tone: 'warning',
                })
                router.push(`/admin/olympiads/${olympiad.id}/results`)
              }}
            >
              <OctagonX className="h-4 w-4" /> To'xtatish
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-[13px] text-ink-2">
          <p>
            Olimpiada to'xtatiladi va qatnashayotgan{' '}
            <span className="font-semibold text-ink">{number(live.playing)}</span> ishtirokchi uchun test
            yakunlanadi.
          </p>
          <p className="text-[12px] text-ink-3">Bu amaldan keyin olimpiada qayta boshlanmaydi.</p>
        </div>
      </Modal>
    </div>
  )
}
