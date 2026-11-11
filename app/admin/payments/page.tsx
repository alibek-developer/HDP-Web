'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  Receipt,
  RotateCcw,
  Wallet,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Pagination,
  SearchInput,
  SectionCard,
  Segmented,
  Select,
  Textarea,
  cn,
  useToast,
  type BadgeTone,
} from '@/components/ui'
import { CumulativeChart, DailyRevenueChart, Sparkline } from '@/components/charts'
import { useAppStore } from '@/lib/store'
import { expiringThisMonth, expiringThisWeek } from '@/lib/mock'
import {
  MOCK_NOW,
  date,
  dateInput,
  dateTime,
  dateLong,
  downloadCsv,
  money,
  number,
  percent,
  relative,
} from '@/lib/format'
import type { PackageId, PaymentMethod, Transaction, TransactionStatus } from '@/lib/types'

const PAGE_SIZE = 20

const PACKAGE_LABEL: Record<PackageId, string> = {
  '1m': '1 oylik Pro',
  '3m': '3 oylik Pro',
  '1y': '1 yillik Pro',
}

const METHOD: Record<PaymentMethod, { label: string; className: string }> = {
  payme: { label: 'Payme', className: 'bg-[#e6f7f1] text-[#0f766e]' },
  click: { label: 'Click', className: 'bg-[#e8f0fe] text-[#1d4ed8]' },
  uzum: { label: 'Uzum', className: 'bg-[#ede9fe] text-[#6d28d9]' },
  uzcard: { label: 'Uzcard', className: 'bg-[#fef3c7] text-[#b45309]' },
}

const STATUS: Record<TransactionStatus, { label: string; tone: BadgeTone }> = {
  success: { label: 'Muvaffaqiyatli', tone: 'success' },
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  cancelled: { label: 'Bekor qilindi', tone: 'danger' },
  refunded: { label: 'Qaytarilgan', tone: 'gray' },
}

type PaymentTab = 'transactions' | 'revenue'

const TABS: Array<{ value: PaymentTab; label: string }> = [
  { value: 'transactions', label: 'Tranzaksiyalar' },
  { value: 'revenue', label: 'Daromad' },
]

