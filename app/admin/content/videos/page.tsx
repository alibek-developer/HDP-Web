'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Eye, Pencil, PlaySquare, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { ContentHeader, ContentTabs, contentRoot } from '@/components/content/ContentShell'
import { Button, Drawer, Modal, Switch, cn, useToast } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'
import type { ContentStatus, Video } from '@/lib/types'

const STATUS: Record<ContentStatus, { label: string; dot: string }> = {
  active: { label: 'Faol', dot: 'bg-brand' },
  draft: { label: 'Draft', dot: 'bg-warning' },
  hidden: { label: 'Yashirin', dot: 'bg-ink-3/50' },
}

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13px] font-medium text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

const extractYoutube = (input: string): string => {
  const match = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : input.trim()
}

const selectClass =
  'h-10 shrink-0 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12px] font-semibold text-ink-2 outline-none transition hover:border-line-brand focus:border-brand'

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
  const [filtersOpen, setFiltersOpen] = useState(false)

  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? '—'
  const subjectOfTopic = (id: string) => topics.find((topic) => topic.id === id)?.subjectId
  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.nameUz ?? '—'

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
      <div className={contentRoot}>
        <ContentHeader
          title="Videolar"
          count={videos.length}
          subtitle="Dars videolarini mavzuga bog'lang va tartiblang."
          actions={
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ink px-3.5 font-geist text-[13px] font-bold text-white transition hover:bg-brand sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Video qo'shish</span>
              <span className="sm:hidden">Video</span>
            </button>
          }
        />

        <ContentTabs />

        <section className="flex shrink-0 items-center gap-2 rounded-[16px] border border-line bg-white px-3 py-2.5 sm:px-4">
          <div className="relative min-w-0 flex-1 sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Video nomi bo'yicha qidirish..."
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
          <div className="hidden min-w-0 flex-1 items-center gap-2 xl:flex xl:flex-none">
            <select
              value={subjectFilter}
              onChange={(event) => {
                setSubjectFilter(event.target.value)
                setTopicFilter('all')
              }}
              aria-label="Fan"
              className={cn(selectClass, 'min-w-0 flex-1 sm:w-40')}
            >
              <option value="all">Barcha fanlar</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.nameUz}
                </option>
              ))}
            </select>
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              aria-label="Mavzu"
              className={cn(selectClass, 'min-w-0 flex-1 sm:w-44')}
            >
              <option value="all">Barcha mavzular</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | ContentStatus)}
              aria-label="Status"
              className={cn(selectClass, 'w-[112px] flex-none')}
            >
              <option value="all">Barcha status</option>
              <option value="active">Faol</option>
              <option value="draft">Draft</option>
              <option value="hidden">Yashirin</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label="Filtrlar"
            className="relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] border border-line bg-white px-3 font-geist text-[12px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink xl:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtr
            {[subjectFilter !== 'all', topicFilter !== 'all', status !== 'all'].filter(Boolean).length > 0 ? (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 font-geist text-[9px] font-bold text-white">
                {[subjectFilter !== 'all', topicFilter !== 'all', status !== 'all'].filter(Boolean).length}
              </span>
            ) : null}
          </button>
          <span className="ml-auto hidden font-geist text-[11.5px] font-medium text-ink-3 lg:block">
            {number(filtered.length)} ta video · {number(topics.length)} mavzu
          </span>
        </section>

        <Drawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filtrlar"
          subtitle={`${number(filtered.length)} ta video topildi`}
          widthClass="sm:w-[420px]"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setSubjectFilter('all')
                  setTopicFilter('all')
                  setStatus('all')
                }}
              >
                Tozalash
              </Button>
              <Button className="h-11 sm:h-10" onClick={() => setFiltersOpen(false)}>
                Ko'rsatish ({number(filtered.length)})
              </Button>
            </>
          }
        >
          <div className="space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Fan</span>
              <select
                value={subjectFilter}
                onChange={(event) => {
                  setSubjectFilter(event.target.value)
                  setTopicFilter('all')
                }}
                className={fieldClass}
              >
                <option value="all">Barcha fanlar</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.nameUz}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Mavzu</span>
              <select
                value={topicFilter}
                onChange={(event) => setTopicFilter(event.target.value)}
                className={fieldClass}
              >
                <option value="all">Barcha mavzular</option>
                {topicOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as 'all' | ContentStatus)}
                className={fieldClass}
              >
                <option value="all">Barcha status</option>
                <option value="active">Faol</option>
                <option value="draft">Draft</option>
                <option value="hidden">Yashirin</option>
              </select>
            </label>
          </div>
        </Drawer>

        <section className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="grid h-full min-h-[240px] place-items-center rounded-[20px] border border-line bg-white px-4">
              <div className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-ink-3">
                  <PlaySquare className="h-5 w-5" />
                </span>
                <p className="mt-3 font-geist text-[13px] font-semibold text-ink">Video topilmadi</p>
                <p className="mt-1 font-geist text-[11.5px] text-ink-3">
                  Filtrlarni o'zgartiring yoki yangi video qo'shing.
                </p>
                <Button className="mt-3 h-11" onClick={openNew}>
                  <Plus className="h-4 w-4" /> Video qo'shish
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((video) => {
                const meta = STATUS[video.status]
                const subjectId = subjectOfTopic(video.topicId)
                return (
                  <article
                    key={video.id}
                    className="group overflow-hidden rounded-[16px] border border-line bg-white transition hover:border-line-brand hover:shadow-card"
                  >
                    <button
                      type="button"
                      onClick={() => setEditing(video)}
                      className="relative block aspect-video w-full overflow-hidden bg-muted text-left"
                      aria-label={`${video.name} — tahrirlash`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-geist text-[10px] font-semibold tabular text-white">
                        {video.duration}
                      </span>
                      {video.proOnly ? (
                        <span className="absolute left-2 top-2 rounded-full bg-[#7c3aed] px-2 py-0.5 font-geist text-[9px] font-bold tracking-[0.04em] text-white">
                          PRO
                        </span>
                      ) : null}
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 font-geist text-[9.5px] font-semibold text-white">
                        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                        {meta.label}
                      </span>
                    </button>
                    <div className="p-3">
                      <p className="line-clamp-2 min-h-[34px] font-geist text-[12.5px] font-semibold leading-snug text-ink">
                        {video.name}
                      </p>
                      <p className="mt-1 truncate font-geist text-[10.5px] text-ink-3">
                        {topicName(video.topicId)} · {subjectName(subjectId ?? '')}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-line-2 pt-2">
                        <span className="inline-flex items-center gap-1 font-geist text-[10.5px] font-medium tabular text-ink-3">
                          <Eye className="h-3 w-3" /> {number(video.views)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <a
                            href={`https://youtube.com/watch?v=${video.youtubeId}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="YouTube'da ochish"
                            className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition hover:bg-muted hover:text-ink"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            aria-label="Tahrirlash"
                            onClick={() => setEditing(video)}
                            className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition hover:bg-muted hover:text-ink"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="O'chirish"
                            onClick={() => setDeleteTarget(video)}
                            className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition hover:bg-error-bg hover:text-error"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

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
                className="h-11 sm:h-10"
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
      </div>
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
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const [form, setForm] = useState<Video>({
    ...initial,
    youtubeId: initial.youtubeId ? `https://youtube.com/watch?v=${initial.youtubeId}` : '',
  })
  const [error, setError] = useState('')
  const isNew = !initial.id

  const parsedId = extractYoutube(form.youtubeId)
  const validId = /^[A-Za-z0-9_-]{11}$/.test(parsedId)
  const subjectId = topics.find((topic) => topic.id === form.topicId)?.subjectId

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
          <Button className="h-11 sm:h-10" onClick={submit}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">
            YouTube URL <span className="text-error">*</span>
          </span>
          <input
            value={form.youtubeId}
            onChange={(event) => {
              setForm({ ...form, youtubeId: event.target.value })
              setError('')
            }}
            placeholder="https://youtube.com/watch?v=..."
            className={cn(fieldClass, Boolean(form.youtubeId) && !validId && 'border-error')}
          />
        </label>
        {validId ? (
          <div className="overflow-hidden rounded-[10px] border border-line">
            <iframe
              src={`https://www.youtube.com/embed/${parsedId}`}
              title="YouTube preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
            <div className="flex items-center justify-between gap-2 border-t border-line-2 bg-canvas px-2.5 py-1.5 font-geist text-[10.5px] text-ink-3">
              <span className="truncate font-mono">{parsedId}</span>
              <a
                href={`https://youtube.com/watch?v=${parsedId}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 font-semibold text-brand-text hover:underline"
              >
                YouTube'da ochish
              </a>
            </div>
          </div>
        ) : form.youtubeId ? (
          <p className="rounded-[10px] bg-error-bg px-3 py-2 font-geist text-[11px] font-medium text-error">
            To'g'ri YouTube havolasini kiriting yoki 11 belgili video ID sini qo'ying.
          </p>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">
            Nomi <span className="text-error">*</span>
          </span>
          <input
            value={form.name}
            onChange={(event) => {
              setForm({ ...form, name: event.target.value })
              setError('')
            }}
            placeholder="Video sarlavhasi"
            className={cn(fieldClass, error && !form.name.trim() && 'border-error')}
          />
          {error && !form.name.trim() ? (
            <span className="mt-1 block font-geist text-[11px] font-medium text-error">{error}</span>
          ) : null}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Fan</span>
            <select
              value={subjectId ?? ''}
              onChange={(event) => {
                const firstTopic = topics.find((topic) => topic.subjectId === event.target.value)
                if (firstTopic) {
                  const order = useAppStore.getState().videos.filter((video) => video.topicId === firstTopic.id).length + 1
                  setForm({ ...form, topicId: firstTopic.id, order })
                }
              }}
              className={fieldClass}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.nameUz}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Mavzu</span>
            <select
              value={form.topicId}
              onChange={(event) => setForm({ ...form, topicId: event.target.value })}
              className={fieldClass}
            >
              {topics
                .filter((topic) => (subjectId ? topic.subjectId === subjectId : true))
                .map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Davomiyligi</span>
            <input
              value={form.duration}
              onChange={(event) => setForm({ ...form, duration: event.target.value })}
              placeholder="18:34"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-geist text-[12px] font-semibold text-ink-2">Tartib raqami</span>
            <input
              type="number"
              min={1}
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="flex items-end justify-between gap-2 rounded-[10px] border border-line px-3 py-2.5">
            <div>
              <p className="font-geist text-[12px] font-semibold text-ink">Faqat Pro</p>
              <p className="font-geist text-[10.5px] text-ink-3">Bepul rejada berkitiladi</p>
            </div>
            <Switch checked={form.proOnly} onChange={(value) => setForm({ ...form, proOnly: value })} size="sm" />
          </div>
        </div>
      </div>
    </Modal>
  )
}
