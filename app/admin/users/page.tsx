'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Ban,
  Coins,
  Download,
  Eye,
  Filter,
  Gem,
  MoreVertical,
  Plus,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  EmptyState,
  Input,
  Modal,
  Pagination,
  SearchInput,
  Select,
  cn,
  useToast,
} from '@/components/ui'
import { UserProfile } from '@/components/users/UserProfile'
import { CoinsModal, GiveProModal } from '@/components/users/UserModals'
import { useAppStore } from '@/lib/store'
import { REGION_NAMES } from '@/lib/mock'
import {
  date,
  dateInput,
  downloadCsv,
  number,
  percent,
  relative,
} from '@/lib/format'
import type { User, UserStatus } from '@/lib/types'

const PAGE_SIZE = 50

type StatusFilter = 'all' | UserStatus
type PlanFilter = 'all' | 'free' | 'pro'

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

  const activeFilterCount =
    (status !== 'all' ? 1 : 0) +
    (plan !== 'all' ? 1 : 0) +
    (region !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (search ? 1 : 0)

  const allPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))
  const somePageSelected = rows.some((row) => selected.has(row.id)) && !allPageSelected

  const selectedUsers = useMemo(() => users.filter((user) => selected.has(user.id)), [users, selected])
  const drawerUser = users.find((user) => user.id === drawerId) ?? null

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
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
      ['ID', 'Ism', 'Username', 'Email', 'Telegram', 'Obuna', 'XP', 'Daraja', 'Coin', 'Streak', 'Viloyat', "Ro'yxat sanasi", 'Holat'],
      ...source.map((user) => [
        user.id,
        user.name,
        `@${user.username}`,
        user.email,
        `@${user.telegram}`,
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
      toast({ title: `${user.name} bloklandi`, description: "Foydalanuvchi ilovaga kira olmaydi.", tone: 'warning' })
    }
  }

  const bulkBlock = () => {
    setUserStatus(selectedUsers.map((user) => user.id), 'blocked')
    toast({ title: `${selectedUsers.length} ta foydalanuvchi bloklandi`, tone: 'warning' })
    setSelected(new Set())
  }

  const confirmDelete = () => {
    deleteUsers(deleteIds)
    toast({ title: `${deleteIds.length} ta foydalanuvchi o'chirildi`, tone: 'success' })
    setDeleteIds([])
    setSelected(new Set())
  }

  const levelOptions = Array.from({ length: 7 }, (_, index) => String(index + 1))

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Foydalanuvchilar
            <Badge tone="brand">{number(users.length)} ta</Badge>
          </span>
        }
        subtitle="Foydalanuvchilarni boshqaring, filtrlang va obunalarini nazorat qiling"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Foydalanuvchilar' }]}
        actions={
          <>
            <Button variant="secondary" onClick={() => setFiltersOpen((current) => !current)}>
              <Filter className="h-4 w-4" /> Filter
              {activeFilterCount > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            <Button variant="secondary" onClick={() => exportRows(filtered)}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={() => {
                setProTargets(null)
                setProOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Qo'lda Pro berish
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder="Ism, email, username yoki #ID bo'yicha qidirish..."
          className="sm:max-w-md"
        />
      </div>

      <AnimatePresence initial={false}>
        {filtersOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mb-4 rounded-xl border border-line bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <SlidersHorizontal className="h-4 w-4 text-brand" /> Kengaytirilgan filtr
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[12px] font-semibold text-brand-text hover:underline"
                >
                  Filterni tozalash
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Status</p>
                  <Select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as StatusFilter)
                      setPage(1)
                    }}
                  >
                    <option value="all">Barchasi</option>
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                    <option value="blocked">Bloklangan</option>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Obuna</p>
                  <Select
                    value={plan}
                    onChange={(event) => {
                      setPlan(event.target.value as PlanFilter)
                      setPage(1)
                    }}
                  >
                    <option value="all">Barchasi</option>
                    <option value="free">Bepul</option>
                    <option value="pro">Pro</option>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Viloyat</p>
                  <Select
                    value={region}
                    onChange={(event) => {
                      setRegion(event.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">Barchasi</option>
                    {REGION_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Daraja</p>
                  <Select
                    value={level}
                    onChange={(event) => {
                      setLevel(event.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">Barchasi</option>
                    {levelOptions.map((value) => (
                      <option key={value} value={value}>
                        Lv.{value}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Ro'yxat sanasi (dan)</p>
                  <Input
                    type="date"
                    value={from}
                    onChange={(event) => {
                      setFrom(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Ro'yxat sanasi (gacha)</p>
                  <Input
                    type="date"
                    value={to}
                    onChange={(event) => {
                      setTo(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selected.size > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-brand bg-brand-soft px-3 py-2.5"
          >
            <span className="mr-1 text-[12.5px] font-semibold text-brand-text">{selected.size} ta tanlandi</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setProTargets(selectedUsers)
                setProOpen(true)
              }}
            >
              <Gem className="h-3.5 w-3.5" /> Pro berish
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCoinsTargets(selectedUsers)
                setCoinsOpen(true)
              }}
            >
              <Coins className="h-3.5 w-3.5" /> Coin qo'shish
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportRows(selectedUsers, 'tanlangan')}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" variant="destructive" onClick={bulkBlock}>
              <Ban className="h-3.5 w-3.5" /> Bloklash
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto grid h-7 w-7 place-items-center rounded-md text-brand-text hover:bg-white"
              aria-label="Tanlovni tozalash"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {filtered.length === 0 ? (
          <EmptyState
            title="Foydalanuvchi topilmadi"
            text="Qidiruv yoki filtrlarni o'zgartirib qayta urinib ko'ring."
            icon={<Users className="h-5 w-5" />}
            action={
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Filterni tozalash
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox checked={allPageSelected} indeterminate={somePageSelected} onChange={togglePage} />
                  </th>
                  <th className="px-3 py-2.5">Foydalanuvchi</th>
                  <th className="px-3 py-2.5">Telegram</th>
                  <th className="px-3 py-2.5">Obuna</th>
                  <th className="px-3 py-2.5">XP / Daraja</th>
                  <th className="px-3 py-2.5">Coin</th>
                  <th className="px-3 py-2.5">Streak</th>
                  <th className="px-3 py-2.5">Ro'yxat</th>
                  <th className="w-24 px-3 py-2.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => {
                  const checked = selected.has(user.id)
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        'border-b border-line-2 text-[12.5px] transition last:border-0',
                        checked ? 'bg-brand-soft/50' : 'hover:bg-canvas',
                      )}
                    >
                      <td className="px-3 py-2">
                        <Checkbox checked={checked} onChange={() => toggleSelect(user.id)} />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setDrawerId(user.id)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <Avatar name={user.name} tone={user.tone} size="sm" verified={user.verified} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="max-w-[160px] truncate font-semibold text-ink">{user.name}</span>
                              {user.status === 'blocked' ? <Badge tone="danger">Blok</Badge> : null}
                            </span>
                            <span className="block font-mono text-[10px] text-ink-3">#{user.id}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-ink-2">@{user.telegram}</td>
                      <td className="px-3 py-2">
                        {user.plan === 'pro' ? (
                          <Badge tone="brand">PRO</Badge>
                        ) : (
                          <Badge tone="gray">BEPUL</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-2">
                        <span className="tabular">{number(user.xp)} XP</span>
                        <span className="ml-1 text-ink-3">· Lv.{user.level}</span>
                      </td>
                      <td className="px-3 py-2 font-semibold tabular text-[#b45309]">{number(user.coins)}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-ink-2">
                          <span className="text-[11px]">🔥</span> {user.streak} kun
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-3">{date(user.createdAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            aria-label="Profilni ko'rish"
                            onClick={() => setDrawerId(user.id)}
                            className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-brand-text"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                aria-label="Amallar"
                                className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            }
                            items={[
                              {
                                label: 'Profilni ochish',
                                icon: <UserRound className="h-3.5 w-3.5" />,
                                onClick: () => setDrawerId(user.id),
                              },
                              {
                                label: 'To\'liq sahifa',
                                icon: <Eye className="h-3.5 w-3.5" />,
                                onClick: () => router.push(`/admin/users/${user.id}`),
                              },
                              {
                                label: user.plan === 'pro' ? 'Pro obunani olish' : 'Pro berish',
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-3">
        <span>
          Jami {number(users.length)} ta foydalanuvchi · {number(users.filter((user) => user.plan === 'pro').length)}{' '}
          Pro ({percent((users.filter((user) => user.plan === 'pro').length / Math.max(1, users.length)) * 100, 1)})
        </span>
        <span>Oxirgi sinxronlash: {relative(new Date())}</span>
      </div>

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
                className="text-[12px] font-semibold text-brand-text hover:underline"
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
          {deleteIds.length} ta foydalanuvchi butunlay o'chiriladi. Bu amalni ortga qaytarish mumkin emas.
        </p>
        <div className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-[12px] text-error">
          Tegishli to'lovlar va natijalar arxivda saqlanadi, ammo foydalanuvchi ilovaga kira olmaydi.
        </div>
      </Modal>
    </PageTransition>
  )
}
