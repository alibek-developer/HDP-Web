'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  PencilLine,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { ContentHeader, ContentTabs, contentRoot } from '@/components/content/ContentShell'
import { Button, Checkbox, Modal, Spinner, cn, useToast } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
import type { Test, TestDifficulty } from '@/lib/types'

type Stage = 'idle' | 'analyzing' | 'done'

interface ImportFile {
  name: string
  size: number
}

const QUESTION_COUNT = 142

const DIFFICULTY: Array<{ value: TestDifficulty; label: string; bar: string; soft: string; text: string }> = [
  { value: 'easy', label: 'Oson', bar: 'bg-success', soft: 'bg-success-bg', text: 'text-success' },
  { value: 'medium', label: "O'rta", bar: 'bg-warning', soft: 'bg-warning-bg', text: 'text-warning' },
  { value: 'hard', label: 'Qiyin', bar: 'bg-error', soft: 'bg-error-bg', text: 'text-error' },
  { value: 'olympiad', label: 'Olimpiada', bar: 'bg-info', soft: 'bg-info-bg', text: 'text-info' },
]

const difficultyOf = (value: TestDifficulty) => DIFFICULTY.find((item) => item.value === value) ?? DIFFICULTY[0]

const TEMPLATES: Array<{ question: string; options: [string, string, string, string]; correct: 0 | 1 | 2 | 3 }> = [
  { question: 'x² − 5x + 6 = 0 tenglamaning ildizlari yig\'indisini toping.', options: ['5', '6', '−5', '1'], correct: 0 },
  { question: 'Agar a = 3 va b = −2 bo\'lsa, a² − b² ning qiymatini toping.', options: ['5', '13', '9', '4'], correct: 0 },
  { question: 'Viyet teoremasiga ko\'ra x² + px + q = 0 tenglamada ildizlar ko\'paytmasi nimaga teng?', options: ['−p', 'q', 'p', '−q'], correct: 1 },
  { question: 'sin 30° + cos 60° yig\'indisini hisoblang.', options: ['0', '0.5', '1', '√3'], correct: 2 },
  { question: 'log₂ 32 ning qiymatini toping.', options: ['4', '5', '6', '16'], correct: 1 },
  { question: 'Arifmetik progressiyada a₁ = 3, d = 4 bo\'lsa, a₁₀ ni toping.', options: ['36', '39', '40', '43'], correct: 1 },
  { question: 'Uchburchakning ichki burchaklari yig\'indisi necha gradus?', options: ['90°', '180°', '270°', '360°'], correct: 1 },
  { question: 'Aylana uzunligi formulasi qaysi?', options: ['πr²', '2πr', 'πd²', '4πr'], correct: 1 },
  { question: 'f(x) = 2x + 1 funksiyaning f(3) qiymatini toping.', options: ['5', '6', '7', '8'], correct: 2 },
  { question: '∫x² dx integralni hisoblang.', options: ['x³ + C', 'x³/3 + C', '2x + C', 'x²/2 + C'], correct: 1 },
  { question: 'Kvadratning tomoni 6 sm bo\'lsa, yuzasi necha sm²?', options: ['12', '24', '36', '48'], correct: 2 },
  { question: 'C(5, 2) kombinatsiya sonini toping.', options: ['5', '10', '20', '25'], correct: 1 },
]

const DIFFICULTIES: TestDifficulty[] = ['easy', 'medium', 'hard', 'olympiad']

const generateTests = (topicId: string, count: number): Test[] =>
  Array.from({ length: count }, (_, index) => {
    const template = TEMPLATES[index % TEMPLATES.length]
    const round = Math.floor(index / TEMPLATES.length) + 1
    const variant = round > 1 ? ` (${round}-variant)` : ''
    const correctKey = (['a', 'b', 'c', 'd'] as const)[template.correct]
    return {
      id: `ai-${Date.now().toString(36)}-${index + 1}`,
      question: `${template.question}${variant}`,
      options: {
        a: template.options[0],
        b: template.options[1],
        c: template.options[2],
        d: template.options[3],
      },
      correct: correctKey,
      topicId,
      difficulty: DIFFICULTIES[index % 4],
      status: 'active',
      used: 0,
      errorRate: 0,
      topWrong: 'b',
      note: 'AI PDF import orqali ajratilgan',
      createdAt: new Date().toISOString(),
    }
  })

