'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  BookOpen,
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
import { number, percent } from '@/lib/format'
import type { ContentStatus, Subject, SubjectColor } from '@/lib/types'

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

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13.5px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function SubjectsPage() {
  const router = useRouter()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const videos = useAppStore((state) => state.videos)
  const tests = useAppStore((state) => state.tests)
  const upsertSubject = useAppStore((state) => state.upsertSubject)
  const deleteSubject = useAppStore((state) => state.deleteSubject)
  const { toast } = useToast()

  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)

  const sorted = useMemo(() => [...subjects].sort((left, right) => left.order - right.order), [subjects])

  const stats = useMemo(() => {
    const map = new Map<string, { topics: number; videos: number; tests: number }>()
    for (const subject of subjects) {
      const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id)
      const topicIds = new Set(subjectTopics.map((topic) => topic.id))
      map.set(subject.id, {
        topics: subjectTopics.length,
        videos: videos.filter((video) => topicIds.has(video.topicId)).length,
        tests: tests.filter((test) => topicIds.has(test.topicId)).length,
      })
    }
    return map
  }, [subjects, topics, videos, tests])

  const totals = useMemo(
    () => ({
      subjects: subjects.length,
      topics: topics.length,
      videos: videos.length,
      tests: tests.length,
      active: subjects.filter((subject) => subject.status === 'active').length,
    }),
    [subjects, topics, videos, tests],
  )

  const save = (subject: Subject) => {
    upsertSubject(subject)
    toast({
      title: editing?.id ? 'Fan yangilandi' : "Yangi fan qo'shildi",
      description: subject.nameUz,
      tone: 'success',
    })
    setEditing(null)
  }

  return (
    <PageTransition>
      <div className={contentRoot}>
        <ContentHeader
          title="Kontent"
          count={totals.subjects}
          subtitle="Fanlar, mavzular, videolar va testlar — yagona kutubxonada."
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
                onClick={() => setEditing(emptySubject(subjects.length + 1))}
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

        <section className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-[16px] border border-line bg-white px-4 py-3 sm:gap-x-8 sm:px-5">
          {[
            { label: 'Mavzular', value: totals.topics, icon: BookOpen },
            { label: 'Videolar', value: totals.videos, icon: PlaySquare },
            { label: 'Testlar', value: totals.tests, icon: FileQuestion },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-ink-3" />
                <span className="font-geist text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  {item.label}
                </span>
                <span className="font-geist text-[15px] font-extrabold tabular tracking-[-0.02em] text-ink">
                  {number(item.value)}
                </span>
              </div>
            )
          })}
          <div className="ml-auto flex min-w-[140px] flex-1 items-center gap-3 sm:max-w-[260px]">
            <span className="whitespace-nowrap font-geist text-[11px] font-medium text-ink-3">
              Faol fanlar {totals.active}/{totals.subjects}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${totals.subjects ? (totals.active / totals.subjects) * 100 : 0}%` }}
              />
            </span>
            <span className="font-geist text-[11px] font-bold tabular text-ink-2">
              {percent(totals.subjects ? (totals.active / totals.subjects) * 100 : 0, 0)}
            </span>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-y-auto rounded-[20px] border border-line bg-white">
          {sorted.length === 0 ? (
            <div className="grid h-full min-h-[240px] place-items-center">
              <EmptyState
                title="Hali fanlar yo'q"
                text="Birinchi fanni qo'shib, mavzular va videolarni bog'lang."
                icon={<Layers className="h-5 w-5" />}
                action={
                  <Button onClick={() => setEditing(emptySubject(1))}>
                    <Plus className="h-4 w-4" /> Fan qo'shish
                  </Button>
                }
              />
            </div>
          ) : (
            sorted.map((subject, index) => {
              const color = colorOf(subject.color)
              const counts = stats.get(subject.id) ?? { topics: 0, videos: 0, tests: 0 }
              const status = statusStyle[subject.status]
              return (
                <div
                  key={subject.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/content/topics?subject=${subject.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      router.push(`/admin/content/topics?subject=${subject.id}`)
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-3 border-b border-line-2 px-3 py-3.5 transition last:border-0 hover:bg-muted/60 sm:gap-4 sm:px-5"
                >
                  <span className="hidden w-6 shrink-0 font-mono text-[11px] font-semibold text-ink-3 sm:block">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-[13px] font-geist text-[17px] font-extrabold',
                      color.soft,
                      color.text,
                    )}
                  >
                    {subject.icon || subject.nameUz.slice(0, 1)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-geist text-[14px] font-semibold tracking-[-0.01em] text-ink">
                        {subject.nameUz}
                      </p>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-geist text-[9.5px] font-bold uppercase tracking-[0.06em]',
                          status.className,
                        )}
                      >
                        <span className={cn('h-1 w-1 rounded-full', status.dot)} />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-geist text-[11.5px] text-ink-3">
                      {subject.nameRu ? `${subject.nameRu} · ` : ''}
                      {subject.description || 'Tavsif kiritilmagan'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 font-geist text-[11px] font-medium tabular text-ink-3 sm:hidden">
                      <span>{counts.topics} mavzu</span>
                      <span>{counts.videos} video</span>
                      <span>{counts.tests} test</span>
                    </div>
                  </div>

                  <div className="hidden items-center gap-6 pr-2 sm:flex">
                    {[
                      { label: 'Mavzu', value: counts.topics },
                      { label: 'Video', value: counts.videos },
                      { label: 'Test', value: counts.tests },
                    ].map((item) => (
                      <div key={item.label} className="w-12 text-right">
                        <p className="font-geist text-[14px] font-bold leading-none tabular text-ink">
                          {number(item.value)}
                        </p>
                        <p className="mt-1 font-geist text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label={`${subject.nameUz} mavzularini ochish`}
                      onClick={() => router.push(`/admin/content/topics?subject=${subject.id}`)}
                      className="grid h-10 w-10 place-items-center rounded-[10px] text-ink-3 transition hover:bg-muted hover:text-brand-text"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          aria-label="Amallar"
                          className="grid h-10 w-10 place-items-center rounded-[10px] text-ink-3 transition hover:bg-muted hover:text-ink"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                      items={[
                        {
                          label: 'Tahrirlash',
                          icon: <Pencil className="h-3.5 w-3.5" />,
                          onClick: () => setEditing(subject),
                        },
                        {
                          label: "Mavzularni ko'rish",
                          icon: <Layers className="h-3.5 w-3.5" />,
                          onClick: () => router.push(`/admin/content/topics?subject=${subject.id}`),
                        },
                        {
                          label: 'PDF import',
                          icon: <ArrowUpRight className="h-3.5 w-3.5" />,
                          onClick: () => router.push('/admin/content/import'),
                        },
                        { separator: true, label: 'sep' },
                        {
                          label: "O'chirish",
                          danger: true,
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          onClick: () => setDeleteTarget(subject),
                        },
                      ]}
                    />
                  </div>
                </div>
              )
            })
          )}
        </section>

        {editing ? (
          <SubjectModal
            key={editing.id || 'new'}
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={save}
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
                }}
              >
                <Trash2 className="h-4 w-4" /> O'chirish
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold">{deleteTarget?.nameUz}</span> fani va unga tegishli barcha mavzular,
            videolar hamda testlar o'chiriladi.
          </p>
          <div className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-[12px] text-error">
            {deleteTarget ? stats.get(deleteTarget.id)?.topics ?? 0 : 0} mavzu va{' '}
            {deleteTarget ? stats.get(deleteTarget.id)?.videos ?? 0 : 0} video o'chiriladi. Foydalanuvchi natijalari saqlanadi.
          </div>
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
