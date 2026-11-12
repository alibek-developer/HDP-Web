'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Eye,
  FileQuestion,
  Lightbulb,
  Lock,
  Play,
  PlaySquare,
  Target,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { contentRoot } from '@/components/content/ContentShell'
import { Button, cn } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
import type { TestDifficulty } from '@/lib/types'

const DIFFICULTY: Record<TestDifficulty, { label: string; className: string }> = {
  easy: { label: 'Oson', className: 'bg-success-bg text-success' },
  medium: { label: "O'rta", className: 'bg-warning-bg text-warning' },
  hard: { label: 'Qiyin', className: 'bg-error-bg text-error' },
  olympiad: { label: 'Olimpiada', className: 'bg-info-bg text-info' },
}

export default function LessonPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const lessonId = params.id

  const topic = useAppStore((state) => state.topics.find((item) => item.id === lessonId))
  const subject = useAppStore((state) => state.subjects.find((item) => item.id === topic?.subjectId))
  const allVideos = useAppStore((state) => state.videos)
  const allExamples = useAppStore((state) => state.lessonExamples)
  const allTests = useAppStore((state) => state.tests)

  const videos = allVideos.filter((video) => video.topicId === lessonId)
  const examples = allExamples.filter((example) => example.topicId === lessonId)
  const tests = allTests.filter((test) => test.topicId === lessonId)

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [openSolution, setOpenSolution] = useState<string | null>(null)

  if (!topic) {
    return (
      <PageTransition>
        <div className={cn(contentRoot, 'items-center justify-center')}>
          <div className="rounded-[18px] border border-line bg-white px-6 py-10 text-center">
            <p className="font-geist text-[15px] font-bold text-ink">Dars topilmadi</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Bu dars o'chirilgan yoki manzil noto'g'ri.</p>
            <Button className="mt-4" onClick={() => router.push('/admin/content')}>
              <ArrowLeft className="h-4 w-4" /> Fanlarga qaytish
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  const activeVideo = videos.find((video) => video.id === activeVideoId) ?? videos[0]
  const startTest = () => router.push(`/admin/tests/run?lesson=${topic.id}`)

  return (
    <PageTransition>
      <div className={contentRoot}>
        <header className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/admin/content"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="max-w-[110px] truncate">{subject?.nameUz ?? 'Fanlar'}</span>
          </Link>
          <div className="order-last min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto">
            <h1 className="font-geist text-[19px] font-extrabold tracking-[-0.03em] text-ink sm:truncate">
              {topic.name}
            </h1>
            <p className="line-clamp-1 font-geist text-[11.5px] text-ink-3">
              {topic.description || "Dars tavsifi kiritilmagan"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            {topic.proOnly ? (
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-coin-bg px-2 font-geist text-[10px] font-bold uppercase tracking-[0.06em] text-coin">
                <Lock className="h-3 w-3" /> Pro
              </span>
            ) : null}
            <button
              type="button"
              onClick={startTest}
              className="inline-flex h-10 items-center gap-1.5 rounded-[11px] bg-ink px-3.5 font-geist text-[12.5px] font-bold text-white transition hover:bg-brand"
            >
              <FileQuestion className="h-4 w-4" />
              Testni boshlash
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pb-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0 space-y-3">
            <section className="overflow-hidden rounded-[18px] border border-line bg-white">
              {activeVideo ? (
                <>
                  <div className="relative aspect-video w-full bg-ink">
                    <iframe
                      key={activeVideo.youtubeId}
                      src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}`}
                      title={activeVideo.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 border-t border-line-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-geist text-[12.5px] font-semibold text-ink">{activeVideo.name}</p>
                      <p className="font-geist text-[10.5px] tabular text-ink-3">
                        {activeVideo.duration} · {number(activeVideo.views)} ko'rish
                      </p>
                    </div>
                    {activeVideo.proOnly ? (
                      <span className="rounded-full bg-coin-bg px-2 py-0.5 font-geist text-[9px] font-bold uppercase tracking-[0.06em] text-coin">
                        Pro
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted text-ink-3">
                  <PlaySquare className="h-7 w-7" />
                  <p className="font-geist text-[12.5px] font-semibold">Bu darsga video biriktirilmagan</p>
                </div>
              )}

              {videos.length > 1 ? (
                <div className="border-t border-line-2 p-2">
                  <p className="px-1 pb-1.5 font-geist text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                    Dars videolari
                  </p>
                  <div className="space-y-0.5">
                    {videos.map((video) => {
                      const isActive = video.id === activeVideo?.id
                      return (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => setActiveVideoId(video.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left transition',
                            isActive ? 'bg-brand-soft' : 'hover:bg-muted',
                          )}
                        >
                          <Play className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-brand' : 'text-ink-3')} />
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate font-geist text-[12px] font-medium',
                              isActive ? 'text-brand-text' : 'text-ink-2',
                            )}
                          >
                            {video.name}
                          </span>
                          <span className="shrink-0 font-geist text-[10.5px] tabular text-ink-3">{video.duration}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-[18px] border border-line bg-white">
              <header className="flex items-center gap-2 border-b border-line-2 px-3 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-brand-soft text-brand-text">
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-geist text-[13px] font-extrabold text-ink">Ishlanadigan misollar</p>
                  <p className="font-geist text-[10.5px] text-ink-3">Darsni mustahkamlash uchun {examples.length} ta masala</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 font-geist text-[10.5px] font-bold tabular text-ink-2">
                  {examples.length}
                </span>
              </header>

              {examples.length === 0 ? (
                <p className="px-3 py-6 text-center font-geist text-[12.5px] text-ink-3">
                  Bu darsga misollar hali qo'shilmagan.
                </p>
              ) : (
                <div className="divide-y divide-line-2">
                  {examples.map((example, index) => {
                    const open = openSolution === example.id
                    return (
                      <div key={example.id} className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-muted font-mono text-[10.5px] font-bold text-ink-3">
                            {index + 1}
                          </span>
                          <p className="min-w-0 flex-1 truncate font-geist text-[12.5px] font-semibold text-ink">
                            {example.title}
                          </p>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-1.5 py-0.5 font-geist text-[9px] font-bold uppercase tracking-[0.06em]',
                              example.level === 'easy'
                                ? 'bg-success-bg text-success'
                                : example.level === 'medium'
                                  ? 'bg-warning-bg text-warning'
                                  : 'bg-error-bg text-error',
                            )}
                          >
                            {example.level === 'easy' ? 'Oson' : example.level === 'medium' ? "O'rta" : 'Qiyin'}
                          </span>
                        </div>
                        <p className="mt-1.5 font-geist text-[13px] leading-relaxed text-ink-2">{example.prompt}</p>
                        <button
                          type="button"
                          onClick={() => setOpenSolution(open ? null : example.id)}
                          aria-expanded={open}
                          className="mt-1.5 inline-flex items-center gap-1 font-geist text-[11.5px] font-semibold text-brand-text transition hover:underline"
                        >
                          {open ? 'Yechimni yashirish' : "Yechimni ko'rsatish"}
                          <ChevronRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
                        </button>
                        {open ? (
                          <div className="mt-2 rounded-[10px] border border-line bg-muted/70 p-2.5">
                            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-ink-2">
                              {example.solution}
                            </pre>
                            <p className="mt-1.5 inline-flex rounded-md bg-white px-2 py-1 font-geist text-[11.5px] font-bold text-ink ring-1 ring-line">
                              Javob: {example.answer}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="min-w-0 space-y-3 lg:sticky lg:top-0">
            <section className="overflow-hidden rounded-[18px] border border-line bg-white">
              <header className="border-b border-line-2 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-brand-soft text-brand-text">
                    <FileQuestion className="h-3.5 w-3.5" />
                  </span>
                  <p className="min-w-0 flex-1 font-geist text-[13px] font-extrabold text-ink">Nazorat testlari</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-geist text-[10.5px] font-bold tabular text-ink-2">
                    {tests.length}
                  </span>
                </div>
                <p className="mt-1 font-geist text-[10.5px] tabular text-ink-3">
                  {tests.length} savol · ~{topic.avgMinutes} daqiqa · alohida ekranda
                </p>
                <button
                  type="button"
                  onClick={startTest}
                  disabled={tests.length === 0}
                  className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-ink font-geist text-[12.5px] font-bold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play className="h-4 w-4" /> Testni boshlash
                </button>
              </header>

              {tests.length === 0 ? (
                <p className="px-3 py-6 text-center font-geist text-[12.5px] text-ink-3">
                  Bu dars uchun testlar hali qo'shilmagan.
                </p>
              ) : (
                <div className="max-h-[420px] divide-y divide-line-2 overflow-y-auto">
                  {tests.map((test, index) => {
                    const difficulty = DIFFICULTY[test.difficulty]
                    return (
                      <div key={test.id} className="flex items-start gap-2 px-3 py-2">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-muted font-mono text-[9.5px] font-bold text-ink-3">
                          {index + 1}
                        </span>
                        <p className="line-clamp-2 min-w-0 flex-1 font-geist text-[11.5px] leading-snug text-ink-2">
                          {test.question}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 font-geist text-[8.5px] font-bold uppercase tracking-[0.05em]',
                            difficulty.className,
                          )}
                        >
                          {difficulty.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[18px] border border-line bg-white p-3">
              <p className="font-geist text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-3">Dars statistikasi</p>
              <dl className="mt-2 space-y-1.5">
                {[
                  { label: "Ko'rishlar", value: number(topic.views), icon: Eye },
                  { label: 'Test topshirganlar', value: number(topic.testTakers), icon: Target },
                  { label: "O'rtacha natija", value: `${topic.avgScore.toFixed(1)} / 10`, icon: FileQuestion },
                  { label: 'Davomiylik', value: `${topic.avgMinutes} daqiqa`, icon: Clock },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-ink-3" />
                      <dt className="min-w-0 flex-1 truncate font-geist text-[11.5px] text-ink-3">{item.label}</dt>
                      <dd className="shrink-0 font-geist text-[11.5px] font-bold tabular text-ink">{item.value}</dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
