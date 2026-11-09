'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Eye,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { PageHeader, PageTransition, Stagger, StaggerItem } from '@/components/layout/Page'
import {
  Button,
  Card,
  Dropdown,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
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

const statusBadge: Record<ContentStatus, { label: string; className: string }> = {
  active: { label: 'FAOL', className: 'bg-brand-soft text-brand-text' },
  draft: { label: 'DRAFT', className: 'bg-warning-bg text-warning' },
  hidden: { label: 'YASHIRIN', className: 'bg-muted text-ink-3' },
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

export default function SubjectsPage() {
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

  const save = (subject: Subject) => {
    upsertSubject(subject)
    toast({
      title: editing?.id ? 'Fan yangilandi' : 'Yangi fan qo\'shildi',
      description: subject.nameUz,
      tone: 'success',
    })
    setEditing(null)
  }

  return (
    <PageTransition>
      <PageHeader
        title="Fanlar"
        subtitle="Fanlarni yarating, tartiblang va kontent bilan bog'lang"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Kontent', href: '/admin/content' }, { label: 'Fanlar' }]}
        actions={
          <Button onClick={() => setEditing(emptySubject(subjects.length + 1))}>
            <Plus className="h-4 w-4" /> Yangi fan
          </Button>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((subject) => {
          const color = colorOf(subject.color)
          const counts = stats.get(subject.id) ?? { topics: 0, videos: 0, tests: 0 }
          return (
            <StaggerItem key={subject.id}>
              <Card className="card-hover group flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-[19px] font-extrabold',
                        color.soft,
                        color.text,
                      )}
                    >
                      {subject.icon || subject.nameUz.slice(0, 1)}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.04em]',
                          statusBadge[subject.status].className,
                        )}
                      >
                        {statusBadge[subject.status].label}
                      </span>
                      <Dropdown
                        trigger={
                          <button
                            type="button"
                            aria-label="Amallar"
                            className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-canvas"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        }
                        items={[
                          {
                            label: 'Tahrirlash',
                            icon: <Pencil className="h-3.5 w-3.5" />,
                            onClick: () => setEditing(subject),
                          },
                          {
                            label: 'Mavzularni ko\'rish',
                            icon: <Layers className="h-3.5 w-3.5" />,
                            onClick: () => {
                              window.location.href = `/admin/content/topics?subject=${subject.id}`
                            },
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
                  <h3 className="mt-3 font-display text-[17px] font-bold tracking-[-0.01em] text-ink">{subject.nameUz}</h3>
                  {subject.nameRu ? <p className="text-[12px] text-ink-3">{subject.nameRu}</p> : null}
                  <p className="mt-2 line-clamp-2 min-h-[34px] text-[12px] leading-relaxed text-ink-3">{subject.description}</p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-3 rounded-lg bg-canvas px-2.5 py-2 text-[11.5px] text-ink-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> {counts.topics} mavzu
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {counts.videos} video
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> {counts.tests} test
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(subject)}>
                      <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                    </Button>
                    <Link href={`/admin/content/topics?subject=${subject.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Ko'rish <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          )
        })}
        {sorted.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3">
            <Card>
              <EmptyState
                title="Hali fanlar yo'q"
                text="Birinchi fanni qo'shib, mavzular va videolarni bog'lang."
                action={
                  <Button onClick={() => setEditing(emptySubject(1))}>
                    <Plus className="h-4 w-4" /> Fan qo'shish
                  </Button>
                }
              />
            </Card>
          </div>
        ) : null}
      </Stagger>

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
                toast({ title: 'Fan o\'chirildi', description: deleteTarget.nameUz, tone: 'success' })
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
          <Field label="Fan nomi (UZ)" required error={error}>
            <Input
              value={form.nameUz}
              onChange={(event) => {
                setForm({ ...form, nameUz: event.target.value })
                setError('')
              }}
              placeholder="Masalan: Algebra I"
            />
          </Field>
          <Field label="Fan nomi (RU)">
            <Input
              value={form.nameRu}
              onChange={(event) => setForm({ ...form, nameRu: event.target.value })}
              placeholder="Например: Алгебра I"
            />
          </Field>
        </div>

        <Field label="Qisqa tavsif">
          <Textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={2}
            placeholder="Fan haqida qisqacha ma'lumot"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Rang</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setForm({ ...form, color: color.value })}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition',
                  form.color === color.value
                    ? 'border-brand bg-brand-soft text-brand-text'
                    : 'border-line text-ink-3 hover:bg-canvas',
                )}
              >
                <span className={cn('h-3 w-3 rounded-full', color.dot)} /> {color.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Ikonka" hint="Harf yoki emoji">
            <Input
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              maxLength={4}
              placeholder="A"
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
          <Field label="Tartib raqami">
            <Input
              type="number"
              min={1}
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Ko'rinishi</p>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'grid h-10 w-10 place-items-center rounded-xl font-display text-base font-extrabold',
                colorOf(form.color).soft,
                colorOf(form.color).text,
              )}
            >
              {form.icon || form.nameUz.slice(0, 1) || 'A'}
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">{form.nameUz || 'Fan nomi'}</p>
              <p className="text-[11px] text-ink-3">{form.nameRu || 'Ruscha nomi'}</p>
            </div>
            <span
              className={cn(
                'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
                statusBadge[form.status].className,
              )}
            >
              {statusBadge[form.status].label}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
