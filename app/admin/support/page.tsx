'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, ExternalLink, LifeBuoy, MessageCircle, Send, UserRound } from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  EmptyState,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, relative } from '@/lib/format'
import { faqReplies } from '@/lib/mock'
import type { Ticket, TicketPriority, TicketStatus } from '@/lib/types'
import Link from 'next/link'

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
      high: tickets.filter((ticket) => ticket.priority === 'high').length,
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
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Support <Badge tone={counts.new ? 'danger' : 'brand'}>{counts.new} yangi</Badge>
          </span>
        }
        subtitle="Foydalanuvchilar murojaatlari, chat va Telegram integratsiyasi"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Support' }]}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Yangi murojaatlar" value={counts.new} hint="Javob kutmoqda" icon={<LifeBuoy className="h-5 w-5" />} iconClass="bg-info-bg text-info" />
        <StatCard label="Jarayonda" value={counts.progress} hint="Admin javob yozmoqda" icon={<MessageCircle className="h-5 w-5" />} iconClass="bg-warning-bg text-warning" />
        <StatCard label="Yuqori muhimlik" value={counts.high} hint="Tez javob talab qiladi" icon={<UserRound className="h-5 w-5" />} iconClass="bg-error-bg text-error" />
        <StatCard label="Yopilgan" value={counts.closed} hint={`Jami ${counts.all} murojaat`} icon={<ChevronRight className="h-5 w-5" />} />
      </div>

      <div className="card p-0">
        <div className="flex flex-col gap-3 border-b border-line-2 p-4 lg:flex-row lg:flex-wrap lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Mavzu, foydalanuvchi yoki Telegram..." className="lg:max-w-xs" />
          <div className="overflow-x-auto no-scrollbar">
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Barchasi', count: counts.all },
                { value: 'new', label: 'Yangi', count: counts.new },
                { value: 'progress', label: 'Jarayonda', count: counts.progress },
                { value: 'closed', label: 'Yopildi', count: counts.closed },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select value={priority} onChange={(event) => setPriority(event.target.value as 'all' | TicketPriority)} className="min-w-[135px]">
              <option value="all">Barcha muhimlik</option>
              <option value="high">Yuqori</option>
              <option value="medium">O'rta</option>
              <option value="low">Past</option>
            </Select>
            <Select value={period} onChange={(event) => setPeriod(event.target.value)} className="min-w-[135px]">
              <option value="7">Oxirgi 7 kun</option>
              <option value="30">Oxirgi 30 kun</option>
              <option value="all">Barcha davr</option>
            </Select>
          </div>
          <span className="text-[12px] text-ink-3 lg:ml-auto">Topildi: <span className="font-semibold text-ink">{filtered.length}</span> ta</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<LifeBuoy className="h-6 w-6" />} title="Murojaat topilmadi" text="Tanlangan filtrlar bo'yicha murojaatlar yo'q." />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                    <th className="px-4 py-3 font-semibold">Mavzu</th>
                    <th className="px-4 py-3 font-semibold">Muhimlik</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Vaqt</th>
                    <th className="px-4 py-3 font-semibold">Admin</th>
                    <th className="px-4 py-3 text-right font-semibold">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {filtered.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="cursor-pointer transition hover:bg-canvas"
                      onClick={() => setActiveId(ticket.id)}
                    >
                      <td className="px-4 py-3 font-mono text-[11.5px] font-semibold text-ink-3">{ticket.id.replace('TICKET-', '#')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={ticket.userName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{ticket.userName}</p>
                            <p className="truncate text-[11px] text-ink-3">{ticket.telegram}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate font-medium text-ink">{ticket.subject}</p>
                        <p className="truncate text-[11.5px] text-ink-3">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                      </td>
                      <td className="px-4 py-3"><Badge tone={PRIORITY[ticket.priority].tone}>{PRIORITY[ticket.priority].label}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={STATUS[ticket.status].tone}>{STATUS[ticket.status].label}</Badge></td>
                      <td className="px-4 py-3 text-ink-3">{relative(ticket.updatedAt)}</td>
                      <td className="px-4 py-3 text-ink-2">{ticket.admin || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); setActiveId(ticket.id) }}>
                            Ochish <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line-2 md:hidden">
              {filtered.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(ticket.id)}
                    className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-canvas"
                  >
                    <Avatar name={ticket.userName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{ticket.subject}</p>
                        <Badge tone={STATUS[ticket.status].tone}>{STATUS[ticket.status].label}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-3">{ticket.userName} · {ticket.telegram}</p>
                      <p className="mt-1 line-clamp-2 text-[11.5px] text-ink-2">{ticket.messages[ticket.messages.length - 1]?.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                        <Badge tone={PRIORITY[ticket.priority].tone}>{PRIORITY[ticket.priority].label}</Badge>
                        <span>{relative(ticket.updatedAt)}</span>
                        <span>· {ticket.admin || 'Admin yo‘q'}</span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Drawer
        open={active !== null}
        onClose={() => setActiveId(null)}
        title={active?.subject ?? 'Murojaat'}
        subtitle={active ? `${active.id} · ${active.userName}` : undefined}
        widthClass="sm:w-[720px]"
        footer={
          active ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/users/${active.userId}`} className="text-[12px] font-semibold text-brand-text hover:underline">
                Profilni ochish
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={closeTicket} disabled={active.status === 'closed'}>
                  {active.status === 'closed' ? 'Yopilgan' : 'Murojaatni yopish'}
                </Button>
                <a
                  href={`https://t.me/${active.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white transition hover:bg-brand-hover"
                >
                  Telegram'ga ulash <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : null
        }
      >
        {active ? (
          <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
            <div className="space-y-4">
              <div className="rounded-xl border border-line-2 bg-canvas p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={active.userName} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{active.userName}</p>
                    <Link href={`/admin/users/${active.userId}`} className="text-[11.5px] font-medium text-brand-text hover:underline">
                      Profil linki
                    </Link>
                  </div>
                </div>
              </div>

              <dl className="space-y-3 text-[12.5px]">
                <div>
                  <dt className="text-ink-3">Telegram</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{active.telegram}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Sana</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{dateTime(active.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Oxirgi faollik</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{relative(active.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="mb-1.5 text-ink-3">Muhimlik</dt>
                  <dd>
                    <Select
                      value={active.priority}
                      onChange={(event) => {
                        updateTicket(active.id, { priority: event.target.value as TicketPriority })
                        toast({ title: 'Muhimlik o‘zgartirildi', tone: 'success' })
                      }}
                    >
                      <option value="high">Yuqori</option>
                      <option value="medium">O'rta</option>
                      <option value="low">Past</option>
                    </Select>
                  </dd>
                </div>
                <div>
                  <dt className="mb-1.5 text-ink-3">Status</dt>
                  <dd>
                    <Select
                      value={active.status}
                      onChange={(event) => {
                        updateTicket(active.id, { status: event.target.value as TicketStatus })
                        toast({ title: 'Status o‘zgartirildi', tone: 'success' })
                      }}
                    >
                      <option value="new">Yangi</option>
                      <option value="progress">Jarayonda</option>
                      <option value="closed">Yopildi</option>
                    </Select>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex min-h-[380px] flex-col rounded-xl border border-line-2">
              <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 p-4" style={{ maxHeight: 420 }}>
                {active.messages.map((message) => {
                  const mine = message.from === 'admin'
                  return (
                    <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm', mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-white text-ink')}>
                        <p>{message.text}</p>
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-ink-3')}>{dateTime(message.at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-line-2 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-semibold text-ink-3">Tayyor javoblar:</span>
                  <Select
                    value=""
                    onChange={(event) => {
                      const faq = faqReplies.find((item) => item.id === event.target.value)
                      if (faq) setReply(faq.text)
                    }}
                    className="h-8 flex-1 py-1 text-[12px]"
                  >
                    <option value="">FAQ tanlang...</option>
                    {faqReplies.map((faq) => (
                      <option key={faq.id} value={faq.id}>{faq.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Textarea
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
                  <Button onClick={sendReply} className="h-[42px] shrink-0">
                    <Send className="h-4 w-4" /> Yuborish
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </PageTransition>
  )
}
