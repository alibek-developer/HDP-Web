'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  Download,
  FileUp,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Button,
  Checkbox,
  DifficultyBadge,
  Drawer,
  Modal,
  Pagination,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, number, percent } from '@/lib/format'
import type { ContentStatus, SubjectColor, Test, TestDifficulty } from '@/lib/types'

const PAGE_SIZE = 25
const LETTERS = ['a', 'b', 'c', 'd'] as const

const DIFFICULTY: Array<{ value: TestDifficulty; label: string; bar: string; soft: string; text: string; dot: string }> = [
  { value: 'easy', label: 'Oson', bar: 'bg-success', soft: 'bg-success-bg', text: 'text-success', dot: 'bg-success' },
  { value: 'medium', label: "O'rta", bar: 'bg-warning', soft: 'bg-warning-bg', text: 'text-warning', dot: 'bg-warning' },
  { value: 'hard', label: 'Qiyin', bar: 'bg-error', soft: 'bg-error-bg', text: 'text-error', dot: 'bg-error' },
  { value: 'olympiad', label: 'Olimpiada', bar: 'bg-info', soft: 'bg-info-bg', text: 'text-info', dot: 'bg-info' },
]

const difficultyOf = (value: TestDifficulty) => DIFFICULTY.find((item) => item.value === value) ?? DIFFICULTY[0]

const STATUS: Record<ContentStatus, { label: string; dot: string }> = {
  active: { label: 'Faol', dot: 'bg-success' },
  draft: { label: 'Draft', dot: 'bg-warning' },
  hidden: { label: 'Yashirin', dot: 'bg-ink-3/50' },
}

