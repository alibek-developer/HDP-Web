'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileQuestion,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Video as VideoIcon,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  Checkbox,
  DifficultyBadge,
  Drawer,
  Dropdown,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  Switch,
  Tabs,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number, percent } from '@/lib/format'
import type { ContentStatus, Test, TestDifficulty, Topic, Video } from '@/lib/types'

const statusLabel: Record<ContentStatus, string> = { active: 'Faol', draft: 'Draft', hidden: 'Yashirin' }

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
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    const subjectParam = new URLSearchParams(window.location.search).get('subject')
    if (subjectParam) setSubjectFilter(subjectParam)
  }, [])

  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.nameUz ?? '—'

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return topics
      .filter((topic) => (subjectFilter === 'all' ? true : topic.subjectId === subjectFilter))
      .filter((topic) => (status === 'all' ? true : topic.status === status))
      .filter((topic) => (term ? topic.name.toLowerCase().includes(term) : true))
      .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
  }, [topics, subjectFilter, status, search])

  const counts = useMemo(() => {
    const videoCount = new Map<string, number>()
    const testCount = new Map<string, number>()
    for (const video of videos) videoCount.set(video.topicId, (videoCount.get(video.topicId) ?? 0) + 1)
    for (const test of tests) testCount.set(test.topicId, (testCount.get(test.topicId) ?? 0) + 1)
    return { videoCount, testCount }
  }, [videos, tests])

  const createTopic = () => {
    const subjectId = subjectFilter !== 'all' ? subjectFilter : subjects[0]?.id
    if (!subjectId) {
      toast({ title: 'Avval fan yarating', tone: 'warning' })
      return
    }
    const order = topics.filter((topic) => topic.subjectId === subjectId).length + 1
    const created: Topic = {
      id: `topic-${Date.now().toString(36)}`,
      subjectId,
      name: 'Yangi mavzu',
      description: '',
      order,
      status: 'draft',
      proOnly: false,
      views: 0,
      avgMinutes: 0,
      testTakers: 0,
      avgScore: 0,
      createdAt: new Date().toISOString(),
    }
    upsertTopic(created)
    setDrawerId(created.id)
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

  const drawerTopic = topics.find((topic) => topic.id === drawerId) ?? null

  return (
    <PageTransition>
      <PageHeader
        title="Mavzular"
        subtitle="Mavzularni fan bo'yicha boshqaring va tartiblang"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Kontent', href: '/admin/content' }, { label: 'Mavzular' }]}
        actions={
          <Button onClick={createTopic}>
            <Plus className="h-4 w-4" /> Yangi mavzu
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setSubjectFilter('all')}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition',
              subjectFilter === 'all' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            Barchasi
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectFilter(subject.id)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition',
                subjectFilter === subject.id ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              {subject.nameUz}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Mavzu nomi..." className="w-full sm:w-56" />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'all' | ContentStatus)}
          className="w-full sm:w-36"
        >
          <option value="all">Barcha status</option>
          <option value="active">Faol</option>
          <option value="draft">Draft</option>
          <option value="hidden">Yashirin</option>
        </Select>
        <span className="ml-auto text-[12px] text-ink-3">{number(filtered.length)} ta mavzu</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {filtered.length === 0 ? (
          <EmptyState
            title="Mavzu topilmadi"
            text="Filtrlarni o'zgartiring yoki yangi mavzu qo'shing."
            action={<Button size="sm" onClick={createTopic}>Yangi mavzu</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                  <th className="w-8 px-2 py-2.5" />
                  <th className="w-10 px-2 py-2.5">№</th>
                  <th className="px-3 py-2.5">Nomi</th>
                  <th className="px-3 py-2.5">Fan</th>
                  <th className="px-3 py-2.5">Videolar</th>
                  <th className="px-3 py-2.5">Testlar</th>
                  <th className="px-3 py-2.5">Ko'rishlar</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="w-20 px-3 py-2.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((topic) => (
                  <tr
                    key={topic.id}
                    draggable
                    onDragStart={(event) => {
                      setDragId(topic.id)
                      event.dataTransfer.setData('text/plain', topic.id)
                    }}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => move(topic.id)}
                    className={cn(
                      'group border-b border-line-2 text-[12.5px] transition last:border-0 hover:bg-canvas',
                      dragId === topic.id && 'opacity-50',
                    )}
                  >
                    <td className="px-2 py-2 text-ink-3">
                      <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" aria-label="Tartibni o'zgartirish" />
                    </td>
                    <td className="px-2 py-2 tabular text-ink-3">{topic.order}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => setDrawerId(topic.id)} className="flex items-center gap-2 text-left">
                        <span className="max-w-[260px] truncate font-semibold text-ink hover:text-brand-text">{topic.name}</span>
                        {topic.proOnly ? <Badge tone="violet">PRO</Badge> : null}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-ink-2">{subjectName(topic.subjectId)}</td>
                    <td className="px-3 py-2 tabular text-ink-2">{counts.videoCount.get(topic.id) ?? 0}</td>
                    <td className="px-3 py-2 tabular text-ink-2">{counts.testCount.get(topic.id) ?? 0}</td>
                    <td className="px-3 py-2 tabular text-ink-2">{number(topic.views)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={topic.status === 'active' ? 'success' : topic.status === 'draft' ? 'warning' : 'gray'}>
                        {statusLabel[topic.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton label="Tahrirlash" onClick={() => setDrawerId(topic.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <Dropdown
                          trigger={
                            <button
                              type="button"
                              aria-label="Amallar"
                              className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-hover"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          }
                          items={[
                            {
                              label: "Ko'rish",
                              icon: <Eye className="h-3.5 w-3.5" />,
                              onClick: () => setDrawerId(topic.id),
                            },
                            {
                              label: 'Tahrirlash',
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => setDrawerId(topic.id),
                            },
                            {
                              label: "O'chirish",
                              danger: true,
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              onClick: () => setDeleteTarget(topic),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-ink-3">
        ≡ belgisidan ushlab qatorlarni sudrab, mavzu tartibini o'zgartirish mumkin.
      </p>

      <Drawer
        open={Boolean(drawerTopic)}
        onClose={() => setDrawerId(null)}
        title="Mavzu tahrirlash"
        subtitle={drawerTopic ? subjectName(drawerTopic.subjectId) : undefined}
        widthClass="sm:w-[560px]"
      >
        {drawerTopic ? <TopicDrawer key={drawerTopic.id} topic={drawerTopic} onClose={() => setDrawerId(null)} /> : null}
      </Drawer>

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
    </PageTransition>
  )
}

type TopicTab = 'main' | 'videos' | 'tests' | 'stats'

function TopicDrawer({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const subjects = useAppStore((state) => state.subjects)
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
  const [form, setForm] = useState(topic)
  const [videoOpen, setVideoOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testPage, setTestPage] = useState(1)
  const [dragVideoId, setDragVideoId] = useState<string | null>(null)

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

  const save = () => {
    if (!form.name.trim()) {
      toast({ title: 'Mavzu nomini kiriting', tone: 'warning' })
      return
    }
    upsertTopic(form)
    toast({ title: 'Mavzu saqlandi', description: form.name, tone: 'success' })
    onClose()
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

  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'main', label: 'Asosiy' },
          { value: 'videos', label: 'Videolar', count: topicVideos.length },
          { value: 'tests', label: 'Testlar', count: topicTests.length },
          { value: 'stats', label: 'Statistika' },
        ]}
      />

      <div className="pt-4">
        {tab === 'main' ? (
          <div className="space-y-4">
            <Field label="Fan" required>
              <Select value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.nameUz}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mavzu nomi" required>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Tavsif">
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tartib raqami">
                <Input
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as ContentStatus })}
                >
                  <option value="active">Faol</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Yashirin</option>
                </Select>
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
              <div>
                <p className="text-[12.5px] font-semibold text-ink">Faqat Pro uchun</p>
                <p className="text-[11px] text-ink-3">Bepul foydalanuvchilar bu mavzuni ko'ra olmaydi</p>
              </div>
              <Switch checked={form.proOnly} onChange={(value) => setForm({ ...form, proOnly: value })} />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line-2 pt-3">
              <Button variant="ghost" onClick={onClose}>
                Bekor qilish
              </Button>
              <Button onClick={save}>Saqlash</Button>
            </div>
          </div>
        ) : null}

        {tab === 'videos' ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12.5px] text-ink-3">
                {topicVideos.length} ta video · sudrab tartiblang
              </p>
              <Button size="sm" onClick={() => setVideoOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Video qo'shish
              </Button>
            </div>
            {topicVideos.length === 0 ? (
              <EmptyState
                title="Videolar yo'q"
                text="Bu mavzuga birinchi videoni qo'shing."
                icon={<VideoIcon className="h-5 w-5" />}
              />
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
                      'flex items-center gap-2.5 rounded-lg border border-line p-2 transition',
                      dragVideoId === video.id && 'opacity-50',
                    )}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-3 active:cursor-grabbing" aria-label="Tartibni o'zgartirish" />
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.name}
                      className="h-11 w-20 shrink-0 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{video.name}</p>
                      <p className="truncate text-[10.5px] text-ink-3">
                        youtube.com/watch?v={video.youtubeId} · {video.duration}
                      </p>
                    </div>
                    <Badge tone={video.status === 'active' ? 'success' : 'warning'}>{statusLabel[video.status]}</Badge>
                    <IconButton
                      label="O'chirish"
                      onClick={() => {
                        deleteVideo(video.id)
                        toast({ title: "Video o'chirildi", tone: 'success' })
                      }}
                      className="text-error hover:bg-error-bg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === 'tests' ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/content/import?topic=${topic.id}`}>
                <Button size="sm" variant="secondary">
                  <FileQuestion className="h-3.5 w-3.5" /> PDF import
                </Button>
              </Link>
              <Button size="sm" onClick={() => setTestOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Test qo'shish
              </Button>
            </div>
            {topicTests.length === 0 ? (
              <EmptyState title="Testlar yo'q" text="PDF import yoki qo'lda test qo'shing." icon={<FileQuestion className="h-5 w-5" />} />
            ) : (
              <>
                <ul className="space-y-2">
                  {visibleTests.map((test, index) => (
                    <li key={test.id} className="rounded-lg border border-line p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-medium text-ink">
                          <span className="mr-1 text-ink-3">{(testPage - 1) * 10 + index + 1}.</span>
                          {test.question}
                        </p>
                        <IconButton
                          label="O'chirish"
                          onClick={() => {
                            deleteTest(test.id)
                            toast({ title: "Test o'chirildi", tone: 'success' })
                          }}
                          className="text-error hover:bg-error-bg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
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
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10.5px] text-ink-3">
                          To'g'ri javob: <span className="font-semibold text-brand-text">{test.correct.toUpperCase()}</span>
                        </span>
                        <DifficultyBadge level={test.difficulty} />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between text-[11px] text-ink-3">
                  <span>
                    {(testPage - 1) * 10 + 1}–{Math.min(testPage * 10, topicTests.length)} / {topicTests.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton label="Oldingi" onClick={() => setTestPage((page) => Math.max(1, page - 1))} className="border border-line">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Keyingi"
                      onClick={() => setTestPage((page) => Math.min(testPageCount, page + 1))}
                      className="border border-line"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === 'stats' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Ko\'rishlar', value: number(form.views) },
                { label: "O'rtacha vaqt", value: `${form.avgMinutes} daqiqa` },
                { label: 'Test topshirganlar', value: `${number(form.testTakers)} ta` },
                { label: "O'rtacha ball", value: `${form.avgScore.toFixed(1)}/10` },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line-2 bg-canvas p-3">
                  <p className="text-[10.5px] uppercase tracking-[0.04em] text-ink-3">{item.label}</p>
                  <p className="mt-1 font-display text-[17px] font-bold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-2">Testni yakunlash darajasi</span>
                <span className="font-semibold text-ink">
                  {percent(form.views ? (form.testTakers / form.views) * 100 : 0)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-container">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.min(100, form.views ? (form.testTakers / form.views) * 100 : 0)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-ink-3">
                {number(form.testTakers)} nafar o'quvchi testni boshlagan, o'rtacha natija {form.avgScore.toFixed(1)} ball.
              </p>
            </div>
            <div className="rounded-lg bg-warning-bg px-3 py-2 text-[11.5px] text-warning">
              Ko'rishlar {number(form.views)} — fan bo'yicha o'rtacha ko'rsatkichdan{' '}
              {form.views > 3000 ? 'yuqori' : 'past'}.
            </div>
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
        }}
      />
    </div>
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

  useEffect(() => {
    if (!open) {
      setUrl('')
      setName('')
      setDuration('')
      setProOnly(false)
      setStatus('active')
    }
  }, [open])

  const submit = () => {
    if (!url.trim() || !name.trim()) return
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
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit} disabled={!url.trim() || !name.trim()}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="YouTube URL" required hint="Havolani qo'yganda thumbnail avtomatik yuklanadi">
          <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </Field>
        {url ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-line p-2">
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt="Preview"
              className="h-14 w-24 rounded object-cover"
            />
            <div className="text-[11px] text-ink-3">
              <p className="font-semibold text-ink-2">YouTube preview</p>
              <p className="font-mono">{youtubeId}</p>
            </div>
          </div>
        ) : null}
        <Field label="Nomi" required>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Video sarlavhasi" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Davomiyligi">
            <Input value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="18:34" />
          </Field>
          <Field label="Tartib raqami">
            <Input type="number" min={1} value={order} onChange={(event) => setOrder(Number(event.target.value))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as ContentStatus)}>
              <option value="active">Faol</option>
              <option value="draft">Draft</option>
              <option value="hidden">Yashirin</option>
            </Select>
          </Field>
          <div className="flex items-end justify-between rounded-lg border border-line px-3 py-2">
            <span className="text-[12px] font-medium text-ink-2">Faqat Pro</span>
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

  const valid = question.trim() && options.a.trim() && options.b.trim() && options.c.trim() && options.d.trim()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Test qo'shish"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
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
      <div className="space-y-3.5">
        <Field label="Savol matni" required hint="Matematik formulalar uchun LaTeX ham ishlatsa bo'ladi">
          <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Savol..." />
        </Field>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(['a', 'b', 'c', 'd'] as const).map((key) => (
            <Field key={key} label={`Variant ${key.toUpperCase()}`} required>
              <div className="flex items-center gap-2">
                <Input
                  value={options[key]}
                  onChange={(event) => setOptions({ ...options, [key]: event.target.value })}
                  placeholder={`Variant ${key.toUpperCase()}`}
                />
                <Checkbox checked={correct === key} onChange={() => setCorrect(key)} label="To'g'ri" />
              </div>
            </Field>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daraja">
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as TestDifficulty)}>
              <option value="easy">Oson</option>
              <option value="medium">O'rta</option>
              <option value="hard">Qiyin</option>
              <option value="olympiad">Olimpiada</option>
            </Select>
          </Field>
          <Field label="To'g'ri javob">
            <Select value={correct} onChange={(event) => setCorrect(event.target.value as 'a' | 'b' | 'c' | 'd')}>
              {(['a', 'b', 'c', 'd'] as const).map((key) => (
                <option key={key} value={key}>
                  {key.toUpperCase()} varianti
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Izoh (admin uchun)">
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ixtiyoriy izoh" />
        </Field>
      </div>
    </Modal>
  )
}
