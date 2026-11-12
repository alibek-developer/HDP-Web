'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Play,
  RotateCcw,
  X,
} from 'lucide-react'
import { Modal, cn } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import type { TestDifficulty } from '@/lib/types'

const LETTERS = ['a', 'b', 'c', 'd'] as const
type Letter = (typeof LETTERS)[number]

const DIFFICULTY: Record<TestDifficulty, { label: string; className: string }> = {
  easy: { label: 'Oson', className: 'bg-success-bg text-success' },
  medium: { label: "O'rta", className: 'bg-warning-bg text-warning' },
  hard: { label: 'Qiyin', className: 'bg-error-bg text-error' },
  olympiad: { label: 'Olimpiada', className: 'bg-info-bg text-info' },
}

const clock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`

function Runner() {
  const router = useRouter()
  const search = useSearchParams()
  const lessonId = search.get('lesson') ?? ''

  const topic = useAppStore((state) => state.topics.find((item) => item.id === lessonId))
  const subject = useAppStore((state) => state.subjects.find((item) => item.id === topic?.subjectId))
  const allTests = useAppStore((state) => state.tests)

  const questions = useMemo(
    () => allTests.filter((test) => test.topicId === lessonId).slice(0, 10),
    [allTests, lessonId],
  )

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Record<string, Letter>>>({})
  const [finished, setFinished] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)

  useEffect(() => {
    if (finished) return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [finished])

  const current = questions[step]
  const selected = current ? answers[current.id] : undefined
  const answeredCount = Object.keys(answers).length

  const score = useMemo(
    () => questions.filter((test) => answers[test.id] === test.correct).length,
    [questions, answers],
  )

  const leave = () => {
    if (lessonId) router.push(`/admin/content/lessons/${lessonId}`)
    else router.push('/admin/tests')
  }

  const restart = () => {
    setAnswers({})
    setStep(0)
    setFinished(false)
    setSeconds(0)
  }

  if (!topic || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-[#f4f3ef] px-4">
        <div className="w-full max-w-[420px] rounded-[20px] border border-line bg-white px-5 py-8 text-center">
          <p className="font-geist text-[15px] font-bold text-ink">Test topilmadi</p>
          <p className="mt-1 text-[12.5px] text-ink-3">
            Bu dars uchun savollar yo'q yoki havola noto'g'ri.
          </p>
          <button
            type="button"
            onClick={leave}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-ink px-4 font-geist text-[12.5px] font-bold text-white transition hover:bg-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Orqaga
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#f4f3ef]">
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-3 py-2.5 sm:px-4">
        <button
          type="button"
          aria-label="Chiqish"
          onClick={() => (answeredCount > 0 && !finished ? setExitOpen(true) : leave())}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] text-ink-3 transition hover:bg-muted hover:text-ink"
        >
          <X className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-geist text-[13px] font-bold text-ink">{topic.name}</p>
          <p className="truncate font-geist text-[10.5px] text-ink-3">
            {subject?.nameUz ?? 'Kontent'} · {questions.length} savol
          </p>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 font-geist text-[11.5px] font-bold tabular text-ink-2">
          <Clock className="h-3.5 w-3.5 text-ink-3" />
          {clock(seconds)}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-6">
        <div className="mx-auto w-full max-w-[680px]">
          {finished ? (
            <div className="space-y-3">
              <section className="rounded-[20px] border border-line bg-white p-5 text-center">
                <p className="font-geist text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">Natija</p>
                <div className="mt-3 flex items-center justify-center gap-2.5">
                  <span className="font-geist text-[46px] font-extrabold leading-none tracking-[-0.05em] tabular text-ink">
                    {score}
                  </span>
                  <span className="font-geist text-[18px] font-bold text-ink-3">/ {questions.length}</span>
                </div>
                <p className="mt-1 font-geist text-[12.5px] font-semibold text-ink-2">
                  {Math.round((score / questions.length) * 100)}% to'g'ri javob
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "To'g'ri", value: score, tone: 'text-success' },
                    { label: 'Xato', value: questions.length - score, tone: 'text-error' },
                    { label: 'Vaqt', value: clock(seconds), tone: 'text-ink' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[12px] bg-muted/70 py-2">
                      <p className={cn('font-geist text-[16px] font-extrabold tabular', item.tone)}>{item.value}</p>
                      <p className="mt-0.5 font-geist text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-line bg-white font-geist text-[12.5px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Qayta ishlash
                  </button>
                  <button
                    type="button"
                    onClick={leave}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-ink font-geist text-[12.5px] font-bold text-white transition hover:bg-brand"
                  >
                    Darsga qaytish
                  </button>
                </div>
              </section>

              <section className="overflow-hidden rounded-[20px] border border-line bg-white">
                <p className="border-b border-line-2 px-4 py-2.5 font-geist text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
                  Javoblar tahlili
                </p>
                <div className="divide-y divide-line-2">
                  {questions.map((test, index) => {
                    const given = answers[test.id]
                    const correct = given === test.correct
                    return (
                      <div key={test.id} className="flex items-start gap-2 px-4 py-2.5">
                        <span
                          className={cn(
                            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full',
                            correct ? 'bg-success-bg text-success' : 'bg-error-bg text-error',
                          )}
                        >
                          {correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-geist text-[12px] leading-snug text-ink-2">
                            {index + 1}. {test.question}
                          </p>
                          <p className="mt-0.5 font-geist text-[10.5px] tabular text-ink-3">
                            Sizning javob: {given ? `${given.toUpperCase()}) ${test.options[given]}` : 'belgilanmagan'}
                            {!correct ? ` · To'g'ri: ${test.correct.toUpperCase()}) ${test.options[test.correct]}` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          ) : (
            <>
              <section className="rounded-[20px] border border-line bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="font-geist text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
                    Savol {step + 1} / {questions.length}
                  </span>
                  <span
                    className={cn(
                      'ml-auto shrink-0 rounded-full px-2 py-0.5 font-geist text-[9px] font-bold uppercase tracking-[0.06em]',
                      DIFFICULTY[current.difficulty].className,
                    )}
                  >
                    {DIFFICULTY[current.difficulty].label}
                  </span>
                </div>

                <div className="mt-2 flex gap-1">
                  {questions.map((test, index) => (
                    <span
                      key={test.id}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        index === step ? 'bg-brand' : answers[test.id] ? 'bg-ink/30' : 'bg-muted',
                      )}
                    />
                  ))}
                </div>

                <p className="mt-4 font-geist text-[16px] font-bold leading-snug tracking-[-0.01em] text-ink sm:text-[18px]">
                  {current.question}
                </p>

                <div className="mt-4 space-y-2">
                  {LETTERS.map((letter) => {
                    const isSelected = selected === letter
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setAnswers((value) => ({ ...value, [current.id]: letter }))}
                        aria-pressed={isSelected}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition',
                          isSelected
                            ? 'border-brand bg-brand-soft'
                            : 'border-line bg-white hover:border-line-brand hover:bg-muted/60',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-7 w-7 shrink-0 place-items-center rounded-[8px] font-geist text-[12px] font-bold uppercase',
                            isSelected ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                          )}
                        >
                          {letter}
                        </span>
                        <span
                          className={cn(
                            'min-w-0 flex-1 font-geist text-[13.5px] font-medium',
                            isSelected ? 'text-brand-text' : 'text-ink-2',
                          )}
                        >
                          {current.options[letter]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[11px] border border-line bg-white px-3 font-geist text-[12.5px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Orqaga
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (step === questions.length - 1) setFinished(true)
                    else setStep((value) => value + 1)
                  }}
                  disabled={!selected}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-ink font-geist text-[13px] font-bold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {step === questions.length - 1 ? 'Yakunlash' : 'Keyingi savol'}
                  {step === questions.length - 1 ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-center font-geist text-[10.5px] tabular text-ink-3">
                Belgilangan: {answeredCount} / {questions.length}
              </p>
            </>
          )}
        </div>
      </div>

      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="Testni tashlab ketasizmi?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setExitOpen(false)}
              className="inline-flex h-10 items-center rounded-[10px] px-3 font-geist text-[12.5px] font-semibold text-ink-2 transition hover:bg-muted"
            >
              Davom etish
            </button>
            <button
              type="button"
              onClick={leave}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-ink px-3.5 font-geist text-[12.5px] font-bold text-white transition hover:bg-brand"
            >
              <Play className="h-3.5 w-3.5" /> Chiqish
            </button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          {answeredCount} ta javob saqlanmaydi. Testni boshidan boshlash uchun darsga qaytasiz.
        </p>
      </Modal>
    </div>
  )
}

export default function TestRunPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[60] bg-[#f4f3ef]" />}>
      <Runner />
    </Suspense>
  )
}
