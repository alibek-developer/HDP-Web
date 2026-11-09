'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Clock3,
  Copy,
  Eye,
  FileQuestion,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Badge, Button, Card, EmptyState, Modal, cn, useToast, type BadgeTone } from '@/components/ui'
import { dateTime, number } from '@/lib/format'
import type { Olympiad, OlympiadStatus } from '@/lib/types'

const STATUS_META: Record<OlympiadStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'REJALASHTIRILGAN', tone: 'info' },
  live: { label: 'DAVOM ETMOQDA', tone: 'danger' },
  finished: { label: 'TUGAGAN', tone: 'gray' },
  draft: { label: 'DRAFT', tone: 'warning' },
}

const FILTERS: Array<{ value: OlympiadStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Barchasi' },
  { value: 'scheduled', label: 'Rejalashtirilgan' },
  { value: 'live', label: 'Davom etmoqda' },
  { value: 'finished', label: 'Tugagan' },
  { value: 'draft', label: 'Draft' },
]

const LivePulse = () => (
  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-error">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
    </span>
    JONLI
  </span>
)

function OlympiadCard({
  olympiad,
  onDelete,
}: {
  olympiad: Olympiad
  onDelete: (olympiad: Olympiad) => void
}) {
  const duplicateOlympiad = useAppStore((state) => state.duplicateOlympiad)
  const { toast } = useToast()
  const meta = STATUS_META[olympiad.status]

  return (
    <Card className={cn('card-hover flex flex-col p-5', olympiad.status === 'live' && 'ring-1 ring-error/15')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {olympiad.status === 'live' ? <LivePulse /> : null}
          <h3 className="mt-1.5 font-display text-lg font-extrabold tracking-[-0.01em] text-ink">{olympiad.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateTime(olympiad.startAt)}
          </p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-canvas p-3">
        <div>
          <p className="flex items-center gap-1 text-[11px] font-medium text-ink-3">
            <Users className="h-3 w-3" /> Ishtirokchilar
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink tabular">{number(olympiad.registered)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[11px] font-medium text-ink-3">
            <FileQuestion className="h-3 w-3" /> Savollar
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink tabular">{olympiad.questionIds.length} ta</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[11px] font-medium text-ink-3">
            <Clock3 className="h-3 w-3" /> Davomiyligi
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink tabular">{olympiad.duration} daqiqa</p>
        </div>
      </div>

      {olympiad.status === 'live' ? (
        <p className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-[12px] font-semibold text-error">
          {number(olympiad.playing)} kishi qatnashmoqda
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        <Link href={`/admin/olympiads/${olympiad.id}`}>
          <Button variant="secondary" size="sm">
            <Eye className="h-3.5 w-3.5" /> Ko'rish
          </Button>
        </Link>
        <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" /> Tahrirlash
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            duplicateOlympiad(olympiad.id)
            toast({ title: 'Nusxa yaratildi', description: `${olympiad.name} draft holatida ko'chirildi.` })
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Nusxa
        </Button>
        <Button variant="ghost" size="sm" className="text-error hover:bg-error-bg" onClick={() => onDelete(olympiad)}>
          <Trash2 className="h-3.5 w-3.5" /> O'chirish
        </Button>
        {olympiad.status === 'live' ? (
          <Link href={`/admin/olympiads/${olympiad.id}/live`} className="ml-auto">
            <Button size="sm" variant="destructive">
              <Radio className="h-3.5 w-3.5" /> Monitoring
            </Button>
          </Link>
        ) : olympiad.status === 'finished' ? (
          <Link href={`/admin/olympiads/${olympiad.id}/results`} className="ml-auto">
            <Button size="sm" variant="secondary">
              <Trophy className="h-3.5 w-3.5" /> Natijalar
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
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

  const filtered = useMemo(() => {
    const list = status === 'all' ? olympiads : olympiads.filter((item) => item.status === status)
    const weight: Record<OlympiadStatus, number> = { live: 0, scheduled: 1, draft: 2, finished: 3 }
    return [...list].sort((left, right) => {
      if (weight[left.status] !== weight[right.status]) return weight[left.status] - weight[right.status]
      return new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
    })
  }, [olympiads, status])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h2 text-ink">Olimpiadalar</h1>
          <p className="mt-1 text-[13px] text-ink-3">Olimpiadalarni yarating, kuzatib boring va natijalarni e'lon qiling.</p>
        </div>
        <Link href="/admin/olympiads/new">
          <Button>
            <Plus className="h-4 w-4" /> Yangi olimpiada
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((item) => {
          const active = status === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition',
                active
                  ? 'border-brand bg-brand-soft text-brand-text'
                  : 'border-line bg-white text-ink-3 hover:border-line-brand hover:text-ink-2',
              )}
            >
              {item.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] tabular', active ? 'bg-white/70' : 'bg-muted')}>
                {counts[item.value] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="Olimpiada topilmadi"
            text="Tanlangan status bo'yicha olimpiada mavjud emas. Yangi olimpiada yarating."
            icon={<Trophy className="h-5 w-5" />}
            action={
              <Link href="/admin/olympiads/new">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> Yangi olimpiada
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((olympiad) => (
            <OlympiadCard key={olympiad.id} olympiad={olympiad} onDelete={setDeleting} />
          ))}
        </div>
      )}

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
    </div>
  )
}
