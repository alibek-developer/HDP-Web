'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  PencilLine,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  Checkbox,
  DifficultyBadge,
  Field,
  Input,
  ProgressBar,
  Select,
  Spinner,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
import type { Test, TestDifficulty } from '@/lib/types'

type Stage = 'idle' | 'analyzing' | 'done'

interface ImportFile {
  name: string
  size: number
}

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

export default function PdfImportPage() {
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const importTests = useAppStore((state) => state.importTests)
  const upsertTopic = useAppStore((state) => state.upsertTopic)
  const { toast } = useToast()

  const inputRef = useRef<HTMLInputElement>(null)
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

  const topicOptions = useMemo(
    () => topics.filter((topic) => topic.subjectId === subjectId),
    [topics, subjectId],
  )

  const uncertainCount = useMemo(() => results.filter((test) => Number(test.id.split('-').pop()) % 18 === 0).length, [results])

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

    let value = 4
    const timer = window.setInterval(() => {
      value = Math.min(100, value + 4 + Math.random() * 6)
      setProgress(value)
      setExtracted(Math.round((value / 100) * 142))
      if (value >= 100) {
        window.clearInterval(timer)
        window.setTimeout(() => {
          const targetTopic = newTopic ? 'pending-new' : topicId
          const generated = generateTests(targetTopic, 142)
          setResults(generated)
          setChecked(new Set(generated.map((test) => test.id)))
          setStage('done')
        }, 450)
      }
    }, 180)
  }

  const reset = () => {
    setFile(null)
    setStage('idle')
    setProgress(0)
    setExtracted(0)
    setResults([])
    setChecked(new Set())
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
      description: newTopic ? `Yangi mavzu: ${newTopicName}` : topics.find((topic) => topic.id === topicId)?.name,
      tone: 'success',
    })
    reset()
  }

  const allChecked = results.length > 0 && results.every((test) => checked.has(test.id))

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            AI bilan PDF Import <Sparkles className="h-5 w-5 text-brand" />
          </span>
        }
        subtitle="PDF faylni yuklang — AI avtomatik mavzular, testlar va misollarni ajratadi"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Kontent', href: '/admin/content' }, { label: 'PDF Import' }]}
      />

      {stage === 'done' ? (
        <div className="space-y-4">
          {results.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 rounded-xl border border-line-brand bg-brand-soft px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <p className="text-[13px] font-semibold text-brand-text">AI {results.length} ta test topdi</p>
                <Badge tone="brand" className="ml-auto">
                  {file?.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#fde68a] bg-warning-bg px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                <p className="text-[12px] font-medium text-warning">
                  {uncertainCount} ta savol noaniq — tekshiring va darajasini tasdiqlang.
                </p>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-2 px-4 py-3">
              <Checkbox
                checked={allChecked}
                onChange={(value) =>
                  setChecked(value ? new Set(results.map((test) => test.id)) : new Set())
                }
                label={`Barchasini tanlash (${checked.size}/${results.length})`}
              />
              <span className="text-[11px] text-ink-3">Tahrirlash uchun savolni bosing</span>
            </div>
            <ul className="max-h-[640px] divide-y divide-line-2 overflow-y-auto">
              {results.map((test, index) => {
                const uncertain = Number(test.id.split('-').pop()) % 18 === 0
                return (
                  <li
                    key={test.id}
                    className={cn('px-4 py-3 transition', uncertain ? 'bg-warning-bg/40' : 'hover:bg-canvas')}
                  >
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={checked.has(test.id)}
                        onChange={(value) =>
                          setChecked((current) => {
                            const next = new Set(current)
                            if (value) next.add(test.id)
                            else next.delete(test.id)
                            return next
                          })
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12.5px] font-medium text-ink">
                            <span className="mr-1 text-ink-3">{index + 1}.</span>
                            {test.question}
                          </p>
                          <div className="flex shrink-0 items-center gap-1">
                            {uncertain ? <Badge tone="warning">Tekshirish</Badge> : null}
                            <button
                              type="button"
                              aria-label="O'chirish"
                              onClick={() => setResults((current) => current.filter((item) => item.id !== test.id))}
                              className="grid h-6 w-6 place-items-center rounded text-ink-3 hover:bg-error-bg hover:text-error"
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
                                'rounded border px-1.5 py-0.5 text-[10.5px]',
                                test.correct === key
                                  ? 'border-brand bg-brand-soft font-semibold text-brand-text'
                                  : 'border-line text-ink-3',
                              )}
                            >
                              {key.toUpperCase()}) {test.options[key]}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10.5px] text-ink-3">
                            To'g'ri: <span className="font-semibold text-brand-text">{test.correct.toUpperCase()}</span>
                          </span>
                          <DifficultyBadge level={test.difficulty} />
                          <Select
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
                            className="h-7 w-28 text-[11px]"
                          >
                            <option value="easy">Oson</option>
                            <option value="medium">O'rta</option>
                            <option value="hard">Qiyin</option>
                            <option value="olympiad">Olimpiada</option>
                          </Select>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-text hover:underline"
                            onClick={() =>
                              toast({
                                title: 'Tahrirlash',
                                description: "To'liq tahrirlash testlar sahifasida mavjud.",
                                tone: 'info',
                              })
                            }
                          >
                            <PencilLine className="h-3 w-3" /> Tahrirlash
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 bg-canvas px-4 py-3">
              <span className="text-[12px] text-ink-3">
                {checked.size} ta test tanlandi · {number(results.length)} ta topildi
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={reset}>
                  Bekor qilish
                </Button>
                <Button onClick={confirmImport} disabled={checked.size === 0}>
                  <UploadCloud className="h-4 w-4" /> {checked.size} ta testni import qilish
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : stage === 'analyzing' ? (
        <div className="mx-auto max-w-2xl">
          <div className="card p-5">
            <div className="flex items-center gap-2.5">
              <Spinner className="h-4 w-4 text-brand" />
              <p className="text-[13px] font-semibold text-ink">AI tahlil qilmoqda...</p>
              <span className="ml-auto text-[12px] font-semibold tabular text-brand-text">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} height={6} className="mt-3" animated={false} />
            <ul className="mt-4 space-y-2.5 text-[12.5px]">
              {[
                { label: `PDF o'qildi (${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB)`, done: progress > 18, active: false },
                { label: '150 sahifa topildi', done: progress > 36, active: false },
                {
                  label: `Testlar ajratilmoqda... (${extracted}/142)`,
                  done: progress >= 100,
                  active: progress > 36 && progress < 100,
                },
                { label: 'Misollar ajratilmoqda...', done: progress > 78, active: progress > 60 && progress <= 78 },
                { label: 'Mavzular aniqlanmoqda...', done: progress >= 100, active: progress > 78 && progress < 100 },
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
              <span className="text-[11px] text-ink-3">{file?.name}</span>
              <Button variant="ghost" size="sm" onClick={reset}>
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div
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
                'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition',
                dragOver ? 'border-brand bg-brand-soft' : 'border-line-brand bg-white hover:bg-brand-soft/50',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
              />
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                <FileText className="h-7 w-7" />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">PDF faylni tashlang yoki tanlang</p>
              <p className="mt-1 text-[12px] text-ink-3">Fayl ichidagi testlar, misollar va mavzular AI yordamida ajratiladi</p>
              <p className="mt-3 text-[11px] text-ink-3">Maksimal hajm: 50 MB · Faqat .pdf</p>
              {file ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-line-brand bg-white px-3 py-2 text-[12px]">
                  <FileText className="h-4 w-4 text-brand" />
                  <span className="max-w-[220px] truncate font-medium text-ink">{file.name}</span>
                  <span className="text-ink-3">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button
                    type="button"
                    aria-label="Faylni olib tashlash"
                    onClick={(event) => {
                      event.stopPropagation()
                      setFile(null)
                    }}
                    className="ml-1 text-ink-3 hover:text-error"
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </div>

            <div className="card space-y-3.5 p-4">
              <Field label="Fan" required>
                <Select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nameUz}
                    </option>
                  ))}
                </Select>
              </Field>

              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Mavzu</p>
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTopic(false)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition',
                      !newTopic ? 'border-brand bg-brand-soft text-brand-text' : 'border-line text-ink-3',
                    )}
                  >
                    Mavjud mavzu
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTopic(true)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition',
                      newTopic ? 'border-brand bg-brand-soft text-brand-text' : 'border-line text-ink-3',
                    )}
                  >
                    Yangi mavzu
                  </button>
                </div>
                {newTopic ? (
                  <Input
                    value={newTopicName}
                    onChange={(event) => setNewTopicName(event.target.value)}
                    placeholder="Yangi mavzu nomi"
                  />
                ) : (
                  <Select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                    {topicOptions.length === 0 ? <option value="">Mavzu yo'q</option> : null}
                    {topicOptions.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <Button className="w-full" size="md" onClick={startAnalysis} disabled={!file}>
                <Sparkles className="h-4 w-4" /> Tahlil qilish
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="card p-4">
              <p className="h4 text-ink">AI qanday ishlaydi?</p>
              <ol className="mt-2 space-y-2 text-[12px] text-ink-3">
                {[
                  "PDF matni va formulalar o'qiladi",
                  'Testlar, javob variantlari ajratiladi',
                  "Har bir savol darajasi baholanadi",
                  "Noaniq savollar belgilanadi",
                  'Tasdiqlangandan keyin bazaga yoziladi',
                ].map((item, index) => (
                  <li key={item} className="flex gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-text">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-line-brand bg-brand-soft p-4">
              <p className="text-[12.5px] font-semibold text-brand-text">Maslahat</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-brand-text/80">
                Skanerlangan PDF emas, matnli PDF ishlatilsa aniqlik yuqori bo'ladi. Formulalar LaTeX ko'rinishida
                saqlanadi.
              </p>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
