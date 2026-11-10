'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Clock3,
  Copy,
  Crown,
  Eye,
  FileQuestion,
  MoreHorizontal,
  Pencil,
  Radio,
  ShieldAlert,
  Shuffle,
  SlidersHorizontal,
  Trash2,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  DifficultyBadge,
  Dropdown,
  EmptyState,
  Modal,
  cn,
  useToast,
  type BadgeTone,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { MOCK_NOW, date, dateLong, money, number, time, weekday } from '@/lib/format'
import {
  olympiadParticipants,
  participantStatusLabel,
  type ParticipantStatus,
} from '@/lib/olympiads'
import type { Olympiad, OlympiadStatus } from '@/lib/types'

const STATUS_META: Record<OlympiadStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Qoralama', tone: 'warning' },
  scheduled: { label: 'Rejalashtirilgan', tone: 'info' },
  live: { label: 'Jonli', tone: 'danger' },
  finished: { label: 'Yakunlangan', tone: 'gray' },
}

const PARTICIPANT_TONE: Record<ParticipantStatus, BadgeTone> = {
  registered: 'info',
  playing: 'brand',
  finished: 'success',
  left: 'danger',
}

const AUDIENCE_META = {
  all: { label: 'Hamma', icon: Users },
  pro: { label: 'Faqat Pro', icon: Crown },
  group: { label: 'Maxsus guruh', icon: UsersRound },
} as const

const REVEAL_LABEL: Record<Olympiad['resultReveal'], string> = {
  now: 'Har bir savoldan keyin',
  after: 'Olimpiada tugagandan keyin',
  manual: "Qo'lda e'lon qilganda",
}

const rewardPool = (olympiad: Olympiad) => olympiad.rewards.reduce((sum, value) => sum + value, 0)

const minutesLeft = (olympiad: Olympiad) =>
  Math.max(
    0,
    Math.round((new Date(olympiad.startAt).getTime() + olympiad.duration * 60_000 - MOCK_NOW.getTime()) / 60_000),
  )

function SettingRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: BadgeTone
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-canvas">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-muted text-ink-3">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-2">{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  )
}

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-muted text-ink-3">{icon}</span>
      <span className="min-w-0 flex-1 text-[11.5px] text-ink-3">{label}</span>
      <span className="shrink-0 text-right text-[12.5px] font-semibold text-ink">{value}</span>
    </div>
  )
}

