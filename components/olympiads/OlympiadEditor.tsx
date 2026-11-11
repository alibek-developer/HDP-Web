'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Crown,
  FileQuestion,
  FileText,
  Globe2,
  GripVertical,
  ListChecks,
  Loader2,
  Plus,
  Save,
  SlidersHorizontal,
  Upload,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DifficultyBadge,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Pagination,
  ProgressBar,
  SearchInput,
  Select,
  Textarea,
  cn,
  useToast,
  type BadgeTone,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { REGION_NAMES } from '@/lib/mock'
import { date, dateLong, dateTimeInput, downloadCsv, money, number, time } from '@/lib/format'
import {
  olympiadParticipants,
  participantStatusLabel,
  type ParticipantStatus,
} from '@/lib/olympiads'
import type { Olympiad, Test } from '@/lib/types'

type TabKey = 'main' | 'questions' | 'participants' | 'settings'

const MONTHS = ['YAN', 'FEV', 'MAR', 'APR', 'MAY', 'IYN', 'IYL', 'AVG', 'SEN', 'OKT', 'NOY', 'DEK']

const STATUS_META: Record<Olympiad['status'], { label: string; tone: BadgeTone; hint: string }> = {
  draft: {
    label: 'Qoralama',
    tone: 'warning',
    hint: "Faqat adminlar ko'radi. Tayyor bo'lgach holatni o'zgartiring.",
  },
  scheduled: {
    label: 'Rejalashtirilgan',
    tone: 'info',
    hint: "Belgilangan vaqtda avtomatik ochiladi va ishtirokchilarga ko'rinadi.",
  },
  live: {
    label: 'Jonli',
    tone: 'danger',
    hint: "Hozir davom etmoqda. Savollarni o'zgartirish tavsiya etilmaydi.",
  },
  finished: {
    label: 'Yakunlangan',
    tone: 'gray',
    hint: 'Natijalar e’lon qilingan va ishtirokchilar uchun yopiq.',
  },
}

const AUDIENCES: Array<{
  value: Olympiad['audience']
  label: string
  hint: string
  icon: typeof Globe2
}> = [
  { value: 'all', label: 'Hamma', hint: "Barcha ro'yxatdan o'tganlar", icon: Globe2 },
  { value: 'pro', label: 'Faqat Pro', hint: 'Pro tarif egalari', icon: Crown },
  { value: 'group', label: 'Maxsus guruh', hint: "Tanlangan guruh a'zolari", icon: UsersRound },
]

const REVEAL_OPTIONS: Array<{ value: Olympiad['resultReveal']; label: string; hint: string }> = [
  { value: 'now', label: 'Darhol', hint: "Har bir savoldan keyin natijani ko'rsatish" },
  { value: 'after', label: 'Olimpiada tugagandan keyin', hint: 'Barcha ishtirokchilar tugatgach' },
  { value: 'manual', label: "Qo'lda e'lon qilganda", hint: "Admin natijalarni o'zi e'lon qiladi" },
]

const TABS: Array<{
  value: TabKey
  label: string
  short: string
  icon: typeof FileText
  hint: string
}> = [
  {
    value: 'main',
    label: 'Asosiy',
    short: 'Asosiy',
    icon: FileText,
    hint: 'Nom, vaqt, auditoriya va mukofotlar',
  },
  {
    value: 'questions',
    label: 'Savollar',
    short: 'Savollar',
    icon: FileQuestion,
    hint: 'Savollarni tanlang va tartibini belgilang',
  },
  {
    value: 'participants',
    label: 'Ishtirokchilar',
    short: 'Ishtirok',
    icon: Users,
    hint: "Ro'yxatdan o'tganlar va ularning holati",
  },
  {
    value: 'settings',
    label: 'Sozlamalar',
    short: 'Sozlama',
    icon: SlidersHorizontal,
    hint: 'Shuffle, natija va sertifikat qoidalari',
  },
]

const PARTICIPANT_TONE: Record<ParticipantStatus, BadgeTone> = {
  registered: 'info',
  playing: 'brand',
  finished: 'success',
  left: 'danger',
}

const createEmptyOlympiad = (): Olympiad => ({
  id: `olymp-${Date.now().toString(36)}`,
  name: '',
  description: '',
  startAt: '2026-12-01T10:00:00+05:00',
  duration: 90,
  audience: 'all',
  regionLimit: '',
  gradeLimit: '',
  rewards: [0, 0, 0],
  questionIds: [],
  status: 'draft',
  registered: 0,
  playing: 0,
  finished: 0,
  left: 0,
  shuffleQuestions: false,
  shuffleOptions: false,
  resultReveal: 'after',
  blockScreenshot: false,
  certificate: false,
  certMinScore: 0,
  certTemplate: 'tpl-olympiad',
  resultsPublished: false,
  results: [],
  createdAt: new Date().toISOString(),
})

function StatusPill({ status }: { status: Olympiad['status'] }) {
  return (
    <Badge tone={STATUS_META[status].tone} dot>
      {STATUS_META[status].label}
    </Badge>
  )
}