export default function PaymentsPage() {
  const transactions = useAppStore((state) => state.transactions)
  const users = useAppStore((state) => state.users)
  const refundTransaction = useAppStore((state) => state.refundTransaction)
  const sendNotification = useAppStore((state) => state.sendNotification)
  const { toast } = useToast()

  const [tab, setTab] = useState<PaymentTab>('transactions')
  const [status, setStatus] = useState<'all' | TransactionStatus>('all')
  const [method, setMethod] = useState<'all' | PaymentMethod>('all')
  const [packageId, setPackageId] = useState<'all' | PackageId>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [amountFrom, setAmountFrom] = useState('')
  const [amountTo, setAmountTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null)
  const [expiryOpen, setExpiryOpen] = useState(false)
  const [push, setPush] = useState({
    title: 'Pro obunangiz tugamoqda',
    body: "Hurmatli foydalanuvchi, Pro obunangiz 7 kun ichida tugaydi. Davom ettirish uchun ilovaga kiring.",
    link: 'https://hdp.uz/pro',
    audience: 'pro',
    type: 'both',
  })

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length }
    for (const transaction of transactions) {
      counts[transaction.status] = (counts[transaction.status] ?? 0) + 1
    }
    return counts
  }, [transactions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const min = amountFrom ? Number(amountFrom) : null
    const max = amountTo ? Number(amountTo) : null
    return transactions
      .filter((transaction) => {
        if (status !== 'all' && transaction.status !== status) return false
        if (method !== 'all' && transaction.method !== method) return false
        if (packageId !== 'all' && transaction.packageId !== packageId) return false
        const day = dateInput(transaction.createdAt)
        if (from && day < from) return false
        if (to && day > to) return false
        if (min !== null && Number.isFinite(min) && transaction.amount < min) return false
        if (max !== null && Number.isFinite(max) && transaction.amount > max) return false
        if (term) {
          const haystack = `${transaction.id} ${transaction.userName} ${transaction.providerTxId}`.toLowerCase()
          if (!haystack.includes(term)) return false
        }
        return true
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [transactions, status, method, packageId, from, to, amountFrom, amountTo, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const filteredSum = filtered
    .filter((transaction) => transaction.status === 'success')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const pendingCount = filtered.filter((transaction) => transaction.status === 'pending').length
  const refundedCount = filtered.filter((transaction) => transaction.status === 'refunded').length

  const resetFilters = () => {
    setStatus('all')
    setMethod('all')
    setPackageId('all')
    setFrom('')
    setTo('')
    setAmountFrom('')
    setAmountTo('')
    setSearch('')
    setPage(1)
  }

  const finance = useMemo(() => {
    const sumFor = (offset: number) => {
      const anchor = new Date(MOCK_NOW.getFullYear(), MOCK_NOW.getMonth() + offset, 1)
      return transactions
        .filter((transaction) => transaction.status === 'success')
        .filter((transaction) => {
          const at = new Date(transaction.createdAt)
          return at.getFullYear() === anchor.getFullYear() && at.getMonth() === anchor.getMonth()
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    }
    const current = sumFor(0)
    const previous = sumFor(-1)
    return {
      current,
      previous,
      diff: current - previous,
      growth: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    }
  }, [transactions])

  const daily = useMemo(() => {
    const year = MOCK_NOW.getFullYear()
    const month = MOCK_NOW.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    const values = Array.from({ length: days }, (_, index) => ({
      label: String(index + 1),
      value: 0,
    }))
    for (const transaction of transactions) {
      if (transaction.status !== 'success') continue
      const at = new Date(transaction.createdAt)
      if (at.getFullYear() !== year || at.getMonth() !== month) continue
      values[at.getDate() - 1].value += transaction.amount
    }
    return values
  }, [transactions])

  const cumulative = useMemo(() => {
    let total = 0
    return daily.map((point) => {
      total += point.value
      return { label: point.label, value: total }
    })
  }, [daily])

  const expiringUsers = useMemo(() => {
    const limit = MOCK_NOW.getTime() + 7 * 86_400_000
    return users
      .filter(
        (user) =>
          user.plan === 'pro' &&
          user.planEndsAt !== null &&
          new Date(user.planEndsAt).getTime() <= limit,
      )
      .sort((left, right) => (left.planEndsAt ?? '').localeCompare(right.planEndsAt ?? ''))
      .slice(0, 5)
  }, [users])

  const exportCsv = () => {
    downloadCsv(`hdp-tolovlar-${dateInput(MOCK_NOW)}.csv`, [
      ['ID', 'Foydalanuvchi', 'Paket', 'Summa', 'Usul', 'Sana', 'Status', 'Tranzaksiya ID'],
      ...filtered.map((transaction) => [
        transaction.id,
        transaction.userName,
        PACKAGE_LABEL[transaction.packageId],
        transaction.amount,
        METHOD[transaction.method].label,
        dateTime(transaction.createdAt),
        STATUS[transaction.status].label,
        transaction.providerTxId,
      ]),
    ])
    toast({ title: 'Eksport tayyor', description: `${filtered.length} ta tranzaksiya CSV faylga saqlandi.` })
  }

  const confirmRefund = () => {
    if (!refundTarget) return
    refundTransaction(refundTarget.id)
    toast({
      title: 'To\'lov qaytarildi',
      description: `${refundTarget.id} — ${money(refundTarget.amount)} qaytarilgan deb belgilandi.`,
    })
    setRefundTarget(null)
    setDetail(null)
  }

  const sendExpiryNotification = () => {
    if (!push.title.trim() || !push.body.trim()) {
      toast({ title: 'Sarlavha va matnni kiriting', tone: 'warning' })
      return
    }
    sendNotification({
      title: push.title.trim(),
      body: push.body.trim(),
      link: push.link.trim(),
      audience: push.audience as 'all' | 'pro' | 'free' | 'custom',
      type: push.type as 'push' | 'inapp' | 'both',
      recipients: expiringThisWeek,
      scheduled: false,
    })
    toast({
      title: 'Bildirishnoma yuborildi',
      description: `${number(expiringThisWeek)} ta Pro foydalanuvchiga yuborildi.`,
    })
    setExpiryOpen(false)
  }

  const statusBadge = (value: TransactionStatus) => {
    if (value === 'pending') {
      return (
        <Badge tone="warning">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-warning" />
          </span>
          {STATUS[value].label}
        </Badge>
      )
    }
    return <Badge tone={STATUS[value].tone}>{STATUS[value].label}</Badge>
  }

  const methodBadge = (value: PaymentMethod) => (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${METHOD[value].className}`}>
      {METHOD[value].label}
    </span>
  )

  const rowActions = (transaction: Transaction) => (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="secondary" onClick={() => setDetail(transaction)}>
        <Eye className="h-3.5 w-3.5" /> Ko'rish
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={transaction.status !== 'success'}
        onClick={() => {
          setDetail(null)
          setRefundTarget(transaction)
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Qaytarish
      </Button>
    </div>
  )

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3.5 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
              <span className="text-ink-3">Dashboard</span>
              <span className="text-placeholder">/</span>
              <span className="text-ink">To'lovlar</span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <h1 className="h2 truncate text-ink">To'lovlar</h1>
              <Badge tone="gray">{number(transactions.length)} ta</Badge>
            </div>
            <p className="mt-0.5 hidden truncate text-[12px] text-ink-3 sm:block">
              Tranzaksiyalar, qaytarishlar va daromad ko'rsatkichlari
            </p>
          </div>
          <Button variant="secondary" onClick={exportCsv} className="h-10 sm:h-11">
            <Download className="h-4 w-4" />
            <span className="max-[360px]:hidden">Eksport CSV</span>
          </Button>
        </div>

        <div className="flex shrink-0 gap-4 border-b border-line" role="tablist" aria-label="To'lovlar bo'limlari">
          {TABS.map((item) => {
            const active = tab === item.value
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.value)}
                className={cn(
                  'relative h-9 text-[12.5px] font-semibold transition',
                  active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                {item.label}
                {item.value === 'transactions' ? (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-ink-3">
                    {number(transactions.length)}
                  </span>
                ) : null}
                <span
                  className={cn(
                    'absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            )
          })}
        </div>

        {tab === 'transactions' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3.5">
            <div className="flex shrink-0 flex-col gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={search}
                  onChange={(value) => {
                    setSearch(value)
                    setPage(1)
                  }}
                  placeholder="ID, foydalanuvchi yoki tranzaksiya ID..."
                  className="min-w-0 flex-1"
                />
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Tozalash
                </Button>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <Segmented
                  className="w-full overflow-x-auto"
                  value={status}
                  onChange={(value) => {
                    setStatus(value)
                    setPage(1)
                  }}
                  options={[
                    { value: 'all', label: 'Barchasi', count: statusCounts.all ?? 0 },
                    { value: 'success', label: 'Muvaffaqiyatli', count: statusCounts.success ?? 0 },
                    { value: 'pending', label: 'Kutilmoqda', count: statusCounts.pending ?? 0 },
                    { value: 'cancelled', label: 'Bekor qilindi', count: statusCounts.cancelled ?? 0 },
                    { value: 'refunded', label: 'Qaytarilgan', count: statusCounts.refunded ?? 0 },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <Field label="Usul">
                  <Select
                    value={method}
                    onChange={(event) => {
                      setMethod(event.target.value as 'all' | PaymentMethod)
                      setPage(1)
                    }}
                  >
                    <option value="all">Barchasi</option>
                    {(Object.keys(METHOD) as PaymentMethod[]).map((key) => (
                      <option key={key} value={key}>
                        {METHOD[key].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Paket">
                  <Select
                    value={packageId}
                    onChange={(event) => {
                      setPackageId(event.target.value as 'all' | PackageId)
                      setPage(1)
                    }}
                  >
                    <option value="all">Barchasi</option>
                    <option value="1m">1 oy</option>
                    <option value="3m">3 oy</option>
                    <option value="1y">1 yil</option>
                  </Select>
                </Field>
                <div
                  className={cn(
                    'col-span-2 grid grid-cols-2 gap-2 sm:contents',
                    filtersOpen ? '' : 'hidden',
                  )}
                >
                  <Field label="Dan">
                    <Input
                      type="date"
                      value={from}
                      max={to || undefined}
                      onChange={(event) => {
                        setFrom(event.target.value)
                        setPage(1)
                      }}
                    />
                  </Field>
                  <Field label="Gacha">
                    <Input
                      type="date"
                      value={to}
                      min={from || undefined}
                      onChange={(event) => {
                        setTo(event.target.value)
                        setPage(1)
                      }}
                    />
                  </Field>
                  <Field label="Miqdor (dan)">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="0"
                      value={amountFrom}
                      onChange={(event) => {
                        setAmountFrom(event.target.value)
                        setPage(1)
                      }}
                    />
                  </Field>
                  <Field label="Miqdor (gacha)">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="500 000"
                      value={amountTo}
                      onChange={(event) => {
                        setAmountTo(event.target.value)
                        setPage(1)
                      }}
                    />
                  </Field>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                className="inline-flex h-8 items-center gap-1 self-start text-[11.5px] font-semibold text-ink-3 transition hover:text-ink sm:hidden"
              >
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', filtersOpen && 'rotate-180')}
                />
                Sana va miqdor bo'yicha filtr
              </button>
            </div>

            <div className="grid shrink-0 grid-cols-2 divide-x divide-line-2 overflow-hidden rounded-[14px] border border-line bg-white shadow-card sm:grid-cols-4">
              {[
                { label: 'Topildi', value: number(filtered.length), tone: 'text-ink' },
                { label: 'Muvaffaqiyatli summa', value: money(filteredSum), tone: 'text-ink' },
                { label: 'Kutilmoqda', value: number(pendingCount), tone: 'text-warning' },
                { label: 'Qaytarilgan', value: number(refundedCount), tone: 'text-ink-3' },
              ].map((cell) => (
                <div key={cell.label} className="min-w-0 px-3 py-2">
                  <p className="truncate text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                    {cell.label}
                  </p>
                  <p className={cn('mt-0.5 truncate text-[16px] font-geist leading-none tabular-nums', cell.tone)}>
                    {cell.value}
                  </p>
                </div>
              ))}
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              <div className="hidden min-h-0 flex-1 overflow-y-auto [contain:paint] md:block">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-line-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                      <th className="px-4 py-2 font-semibold">ID</th>
                      <th className="py-2 pr-3 font-semibold">Foydalanuvchi</th>
                      <th className="py-2 pr-3 font-semibold">Paket</th>
                      <th className="py-2 pr-3 text-right font-semibold">Summa</th>
                      <th className="py-2 pr-3 font-semibold">Usul</th>
                      <th className="py-2 pr-3 font-semibold">Sana</th>
                      <th className="py-2 pr-3 font-semibold">Status</th>
                      <th className="px-4 py-2 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {rows.map((transaction) => (
                      <tr key={transaction.id} className="text-[12.5px] transition hover:bg-canvas">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-[10.5px] text-ink-3">{transaction.id}</span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="flex items-center gap-2">
                            <Avatar name={transaction.userName} size="sm" tone="bg-brand-container text-brand-active" />
                            <span className="truncate font-semibold text-ink">{transaction.userName}</span>
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-2">{PACKAGE_LABEL[transaction.packageId]}</td>
                        <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-ink">
                          {money(transaction.amount)}
                        </td>
                        <td className="py-2.5 pr-3">{methodBadge(transaction.method)}</td>
                        <td className="py-2.5 pr-3">
                          <p className="text-ink-2">{date(transaction.createdAt)}</p>
                          <p className="text-[10.5px] text-ink-3">{relative(transaction.createdAt)}</p>
                        </td>
                        <td className="py-2.5 pr-3">{statusBadge(transaction.status)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">{rowActions(transaction)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[13px] text-ink-3">
                    Tanlangan filtrlar bo'yicha tranzaksiya topilmadi.
                  </p>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint] md:hidden">
                {rows.map((transaction) => (
                  <div key={transaction.id} className="space-y-2 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-ink-3">{transaction.id}</p>
                        <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink">
                          {transaction.userName}
                        </p>
                        <p className="text-[10.5px] text-ink-3">
                          {PACKAGE_LABEL[transaction.packageId]} · {dateTime(transaction.createdAt)}
                        </p>
                      </div>
                      {statusBadge(transaction.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {methodBadge(transaction.method)}
                      <span className="text-[13px] font-bold tabular-nums text-ink">
                        {money(transaction.amount)}
                      </span>
                    </div>
                    {rowActions(transaction)}
                  </div>
                ))}
                {rows.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[13px] text-ink-3">
                    Tanlangan filtrlar bo'yicha tranzaksiya topilmadi.
                  </p>
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-line-2 px-3 py-2">
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
                  onChange={setPage}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  label="tranzaksiya"
                />
              </footer>
            </section>
          </div>
        ) : null}

        {tab === 'revenue' ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [contain:paint]">
            <div className="space-y-2.5 sm:space-y-3.5">
              <section className="overflow-hidden rounded-[16px] border border-line bg-white shadow-card">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                      <Wallet className="h-3 w-3" /> Bu oy daromad · {dateLong(MOCK_NOW)}
                    </p>
                    <p className="mt-1.5 font-geist text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink sm:text-[38px]">
                      {money(finance.current)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-3">
                      <span>
                        O'tgan oy:{' '}
                        <span className="font-semibold text-ink-2">{money(finance.previous)}</span>
                      </span>
                      <span>
                        Farq:{' '}
                        <span className={cn('font-semibold', finance.diff >= 0 ? 'text-success' : 'text-error')}>
                          {finance.diff >= 0 ? '+' : ''}
                          {money(finance.diff)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-[12px] font-bold text-success">
                      <ArrowUpRight className="h-3.5 w-3.5" /> +{percent(finance.growth, 1)}
                    </span>
                    <div className="w-32 sm:w-40">
                      <Sparkline data={cumulative.map((point) => point.value)} color="#16a34a" height={40} />
                      <p className="mt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                        Oy kumulativi
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-2.5 sm:gap-3.5 xl:grid-cols-2">
                <SectionCard title="Kun bo'yicha daromad" subtitle="Joriy oyning har bir kuni">
                  <DailyRevenueChart data={daily} />
                </SectionCard>
                <SectionCard title="Kumulativ daromad" subtitle="Oy boshidan jami yig'ilgan summa">
                  <CumulativeChart data={cumulative} />
                </SectionCard>
              </div>

              <div className="grid gap-2.5 sm:gap-3.5 xl:grid-cols-3">
                <SectionCard
                  className="xl:col-span-2"
                  title="Yaqin tugaydigan obunalar"
                  subtitle="Pro obunalar muddati haqida ogohlantirish"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[12px] bg-warning-bg/60 px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#92400e]">
                        Bu hafta
                      </p>
                      <p className="mt-1 font-display text-[20px] font-extrabold tabular-nums text-ink">
                        {number(expiringThisWeek)}
                      </p>
                      <p className="text-[10.5px] text-ink-3">7 kun ichida tugaydi</p>
                    </div>
                    <div className="rounded-[12px] bg-canvas px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                        Keyingi 30 kun
                      </p>
                      <p className="mt-1 font-display text-[20px] font-extrabold tabular-nums text-ink">
                        {number(expiringThisMonth)}
                      </p>
                      <p className="text-[10.5px] text-ink-3">30 kun ichida tugaydi</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="mb-1 text-[11px] font-semibold text-ink-2">Bu hafta tugaydiganlar</p>
                    <ul className="divide-y divide-line-2">
                      {expiringUsers.map((user) => (
                        <li key={user.id} className="flex items-center gap-2.5 py-2">
                          <Avatar name={user.name} size="sm" tone={user.tone} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-semibold text-ink">{user.name}</p>
                            <p className="truncate text-[10.5px] text-ink-3">
                              {user.planPackage ? PACKAGE_LABEL[user.planPackage] : 'Pro'} ·{' '}
                              {user.planEndsAt ? date(user.planEndsAt) : '—'}
                            </p>
                          </div>
                          <Badge tone="warning">{user.planEndsAt ? relative(user.planEndsAt) : '—'}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionCard>

                <Card className="flex flex-col justify-between gap-3 bg-gradient-to-br from-brand-soft to-white">
                  <div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand shadow-card">
                      <BellRing className="h-5 w-5" />
                    </span>
                    <p className="h4 mt-2.5 text-ink">Obuna tugashi eslatmasi</p>
                    <p className="mt-1 text-[12px] text-ink-3">
                      Bu hafta tugaydigan {number(expiringThisWeek)} ta Pro obunachiga push va ilova
                      ichida bildirishnoma yuboring.
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => setExpiryOpen(true)}>
                    <BellRing className="h-4 w-4" /> Bildirishnoma yuborish
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        <Modal
          open={detail !== null && refundTarget === null}
          onClose={() => setDetail(null)}
          title="Tranzaksiya tafsiloti"
          description={detail?.id}
          footer={
            detail ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    toast({
                      title: 'Chek yuborildi',
                      description: `${detail.userName} foydalanuvchisiga chek Telegram orqali yuborildi.`,
                    })
                  }}
                >
                  <Receipt className="h-4 w-4" /> Chek yuborish
                </Button>
                <Button
                  variant="destructive"
                  disabled={detail.status !== 'success'}
                  onClick={() => {
                    setRefundTarget(detail)
                    setDetail(null)
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Qaytarish
                </Button>
              </>
            ) : null
          }
        >
          {detail ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[12px] border border-line-2 bg-canvas px-3 py-2.5">
                <Avatar name={detail.userName} tone="bg-brand-container text-brand-active" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{detail.userName}</p>
                  <p className="text-[11px] text-ink-3">{PACKAGE_LABEL[detail.packageId]}</p>
                </div>
                {statusBadge(detail.status)}
              </div>

              <dl className="divide-y divide-line-2 text-[12.5px]">
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">ID</dt>
                  <dd className="font-mono text-[11px] font-semibold text-ink">{detail.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">Paket</dt>
                  <dd className="font-semibold text-ink">{PACKAGE_LABEL[detail.packageId]}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">Summa</dt>
                  <dd className="font-semibold tabular-nums text-ink">{money(detail.amount)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">To'lov usuli</dt>
                  <dd>{methodBadge(detail.method)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">Tranzaksiya ID</dt>
                  <dd className="font-mono text-[11px] font-semibold text-ink">{detail.providerTxId}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">Sana</dt>
                  <dd className="font-semibold text-ink">{dateTime(detail.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-3">Status</dt>
                  <dd>{statusBadge(detail.status)}</dd>
                </div>
              </dl>

              <div className="flex items-start gap-2 rounded-[10px] bg-canvas px-3 py-2 text-[11px] text-ink-3">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                To'lov {relative(detail.createdAt)} amalga oshirilgan.
              </div>
            </div>
          ) : null}
        </Modal>

        <Modal
          open={refundTarget !== null}
          onClose={() => setRefundTarget(null)}
          title="To'lovni qaytarish"
          description={refundTarget ? `${refundTarget.id} · ${refundTarget.userName}` : undefined}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setRefundTarget(null)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={confirmRefund}>
                <RotateCcw className="h-4 w-4" /> Ha, qaytarish
              </Button>
            </>
          }
        >
          {refundTarget ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-[10px] bg-warning-bg px-3 py-2.5 text-[12px] text-[#92400e]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  <span className="font-bold">{money(refundTarget.amount)}</span> foydalanuvchiga
                  qaytariladi va tranzaksiya «Qaytarilgan» holatiga o'tadi. Bu amalni bekor qilish
                  mumkin emas.
                </p>
              </div>
              <p className="text-[12px] text-ink-3">
                Paket:{' '}
                <span className="font-semibold text-ink">{PACKAGE_LABEL[refundTarget.packageId]}</span>{' '}
                · Usul:{' '}
                <span className="font-semibold text-ink">{METHOD[refundTarget.method].label}</span>
              </p>
            </div>
          ) : null}
        </Modal>

        <Modal
          open={expiryOpen}
          onClose={() => setExpiryOpen(false)}
          title="Obuna tugashi eslatmasi"
          description={`${number(expiringThisWeek)} ta Pro obunachiga yuboriladi`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setExpiryOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={sendExpiryNotification}>
                <BellRing className="h-4 w-4" /> Yuborish
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <Field label="Sarlavha" required>
              <Input value={push.title} onChange={(event) => setPush({ ...push, title: event.target.value })} />
            </Field>
            <Field label="Matn" required>
              <Textarea rows={4} value={push.body} onChange={(event) => setPush({ ...push, body: event.target.value })} />
            </Field>
            <Field label="Havola">
              <Input value={push.link} onChange={(event) => setPush({ ...push, link: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Auditoriya">
                <Select value={push.audience} onChange={(event) => setPush({ ...push, audience: event.target.value })}>
                  <option value="pro">Pro obunachilar</option>
                  <option value="all">Barcha foydalanuvchilar</option>
                  <option value="free">Free foydalanuvchilar</option>
                </Select>
              </Field>
              <Field label="Turi">
                <Select value={push.type} onChange={(event) => setPush({ ...push, type: event.target.value })}>
                  <option value="both">Push + ilova ichida</option>
                  <option value="push">Faqat push</option>
                  <option value="inapp">Faqat ilova ichida</option>
                </Select>
              </Field>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  )
}
