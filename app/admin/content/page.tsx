'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  FileQuestion,
  Layers,
  MoreVertical,
  Pencil,
  PlaySquare,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { ContentHeader, ContentTabs, contentRoot } from '@/components/content/ContentShell'
import {
  Button,
  Dropdown,
  EmptyState,
  Modal,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
import type { ContentStatus, Subject, SubjectColor, Topic } from '@/lib/types'

const COLORS: Array<{ value: SubjectColor; label: string; dot: string; soft: string; text: string }> = [
  { value: 'green', label: 'Yashil', dot: 'bg-[#16a34a]', soft: 'bg-[#dcfce7]', text: 'text-[#15803d]' },
  { value: 'blue', label: "Ko'k", dot: 'bg-[#2563eb]', soft: 'bg-[#dbeafe]', text: 'text-[#1d4ed8]' },
  { value: 'violet', label: 'Binafsha', dot: 'bg-[#7c3aed]', soft: 'bg-[#ede9fe]', text: 'text-[#6d28d9]' },
  { value: 'amber', label: 'Sariq', dot: 'bg-[#d97706]', soft: 'bg-[#fef3c7]', text: 'text-[#b45309]' },
  { value: 'red', label: 'Qizil', dot: 'bg-[#dc2626]', soft: 'bg-[#fee2e2]', text: 'text-[#b91c1c]' },
  { value: 'gray', label: 'Kulrang', dot: 'bg-[#6b7280]', soft: 'bg-[#f3f4f6]', text: 'text-[#4b5563]' },
]

const colorOf = (color: SubjectColor) => COLORS.find((entry) => entry.value === color) ?? COLORS[0]

const statusStyle: Record<ContentStatus, { label: string; className: string; dot: string }> = {
  active: { label: 'Faol', className: 'bg-brand-soft text-brand-text', dot: 'bg-brand' },
  draft: { label: 'Draft', className: 'bg-warning-bg text-warning', dot: 'bg-warning' },
  hidden: { label: 'Yashirin', className: 'bg-muted text-ink-3', dot: 'bg-ink-3/40' },
}

const emptySubject = (order: number): Subject => ({
  id: '',
  nameUz: '',
  nameRu: '',
  description: '',
  color: 'green',
  icon: 'A',
  status: 'draft',
  order,
  createdAt: new Date().toISOString(),
})

const emptyTopic = (subjectId: string, order: number): Topic => ({
  id: '',
  subjectId,
  name: '',
  description: '',
  order,
  status: 'draft',
  proOnly: false,
  views: 0,
  avgMinutes: 12,
  testTakers: 0,
  avgScore: 0,
  createdAt: new Date().toISOString(),
})

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13.5px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function SubjectsPage() {
  const router = useRouter()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const videos = useAppStore((state) => state.videos)
  const tests = useAppStore((state) => state.tests)
  const examples = useAppStore((state) => state.lessonExamples)
  const upsertSubject = useAppStore((state) => state.upsertSubject)
  const deleteSubject = useAppStore((state) => state.deleteSubject)
  const upsertTopic = useAppStore((state) => state.upsertTopic)
  const deleteTopic = useAppStore((state) => state.deleteTopic)
  const { toast } = useToast()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<Topic | null>(null)

  const sorted = useMemo(() => [...subjects].sort((left, right) => left.order - right.order), [subjects])
  const active = sorted.find((subject) => subject.id === selectedId) ?? sorted[0] ?? null

  const stats = useMemo(() => {
    const map = new Map<string, { topics: number; videos: number; tests: number; examples: number }>()
    for (const subject of subjects) {
      const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id)
      const topicIds = new Set(subjectTopics.map((topic) => topic.id))
      map.set(subject.id, {
        topics: subjectTopics.length,
        videos: videos.filter((video) => topicIds.has(video.topicId)).length,
        tests: tests.filter((test) => topicIds.has(test.topicId)).length,
        examples: examples.filter((example) => topicIds.has(example.topicId)).length,
      })
    }
    return map
  }, [subjects, topics, videos, tests, examples])

  const activeTopics = useMemo(() => {
    if (!active) return []
    return topics
      .filter((topic) => topic.subjectId === active.id)
      .sort((left, right) => left.order - right.order)
  }, [topics, active])

  const activeCounts = active ? stats.get(active.id) ?? { topics: 0, videos: 0, tests: 0, examples: 0 } : null

  const topicCounts = useMemo(() => {
    const map = new Map<string, { videos: number; tests: number; examples: number }>()
    for (const topic of topics) {
      map.set(topic.id, {
        videos: videos.filter((video) => video.topicId === topic.id).length,
        tests: tests.filter((test) => test.topicId === topic.id).length,
        examples: examples.filter((example) => example.topicId === topic.id).length,
      })
    }
    return map
  }, [topics, videos, tests, examples])

  const saveSubject = (subject: Subject) => {
    upsertSubject(subject)
    setSelectedId(subject.id)
    toast({
      title: editing?.id ? 'Fan yangilandi' : "Yangi fan qo'shildi",
      description: subject.nameUz,
      tone: 'success',
    })
    setEditing(null)
  }

  const saveTopic = (topic: Topic) => {
    upsertTopic(topic)
    toast({
      title: editingTopic?.id ? 'Dars yangilandi' : "Yangi dars qo'shildi",
      description: topic.name,
      tone: 'success',
    })
    setEditingTopic(null)
  }

  return (
    <PageTransition>
      <div className={contentRoot}>
        <ContentHeader
          title="Kontent"
          count={sorted.length}
          subtitle="Fan → dars → misol → test: yagona kutubxona."
          actions={
            <>
              <button
                type="button"
                onClick={() => router.push('/admin/content/import')}
                aria-label="PDF import"
                className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-line bg-white px-3.5 font-geist text-[13px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink sm:px-4"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">PDF import</span>
              </button>
              <button
                type="button"
                onClick={() => setEditing(emptySubject(sorted.length + 1))}
                className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ink px-3.5 font-geist text-[13px] font-bold text-white transition hover:bg-brand sm:px-4"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Yangi fan</span>
                <span className="sm:hidden">Fan</span>
              </button>
            </>
          }
        />

        <ContentTabs />

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <aside className="hidden w-[252px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-line bg-white lg:flex">
            <div className="flex shrink-0 items-center justify-between border-b border-line-2 px-3.5 py-2.5">
              <span className="font-geist text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-3">Fanlar</span>
              <span className="font-geist text-[11px] font-bold tabular text-ink-2">{number(sorted.length)}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
              {sorted.map((subject) => {
                const color = colorOf(subject.color)
                const counts = stats.get(subject.id) ?? { topics: 0, videos: 0, tests: 0, examples: 0 }
                const isActive = subject.id === active?.id
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSelectedId(subject.id)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left transition',
                      isActive ? 'bg-ink' : 'hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-[9px] font-geist text-[13px] font-extrabold',
                        isActive ? 'bg-white/15 text-white' : cn(color.soft, color.text),
                      )}
                    >
                      {subject.icon || subject.nameUz.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate font-geist text-[12.5px] font-semibold tracking-[-0.01em]',
                          isActive ? 'text-white' : 'text-ink',
                        )}
                      >
                        {subject.nameUz}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 block truncate font-geist text-[10.5px] tabular',
                          isActive ? 'text-white/50' : 'text-ink-3',
                        )}
                      >
                        {counts.topics} dars · {counts.tests} test
                      </span>
                    </span>
                    {subject.status !== 'active' ? (
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          subject.status === 'draft' ? 'bg-warning' : 'bg-ink-3/40',
                        )}
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="flex shrink-0 gap-1.5 overflow-x-auto rounded-[14px] border border-line bg-white p-1.5 lg:hidden">
            {sorted.map((subject) => {
              const isActive = subject.id === active?.id
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedId(subject.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 font-geist text-[12px] font-semibold transition',
                    isActive ? 'bg-ink text-white' : 'text-ink-3 hover:bg-muted',
                  )}
                >
                  {subject.nameUz}
                </button>
              )
            })}
          </div>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-line bg-white">
            {!active ? (
              <div className="grid h-full min-h-[240px] place-items-center">
                <EmptyState
                  title="Hali fanlar yo'q"
                  text="Birinchi fanni qo'shib, darslar va testlarni bog'lang."
                  icon={<Layers className="h-5 w-5" />}
                  action={
                    <Button onClick={() => setEditing(emptySubject(1))}>
                      <Plus className="h-4 w-4" /> Fan qo'shish
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <header className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-line px-3 py-2.5 sm:px-4">
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-[11px] font-geist text-[15px] font-extrabold',
                      colorOf(active.color).soft,
                      colorOf(active.color).text,
                    )}
                  >
                    {active.icon || active.nameUz.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-geist text-[15px] font-extrabold tracking-[-0.02em] text-ink">
                        {active.nameUz}
                      </h2>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-geist text-[9.5px] font-bold uppercase tracking-[0.06em]',
                          statusStyle[active.status].className,
                        )}
                      >
                        <span className={cn('h-1 w-1 rounded-full', statusStyle[active.status].dot)} />
                        {statusStyle[active.status].label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-geist text-[11.5px] text-ink-3">
                      {active.nameRu ? `${active.nameRu} · ` : ''}
                      {active.description || 'Tavsif kiritilmagan'}
                    </p>
                  </div>

                  <div className="hidden items-center gap-5 pr-1 sm:flex">
                    {[
                      { label: 'Dars', value: activeCounts?.topics ?? 0 },
                      { label: 'Video', value: activeCounts?.videos ?? 0 },
                      { label: 'Misol', value: activeCounts?.examples ?? 0 },
                      { label: 'Test', value: activeCounts?.tests ?? 0 },
                    ].map((item) => (
                      <div key={item.label} className="text-right">
                        <p className="font-geist text-[14px] font-bold leading-none tabular text-ink">
                          {number(item.value)}
                        </p>
                        <p className="mt-1 font-geist text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingTopic(emptyTopic(active.id, activeTopics.length + 1))}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-ink px-2.5 font-geist text-[12px] font-bold text-white transition hover:bg-brand sm:px-3"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Yangi dars</span>
                      <span className="sm:hidden">Dars</span>
                    </button>
                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          aria-label="Fan amallari"
                          className="grid h-9 w-9 place-items-center rounded-[9px] text-ink-3 transition hover:bg-muted hover:text-ink"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                      items={[
                        {
                          label: 'Fanni tahrirlash',
                          icon: <Pencil className="h-3.5 w-3.5" />,
                          onClick: () => setEditing(active),
                        },
                        {
                          label: 'PDF import',
                          icon: <Sparkles className="h-3.5 w-3.5" />,
                          onClick: () => router.push('/admin/content/import'),
                        },
                        { separator: true, label: 'sep' },
                        {
                          label: "Fanni o'chirish",
                          danger: true,
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          onClick: () => setDeleteTarget(active),
                        },
                      ]}
                    />
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {activeTopics.length === 0 ? (
                    <div className="grid h-full min-h-[220px] place-items-center px-4">
                      <EmptyState
                        title="Bu fanda darslar yo'q"
                        text="Birinchi darsni qo'shing — video, misollar va testlar shu yerga bog'lanadi."
                        icon={<PlaySquare className="h-5 w-5" />}
                        action={
                          <Button onClick={() => setEditingTopic(emptyTopic(active.id, 1))}>
                            <Plus className="h-4 w-4" /> Dars qo'shish
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    activeTopics.map((topic, index) => {
                      const counts = topicCounts.get(topic.id) ?? { videos: 0, tests: 0, examples: 0 }
                      return (
                        <div
                          key={topic.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/admin/content/lessons/${topic.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              router.push(`/admin/content/lessons/${topic.id}`)
                            }
                          }}
                          className="group flex cursor-pointer items-center gap-3 border-b border-line-2 px-3 py-3 transition last:border-0 hover:bg-muted/60 sm:px-4"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-muted font-mono text-[11px] font-bold text-ink-3">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-geist text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
                                {topic.name}
                              </p>
                              {topic.status !== 'active' ? (
                                <span
                                  className={cn(
                                    'shrink-0 rounded-full px-1.5 py-0.5 font-geist text-[9px] font-bold uppercase tracking-[0.06em]',
                                    statusStyle[topic.status].className,
                                  )}
                                >
                                  {statusStyle[topic.status].label}
                                </span>
                              ) : null}
                              {topic.proOnly ? (
                                <span className="shrink-0 rounded-full bg-coin-bg px-1.5 py-0.5 font-geist text-[9px] font-bold uppercase tracking-[0.06em] text-coin">
                                  Pro
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 truncate font-geist text-[11.5px] text-ink-3">
                              {topic.description || 'Tavsif kiritilmagan'}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-geist text-[10.5px] font-medium tabular text-ink-3">
                              <span className="inline-flex items-center gap-1">
                                <PlaySquare className="h-3 w-3" /> {counts.videos} video
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Pencil className="h-3 w-3" /> {counts.examples} misol
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <FileQuestion className="h-3 w-3" /> {counts.tests} test
                              </span>
                              <span className="hidden sm:inline">{topic.avgMinutes} daqiqa</span>
                            </div>
                          </div>

                          <div
                            className="flex shrink-0 items-center gap-0.5"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Dropdown
                              trigger={
                                <button
                                  type="button"
                                  aria-label="Dars amallari"
                                  className="grid h-9 w-9 place-items-center rounded-[9px] text-ink-3 transition hover:bg-muted hover:text-ink"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              }
                              items={[
                                {
                                  label: 'Darsni ochish',
                                  icon: <ChevronRight className="h-3.5 w-3.5" />,
                                  onClick: () => router.push(`/admin/content/lessons/${topic.id}`),
                                },
                                {
                                  label: 'Tahrirlash',
                                  icon: <Pencil className="h-3.5 w-3.5" />,
                                  onClick: () => setEditingTopic(topic),
                                },
                                { separator: true, label: 'sep' },
                                {
                                  label: "O'chirish",
                                  danger: true,
                                  icon: <Trash2 className="h-3.5 w-3.5" />,
                                  onClick: () => setDeleteTopicTarget(topic),
                                },
                              ]}
                            />
                            <ChevronRight className="h-4 w-4 text-ink-3 transition group-hover:text-brand-text" />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {editing ? (
          <SubjectModal
            key={editing.id || 'new'}
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={saveSubject}
          />
        ) : null}

        {editingTopic ? (
          <TopicModal
            key={editingTopic.id || 'new'}
            initial={editingTopic}
            onClose={() => setEditingTopic(null)}
            onSave={saveTopic}
          />
        ) : null}

        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Fanni o'chirish"
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
                  deleteSubject(deleteTarget.id)
                  toast({ title: "Fan o'chirildi", description: deleteTarget.nameUz, tone: 'success' })
                  setDeleteTarget(null)
                  setSelectedId(null)
                }}
              >
                <Trash2 className="h-4 w-4" /> O'chirish
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold">{deleteTarget?.nameUz}</span> fani va unga tegishli barcha darslar,
            videolar hamda testlar o'chiriladi.
          </p>
          <div className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-[12px] text-error">
            {deleteTarget ? stats.get(deleteTarget.id)?.topics ?? 0 : 0} dars va{' '}
            {deleteTarget ? stats.get(deleteTarget.id)?.videos ?? 0 : 0} video o'chiriladi. Foydalanuvchi natijalari saqlanadi.
          </div>
        </Modal>

        <Modal
          open={Boolean(deleteTopicTarget)}
          onClose={() => setDeleteTopicTarget(null)}
          title="Darsni o'chirish"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteTopicTarget(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!deleteTopicTarget) return
                  deleteTopic(deleteTopicTarget.id)
                  toast({ title: "Dars o'chirildi", description: deleteTopicTarget.name, tone: 'success' })
                  setDeleteTopicTarget(null)
                }}
              >
                <Trash2 className="h-4 w-4" /> O'chirish
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold">{deleteTopicTarget?.name}</span> darsi, unga bog'langan videolar,
            misollar va testlar o'chiriladi.
          </p>
        </Modal>
      </div>
    </PageTransition>
  )
}

function SubjectModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Subject
  onClose: () => void
  onSave: (subject: Subject) => void
}) {
  const [form, setForm] = useState<Subject>(initial)
  const isNew = !initial.id
  const [error, setError] = useState('')

  const submit = () => {
    if (!form.nameUz.trim()) {
      setError('Fan nomini kiriting')
      return
    }
    onSave({
      ...form,
      id: form.id || `subject-${Date.now().toString(36)}`,
      nameUz: form.nameUz.trim(),
      nameRu: form.nameRu.trim(),
      icon: form.icon.trim() || form.nameUz.trim().slice(0, 1).toUpperCase(),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Fan qo'shish" : 'Fanni tahrirlash'}
      description="Fan nomi, rangi va holatini sozlang."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit}>Saqlash</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">
              Fan nomi (UZ) <span className="text-error">*</span>
            </span>
            <input
              value={form.nameUz}
              onChange={(event) => {
                setForm({ ...form, nameUz: event.target.value })
                setError('')
              }}
              placeholder="Masalan: Algebra I"
              className={cn(fieldClass, error && 'border-error focus:border-error focus:ring-error/10')}
            />
            {error ? <span className="mt-1 block text-[11px] font-medium text-error">{error}</span> : null}
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Fan nomi (RU)</span>
            <input
              value={form.nameRu}
              onChange={(event) => setForm({ ...form, nameRu: event.target.value })}
              placeholder="Например: Алгебра I"
              className={fieldClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Qisqa tavsif</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={2}
            placeholder="Fan haqida qisqacha ma'lumot"
            className={cn(fieldClass, 'h-auto resize-none py-2.5 leading-relaxed')}
          />
        </label>

        <div>
          <p className="mb-1.5 font-geist text-[12.5px] font-semibold text-ink-2">Rang</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setForm({ ...form, color: color.value })}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-[9px] border px-2.5 font-geist text-[12px] font-semibold transition',
                  form.color === color.value
                    ? 'border-brand bg-brand-soft text-brand-text'
                    : 'border-line text-ink-3 hover:bg-muted',
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', color.dot)} /> {color.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Ikonka</span>
            <input
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              maxLength={4}
              placeholder="A"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Status</span>
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
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Tartib</span>
            <input
              type="number"
              min={1}
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="flex items-center gap-2.5 rounded-[12px] bg-muted px-3 py-2.5">
          <span
            className={cn(
              'grid h-10 w-10 place-items-center rounded-[11px] font-geist text-[15px] font-extrabold',
              colorOf(form.color).soft,
              colorOf(form.color).text,
            )}
          >
            {form.icon || form.nameUz.slice(0, 1) || 'A'}
          </span>
          <div className="min-w-0">
            <p className="truncate font-geist text-[13px] font-semibold text-ink">{form.nameUz || 'Fan nomi'}</p>
            <p className="truncate font-geist text-[11px] text-ink-3">{form.nameRu || 'Ruscha nomi'}</p>
          </div>
          <span
            className={cn(
              'ml-auto shrink-0 rounded-full px-2 py-0.5 font-geist text-[9.5px] font-bold uppercase tracking-[0.06em]',
              statusStyle[form.status].className,
            )}
          >
            {statusStyle[form.status].label}
          </span>
        </div>
      </div>
    </Modal>
  )
}

function TopicModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Topic
  onClose: () => void
  onSave: (topic: Topic) => void
}) {
  const [form, setForm] = useState<Topic>(initial)
  const isNew = !initial.id
  const [error, setError] = useState('')

  const submit = () => {
    if (!form.name.trim()) {
      setError('Dars nomini kiriting')
      return
    }
    onSave({
      ...form,
      id: form.id || `topic-${Date.now().toString(36)}`,
      name: form.name.trim(),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Dars qo'shish" : 'Darsni tahrirlash'}
      description="Dars nomi, tartibi va holatini sozlang."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit}>Saqlash</Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">
            Dars nomi <span className="text-error">*</span>
          </span>
          <input
            value={form.name}
            onChange={(event) => {
              setForm({ ...form, name: event.target.value })
              setError('')
            }}
            placeholder="Masalan: Kvadrat tenglamalar"
            className={cn(fieldClass, error && 'border-error focus:border-error focus:ring-error/10')}
          />
          {error ? <span className="mt-1 block text-[11px] font-medium text-error">{error}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Qisqa tavsif</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={2}
            placeholder="Dars nimalarga bag'ishlangan"
            className={cn(fieldClass, 'h-auto resize-none py-2.5 leading-relaxed')}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Status</span>
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
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Tartib</span>
            <input
              type="number"
              min={1}
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12.5px] font-semibold text-ink-2">Davomiylik (daq)</span>
            <input
              type="number"
              min={1}
              value={form.avgMinutes}
              onChange={(event) => setForm({ ...form, avgMinutes: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setForm({ ...form, proOnly: !form.proOnly })}
          aria-pressed={form.proOnly}
          className={cn(
            'flex w-full items-center justify-between rounded-[12px] border px-3 py-2.5 text-left transition',
            form.proOnly ? 'border-coin/40 bg-coin-bg' : 'border-line bg-white hover:bg-muted',
          )}
        >
          <span>
            <span className="block font-geist text-[12.5px] font-semibold text-ink">Faqat Pro uchun</span>
            <span className="block font-geist text-[11px] text-ink-3">Bepul foydalanuvchilarga yopiq bo'ladi</span>
          </span>
          <span
            className={cn(
              'h-5 w-9 shrink-0 rounded-full p-0.5 transition',
              form.proOnly ? 'bg-coin' : 'bg-line',
            )}
          >
            <span
              className={cn(
                'block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                form.proOnly && 'translate-x-4',
              )}
            />
          </span>
        </button>
      </div>
    </Modal>
  )
}
