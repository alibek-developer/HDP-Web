'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  Eye,
  Flame,
  Gem,
  MoreVertical,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  EmptyState,
  Modal,
  cn,
  useToast,
} from '@/components/ui'
import type { DropdownItem } from '@/components/ui'
import { UserProfile } from '@/components/users/UserProfile'
import { CoinsModal, GiveProModal } from '@/components/users/UserModals'
import { useAppStore } from '@/lib/store'
import { REGION_NAMES } from '@/lib/mock'
import {
  MOCK_NOW,
  date,
  dateInput,
  downloadCsv,
  number,
  percent,
  relative,
} from '@/lib/format'
import type { User, UserStatus } from '@/lib/types'

const PAGE_SIZE = 50
const DAY = 86_400_000

type StatusFilter = 'all' | UserStatus
type PlanFilter = 'all' | 'free' | 'pro'

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
  { value: 'blocked', label: 'Bloklangan' },
]

const statusDot: Record<UserStatus, string> = {
  active: 'bg-success',
  inactive: 'bg-ink-3/40',
  blocked: 'bg-error',
}

const statusLabel: Record<UserStatus, string> = {
  active: 'Faol',
  inactive: 'Nofaol',
  blocked: 'Bloklangan',
}

function StatTile({
  label,
  value,
  hint,
  icon,
  dark = false,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[16px] border p-3 sm:p-4',
        dark ? 'border-ink bg-ink text-white' : 'border-line bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'font-geist text-[9.5px] font-bold uppercase tracking-[0.09em] sm:text-[10px] sm:tracking-[0.12em]',
            dark ? 'text-white/55' : 'text-ink-3',
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-[8px]',
            dark ? 'bg-white/10 text-brand-light' : 'bg-muted text-ink-3',
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 font-geist text-[21px] font-extrabold leading-none tracking-[-0.03em] tabular sm:text-[27px]">
        {value}
      </p>
      <p
        className={cn(
          'mt-1.5 hidden truncate font-geist text-[11px] font-medium sm:block',
          dark ? 'text-white/55' : 'text-ink-3',
        )}
      >
        {hint}
      </p>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-geist text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </span>
      {children}
    </label>
  )
}

const fieldClass =
  'h-11 w-full rounded-[10px] border border-line bg-white px-3 font-geist text-[13.5px] font-medium text-ink outline-none transition hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10'

