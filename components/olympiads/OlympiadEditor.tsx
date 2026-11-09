'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileQuestion,
  GripVertical,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Upload,
  Users,
  X,
} from 'lucide-react'
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
  SectionCard,
  Select,
  Switch,
  Tabs,
  Textarea,
  cn,
  useToast,
  type BadgeTone,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { REGION_NAMES } from '@/lib/mock'
import { date, dateLong, dateTimeInput, downloadCsv, number } from '@/lib/format'
import {
  olympiadParticipants,
  participantStatusLabel,
  type ParticipantStatus,
} from '@/lib/olympiads'
import type { Olympiad, Test } from '@/lib/types'

const AUDIENCES: Array<{ value: Olympiad['audience']; label: string; hint: string }> = [
  { value: 'all', label: 'Hamma', hint: "Barcha ro'yxatdan o'tgan o'quvchilar" },
  { value: 'pro', label: 'Faqat Pro', hint: 'Faqat Pro tarifidagi foydalanuvchilar' },
  { value: 'group', label: 'Maxsus guruh', hint: "Tanlangan guruh a'zolari" },
]

const REVEAL_OPTIONS: Array<{ value: Olympiad['resultReveal']; label: string; hint: string }> = [
  { value: 'now', label: 'Darhol', hint: 'Har bir savoldan keyin natijani ko\u2019rsatish' },
  { value: 'after', label: 'Olimpiada tugagandan keyin', hint: 'Barcha ishtirokchilar tugatgach' },
  { value: 'manual', label: "Qo'lda e'lon qilganda", hint: "Admin natijalarni o'zi e'lon qiladi" },
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

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-2 py-3 first:pt-0 last:border-0 last:pb-0">
      <div>
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] text-ink-3">{hint}</p>
      </div>
      {children}
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
  const [tab, setTab] = useState<'main' | 'questions' | 'participants' | 'settings'>('main')

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

  /* ------------------------- save ------------------------- */

  const save = () => {
    if (!draft.name.trim()) {
      toast({ title: 'Nom kiritilmagan', description: 'Olimpiada nomini kiriting.', tone: 'error' })
      setTab('main')
      return
    }
    upsertOlympiad({ ...draft, name: draft.name.trim() })
    toast({
      title: olympiad ? 'Olimpiada yangilandi' : 'Olimpiada yaratildi',
      description: draft.name.trim(),
    })
    router.push(`/admin/olympiads/${draft.id}`)
  }

  const updateStart = (value: string) => {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) patch({ startAt: parsed.toISOString() })
  }

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
          <h1 className="mt-1 h2 text-ink">{olympiad ? 'Olimpiadani tahrirlash' : 'Yangi olimpiada'}</h1>
          <p className="mt-1 text-[13px] text-ink-3">
            {olympiad
              ? `${olympiad.name} — barcha bo'limlarni tahrirlashingiz mumkin.`
              : "Asosiy ma'lumotlardan boshlang, so'ng savollar va sozlamalarni to'ldiring."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/olympiads">
            <Button variant="ghost">Bekor qilish</Button>
          </Link>
          <Button onClick={save}>
            <Save className="h-4 w-4" /> Saqlash
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'main', label: 'Asosiy' },
          { value: 'questions', label: 'Savollar', count: draft.questionIds.length },
          { value: 'participants', label: 'Ishtirokchilar', count: draft.registered },
          { value: 'settings', label: 'Sozlamalar' },
        ]}
      />

      {tab === 'main' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <SectionCard title="Asosiy ma'lumotlar" subtitle="Olimpiada haqida asosiy ma'lumotlar">
            <div className="space-y-4">
              <Field label="Olimpiada nomi" required>
                <Input
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="Masalan: Respublika Matematik Olimpiadasi"
                />
              </Field>
              <Field label="Tavsif">
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(event) => patch({ description: event.target.value })}
                  placeholder="Olimpiada haqida qisqacha ma'lumot..."
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Boshlanish sanasi va vaqti" required>
                  <Input
                    type="datetime-local"
                    value={dateTimeInput(draft.startAt)}
                    onChange={(event) => updateStart(event.target.value)}
                  />
                </Field>
                <Field label="Davomiyligi (daqiqa)">
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={draft.duration}
                    onChange={(event) => patch({ duration: Number(event.target.value) || 0 })}
                  />
                </Field>
              </div>
              <Field label="Kim qatnashishi">
                <div className="grid gap-2 sm:grid-cols-3">
                  {AUDIENCES.map((item) => {
                    const active = draft.audience === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => patch({ audience: item.value })}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left transition',
                          active
                            ? 'border-brand bg-brand-soft ring-1 ring-brand/20'
                            : 'border-line bg-white hover:border-line-brand',
                        )}
                      >
                        <span className="block text-[13px] font-semibold text-ink">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">{item.hint}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Viloyat bo'yicha cheklash" hint="Bo'sh qoldirsangiz — barcha viloyatlar">
                  <Select
                    value={draft.regionLimit}
                    onChange={(event) => patch({ regionLimit: event.target.value })}
                  >
                    <option value="">Barcha viloyatlar</option>
                    {REGION_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Sinf bo'yicha cheklash" hint="Masalan: 8-11. Bo'sh bo'lsa — barcha sinflar">
                  <Input
                    value={draft.gradeLimit}
                    onChange={(event) => patch({ gradeLimit: event.target.value })}
                    placeholder="8-11"
                  />
                </Field>
              </div>
              <Field label="Holat">
                <Select
                  value={draft.status}
                  onChange={(event) => patch({ status: event.target.value as Olympiad['status'] })}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Rejalashtirilgan</option>
                  <option value="live">Davom etmoqda</option>
                  <option value="finished">Tugagan</option>
                </Select>
              </Field>
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="Sovrinlar" subtitle="G'oliblar uchun pul mukofoti">
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <Field key={index} label={`${index + 1}-o'rin`}>
                    <div className="relative">
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
                  </Field>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Qisqa ko'rinish">
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-ink-3">
                    <CalendarDays className="h-3.5 w-3.5" /> Sana
                  </span>
                  <span className="font-semibold text-ink">{dateLong(draft.startAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-ink-3">
                    <Clock3 className="h-3.5 w-3.5" /> Davomiyligi
                  </span>
                  <span className="font-semibold text-ink">{draft.duration} daqiqa</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-ink-3">
                    <FileQuestion className="h-3.5 w-3.5" /> Savollar
                  </span>
                  <span className="font-semibold text-ink">{draft.questionIds.length} ta</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-ink-3">
                    <Users className="h-3.5 w-3.5" /> Ishtirokchilar
                  </span>
                  <span className="font-semibold text-ink">{number(draft.registered)}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {tab === 'questions' ? (
        <SectionCard
          title="Savollar"
          subtitle={`${draft.questionIds.length} ta savol tanlangan`}
          action={
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="secondary" onClick={openPicker}>
                <ListChecks className="h-3.5 w-3.5" /> Mavzudan tanlash
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setManualOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Qo'lda qo'shish
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPdfOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> PDF import
              </Button>
            </div>
          }
        >
          {selectedTests.length === 0 ? (
            <EmptyState
              title="Savollar tanlanmagan"
              text="Mavzudan tanlang, qo'lda qo'shing yoki PDF fayldan import qiling."
              icon={<FileQuestion className="h-5 w-5" />}
              action={
                <Button size="sm" onClick={openPicker}>
                  <ListChecks className="h-3.5 w-3.5" /> Mavzudan tanlash
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-canvas px-3.5 py-2.5 text-[12px]">
                <span className="font-semibold text-ink">{selectedTests.length} ta savol:</span>
                <span className="text-success">{difficultyStats.easy} oson</span>
                <span className="text-warning">{difficultyStats.medium} o'rta</span>
                <span className="text-error">{difficultyStats.hard} qiyin</span>
                <span className="ml-auto text-ink-3">Tartibni sudrab o'zgartiring</span>
              </div>
              <div className="mt-3 space-y-2">
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
                      'flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition',
                      dragIndex === index && 'border-brand opacity-60',
                    )}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-placeholder" />
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-semibold text-ink-3 tabular">
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{test.question}</p>
                    <DifficultyBadge level={test.difficulty} />
                    <IconButton
                      label="Savolni o'chirish"
                      className="hover:bg-error-bg hover:text-error"
                      onClick={() =>
                        patch({ questionIds: draft.questionIds.filter((id) => id !== test.id) })
                      }
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      ) : null}

      {tab === 'participants' ? (
        <SectionCard
          title="Ishtirokchilar"
          subtitle={`${number(draft.registered)} kishi ro'yxatdan o'tgan`}
          action={
            <Button size="sm" variant="secondary" onClick={exportParticipants} disabled={participants.length === 0}>
              <Upload className="h-3.5 w-3.5 rotate-180" /> CSV eksport
            </Button>
          }
        >
          {participants.length === 0 ? (
            <EmptyState
              title="Hali ishtirokchilar yo'q"
              text="Olimpiada e'lon qilingach o'quvchilar ro'yxatdan o'ta boshlaydi."
              icon={<Users className="h-5 w-5" />}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SearchInput
                  value={query}
                  onChange={(value) => {
                    setQuery(value)
                    setPage(1)
                  }}
                  placeholder="Ism yoki username bo'yicha qidirish..."
                  className="w-full max-w-xs"
                />
                <p className="text-[12px] text-ink-3">
                  <span className="font-semibold text-ink-2">{number(filteredParticipants.length)}</span> ta natija
                </p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.03em] text-ink-3">
                      <th className="pb-2.5 pr-3 font-semibold">Ishtirokchi</th>
                      <th className="pb-2.5 pr-3 font-semibold">Username</th>
                      <th className="pb-2.5 pr-3 font-semibold">Ro'yxat sanasi</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.user.id} className="border-b border-line-2 last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.user.name} tone={row.user.tone} size="sm" />
                            <span className="text-[13px] font-semibold text-ink">{row.user.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-[13px] text-ink-3">@{row.user.username}</td>
                        <td className="py-2.5 pr-3 text-[12px] text-ink-3">{date(row.registeredAt)}</td>
                        <td className="py-2.5">
                          <Badge tone={PARTICIPANT_TONE[row.status]}>{participantStatusLabel[row.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  onChange={setPage}
                  total={filteredParticipants.length}
                  pageSize={pageSize}
                  label="ta ishtirokchi"
                />
              </div>
            </>
          )}
        </SectionCard>
      ) : null}

      {tab === 'settings' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Savollar tartibi">
            <SettingRow
              label="Savollarni aralashtirish"
              hint="Har bir ishtirokchi savollarni har xil tartibda ko'radi."
            >
              <Switch
                checked={draft.shuffleQuestions}
                onChange={(value) => patch({ shuffleQuestions: value })}
                label="Savollarni aralashtirish"
              />
            </SettingRow>
            <SettingRow
              label="Variantlarni aralashtirish"
              hint="Javob variantlari har bir ishtirokchida aralashadi."
            >
              <Switch
                checked={draft.shuffleOptions}
                onChange={(value) => patch({ shuffleOptions: value })}
                label="Variantlarni aralashtirish"
              />
            </SettingRow>
          </SectionCard>

          <SectionCard title="Natija va xavfsizlik">
            <p className="text-[13px] font-semibold text-ink">Natijani qachon ko'rsatish</p>
            <div className="mt-2 space-y-2">
              {REVEAL_OPTIONS.map((option) => {
                const active = draft.resultReveal === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patch({ resultReveal: option.value })}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
                      active ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-brand',
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
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-3">{option.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3">
              <SettingRow
                label="Screenshot bloklash"
                hint="Ishtirokchilar ekranni suratga olishi bloklanadi."
              >
                <Switch
                  checked={draft.blockScreenshot}
                  onChange={(value) => patch({ blockScreenshot: value })}
                  label="Screenshot bloklash"
                />
              </SettingRow>
            </div>
          </SectionCard>

          <SectionCard title="Sertifikat" className="lg:col-span-2">
            <SettingRow
              label="Sertifikat berish"
              hint="Belgilangan minimal balldan yuqori natija olganlarga sertifikat beriladi."
            >
              <Switch
                checked={draft.certificate}
                onChange={(value) => patch({ certificate: value })}
                label="Sertifikat berish"
              />
            </SettingRow>
            {draft.certificate ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Minimal ball" hint={`${draft.questionIds.length} savoldan minimal o'tish balli`}>
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
          </SectionCard>
        </div>
      ) : null}

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
                <span className="font-semibold tabular text-ink-2">{pdfProgress}%</span>
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
    </div>
  )
}

export default OlympiadEditor
