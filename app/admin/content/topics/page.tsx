'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileQuestion,
  GripVertical,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video as VideoIcon,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { ContentHeader, ContentTabs, contentRoot } from '@/components/content/ContentShell'
import {
  Badge,
  Button,
  Drawer,
  Dropdown,
  EmptyState,
  Modal,
  Switch,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, number, percent } from '@/lib/format'
import type { ContentStatus, SubjectColor, Test, TestDifficulty, Topic, Video } from '@/lib/types'

const STATUS: Record<ContentStatus, { label: string; text: string; dot: string; soft: string }> = {
  active: { label: 'Faol', text: 'text-brand-text', dot: 'bg-brand', soft: 'bg-brand-soft' },
  draft: { label: 'Draft', text: 'text-warning', dot: 'bg-warning', soft: 'bg-warning-bg' },
  hidden: { label: 'Yashirin', text: 'text-ink-3', dot: 'bg-ink-3/50', soft: 'bg-muted' },
}

const TONES: Record<SubjectColor, { soft: string; text: string; dot: string }> = {
  green: { soft: 'bg-[#dcfce7]', text: 'text-[#15803d]', dot: 'bg-[#16a34a]' },
  blue: { soft: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]', dot: 'bg-[#2563eb]' },
  violet: { soft: 'bg-[#ede9fe]', text: 'text-[#6d28d9]', dot: 'bg-[#7c3aed]' },
  amber: { soft: 'bg-[#fef3c7]', text: 'text-[#b45309]', dot: 'bg-[#d97706]' },
  red: { soft: 'bg-[#fee2e2]', text: 'text-[#b91c1c]', dot: 'bg-[#dc2626]' },
  gray: { soft: 'bg-[#f3f4f6]', text: 'text-[#4b5563]', dot: 'bg-[#9ca3af]' },
}

const toneOf = (color?: SubjectColor) => TONES[color ?? 'gray'] ?? TONES.gray

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

const youtubeIdFrom = (input: string): string => {
  const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  if (match) return match[1]
  return input.trim().slice(0, 11)
}

export default function TopicsPage() {
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const videos = useAppStore((state) => state.videos)
  const tests = useAppStore((state) => state.tests)
  const upsertTopic = useAppStore((state) => state.upsertTopic)
  const deleteTopic = useAppStore((state) => state.deleteTopic)
  const reorderTopics = useAppStore((state) => state.reorderTopics)
  const { toast } = useToast()

  const [subjectFilter, setSubjectFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ContentStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    const subjectParam = new URLSearchParams(window.location.search).get('subject')
    if (subjectParam) setSubjectFilter(subjectParam)
  }, [])

  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.nameUz ?? '—'
  const subjectById = (id: string) => subjects.find((subject) => subject.id === id)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return topics
      .filter((topic) => (subjectFilter === 'all' ? true : topic.subjectId === subjectFilter))
      .filter((topic) => (status === 'all' ? true : topic.status === status))
      .filter((topic) => (term ? topic.name.toLowerCase().includes(term) : true))
      .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
  }, [topics, subjectFilter, status, search])

  useEffect(() => {
    if (filtered.length === 0) {
      if (selectedId !== null) setSelectedId(null)
      return
    }
    if (!selectedId || !filtered.some((topic) => topic.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const counts = useMemo(() => {
    const videoCount = new Map<string, number>()
    const testCount = new Map<string, number>()
    for (const video of videos) videoCount.set(video.topicId, (videoCount.get(video.topicId) ?? 0) + 1)
    for (const test of tests) testCount.set(test.topicId, (testCount.get(test.topicId) ?? 0) + 1)
    return { videoCount, testCount }
  }, [videos, tests])

  const selectedTopic = topics.find((topic) => topic.id === selectedId) ?? null
  const drawerTopic = topics.find((topic) => topic.id === drawerId) ?? null

  const openTopic = (id: string) => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches) {
      setSelectedId(id)
    } else {
      setDrawerId(id)
    }
  }

  const move = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const dragTopic = topics.find((topic) => topic.id === dragId)
    const targetTopic = topics.find((topic) => topic.id === targetId)
    if (!dragTopic || !targetTopic || dragTopic.subjectId !== targetTopic.subjectId) return
    const siblings = topics
      .filter((topic) => topic.subjectId === dragTopic.subjectId)
      .sort((left, right) => left.order - right.order)
    const without = siblings.filter((topic) => topic.id !== dragId)
    const index = without.findIndex((topic) => topic.id === targetId)
    without.splice(index, 0, dragTopic)
    reorderTopics(without.map((topic) => topic.id))
    toast({ title: 'Tartib yangilandi', description: dragTopic.name, tone: 'success' })
  }

  return (
    <PageTransition>
      <div className={contentRoot}>
        <ContentHeader
          title="Mavzular"
          count={topics.length}
          subtitle="Mavzuni tanlang — videolar, testlar va statistikasi bir joyda."
          actions={
            <>
              <Link
                href="/admin/content/import"
                aria-label="PDF import"
                className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-line bg-white px-3.5 font-geist text-[13px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink sm:px-4"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">PDF import</span>
              </Link>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ink px-3.5 font-geist text-[13px] font-bold text-white transition hover:bg-brand sm:px-4"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Yangi mavzu</span>
                <span className="sm:hidden">Mavzu</span>
              </button>
            </>
          }
        />

        <ContentTabs />

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-line bg-white">
            <div className="shrink-0 border-b border-line-2 px-3 pb-2.5 pt-3 sm:px-4">
              <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
                <button
                  type="button"
                  onClick={() => setSubjectFilter('all')}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-geist text-[12px] font-semibold transition',
                    subjectFilter === 'all'
                      ? 'bg-ink text-white'
                      : 'border border-line bg-white text-ink-3 hover:border-line-brand hover:text-ink',
                  )}
                >
                  Barchasi
                  <span className={cn('tabular text-[10px]', subjectFilter === 'all' ? 'text-white/70' : 'text-ink-3/70')}>
                    {topics.length}
                  </span>
                </button>
                {subjects.map((subject) => {
                  const total = topics.filter((topic) => topic.subjectId === subject.id).length
                  const active = subjectFilter === subject.id
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => setSubjectFilter(subject.id)}
                      className={cn(
                        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-geist text-[12px] font-semibold transition',
                        active
                          ? 'bg-ink text-white'
                          : 'border border-line bg-white text-ink-3 hover:border-line-brand hover:text-ink',
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-brand-light' : toneOf(subject.color).dot)} />
                      {subject.nameUz}
                      <span className={cn('tabular text-[10px]', active ? 'text-white/70' : 'text-ink-3/70')}>{total}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Mavzu nomi bo'yicha qidirish..."
                    className="h-10 w-full rounded-[10px] border border-line bg-white pl-9 pr-8 font-geist text-[12.5px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                  {search ? (
                    <button
                      type="button"
                      aria-label="Tozalash"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-3 hover:bg-muted"
                    >
                      <span className="text-[15px] leading-none">×</span>
                    </button>
                  ) : null}
                </div>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'all' | ContentStatus)}
                  aria-label="Status"
                  className="h-10 w-[122px] shrink-0 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12px] font-semibold text-ink-2 outline-none transition hover:border-line-brand focus:border-brand"
                >
                  <option value="all">Barcha status</option>
                  <option value="active">Faol</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Yashirin</option>
                </select>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="grid h-full min-h-[220px] place-items-center px-4">
                  <EmptyState
                    title="Mavzu topilmadi"
                    text="Filtrlarni o'zgartiring yoki yangi mavzu qo'shing."
                    icon={<Layers className="h-5 w-5" />}
                    action={
                      <Button size="sm" onClick={() => setNewOpen(true)}>
                        Yangi mavzu
                      </Button>
                    }
                  />
                </div>
              ) : (
                filtered.map((topic, index) => {
                  const active = topic.id === selectedId
                  const subject = subjectById(topic.subjectId)
                  const statusMeta = STATUS[topic.status]
                  return (
                    <div
                      key={topic.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={(event) => {
                        setDragId(topic.id)
                        event.dataTransfer.setData('text/plain', topic.id)
                      }}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => move(topic.id)}
                      onClick={() => openTopic(topic.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openTopic(topic.id)
                        }
                      }}
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-2.5 border-b border-line-2 px-3 py-2.5 transition last:border-0 sm:px-4',
                        active ? 'bg-brand-soft/50' : 'hover:bg-muted/60',
                        dragId === topic.id && 'opacity-40',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute inset-y-2 left-0 w-[3px] rounded-r-full transition',
                          active ? 'bg-brand' : 'bg-transparent',
                        )}
                      />
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-3/60 active:cursor-grabbing" aria-label="Tartibni o'zgartirish" />
                      <span className="w-5 shrink-0 text-right font-mono text-[10.5px] font-semibold text-ink-3">
                        {String(subjectFilter === 'all' ? index + 1 : topic.order).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'truncate font-geist text-[13px] font-semibold',
                              active ? 'text-brand-text' : 'text-ink',
                            )}
                          >
                            {topic.name}
                          </span>
                          {topic.proOnly ? (
                            <span className="shrink-0 rounded bg-[#ede9fe] px-1 py-0.5 font-geist text-[8.5px] font-bold leading-none text-[#6d28d9]">
                              PRO
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-2.5 font-geist text-[10.5px] font-medium text-ink-3">
                          <span className="inline-flex items-center gap-1">
                            <VideoIcon className="h-3 w-3" /> {counts.videoCount.get(topic.id) ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FileQuestion className="h-3 w-3" /> {counts.testCount.get(topic.id) ?? 0}
                          </span>
                          <span className="truncate text-ink-3/80">{subject?.nameUz}</span>
                        </div>
                      </div>
                      <span className={cn('hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block', statusMeta.dot)} />
                      <div
                        className="shrink-0"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Dropdown
                          trigger={
                            <button
                              type="button"
                              aria-label="Amallar"
                              className="grid h-10 w-8 place-items-center rounded-lg text-ink-3 transition hover:bg-white hover:text-ink"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                          items={[
                            {
                              label: 'Tahrirlash',
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => openTopic(topic.id),
                            },
                            {
                              label: 'PDF import',
                              icon: <Sparkles className="h-3.5 w-3.5" />,
                              onClick: () => {
                                window.location.href = `/admin/content/import?topic=${topic.id}`
                              },
                            },
                            { separator: true, label: 'sep' },
                            {
                              label: "O'chirish",
                              danger: true,
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              onClick: () => setDeleteTarget(topic),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-line-2 px-4 py-2 font-geist text-[11px] font-medium text-ink-3">
              <span>
                {number(filtered.length)} mavzu
                {subjectFilter !== 'all' ? ` · ${subjectName(subjectFilter)}` : ''}
              </span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <GripVertical className="h-3 w-3" /> sudrab tartiblang
              </span>
            </div>
          </section>

          <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[20px] border border-line bg-white xl:flex">
            {selectedTopic ? (
              <TopicDetail
                key={selectedTopic.id}
                topic={selectedTopic}
                onDelete={() => setDeleteTarget(selectedTopic)}
              />
            ) : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-ink-3">
                    <Layers className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-geist text-[13px] font-semibold text-ink">Mavzu tanlanmagan</p>
                  <p className="mt-1 font-geist text-[11.5px] text-ink-3">
                    Chapdagi ro'yxatdan mavzuni tanlang — kontenti shu yerda ochiladi.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <Drawer
          open={Boolean(drawerTopic)}
          onClose={() => setDrawerId(null)}
          title={drawerTopic?.name ?? 'Mavzu'}
          subtitle={drawerTopic ? `${subjectName(drawerTopic.subjectId)} · ${STATUS[drawerTopic.status].label}` : undefined}
          widthClass="sm:w-[560px]"
        >
          {drawerTopic ? (
            <TopicDetail
              key={drawerTopic.id}
              topic={drawerTopic}
              embedded
              onDelete={() => setDeleteTarget(drawerTopic)}
            />
          ) : null}
        </Drawer>

        <NewTopicModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          defaultSubjectId={subjectFilter !== 'all' ? subjectFilter : undefined}
          onCreate={(topic) => {
            upsertTopic(topic)
            setNewOpen(false)
            if (subjectFilter !== 'all' && topic.subjectId !== subjectFilter) setSubjectFilter('all')
            setStatus('all')
            setSearch('')
            openTopic(topic.id)
            toast({ title: "Mavzu qo'shildi", description: topic.name, tone: 'success' })
          }}
        />

        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Mavzuni o'chirish"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                className="h-11 sm:h-10"
                onClick={() => {
                  if (!deleteTarget) return
                  deleteTopic(deleteTarget.id)
                  toast({ title: "Mavzu o'chirildi", description: deleteTarget.name, tone: 'success' })
                  setDeleteTarget(null)
                  setDrawerId(null)
                }}
              >
                <Trash2 className="h-4 w-4" /> O'chirish
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold">{deleteTarget?.name}</span> mavzusi, unga tegishli videolar va testlar
            o'chiriladi.
          </p>
        </Modal>
      </div>
    </PageTransition>
  )
}

type TopicTab = 'main' | 'videos' | 'tests' | 'stats'

function TopicDetail({
  topic,
  embedded = false,
  onDelete,
}: {
  topic: Topic
  embedded?: boolean
  onDelete: () => void
}) {
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const videos = useAppStore((state) => state.videos)
  const tests = useAppStore((state) => state.tests)
  const upsertTopic = useAppStore((state) => state.upsertTopic)
  const upsertVideo = useAppStore((state) => state.upsertVideo)
  const deleteVideo = useAppStore((state) => state.deleteVideo)
  const reorderVideos = useAppStore((state) => state.reorderVideos)
  const deleteTest = useAppStore((state) => state.deleteTest)
  const upsertTest = useAppStore((state) => state.upsertTest)
  const { toast } = useToast()

  const [tab, setTab] = useState<TopicTab>('main')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(topic)
  const [videoOpen, setVideoOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testPage, setTestPage] = useState(1)
  const [dragVideoId, setDragVideoId] = useState<string | null>(null)

  const subject = subjects.find((item) => item.id === topic.subjectId)
  const tone = toneOf(subject?.color)
  const statusMeta = STATUS[topic.status]

  const topicVideos = useMemo(
    () => videos.filter((video) => video.topicId === topic.id).sort((left, right) => left.order - right.order),
    [videos, topic.id],
  )
  const topicTests = useMemo(
    () => tests.filter((test) => test.topicId === topic.id).sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    [tests, topic.id],
  )
  const testPageCount = Math.max(1, Math.ceil(topicTests.length / 10))
  const visibleTests = topicTests.slice((testPage - 1) * 10, testPage * 10)

  const peers = useMemo(
    () => topics.filter((item) => item.subjectId === topic.subjectId && item.id !== topic.id && item.views > 0),
    [topics, topic.subjectId, topic.id],
  )
  const peerAverage = peers.length ? peers.reduce((sum, item) => sum + item.views, 0) / peers.length : 0
  const peerDelta = peerAverage ? ((topic.views - peerAverage) / peerAverage) * 100 : 0

  const save = () => {
    if (!form.name.trim()) {
      toast({ title: 'Mavzu nomini kiriting', tone: 'warning' })
      return
    }
    upsertTopic({ ...form, name: form.name.trim(), description: form.description.trim() })
    toast({ title: 'Mavzu saqlandi', description: form.name.trim(), tone: 'success' })
    setEditing(false)
  }

  const moveVideo = (targetId: string) => {
    if (!dragVideoId || dragVideoId === targetId) return
    const dragged = topicVideos.find((video) => video.id === dragVideoId)
    if (!dragged) return
    const without = topicVideos.filter((video) => video.id !== dragVideoId)
    const index = without.findIndex((video) => video.id === targetId)
    without.splice(index, 0, dragged)
    reorderVideos(without.map((video) => video.id))
    toast({ title: 'Video tartibi yangilandi', description: dragged.name, tone: 'success' })
  }

  const tabs: Array<{ value: TopicTab; label: string; count?: number }> = [
    { value: 'main', label: 'Asosiy' },
    { value: 'videos', label: 'Videolar', count: topicVideos.length },
    { value: 'tests', label: 'Testlar', count: topicTests.length },
    { value: 'stats', label: 'Statistika' },
  ]

  return (
    <div className={cn('flex flex-col', embedded ? 'min-h-full' : 'h-full min-h-0')}>
      {embedded ? (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-geist text-[10px] font-bold', statusMeta.soft, statusMeta.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} /> {statusMeta.label}
            </span>
            {topic.proOnly ? <Badge tone="violet">PRO</Badge> : null}
            <span className="font-geist text-[11px] text-ink-3">#{topic.order} · {date(topic.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setTab('main')
                setEditing(true)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-line px-2.5 font-geist text-[12px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink"
            >
              <Pencil className="h-3.5 w-3.5" /> Tahrirlash
            </button>
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Amallar"
                  className="grid h-9 w-9 place-items-center rounded-[9px] border border-line text-ink-3 transition hover:text-ink"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
              items={[
                {
                  label: "O'chirish",
                  danger: true,
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: onDelete,
                },
              ]}
            />
          </div>
        </div>
      ) : (
        <header className="shrink-0 border-b border-line-2 px-4 pb-3 pt-4">
          <div className="flex items-start gap-2.5">
            <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-[13px] font-geist text-[16px] font-extrabold', tone.soft, tone.text)}>
              {subject?.icon || subject?.nameUz.slice(0, 1) || 'M'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate font-geist text-[15px] font-bold tracking-[-0.01em] text-ink">{topic.name}</h2>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-geist text-[9.5px] font-bold uppercase tracking-[0.05em]', statusMeta.soft, statusMeta.text)}>
                  <span className={cn('h-1 w-1 rounded-full', statusMeta.dot)} /> {statusMeta.label}
                </span>
                {topic.proOnly ? <Badge tone="violet">PRO</Badge> : null}
              </div>
              <p className="mt-1 font-geist text-[11px] text-ink-3">
                {subject?.nameUz ?? '—'} · #{topic.order} · {date(topic.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTab('main')
                  setEditing(true)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-line px-2.5 font-geist text-[12px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden 2xl:inline">Tahrirlash</span>
              </button>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    aria-label="Amallar"
                    className="grid h-9 w-9 place-items-center rounded-[9px] border border-line text-ink-3 transition hover:text-ink"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                }
                items={[
                  {
                    label: 'PDF import',
                    icon: <Sparkles className="h-3.5 w-3.5" />,
                    onClick: () => {
                      window.location.href = `/admin/content/import?topic=${topic.id}`
                    },
                  },
                  { separator: true, label: 'sep' },
                  {
                    label: "O'chirish",
                    danger: true,
                    icon: <Trash2 className="h-3.5 w-3.5" />,
                    onClick: onDelete,
                  },
                ]}
              />
            </div>
          </div>

          <TopicTabs className="mt-3" tabs={tabs} value={tab} onChange={setTab} />
        </header>
      )}

      {embedded ? <TopicTabs className="mt-3" tabs={tabs} value={tab} onChange={setTab} /> : null}

      <div className={cn('min-h-0 flex-1 px-4 py-3.5', embedded ? 'overflow-visible' : 'overflow-y-auto')}>
        {tab === 'main' ? (
          editing ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Fan</span>
                  <select
                    value={form.subjectId}
                    onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
                    className={fieldClass}
                  >
                    {subjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nameUz}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as ContentStatus })}
                    className={fieldClass}
                  >
                    <option value="active">Faol</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Yashirin</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">
                  Mavzu nomi <span className="text-error">*</span>
                </span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className={fieldClass}
                  placeholder="Mavzu nomi"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Tavsif</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={3}
                  className={cn(fieldClass, 'h-auto resize-none py-2.5 leading-relaxed')}
                  placeholder="Mavzu haqida qisqacha"
                />
              </label>
              <label className="block sm:max-w-[50%]">
                <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Tartib raqami</span>
                <input
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
                  className={fieldClass}
                />
              </label>
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2.5">
                <div>
                  <p className="font-geist text-[12px] font-semibold text-ink">Faqat Pro foydalanuvchilar uchun</p>
                  <p className="font-geist text-[10.5px] text-ink-3">Bepul foydalanuvchilar bu mavzuni ko'rmaydi</p>
                </div>
                <Switch checked={form.proOnly} onChange={(value) => setForm({ ...form, proOnly: value })} size="sm" />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-line-2 pt-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setForm(topic)
                    setEditing(false)
                  }}
                >
                  Bekor qilish
                </Button>
                <Button className="h-11 sm:h-10" onClick={save}>
                  Saqlash
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className={cn('rounded-[12px] px-3 py-2.5 font-geist text-[12px] leading-relaxed', topic.description ? 'bg-muted/70 text-ink-2' : 'bg-muted/50 text-ink-3')}>
                {topic.description || 'Tavsif kiritilmagan — Tahrirlash orqali qo\'shing.'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTab('videos')}
                  className="rounded-[12px] border border-line-2 bg-white p-3 text-left transition hover:border-line-brand"
                >
                  <span className="flex items-center gap-1.5 font-geist text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    <VideoIcon className="h-3.5 w-3.5" /> Videolar
                  </span>
                  <span className="mt-1.5 block font-geist text-[20px] font-extrabold leading-none tabular text-ink">
                    {topicVideos.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('tests')}
                  className="rounded-[12px] border border-line-2 bg-white p-3 text-left transition hover:border-line-brand"
                >
                  <span className="flex items-center gap-1.5 font-geist text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    <FileQuestion className="h-3.5 w-3.5" /> Testlar
                  </span>
                  <span className="mt-1.5 block font-geist text-[20px] font-extrabold leading-none tabular text-ink">
                    {topicTests.length}
                  </span>
                </button>
                <div className="rounded-[12px] border border-line-2 bg-white p-3">
                  <span className="flex items-center gap-1.5 font-geist text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    <Eye className="h-3.5 w-3.5" /> Ko'rishlar
                  </span>
                  <span className="mt-1.5 block font-geist text-[20px] font-extrabold leading-none tabular text-ink">
                    {number(topic.views)}
                  </span>
                </div>
                <div className="rounded-[12px] border border-line-2 bg-white p-3">
                  <span className="flex items-center gap-1.5 font-geist text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    <BarChart3 className="h-3.5 w-3.5" /> Test topshirganlar
                  </span>
                  <span className="mt-1.5 block font-geist text-[20px] font-extrabold leading-none tabular text-ink">
                    {number(topic.testTakers)}
                  </span>
                </div>
              </div>
              <div className="rounded-[12px] border border-dashed border-line px-3 py-2.5 font-geist text-[11px] leading-relaxed text-ink-3">
                Video va testlarni yuqoridagi bo'limlardan boshqaring. PDF fayldan testlarni avtomatik ajratish uchun{' '}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/admin/content/import?topic=${topic.id}`
                  }}
                  className="font-semibold text-brand-text hover:underline"
                >
                  PDF import
                </button>{' '}
                dan foydalaning.
              </div>
            </div>
          )
        ) : null}

        {tab === 'videos' ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-geist text-[11.5px] text-ink-3">
                {topicVideos.length} ta video · sudrab tartiblang
              </p>
              <Button size="sm" className="h-9" onClick={() => setVideoOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Qo'shish
              </Button>
            </div>
            {topicVideos.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-line px-4 py-8">
                <EmptyState
                  title="Videolar yo'q"
                  text="Bu mavzuga birinchi videoni qo'shing."
                  icon={<VideoIcon className="h-5 w-5" />}
                />
              </div>
            ) : (
              <ul className="space-y-2">
                {topicVideos.map((video) => (
                  <li
                    key={video.id}
                    draggable
                    onDragStart={(event) => {
                      setDragVideoId(video.id)
                      event.dataTransfer.setData('text/plain', video.id)
                    }}
                    onDragEnd={() => setDragVideoId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveVideo(video.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-[10px] border border-line p-2 transition',
                      dragVideoId === video.id && 'opacity-40',
                    )}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-3/60 active:cursor-grabbing" aria-label="Tartibni o'zgartirish" />
                    <div className="relative shrink-0">
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.name}
                        className="h-10 w-[72px] rounded-md bg-muted object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 font-geist text-[8px] font-semibold text-white">
                        {video.duration}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-geist text-[12px] font-semibold text-ink">{video.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 font-geist text-[10px] text-ink-3">
                        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS[video.status].dot)} />
                        {STATUS[video.status].label}
                        {video.proOnly ? ' · PRO' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Videoni o'chirish"
                      onClick={() => {
                        deleteVideo(video.id)
                        toast({ title: "Video o'chirildi", tone: 'success' })
                      }}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-3 transition hover:bg-error-bg hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === 'tests' ? (
          <div>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/content/import?topic=${topic.id}`}>
                <Button size="sm" variant="secondary" className="h-9">
                  <Sparkles className="h-3.5 w-3.5" /> PDF import
                </Button>
              </Link>
              <Button size="sm" className="h-9" onClick={() => setTestOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Test qo'shish
              </Button>
            </div>
            {topicTests.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-line px-4 py-8">
                <EmptyState
                  title="Testlar yo'q"
                  text="PDF import yoki qo'lda test qo'shing."
                  icon={<FileQuestion className="h-5 w-5" />}
                />
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {visibleTests.map((test, index) => (
                    <li key={test.id} className="rounded-[10px] border border-line px-2.5 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 font-geist text-[11.5px] font-medium leading-snug text-ink">
                          <span className="mr-1 text-ink-3">{(testPage - 1) * 10 + index + 1}.</span>
                          {test.question}
                        </p>
                        <button
                          type="button"
                          aria-label="Testni o'chirish"
                          onClick={() => {
                            deleteTest(test.id)
                            toast({ title: "Test o'chirildi", tone: 'success' })
                            setTestPage((page) => Math.min(page, Math.max(1, Math.ceil((topicTests.length - 1) / 10))))
                          }}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-3 transition hover:bg-error-bg hover:text-error"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-geist text-[10px] text-ink-3">
                        <span>
                          To'g'ri:{' '}
                          <span className="font-bold text-brand-text">{test.correct.toUpperCase()}</span>
                          <span className="text-ink-3"> — {test.options[test.correct]}</span>
                        </span>
                        <Badge
                          tone={
                            test.difficulty === 'easy'
                              ? 'success'
                              : test.difficulty === 'medium'
                                ? 'warning'
                                : test.difficulty === 'hard'
                                  ? 'danger'
                                  : 'info'
                          }
                          className="px-1.5 py-0 text-[9.5px]"
                        >
                          {test.difficulty === 'easy'
                            ? 'Oson'
                            : test.difficulty === 'medium'
                              ? "O'rta"
                              : test.difficulty === 'hard'
                                ? 'Qiyin'
                                : 'Olimpiada'}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 flex items-center justify-between font-geist text-[10.5px] text-ink-3">
                  <span className="tabular">
                    {(testPage - 1) * 10 + 1}–{Math.min(testPage * 10, topicTests.length)} / {topicTests.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Oldingi"
                      disabled={testPage === 1}
                      onClick={() => setTestPage((page) => Math.max(1, page - 1))}
                      className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink-3 transition hover:text-ink disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Keyingi"
                      disabled={testPage >= testPageCount}
                      onClick={() => setTestPage((page) => Math.min(testPageCount, page + 1))}
                      className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink-3 transition hover:text-ink disabled:opacity-40"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === 'stats' ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Ko'rishlar", value: number(topic.views) },
                { label: "O'rtacha vaqt", value: `${topic.avgMinutes} daqiqa` },
                { label: 'Test topshirganlar', value: `${number(topic.testTakers)} ta` },
                { label: "O'rtacha ball", value: `${topic.avgScore.toFixed(1)}/10` },
              ].map((item) => (
                <div key={item.label} className="rounded-[12px] border border-line-2 bg-canvas p-3">
                  <p className="font-geist text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3">{item.label}</p>
                  <p className="mt-1 font-geist text-[17px] font-extrabold tabular text-ink">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[12px] border border-line p-3">
              <div className="flex items-center justify-between font-geist text-[11.5px]">
                <span className="text-ink-2">Testni yakunlash darajasi</span>
                <span className="font-bold text-ink">
                  {percent(topic.views ? (topic.testTakers / topic.views) * 100 : 0)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-300"
                  style={{ width: `${Math.min(100, topic.views ? (topic.testTakers / topic.views) * 100 : 0)}%` }}
                />
              </div>
              <p className="mt-2 font-geist text-[10.5px] leading-relaxed text-ink-3">
                {number(topic.testTakers)} nafar o'quvchi testni boshlagan, o'rtacha natija {topic.avgScore.toFixed(1)} ball.
              </p>
            </div>
            {peers.length > 0 ? (
              <div className="rounded-[12px] bg-muted/70 px-3 py-2.5 font-geist text-[11px] leading-relaxed text-ink-2">
                {subject?.nameUz ?? 'Fan'} bo'yicha o'rtacha {number(peerAverage)} ko'rish. Bu mavzu o'rtachadan{' '}
                <span className="font-bold text-ink">{percent(Math.abs(peerDelta))}</span>{' '}
                {peerDelta >= 0 ? 'yuqori' : 'past'}.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <AddVideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        topicId={topic.id}
        defaultOrder={topicVideos.length + 1}
        onSave={(video) => {
          upsertVideo(video)
          toast({ title: "Video qo'shildi", description: video.name, tone: 'success' })
          setVideoOpen(false)
        }}
      />
      <AddTestModal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        topicId={topic.id}
        onSave={(test) => {
          upsertTest(test)
          toast({ title: "Test qo'shildi", tone: 'success' })
          setTestOpen(false)
          setTestPage(Math.max(1, Math.ceil((topicTests.length + 1) / 10)))
        }}
      />
    </div>
  )
}

function TopicTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ value: TopicTab; label: string; count?: number }>
  value: TopicTab
  onChange: (value: TopicTab) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar flex shrink-0 items-center gap-4 overflow-x-auto border-b border-line-2', className)}>
      {tabs.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative shrink-0 pb-2 pt-1 font-geist text-[11.5px] font-semibold transition',
              active ? 'text-brand-text' : 'text-ink-3 hover:text-ink',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {typeof item.count === 'number' ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular',
                    active ? 'bg-brand-soft text-brand-text' : 'bg-muted text-ink-3',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </span>
            {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" /> : null}
          </button>
        )
      })}
    </div>
  )
}

function NewTopicModal({
  open,
  onClose,
  defaultSubjectId,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  defaultSubjectId?: string
  onCreate: (topic: Topic) => void
}) {
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setError('')
      setSubjectId(defaultSubjectId ?? subjects[0]?.id ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultSubjectId])

  const submit = () => {
    if (!name.trim()) {
      setError('Mavzu nomini kiriting')
      return
    }
    if (!subjectId) {
      setError('Avval fan yarating')
      return
    }
    const order = topics.filter((topic) => topic.subjectId === subjectId).length + 1
    onCreate({
      id: `topic-${Date.now().toString(36)}`,
      subjectId,
      name: name.trim(),
      description: description.trim(),
      order,
      status: 'draft',
      proOnly: false,
      views: 0,
      avgMinutes: 0,
      testTakers: 0,
      avgScore: 0,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yangi mavzu"
      description="Mavzuni fanga bog'lang — keyin videolar va testlar qo'shasiz."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button className="h-11 sm:h-10" onClick={submit}>
            Yaratish
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">
            Fan <span className="text-error">*</span>
          </span>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className={fieldClass}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.nameUz}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">
            Mavzu nomi <span className="text-error">*</span>
          </span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder="Masalan: Kvadrat tenglamalar"
            className={cn(fieldClass, error && 'border-error')}
          />
          {error ? <span className="mt-1 block font-geist text-[11px] font-medium text-error">{error}</span> : null}
        </label>
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Tavsif</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Mavzu haqida qisqacha"
            className={cn(fieldClass, 'h-auto resize-none py-2.5 leading-relaxed')}
          />
        </label>
      </div>
    </Modal>
  )
}

function AddVideoModal({
  open,
  onClose,
  topicId,
  defaultOrder,
  onSave,
}: {
  open: boolean
  onClose: () => void
  topicId: string
  defaultOrder: number
  onSave: (video: Video) => void
}) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [order, setOrder] = useState(defaultOrder)
  const [proOnly, setProOnly] = useState(false)
  const [status, setStatus] = useState<ContentStatus>('active')

  const youtubeId = youtubeIdFrom(url)
  const validId = /^[A-Za-z0-9_-]{11}$/.test(youtubeId)

  useEffect(() => {
    if (!open) {
      setUrl('')
      setName('')
      setDuration('')
      setProOnly(false)
      setStatus('active')
      setOrder(defaultOrder)
    }
  }, [open, defaultOrder])

  const submit = () => {
    if (!name.trim() || !validId) return
    onSave({
      id: `video-${Date.now().toString(36)}`,
      topicId,
      name: name.trim(),
      youtubeId,
      duration: duration.trim() || '00:00',
      views: 0,
      status,
      proOnly,
      order,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Video qo'shish"
      description="YouTube havolasini qo'ying — thumbnail avtomatik olinadi."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button className="h-11 sm:h-10" onClick={submit} disabled={!name.trim() || !validId}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">YouTube URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={fieldClass}
          />
        </label>
        {url ? (
          <div className="flex items-center gap-2.5 rounded-[10px] border border-line p-2">
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt="Preview"
              className="h-12 w-[86px] rounded-md object-cover"
            />
            <div className="min-w-0 font-geist text-[11px] text-ink-3">
              <p className="font-semibold text-ink-2">YouTube preview</p>
              <p className={cn('truncate font-mono', !validId && 'text-error')}>
                {validId ? youtubeId : 'Havola noto‘g‘ri'}
              </p>
            </div>
          </div>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Nomi</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Video sarlavhasi"
            className={fieldClass}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Davomiyligi</span>
            <input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="18:34"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Tartib raqami</span>
            <input
              type="number"
              min={1}
              value={order}
              onChange={(event) => setOrder(Number(event.target.value))}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ContentStatus)}
              className={fieldClass}
            >
              <option value="active">Faol</option>
              <option value="draft">Draft</option>
              <option value="hidden">Yashirin</option>
            </select>
          </label>
          <div className="flex items-end justify-between gap-2 rounded-[10px] border border-line px-3 py-2.5">
            <div>
              <p className="font-geist text-[12px] font-semibold text-ink">Faqat Pro</p>
              <p className="font-geist text-[10.5px] text-ink-3">Bepul rejada berkitiladi</p>
            </div>
            <Switch checked={proOnly} onChange={setProOnly} size="sm" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function AddTestModal({
  open,
  onClose,
  topicId,
  onSave,
}: {
  open: boolean
  onClose: () => void
  topicId: string
  onSave: (test: Test) => void
}) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState({ a: '', b: '', c: '', d: '' })
  const [correct, setCorrect] = useState<'a' | 'b' | 'c' | 'd'>('a')
  const [difficulty, setDifficulty] = useState<TestDifficulty>('easy')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) {
      setQuestion('')
      setOptions({ a: '', b: '', c: '', d: '' })
      setCorrect('a')
      setDifficulty('easy')
      setNote('')
    }
  }, [open])

  const valid = Boolean(question.trim() && options.a.trim() && options.b.trim() && options.c.trim() && options.d.trim())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Test qo'shish"
      description="To'g'ri variantni belgilang — savol darhol mavzuga qo'shiladi."
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
                id: `test-${Date.now().toString(36)}`,
                question: question.trim(),
                options,
                correct,
                topicId,
                difficulty,
                status: 'active',
                used: 0,
                errorRate: 0,
                topWrong: 'b',
                note: note.trim(),
                createdAt: new Date().toISOString(),
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
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">
            Savol matni <span className="text-error">*</span>
          </span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            placeholder="Savol..."
            className={cn(fieldClass, 'h-auto resize-none py-2.5 leading-relaxed')}
          />
        </label>
        <div className="space-y-2">
          {(['a', 'b', 'c', 'd'] as const).map((key) => {
            const isCorrect = correct === key
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 rounded-[10px] border p-1.5 pl-2 transition',
                  isCorrect ? 'border-brand bg-brand-soft/60' : 'border-line',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-md font-geist text-[11.5px] font-bold',
                    isCorrect ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                  )}
                >
                  {key.toUpperCase()}
                </span>
                <input
                  value={options[key]}
                  onChange={(event) => setOptions({ ...options, [key]: event.target.value })}
                  placeholder={`Variant ${key.toUpperCase()}`}
                  className="h-10 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 font-geist text-[13px] font-medium text-ink outline-none placeholder:text-placeholder focus:border-line"
                />
                <button
                  type="button"
                  onClick={() => setCorrect(key)}
                  aria-pressed={isCorrect}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2 font-geist text-[10.5px] font-semibold transition',
                    isCorrect ? 'text-brand-text' : 'text-ink-3 hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-3.5 w-3.5 place-items-center rounded-full border',
                      isCorrect ? 'border-brand bg-brand text-white' : 'border-[#d1d5db]',
                    )}
                  >
                    {isCorrect ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
                  </span>
                  To'g'ri
                </button>
              </div>
            )
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Daraja</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as TestDifficulty)}
              className={fieldClass}
            >
              <option value="easy">Oson</option>
              <option value="medium">O'rta</option>
              <option value="hard">Qiyin</option>
              <option value="olympiad">Olimpiada</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Izoh (admin uchun)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ixtiyoriy"
              className={fieldClass}
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}