export default function OlympiadDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const olympiad = useAppStore((state) => state.olympiads.find((item) => item.id === params.id))
  const users = useAppStore((state) => state.users)
  const tests = useAppStore((state) => state.tests)
  const certTemplates = useAppStore((state) => state.certTemplates)
  const duplicateOlympiad = useAppStore((state) => state.duplicateOlympiad)
  const deleteOlympiad = useAppStore((state) => state.deleteOlympiad)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const questions = useMemo(() => {
    if (!olympiad) return []
    return olympiad.questionIds
      .map((id) => tests.find((test) => test.id === id))
      .filter(Boolean) as NonNullable<(typeof tests)[number]>[]
  }, [olympiad, tests])

  const participants = useMemo(() => (olympiad ? olympiadParticipants(olympiad, users) : []), [olympiad, users])

  if (!olympiad) {
    return (
      <PageTransition>
        <div className="flex h-[calc(100dvh-177px)] min-[430px]:h-[calc(100dvh-153px)] sm:h-[calc(100dvh-161px)]">
          <div className="grid h-full w-full place-items-center rounded-[16px] border border-dashed border-line bg-white/60 px-4">
            <EmptyState
              title="Olimpiada topilmadi"
              text="Bu olimpiada o'chirilgan yoki mavjud emas."
              icon={<Trophy className="h-5 w-5" />}
              action={
                <Link href="/admin/olympiads">
                  <Button size="sm" variant="secondary">
                    <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </PageTransition>
    )
  }

  const meta = STATUS_META[olympiad.status]
  const pool = rewardPool(olympiad)
  const previewQuestions = questions.slice(0, 8)
  const previewParticipants = participants.slice(0, 6)
  const audience = AUDIENCE_META[olympiad.audience]
  const AudienceIcon = audience.icon
  const templateName = certTemplates.find((template) => template.id === olympiad.certTemplate)?.name ?? '—'
  const remaining = minutesLeft(olympiad)

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3.5 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
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
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="h2 min-w-0 truncate text-ink">{olympiad.name}</h1>
              <Badge tone={meta.tone} dot>
                {meta.label}
              </Badge>
              {olympiad.resultsPublished ? (
                <Badge tone="success" dot>
                  Natijalar e'lon qilingan
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 hidden truncate text-[12px] text-ink-3 sm:block">
              {olympiad.description || "Tavsif kiritilmagan."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {olympiad.status === 'live' ? (
              <>
                <Link href={`/admin/olympiads/${olympiad.id}/edit`} className="hidden sm:inline-flex">
                  <Button variant="ghost">
                    <Pencil className="h-4 w-4" /> Tahrirlash
                  </Button>
                </Link>
                <Link href={`/admin/olympiads/${olympiad.id}/live`}>
                  <Button className="h-10 rounded-[11px] sm:h-11">
                    <Radio className="h-4 w-4" /> Monitoring
                  </Button>
                </Link>
              </>
            ) : olympiad.status === 'finished' ? (
              <>
                <Link href={`/admin/olympiads/${olympiad.id}/edit`} className="hidden sm:inline-flex">
                  <Button variant="ghost">
                    <Pencil className="h-4 w-4" /> Tahrirlash
                  </Button>
                </Link>
                <Link href={`/admin/olympiads/${olympiad.id}/results`}>
                  <Button className="h-10 rounded-[11px] sm:h-11">
                    <Trophy className="h-4 w-4" /> Natijalar
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
                <Button className="h-10 rounded-[11px] sm:h-11">
                  <Pencil className="h-4 w-4" />
                  {olympiad.status === 'draft' ? 'Davom ettirish' : 'Tahrirlash'}
                </Button>
              </Link>
            )}
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Boshqa amallar"
                  className="grid h-10 w-10 place-items-center rounded-[11px] border border-line bg-white text-ink-3 transition hover:border-line-brand hover:text-ink sm:h-11 sm:w-11"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
              items={[
                {
                  label: 'Nusxa yaratish',
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onClick: () => {
                    duplicateOlympiad(olympiad.id)
                    toast({
                      title: 'Nusxa yaratildi',
                      description: `${olympiad.name} qoralama sifatida saqlandi.`,
                    })
                  },
                },
                { separator: true, label: 'sep' },
                {
                  label: "O'chirish",
                  danger: true,
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: () => setConfirmDelete(true),
                },
              ]}
            />
          </div>
        </header>

        {olympiad.status === 'live' ? (
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[14px] bg-ink px-4 py-2.5 text-white">
            <span className="inline-flex items-center gap-1.5 font-geist text-[10px] font-bold uppercase tracking-[0.14em] text-brand-light">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
              </span>
              Jonli efir
            </span>
            <span className="text-[12px] text-white/70">
              <b className="font-bold text-white tabular">{number(olympiad.playing)}</b> kishi qatnashmoqda
            </span>
            <span className="hidden text-[12px] text-white/45 sm:inline">·</span>
            <span className="hidden text-[12px] text-white/70 sm:inline">
              <b className="font-bold text-white tabular">{remaining}</b> daqiqa qoldi
            </span>
            <Link
              href={`/admin/olympiads/${olympiad.id}/live`}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 font-geist text-[12px] font-bold text-ink transition hover:bg-brand-soft"
            >
              <Eye className="h-3.5 w-3.5" /> Kuzatish
            </Link>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 xl:grid-cols-[minmax(0,1fr)_304px] xl:grid-rows-1">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-0.5 [contain:paint] xl:overflow-visible xl:pr-0">
            <section className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-white shadow-card xl:min-h-0 xl:flex-1">
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line-2 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-brand-text">
                    <FileQuestion className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-bold leading-tight text-ink">Savollar</h2>
                    <p className="hidden text-[11px] text-ink-3 sm:block">
                      {questions.length > 0
                        ? `${number(questions.length)} ta savol tanlangan`
                        : "Hali savollar tanlanmagan"}
                    </p>
                  </div>
                </div>
                <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                  </Button>
                </Link>
              </header>
              <div className="px-3 py-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:[contain:paint]">
                {previewQuestions.length === 0 ? (
                  <div className="grid h-full min-h-[180px] place-items-center px-4 text-center">
                    <EmptyState
                      title="Savollar tanlanmagan"
                      text="Olimpiada uchun test bazadan savollarni tanlang."
                      icon={<FileQuestion className="h-5 w-5" />}
                    />
                  </div>
                ) : (
                  <ol className="divide-y divide-line-2">
                    {previewQuestions.map((test, index) => (
                      <li key={test.id} className="flex items-center gap-2.5 py-2.5">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted font-geist text-[11px] font-semibold text-ink-3 tabular">
                          {index + 1}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{test.question}</p>
                        <DifficultyBadge level={test.difficulty} />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              {questions.length > previewQuestions.length ? (
                <footer className="shrink-0 border-t border-line-2 px-4 py-2 text-center sm:px-5">
                  <Link
                    href={`/admin/olympiads/${olympiad.id}/edit`}
                    className="text-[11.5px] font-semibold text-brand-text transition hover:text-brand"
                  >
                    Yana {questions.length - previewQuestions.length} ta savol — tahrirlashda ko'ring
                  </Link>
                </footer>
              ) : null}
            </section>

            <section className="hidden flex-col overflow-hidden rounded-[16px] border border-line bg-white shadow-card min-[1000px]:flex xl:min-h-0 xl:flex-1">
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line-2 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-brand-text">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-bold leading-tight text-ink">Ishtirokchilar</h2>
                    <p className="hidden text-[11px] text-ink-3 sm:block">
                      {number(olympiad.registered)} kishi ro'yxatdan o'tgan
                    </p>
                  </div>
                </div>
                <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Users className="h-3.5 w-3.5" /> Barchasi
                  </Button>
                </Link>
              </header>
              <div className="px-3 py-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:[contain:paint]">
                {previewParticipants.length === 0 ? (
                  <div className="grid h-full min-h-[160px] place-items-center px-4 text-center">
                    <EmptyState
                      title="Ishtirokchilar yo'q"
                      text="Olimpiada e'lon qilingach ro'yxatdan o'tish ochiladi."
                      icon={<Users className="h-5 w-5" />}
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-line-2">
                    {previewParticipants.map((row) => (
                      <li key={row.user.id} className="flex items-center gap-2.5 py-2">
                        <Avatar name={row.user.name} tone={row.user.tone} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{row.user.name}</p>
                          <p className="truncate text-[11px] text-ink-3">@{row.user.username}</p>
                        </div>
                        <Badge tone={PARTICIPANT_TONE[row.status]}>{participantStatusLabel[row.status]}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-0.5 [contain:paint] xl:overflow-visible xl:pr-0">
            <section className="shrink-0 rounded-[16px] border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-[62px] w-[56px] shrink-0 flex-col items-center justify-center rounded-[12px] border border-line-2 bg-canvas">
                  <span className="font-geist text-[8.5px] font-bold uppercase tracking-[0.12em] text-ink-3">
                    {weekday(olympiad.startAt).slice(0, 3)}
                  </span>
                  <span className="font-geist text-[22px] font-extrabold leading-[1.05] tabular text-ink">
                    {date(olympiad.startAt).split('.')[0]}
                  </span>
                  <span className="font-geist text-[9px] font-semibold tabular text-ink-3">
                    {time(olympiad.startAt)}
                  </span>
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="font-geist text-[15px] font-extrabold leading-tight text-ink">
                    {weekday(olympiad.startAt)}, {dateLong(olympiad.startAt)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink-3">
                    Soat {time(olympiad.startAt)} da boshlanadi · {olympiad.duration} daqiqa
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-line-2 pt-1.5">
                <FactRow icon={<Clock3 className="h-3.5 w-3.5" />} label="Davomiyligi" value={`${olympiad.duration} daq`} />
                <FactRow icon={<AudienceIcon className="h-3.5 w-3.5" />} label="Auditoriya" value={audience.label} />
                <FactRow
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label="Viloyat"
                  value={olympiad.regionLimit || 'Barchasi'}
                />
                <FactRow
                  icon={<Award className="h-3.5 w-3.5" />}
                  label="Sinf"
                  value={olympiad.gradeLimit || 'Barchasi'}
                />
              </div>
            </section>

            <section className="shrink-0 rounded-[16px] border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-bold text-ink">Sovrinlar</h3>
                <span className="rounded-full bg-coin-bg px-2 py-0.5 font-geist text-[10.5px] font-bold tabular text-[#b45309]">
                  {money(pool)}
                </span>
              </div>
              <div className="space-y-1.5">
                {olympiad.rewards.map((reward, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2',
                      index === 0 ? 'border-coin/30 bg-coin-bg/60' : 'border-line-2 bg-canvas/60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full font-geist text-[11px] font-bold text-white',
                        index === 0 ? 'bg-coin' : index === 1 ? 'bg-[#94a3b8]' : 'bg-[#c2865a]',
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 text-[12px] font-medium text-ink-3">{index + 1}-o'rin</span>
                    <span className="text-[12.5px] font-bold text-ink tabular">{money(reward)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="shrink-0 rounded-[16px] border border-line bg-white shadow-card">
              <div className="border-b border-line-2 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-brand-text">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold leading-tight text-ink">Sozlamalar</h3>
                    <p className="hidden text-[11px] text-ink-3 sm:block">O'yin qoidalari</p>
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 p-2">
                <SettingRow
                  icon={<Shuffle className="h-3.5 w-3.5" />}
                  label="Savollarni aralashtirish"
                  value={olympiad.shuffleQuestions ? 'Yoqilgan' : "O'chiq"}
                  tone={olympiad.shuffleQuestions ? 'success' : 'gray'}
                />
                <SettingRow
                  icon={<Shuffle className="h-3.5 w-3.5" />}
                  label="Variantlarni aralashtirish"
                  value={olympiad.shuffleOptions ? 'Yoqilgan' : "O'chiq"}
                  tone={olympiad.shuffleOptions ? 'success' : 'gray'}
                />
                <SettingRow
                  icon={<Eye className="h-3.5 w-3.5" />}
                  label="Natijani ko'rsatish"
                  value={REVEAL_LABEL[olympiad.resultReveal]}
                  tone="info"
                />
                <SettingRow
                  icon={<ShieldAlert className="h-3.5 w-3.5" />}
                  label="Screenshot bloklash"
                  value={olympiad.blockScreenshot ? 'Yoqilgan' : "O'chiq"}
                  tone={olympiad.blockScreenshot ? 'success' : 'gray'}
                />
                <SettingRow
                  icon={<Award className="h-3.5 w-3.5" />}
                  label="Sertifikat"
                  value={olympiad.certificate ? `${olympiad.certMinScore} ball · ${templateName}` : "O'chiq"}
                  tone={olympiad.certificate ? 'success' : 'gray'}
                />
              </div>
            </section>
          </aside>
        </div>

        {olympiad.status !== 'live' && participants.length > 0 ? (
          <section className="hidden shrink-0 flex-wrap items-center gap-x-5 gap-y-1 rounded-[14px] border border-line bg-white px-4 py-2.5 min-[1000px]:flex">
            {(
              [
                ['registered', olympiad.registered],
                ['playing', olympiad.playing],
                ['finished', olympiad.finished],
                ['left', olympiad.left],
              ] as Array<[ParticipantStatus, number]>
            ).map(([status, value]) => (
              <span key={status} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-3">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    status === 'playing'
                      ? 'bg-brand'
                      : status === 'finished'
                        ? 'bg-success'
                        : status === 'left'
                          ? 'bg-error'
                          : 'bg-info',
                  )}
                />
                {participantStatusLabel[status]}
                <b className="font-bold text-ink tabular">{number(value)}</b>
              </span>
            ))}
            <Link
              href={`/admin/olympiads/${olympiad.id}/edit`}
              className="ml-auto text-[11.5px] font-semibold text-brand-text transition hover:text-brand"
            >
              To'liq ro'yxat →
            </Link>
          </section>
        ) : null}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Olimpiadani o'chirish"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-10"
              onClick={() => {
                deleteOlympiad(olympiad.id)
                toast({ title: "Olimpiada o'chirildi", description: olympiad.name, tone: 'warning' })
                router.push('/admin/olympiads')
              }}
            >
              <Trash2 className="h-4 w-4" /> O'chirish
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold text-ink">{olympiad.name}</span> olimpiadasi butunlay o'chiriladi.
          Ishtirokchilar va natijalar ham o'chib ketadi. Bu amalni bekor qilish mumkin emas.
        </p>
      </Modal>
    </PageTransition>
  )
}
