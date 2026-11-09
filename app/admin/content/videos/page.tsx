'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, MoreVertical, Pencil, Plus, Trash2, Video as VideoIcon } from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  Dropdown,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  Switch,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
import type { ContentStatus, Video } from '@/lib/types'

const statusLabel: Record<ContentStatus, string> = { active: 'Faol', draft: 'Draft', hidden: 'Yashirin' }

const extractYoutube = (input: string): string => {
  const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : input.trim()
}

export default function VideosPage() {
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const videos = useAppStore((state) => state.videos)
  const upsertVideo = useAppStore((state) => state.upsertVideo)
  const deleteVideo = useAppStore((state) => state.deleteVideo)
  const { toast } = useToast()

  const [subjectFilter, setSubjectFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [status, setStatus] = useState<'all' | ContentStatus>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Video | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null)

  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? '—'
  const subjectOfTopic = (id: string) => topics.find((topic) => topic.id === id)?.subjectId

  const topicOptions = useMemo(
    () => topics.filter((topic) => (subjectFilter === 'all' ? true : topic.subjectId === subjectFilter)),
    [topics, subjectFilter],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return videos
      .filter((video) => {
        if (subjectFilter !== 'all' && subjectOfTopic(video.topicId) !== subjectFilter) return false
        if (topicFilter !== 'all' && video.topicId !== topicFilter) return false
        if (status !== 'all' && video.status !== status) return false
        if (term && !video.name.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [videos, subjectFilter, topicFilter, status, search])

  const openNew = () => {
    const topicId = topicFilter !== 'all' ? topicFilter : topicOptions[0]?.id ?? topics[0]?.id
    if (!topicId) {
      toast({ title: 'Avval mavzu yarating', tone: 'warning' })
      return
    }
    const order = videos.filter((video) => video.topicId === topicId).length + 1
    setEditing({
      id: '',
      topicId,
      name: '',
      youtubeId: '',
      duration: '',
      views: 0,
      status: 'active',
      proOnly: false,
      order,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <PageTransition>
      <PageHeader
        title="Videolar"
        subtitle="Dars videolarini yuklang, mavzuga bog'lang va tartiblang"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Kontent', href: '/admin/content' }, { label: 'Videolar' }]}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Video qo'shish
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={subjectFilter}
          onChange={(event) => {
            setSubjectFilter(event.target.value)
            setTopicFilter('all')
          }}
          className="w-full sm:w-44"
        >
          <option value="all">Barcha fanlar</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.nameUz}
            </option>
          ))}
        </Select>
        <Select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="w-full sm:w-48">
          <option value="all">Barcha mavzular</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </Select>
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
        <SearchInput value={search} onChange={setSearch} placeholder="Video nomi..." className="w-full sm:w-52" />
        <span className="ml-auto text-[12px] text-ink-3">{number(filtered.length)} ta video</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {filtered.length === 0 ? (
          <EmptyState title="Video topilmadi" text="Filtrlarni o'zgartiring yoki yangi video qo'shing." icon={<VideoIcon className="h-5 w-5" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                  <th className="px-3 py-2.5">Video</th>
                  <th className="px-3 py-2.5">Mavzu</th>
                  <th className="px-3 py-2.5">Davomiyligi</th>
                  <th className="px-3 py-2.5">Ko'rishlar</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="w-20 px-3 py-2.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((video) => (
                  <tr key={video.id} className="border-b border-line-2 text-[12.5px] transition last:border-0 hover:bg-canvas">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <img
                            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                            alt={video.name}
                            className="h-[45px] w-20 rounded-md object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[9px] font-semibold text-white">
                            {video.duration}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate font-semibold text-ink">{video.name}</p>
                          <p className="flex items-center gap-1 text-[10.5px] text-ink-3">
                            <span className="font-mono">{video.youtubeId}</span>
                            {video.proOnly ? <Badge tone="violet">PRO</Badge> : null}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-ink-2">{topicName(video.topicId)}</td>
                    <td className="px-3 py-2 tabular text-ink-2">{video.duration}</td>
                    <td className="px-3 py-2 tabular text-ink-2">{number(video.views)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={video.status === 'active' ? 'success' : video.status === 'draft' ? 'warning' : 'gray'}>
                        {statusLabel[video.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <a
                          href={`https://youtube.com/watch?v=${video.youtubeId}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="YouTube'da ochish"
                          className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-brand-text"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <IconButton label="Tahrirlash" onClick={() => setEditing(video)}>
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
                              label: 'Tahrirlash',
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => setEditing(video),
                            },
                            {
                              label: "O'chirish",
                              danger: true,
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              onClick: () => setDeleteTarget(video),
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
        jami {number(videos.length)} ta video · {number(topics.length)} mavzu bo'yicha taqsimlangan
      </p>

      {editing ? (
        <VideoModal
          key={editing.id || 'new'}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(video) => {
            upsertVideo(video)
            toast({
              title: editing.id ? 'Video yangilandi' : "Video qo'shildi",
              description: video.name,
              tone: 'success',
            })
            setEditing(null)
          }}
        />
      ) : null}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Videoni o'chirish"
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
                deleteVideo(deleteTarget.id)
                toast({ title: "Video o'chirildi", description: deleteTarget.name, tone: 'success' })
                setDeleteTarget(null)
              }}
            >
              <Trash2 className="h-4 w-4" /> O'chirish
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold">{deleteTarget?.name}</span> videosi o'chiriladi. Foydalanuvchi ko'rish
          tarixi saqlanadi, ammo video pleerdan yo'qoladi.
        </p>
      </Modal>
    </PageTransition>
  )
}

function VideoModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Video
  onClose: () => void
  onSave: (video: Video) => void
}) {
  const topics = useAppStore((state) => state.topics)
  const [form, setForm] = useState<Video>({
    ...initial,
    youtubeId: initial.youtubeId ? `https://youtube.com/watch?v=${initial.youtubeId}` : '',
  })
  const [error, setError] = useState('')
  const isNew = !initial.id

  const parsedId = extractYoutube(form.youtubeId)
  const validId = /^[A-Za-z0-9_-]{11}$/.test(parsedId)

  const submit = () => {
    if (!form.name.trim() || !validId) {
      setError(!form.name.trim() ? 'Video nomini kiriting' : "To'g'ri YouTube havolasini kiriting")
      return
    }
    onSave({
      ...form,
      id: form.id || `video-${Date.now().toString(36)}`,
      name: form.name.trim(),
      youtubeId: parsedId,
      duration: form.duration.trim() || '00:00',
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Video qo'shish" : 'Videoni tahrirlash'}
      description="YouTube havolasini qo'ying — thumbnail avtomatik olinadi."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit}>Saqlash</Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="YouTube URL" required error={error && !form.name.trim() ? '' : undefined}>
          <Input
            value={form.youtubeId}
            onChange={(event) => {
              setForm({ ...form, youtubeId: event.target.value })
              setError('')
            }}
            placeholder="https://youtube.com/watch?v=..."
          />
        </Field>
        {validId ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <iframe
              src={`https://www.youtube.com/embed/${parsedId}`}
              title="YouTube preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
            <div className="flex items-center justify-between gap-2 border-t border-line-2 bg-canvas px-2.5 py-1.5 text-[11px] text-ink-3">
              <span className="font-mono">{parsedId}</span>
              <a
                href={`https://youtube.com/watch?v=${parsedId}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-brand-text hover:underline"
              >
                YouTube'da ochish
              </a>
            </div>
          </div>
        ) : null}
        <Field label="Nomi" required error={error && !form.name.trim() ? error : undefined}>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Video sarlavhasi" />
        </Field>
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
          <Field label="Tartib raqami">
            <Input
              type="number"
              min={1}
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
            />
          </Field>
          <Field label="Davomiyligi" hint="Format: 18:34">
            <Input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="18:34" />
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
            <p className="text-[12.5px] font-semibold text-ink">Faqat Pro foydalanuvchilar uchun</p>
            <p className="text-[11px] text-ink-3">Bepul foydalanuvchilar videoni ko'ra olmaydi</p>
          </div>
          <Switch checked={form.proOnly} onChange={(value) => setForm({ ...form, proOnly: value })} />
        </div>
        {validId && form.name ? (
          <div className={cn('rounded-lg bg-canvas px-3 py-2 text-[11px] text-ink-3')}>
            Saqlangandan so'ng video \"{form.name}\" nomi bilan ro'yxatda paydo bo'ladi.
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