export default function UsersPage() {
  const router = useRouter()
  const users = useAppStore((state) => state.users)
  const transactions = useAppStore((state) => state.transactions)
  const olympiads = useAppStore((state) => state.olympiads)
  const setUserStatus = useAppStore((state) => state.setUserStatus)
  const deleteUsers = useAppStore((state) => state.deleteUsers)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [region, setRegion] = useState('all')
  const [level, setLevel] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [proOpen, setProOpen] = useState(false)
  const [proTargets, setProTargets] = useState<User[] | null>(null)
  const [coinsOpen, setCoinsOpen] = useState(false)
  const [coinsTargets, setCoinsTargets] = useState<User[] | null>(null)
  const [deleteIds, setDeleteIds] = useState<string[]>([])
  const [blockTargets, setBlockTargets] = useState<User[] | null>(null)

  const totals = useMemo(() => {
    const active = users.filter((user) => user.status === 'active').length
    const pro = users.filter((user) => user.plan === 'pro').length
    const newWeek = users.filter(
      (user) => new Date(user.createdAt).getTime() >= MOCK_NOW.getTime() - 7 * DAY,
    ).length
    return { all: users.length, active, pro, newWeek }
  }, [users])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((user) => {
      if (term) {
        const haystack = `${user.name} ${user.username} ${user.email} ${user.id} ${user.telegram}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (status !== 'all' && user.status !== status) return false
      if (plan !== 'all' && user.plan !== plan) return false
      if (region !== 'all' && user.region !== region) return false
      if (level !== 'all' && String(user.level) !== level) return false
      if (from && dateInput(user.createdAt) < from) return false
      if (to && dateInput(user.createdAt) > to) return false
      return true
    })
  }, [users, search, status, plan, region, level, from, to])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  )

  const advancedFilterCount =
    (plan !== 'all' ? 1 : 0) +
    (region !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0)

  const allPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))
  const somePageSelected = rows.some((row) => selected.has(row.id)) && !allPageSelected

  const selectedUsers = useMemo(() => users.filter((user) => selected.has(user.id)), [users, selected])
  const drawerUser = users.find((user) => user.id === drawerId) ?? null

  const activeChips: Array<{ key: string; label: string; clear: () => void }> = []
  if (plan !== 'all') {
    activeChips.push({
      key: 'plan',
      label: plan === 'pro' ? 'Pro obuna' : 'Bepul obuna',
      clear: () => setPlan('all'),
    })
  }
  if (region !== 'all') {
    activeChips.push({ key: 'region', label: region, clear: () => setRegion('all') })
  }
  if (level !== 'all') {
    activeChips.push({ key: 'level', label: `Lv.${level}`, clear: () => setLevel('all') })
  }
  if (from) {
    activeChips.push({ key: 'from', label: `dan ${from}`, clear: () => setFrom('') })
  }
  if (to) {
    activeChips.push({ key: 'to', label: `gacha ${to}`, clear: () => setTo('') })
  }

  const resetFilters = () => {
    setPlan('all')
    setRegion('all')
    setLevel('all')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePage = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allPageSelected) rows.forEach((row) => next.delete(row.id))
      else rows.forEach((row) => next.add(row.id))
      return next
    })
  }

  const exportRows = (source: User[], suffix = 'foydalanuvchilar') => {
    downloadCsv(`hdp-${suffix}-${dateInput(new Date())}.csv`, [
      ['ID', 'Ism', 'Username', 'Email', 'Telegram', 'Obuna', 'XP', 'Daraja', 'Coin', 'Streak', 'Tuman', "Ro'yxat sanasi", 'Holat'],
      ...source.map((user) => [
        user.id,
        user.name,
        `@${user.username}`,
        user.email,
        user.telegram,
        user.plan === 'pro' ? 'Pro' : 'Bepul',
        user.xp,
        user.level,
        user.coins,
        user.streak,
        user.region,
        date(user.createdAt),
        user.status,
      ]),
    ])
    toast({ title: 'CSV yuklandi', description: `${number(source.length)} ta yozuv eksport qilindi.` })
  }

  const toggleBlock = (user: User) => {
    if (user.status === 'blocked') {
      setUserStatus([user.id], 'active')
      toast({ title: `${user.name} blokdan chiqarildi`, tone: 'success' })
    } else {
      setUserStatus([user.id], 'blocked')
      toast({
        title: `${user.name} bloklandi`,
        description: 'Foydalanuvchi ilovaga kira olmaydi.',
        tone: 'warning',
      })
    }
  }

  const bulkBlock = () => {
    if (selectedUsers.length === 0) return
    setBlockTargets(selectedUsers)
  }

  const confirmBulkBlock = () => {
    if (!blockTargets) return
    setUserStatus(blockTargets.map((user) => user.id), 'blocked')
    toast({ title: `${blockTargets.length} ta foydalanuvchi bloklandi`, tone: 'warning' })
    setBlockTargets(null)
    setSelected(new Set())
  }

  const confirmDelete = () => {
    deleteUsers(deleteIds)
    toast({ title: `${deleteIds.length} ta foydalanuvchi o'chirildi`, tone: 'success' })
    setDeleteIds([])
    setSelected(new Set())
  }

  const levelOptions = Array.from({ length: 7 }, (_, index) => String(index + 1))
  const fromRow = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const toRow = Math.min(filtered.length, currentPage * PAGE_SIZE)

  const rowActions = (user: User): DropdownItem[] => [
    {
      label: 'Profilni ochish',
      icon: <UserRound className="h-3.5 w-3.5" />,
      onClick: () => setDrawerId(user.id),
    },
    {
      label: "To'liq sahifa",
      icon: <Eye className="h-3.5 w-3.5" />,
      onClick: () => router.push(`/admin/users/${user.id}`),
    },
    {
      label: 'Pro berish',
      icon: <Gem className="h-3.5 w-3.5" />,
      onClick: () => {
        setProTargets([user])
        setProOpen(true)
      },
    },
    {
      label: "Coin qo'shish",
      icon: <Coins className="h-3.5 w-3.5" />,
      onClick: () => {
        setCoinsTargets([user])
        setCoinsOpen(true)
      },
    },
    {
      label: user.status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash',
      icon: <Ban className="h-3.5 w-3.5" />,
      onClick: () => toggleBlock(user),
    },
    { separator: true, label: 'sep' },
    {
      label: "O'chirish",
      danger: true,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => setDeleteIds([user.id]),
    },
  ]

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-3 overflow-hidden  sm:gap-3.5 ">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="h2 truncate text-ink">Foydalanuvchilar</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 font-geist text-[11px] font-bold tabular text-ink-2">
              {number(totals.all)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => exportRows(filtered)}
              aria-label="CSV eksport"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-2.5 font-geist text-[12.5px] font-semibold text-ink-2 transition hover:border-line-brand hover:text-ink sm:px-3"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProTargets(null)
                setProOpen(true)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-2.5 font-geist text-[12.5px] font-bold text-white transition hover:bg-brand sm:px-3"
            >
              <Gem className="h-4 w-4" />
              <span className="hidden sm:inline">Pro berish</span>
              <span className="sm:hidden">Pro</span>
            </button>
          </div>
        </header>

        <section className="grid shrink-0 grid-cols-2 gap-2.5 [@media(max-height:720px)]:hidden lg:grid-cols-4">
          <StatTile
            label="Jami o'quvchilar"
            value={number(totals.all)}
            hint={`${number(totals.all - totals.active)} ta nofaol yoki bloklangan`}
            icon={<Users className="h-[15px] w-[15px]" />}
          />
          <StatTile
            label="Faol"
            value={number(totals.active)}
            hint={`${percent((totals.active / Math.max(1, totals.all)) * 100, 1)} baza`}
            icon={<Activity className="h-[15px] w-[15px]" />}
          />
          <StatTile
            dark
            label="Pro obuna"
            value={number(totals.pro)}
            hint={`${percent((totals.pro / Math.max(1, totals.all)) * 100, 1)} foydalanuvchi`}
            icon={<Gem className="h-[15px] w-[15px]" />}
          />
          <StatTile
            label="Yangi · 7 kun"
            value={number(totals.newWeek)}
            hint="So'nggi haftada qo'shildi"
            icon={<UserPlus className="h-[15px] w-[15px]" />}
          />
        </section>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-line bg-white">
          <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-line px-3 py-2.5 sm:px-4">
            <div className="relative min-w-0 flex-1 sm:w-[320px] sm:flex-none">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-placeholder"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Ism, email, username yoki #ID..."
                className="h-11 w-full rounded-[12px] border border-line bg-white pl-10 pr-9 font-geist text-[13.5px] text-ink outline-none transition placeholder:text-placeholder hover:border-line-brand focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Qidiruvni tozalash"
                  onClick={() => {
                    setSearch('')
                    setPage(1)
                  }}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[8px] text-ink-3 hover:bg-muted hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="no-scrollbar order-3 flex h-11 w-full items-center gap-0.5 overflow-x-auto rounded-[12px] bg-muted p-0.5 sm:order-none sm:w-auto sm:p-1">
              {STATUS_TABS.map((tab) => {
                const active = tab.value === status
                const count =
                  tab.value === 'all'
                    ? totals.all
                    : users.filter((user) => user.status === tab.value).length
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setStatus(tab.value)
                      setPage(1)
                    }}
                    className={cn(
                      'inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 font-geist text-[12px] font-semibold transition sm:h-9',
                      active ? 'bg-ink text-white shadow-sm' : 'text-ink-3 hover:text-ink',
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'hidden rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular sm:inline-block',
                        active ? 'bg-white/15 text-white/80' : 'bg-white/80 text-ink-3',
                      )}
                    >
                      {number(count)}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Kengaytirilgan filtr"
              className={cn(
                'ml-auto inline-flex h-11 w-11 items-center justify-center gap-2 rounded-[12px] border font-geist text-[13px] font-semibold transition sm:w-auto sm:px-3.5',
                advancedFilterCount > 0
                  ? 'border-brand/40 bg-brand-soft text-brand-text'
                  : 'border-line bg-white text-ink-2 hover:border-line-brand hover:text-ink',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline">Filtr</span>
              {advancedFilterCount > 0 ? (
                <span className="hidden h-4.5 min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white sm:grid">
                  {advancedFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          {activeChips.length > 0 ? (
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-line-2 px-3 py-2 sm:px-4">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    chip.clear()
                    setPage(1)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 font-geist text-[11.5px] font-semibold text-ink-2 transition hover:border-error/30 hover:text-error"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  resetFilters()
                  setPage(1)
                }}
                className="ml-1 font-geist text-[11.5px] font-semibold text-brand-text hover:underline"
              >
                Tozalash
              </button>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="lg:hidden">
              {rows.map((user) => {
                const checked = selected.has(user.id)
                return (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-0.5 border-b border-line-2 pr-1 transition last:border-0',
                      checked ? 'bg-brand-soft/45' : 'active:bg-muted/70',
                    )}
                  >
                    <div className="py-3 pl-3" onClick={(event) => event.stopPropagation()}>
                      <Checkbox checked={checked} onChange={() => toggleSelect(user.id)} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawerId(user.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 pl-1 pr-1 text-left"
                    >
                      <Avatar name={user.name} tone={user.tone} size="sm" verified={user.verified} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-geist text-[13px] font-semibold text-ink">
                            {user.name}
                          </span>
                          {user.plan === 'pro' ? (
                            <span className="shrink-0 rounded-full bg-brand-soft px-1.5 py-px font-geist text-[9px] font-bold uppercase tracking-wide text-brand-text">
                              Pro
                            </span>
                          ) : null}
                          {user.status === 'blocked' ? (
                            <span className="shrink-0 rounded-full bg-error-bg px-1.5 py-px font-geist text-[9px] font-bold uppercase tracking-wide text-error">
                              Blok
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 font-geist text-[10.5px] text-ink-3">
                          <span className="max-w-[92px] truncate">@{user.username}</span>
                          <span>·</span>
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusDot[user.status])} />
                          <span className="truncate">
                            {user.status === 'active' ? relative(user.lastSeenAt) : statusLabel[user.status]}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-geist text-[12px] font-semibold tabular text-ink">
                          {number(user.xp)} XP
                        </p>
                        <p className="mt-0.5 font-geist text-[10px] font-medium tabular text-ink-3">
                          Lv.{user.level} · {number(user.coins)} coin
                        </p>
                      </div>
                    </button>
                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          aria-label="Amallar"
                          className="grid h-11 w-11 place-items-center rounded-[9px] text-ink-3 active:bg-muted"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                      items={rowActions(user)}
                    />
                  </div>
                )
              })}
            </div>

            <table className="hidden w-full min-w-[880px] border-collapse text-left lg:table">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <tr className="border-b border-line font-geist text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
                  <th className="w-11 py-3 pl-4 pr-1">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onChange={togglePage}
                    />
                  </th>
                  <th className="px-2 py-3 font-semibold">Foydalanuvchi</th>
                  <th className="px-3 py-3 font-semibold">Tuman</th>
                  <th className="px-3 py-3 font-semibold">Obuna</th>
                  <th className="px-3 py-3 font-semibold">Faollik</th>
                  <th className="px-3 py-3 text-right font-semibold">XP / Daraja</th>
                  <th className="px-3 py-3 text-right font-semibold">Coin</th>
                  <th className="px-3 py-3 text-right font-semibold">Streak</th>
                  <th className="w-12 py-3 pl-1 pr-4" />
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => {
                  const checked = selected.has(user.id)
                  const progress = Math.max(
                    0,
                    Math.min(100, ((user.xp - user.level * 800) / 900) * 100),
                  )
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setDrawerId(user.id)}
                      className={cn(
                        'cursor-pointer border-b border-line-2 transition last:border-0',
                        checked ? 'bg-brand-soft/45' : 'hover:bg-muted/70',
                      )}
                    >
                      <td className="py-2.5 pl-4 pr-1" onClick={(event) => event.stopPropagation()}>
                        <Checkbox checked={checked} onChange={() => toggleSelect(user.id)} />
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={user.name}
                            tone={user.tone}
                            size="sm"
                            verified={user.verified}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="max-w-[190px] truncate font-geist text-[13px] font-semibold text-ink">
                                {user.name}
                              </span>
                              {user.status === 'blocked' ? (
                                <span className="rounded-full bg-error-bg px-1.5 py-px font-geist text-[9.5px] font-bold uppercase tracking-wide text-error">
                                  Blok
                                </span>
                              ) : null}
                            </div>
                            <span className="mt-0.5 block max-w-[200px] truncate font-mono text-[10.5px] text-ink-3">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block max-w-[130px] truncate font-geist text-[12.5px] font-medium text-ink-2">
                          {user.region}
                        </span>
                        <span className="mt-0.5 block font-geist text-[10.5px] text-ink-3">
                          {user.grade}-sinf
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {user.plan === 'pro' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 font-geist text-[10px] font-bold uppercase tracking-[0.06em] text-brand-text">
                            <Gem className="h-3 w-3" />
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-muted px-2 py-1 font-geist text-[10px] font-bold uppercase tracking-[0.06em] text-ink-3">
                            Bepul
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5 whitespace-nowrap font-geist text-[12px] font-medium text-ink-2">
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusDot[user.status])} />
                          {user.status === 'active'
                            ? relative(user.lastSeenAt)
                            : statusLabel[user.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-end">
                          <span className="font-geist text-[12.5px] font-semibold tabular text-ink">
                            {number(user.xp)}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5">
                            <span className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                              <span
                                className="block h-full rounded-full bg-brand"
                                style={{ width: `${progress}%` }}
                              />
                            </span>
                            <span className="font-geist text-[10px] font-medium text-ink-3">
                              Lv.{user.level}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 font-geist text-[12.5px] font-semibold tabular text-[#b45309]">
                          <Coins className="h-3.5 w-3.5" />
                          {number(user.coins)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {user.streak > 0 ? (
                          <span className="inline-flex items-center gap-1 font-geist text-[12px] font-medium tabular text-ink-2">
                            <Flame className="h-3.5 w-3.5 text-brand" />
                            {user.streak}
                          </span>
                        ) : (
                          <span className="font-geist text-[12px] text-ink-3">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-1 pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <button
                              type="button"
                              aria-label="Amallar"
                              className="grid h-9 w-9 place-items-center rounded-[9px] text-ink-3 transition hover:bg-muted hover:text-ink"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                          items={rowActions(user)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="grid h-full min-h-[220px] place-items-center px-4">
                <EmptyState
                  title="Foydalanuvchi topilmadi"
                  text="Qidiruv yoki filtrlarni o'zgartirib qayta urinib ko'ring."
                  icon={<Users className="h-5 w-5" />}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearch('')
                        setStatus('all')
                        resetFilters()
                      }}
                    >
                      Filtrni tozalash
                    </Button>
                  }
                />
              </div>
            ) : null}
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 sm:px-4">
            <p className="font-geist text-[11.5px] text-ink-3">
              <span className="font-semibold text-ink-2">
                {number(fromRow)}–{number(toRow)}
              </span>{' '}
              / {number(filtered.length)} yozuv
              {filtered.length !== users.length ? ' (filtrlangan)' : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Oldingi sahifa"
                className="grid h-10 w-10 place-items-center rounded-[10px] border border-line text-ink-2 transition hover:border-line-brand hover:bg-muted disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[74px] text-center font-geist text-[12px] font-semibold tabular text-ink-2">
                {number(currentPage)} / {number(pageCount)}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage >= pageCount}
                aria-label="Keyingi sahifa"
                className="grid h-10 w-10 place-items-center rounded-[10px] border border-line text-ink-2 transition hover:border-line-brand hover:bg-muted disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>

          <AnimatePresence>
            {selected.size > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute bottom-[62px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-[14px] bg-ink p-1 pl-3 text-white shadow-[0_18px_44px_rgba(25,24,19,0.35)]"
              >
                <span className="mr-1 whitespace-nowrap font-geist text-[11.5px] font-bold">
                  {number(selected.size)} tanlandi
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProTargets(selectedUsers)
                    setProOpen(true)
                  }}
                  aria-label="Pro obuna berish"
                  className="inline-flex h-11 items-center gap-1.5 rounded-[9px] px-2.5 font-geist text-[11.5px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:h-9"
                >
                  <Gem className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pro</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCoinsTargets(selectedUsers)
                    setCoinsOpen(true)
                  }}
                  aria-label="Coin qo'shish"
                  className="inline-flex h-11 items-center gap-1.5 rounded-[9px] px-2.5 font-geist text-[11.5px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:h-9"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Coin</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportRows(selectedUsers, 'tanlangan')}
                  aria-label="Tanlanganlarni eksport qilish"
                  className="inline-flex h-11 items-center gap-1.5 rounded-[9px] px-2.5 font-geist text-[11.5px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:h-9"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  type="button"
                  onClick={bulkBlock}
                  aria-label="Tanlanganlarni bloklash"
                  className="inline-flex h-11 items-center gap-1.5 rounded-[9px] px-2.5 font-geist text-[11.5px] font-semibold text-error transition hover:bg-white/10 sm:h-9"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Bloklash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  aria-label="Tanlovni tozalash"
                  className="grid h-11 w-11 place-items-center rounded-[9px] text-white/60 transition hover:bg-white/10 hover:text-white sm:h-9 sm:w-9"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        <Drawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Kengaytirilgan filtr"
          subtitle="Natijalarni aniq segmentga moslang"
          widthClass="sm:w-[400px]"
          footer={
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  resetFilters()
                  setFiltersOpen(false)
                }}
              >
                Tozalash
              </Button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-ink px-5 font-geist text-[13px] font-bold text-white transition hover:bg-brand"
              >
                <Check className="h-4 w-4" />
                Qo'llash
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FilterField label="Obuna">
              <select
                value={plan}
                onChange={(event) => {
                  setPlan(event.target.value as PlanFilter)
                  setPage(1)
                }}
                className={fieldClass}
              >
                <option value="all">Barchasi</option>
                <option value="free">Bepul</option>
                <option value="pro">Pro</option>
              </select>
            </FilterField>
            <FilterField label="Tuman">
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value)
                  setPage(1)
                }}
                className={fieldClass}
              >
                <option value="all">Barchasi</option>
                {REGION_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Daraja">
              <select
                value={level}
                onChange={(event) => {
                  setLevel(event.target.value)
                  setPage(1)
                }}
                className={fieldClass}
              >
                <option value="all">Barchasi</option>
                {levelOptions.map((value) => (
                  <option key={value} value={value}>
                    Lv.{value}
                  </option>
                ))}
              </select>
            </FilterField>
            <div className="border-t border-line-2 pt-4">
              <p className="mb-2 font-geist text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                Ro'yxat sanasi
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <FilterField label="Dan">
                  <input
                    type="date"
                    value={from}
                    onChange={(event) => {
                      setFrom(event.target.value)
                      setPage(1)
                    }}
                    className={fieldClass}
                  />
                </FilterField>
                <FilterField label="Gacha">
                  <input
                    type="date"
                    value={to}
                    onChange={(event) => {
                      setTo(event.target.value)
                      setPage(1)
                    }}
                    className={fieldClass}
                  />
                </FilterField>
              </div>
            </div>
            <div className="rounded-[12px] bg-muted px-3.5 py-3">
              <p className="font-geist text-[12px] font-semibold text-ink-2">
                {number(filtered.length)} ta natija
              </p>
              <p className="mt-0.5 font-geist text-[11px] text-ink-3">
                Jami bazaning {percent((filtered.length / Math.max(1, users.length)) * 100, 1)} qismi
              </p>
            </div>
          </div>
        </Drawer>

        <Drawer
          open={Boolean(drawerUser)}
          onClose={() => setDrawerId(null)}
          title="Foydalanuvchi profili"
          subtitle={drawerUser ? `#${drawerUser.id}` : undefined}
          footer={
            drawerUser ? (
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/admin/users/${drawerUser.id}`}
                  className="font-geist text-[12px] font-semibold text-brand-text hover:underline"
                >
                  To'liq profil →
                </Link>
                <Button size="sm" variant="secondary" onClick={() => setDrawerId(null)}>
                  Yopish
                </Button>
              </div>
            ) : undefined
          }
        >
          {drawerUser ? (
            <UserProfile
              user={drawerUser}
              transactions={transactions}
              olympiads={olympiads}
              onGivePro={(user) => {
                setProTargets([user])
                setProOpen(true)
              }}
              onGiveCoins={(user) => {
                setCoinsTargets([user])
                setCoinsOpen(true)
              }}
              onToggleBlock={toggleBlock}
            />
          ) : null}
        </Drawer>

        <GiveProModal open={proOpen} onClose={() => setProOpen(false)} targets={proTargets} />
        <CoinsModal open={coinsOpen} onClose={() => setCoinsOpen(false)} targets={coinsTargets} />

        <Modal
          open={deleteIds.length > 0}
          onClose={() => setDeleteIds([])}
          title="Foydalanuvchini o'chirish"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteIds([])}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="h-4 w-4" /> O'chirish
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            {deleteIds.length} ta foydalanuvchi butunlay o'chiriladi. Bu amalni ortga qaytarish
            mumkin emas.
          </p>
          <div className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-[12px] text-error">
            Buyurtmalar, murojaatlar va sertifikatlar ham o'chiriladi. To'lovlar va olimpiada
            natijalari arxivda saqlanadi.
          </div>
        </Modal>

        <Modal
          open={blockTargets !== null}
          onClose={() => setBlockTargets(null)}
          title="Foydalanuvchilarni bloklash"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setBlockTargets(null)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={confirmBulkBlock}>
                <Ban className="h-4 w-4" /> Bloklash
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">
            {blockTargets?.length ?? 0} ta foydalanuvchi bloklanadi va ilovaga kira olmaydi.
          </p>
          <div className="mt-3 max-h-[180px] overflow-y-auto rounded-lg border border-line-2 bg-canvas px-3 py-2">
            <ul className="divide-y divide-line-2 text-[12px] text-ink-2">
              {blockTargets?.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-ink-3">{user.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      </div>
    </PageTransition>
  )
}
