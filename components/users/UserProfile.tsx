'use client'

import { useMemo, useState } from 'react'
import {
  Ban,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Coins,
  Flame,
  Gem,
  Send,
  Target,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react'
import { activityFor } from '@/lib/mock'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ProgressBar,
  Tabs,
} from '@/components/ui'
import {
  MOCK_NOW,
  date,
  dateLong,
  money,
  number,
  percent,
  time,
} from '@/lib/format'
import type { Olympiad, Transaction, User } from '@/lib/types'

type ProfileTab = 'general' | 'activity' | 'payments' | 'olympiads'

const packageLabel: Record<string, string> = { '1m': '1 oylik', '3m': '3 oylik', '1y': '1 yillik' }
const methodLabel: Record<string, string> = { payme: 'Payme', click: 'Click', uzum: 'Uzum', uzcard: 'Uzcard' }
const statusLabel: Record<string, string> = {
  success: "Muvaffaqiyatli",
  pending: 'Kutilmoqda',
  cancelled: 'Bekor qilingan',
  refunded: 'Qaytarilgan',
}
const statusTone: Record<string, 'success' | 'warning' | 'danger' | 'gray'> = {
  success: 'success',
  pending: 'warning',
  cancelled: 'danger',
  refunded: 'gray',
}

export function UserProfile({
  user,
  transactions,
  olympiads,
  onGivePro,
  onGiveCoins,
  onToggleBlock,
  onOpenFull,
}: {
  user: User
  transactions: Transaction[]
  olympiads: Olympiad[]
  onGivePro: (user: User) => void
  onGiveCoins: (user: User) => void
  onToggleBlock: (user: User) => void
  onOpenFull?: (user: User) => void
}) {
  const [tab, setTab] = useState<ProfileTab>('general')
  const activity = useMemo(() => activityFor(user), [user])
  const userTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.userId === user.id),
    [transactions, user.id],
  )
  const participations = useMemo(
    () =>
      olympiads
        .map((olympiad) => {
          const result = olympiad.results.find((entry) => entry.userId === user.id)
          if (!result) return null
          const rank = olympiad.results.findIndex((entry) => entry.userId === user.id) + 1
          return { olympiad, result, rank }
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    [olympiads, user.id],
  )

  const proActive = user.plan === 'pro' && Boolean(user.planEndsAt)
  const maxMinutes = Math.max(...activity.weekly.map((item) => item.minutes), 1)

  return (
    <div>
      <div className="flex items-start gap-3">
        <Avatar name={user.name} size="xl" verified={user.verified} tone={user.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="font-display text-[19px] font-bold leading-tight tracking-[-0.01em] text-ink">{user.name}</h2>
            {proActive ? <Badge tone="brand">PRO</Badge> : <Badge tone="gray">BEPUL</Badge>}
            {user.status === 'blocked' ? <Badge tone="danger">Bloklangan</Badge> : null}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
            @{user.username} · <span className="font-mono text-[11px]">#{user.id}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" /> {user.telegram}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {date(user.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> {user.region} · {user.grade}-sinf
            </span>
          </div>
        </div>
      </div>

      {onOpenFull ? (
        <button
          type="button"
          onClick={() => onOpenFull(user)}
          className="mt-3 w-full rounded-lg border border-line-brand bg-brand-soft py-2 text-[12px] font-semibold text-brand-text transition hover:bg-[#e4f7eb]"
        >
          To'liq profilni ochish
        </button>
      ) : null}

      <Tabs
        value={tab}
        onChange={setTab}
        className="mt-4"
        items={[
          { value: 'general', label: 'Umumiy' },
          { value: 'activity', label: 'Faollik' },
          { value: 'payments', label: "To'lovlar", count: userTransactions.length },
          { value: 'olympiads', label: 'Olimpiadalar', count: participations.length },
        ]}
      />

      <div className="pt-4">
        {tab === 'general' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: <Flame className="h-4 w-4" />, label: 'Streak', value: `${user.streak} kun`, tone: 'bg-[#fef3c7] text-[#b45309]' },
                { icon: <Zap className="h-4 w-4" />, label: 'XP', value: number(user.xp), tone: 'bg-xp-bg text-xp' },
                { icon: <Trophy className="h-4 w-4" />, label: 'Daraja', value: `Lv.${user.level}`, tone: 'bg-[#ede9fe] text-[#6d28d9]' },
                { icon: <Coins className="h-4 w-4" />, label: 'Coin', value: number(user.coins), tone: 'bg-coin-bg text-[#b45309]' },
                { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Yechilgan', value: `${number(user.solved)} ta`, tone: 'bg-brand-soft text-brand' },
                { icon: <Target className="h-4 w-4" />, label: 'Aniqlik', value: percent(user.accuracy), tone: 'bg-info-bg text-info' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line-2 bg-canvas p-2.5">
                  <span className={`inline-grid h-7 w-7 place-items-center rounded-md ${item.tone}`}>{item.icon}</span>
                  <p className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink-3">{item.label}</p>
                  <p className="font-display text-[15px] font-bold text-ink">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-ink">Pro obuna</p>
                {proActive ? <Badge tone="brand" dot>Faol</Badge> : <Badge tone="gray">Yo'q</Badge>}
              </div>
              {proActive ? (
                <dl className="mt-2.5 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <dt className="text-ink-3">Muddat</dt>
                    <dd className="font-semibold text-ink">{dateLong(user.planEndsAt as string)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Paket</dt>
                    <dd className="font-semibold text-ink">{packageLabel[user.planPackage ?? '1m']}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">To'langan</dt>
                    <dd className="font-semibold text-ink">{money(user.planPaid ?? 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Qolgan kun</dt>
                    <dd className="font-semibold text-ink">
                      {Math.max(0, Math.ceil((new Date(user.planEndsAt as string).getTime() - MOCK_NOW.getTime()) / 86_400_000))} kun
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-1.5 text-[12px] text-ink-3">
                  Foydalanuvchida faol Pro obuna yo'q. Qo'lda 1 oylik Pro berish mumkin.
                </p>
              )}
              <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => onGivePro(user)}>
                <Gem className="h-3.5 w-3.5" /> {proActive ? "Pro obunani olish" : 'Pro obuna berish'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => onGiveCoins(user)}>
                <Coins className="h-3.5 w-3.5" /> Coin qo'shish
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onToggleBlock(user)}>
                <Ban className="h-3.5 w-3.5" /> {user.status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash'}
              </Button>
            </div>

            <div className="rounded-lg bg-canvas px-3 py-2.5 text-[11px] text-ink-3">
              Oxirgi faollik: {dateLong(user.lastSeenAt)}, {time(user.lastSeenAt)} · Ro'yxatga olingan: {dateLong(user.createdAt)}
            </div>
          </div>
        ) : null}

        {tab === 'activity' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-ink">Haftalik faollik</p>
                <span className="text-[11px] text-ink-3">
                  jami {activity.weekly.reduce((sum, item) => sum + item.minutes, 0)} daqiqa
                </span>
              </div>
              <div className="flex h-24 items-end gap-1.5">
                {activity.weekly.map((item) => (
                  <div key={item.day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[9px] text-ink-3">{item.minutes}</span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-[#15803d] to-[#22c55e]"
                      style={{ height: `${Math.max(6, (item.minutes / maxMinutes) * 72)}px` }}
                    />
                    <span className="text-[9px] text-ink-3">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <BookOpen className="h-3.5 w-3.5 text-brand" /> So'nggi darslar
              </p>
              <ul className="divide-y divide-line-2 rounded-xl border border-line">
                {activity.lessons.map((lesson) => (
                  <li key={lesson.title} className="flex items-center gap-2 px-3 py-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${lesson.completed ? 'bg-success' : 'bg-warning'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink-2">{lesson.title}</p>
                      <p className="text-[10.5px] text-ink-3">
                        {lesson.topic} · {lesson.minutes} daq
                      </p>
                    </div>
                    <Badge tone={lesson.completed ? 'success' : 'warning'}>
                      {lesson.completed ? 'Tugatilgan' : 'Davom etmoqda'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand" /> So'nggi yechilgan masalalar
              </p>
              <ul className="divide-y divide-line-2 rounded-xl border border-line">
                {activity.problems.map((problem) => (
                  <li key={problem.title} className="flex items-center gap-2 px-3 py-2">
                    {problem.correct ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-error" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{problem.title}</span>
                    <Badge tone={problem.correct ? 'success' : 'danger'}>{problem.correct ? "To'g'ri" : "Noto'g'ri"}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === 'payments' ? (
          userTransactions.length === 0 ? (
            <EmptyState title="To'lovlar yo'q" text="Bu foydalanuvchi hali hech qanday to'lov amalga oshirmagan." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left">
                <thead className="bg-canvas">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-3">
                    <th className="px-3 py-2">Sana</th>
                    <th className="px-3 py-2">Paket</th>
                    <th className="px-3 py-2">Summa</th>
                    <th className="px-3 py-2">Usul</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-line-2 text-[11.5px]">
                      <td className="px-3 py-2 text-ink-3">{date(transaction.createdAt)}</td>
                      <td className="px-3 py-2 font-medium text-ink-2">{packageLabel[transaction.packageId]}</td>
                      <td className="px-3 py-2 tabular text-ink">{money(transaction.amount)}</td>
                      <td className="px-3 py-2 text-ink-2">{methodLabel[transaction.method]}</td>
                      <td className="px-3 py-2">
                        <Badge tone={statusTone[transaction.status]}>{statusLabel[transaction.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === 'olympiads' ? (
          participations.length === 0 ? (
            <EmptyState
              title="Olimpiadalarda qatnashmagan"
              text="Foydalanuvchi hali biror olimpiadada ishtirok etmagan."
              icon={<Trophy className="h-5 w-5" />}
            />
          ) : (
            <ul className="space-y-2">
              {participations.map(({ olympiad, result, rank }) => (
                <li key={olympiad.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-ink">{olympiad.name}</p>
                    {rank <= 3 ? <Badge tone="coin">#{rank} o'rin</Badge> : <Badge tone="gray">#{rank}</Badge>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-3">{dateLong(olympiad.startAt)}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-2">
                    <span>
                      Ball: <span className="font-semibold text-ink">{result.score}</span>/{result.total}
                    </span>
                    <span>Vaqt: {Math.round(result.timeSeconds / 60)} daq</span>
                  </div>
                  <ProgressBar value={(result.score / result.total) * 100} height={4} className="mt-2" />
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  )
}
