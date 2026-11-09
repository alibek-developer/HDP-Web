'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Download,
  Eye,
  Receipt,
  RotateCcw,
  Wallet,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
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
  Tabs,
  Textarea,
  useToast,
  type BadgeTone,
} from '@/components/ui'
import { CumulativeChart, DailyRevenueChart } from '@/components/charts'
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
    toast({ title: 'Eksport tayyor', description: `${filtered.length} ta tranzaksiya CSV faylga saqlandi.`, tone: 'success' })
  }

  const confirmRefund = () => {
    if (!refundTarget) return
    refundTransaction(refundTarget.id)
    toast({
      title: 'To\'lov qaytarildi',
      description: `${refundTarget.id} — ${money(refundTarget.amount)} qaytarilgan deb belgilandi.`,
      tone: 'success',
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
      tone: 'success',
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
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            To'lovlar <Badge tone="brand">{number(transactions.length)} ta</Badge>
          </span>
        }
        subtitle="Tranzaksiyalar, qaytarishlar va daromad ko'rsatkichlari"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: "To'lovlar" }]}
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Eksport CSV
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        items={[
          { value: 'transactions', label: 'Tranzaksiyalar', count: transactions.length },
          { value: 'revenue', label: 'Daromad' },
        ]}
      />

      {tab === 'transactions' ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl border border-line bg-white p-3 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
                placeholder="ID, foydalanuvchi yoki tranzaksiya ID..."
                className="min-w-[220px] flex-1"
              />
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Filtrlarni tozalash
              </Button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <Segmented
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

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-3">
              <span>
                Topildi: <span className="font-semibold text-ink-2">{number(filtered.length)}</span> ta
              </span>
              <span>
                Muvaffaqiyatli summa: <span className="font-semibold text-ink-2">{money(filteredSum)}</span>
              </span>
            </div>
          </div>

          <SectionCard
            title="Tranzaksiyalar"
            subtitle="Barcha to'lovlar va ularning holati"
            bodyClassName="p-0"
          >
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-line-2 bg-canvas/60 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    <th className="px-4 py-2.5 font-semibold">ID</th>
                    <th className="px-4 py-2.5 font-semibold">Foydalanuvchi</th>
                    <th className="px-4 py-2.5 font-semibold">Paket</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Summa</th>
                    <th className="px-4 py-2.5 font-semibold">Usul</th>
                    <th className="px-4 py-2.5 font-semibold">Sana</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {rows.map((transaction) => (
                    <tr key={transaction.id} className="text-[12.5px] transition hover:bg-canvas">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] text-ink-3">{transaction.id}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <Avatar name={transaction.userName} size="sm" tone="bg-brand-container text-brand-active" />
                          <span className="font-semibold text-ink">{transaction.userName}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink-2">{PACKAGE_LABEL[transaction.packageId]}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular text-ink">{money(transaction.amount)}</td>
                      <td className="px-4 py-2.5">{methodBadge(transaction.method)}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-ink-2">{date(transaction.createdAt)}</p>
                        <p className="text-[11px] text-ink-3">{relative(transaction.createdAt)}</p>
                      </td>
                      <td className="px-4 py-2.5">{statusBadge(transaction.status)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end">{rowActions(transaction)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line-2 md:hidden">
              {rows.map((transaction) => (
                <div key={transaction.id} className="space-y-2.5 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10.5px] text-ink-3">{transaction.id}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">{transaction.userName}</p>
                      <p className="text-[11px] text-ink-3">
                        {PACKAGE_LABEL[transaction.packageId]} · {dateTime(transaction.createdAt)}
                      </p>
                    </div>
                    {statusBadge(transaction.status)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {methodBadge(transaction.method)}
                      <span className="text-[13px] font-bold tabular text-ink">{money(transaction.amount)}</span>
                    </div>
                  </div>
                  {rowActions(transaction)}
                </div>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-ink-3">
                Tanlangan filtrlar bo'yicha tranzaksiya topilmadi.
              </p>
            ) : null}

            <div className="border-t border-line-2 px-4 py-3">
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                onChange={setPage}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                label="tranzaksiya"
              />
            </div>
          </SectionCard>
        </div>
      ) : null}

      {tab === 'revenue' ? (
        <div className="space-y-4 sm:space-y-5">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#16a34a] p-5 text-white shadow-brand sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/70">
                  <Wallet className="h-4 w-4" /> Bu oy daromad · {dateLong(MOCK_NOW)}
                </p>
                <p className="mt-2 font-display text-[32px] font-extrabold tracking-[-0.02em] tabular sm:text-[40px]">
                  {money(finance.current)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/80">
                  <span>
                    O'tgan oy: <span className="font-semibold text-white">{money(finance.previous)}</span>
                  </span>
                  <span>
                    Farq:{' '}
                    <span className="font-semibold text-white">
                      {finance.diff >= 0 ? '+' : ''}
                      {money(finance.diff)}
                    </span>
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-bold backdrop-blur">
                <ArrowUpRight className="h-4 w-4" /> +{percent(finance.growth, 1)}
              </span>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Kun bo'yicha daromad" subtitle="Joriy oyning har bir kuni">
              <DailyRevenueChart data={daily} />
            </SectionCard>
            <SectionCard title="Kumulativ daromad" subtitle="Oy boshidan jami yig'ilgan summa">
              <CumulativeChart data={cumulative} />
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title="Yaqin tugaydigan obunalar"
              subtitle="Pro obunalar muddati haqida ogohlantirish"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="bg-warning-bg/60 shadow-none">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#92400e]">Bu hafta</p>
                  <p className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">
                    {number(expiringThisWeek)} obuna
                  </p>
                  <p className="mt-1 text-[11.5px] text-ink-3">7 kun ichida tugaydi</p>
                </Card>
                <Card className="shadow-none">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Keyingi 30 kun</p>
                  <p className="mt-2 font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">
                    {number(expiringThisMonth)} obuna
                  </p>
                  <p className="mt-1 text-[11.5px] text-ink-3">30 kun ichida tugaydi</p>
                </Card>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[12px] font-semibold text-ink-2">Bu hafta tugaydiganlar</p>
                <ul className="divide-y divide-line-2">
                  {expiringUsers.map((user) => (
                    <li key={user.id} className="flex items-center gap-2.5 py-2">
                      <Avatar name={user.name} size="sm" tone={user.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-[11px] text-ink-3">
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

            <Card className="flex flex-col justify-between gap-4 bg-gradient-to-br from-brand-soft to-white">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand shadow-card">
                  <BellRing className="h-5 w-5" />
                </span>
                <p className="h4 mt-3 text-ink">Obuna tugashi eslatmasi</p>
                <p className="mt-1.5 text-[12.5px] text-ink-3">
                  Bu hafta tugaydigan {number(expiringThisWeek)} ta Pro obunachiga push va ilova ichida
                  bildirishnoma yuboring.
                </p>
              </div>
              <Button className="w-full" onClick={() => setExpiryOpen(true)}>
                <BellRing className="h-4 w-4" /> Bildirishnoma yuborish
              </Button>
            </Card>
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
                    tone: 'success',
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
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-line-2 bg-canvas px-3.5 py-3">
              <Avatar name={detail.userName} tone="bg-brand-container text-brand-active" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{detail.userName}</p>
                <p className="text-[11.5px] text-ink-3">{PACKAGE_LABEL[detail.packageId]}</p>
              </div>
              {statusBadge(detail.status)}
            </div>

            <dl className="divide-y divide-line-2 text-[13px]">
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-ink-3">ID</dt>
                <dd className="font-mono text-[11.5px] font-semibold text-ink">{detail.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-ink-3">Paket</dt>
                <dd className="font-semibold text-ink">{PACKAGE_LABEL[detail.packageId]}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-ink-3">Summa</dt>
                <dd className="font-semibold tabular text-ink">{money(detail.amount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-ink-3">To'lov usuli</dt>
                <dd>{methodBadge(detail.method)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <dt className="text-ink-3">Tranzaksiya ID</dt>
                <dd className="font-mono text-[11.5px] font-semibold text-ink">{detail.providerTxId}</dd>
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

            <div className="flex items-start gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[11.5px] text-ink-3">
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
            <div className="flex items-start gap-2 rounded-lg bg-warning-bg px-3.5 py-3 text-[12.5px] text-[#92400e]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-bold">{money(refundTarget.amount)}</span> foydalanuvchiga qaytariladi va
                tranzaksiya «Qaytarilgan» holatiga o'tadi. Bu amalni bekor qilish mumkin emas.
              </p>
            </div>
            <p className="text-[12.5px] text-ink-3">
              Paket: <span className="font-semibold text-ink">{PACKAGE_LABEL[refundTarget.packageId]}</span> · Usul:{' '}
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
    </PageTransition>
  )
}
