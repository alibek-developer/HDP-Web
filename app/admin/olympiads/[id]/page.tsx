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
  Eye,
  FileQuestion,
  Lock,
  MapPin,
  Pencil,
  Radio,
  Settings2,
  Shuffle,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DifficultyBadge,
  EmptyState,
  Modal,
  SectionCard,
  StatCard,
  cn,
  useToast,
  type BadgeTone,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, money, number } from '@/lib/format'
import {
  olympiadParticipants,
  participantStatusLabel,
  type ParticipantStatus,
} from '@/lib/olympiads'
import type { OlympiadStatus } from '@/lib/types'

const STATUS_META: Record<OlympiadStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'REJALASHTIRILGAN', tone: 'info' },
  live: { label: 'DAVOM ETMOQDA', tone: 'danger' },
  finished: { label: 'TUGAGAN', tone: 'gray' },
  draft: { label: 'DRAFT', tone: 'warning' },
}

const PARTICIPANT_TONE: Record<ParticipantStatus, BadgeTone> = {
  registered: 'info',
  playing: 'brand',
  finished: 'success',
  left: 'danger',
}

const AUDIENCE_LABEL = {
  all: 'Hamma',
  pro: 'Faqat Pro',
  group: 'Maxsus guruh',
}

const REVEAL_LABEL = {
  now: 'Darhol',
  after: 'Olimpiada tugagandan keyin',
  manual: "Qo'lda e'lon qilganda",
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

  const questionPreview = useMemo(() => {
    if (!olympiad) return []
    return olympiad.questionIds
      .map((id) => tests.find((test) => test.id === id))
      .filter(Boolean)
      .slice(0, 6)
  }, [olympiad, tests])

  const participantPreview = useMemo(
    () => (olympiad ? olympiadParticipants(olympiad, users).slice(0, 5) : []),
    [olympiad, users],
  )

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

  const meta = STATUS_META[olympiad.status]
  const rewardPool = olympiad.rewards.reduce((sum, value) => sum + value, 0)
  const templateName =
    certTemplates.find((template) => template.id === olympiad.certTemplate)?.name ?? '—'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/olympiads"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="h2 text-ink">{olympiad.name}</h1>
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {olympiad.resultsPublished ? <Badge tone="success">Natijalar e'lon qilingan</Badge> : null}
          </div>
          <p className="mt-1 text-[13px] text-ink-3">{olympiad.description || "Tavsif kiritilmagan."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              duplicateOlympiad(olympiad.id)
              toast({ title: 'Nusxa yaratildi', description: `${olympiad.name} draft holatida ko'chirildi.` })
            }}
          >
            <Copy className="h-4 w-4" /> Nusxa
          </Button>
          <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" /> Tahrirlash
            </Button>
          </Link>
          {olympiad.status === 'live' ? (
            <Link href={`/admin/olympiads/${olympiad.id}/live`}>
              <Button variant="destructive">
                <Radio className="h-4 w-4" /> Jonli monitoring
              </Button>
            </Link>
          ) : olympiad.status === 'finished' ? (
            <Link href={`/admin/olympiads/${olympiad.id}/results`}>
              <Button>
                <Trophy className="h-4 w-4" /> Natijalar
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {olympiad.status === 'live' ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#fecaca] bg-error-bg px-4 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
          </span>
          <p className="text-[13px] font-semibold text-error">
            JONLI — {number(olympiad.playing)} kishi qatnashmoqda
          </p>
          <Link href={`/admin/olympiads/${olympiad.id}/live`} className="ml-auto">
            <Button size="sm" variant="destructive">
              <Eye className="h-3.5 w-3.5" /> Kuzatish
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ro'yxatdan o'tgan"
          value={number(olympiad.registered)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Savollar"
          value={`${olympiad.questionIds.length} ta`}
          icon={<FileQuestion className="h-5 w-5" />}
          iconClass="bg-info-bg text-info"
        />
        <StatCard
          label="Davomiyligi"
          value={`${olympiad.duration} daq`}
          icon={<Clock3 className="h-5 w-5" />}
          iconClass="bg-coin-bg text-[#b45309]"
        />
        <StatCard
          label="Sovrin jamg'armasi"
          value={money(rewardPool)}
          icon={<Trophy className="h-5 w-5" />}
          iconClass="bg-warning-bg text-warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <SectionCard
            title="Savollar"
            subtitle={`${olympiad.questionIds.length} ta savol tanlangan`}
            action={
              <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                </Button>
              </Link>
            }
          >
            {questionPreview.length === 0 ? (
              <EmptyState
                title="Savollar tanlanmagan"
                text="Olimpiada savollarini tahrirlash sahifasida qo'shing."
                icon={<FileQuestion className="h-5 w-5" />}
              />
            ) : (
              <div className="space-y-2">
                {questionPreview.map((test, index) => (
                  <div
                    key={test!.id}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-semibold text-ink-3 tabular">
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{test!.question}</p>
                    <DifficultyBadge level={test!.difficulty} />
                  </div>
                ))}
                {olympiad.questionIds.length > questionPreview.length ? (
                  <p className="pt-1 text-center text-[12px] text-ink-3">
                    yana {olympiad.questionIds.length - questionPreview.length} ta savol
                  </p>
                ) : null}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Ishtirokchilar"
            subtitle={`${number(olympiad.registered)} kishi ro'yxatdan o'tgan`}
            action={
              <Link href={`/admin/olympiads/${olympiad.id}/edit`}>
                <Button size="sm" variant="ghost">
                  <Users className="h-3.5 w-3.5" /> Barchasi
                </Button>
              </Link>
            }
          >
            {participantPreview.length === 0 ? (
              <EmptyState
                title="Hali ishtirokchilar yo'q"
                text="Olimpiada e'lon qilingach ro'yxatdan o'tish boshlanadi."
                icon={<Users className="h-5 w-5" />}
              />
            ) : (
              <div className="space-y-1">
                {participantPreview.map((row) => (
                  <div key={row.user.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                    <Avatar name={row.user.name} tone={row.user.tone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{row.user.name}</p>
                      <p className="truncate text-[11px] text-ink-3">@{row.user.username}</p>
                    </div>
                    <Badge tone={PARTICIPANT_TONE[row.status]}>{participantStatusLabel[row.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Ma'lumotlar">
            <dl className="space-y-3 text-[13px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-3">
                  <CalendarDays className="h-3.5 w-3.5" /> Boshlanish
                </dt>
                <dd className="text-right font-semibold text-ink">{dateTime(olympiad.startAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-3">
                  <Users className="h-3.5 w-3.5" /> Auditoriya
                </dt>
                <dd className="text-right font-semibold text-ink">{AUDIENCE_LABEL[olympiad.audience]}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-3">
                  <MapPin className="h-3.5 w-3.5" /> Viloyat
                </dt>
                <dd className="text-right font-semibold text-ink">{olympiad.regionLimit || 'Barchasi'}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-3">
                  <Award className="h-3.5 w-3.5" /> Sinf
                </dt>
                <dd className="text-right font-semibold text-ink">{olympiad.gradeLimit || 'Barchasi'}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Sovrinlar">
            <div className="space-y-2">
              {olympiad.rewards.map((reward, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2',
                    index === 0 ? 'border-coin/30 bg-coin-bg' : 'border-line bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white',
                      index === 0 ? 'bg-coin' : index === 1 ? 'bg-[#94a3b8]' : 'bg-[#c2865a]',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 text-[12px] font-medium text-ink-3">{index + 1}-o'rin</span>
                  <span className="text-[13px] font-bold text-ink tabular">{money(reward)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Sozlamalar">
            <ul className="space-y-2.5 text-[13px]">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Shuffle className="h-3.5 w-3.5" /> Savollarni aralashtirish
                </span>
                <Badge tone={olympiad.shuffleQuestions ? 'success' : 'gray'}>
                  {olympiad.shuffleQuestions ? 'Yoqilgan' : "O'chirilgan"}
                </Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Shuffle className="h-3.5 w-3.5" /> Variantlarni aralashtirish
                </span>
                <Badge tone={olympiad.shuffleOptions ? 'success' : 'gray'}>
                  {olympiad.shuffleOptions ? 'Yoqilgan' : "O'chirilgan"}
                </Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Settings2 className="h-3.5 w-3.5" /> Natija ko'rsatish
                </span>
                <span className="text-right text-[12px] font-semibold text-ink">
                  {REVEAL_LABEL[olympiad.resultReveal]}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Lock className="h-3.5 w-3.5" /> Screenshot bloklash
                </span>
                <Badge tone={olympiad.blockScreenshot ? 'success' : 'gray'}>
                  {olympiad.blockScreenshot ? 'Yoqilgan' : "O'chirilgan"}
                </Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Award className="h-3.5 w-3.5" /> Sertifikat
                </span>
                <span className="text-right text-[12px] font-semibold text-ink">
                  {olympiad.certificate ? `${olympiad.certMinScore} ball · ${templateName}` : "O'chirilgan"}
                </span>
              </li>
            </ul>
          </SectionCard>

          <Button
            variant="ghost"
            className="w-full text-error hover:bg-error-bg"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" /> Olimpiadani o'chirish
          </Button>
        </div>
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
          Ishtirokchilar va natijalar ham o'chib ketadi.
        </p>
      </Modal>
    </div>
  )
}
