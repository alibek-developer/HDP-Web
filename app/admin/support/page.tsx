'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  Send,
  SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, number, relative } from '@/lib/format'
import { faqReplies } from '@/lib/mock'
import type { TicketPriority, TicketStatus } from '@/lib/types'

const STATUS: Record<TicketStatus, { label: string; tone: 'info' | 'warning' | 'gray' }> = {
  new: { label: 'Yangi', tone: 'info' },
  progress: { label: 'Jarayonda', tone: 'warning' },
  closed: { label: 'Yopildi', tone: 'gray' },
}

const PRIORITY: Record<TicketPriority, { label: string; tone: 'danger' | 'warning' | 'gray' }> = {
  high: { label: 'Yuqori', tone: 'danger' },
  medium: { label: "O'rta", tone: 'warning' },
  low: { label: 'Past', tone: 'gray' },
}

export default function SupportPage() {
  const tickets = useAppStore((state) => state.tickets)
  const updateTicket = useAppStore((state) => state.updateTicket)
  const replyTicket = useAppStore((state) => state.replyTicket)
  const { toast } = useToast()

  const [status, setStatus] = useState<'all' | TicketStatus>('all')
  const [priority, setPriority] = useState<'all' | TicketPriority>('all')
  const [period, setPeriod] = useState('30')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const active = tickets.find((ticket) => ticket.id === activeId) ?? null
  const chatRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const limit = period === 'all' ? Infinity : Number(period) * 86_400_000
    const anchor = new Date('2026-11-08T09:00:00+05:00').getTime()
    return tickets
      .filter((ticket) => {
        if (status !== 'all' && ticket.status !== status) return false
        if (priority !== 'all' && ticket.priority !== priority) return false
        if (limit !== Infinity && anchor - new Date(ticket.updatedAt).getTime() > limit) return false
        if (term && !`${ticket.subject} ${ticket.userName} ${ticket.telegram}`.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }, [tickets, status, priority, period, search])

  const counts = useMemo(
    () => ({
      all: tickets.length,
      new: tickets.filter((ticket) => ticket.status === 'new').length,
      progress: tickets.filter((ticket) => ticket.status === 'progress').length,
      closed: tickets.filter((ticket) => ticket.status === 'closed').length,
      high: tickets.filter((ticket) => ticket.priority === 'high' && ticket.status !== 'closed').length,
    }),
    [tickets],
  )

  useEffect(() => {
    if (!active) return
    setReply('')
    const node = chatRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [activeId, active?.messages.length])

  const sendReply = () => {
    if (!active) return
    const text = reply.trim()
    if (!text) return toast({ title: 'Javob matnini kiriting', tone: 'warning' })
    replyTicket(active.id, text)
    setReply('')
    toast({ title: 'Javob yuborildi', description: `${active.userName} ga yuborildi`, tone: 'success' })
    requestAnimationFrame(() => {
      const node = chatRef.current
      if (node) node.scrollTop = node.scrollHeight
    })
  }

  const closeTicket = () => {
    if (!active) return
    updateTicket(active.id, { status: 'closed' })
    toast({ title: 'Murojaat yopildi', description: active.subject, tone: 'success' })
  }

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3.5 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-[-2px] [&_button]:focus-visible:outline-brand">
        <div className={cn('shrink-0 flex-wrap items-center justify-between gap-2', active ? 'hidden xl:flex' : 'flex')}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
              <span className="text-ink-3">Dashboard</span>
              <span className="text-placeholder">/</span>
              <span className="text-ink">Support</span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="h2 truncate text-ink">Support</h1>
              <Badge tone={counts.new ? 'danger' : 'brand'}>{number(counts.new)} yangi</Badge>
            </div>
            <p className="mt-0.5 hidden truncate text-[12px] text-ink-3 sm:block">
              Foydalanuvchilar murojaatlari, chat va Telegram integratsiyasi
            </p>
          </div>
        </div>

        <div className={cn('shrink-0 grid-cols-4 divide-x divide-line-2 overflow-hidden rounded-[14px] border border-line bg-white shadow-card', active ? 'hidden xl:grid [@media(max-height:850px)]:hidden' : 'grid')}>
          {[
            { icon: LifeBuoy, label: 'Yangi', value: counts.new, foot: 'Yangi murojaatlar', color: 'text-info' },
            { icon: MessageCircle, label: 'Jarayonda', value: counts.progress, foot: 'Ko‘rib chiqilmoqda', color: 'text-warning' },
            { icon: AlertTriangle, label: 'Muhim', value: counts.high, foot: 'Yuqori muhimlik · ochiq', color: 'text-error' },
            { icon: CheckCircle2, label: 'Yopilgan', value: counts.closed, foot: `Jami ${number(counts.all)} ta`, color: 'text-ink-3' },
          ].map((cell) => {
            const Icon = cell.icon
            return (
              <div key={cell.label} className="min-w-0 px-2.5 py-2 sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-3 sm:text-xs">
                  <Icon className={cn('hidden h-3.5 w-3.5 shrink-0 sm:block', cell.color)} />
                  <span>{cell.label}</span>
                </div>
                <p className={cn('mt-1 text-[22px] font-geist leading-none tabular-nums', cell.color)}>{number(cell.value)}</p>
                <p className="mt-1 hidden truncate text-[11px] text-ink-3 sm:block">{cell.foot}</p>
              </div>
            )
          })}
        </div>

        <div className={cn('shrink-0 flex-col gap-2 rounded-[14px] border border-line bg-white p-2.5 shadow-card xl:flex-row xl:flex-wrap xl:items-center', active ? 'hidden xl:flex' : 'flex')}>
          <div className="flex min-w-0 gap-2 xl:w-[280px]">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Murojaat qidirish</span>
              <SearchInput value={search} onChange={setSearch} placeholder="Mavzu, ism yoki Telegram..." />
            </label>
            <button type="button" aria-label="Qo‘shimcha filtrlar" aria-expanded={filtersOpen} aria-controls="support-filters" onClick={() => setFiltersOpen(!filtersOpen)} className={cn('relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border xl:hidden', filtersOpen ? 'border-brand bg-brand-soft text-brand-text' : 'border-line text-ink-3')}>
              <SlidersHorizontal className="h-4 w-4" />
              {priority !== 'all' || period !== '30' ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" /> : null}
            </button>
          </div>
          <div role="group" aria-label="Murojaat holati bo‘yicha filtr" className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 xl:flex">
            {([
              { value: 'all', label: 'Barchasi' },
              { value: 'new', label: 'Yangi' },
              { value: 'progress', label: 'Jarayonda' },
              { value: 'closed', label: 'Yopildi' },
            ] as const).map((item) => (
              <button key={item.value} type="button" aria-pressed={status === item.value} onClick={() => setStatus(item.value)} className={cn('min-h-11 rounded-md px-1.5 text-xs font-semibold transition xl:min-h-8 xl:px-3', status === item.value ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink')}>
                {item.label}
              </button>
            ))}
          </div>
          <div id="support-filters" className={cn('min-w-0 xl:ml-auto', filtersOpen ? 'block' : 'hidden xl:block')}>
            <div className="grid grid-cols-2 gap-2 xl:flex">
              <Select aria-label="Muhimlik bo‘yicha filtr" value={priority} onChange={(event) => setPriority(event.target.value as 'all' | TicketPriority)} className="min-h-11 min-w-0 text-base sm:text-sm xl:min-h-10">
                <option value="all">Barcha muhimlik</option><option value="high">Yuqori</option><option value="medium">O'rta</option><option value="low">Past</option>
              </Select>
              <Select aria-label="Davr bo‘yicha filtr" value={period} onChange={(event) => setPeriod(event.target.value)} className="min-h-11 min-w-0 text-base sm:text-sm xl:min-h-10">
                <option value="7">Oxirgi 7 kun</option><option value="30">Oxirgi 30 kun</option><option value="all">Barcha davr</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
          <div
            role="region"
            aria-label="Murojaatlar ro‘yxati"
            className={cn(
              'min-h-0 w-full flex-col xl:w-[360px] xl:shrink-0 xl:border-r xl:border-line-2',
              activeId ? 'hidden xl:flex' : 'flex',
            )}
          >
            {filtered.length === 0 ? (
              <div className="grid min-h-0 flex-1 place-items-center p-4">
                <EmptyState icon={<LifeBuoy className="h-5 w-5" />} title="Murojaat topilmadi" text="Tanlangan filtrlar bo'yicha murojaatlar yo'q." />
              </div>
            ) : (
              <div className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint]">
                {filtered.map((ticket) => {
                  const unread = ticket.status === 'new'
                  const selected = ticket.id === activeId
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setActiveId(ticket.id)}
                      className={cn(
                        'block w-full border-l-2 px-3 py-2.5 text-left transition',
                        selected
                          ? 'border-brand bg-brand-soft/50'
                          : 'border-transparent hover:bg-canvas',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" /> : null}
                        <span className={cn('truncate text-[12.5px]', unread ? 'font-bold text-ink' : 'font-semibold text-ink')}>
                          {ticket.subject}
                        </span>
                        <span className="ml-auto shrink-0 text-[10.5px] tabular-nums text-ink-3">
                          {relative(ticket.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-ink-3">
                        {ticket.messages[ticket.messages.length - 1]?.text}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Avatar name={ticket.userName} size="sm" />
                        <span className="min-w-0 truncate text-[11px] font-medium text-ink-2">{ticket.userName}</span>
                        <span className="ml-auto flex shrink-0 items-center gap-1.5">
                          <Badge tone={PRIORITY[ticket.priority].tone}>{PRIORITY[ticket.priority].label}</Badge>
                          <Badge tone={STATUS[ticket.status].tone}>{STATUS[ticket.status].label}</Badge>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            <div role="status" className="shrink-0 border-t border-line-2 px-3 py-2 text-xs font-medium text-ink-3">
              Topildi: {number(filtered.length)} ta · Jami {number(counts.all)} ta
            </div>
          </div>

          <div role="region" aria-label="Murojaat suhbati" className={cn('min-h-0 min-w-0 flex-1 flex-col', activeId ? 'flex' : 'hidden xl:flex')}>
            {!active ? (
              <div className="grid min-h-0 flex-1 place-items-center p-4">
                <EmptyState
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Murojaat tanlang"
                  text="Chapdan birorta murojaat oching — suhbat shu yerda ko'rinadi."
                />
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-line-2 px-3 py-2.5 sm:px-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line-2 text-ink-3 transition hover:bg-canvas xl:hidden"
                      aria-label="Orqaga"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{active.subject}</p>
                      <p className="truncate font-mono text-[10.5px] text-ink-3">
                        {active.id} · {dateTime(active.createdAt)}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" aria-label="Murojaatni yopish" className="min-h-11 min-w-11" onClick={closeTicket} disabled={active.status === 'closed'}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="max-[420px]:hidden">{active.status === 'closed' ? 'Yopilgan' : 'Yopish'}</span>
                    </Button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar name={active.userName} size="sm" />
                      <Link href={`/admin/users/${active.userId}`} className="font-semibold text-brand-text hover:underline">
                        {active.userName}
                      </Link>
                    </span>
                    <span>{active.telegram}</span>
                    <span>Oxirgi: {relative(active.updatedAt)}</span>
                    <span>Admin: {active.admin || '—'}</span>
                    <a
                      href={`https://t.me/${active.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-info hover:underline"
                    >
                      Telegram'ga ulash <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-sm">
                    <Select
                      aria-label="Murojaat muhimligi"
                      value={active.priority}
                      onChange={(event) => {
                        updateTicket(active.id, { priority: event.target.value as TicketPriority })
                        toast({ title: 'Muhimlik o‘zgartirildi', tone: 'success' })
                      }}
                      className="min-h-11 text-base sm:text-xs"
                    >
                      <option value="high">Yuqori</option>
                      <option value="medium">O'rta</option>
                      <option value="low">Past</option>
                    </Select>
                    <Select
                      aria-label="Murojaat statusi"
                      value={active.status}
                      onChange={(event) => {
                        updateTicket(active.id, { status: event.target.value as TicketStatus })
                        toast({ title: 'Status o‘zgartirildi', tone: 'success' })
                      }}
                      className="min-h-11 text-base sm:text-xs"
                    >
                      <option value="new">Yangi</option>
                      <option value="progress">Jarayonda</option>
                      <option value="closed">Yopildi</option>
                    </Select>
                  </div>
                </div>

                <div ref={chatRef} role="log" aria-label="Suhbat xabarlari" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [contain:paint] bg-canvas/60 p-3 sm:p-4">
                  {active.messages.map((message) => {
                    const mine = message.from === 'admin'
                    return (
                      <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm',
                            mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md border border-line-2 bg-white text-ink',
                          )}
                        >
                          <span className="sr-only">{mine ? 'Admin' : active.userName}: </span>
                          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>
                          <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-ink-3')}>{dateTime(message.at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="shrink-0 border-t border-line-2 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="hidden text-xs font-medium text-ink-3 sm:inline">Tayyor javoblar:</span>
                    <div className="min-w-0 flex-1 sm:max-w-xs">
                      <Select
                        aria-label="Tayyor javoblar"
                        value=""
                        onChange={(event) => {
                          const faq = faqReplies.find((item) => item.id === event.target.value)
                          if (faq) setReply(faq.text)
                        }}
                        className="min-h-11 text-base sm:text-xs"
                      >
                        <option value="">Tayyor javob tanlang...</option>
                        {faqReplies.map((faq) => <option key={faq.id} value={faq.id}>{faq.label}</option>)}
                      </Select>
                    </div>
                    <span className="ml-auto hidden text-[11px] text-ink-3 sm:inline">Ctrl / ⌘ + Enter</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <Textarea
                      aria-label="Javob matni"
                      className="min-h-[64px] resize-none text-base sm:text-sm"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={2}
                      placeholder="Javobingizni yozing..."
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault()
                          sendReply()
                        }
                      }}
                    />
                    <Button onClick={sendReply} aria-label="Javob yuborish" className="min-h-11 min-w-11 shrink-0">
                      <Send className="h-4 w-4" />
                      <span className="max-[420px]:hidden">Yuborish</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