const TONES: Record<SubjectColor, { dot: string; soft: string; text: string }> = {
  green: { dot: 'bg-[#16a34a]', soft: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
  blue: { dot: 'bg-[#2563eb]', soft: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' },
  violet: { dot: 'bg-[#7c3aed]', soft: 'bg-[#ede9fe]', text: 'text-[#6d28d9]' },
  amber: { dot: 'bg-[#d97706]', soft: 'bg-[#fef3c7]', text: 'text-[#b45309]' },
  red: { dot: 'bg-[#dc2626]', soft: 'bg-[#fee2e2]', text: 'text-[#b91c1c]' },
  gray: { dot: 'bg-[#9ca3af]', soft: 'bg-[#f3f4f6]', text: 'text-[#4b5563]' },
}

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

const selectClass =
  'h-10 w-full shrink-0 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12px] font-semibold text-ink-2 outline-none transition hover:border-line-brand focus:border-brand sm:w-auto'

const openTest = (initial?: Test, topicId?: string): Test => ({
  id: initial?.id ?? '',
  question: initial?.question ?? '',
  options: initial?.options ?? { a: '', b: '', c: '', d: '' },
  correct: initial?.correct ?? 'a',
  topicId: initial?.topicId ?? topicId ?? '',
  difficulty: initial?.difficulty ?? 'easy',
  status: initial?.status ?? 'active',
  used: initial?.used ?? 0,
  errorRate: initial?.errorRate ?? 0,
  topWrong: initial?.topWrong ?? 'b',
  note: initial?.note ?? '',
  createdAt: initial?.createdAt ?? new Date().toISOString(),
})

export default function TestsPage() {
  const tests = useAppStore((state) => state.tests)
  const topics = useAppStore((state) => state.topics)
  const subjects = useAppStore((state) => state.subjects)
  const upsertTest = useAppStore((state) => state.upsertTest)
  const deleteTest = useAppStore((state) => state.deleteTest)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [subjectId, setSubjectId] = useState('all')
  const [topicId, setTopicId] = useState('all')
  const [status, setStatus] = useState<'all' | ContentStatus>('all')
  const [difficulty, setDifficulty] = useState<'all' | TestDifficulty>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<Test | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [deleteIds, setDeleteIds] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics])
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const subjectOfTopic = (id: string) => {
    const topic = topicById.get(id)
    return topic ? subjectById.get(topic.subjectId) : undefined
  }
  const topicName = (id: string) => topicById.get(id)?.name ?? '—'

  const topicOptions = useMemo(
    () => topics.filter((topic) => (subjectId === 'all' ? true : topic.subjectId === subjectId)),
    [topics, subjectId],
  )

  const baseFiltered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tests.filter((test) => {
      if (topicId !== 'all') {
        if (test.topicId !== topicId) return false
      } else if (subjectId !== 'all') {
        if (topicById.get(test.topicId)?.subjectId !== subjectId) return false
      }
      if (status !== 'all' && test.status !== status) return false
      if (term && !test.question.toLowerCase().includes(term)) return false
      return true
    })
  }, [tests, topicById, subjectId, topicId, status, search])

  const filtered = useMemo(
    () =>
      baseFiltered
        .filter((test) => difficulty === 'all' || test.difficulty === difficulty)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [baseFiltered, difficulty],
  )

  const difficultyCounts = useMemo(
    () =>
      DIFFICULTY.map((item) => ({
        ...item,
        count: baseFiltered.filter((test) => test.difficulty === item.value).length,
      })),
    [baseFiltered],
  )

  const stats = useMemo(() => {
    const usedTotal = tests.reduce((sum, test) => sum + test.used, 0)
    const weighted = tests.reduce((sum, test) => sum + test.used * test.errorRate, 0)
    return {
      usedTotal,
      avgPerQuestion: Math.round(usedTotal / Math.max(1, tests.length)),
      weightedError: usedTotal > 0 ? weighted / usedTotal : 0,
      highError: tests.filter((test) => test.used > 0 && test.errorRate >= 50).length,
    }
  }, [tests])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const allPageChecked = rows.length > 0 && rows.every((test) => selected.has(test.id))
  const somePageChecked = rows.some((test) => selected.has(test.id)) && !allPageChecked

  const advancedCount = (subjectId !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0)

  const activeChips: Array<{ key: string; label: string; clear: () => void }> = []
  if (subjectId !== 'all') {
    activeChips.push({
      key: 'subject',
      label: subjectById.get(subjectId)?.nameUz ?? subjectId,
      clear: () => {
        setSubjectId('all')
        setTopicId('all')
      },
    })
  }
  if (topicId !== 'all') {
    activeChips.push({ key: 'topic', label: topicName(topicId), clear: () => setTopicId('all') })
  }
  if (status !== 'all') {
    activeChips.push({
      key: 'status',
      label: STATUS[status].label,
      clear: () => setStatus('all'),
    })
  }
  if (difficulty !== 'all') {
    activeChips.push({
      key: 'difficulty',
      label: difficultyOf(difficulty).label,
      clear: () => setDifficulty('all'),
    })
  }

  const resetFilters = () => {
    setSubjectId('all')
    setTopicId('all')
    setStatus('all')
    setDifficulty('all')
    setSearch('')
    setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePage = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allPageChecked) rows.forEach((test) => next.delete(test.id))
      else rows.forEach((test) => next.add(test.id))
      return next
    })
  }

  const openEditor = (test: Test) => {
    setInvalid(false)
    setEditor(test)
  }

  const closeEditor = () => {
    setEditor(null)
    setInvalid(false)
  }

  const openNew = () => {
    const topic = topicId !== 'all' ? topicId : topicOptions[0]?.id ?? topics[0]?.id
    if (!topic) {
      toast({ title: 'Avval mavzu yarating', tone: 'warning' })
      return
    }
    openEditor(openTest(undefined, topic))
  }

  const saveTest = (test: Test) => {
    upsertTest(test)
    toast({
      title: editor?.id ? 'Savol yangilandi' : "Savol qo'shildi",
      description: `${topicName(test.topicId)} · ${difficultyOf(test.difficulty).label}`,
      tone: 'success',
    })
    setEditor(null)
    setInvalid(false)
    if (!editor?.id) {
      setDifficulty('all')
      setStatus('all')
      setPage(1)
      setExpandedId(test.id)
    }
  }

  const submitForm = (form: Test) => {
    if (!form.question.trim()) {
      setInvalid(true)
      toast({ title: 'Savol matnini kiriting', tone: 'warning' })
      return
    }
    if (LETTERS.some((key) => !form.options[key].trim())) {
      setInvalid(true)
      toast({ title: "Barcha variantlarni to'ldiring", tone: 'warning' })
      return
    }
    if (!topics.some((topic) => topic.id === form.topicId)) {
      toast({ title: 'Mavzuni tanlang', tone: 'warning' })
      return
    }
    saveTest({
      ...form,
      id: form.id || `test-${Date.now().toString(36)}`,
      question: form.question.trim(),
      options: {
        a: form.options.a.trim(),
        b: form.options.b.trim(),
        c: form.options.c.trim(),
        d: form.options.d.trim(),
      },
    })
  }

  const setStatusFor = (ids: string[], next: ContentStatus) => {
    ids.forEach((id) => {
      const test = tests.find((item) => item.id === id)
      if (test) upsertTest({ ...test, status: next })
    })
    setSelected(new Set())
    toast({ title: `${ids.length} ta savol holati o'zgartirildi`, description: STATUS[next].label, tone: 'success' })
  }

  const confirmDelete = () => {
    deleteIds.forEach((id) => deleteTest(id))
    toast({ title: `${deleteIds.length} ta savol o'chirildi`, tone: 'success' })
    setDeleteIds([])
    setSelected(new Set())
  }

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast({ title: "Eksport uchun savol yo'q", tone: 'warning' })
      return
    }
    const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const header = ['ID', 'Savol', 'A', 'B', 'C', 'D', "To'g'ri javob", 'Mavzu', 'Fan', 'Daraja', 'Holat', 'Ishlatilgan', 'Xato %']
    const lines = [header.map(cell).join(',')]
    for (const test of filtered) {
      const topic = topicById.get(test.topicId)
      const subject = topic ? subjectById.get(topic.subjectId) : undefined
      lines.push(
        [
          test.id,
          test.question,
          test.options.a,
          test.options.b,
          test.options.c,
          test.options.d,
          test.correct.toUpperCase(),
          topic?.name ?? '',
          subject?.nameUz ?? '',
          difficultyOf(test.difficulty).label,
          STATUS[test.status].label,
          test.used,
          Math.round(test.errorRate),
        ]
          .map(cell)
          .join(','),
      )
    }
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `hdp-testlar-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast({ title: 'CSV eksport qilindi', description: `${number(filtered.length)} savol`, tone: 'success' })
  }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-3 overflow-hidden  sm:gap-3.5 ">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="h2 truncate text-ink">Testlar</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 font-geist text-[11px] font-bold tabular text-ink-2">
              {number(tests.length)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={exportCsv}
              aria-label="CSV eksport"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12.5px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink sm:px-3"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Eksport</span>
            </button>
            <a
              href="/admin/content/import"
              aria-label="PDF import"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12.5px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink sm:px-3"
            >
              <FileUp className="h-4 w-4" />
              <span className="hidden sm:inline">PDF import</span>
            </a>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ink px-3.5 font-geist text-[13px] font-bold text-white transition hover:bg-brand sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Test qo'shish</span>
              <span className="sm:hidden">Test</span>
            </button>
          </div>
        </header>

        <section className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 rounded-[18px] border border-line bg-white px-3.5 py-2.5 [@media(max-height:720px)]:hidden sm:gap-x-6 sm:px-4 sm:py-3">
          <div className="flex w-full items-start justify-between gap-4 sm:w-auto sm:justify-start sm:gap-7">
            <div>
              <p className="font-geist text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">Savollar</p>
              <p className="mt-1 font-geist text-[20px] font-extrabold leading-none tabular text-ink sm:text-[23px]">
                {number(tests.length)}
              </p>
              <p className="mt-1 hidden font-geist text-[10.5px] text-ink-3 sm:block">
                {topics.length} mavzu · {subjects.length} fan
              </p>
            </div>
            <div>
              <p className="font-geist text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">Ishlatilgan</p>
              <p className="mt-1 font-geist text-[20px] font-extrabold leading-none tabular text-ink sm:text-[23px]">
                {number(stats.usedTotal)}
              </p>
              <p className="mt-1 hidden font-geist text-[10.5px] text-ink-3 sm:block">
                o'rt. {number(stats.avgPerQuestion)} marta
              </p>
            </div>
            <div>
              <p className="font-geist text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">O'rtacha xato</p>
              <p
                className={cn(
                  'mt-1 font-geist text-[20px] font-extrabold leading-none tabular sm:text-[23px]',
                  stats.weightedError >= 50 ? 'text-error' : 'text-ink',
                )}
              >
                {percent(stats.weightedError, 1)}
              </p>
              <p className="mt-1 hidden font-geist text-[10.5px] text-ink-3 sm:block">
                {stats.highError} savolda 50%dan yuqori
              </p>
            </div>
          </div>

          <div className="hidden h-10 w-px shrink-0 bg-line sm:block" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-geist text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">Darajalar</p>
              {difficulty !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setDifficulty('all')}
                  className="font-geist text-[10px] font-semibold text-brand-text hover:underline"
                >
                  Filtrni olib tashlash
                </button>
              ) : null}
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
              {difficultyCounts.map((item) => (
                <span
                  key={item.value}
                  className={cn('h-full transition-opacity', item.bar, difficulty !== 'all' && difficulty !== item.value && 'opacity-25')}
                  style={{ width: `${baseFiltered.length ? (item.count / baseFiltered.length) * 100 : 0}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {difficultyCounts.map((item) => {
                const active = difficulty === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setDifficulty(active ? 'all' : item.value)
                      setPage(1)
                    }}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-7 items-center gap-1.5 rounded-full border px-2 font-geist text-[10.5px] font-semibold transition sm:h-8 sm:px-2.5 sm:text-[11px]',
                      active
                        ? cn('border-transparent', item.soft, item.text)
                        : 'border-line bg-white text-ink-3 hover:border-line-brand hover:text-ink-2',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />
                    {item.label}
                    <span className="tabular opacity-70">{item.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-line bg-white">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
            <div className="relative min-w-0 flex-1 sm:max-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Savol matni bo'yicha qidirish..."
                className="h-10 w-full rounded-[10px] border border-line bg-white pl-9 pr-8 font-geist text-[12.5px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Qidiruvni tozalash"
                  onClick={() => {
                    setSearch('')
                    setPage(1)
                  }}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-3 hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="hidden items-center gap-2 xl:flex">
              <select
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value)
                  setTopicId('all')
                  setPage(1)
                }}
                aria-label="Fan"
                className={cn(selectClass, 'xl:w-36')}
              >
                <option value="all">Barcha fanlar</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.nameUz}
                  </option>
                ))}
              </select>
              <select
                value={topicId}
                onChange={(event) => {
                  setTopicId(event.target.value)
                  setPage(1)
                }}
                aria-label="Mavzu"
                className={cn(selectClass, 'xl:w-44')}
              >
                <option value="all">Barcha mavzular</option>
                {topicOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as 'all' | ContentStatus)
                  setPage(1)
                }}
                aria-label="Status"
                className={cn(selectClass, 'xl:w-[118px]')}
              >
                <option value="all">Barcha holat</option>
                <option value="active">Faol</option>
                <option value="draft">Draft</option>
                <option value="hidden">Yashirin</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Filtrlar"
              className={cn(
                'relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] border px-3 font-geist text-[12px] font-semibold transition xl:hidden',
                advancedCount > 0
                  ? 'border-brand/40 bg-brand-soft text-brand-text'
                  : 'border-line bg-white text-ink-2 hover:border-line-brand hover:text-ink',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtr
              {advancedCount > 0 ? (
                <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-brand px-1 text-[9.5px] font-bold text-white">
                  {advancedCount}
                </span>
              ) : null}
            </button>

            <span className="ml-auto hidden font-geist text-[10.5px] font-medium tabular text-ink-3 lg:block">
              {number(filtered.length)} savol
            </span>
          </div>

          {activeChips.length > 0 ? (
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-line-2 px-3 py-2 sm:px-4">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    chip.clear()
                    setPage(1)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 font-geist text-[11px] font-semibold text-ink-2 transition hover:border-error/30 hover:text-error"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  resetFilters()
                  setPage(1)
                }}
                className="ml-1 font-geist text-[11px] font-semibold text-brand-text hover:underline"
              >
                Tozalash
              </button>
            </div>
          ) : null}

          <div className="flex shrink-0 items-center gap-3 border-b border-line-2 bg-canvas/60 px-3 py-1.5 sm:px-4">
            <Checkbox
              checked={allPageChecked}
              indeterminate={somePageChecked}
              onChange={togglePage}
              label={`Sahifadagi ${rows.length} ta savol`}
              className="text-[11px] font-medium text-ink-3"
            />
            <span className="ml-auto hidden font-geist text-[10px] tabular text-ink-3 sm:block">
              {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, currentPage * PAGE_SIZE)} /{' '}
              {filtered.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
            {filtered.length === 0 ? (
              <div className="grid h-full min-h-[200px] place-items-center px-4 text-center">
                <div>
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-muted text-ink-3">
                    <Search className="h-5 w-5" />
                  </span>
                  <p className="mt-2.5 font-geist text-[13px] font-semibold text-ink">Savol topilmadi</p>
                  <p className="mt-1 font-geist text-[11.5px] text-ink-3">Filtrlarni o'zgartiring yoki yangi savol qo'shing.</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button size="sm" variant="secondary" className="h-10 sm:h-8" onClick={() => { resetFilters(); setPage(1) }}>
                      Filtrni tozalash
                    </Button>
                    <Button size="sm" className="h-10 sm:h-8" onClick={openNew}>
                      <Plus className="h-3.5 w-3.5" /> Savol qo'shish
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <ul>
                {rows.map((test, index) => {
                  const topic = topicById.get(test.topicId)
                  const subject = topic ? subjectById.get(topic.subjectId) : undefined
                  const tone = TONES[subject?.color ?? 'gray'] ?? TONES.gray
                  const meta = STATUS[test.status]
                  const level = difficultyOf(test.difficulty)
                  const expanded = expandedId === test.id
                  const checked = selected.has(test.id)
                  return (
                    <li
                      key={test.id}
                      className={cn(
                        'border-b border-line-2 transition last:border-0',
                        checked ? 'bg-brand-soft/30' : expanded ? 'bg-canvas/60' : 'hover:bg-canvas/40',
                      )}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        onClick={() => setExpandedId(expanded ? null : test.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setExpandedId(expanded ? null : test.id)
                          }
                        }}
                        className="flex cursor-pointer items-start gap-2 px-3 py-2.5 sm:gap-3 sm:px-4"
                      >
                        <span className="pt-1" onClick={(event) => event.stopPropagation()}>
                          <Checkbox checked={checked} onChange={() => toggleSelect(test.id)} />
                        </span>
                        <span className="hidden w-6 shrink-0 pt-1 text-right font-mono text-[10.5px] tabular text-ink-3 sm:block">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                        <span className={cn('mt-1.5 h-6 w-1 shrink-0 rounded-full', expanded ? 'bg-brand' : tone.dot)} />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'font-geist text-[12.5px] font-medium leading-snug text-ink sm:text-[13px]',
                              !expanded && 'line-clamp-2',
                            )}
                          >
                            {test.question}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-geist text-[10.5px] text-ink-3">
                            <span className={cn('inline-flex items-center gap-1', tone.text)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                              {topic?.name ?? '—'}
                            </span>
                            <span className="hidden text-ink-3/50 sm:inline">·</span>
                            <span className="hidden sm:inline">{subject?.nameUz ?? '—'}</span>
                            <span className="rounded border border-line bg-white px-1.5 py-px font-semibold text-ink-2">
                              To'g'ri: {test.correct.toUpperCase()}
                            </span>
                            <span className={cn('inline-flex items-center gap-1', meta.dot === 'bg-success' ? 'text-success' : 'text-ink-3')}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} /> {meta.label}
                            </span>
                          </div>
                        </div>
                        <div className="hidden w-[104px] shrink-0 flex-col items-end gap-1 pt-0.5 lg:flex">
                          <DifficultyBadge level={test.difficulty} />
                          <span className="inline-flex items-center gap-1.5 font-geist text-[10px] tabular text-ink-3">
                            <span className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                              <span
                                className={cn('block h-full rounded-full', test.errorRate >= 50 ? 'bg-error' : 'bg-warning')}
                                style={{ width: `${test.errorRate}%` }}
                              />
                            </span>
                            {percent(test.errorRate, 0)}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn('mt-0.5 h-4 w-4 shrink-0 text-ink-3 transition-transform', expanded && 'rotate-180 text-brand')}
                        />
                      </div>

                      {expanded ? (
                        <div className="border-t border-line-2 px-3 pb-3 pt-2.5 sm:px-4 sm:pl-[66px]">
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {LETTERS.map((key) => {
                              const correct = test.correct === key
                              return (
                                <div
                                  key={key}
                                  className={cn(
                                    'flex items-center gap-2 rounded-[8px] border px-2.5 py-1.5 font-geist text-[11.5px]',
                                    correct
                                      ? 'border-brand/50 bg-white font-semibold text-brand-text'
                                      : 'border-line bg-white/60 text-ink-2',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'grid h-5 w-5 shrink-0 place-items-center rounded text-[9.5px] font-bold',
                                      correct ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                                    )}
                                  >
                                    {key.toUpperCase()}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">{test.options[key]}</span>
                                  {correct ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-geist text-[10.5px] text-ink-3">
                            <span>
                              Ishlatilgan: <span className="font-semibold tabular text-ink-2">{number(test.used)}</span>
                            </span>
                            <span>
                              Xato:{' '}
                              <span className={cn('font-semibold tabular', test.errorRate >= 50 ? 'text-error' : 'text-ink-2')}>
                                {percent(test.errorRate, 0)}
                              </span>
                            </span>
                            {test.used > 0 ? (
                              <span>
                                Eng ko'p xato: <span className="font-semibold text-ink-2">{test.topWrong.toUpperCase()}</span>
                              </span>
                            ) : null}
                            <span>Qo'shilgan: {date(test.createdAt)}</span>
                            {test.note ? (
                              <span className="rounded-full border border-line bg-white px-2 py-0.5">{test.note}</span>
                            ) : null}
                            <span className="lg:hidden">
                              <DifficultyBadge level={test.difficulty} />
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-10 sm:h-8"
                              onClick={(event) => {
                                event.stopPropagation()
                                openEditor(openTest(test))
                              }}
                            >
                              <PencilLine className="h-3.5 w-3.5" /> Tahrirlash
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-10 sm:h-8"
                              onClick={(event) => {
                                event.stopPropagation()
                                upsertTest({ ...test, status: test.status === 'active' ? 'draft' : 'active' })
                                toast({
                                  title: test.status === 'active' ? "Draftga o'tkazildi" : 'Faollashtirildi',
                                  tone: 'success',
                                })
                              }}
                            >
                              {test.status === 'active' ? "Draftga o'tkazish" : 'Faollashtirish'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-10 text-error sm:h-8"
                              onClick={(event) => {
                                event.stopPropagation()
                                setDeleteIds([test.id])
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> O'chirish
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="shrink-0 border-t border-line px-3 py-2.5 sm:px-4">
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} label="ta savol" />
            </div>
          ) : null}

          {selected.size > 0 ? (
            <div className="absolute inset-x-2 bottom-2 z-20 flex flex-wrap items-center gap-1.5 rounded-[14px] border border-line bg-white/95 px-2.5 py-2 shadow-modal backdrop-blur sm:inset-x-3 sm:gap-2">
              <span className="px-1 font-geist text-[12px] font-bold text-ink">{selected.size} tanlandi</span>
              <Button size="sm" variant="secondary" className="h-9" onClick={() => setStatusFor(Array.from(selected), 'active')}>
                Faollashtirish
              </Button>
              <Button size="sm" variant="ghost" className="h-9" onClick={() => setStatusFor(Array.from(selected), 'draft')}>
                Draft
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 text-error"
                onClick={() => setDeleteIds(Array.from(selected))}
              >
                <Trash2 className="h-3.5 w-3.5" /> O'chirish
              </Button>
              <button
                type="button"
                aria-label="Tanlovni bekor qilish"
                onClick={() => setSelected(new Set())}
                className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition hover:bg-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtrlar"
        subtitle="Fan, mavzu va holat bo'yicha toraytiring."
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="mr-auto"
              onClick={() => {
                setSubjectId('all')
                setTopicId('all')
                setStatus('all')
                setPage(1)
              }}
            >
              Tozalash
            </Button>
            <Button className="h-11 sm:h-10" onClick={() => setFiltersOpen(false)}>
              Ko'rsatish ({number(filtered.length)})
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Fan</span>
            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value)
                setTopicId('all')
                setPage(1)
              }}
              className={fieldClass}
            >
              <option value="all">Barcha fanlar</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.nameUz}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Mavzu</span>
            <select
              value={topicId}
              onChange={(event) => {
                setTopicId(event.target.value)
                setPage(1)
              }}
              className={fieldClass}
            >
              <option value="all">Barcha mavzular</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Holat</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as 'all' | ContentStatus)
                setPage(1)
              }}
              className={fieldClass}
            >
              <option value="all">Barcha holat</option>
              <option value="active">Faol</option>
              <option value="draft">Draft</option>
              <option value="hidden">Yashirin</option>
            </select>
          </label>
        </div>
      </Drawer>

      <Drawer
        key={editor?.id || 'new-test'}
        open={Boolean(editor)}
        onClose={closeEditor}
        widthClass="sm:w-[560px]"
        title={editor?.id ? 'Savolni tahrirlash' : "Yangi savol"}
        subtitle={
          editor
            ? editor.id
              ? `${topicName(editor.topicId)} · ${number(editor.used)} marta ishlatilgan`
              : 'Savol, variantlar va darajani to‘ldiring.'
            : undefined
        }
        footer={
          editor ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closeEditor}>
                Bekor qilish
              </Button>
              <Button
                type="button"
                className="h-11 sm:h-10"
                onClick={() => submitForm(editor)}
              >
                Saqlash
              </Button>
            </div>
          ) : null
        }
      >
        {editor ? <TestForm test={editor} invalid={invalid} onChange={setEditor} /> : null}
      </Drawer>

      <Modal
        open={deleteIds.length > 0}
        onClose={() => setDeleteIds([])}
        title={deleteIds.length > 1 ? "Savollarni o'chirish" : "Savolni o'chirish"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteIds([])}>
              Bekor qilish
            </Button>
            <Button variant="destructive" className="h-11 sm:h-10" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> O'chirish
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold">{deleteIds.length} ta savol</span> bazadan o'chiriladi. Olimpiadalarda
          ishlatilgan savollar natijalari saqlanadi, ammo yangi testlarda ko'rinmaydi.
        </p>
      </Modal>
    </PageTransition>
  )
}

function TestForm({ test, invalid, onChange }: { test: Test; invalid: boolean; onChange: (test: Test) => void }) {
  const topics = useAppStore((state) => state.topics)
  const subjects = useAppStore((state) => state.subjects)
  const subjectId = topics.find((topic) => topic.id === test.topicId)?.subjectId ?? subjects[0]?.id ?? ''

  return (
    <div className="space-y-3.5">
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between font-geist text-[12px] font-semibold text-ink-2">
          Savol matni <span className="text-brand">*</span>
          <span className="font-geist text-[10px] font-medium tabular text-ink-3">{test.question.length} belgi</span>
        </span>
        <textarea
          value={test.question}
          onChange={(event) => onChange({ ...test, question: event.target.value })}
          rows={4}
          placeholder="Savol matnini yozing. LaTeX ham mumkin: x² + 2x + 1 = 0"
          className={cn(
            fieldClass,
            'h-auto resize-none py-2.5 leading-relaxed',
            invalid && !test.question.trim() && 'border-error/50',
          )}
        />
      </label>

      <div>
        <p className="mb-1.5 font-geist text-[12px] font-semibold text-ink-2">
          Javob variantlari <span className="text-brand">*</span>
        </p>
        <div className="space-y-1.5">
          {LETTERS.map((key) => {
            const correct = test.correct === key
            const empty = !test.options[key].trim()
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 rounded-[10px] border px-2.5 transition',
                  correct
                    ? 'border-brand bg-brand-soft/50'
                    : invalid && empty
                      ? 'border-error/40'
                      : 'border-line bg-white',
                )}
              >
                <button
                  type="button"
                  aria-label={`${key.toUpperCase()} to'g'ri javob`}
                  aria-pressed={correct}
                  onClick={() => onChange({ ...test, correct: key })}
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition',
                    correct ? 'border-brand bg-brand text-white' : 'border-[#d1d5db] bg-white',
                  )}
                >
                  {correct ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </button>
                <span className="w-3.5 shrink-0 font-geist text-[11px] font-bold text-ink-3">{key.toUpperCase()}</span>
                <input
                  value={test.options[key]}
                  onChange={(event) => onChange({ ...test, options: { ...test.options, [key]: event.target.value } })}
                  placeholder={`${key.toUpperCase()} varianti`}
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent font-geist text-[13px] text-ink outline-none placeholder:text-placeholder"
                />
                {correct ? (
                  <span className="hidden shrink-0 rounded-full bg-white px-1.5 py-0.5 font-geist text-[9px] font-bold uppercase tracking-wide text-brand-text sm:block">
                    To'g'ri
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
        {invalid && LETTERS.some((key) => !test.options[key].trim()) ? (
          <p className="mt-1.5 font-geist text-[11px] font-medium text-error">Barcha variantlarni to'ldiring.</p>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 font-geist text-[12px] font-semibold text-ink-2">Daraja</p>
        <div className="grid grid-cols-4 gap-1.5">
          {DIFFICULTY.map((item) => {
            const active = test.difficulty === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange({ ...test, difficulty: item.value })}
                aria-pressed={active}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-1.5 rounded-[9px] border font-geist text-[11.5px] font-semibold transition',
                  active ? cn('border-transparent', item.soft, item.text) : 'border-line bg-white text-ink-3 hover:border-line-brand',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Fan</span>
          <select
            value={subjectId}
            onChange={(event) => {
              const first = topics.find((topic) => topic.subjectId === event.target.value)
              if (first) onChange({ ...test, topicId: first.id })
            }}
            className={fieldClass}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.nameUz}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Mavzu</span>
          <select
            value={test.topicId}
            onChange={(event) => onChange({ ...test, topicId: event.target.value })}
            className={fieldClass}
          >
            {subjects.map((subject) => (
              <optgroup key={subject.id} label={subject.nameUz}>
                {topics
                  .filter((topic) => topic.subjectId === subject.id)
                  .map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="mb-1.5 font-geist text-[12px] font-semibold text-ink-2">Holat</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(['active', 'draft', 'hidden'] as ContentStatus[]).map((value) => {
            const active = test.status === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...test, status: value })}
                aria-pressed={active}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-1.5 rounded-[9px] border font-geist text-[11.5px] font-semibold transition',
                  active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-3 hover:border-line-brand',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-brand-light' : STATUS[value].dot)} />
                {STATUS[value].label}
              </button>
            )
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Izoh (admin uchun)</span>
        <input
          value={test.note}
          onChange={(event) => onChange({ ...test, note: event.target.value })}
          placeholder="Manba, muallif yoki eslatma"
          className={fieldClass}
        />
      </label>

      {test.id ? (
        <div className="rounded-[10px] border border-line-2 bg-canvas px-3 py-2 font-geist text-[10.5px] text-ink-3">
          Ishlatilgan <span className="font-semibold tabular text-ink-2">{number(test.used)}</span> marta · xato darajasi{' '}
          <span className={cn('font-semibold tabular', test.errorRate >= 50 ? 'text-error' : 'text-ink-2')}>
            {percent(test.errorRate, 0)}
          </span>
          {test.used > 0 ? <span> · eng ko'p xato: {test.topWrong.toUpperCase()}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