const isUncertain = (test: Test) => Number(test.id.split('-').pop()) % 18 === 0

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function PdfImportPage() {
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const importTests = useAppStore((state) => state.importTests)
  const upsertTopic = useAppStore((state) => state.upsertTopic)
  const { toast } = useToast()

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const [file, setFile] = useState<ImportFile | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [newTopic, setNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState(0)
  const [results, setResults] = useState<Test[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [onlyUncertain, setOnlyUncertain] = useState(false)
  const [editing, setEditing] = useState<Test | null>(null)

  useEffect(() => {
    const presetId = new URLSearchParams(window.location.search).get('topic')
    const preset = presetId ? topics.find((topic) => topic.id === presetId) : undefined
    if (preset) {
      setSubjectId(preset.subjectId)
      setTopicId(preset.id)
      return
    }
    setSubjectId((current) => current || subjects[0]?.id || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (topics.some((topic) => topic.id === topicId && topic.subjectId === subjectId)) return
    const first = topics.find((topic) => topic.subjectId === subjectId)
    setTopicId(first?.id ?? '')
  }, [subjectId, topics, topicId])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  const topicOptions = useMemo(
    () => topics.filter((topic) => topic.subjectId === subjectId),
    [topics, subjectId],
  )

  const uncertainCount = useMemo(() => results.filter(isUncertain).length, [results])
  const visibleResults = useMemo(
    () => (onlyUncertain ? results.filter(isUncertain) : results),
    [results, onlyUncertain],
  )
  const allChecked = results.length > 0 && results.every((test) => checked.has(test.id))

  const distribution = useMemo(
    () =>
      DIFFICULTY.map((item) => ({
        ...item,
        count: results.filter((test) => test.difficulty === item.value).length,
      })),
    [results],
  )

  const destinationTopic = topics.find((topic) => topic.id === topicId)
  const destinationSubject = subjects.find((subject) => subject.id === subjectId)

  const pickFile = (picked: File | null) => {
    if (!picked) return
    if (!picked.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Faqat PDF fayl qabul qilinadi', tone: 'warning' })
      return
    }
    if (picked.size > 50 * 1024 * 1024) {
      toast({ title: 'Fayl hajmi 50 MB dan oshmasligi kerak', tone: 'warning' })
      return
    }
    setFile({ name: picked.name, size: picked.size })
    setStage('idle')
  }

  const startAnalysis = () => {
    if (!file) {
      toast({ title: 'PDF faylni yuklang', tone: 'warning' })
      return
    }
    if (!subjectId) {
      toast({ title: 'Fan tanlang', tone: 'warning' })
      return
    }
    if (newTopic && !newTopicName.trim()) {
      toast({ title: 'Yangi mavzu nomini kiriting', tone: 'warning' })
      return
    }
    if (!newTopic && !topicId) {
      toast({ title: 'Mavzu tanlang', tone: 'warning' })
      return
    }
    setStage('analyzing')
    setProgress(4)
    setExtracted(0)
    setResults([])
    setChecked(new Set())
    setOnlyUncertain(false)

    let value = 4
    timerRef.current = window.setInterval(() => {
      value = Math.min(100, value + 4 + Math.random() * 6)
      setProgress(value)
      setExtracted(Math.round((value / 100) * QUESTION_COUNT))
      if (value >= 100) {
        if (timerRef.current) window.clearInterval(timerRef.current)
        timerRef.current = null
        timeoutRef.current = window.setTimeout(() => {
          timeoutRef.current = null
          const targetTopic = newTopic ? 'pending-new' : topicId
          const generated = generateTests(targetTopic, QUESTION_COUNT)
          setResults(generated)
          setChecked(new Set(generated.map((test) => test.id)))
          setStage('done')
        }, 450)
      }
    }, 180)
  }

  const reset = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setFile(null)
    setStage('idle')
    setProgress(0)
    setExtracted(0)
    setResults([])
    setChecked(new Set())
    setOnlyUncertain(false)
    setEditing(null)
    setNewTopicName('')
  }

  const confirmImport = () => {
    if (checked.size === 0) {
      toast({ title: 'Kamida bitta test tanlang', tone: 'warning' })
      return
    }
    let targetTopicId = topicId
    if (newTopic) {
      const createdId = `topic-${Date.now().toString(36)}`
      upsertTopic({
        id: createdId,
        subjectId,
        name: newTopicName.trim(),
        description: `AI PDF import orqali yaratilgan mavzu (${file?.name ?? 'PDF'})`,
        order: topics.filter((topic) => topic.subjectId === subjectId).length + 1,
        status: 'active',
        proOnly: false,
        views: 0,
        avgMinutes: 0,
        testTakers: 0,
        avgScore: 0,
        createdAt: new Date().toISOString(),
      })
      targetTopicId = createdId
    }
    const incoming = results
      .filter((test) => checked.has(test.id))
      .map((test) => ({ ...test, topicId: targetTopicId }))
    importTests(targetTopicId, incoming)
    toast({
      title: `${incoming.length} ta test import qilindi`,
      description: newTopic ? `Yangi mavzu: ${newTopicName}` : destinationTopic?.name,
      tone: 'success',
    })
    reset()
  }

  const toggle = (id: string, value: boolean) =>
    setChecked((current) => {
      const next = new Set(current)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })

  const steps = [
    { key: 'idle' as Stage, label: 'Fayl' },
    { key: 'analyzing' as Stage, label: 'Tahlil' },
    { key: 'done' as Stage, label: 'Tekshirish' },
  ]
  const stepIndex = steps.findIndex((step) => step.key === stage)

  return (
    <PageTransition>
      <div className={contentRoot}>
        <ContentHeader
          title="PDF import"
          subtitle="PDF faylni yuklang — AI savollarni ajratib, tekshirish uchun tayyorlaydi."
          actions={
            stage !== 'idle' ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-line bg-white px-3.5 font-geist text-[13px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink sm:px-4"
              >
                <UploadCloud className="h-4 w-4" /> Yangi fayl
              </button>
            ) : null
          }
        />

        <ContentTabs />

        <div className="flex shrink-0 items-center gap-2">
          {steps.map((step, index) => {
            const done = index < stepIndex
            const active = index === stepIndex
            return (
              <div key={step.key} className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid h-6 w-6 place-items-center rounded-full font-geist text-[10px] font-bold transition',
                    done
                      ? 'bg-brand-soft text-brand-text'
                      : active
                        ? 'bg-ink text-white'
                        : 'bg-muted text-ink-3',
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    'font-geist text-[11.5px] font-semibold',
                    active ? 'text-ink' : done ? 'text-brand-text' : 'text-ink-3',
                  )}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 ? (
                  <span className={cn('mx-0.5 h-px w-5 sm:w-8', done ? 'bg-line-brand' : 'bg-line')} />
                ) : null}
              </div>
            )
          })}
        </div>

        {stage === 'idle' ? (
          <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
            <div className="grid min-h-full gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  pickFile(event.dataTransfer.files?.[0] ?? null)
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-5 py-10 text-center transition sm:py-14',
                  dragOver ? 'border-brand bg-brand-soft' : 'border-line-brand bg-white hover:bg-brand-soft/30',
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    pickFile(event.target.files?.[0] ?? null)
                    event.target.value = ''
                  }}
                />
                {file ? (
                  <>
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <FileText className="h-7 w-7" />
                    </span>
                    <p className="mt-3 max-w-full truncate font-geist text-[14px] font-semibold text-ink">{file.name}</p>
                    <p className="mt-1 font-geist text-[11.5px] tabular text-ink-3">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                    </p>
                    <div className="mt-4 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex h-10 items-center gap-1.5 rounded-[9px] border border-line bg-white px-3 font-geist text-[12px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink"
                      >
                        Almashtirish
                      </button>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-[9px] px-3 font-geist text-[12px] font-semibold text-ink-3 transition hover:bg-error-bg hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Olib tashlash
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <UploadCloud className="h-7 w-7" />
                    </span>
                    <p className="mt-3 font-geist text-[14px] font-semibold text-ink">PDF faylni tashlang</p>
                    <p className="mt-1 font-geist text-[12px] text-ink-3">yoki tanlash uchun bosing</p>
                    <span className="mt-4 inline-flex h-10 items-center gap-2 rounded-[9px] bg-ink px-4 font-geist text-[12.5px] font-bold text-white">
                      <FileText className="h-4 w-4" /> Fayl tanlash
                    </span>
                    <p className="mt-4 font-geist text-[10.5px] text-ink-3">Maksimal hajm 50 MB · faqat .pdf</p>
                  </>
                )}
              </section>

              <section className="flex flex-col rounded-[20px] border border-line bg-white p-4">
                <h2 className="font-geist text-[14px] font-bold text-ink">Import manzili</h2>
                <p className="mt-0.5 font-geist text-[11.5px] text-ink-3">Savollar qaysi mavzuga saqlanadi?</p>

                <div className="mt-3.5 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Fan</span>
                    <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={fieldClass}>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.nameUz}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Mavzu</span>
                    <div className="grid grid-cols-2 gap-1 rounded-[10px] bg-muted p-1">
                      {[
                        { value: false, label: 'Mavjud mavzu' },
                        { value: true, label: 'Yangi mavzu' },
                      ].map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setNewTopic(option.value)}
                          className={cn(
                            'h-9 rounded-[8px] font-geist text-[11.5px] font-semibold transition',
                            newTopic === option.value
                              ? 'bg-white text-ink shadow-sm'
                              : 'text-ink-3 hover:text-ink',
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newTopic ? (
                    <label className="block">
                      <input
                        value={newTopicName}
                        onChange={(event) => setNewTopicName(event.target.value)}
                        placeholder="Yangi mavzu nomi"
                        className={fieldClass}
                      />
                    </label>
                  ) : (
                    <label className="block">
                      <select value={topicId} onChange={(event) => setTopicId(event.target.value)} className={fieldClass}>
                        {topicOptions.length === 0 ? <option value="">Mavzu yo'q</option> : null}
                        {topicOptions.map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block font-geist text-[10.5px] text-ink-3">
                        {topicOptions.length} mavzu mavjud
                      </span>
                    </label>
                  )}
                </div>

                <div className="mt-4 border-t border-line-2 pt-3">
                  <Button className="h-11 w-full" onClick={startAnalysis} disabled={!file}>
                    <Sparkles className="h-4 w-4" /> Tahlil qilish
                  </Button>
                  {!file ? (
                    <p className="mt-2 text-center font-geist text-[10.5px] text-ink-3">Avval PDF faylni yuklang</p>
                  ) : null}
                </div>

                <ol className="mt-auto space-y-1.5 pt-4 font-geist text-[10.5px] text-ink-3">
                  {['AI matn va formulalarni o\'qiydi', 'Savol va variantlarni ajratadi', 'Noaniq savollarni belgilaydi'].map(
                    (item, index) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-muted text-[8.5px] font-bold text-ink-3">
                          {index + 1}
                        </span>
                        {item}
                      </li>
                    ),
                  )}
                </ol>
              </section>
            </div>
          </div>
        ) : null}

        {stage === 'analyzing' ? (
          <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
            <div className="mx-auto max-w-lg">
              <div className="rounded-[20px] border border-line bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand-soft text-brand">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-geist text-[13px] font-semibold text-ink">AI tahlil qilmoqda</p>
                    <p className="truncate font-geist text-[10.5px] text-ink-3">{file?.name}</p>
                  </div>
                  <span className="font-geist text-[13px] font-bold tabular text-brand-text">{Math.round(progress)}%</span>
                </div>

                <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <ul className="mt-4 space-y-2.5 font-geist text-[12px]">
                  {[
                    { label: `PDF o'qildi (${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB)`, done: progress > 18 },
                    { label: 'Sahifalar tuzilmasi aniqlandi', done: progress > 36 },
                    {
                      label: `Savollar ajratilmoqda (${extracted}/${QUESTION_COUNT})`,
                      done: progress >= 100,
                      active: progress > 36 && progress < 100,
                    },
                    { label: 'Darajalar baholanmoqda', done: progress > 84 },
                    { label: 'Noaniq savollar belgilanmoqda', done: progress >= 100, active: progress > 84 && progress < 100 },
                  ].map((step) => (
                    <li
                      key={step.label}
                      className={cn(
                        'flex items-center gap-2',
                        step.done ? 'text-ink-2' : step.active ? 'font-semibold text-brand-text' : 'text-ink-3',
                      )}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : step.active ? (
                        <span className="grid h-4 w-4 shrink-0 place-items-center">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                        </span>
                      ) : (
                        <span className="grid h-4 w-4 shrink-0 place-items-center">
                          <span className="h-2 w-2 rounded-full border border-[#d1d5db]" />
                        </span>
                      )}
                      {step.label}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-line-2 pt-3">
                  <span className="inline-flex items-center gap-1.5 font-geist text-[10.5px] text-ink-3">
                    <Spinner className="h-3 w-3 text-brand" /> Bu odatda 10–20 soniya oladi
                  </span>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    Bekor qilish
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {stage === 'done' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[minmax(0,1fr)]">
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-line bg-white">
              <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line-2 px-3 py-2.5 sm:px-4">
                <Checkbox
                  checked={allChecked}
                  onChange={(value) => setChecked(value ? new Set(results.map((test) => test.id)) : new Set())}
                  label={`Barchasi (${checked.size}/${results.length})`}
                />
                <button
                  type="button"
                  onClick={() => setOnlyUncertain((current) => !current)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 font-geist text-[10.5px] font-semibold transition',
                    onlyUncertain
                      ? 'border-warning bg-warning-bg text-warning'
                      : 'border-line text-ink-3 hover:border-line-brand hover:text-ink',
                  )}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Noaniq {uncertainCount}
                </button>
                <span className="ml-auto hidden truncate font-geist text-[10.5px] text-ink-3 sm:block">{file?.name}</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto [contain:paint]">
                {visibleResults.length === 0 ? (
                  <div className="grid h-full min-h-[160px] place-items-center px-4 text-center">
                    <div>
                      <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
                      <p className="mt-2 font-geist text-[12.5px] font-semibold text-ink">Noaniq savollar yo'q</p>
                      <p className="mt-0.5 font-geist text-[11px] text-ink-3">Filtrni o'chirsangiz barcha savollar ko'rinadi.</p>
                    </div>
                  </div>
                ) : (
                  <ul>
                    {visibleResults.map((test) => {
                      const uncertain = isUncertain(test)
                      const index = results.findIndex((item) => item.id === test.id)
                      const difficulty = difficultyOf(test.difficulty)
                      return (
                        <li
                          key={test.id}
                          onClick={() => toggle(test.id, !checked.has(test.id))}
                          className={cn(
                            'cursor-pointer border-b border-line-2 px-3 py-2.5 transition last:border-0 sm:px-4',
                            checked.has(test.id) ? 'bg-brand-soft/25' : 'hover:bg-muted/50',
                            uncertain && 'shadow-[inset_2px_0_0_#d97706]',
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="pt-1.5">
                              <Checkbox checked={checked.has(test.id)} onChange={(value) => toggle(test.id, value)} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-geist text-[12.5px] font-medium leading-snug text-ink">
                                  <span className="mr-1 font-mono text-[10.5px] text-ink-3">{String(index + 1).padStart(2, '0')}</span>
                                  {test.question}
                                </p>
                                <div className="flex shrink-0 items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
                                  {uncertain ? (
                                    <span className="mr-0.5 rounded-full bg-warning-bg px-1.5 py-0.5 font-geist text-[9px] font-bold text-warning">
                                      Tekshirish
                                    </span>
                                  ) : null}
                                  <button
                                    type="button"
                                    aria-label="Tahrirlash"
                                    onClick={() => setEditing(test)}
                                    className="grid h-10 w-10 place-items-center rounded-lg text-ink-3 transition hover:bg-muted hover:text-ink"
                                  >
                                    <PencilLine className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="O'chirish"
                                    onClick={() => {
                                      setResults((current) => current.filter((item) => item.id !== test.id))
                                      setChecked((current) => {
                                        const next = new Set(current)
                                        next.delete(test.id)
                                        return next
                                      })
                                    }}
                                    className="grid h-10 w-10 place-items-center rounded-lg text-ink-3 transition hover:bg-error-bg hover:text-error"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {(['a', 'b', 'c', 'd'] as const).map((key) => (
                                  <span
                                    key={key}
                                    className={cn(
                                      'rounded-[5px] border px-1.5 py-0.5 font-geist text-[10.5px]',
                                      test.correct === key
                                        ? 'border-brand bg-brand-soft font-semibold text-brand-text'
                                        : 'border-line text-ink-3',
                                    )}
                                  >
                                    {key.toUpperCase()}) {test.options[key]}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                                <span className="font-geist text-[10px] text-ink-3">
                                  To'g'ri: <span className="font-bold text-brand-text">{test.correct.toUpperCase()}</span>
                                </span>
                                <select
                                  value={test.difficulty}
                                  onChange={(event) =>
                                    setResults((current) =>
                                      current.map((item) =>
                                        item.id === test.id
                                          ? { ...item, difficulty: event.target.value as TestDifficulty }
                                          : item,
                                      ),
                                    )
                                  }
                                  aria-label="Daraja"
                                  className={cn(
                                    'h-9 rounded-[7px] border px-1.5 font-geist text-[10.5px] font-semibold outline-none sm:h-7',
                                    difficulty.soft,
                                    difficulty.text,
                                    'border-transparent',
                                  )}
                                >
                                  {DIFFICULTY.map((item) => (
                                    <option key={item.value} value={item.value}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line-2 bg-canvas px-3 py-2.5 sm:px-4 xl:hidden">
                <span className="font-geist text-[11px] font-medium text-ink-3">
                  {checked.size} tanlandi · {visibleResults.length} ko'rsatildi
                </span>
                <Button className="h-11" onClick={confirmImport} disabled={checked.size === 0}>
                  <UploadCloud className="h-4 w-4" /> Import ({checked.size})
                </Button>
              </div>
            </section>

            <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[20px] border border-line bg-white xl:flex">
              <div className="border-b border-line-2 p-4">
                <span className="inline-flex items-center gap-2 font-geist text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
                  <span className="h-px w-4 bg-brand" /> Import xulosasi
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <p className="font-geist text-[14px] font-bold text-ink">{results.length} ta savol tayyor</p>
                </div>
                <p className="mt-1 truncate font-geist text-[10.5px] text-ink-3">{file?.name}</p>
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3.5 [contain:paint]">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Topildi', value: results.length },
                    { label: 'Tanlandi', value: checked.size },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[10px] bg-canvas px-3 py-1.5">
                      <p className="font-geist text-[9.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">{item.label}</p>
                      <p className="mt-0.5 font-geist text-[15px] font-extrabold tabular text-ink">{number(item.value)}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-1.5 font-geist text-[10px] font-bold uppercase tracking-[0.06em] text-ink-3">Darajalar</p>
                  <div className="space-y-1">
                    {distribution.map((item) => (
                      <div key={item.value} className="flex items-center gap-2">
                        <span className="w-14 font-geist text-[10.5px] font-medium text-ink-2">{item.label}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className={cn('block h-full rounded-full', item.bar)}
                            style={{ width: `${results.length ? (item.count / results.length) * 100 : 0}%` }}
                          />
                        </span>
                        <span className="w-7 text-right font-geist text-[10px] font-semibold tabular text-ink-3">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {uncertainCount > 0 ? (
                  <div className="flex gap-2 rounded-[10px] bg-warning-bg px-2.5 py-2">
                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />
                    <p className="font-geist text-[10px] leading-snug text-warning">
                      {uncertainCount} ta savol noaniq belgilangan — importdan oldin tekshiring.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[10px] border border-line-2 px-3 py-2">
                  <p className="font-geist text-[9.5px] font-bold uppercase tracking-[0.06em] text-ink-3">Manzil</p>
                  <p className="mt-0.5 truncate font-geist text-[12px] font-semibold text-ink">
                    {newTopic ? newTopicName || 'Yangi mavzu' : destinationTopic?.name ?? '—'}
                  </p>
                  <p className="font-geist text-[10.5px] text-ink-3">{destinationSubject?.nameUz ?? '—'}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-line-2 p-3.5">
                <Button className="h-11 w-full" onClick={confirmImport} disabled={checked.size === 0}>
                  <UploadCloud className="h-4 w-4" /> {checked.size} ta testni import qilish
                </Button>
                <Button variant="ghost" className="h-9 w-full" onClick={reset}>
                  Bekor qilish
                </Button>
              </div>
            </aside>
          </div>
        ) : null}

        {editing ? (
          <EditQuestionModal
            key={editing.id}
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={(updated) => {
              setResults((current) => current.map((item) => (item.id === updated.id ? updated : item)))
              setEditing(null)
              toast({ title: 'Savol yangilandi', tone: 'success' })
            }}
          />
        ) : null}
      </div>
    </PageTransition>
  )
}

function EditQuestionModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Test
  onClose: () => void
  onSave: (test: Test) => void
}) {
  const [form, setForm] = useState<Test>(initial)
  const valid =
    form.question.trim() && form.options.a.trim() && form.options.b.trim() && form.options.c.trim() && form.options.d.trim()

  return (
    <Modal
      open
      onClose={onClose}
      title="Savolni tahrirlash"
      description="Manba PDF dan ajratilgan savolni tekshirib, to'g'rilang."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            className="h-11 sm:h-10"
            disabled={!valid}
            onClick={() =>
              onSave({
                ...form,
                question: form.question.trim(),
                options: {
                  a: form.options.a.trim(),
                  b: form.options.b.trim(),
                  c: form.options.c.trim(),
                  d: form.options.d.trim(),
                },
              })
            }
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Savol matni</span>
          <textarea
            value={form.question}
            onChange={(event) => setForm({ ...form, question: event.target.value })}
            rows={3}
            className={cn(fieldClass, 'h-auto resize-none py-2.5 leading-relaxed')}
          />
        </label>
        <div className="space-y-2">
          {(['a', 'b', 'c', 'd'] as const).map((key) => {
            const correct = form.correct === key
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 rounded-[10px] border p-1.5 pl-2 transition',
                  correct ? 'border-brand bg-brand-soft/60' : 'border-line',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-md font-geist text-[11.5px] font-bold',
                    correct ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                  )}
                >
                  {key.toUpperCase()}
                </span>
                <input
                  value={form.options[key]}
                  onChange={(event) => setForm({ ...form, options: { ...form.options, [key]: event.target.value } })}
                  className="h-10 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 font-geist text-[13px] font-medium text-ink outline-none placeholder:text-placeholder focus:border-line"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, correct: key })}
                  aria-pressed={correct}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 font-geist text-[10.5px] font-semibold transition',
                    correct ? 'text-brand-text' : 'text-ink-3 hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-3.5 w-3.5 place-items-center rounded-full border',
                      correct ? 'border-brand bg-brand' : 'border-[#d1d5db]',
                    )}
                  >
                    {correct ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
                  </span>
                  To'g'ri
                </button>
              </div>
            )
          })}
        </div>
        <label className="block sm:max-w-[50%]">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Daraja</span>
          <select
            value={form.difficulty}
            onChange={(event) => setForm({ ...form, difficulty: event.target.value as TestDifficulty })}
            className={fieldClass}
          >
            {DIFFICULTY.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  )
}