function Group({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-line-2 px-4 py-4 last:border-0 sm:px-5">
      <div className="mb-3">
        <h3 className="text-[13px] font-bold text-ink">{title}</h3>
        {hint ? <p className="mt-0.5 text-[11.5px] text-ink-3">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 border-b border-line-2 py-3 text-left transition last:border-0 last:pb-0"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">{hint}</span>
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-brand' : 'bg-[#d1d5db]',
        )}
      >
        <span
          className={cn(
            'ml-0.5 inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </span>
    </button>
  )
}

function ReadyRow({ done, label, value }: { done: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0 text-placeholder" />
      )}
      <span className={cn('min-w-0 flex-1 truncate text-[12px]', done ? 'text-ink-2' : 'text-ink-3')}>
        {label}
      </span>
      <span className="shrink-0 text-[10.5px] font-semibold text-ink-3">{value}</span>
    </div>
  )
}

function ListPreview({
  draft,
  pool,
  audienceLabel,
}: {
  draft: Olympiad
  pool: number
  audienceLabel: string
}) {
  const [day, month] = date(draft.startAt).split('.')
  const monthLabel = MONTHS[Math.max(0, Number(month) - 1)] ?? ''

  return (
    <div className="rounded-[12px] border border-line bg-white p-2.5">
      <div className="flex items-start gap-2.5">
        <div className="grid w-[46px] shrink-0 place-items-center rounded-[9px] border border-line-2 bg-canvas py-1.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">{monthLabel}</span>
          <span className="text-[17px] font-extrabold leading-none text-ink tabular">{day}</span>
          <span className="mt-0.5 text-[10px] text-ink-3 tabular">{time(draft.startAt)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <StatusPill status={draft.status} />
          <p className="mt-1 line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink">
            {draft.name.trim() || 'Nomsiz olimpiada'}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-3">{audienceLabel}</span>
        {draft.gradeLimit ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-3">
            {draft.gradeLimit}-sinf
          </span>
        ) : null}
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink-3">
          {draft.duration} daq
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line-2 pt-2 text-[11px]">
        <span className="text-ink-3">
          {draft.questionIds.length} savol · {number(draft.registered)} kishi
        </span>
        <span className="shrink-0 font-semibold text-ink-2">{pool > 0 ? money(pool) : 'Mukofotsiz'}</span>
      </div>
    </div>
  )
}

