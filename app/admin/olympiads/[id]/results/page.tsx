'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Download,
  Info,
  Send,
  Trophy,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  SectionCard,
  StatCard,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { downloadCsv, duration, number, percent } from '@/lib/format'
import { olympiadResultsFor, shortName } from '@/lib/olympiads'

const MEDAL_STYLES = [
  'bg-coin text-white',
  'bg-[#94a3b8] text-white',
  'bg-[#c2865a] text-white',
]

export default function OlympiadResultsPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const olympiad = useAppStore((state) => state.olympiads.find((item) => item.id === params.id))
  const users = useAppStore((state) => state.users)
  const publishResults = useAppStore((state) => state.publishResults)
  const [page, setPage] = useState(1)
  const [certsSent, setCertsSent] = useState(false)
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [channel, setChannel] = useState('@hdp_olympiada')
  const pageSize = 20

  const results = useMemo(() => (olympiad ? olympiadResultsFor(olympiad, users) : []), [olympiad, users])
  const total = olympiad?.questionIds.length || results[0]?.total || 30
  const podium = results.slice(0, 3)
  const certified = olympiad?.certificate
    ? results.filter((result) => result.score >= olympiad.certMinScore)
    : []
  const averageScore = results.length
    ? results.reduce((sum, result) => sum + result.score, 0) / results.length
    : 0

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

  if (results.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Natijalar hali yo'q"
          text="Olimpiada tugagach natijalar shu sahifada paydo bo'ladi."
          icon={<Trophy className="h-5 w-5" />}
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

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize))
  const pageRows = results.slice((page - 1) * pageSize, page * pageSize)

  const podiumOrder = [
    { result: podium[1], place: 2 },
    { result: podium[0], place: 1 },
    { result: podium[2], place: 3 },
  ].filter((item) => item.result)

  const exportResults = () => {
    downloadCsv(`olimpiada-${olympiad.id}-natijalar.csv`, [
      ["O'rin", 'Ism', 'Ball', 'Vaqt (sekund)', 'Viloyat', 'Sertifikat'],
      ...results.map((result, index) => [
        index + 1,
        result.name,
        `${result.score}/${result.total}`,
        result.timeSeconds,
        result.region,
        result.score >= olympiad.certMinScore ? 'Ha' : "Yo'q",
      ]),
    ])
    toast({ title: 'Natijalar eksport qilindi', description: `${number(results.length)} ta natija CSV faylga yozildi.` })
  }

  const telegramMessage = [
    `🏆 ${olympiad.name} natijalari e'lon qilindi!`,
    '',
    ...podium.map((result, index) => {
      const icon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
      return `${icon} ${result.name} — ${result.score}/${result.total}`
    }),
    '',
    `To'liq natijalar: hdp.uz/olympiad/${olympiad.id}`,
  ].join('\n')

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
            <h1 className="h2 text-ink">Natijalar — {olympiad.name}</h1>
            <Badge tone="gray">TUGAGAN</Badge>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            {number(results.length)} ta natija · O'rtacha ball: {averageScore.toFixed(1)}/{total}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={certified.length === 0 || certsSent}
            onClick={() => {
              setCertsSent(true)
              toast({
                title: 'Sertifikatlar yuborildi',
                description: `${number(certified.length)} ta ishtirokchiga sertifikat yuborildi.`,
              })
            }}
          >
            <Award className="h-4 w-4" />
            {certsSent ? 'Sertifikatlar yuborilgan' : 'Sertifikatlarni yuborish'}
          </Button>
          <Button variant="secondary" onClick={exportResults}>
            <Download className="h-4 w-4" /> Eksport
          </Button>
          <Button variant="dark" onClick={() => setTelegramOpen(true)}>
            <Send className="h-4 w-4" /> E'lon qilish
          </Button>
        </div>
      </div>

      {olympiad.resultsPublished ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#bbf7d0] bg-success-bg px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-[13px] font-semibold text-success">Natijalar e'lon qilindi</p>
          <p className="text-[12px] text-success/80">Ishtirokchilar natijalarni shaxsiy kabinetda ko'rishlari mumkin.</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#fde68a] bg-warning-bg px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-warning">Natijalar hali e'lon qilinmagan</p>
            <p className="text-[12px] text-warning/80">Ishtirokchilar natijalarni hozircha ko'rmayapti.</p>
          </div>
          <Button
            size="sm"
            variant="dark"
            onClick={() => {
              publishResults(olympiad.id)
              toast({ title: "Natijalar e'lon qilindi", description: "Barcha ishtirokchilarga ko'rinadi." })
            }}
          >
            <Send className="h-3.5 w-3.5" /> E'lon qilish
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Ishtirokchilar"
          value={number(olympiad.registered)}
          icon={<Trophy className="h-5 w-5" />}
        />
        <StatCard
          label="Natija olganlar"
          value={number(results.length)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-success-bg text-success"
        />
        <StatCard
          label="Sertifikat oluvchilar"
          value={number(certified.length)}
          icon={<Award className="h-5 w-5" />}
          iconClass="bg-warning-bg text-warning"
          hint={olympiad.certificate ? `${olympiad.certMinScore} balldan yuqori` : "Sertifikat o'chirilgan"}
        />
      </div>

      <SectionCard title="G'oliblar" subtitle="Top 3 ishtirokchi">
        <div className="grid grid-cols-3 items-end gap-2 pt-2 sm:gap-4">
          {podiumOrder.map(({ result, place }) => {
            const rank = place
            return (
              <div
                key={result.userId}
                className={cn(
                  'flex min-w-0 flex-col items-center rounded-2xl border px-2 pb-0 pt-4 sm:px-3',
                  rank === 1
                    ? 'border-coin/40 bg-gradient-to-b from-coin-bg to-white'
                    : 'border-line bg-white',
                )}
              >
                <div className="relative">
                  <Avatar name={result.name} size="lg" />
                  <span
                    className={cn(
                      'absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ring-2 ring-white',
                      MEDAL_STYLES[rank - 1],
                    )}
                  >
                    {rank}
                  </span>
                </div>
                <p className="mt-2.5 max-w-full truncate text-[13px] font-semibold text-ink">
                  {shortName(result.name)}
                </p>
                <p className="max-w-full truncate text-[11px] text-ink-3">{result.region}</p>
                <p className="mt-1 font-display text-lg font-extrabold text-ink tabular sm:text-xl">
                  {result.score}
                  <span className="text-[12px] font-semibold text-ink-3">/{result.total}</span>
                </p>
                <div
                  className={cn(
                    'mt-3 w-full rounded-t-lg',
                    rank === 1 ? 'bg-coin/80' : rank === 2 ? 'bg-[#94a3b8]/70' : 'bg-[#c2865a]/70',
                  )}
                  style={{ height: rank === 1 ? 58 : rank === 2 ? 42 : 30 }}
                />
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Barcha natijalar" subtitle={`${number(results.length)} ta ishtirokchi`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.03em] text-ink-3">
                <th className="w-16 pb-2.5 pr-3 font-semibold">O'rin</th>
                <th className="pb-2.5 pr-3 font-semibold">Ishtirokchi</th>
                <th className="pb-2.5 pr-3 font-semibold">Ball</th>
                <th className="pb-2.5 pr-3 font-semibold">Vaqt</th>
                <th className="pb-2.5 pr-3 font-semibold">Viloyat</th>
                <th className="pb-2.5 font-semibold">Sertifikat</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((result, index) => {
                const rank = (page - 1) * pageSize + index + 1
                const hasCert = olympiad.certificate && result.score >= olympiad.certMinScore
                return (
                  <tr key={result.userId} className="border-b border-line-2 last:border-0">
                    <td className="py-2.5 pr-3">
                      {rank <= 3 ? (
                        <span
                          className={cn(
                            'grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold',
                            MEDAL_STYLES[rank - 1],
                          )}
                        >
                          {rank}
                        </span>
                      ) : (
                        <span className="pl-2 text-[12px] font-semibold text-ink-3 tabular">{rank}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={result.name} size="sm" />
                        <span className="text-[13px] font-semibold text-ink">{result.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-[13px] font-semibold text-ink tabular">
                      {result.score}
                      <span className="text-[11px] font-medium text-ink-3">/{result.total}</span>
                      <span className="ml-2 text-[11px] font-medium text-ink-3">
                        {percent((result.score / result.total) * 100)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] text-ink-3 tabular">{duration(result.timeSeconds)}</td>
                    <td className="py-2.5 pr-3 text-[12px] text-ink-3">{result.region}</td>
                    <td className="py-2.5">
                      {hasCert ? (
                        <Badge tone={certsSent ? 'success' : 'warning'} dot>
                          {certsSent ? 'Yuborilgan' : 'Beriladi'}
                        </Badge>
                      ) : (
                        <span className="text-[12px] text-ink-3">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Pagination
            page={page}
            pageCount={pageCount}
            onChange={setPage}
            total={results.length}
            pageSize={pageSize}
            label="ta natija"
          />
        </div>
      </SectionCard>

      <Modal
        open={telegramOpen}
        onClose={() => setTelegramOpen(false)}
        title="Telegram kanalga e'lon qilish"
        description="Natijalar kanalga post sifatida yuboriladi."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTelegramOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                publishResults(olympiad.id)
                setTelegramOpen(false)
                toast({
                  title: 'Telegram kanalga yuborildi',
                  description: `${channel} kanalida natijalar e'lon qilindi.`,
                })
              }}
            >
              <Send className="h-4 w-4" /> Yuborish
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Kanal">
            <Input value={channel} onChange={(event) => setChannel(event.target.value)} placeholder="@hdp_olympiada" />
          </Field>
          <Field label="Xabar">
            <Textarea rows={9} value={telegramMessage} readOnly className="font-mono text-[12px]" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
