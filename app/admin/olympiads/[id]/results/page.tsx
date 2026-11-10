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
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { downloadCsv, duration, number, percent } from '@/lib/format'
import { olympiadResultsFor, shortName } from '@/lib/olympiads'
import { useAppStore } from '@/lib/store'

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

  if (!olympiad || results.length === 0) {
    return (
      <PageTransition>
        <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3.5 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2">
          <div className="grid min-h-0 flex-1 place-items-center rounded-[18px] border border-dashed border-line bg-white">
            <EmptyState
              title={olympiad ? "Natijalar hali yo'q" : 'Olimpiada topilmadi'}
              text={
                olympiad
                  ? 'Olimpiada tugagach natijalar shu sahifada paydo bo\'ladi.'
                  : "Bu olimpiada o'chirilgan yoki mavjud emas."
              }
              icon={<Trophy className="h-5 w-5" />}
              action={
                <Link href={`/admin/olympiads${olympiad ? `/${olympiad.id}` : ''}`}>
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {olympiad ? 'Olimpiadaga qaytish' : "Olimpiadalar ro'yxati"}
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </PageTransition>
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
    toast({
      title: 'Natijalar eksport qilindi',
      description: `${number(results.length)} ta natija CSV faylga yozildi.`,
    })
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
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3.5 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2">
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
              <h1 className="h2 truncate text-ink">Natijalar</h1>
              <Badge tone="gray">TUGAGAN</Badge>
              {olympiad.resultsPublished ? (
                <Badge tone="success" dot>
                  E'lon qilingan
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              disabled={certified.length === 0 || certsSent}
              onClick={() => {
                setCertsSent(true)
                toast({
                  title: 'Sertifikatlar yuborildi',
                  description: `${number(certified.length)} ta ishtirokchiga sertifikat yuborildi.`,
                })
              }}
              className="hidden sm:inline-flex"
            >
              <Award className="h-4 w-4" />
              {certsSent ? 'Yuborilgan' : 'Sertifikatlar'}
            </Button>
            <Button variant="secondary" onClick={exportResults} className="h-10 sm:h-11">
              <Download className="h-4 w-4" />
              <span className="max-[360px]:hidden">Eksport</span>
            </Button>
            <Button variant="dark" onClick={() => setTelegramOpen(true)} className="h-10 sm:h-11">
              <Send className="h-4 w-4" />
              <span className="max-[360px]:hidden">E'lon qilish</span>
            </Button>
          </div>
        </div>

        {olympiad.resultsPublished ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-[12px] border border-[#bbf7d0] bg-success-bg px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <p className="min-w-0 flex-1 text-[12px] font-semibold text-success">
              Natijalar e'lon qilingan — ishtirokchilar kabinetda ko'ryapti.
            </p>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-[12px] border border-[#fde68a] bg-warning-bg px-3 py-2">
            <Info className="h-4 w-4 shrink-0 text-warning" />
            <p className="min-w-0 flex-1 text-[12px] font-semibold text-warning">
              Natijalar hali yopiq — {number(results.length)} ta ishtirokchi kutmoqda.
            </p>
            <Button
              size="sm"
              variant="dark"
              onClick={() => {
                publishResults(olympiad.id)
                toast({
                  title: "Natijalar e'lon qilindi",
                  description: 'Barcha ishtirokchilarga ko\'rinadi.',
                })
              }}
            >
              <Send className="h-3.5 w-3.5" /> E'lon qilish
            </Button>
          </div>
        )}

        <div className="grid shrink-0 grid-cols-3 divide-x divide-line-2 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
          {[
            {
              icon: Trophy,
              label: 'Ishtirokchilar',
              value: number(olympiad.registered),
              cls: 'bg-muted text-ink-3',
            },
            {
              icon: CheckCircle2,
              label: "Natija olganlar",
              value: number(results.length),
              cls: 'bg-success-bg text-success',
            },
            {
              icon: Award,
              label: 'Sertifikat',
              value: number(certified.length),
              cls: 'bg-warning-bg text-warning',
            },
          ].map((cell) => {
            const Icon = cell.icon
            return (
              <div key={cell.label} className="min-w-0 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                  <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-[6px]', cell.cls)}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="truncate">{cell.label}</span>
                </div>
                <div className="mt-1 text-[20px] font-geist leading-none tabular-nums text-ink">
                  {cell.value}
                </div>
              </div>
            )
          })}
        </div>

        <section className="shrink-0 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
          <div className="grid grid-cols-3 items-end gap-2 px-3 pb-0 pt-3 sm:gap-4 sm:px-5">
            {podiumOrder.map(({ result, place }) => {
              const rank = place
              return (
                <div
                  key={result.userId}
                  className={cn(
                    'flex min-w-0 flex-col items-center rounded-t-[14px] border border-b-0 px-2 pb-0 pt-3 sm:px-3',
                    rank === 1
                      ? 'border-coin/40 bg-gradient-to-b from-coin-bg to-white'
                      : 'border-line bg-canvas',
                  )}
                >
                  <div className="relative">
                    <Avatar name={result.name} size={rank === 1 ? 'lg' : 'md'} />
                    <span
                      className={cn(
                        'absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ring-2 ring-white',
                        MEDAL_STYLES[rank - 1],
                      )}
                    >
                      {rank}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-full truncate text-[12px] font-semibold text-ink sm:text-[13px]">
                    {shortName(result.name)}
                  </p>
                  <p className="max-w-full truncate text-[10px] text-ink-3">{result.region}</p>
                  <p className="mt-0.5 font-display text-[16px] font-extrabold tabular-nums text-ink sm:text-lg">
                    {result.score}
                    <span className="text-[11px] font-semibold text-ink-3">/{result.total}</span>
                  </p>
                  <div
                    className={cn(
                      'mt-2 w-full rounded-t-md',
                      rank === 1 ? 'bg-coin/80' : rank === 2 ? 'bg-[#94a3b8]/70' : 'bg-[#c2865a]/70',
                    )}
                    style={{ height: rank === 1 ? 40 : rank === 2 ? 28 : 18 }}
                  />
                </div>
              )
            })}
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
          <header className="flex shrink-0 items-center gap-2 border-b border-line-2 px-3 py-2 sm:px-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-brand-soft text-brand-text">
              <Trophy className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-[12.5px] font-bold text-ink">Barcha natijalar</h2>
            <span className="ml-auto text-[10.5px] font-semibold text-ink-3">
              O'rtacha ball: {averageScore.toFixed(1)}/{total}
            </span>
          </header>

          <div className="hidden min-h-0 flex-1 overflow-y-auto [contain:paint] sm:block">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  <th className="w-14 px-4 py-2 font-semibold">O'rin</th>
                  <th className="py-2 pr-3 font-semibold">Ishtirokchi</th>
                  <th className="py-2 pr-3 font-semibold">Ball</th>
                  <th className="py-2 pr-3 font-semibold">Vaqt</th>
                  <th className="py-2 pr-3 font-semibold">Viloyat</th>
                  <th className="px-4 py-2 font-semibold">Sertifikat</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((result, index) => {
                  const rank = (page - 1) * pageSize + index + 1
                  const hasCert = olympiad.certificate && result.score >= olympiad.certMinScore
                  return (
                    <tr key={result.userId} className="border-b border-line-2 last:border-0">
                      <td className="px-4 py-2">
                        {rank <= 3 ? (
                          <span
                            className={cn(
                              'grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold',
                              MEDAL_STYLES[rank - 1],
                            )}
                          >
                            {rank}
                          </span>
                        ) : (
                          <span className="pl-1 text-[11px] font-semibold tabular-nums text-ink-3">
                            {rank}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={result.name} size="sm" />
                          <span className="truncate text-[12.5px] font-semibold text-ink">
                            {result.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-[12.5px] font-semibold tabular-nums text-ink">
                        {result.score}
                        <span className="text-[11px] font-medium text-ink-3">/{result.total}</span>
                        <span className="ml-2 text-[10.5px] font-medium text-ink-3">
                          {percent((result.score / result.total) * 100)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-[11.5px] tabular-nums text-ink-3">
                        {duration(result.timeSeconds)}
                      </td>
                      <td className="py-2 pr-3 text-[11.5px] text-ink-3">{result.region}</td>
                      <td className="px-4 py-2">
                        {hasCert ? (
                          <Badge tone={certsSent ? 'success' : 'warning'} dot>
                            {certsSent ? 'Yuborilgan' : 'Beriladi'}
                          </Badge>
                        ) : (
                          <span className="text-[11.5px] text-ink-3">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ol className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint] sm:hidden">
            {pageRows.map((result, index) => {
              const rank = (page - 1) * pageSize + index + 1
              const hasCert = olympiad.certificate && result.score >= olympiad.certMinScore
              return (
                <li key={result.userId} className="flex items-center gap-2.5 px-3 py-2">
                  <span
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-[7px] text-[10px] font-bold',
                      rank <= 3 ? MEDAL_STYLES[rank - 1] : 'bg-muted text-ink-3',
                    )}
                  >
                    {rank}
                  </span>
                  <Avatar name={result.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{result.name}</p>
                    <p className="text-[10px] text-ink-3">
                      {result.region} · {duration(result.timeSeconds)}
                    </p>
                  </div>
                  {hasCert ? (
                    <Badge tone={certsSent ? 'success' : 'warning'} dot>
                      {certsSent ? 'Yuborilgan' : 'Sertifikat'}
                    </Badge>
                  ) : null}
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">
                    {result.score}
                    <span className="text-[10px] font-semibold text-ink-3">/{result.total}</span>
                  </span>
                </li>
              )
            })}
          </ol>

          <footer className="shrink-0 border-t border-line-2 px-3 py-2">
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={setPage}
              total={results.length}
              pageSize={pageSize}
              label="ta natija"
            />
          </footer>
        </section>

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
              <Input
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                placeholder="@hdp_olympiada"
              />
            </Field>
            <Field label="Xabar">
              <Textarea rows={9} value={telegramMessage} readOnly className="font-mono text-[12px]" />
            </Field>
          </div>
        </Modal>
      </div>
    </PageTransition>
  )
}