export function OlympiadEditor({ olympiad }: { olympiad?: Olympiad }) {
  const router = useRouter()
  const { toast } = useToast()
  const users = useAppStore((state) => state.users)
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const tests = useAppStore((state) => state.tests)
  const certTemplates = useAppStore((state) => state.certTemplates)
  const upsertOlympiad = useAppStore((state) => state.upsertOlympiad)
  const upsertTest = useAppStore((state) => state.upsertTest)

  const [draft, setDraft] = useState<Olympiad>(() => olympiad ?? createEmptyOlympiad())
  const baseline = useRef<Olympiad>(draft)
  const [tab, setTab] = useState<TabKey>('main')
  const [invalidName, setInvalidName] = useState(false)

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline.current), [draft])

  const patch = (value: Partial<Olympiad>) => setDraft((current) => ({ ...current, ...value }))

  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.nameUz ?? '—'

  const testById = useMemo(() => new Map(tests.map((test) => [test.id, test])), [tests])
  const selectedTests = useMemo(
    () => draft.questionIds.map((id) => testById.get(id)).filter(Boolean) as Test[],
    [draft.questionIds, testById],
  )

  const difficultyStats = useMemo(
    () =>
      selectedTests.reduce(
        (stats, test) => {
          if (test.difficulty === 'easy') stats.easy += 1
          else if (test.difficulty === 'medium') stats.medium += 1
          else stats.hard += 1
          return stats
        },
        { easy: 0, medium: 0, hard: 0 },
      ),
    [selectedTests],
  )

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)

  const moveQuestion = (from: number, to: number) => {
    if (from === to) return
    const ids = [...draft.questionIds]
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    patch({ questionIds: ids })
  }

  const addQuestionIds = (ids: string[]) =>
    patch({ questionIds: Array.from(new Set([...draft.questionIds, ...ids])) })

  /* ------------------------- topic picker ------------------------- */

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTopic, setPickerTopic] = useState(topics[0]?.id ?? '')
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSelected, setPickerSelected] = useState<string[]>([])

  const pickerTests = useMemo(
    () =>
      tests.filter(
        (test) =>
          test.topicId === pickerTopic &&
          test.question.toLowerCase().includes(pickerSearch.trim().toLowerCase()),
      ),
    [tests, pickerTopic, pickerSearch],
  )

  const openPicker = () => {
    setPickerSearch('')
    setPickerSelected([])
    setPickerOpen(true)
  }

  const togglePicker = (id: string) =>
    setPickerSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )

  /* ------------------------- manual question ------------------------- */

  const [manualOpen, setManualOpen] = useState(false)
  const emptyManual = () => ({
    question: '',
    a: '',
    b: '',
    c: '',
    d: '',
    correct: 'a' as 'a' | 'b' | 'c' | 'd',
    topicId: topics[0]?.id ?? '',
    difficulty: 'medium' as Test['difficulty'],
  })
  const [manual, setManual] = useState(emptyManual)

  const saveManual = () => {
    if (!manual.question.trim() || !manual.a.trim() || !manual.b.trim() || !manual.c.trim() || !manual.d.trim()) {
      toast({ title: "Barcha maydonlarni to'ldiring", description: 'Savol va 4 ta variant kiritilishi shart.', tone: 'error' })
      return
    }
    const test: Test = {
      id: `test-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      question: manual.question.trim(),
      options: { a: manual.a.trim(), b: manual.b.trim(), c: manual.c.trim(), d: manual.d.trim() },
      correct: manual.correct,
      topicId: manual.topicId,
      difficulty: manual.difficulty,
      status: 'active',
      used: 0,
      errorRate: 0,
      topWrong: 'a',
      note: "Olimpiada uchun qo'lda qo'shilgan",
      createdAt: new Date().toISOString(),
    }
    upsertTest(test)
    addQuestionIds([test.id])
    setManual(emptyManual())
    setManualOpen(false)
    toast({ title: "Savol qo'shildi", description: "Savol bazaga va olimpiadaga qo'shildi." })
  }

  /* ------------------------- PDF import ------------------------- */

  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfFile, setPdfFile] = useState<string | null>(null)
  const [pdfTopic, setPdfTopic] = useState(topics[0]?.id ?? '')
  const [pdfProgress, setPdfProgress] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)

  const runPdfImport = async () => {
    if (!pdfFile) return
    setPdfBusy(true)
    setPdfProgress(0)
    for (const step of [16, 38, 64, 88, 100]) {
      await new Promise((resolve) => window.setTimeout(resolve, 300))
      setPdfProgress(step)
    }
    const pool = tests
      .filter((test) => test.topicId === pdfTopic && !draft.questionIds.includes(test.id))
      .slice(0, 10)
    const fallback = tests
      .filter((test) => !draft.questionIds.includes(test.id) && !pool.some((item) => item.id === test.id))
      .slice(0, Math.max(0, 10 - pool.length))
    const picks = [...pool, ...fallback]
    addQuestionIds(picks.map((test) => test.id))
    setPdfBusy(false)
    setPdfProgress(0)
    setPdfFile(null)
    setPdfOpen(false)
    toast({
      title: 'PDF import tugadi',
      description: `${picks.length} ta savol olimpiadaga qo'shildi va tahrirlash uchun tayyor.`,
    })
  }

  /* ------------------------- participants ------------------------- */

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const participants = useMemo(() => olympiadParticipants(draft, users), [draft, users])
  const filteredParticipants = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return participants
    return participants.filter(
      (row) =>
        row.user.name.toLowerCase().includes(value) || row.user.username.toLowerCase().includes(value),
    )
  }, [participants, query])

  const pageCount = Math.max(1, Math.ceil(filteredParticipants.length / pageSize))
  const pageRows = filteredParticipants.slice((page - 1) * pageSize, page * pageSize)

  const exportParticipants = () => {
    downloadCsv(`olimpiada-${draft.id}-ishtirokchilar.csv`, [
      ['Ism', 'Username', "Ro'yxat sanasi", 'Status'],
      ...filteredParticipants.map((row) => [
        row.user.name,
        row.user.username,
        date(row.registeredAt),
        participantStatusLabel[row.status],
      ]),
    ])
    toast({ title: 'CSV yuklab olindi', description: `${filteredParticipants.length} ta ishtirokchi eksport qilindi.` })
  }

  /* ------------------------- derived preview ------------------------- */

  const pool = draft.rewards.reduce((sum, value) => sum + value, 0)
  const audienceLabel = AUDIENCES.find((item) => item.value === draft.audience)?.label ?? 'Hamma'
  const activeSettings = [
    draft.shuffleQuestions,
    draft.shuffleOptions,
    draft.blockScreenshot,
    draft.certificate,
  ].filter(Boolean).length

  const readyName = draft.name.trim().length > 0
  const readyQuestions = draft.questionIds.length > 0
  const readyTime = (draft.duration ?? 0) >= 5
  const readyRewards = pool > 0
  const readyCount = [readyName, readyQuestions, readyTime, readyRewards].filter(Boolean).length

  const startEnd = new Date(new Date(draft.startAt).getTime() + (draft.duration || 0) * 60_000)
  const startEndLabel = `${dateLong(startEnd)} · ${time(startEnd)}`

  const navMeta: Record<TabKey, string> = {
    main: STATUS_META[draft.status].label,
    questions: `${draft.questionIds.length} ta`,
    participants: `${number(draft.registered)} kishi`,
    settings: activeSettings > 0 ? `${activeSettings} ta yoqilgan` : 'Standart',
  }

  const activeTab = TABS.find((item) => item.value === tab) ?? TABS[0]

  /* ------------------------- save ------------------------- */

  const save = () => {
    if (!draft.name.trim()) {
      setInvalidName(true)
      toast({ title: 'Nom kiritilmagan', description: 'Olimpiada nomini kiriting.', tone: 'error' })
      setTab('main')
      return
    }
    const saved = { ...draft, name: draft.name.trim() }
    upsertOlympiad(saved)
    baseline.current = saved
    setDraft(saved)
    toast({
      title: olympiad ? 'Olimpiada yangilandi' : 'Olimpiada yaratildi',
      description: saved.name,
    })
    router.push(`/admin/olympiads/${draft.id}`)
  }

  const updateStart = (value: string) => {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) patch({ startAt: parsed.toISOString() })
  }

  /* ------------------------- render ------------------------- */

  const questionActions = (
    <div className="flex w-full gap-1.5 sm:w-auto">
      <Button
        size="sm"
        variant="secondary"
        onClick={openPicker}
        className="h-11 flex-1 rounded-[9px] sm:h-9 sm:flex-none"
      >
        <ListChecks className="h-3.5 w-3.5" />
        <span className="sm:hidden">Tanlash</span>
        <span className="hidden sm:inline">Mavzudan tanlash</span>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setManualOpen(true)}
        className="h-11 flex-1 rounded-[9px] sm:h-9 sm:flex-none"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="sm:hidden">Qo'lda</span>
        <span className="hidden sm:inline">Qo'lda qo'shish</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setPdfOpen(true)}
        className="h-11 flex-1 rounded-[9px] sm:h-9 sm:flex-none"
      >
        <Upload className="h-3.5 w-3.5" />
        <span className="sm:hidden">PDF</span>
        <span className="hidden sm:inline">PDF import</span>
      </Button>
    </div>
  )

  const participantActions = (
    <Button
      size="sm"
      variant="secondary"
      onClick={exportParticipants}
      disabled={participants.length === 0}
      className="h-11 rounded-[9px] sm:h-9"
    >
      <Upload className="h-3.5 w-3.5 rotate-180" />
      <span className="sm:hidden">CSV</span>
      <span className="hidden sm:inline">CSV eksport</span>
    </Button>
  )

  const navDone: Record<TabKey, boolean> = {
    main: readyName,
    questions: readyQuestions,
    participants: draft.registered > 0,
    settings: activeSettings > 0,
  }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3.5  [@media(max-height:720px)]:gap-2">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
              <Link
                href="/admin/olympiads"
                className="inline-flex h-7 items-center gap-1 transition hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar
              </Link>
              <span className="text-placeholder">/</span>
              <span>{olympiad ? 'Tahrirlash' : 'Yangi'}</span>
              {dirty ? (
                <span className="ml-1 hidden items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-bold text-warning sm:inline-flex">
                  <span className="h-1 w-1 rounded-full bg-current" /> Saqlanmagan
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="h2 min-w-0 truncate text-ink">
                <span className="sm:hidden">{olympiad ? 'Tahrirlash' : 'Yangi olimpiada'}</span>
                <span className="hidden sm:inline">
                  {olympiad ? 'Olimpiadani tahrirlash' : 'Yangi olimpiada'}
                </span>
              </h1>
              <StatusPill status={draft.status} />
            </div>
            <p className="mt-0.5 hidden truncate text-[12px] text-ink-3 sm:block">
              {olympiad
                ? `${olympiad.name} — barcha bo'limlarni tahrirlashingiz mumkin.`
                : "Asosiy ma'lumotlardan boshlang, so'ng savollar va sozlamalarni to'ldiring."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/admin/olympiads" className="hidden sm:inline-flex">
              <Button variant="ghost">Bekor qilish</Button>
            </Link>
            <Button onClick={save} className="h-10 rounded-[11px] px-3.5 sm:h-11 sm:px-4">
              <Save className="h-4 w-4" />
              <span className="max-[360px]:hidden">Saqlash</span>
            </Button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-4 gap-1 rounded-[12px] bg-muted p-1 lg:hidden">
          {TABS.map((item) => {
            const Icon = item.icon
            const active = tab === item.value
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(item.value)}
                className={cn(
                  'flex h-12 flex-col items-center justify-center gap-0.5 rounded-[9px] text-[10.5px] font-semibold transition',
                  active ? 'bg-white text-ink shadow-sm' : 'text-ink-3',
                )}
              >
                <Icon className={cn('h-4 w-4', active && 'text-brand')} />
                <span className="leading-none">{item.short}</span>
              </button>
            )
          })}
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[204px_minmax(0,1fr)] xl:grid-cols-[204px_minmax(0,1fr)_288px]">
          <nav className="hidden min-h-0 flex-col gap-1 overflow-y-auto rounded-[16px] border border-line bg-white p-1.5 shadow-card lg:flex">
            {TABS.map((item) => {
              const Icon = item.icon
              const active = tab === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setTab(item.value)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-left transition',
                    active ? 'bg-brand-soft' : 'hover:bg-canvas',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-[8px] transition',
                      active ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-[12.5px] font-semibold',
                        active ? 'text-brand-text' : 'text-ink-2',
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-[10.5px] text-ink-3">{navMeta[item.value]}</span>
                  </span>
                  {navDone[item.value] ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                  ) : active ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand" />
                  ) : null}
                </button>
              )
            })}
            <div className="mt-auto border-t border-line-2 px-2.5 pb-1 pt-2.5">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-3">Yaratilgan</p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-ink-2">
                {olympiad ? date(olympiad.createdAt) : 'Hozir'}
              </p>
            </div>
          </nav>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line-2 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-brand-text">
                  <activeTab.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-bold leading-tight text-ink">{activeTab.label}</h2>
                  <p className="hidden text-[11px] text-ink-3 sm:block">{activeTab.hint}</p>
                </div>
              </div>
              {tab === 'questions' ? questionActions : tab === 'participants' ? participantActions : null}
            </header>

            {tab === 'main' ? (
              <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
                <Group title="Nomi va tavsif" hint="O'quvchilar ro'yxatda birinchi bo'lib shu nomni ko'radi.">
                  <div className="space-y-3">
                    <Field
                      label="Olimpiada nomi"
                      required
                      error={invalidName ? 'Nom kiritilishi shart' : undefined}
                    >
                      <Input
                        value={draft.name}
                        onChange={(event) => {
                          setInvalidName(false)
                          patch({ name: event.target.value })
                        }}
                        placeholder="Masalan: Respublika Matematik Olimpiadasi"
                        className={cn(invalidName && 'border-error/60 ring-2 ring-error/10')}
                      />
                    </Field>
                    <Field label="Tavsif">
                      <Textarea
                        rows={3}
                        value={draft.description}
                        onChange={(event) => patch({ description: event.target.value })}
                        placeholder="Olimpiada haqida qisqacha ma'lumot..."
                      />
                    </Field>
                  </div>
                </Group>

                <Group title="Vaqt" hint="Boshlanish vaqti va davomiylik asosida tugash vaqti hisoblanadi.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Boshlanish sanasi va vaqti" required>
                      <Input
                        type="datetime-local"
                        value={dateTimeInput(draft.startAt)}
                        onChange={(event) => updateStart(event.target.value)}
                      />
                    </Field>
                    <Field label="Davomiyligi">
                      <div className="relative">
                        <Input
                          type="number"
                          min={5}
                          max={480}
                          value={draft.duration}
                          onChange={(event) => patch({ duration: Number(event.target.value) || 0 })}
                          className="pr-16"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink-3">
                          daqiqa
                        </span>
                      </div>
                    </Field>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-[9px] bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" />
                    <span className="shrink-0">Tugash:</span>
                    <span className="truncate font-semibold text-ink-2">{startEndLabel}</span>
                  </div>
                </Group>

                <Group title="Kim qatnashadi" hint="Auditoriyani tanlash orqali kirishni cheklang.">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {AUDIENCES.map((item) => {
                      const Icon = item.icon
                      const active = draft.audience === item.value
                      return (
                        <button
                          key={item.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => patch({ audience: item.value })}
                          className={cn(
                            'flex min-h-[52px] items-center gap-2.5 rounded-[12px] border px-2.5 py-2 text-left transition',
                            active
                              ? 'border-brand bg-brand-soft ring-1 ring-brand/20'
                              : 'border-line bg-white hover:border-line-brand',
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-[9px]',
                              active ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-semibold text-ink">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block truncate text-[10.5px] text-ink-3">{item.hint}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </Group>

                <Group title="Cheklovlar" hint="Bo'sh qoldirilsa — cheklov qo'llanilmaydi.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Tuman">
                      <Select
                        value={draft.regionLimit}
                        onChange={(event) => patch({ regionLimit: event.target.value })}
                      >
                        <option value="">Barcha tumanlar</option>
                        {REGION_NAMES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Sinf" hint="Masalan: 8-11">
                      <Input
                        value={draft.gradeLimit}
                        onChange={(event) => patch({ gradeLimit: event.target.value })}
                        placeholder="8-11"
                      />
                    </Field>
                  </div>
                </Group>

                <Group title="Mukofotlar" hint="G'oliblar uchun pul mukofoti.">
                  <div className="space-y-2">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-[9px]',
                            index === 0 ? 'bg-coin-bg text-[#b45309]' : 'bg-muted text-ink-3',
                          )}
                        >
                          <Award className="h-4 w-4" />
                        </span>
                        <span className="w-14 shrink-0 text-[11.5px] font-semibold text-ink-3">
                          {index + 1}-o'rin
                        </span>
                        <div className="relative min-w-0 flex-1">
                          <Input
                            type="number"
                            min={0}
                            step={50_000}
                            value={draft.rewards[index]}
                            onChange={(event) => {
                              const rewards = [...draft.rewards] as [number, number, number]
                              rewards[index] = Number(event.target.value) || 0
                              patch({ rewards })
                            }}
                            className="pr-12"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-3">
                            so'm
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between rounded-[9px] bg-canvas px-3 py-2">
                    <span className="text-[11.5px] text-ink-3">Umumiy jamg'arma</span>
                    <span className="text-[12.5px] font-bold text-ink tabular">{money(pool)}</span>
                  </div>
                </Group>

                <Group title="Holat" hint={STATUS_META[draft.status].hint}>
                  <Select
                    value={draft.status}
                    onChange={(event) => patch({ status: event.target.value as Olympiad['status'] })}
                  >
                    <option value="draft">Qoralama</option>
                    <option value="scheduled">Rejalashtirilgan</option>
                    <option value="live">Jonli</option>
                    <option value="finished">Yakunlangan</option>
                  </Select>
                </Group>
              </div>
            ) : null}

            {tab === 'questions' ? (
              <div className="min-h-0 flex-1 overflow-y-auto [contain:paint] px-4 py-4 sm:px-5">
                {selectedTests.length === 0 ? (
                  <EmptyState
                    title="Savollar tanlanmagan"
                    text="Mavzudan tanlang, qo'lda qo'shing yoki PDF fayldan import qiling."
                    icon={<FileQuestion className="h-5 w-5" />}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-[10px] border border-line bg-canvas px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] font-semibold">
                        <span className="text-ink-2">{selectedTests.length} ta savol</span>
                        <span className="text-ink-3">
                          {difficultyStats.easy} oson · {difficultyStats.medium} o'rta ·{' '}
                          {difficultyStats.hard} qiyin
                        </span>
                      </div>
                      <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-line-2">
                        {difficultyStats.easy > 0 ? (
                          <span
                            className="h-full rounded-full bg-success"
                            style={{ width: `${(difficultyStats.easy / selectedTests.length) * 100}%` }}
                          />
                        ) : null}
                        {difficultyStats.medium > 0 ? (
                          <span
                            className="h-full rounded-full bg-warning"
                            style={{ width: `${(difficultyStats.medium / selectedTests.length) * 100}%` }}
                          />
                        ) : null}
                        {difficultyStats.hard > 0 ? (
                          <span
                            className="h-full rounded-full bg-error"
                            style={{ width: `${(difficultyStats.hard / selectedTests.length) * 100}%` }}
                          />
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {selectedTests.map((test, index) => (
                        <div
                          key={test.id}
                          draggable
                          onDragStart={() => {
                            dragFrom.current = index
                            setDragIndex(index)
                          }}
                          onDragEnd={() => {
                            setDragIndex(null)
                            dragFrom.current = null
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (dragFrom.current !== null) moveQuestion(dragFrom.current, index)
                            dragFrom.current = null
                            setDragIndex(null)
                          }}
                          className={cn(
                            'flex items-center gap-2 rounded-[10px] border border-line bg-white px-2.5 py-2 transition hover:border-line-brand',
                            dragIndex === index && 'border-brand opacity-60',
                          )}
                        >
                          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-placeholder" />
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-semibold text-ink-3 tabular">
                            {index + 1}
                          </span>
                          <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{test.question}</p>
                          <span className="hidden shrink-0 sm:block">
                            <DifficultyBadge level={test.difficulty} />
                          </span>
                          <IconButton
                            label="Savolni o'chirish"
                            className="shrink-0 hover:bg-error-bg hover:text-error"
                            onClick={() =>
                              patch({ questionIds: draft.questionIds.filter((id) => id !== test.id) })
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                    <p className="pb-1 text-center text-[11px] text-ink-3">
                      Tartibni o'zgartirish uchun savolni sudrab ko'chiring.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'participants' ? (
              participants.length === 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
                  <EmptyState
                    title="Hali ishtirokchilar yo'q"
                    text="Olimpiada e'lon qilingach o'quvchilar ro'yxatdan o'ta boshlaydi."
                    icon={<Users className="h-5 w-5" />}
                  />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center gap-2 px-4 pb-2.5 pt-3 sm:px-5">
                    <SearchInput
                      value={query}
                      onChange={(value) => {
                        setQuery(value)
                        setPage(1)
                      }}
                      placeholder="Ism yoki username..."
                      className="min-w-0 flex-1"
                    />
                    <span className="shrink-0 text-[11px] font-semibold text-ink-3">
                      {number(filteredParticipants.length)} natija
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto [contain:paint] px-4 sm:px-5">
                    <div className="divide-y divide-line-2">
                      {pageRows.map((row) => (
                        <div key={row.user.id} className="flex items-center gap-2.5 py-2.5">
                          <Avatar name={row.user.name} tone={row.user.tone} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-ink">{row.user.name}</p>
                            <p className="truncate text-[11px] text-ink-3">
                              @{row.user.username} · {date(row.registeredAt)}
                            </p>
                          </div>
                          <Badge tone={PARTICIPANT_TONE[row.status]}>
                            {participantStatusLabel[row.status]}
                          </Badge>
                        </div>
                      ))}
                      {filteredParticipants.length === 0 ? (
                        <p className="py-10 text-center text-[13px] text-ink-3">Hech narsa topilmadi.</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 border-t border-line-2 px-4 py-2.5 sm:px-5">
                    <Pagination
                      page={page}
                      pageCount={pageCount}
                      onChange={setPage}
                      total={filteredParticipants.length}
                      pageSize={pageSize}
                      label="ta ishtirokchi"
                    />
                  </div>
                </div>
              )
            ) : null}

            {tab === 'settings' ? (
              <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
                <Group title="Savollar tartibi" hint="Har bir ishtirokchi uchun alohida tartib.">
                  <ToggleRow
                    label="Savollarni aralashtirish"
                    hint="Har bir ishtirokchi savollarni har xil tartibda ko'radi."
                    checked={draft.shuffleQuestions}
                    onChange={(value) => patch({ shuffleQuestions: value })}
                  />
                  <ToggleRow
                    label="Variantlarni aralashtirish"
                    hint="Javob variantlari har bir ishtirokchida aralashadi."
                    checked={draft.shuffleOptions}
                    onChange={(value) => patch({ shuffleOptions: value })}
                  />
                </Group>

                <Group title="Natija" hint="Natija qachon va qanday ko'rsatilishini tanlang.">
                  <div className="space-y-1.5">
                    {REVEAL_OPTIONS.map((option) => {
                      const active = draft.resultReveal === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => patch({ resultReveal: option.value })}
                          className={cn(
                            'flex w-full items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition',
                            active
                              ? 'border-brand bg-brand-soft ring-1 ring-brand/20'
                              : 'border-line bg-white hover:border-line-brand',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                              active ? 'border-brand bg-brand' : 'border-[#d1d5db] bg-white',
                            )}
                          >
                            {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[12.5px] font-semibold text-ink">{option.label}</span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">
                              {option.hint}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </Group>

                <Group title="Xavfsizlik" hint="Ishtirokchilar ekranini himoyalash.">
                  <ToggleRow
                    label="Screenshot bloklash"
                    hint="Ishtirokchilar ekranni suratga ololmaydi."
                    checked={draft.blockScreenshot}
                    onChange={(value) => patch({ blockScreenshot: value })}
                  />
                </Group>

                <Group title="Sertifikat" hint="Belgilangan balldan yuqori natija olganlarga beriladi.">
                  <ToggleRow
                    label="Sertifikat berish"
                    hint="Yakunda avtomatik sertifikat shakllantiriladi."
                    checked={draft.certificate}
                    onChange={(value) => patch({ certificate: value })}
                  />
                  {draft.certificate ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Minimal ball"
                        hint={`${draft.questionIds.length} savoldan minimal o'tish balli`}
                      >
                        <Input
                          type="number"
                          min={0}
                          max={draft.questionIds.length || undefined}
                          value={draft.certMinScore}
                          onChange={(event) => patch({ certMinScore: Number(event.target.value) || 0 })}
                        />
                      </Field>
                      <Field label="Shablon">
                        <Select
                          value={draft.certTemplate}
                          onChange={(event) => patch({ certTemplate: event.target.value })}
                        >
                          {certTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  ) : null}
                </Group>
              </div>
            ) : null}
          </section>

          <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto xl:flex">
            <div className="rounded-[16px] border border-line bg-white p-3.5 shadow-card">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-3">
                E'lon ko'rinishi
              </p>
              <div className="mt-2">
                <ListPreview draft={draft} pool={pool} audienceLabel={audienceLabel} />
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-ink-3">
                O'quvchilar ro'yxatda shu kartani ko'radi.
              </p>
            </div>

            <div className="rounded-[16px] border border-line bg-white p-3.5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-3">Tayyorlik</p>
                <span className="text-[11px] font-bold text-ink-2 tabular">{readyCount}/4</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={(readyCount / 4) * 100} />
              </div>
              <div className="mt-1.5 divide-y divide-line-2">
                <ReadyRow done={readyName} label="Nomi kiritilgan" value={readyName ? 'Tayyor' : 'Kerak'} />
                <ReadyRow
                  done={readyQuestions}
                  label="Savollar tanlangan"
                  value={readyQuestions ? `${draft.questionIds.length} ta` : 'Kerak'}
                />
                <ReadyRow
                  done={readyTime}
                  label="Davomiylik belgilangan"
                  value={`${draft.duration} daq`}
                />
                <ReadyRow
                  done={readyRewards}
                  label="Mukofot jamg'armasi"
                  value={readyRewards ? money(pool) : "Yo'q"}
                />
              </div>
            </div>

            <div className="rounded-[16px] border border-line bg-brand-soft p-3.5">
              <p className="text-[11px] font-semibold text-brand-text">Oqim</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-ink-3">
                Qoralama → Rejalashtirilgan → Jonli → Yakunlangan. Holatni «Asosiy» bo'limida
                o'zgartirasiz.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ------------------------- modals ------------------------- */}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Mavzudan savollar tanlash"
        description="Mavzuni tanlang va kerakli savollarni belgilang."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPickerOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              disabled={pickerSelected.length === 0}
              onClick={() => {
                addQuestionIds(pickerSelected)
                toast({ title: "Savollar qo'shildi", description: `${pickerSelected.length} ta savol tanlandi.` })
                setPickerSelected([])
                setPickerOpen(false)
              }}
            >
              Tanlanganlarni qo'shish ({pickerSelected.length})
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Mavzu">
            <Select
              value={pickerTopic}
              onChange={(event) => {
                setPickerTopic(event.target.value)
                setPickerSelected([])
              }}
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {subjectName(topic.subjectId)} — {topic.name}
                </option>
              ))}
            </Select>
          </Field>
          <SearchInput
            value={pickerSearch}
            onChange={setPickerSearch}
            placeholder="Savol matni bo'yicha qidirish..."
          />
          <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
            {pickerTests.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-3">Bu mavzuda savollar topilmadi.</p>
            ) : (
              pickerTests.map((test) => {
                const already = draft.questionIds.includes(test.id)
                const checked = already || pickerSelected.includes(test.id)
                return (
                  <div
                    key={test.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border border-line px-3 py-2',
                      already && 'bg-canvas',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        if (!already) togglePicker(test.id)
                      }}
                    />
                    <span className={cn('min-w-0 flex-1 text-[13px]', already ? 'text-ink-3' : 'text-ink-2')}>
                      {test.question}
                    </span>
                    {already ? <Badge tone="gray">Qo'shilgan</Badge> : null}
                    <DifficultyBadge level={test.difficulty} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Qo'lda savol qo'shish"
        description="Savol savollar bazasiga ham qo'shiladi."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setManualOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={saveManual}>
              <Save className="h-4 w-4" /> Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Savol matni" required>
            <Textarea
              rows={3}
              value={manual.question}
              onChange={(event) => setManual({ ...manual, question: event.target.value })}
              placeholder="Savol matnini kiriting..."
            />
          </Field>
          <div className="space-y-2">
            {(['a', 'b', 'c', 'd'] as const).map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`${letter.toUpperCase()} to'g'ri javob`}
                  onClick={() => setManual({ ...manual, correct: letter })}
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition',
                    manual.correct === letter
                      ? 'border-brand bg-brand text-white'
                      : 'border-line bg-white text-ink-3 hover:border-line-brand',
                  )}
                >
                  {letter.toUpperCase()}
                </button>
                <Input
                  value={manual[letter]}
                  onChange={(event) => setManual({ ...manual, [letter]: event.target.value })}
                  placeholder={`${letter.toUpperCase()} varianti`}
                />
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mavzu">
              <Select
                value={manual.topicId}
                onChange={(event) => setManual({ ...manual, topicId: event.target.value })}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {subjectName(topic.subjectId)} — {topic.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Daraja">
              <Select
                value={manual.difficulty}
                onChange={(event) =>
                  setManual({ ...manual, difficulty: event.target.value as Test['difficulty'] })
                }
              >
                <option value="easy">Oson</option>
                <option value="medium">O'rta</option>
                <option value="hard">Qiyin</option>
                <option value="olympiad">Olimpiada</option>
              </Select>
            </Field>
          </div>
          <p className="rounded-lg bg-brand-soft px-3 py-2 text-[12px] text-brand-text">
            To'g'ri javob: <span className="font-bold">{manual.correct.toUpperCase()}</span>
          </p>
        </div>
      </Modal>

      <Modal
        open={pdfOpen}
        onClose={() => {
          if (!pdfBusy) setPdfOpen(false)
        }}
        title="PDF import"
        description="PDF fayldan savollarni avtomatik ajratib olish."
        footer={
          <>
            <Button variant="ghost" disabled={pdfBusy} onClick={() => setPdfOpen(false)}>
              Bekor qilish
            </Button>
            <Button disabled={!pdfFile || pdfBusy} onClick={runPdfImport}>
              {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {pdfBusy ? 'Tahlil qilinmoqda...' : 'Import qilish'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center transition hover:border-brand/50 hover:bg-brand-soft/40">
            <Upload className="h-6 w-6 text-ink-3" />
            <span className="text-[13px] font-semibold text-ink-2">{pdfFile ?? 'PDF fayl tanlang'}</span>
            <span className="text-[11px] text-ink-3">Faqat .pdf format, 50 MB gacha</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={pdfBusy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) setPdfFile(file.name)
              }}
            />
          </label>
          <Field label="Mavzu" hint="Savollar shu mavzuga biriktiriladi">
            <Select value={pdfTopic} onChange={(event) => setPdfTopic(event.target.value)} disabled={pdfBusy}>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {subjectName(topic.subjectId)} — {topic.name}
                </option>
              ))}
            </Select>
          </Field>
          {pdfBusy ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px] text-ink-3">
                <span>Savollar ajratilmoqda...</span>
                <span className="font-semibold text-ink-2 tabular">{pdfProgress}%</span>
              </div>
              <ProgressBar value={pdfProgress} />
            </div>
          ) : (
            <p className="rounded-lg bg-canvas px-3 py-2 text-[12px] text-ink-3">
              PDF ichidagi savollar avtomatik aniqlanadi. Importdan keyin ularni tahrirlashingiz mumkin.
            </p>
          )}
        </div>
      </Modal>
    </PageTransition>
  )
}

export default OlympiadEditor
