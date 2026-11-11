'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  Send,
} from 'lucide-react'
import Link from 'next/link'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, number, relative } from '@/lib/format'
import type { TicketStatus } from '@/lib/types'

const STATUS: Record<TicketStatus, { label: string; tone: 'info' | 'warning' | 'gray' }> = {
  new: { label: 'Yangi', tone: 'info' },
  progress: { label: 'Jarayonda', tone: 'warning' },
  closed: { label: 'Yopildi', tone: 'gray' },
}

export default function SupportPage() {
  const tickets = useAppStore((state) => state.tickets)
  const replyTicket = useAppStore((state) => state.replyTicket)
  const updateTicket = useAppStore((state) => state.updateTicket)
  const { toast } = useToast()

  const [status, setStatus] = useState<'all' | TicketStatus>('all')
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const active = tickets.find((ticket) => ticket.id === activeId) ?? null
  const chatRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets
      .filter((ticket) => {
        if (status !== 'all' && ticket.status !== status) return false
        if (term && !`${ticket.subject} ${ticket.userName} ${ticket.telegram}`.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }, [tickets, status, search])

  const counts = useMemo(
    () => ({
      all: tickets.length,
      new: tickets.filter((ticket) => ticket.status === 'new').length,
      progress: tickets.filter((ticket) => ticket.status === 'progress').length,
      closed: tickets.filter((ticket) => ticket.status === 'closed').length,
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
      <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-[-2px] [&_button]:focus-visible:outline-brand">
        <div className={cn('shrink-0 items-center gap-2', active ? 'hidden xl:flex' : 'flex')}>
          <h1 className="h2 truncate text-ink">Support</h1>
          {counts.new ? <Badge tone="danger">{number(counts.new)} yangi</Badge> : null}
          <span className="ml-auto hidden text-[11px] text-ink-3 sm:block">
            {number(counts.all)} murojaat · {number(counts.progress)} jarayonda
          </span>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
          <div
            role="region"
            aria-label="Murojaatlar ro‘yxati"
            className={cn(
              'min-h-0 w-full flex-col xl:w-[340px] xl:shrink-0 xl:border-r xl:border-line-2',
              activeId ? 'hidden xl:flex' : 'flex',
            )}
          >
            <div className="shrink-0 space-y-2 border-b border-line-2 p-2.5">
              <SearchInput value={search} onChange={setSearch} placeholder="Mavzu, ism yoki Telegram..." />
              <div role="group" aria-label="Murojaat holati" className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
                {([
                  { value: 'all', label: 'Barchasi', count: counts.all },
                  { value: 'new', label: 'Yangi', count: counts.new },
                  { value: 'progress', label: 'Jarayonda', count: counts.progress },
                  { value: 'closed', label: 'Yopildi', count: counts.closed },
                ] as const).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={status === item.value}
                    onClick={() => setStatus(item.value)}
                    className={cn(
                      'min-w-0 rounded-md px-1 py-1.5 text-[11px] font-semibold transition',
                      status === item.value ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink',
                    )}
                  >
                    <span className="block truncate">{item.label}</span>
                    <span className="block text-[10px] tabular opacity-70">{number(item.count)}</span>
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="grid min-h-0 flex-1 place-items-center p-4">
                <EmptyState icon={<LifeBuoy className="h-5 w-5" />} title="Murojaat topilmadi" text="Qidiruv yoki filtrni o‘zgartiring." />
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
                        selected ? 'border-brand bg-brand-soft/50' : 'border-transparent hover:bg-canvas',
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
                        <span className="ml-auto shrink-0">
                          <Badge tone={STATUS[ticket.status].tone}>{STATUS[ticket.status].label}</Badge>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            <div role="status" className="shrink-0 border-t border-line-2 px-3 py-1.5 text-[11px] font-medium text-ink-3">
              {number(filtered.length)} ta murojaat
            </div>
          </div>

          <div role="region" aria-label="Murojaat suhbati" className={cn('min-h-0 min-w-0 flex-1 flex-col', activeId ? 'flex' : 'hidden xl:flex')}>
            {!active ? (
              <div className="grid min-h-0 flex-1 place-items-center p-4">
                <EmptyState
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Murojaat tanlang"
                  text="Chapdan birorta murojaat oching — suhbat shu yerda ko‘rinadi."
                />
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-line-2 px-3 py-2 sm:px-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line-2 text-ink-3 transition hover:bg-canvas xl:hidden"
                      aria-label="Orqaga"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{active.subject}</p>
                      <p className="truncate font-mono text-[10px] text-ink-3">
                        {active.id} · {dateTime(active.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label="Murojaatni yopish"
                      className="min-h-9"
                      onClick={closeTicket}
                      disabled={active.status === 'closed'}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="max-[420px]:hidden">{active.status === 'closed' ? 'Yopilgan' : 'Yopish'}</span>
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar name={active.userName} size="sm" />
                      <Link href={`/admin/users/${active.userId}`} className="font-semibold text-brand-text hover:underline">
                        {active.userName}
                      </Link>
                    </span>
                    <span>{active.telegram}</span>
                    <Badge tone={STATUS[active.status].tone}>{STATUS[active.status].label}</Badge>
                    <a
                      href={`https://t.me/${active.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto inline-flex items-center gap-1 font-semibold text-info hover:underline"
                    >
                      Telegram <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div ref={chatRef} role="log" aria-label="Suhbat xabarlari" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-canvas/60 p-3 [contain:paint] sm:p-4">
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

                <div className="shrink-0 border-t border-line-2 p-2.5 sm:p-3">
                  <div className="flex items-end gap-2">
                    <Textarea
                      aria-label="Javob matni"
                      className="min-h-[58px] resize-none text-base sm:text-sm"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={2}
                      placeholder="Javobingizni yozing... (Ctrl / ⌘ + Enter — yuborish)"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault()
                          sendReply()
                        }
                      }}
                    />
                    <Button onClick={sendReply} aria-label="Javob yuborish" className="min-h-10 min-w-10 shrink-0">
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
