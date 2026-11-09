'use client'

import { useEffect, useMemo, useState } from 'react'
import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  Checkbox,
  DifficultyBadge,
  Dropdown,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  SearchInput,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number, percent } from '@/lib/format'
import type { ContentStatus, Test, TestDifficulty } from '@/lib/types'

const PAGE_SIZE = 50
const letters = ['a', 'b', 'c', 'd'] as const

export default function TestsPage() {
  const tests = useAppStore((state) => state.tests)
  const topics = useAppStore((state) => state.topics)
  const subjects = useAppStore((state) => state.subjects)
  const subjectsById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const deleteTest = useAppStore((state) => state.deleteTest)
  const upsertTest = useAppStore((state) => state.upsertTest)
  const { toast } = useToast()

  const [subjectId, setSubjectId] = useState('all')
  const [topicId, setTopicId] = useState('all')
  const [difficulty, setDifficulty] = useState<'all' | TestDifficulty>('all')
  const [status, setStatus] = useState<'all' | ContentStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Test | null>(null)
  const [deleteIds, setDeleteIds] = useState<string[]>([])

  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? '—'
  const topicOptions = useMemo(
    () => topics.filter((topic) => (subjectId === 'all' ? true : topic.subjectId === subjectId)),
    [topics, subjectId],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tests
      .filter((test) => {
        if (topicId !== 'all') {
          if (test.topicId !== topicId) return false
        } else if (subjectId !== 'all') {
          const topic = topics.find((entry) => entry.id === test.topicId)
          if (topic?.subjectId !== subjectId) return false
        }
        if (difficulty !== 'all' && test.difficulty !== difficulty) return false
        if (status !== 'all' && test.status !== status) return false
        if (term && !test.question.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [tests, topics, subjectId, topicId, difficulty, status, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const allPageChecked = rows.length > 0 && rows.every((test) => selected.has(test.id))

  const resetFilters = () => {
    setSubjectId('all')
    setTopicId('all')
    setDifficulty('all')
    setStatus('all')
    setSearch('')
    setPage(1)
  }

  const openNew = () => {
    const topic = topicId !== 'all' ? topicId : topics[0]?.id
    if (!topic) {
      toast({ title: 'Avval mavzu yarating', tone: 'warning' })
      return
    }
    setEditing({
      id: '',
      question: '',
      options: { a: '', b: '', c: '', d: '' },
      correct: 'a',
      topicId: topic,
      difficulty: 'easy',
      status: 'active',
      used: 0,
      errorRate: 0,
      topWrong: 'b',
      note: '',
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Testlar <Badge tone="brand">{number(tests.length)} ta</Badge>
          </span>
        }
        subtitle="Test bazasini boshqaring, darajalang va statistikani kuzating"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Testlar' }]}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Test qo'shish
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 rounded-xl border border-line bg-white p-3 shadow-card sm:grid-cols-2 xl:grid-cols-5">
        <Select
          value={subjectId}
          onChange={(event) => {
            setSubjectId(event.target.value)
            setTopicId('all')
            setPage(1)
          }}
        >
          <option value="all">Barcha fanlar</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.nameUz}
            </option>
          ))}
        </Select>
        <Select
          value={topicId}
          onChange={(event) => {
            setTopicId(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">Barcha mavzular</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </Select>
        <Select
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value as 'all' | TestDifficulty)
            setPage(1)
          }}
        >
          <option value="all">Barcha darajalar</option>
          <option value="easy">Oson</option>
          <option value="medium">O'rta</option>
          <option value="hard">Qiyin</option>
          <option value="olympiad">Olimpiada</option>
        </Select>
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as 'all' | ContentStatus)
            setPage(1)
          }}
        >
          <option value="all">Barcha status</option>
          <option value="active">Faol</option>
          <option value="draft">Draft</option>
          <option value="hidden">Yashirin</option>
        </Select>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Savol matni..."
        />
      </div>

      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-brand bg-brand-soft px-3 py-2.5">
          <span className="text-[12.5px] font-semibold text-brand-text">{selected.size} ta tanlandi</span>
          <Button size="sm" variant="destructive" onClick={() => setDeleteIds(Array.from(selected))}>
            <Trash2 className="h-3.5 w-3.5" /> O'chirish
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Tanlovni tozalash
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {filtered.length === 0 ? (
          <EmptyState
            title="Test topilmadi"
            text="Filtrlarni o'zgartiring yoki yangi test qo'shing."
            action={
              <Button size="sm" variant="secondary" onClick={resetFilters}>
                Filterni tozalash
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      checked={allPageChecked}
                      indeterminate={!allPageChecked && rows.some((test) => selected.has(test.id))}
                      onChange={(value) =>
                        setSelected((current) => {
                          const next = new Set(current)
                          rows.forEach((test) => (value ? next.add(test.id) : next.delete(test.id)))
                          return next
                        })
                      }
                    />
                  </th>
                  <th className="w-10 px-2 py-2.5">№</th>
                  <th className="px-3 py-2.5">Savol (qisqa)</th>
                  <th className="px-3 py-2.5">Mavzu</th>
                  <th className="px-3 py-2.5">Daraja</th>
                  <th className="px-3 py-2.5">To'g'ri javob</th>
                  <th className="px-3 py-2.5">Ishlatilgan</th>
                  <th className="w-20 px-3 py-2.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((test, index) => {
                  const topic = topics.find((entry) => entry.id === test.topicId)
                  const subject = topic ? subjectsById.get(topic.subjectId) : undefined
                  return (
                    <tr key={test.id} className="border-b border-line-2 text-[12.5px] transition last:border-0 hover:bg-canvas">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(test.id)}
                          onChange={(value) =>
                            setSelected((current) => {
                              const next = new Set(current)
                              if (value) next.add(test.id)
                              else next.delete(test.id)
                              return next
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2 tabular text-ink-3">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setEditing(test)} className="block max-w-[330px] truncate text-left font-medium text-ink hover:text-brand-text">
                          {test.question}
                        </button>
                        <span className="text-[10px] text-ink-3">{subject?.nameUz ?? '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-ink-2">{topicName(test.topicId)}</td>
                      <td className="px-3 py-2">
                        <DifficultyBadge level={test.difficulty} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="grid h-5 w-5 place-items-center rounded bg-brand-soft text-[10px] font-bold text-brand-text">
                            {test.correct.toUpperCase()}
                          </span>
                          <span className="max-w-[110px] truncate text-ink-3">{test.options[test.correct]}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-2">
                        <span className="tabular">{number(test.used)} marta</span>
                        <span className={cn('ml-1 text-[10px]', test.errorRate > 50 ? 'text-error' : 'text-ink-3')}>
                          {percent(test.errorRate)} xato
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            aria-label="Tahrirlash"
                            onClick={() => setEditing(test)}
                            className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-brand-text"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
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
                                label: test.status === 'active' ? 'Draftga o\'tkazish' : 'Faollashtirish',
                                onClick: () =>
                                  upsertTest({ ...test, status: test.status === 'active' ? 'draft' : 'active' }),
                              },
                              {
                                label: "O'chirish",
                                danger: true,
                                icon: <Trash2 className="h-3.5 w-3.5" />,
                                onClick: () => setDeleteIds([test.id]),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 ? (
          <div className="border-t border-line px-4 py-3">
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onChange={setPage}
              total={filtered.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        ) : null}
      </div>

      {editing ? (
        <TestModal
          key={editing.id || 'new'}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(test) => {
            upsertTest(test)
            toast({
              title: editing.id ? 'Test yangilandi' : "Test qo'shildi",
              tone: 'success',
            })
            setEditing(null)
          }}
        />
      ) : null}

      <Modal
        open={deleteIds.length > 0}
        onClose={() => setDeleteIds([])}
        title="Testlarni o'chirish"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteIds([])}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteIds.forEach((id) => deleteTest(id))
                toast({ title: `${deleteIds.length} ta test o'chirildi`, tone: 'success' })
                setSelected(new Set())
                setDeleteIds([])
              }}
            >
              <Trash2 className="h-4 w-4" /> O'chirish
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          {deleteIds.length} ta test bazadan o'chiriladi. Olimpiadalarda ishlatilgan savollar natijalarga ta'sir
          qilmaydi.
        </p>
      </Modal>
    </PageTransition>
  )
}

function TestModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Test
  onClose: () => void
  onSave: (test: Test) => void
}) {
  const topics = useAppStore((state) => state.topics)
  const [form, setForm] = useState<Test>(initial)
  const [error, setError] = useState('')
  const isNew = !initial.id

  const submit = () => {
    if (!form.question.trim()) {
      setError('Savol matnini kiriting')
      return
    }
    if (!form.options.a.trim() || !form.options.b.trim() || !form.options.c.trim() || !form.options.d.trim()) {
      setError("Barcha variantlarni to'ldiring")
      return
    }
    onSave({
      ...form,
      id: form.id || `test-${Date.now().toString(36)}`,
      question: form.question.trim(),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Test qo'shish" : 'Testni tahrirlash'}
      size="lg"
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
        <Field label="Savol matni" required error={error && !form.question.trim() ? error : undefined}>
          <Textarea
            value={form.question}
            onChange={(event) => {
              setForm({ ...form, question: event.target.value })
              setError('')
            }}
            rows={3}
            placeholder="Savol matni... (LaTeX ham mumkin)"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Javob variantlari</p>
          <div className="space-y-2">
            {letters.map((key) => (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-2.5 py-2 transition',
                  form.correct === key ? 'border-brand bg-brand-soft/60' : 'border-line',
                )}
              >
                <button
                  type="button"
                  aria-label={`${key.toUpperCase()} to'g'ri javob`}
                  onClick={() => setForm({ ...form, correct: key })}
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition',
                    form.correct === key ? 'border-brand' : 'border-[#d1d5db]',
                  )}
                >
                  {form.correct === key ? <span className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
                </button>
                <span className="w-4 text-[12px] font-bold text-ink-3">{key.toUpperCase()}</span>
                <input
                  value={form.options[key]}
                  onChange={(event) => setForm({ ...form, options: { ...form.options, [key]: event.target.value } })}
                  placeholder={`${key.toUpperCase()} varianti`}
                  className="h-8 flex-1 rounded border-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-placeholder"
                />
                {form.correct === key ? <Badge tone="brand">To'g'ri</Badge> : null}
              </div>
            ))}
          </div>
          {error && form.question.trim() ? <p className="mt-1 text-[12px] text-error">{error}</p> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mavzu">
            <Select value={form.topicId} onChange={(event) => setForm({ ...form, topicId: event.target.value })}>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Daraja">
            <Select
              value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value as TestDifficulty })}
            >
              <option value="easy">Oson</option>
              <option value="medium">O'rta</option>
              <option value="hard">Qiyin</option>
              <option value="olympiad">Olimpiada</option>
            </Select>
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
          <Field label="Izoh (admin uchun)">
            <Input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Ixtiyoriy" />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-3.5">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
            Foydalanuvchi ko'radigan ko'rinish
          </p>
          <p className="text-[13px] font-medium text-ink">{form.question || 'Savol matni...'}</p>
          <div className="mt-2 space-y-1.5">
            {letters.map((key) => (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-[12px]',
                  form.correct === key ? 'border-brand text-brand-text' : 'border-line text-ink-2',
                )}
              >
                <span
                  className={cn(
                    'grid h-4 w-4 place-items-center rounded-full border text-[9px] font-bold',
                    form.correct === key ? 'border-brand bg-brand text-white' : 'border-[#d1d5db] text-ink-3',
                  )}
                >
                  {key.toUpperCase()}
                </span>
                {form.options[key] || `${key.toUpperCase()} varianti`}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
