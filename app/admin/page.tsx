'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Download } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageTransition } from '@/components/layout/Page'
import { cn, useToast } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { systemStatus } from '@/lib/mock'
import {
  MOCK_NOW,
  dateLong,
  downloadCsv,
  initials,
  money,
  number,
  percent,
  relative,
  weekday,
} from '@/lib/format'
import { growthSeries, revenueSeries, type GrowthRange, type RevenueRange } from '@/lib/series'
import type { PackageId } from '@/lib/types'

const INK = '#191813'
const ACCENT = '#e8522a'

const packageLabel: Record<PackageId, string> = { '1m': 'Pro 1 oy', '3m': 'Pro 3 oy', '1y': 'Pro 1 yil' }
const packageTone = [INK, ACCENT, '#6f6a5e']

function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-geist text-[10px] font-semibold uppercase tracking-[0.16em]', className)}>
      {children}
    </p>
  )
}

function ChartTip({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl bg-[#191813] px-3.5 py-2.5 text-white shadow-[0_16px_40px_-16px_rgba(25,24,19,0.6)]">
      <p className="font-geist text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">{label}</p>
      <p className="mt-1 font-geist text-[15px] font-bold tabular">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] font-medium text-white/55">{sub}</p> : null}
    </div>
  )
}

function RangeSwitch<T extends string>({
  value,
  onChange,
  options,
  dark,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  dark?: boolean
}) {
  return (
    <div className={cn('inline-flex shrink-0 items-center gap-0.5 rounded-[10px] p-1', dark ? 'bg-white/10' : 'bg-muted')}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 rounded-[8px] px-3 font-geist text-[12px] font-bold transition-colors',
              active
                ? dark
                  ? 'bg-white text-ink'
                  : 'bg-ink text-white'
                : dark
                  ? 'text-white/55 hover:text-white'
                  : 'text-ink-3 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function Tile({
  label,
  value,
  caption,
  tone = 'up',
}: {
  label: string
  value: ReactNode
  caption: ReactNode
  tone?: 'up' | 'down'
}) {
  return (
    <div className="flex min-h-[104px] flex-col justify-between rounded-[20px] border border-line bg-white p-3.5 sm:p-4">
      <Eyebrow className="text-ink-3">{label}</Eyebrow>
      <div>
        <p className="font-geist text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular text-ink sm:text-[30px]">
          {value}
        </p>
        <p
          className={cn(
            'mt-2 flex items-center gap-1 text-[11px] font-semibold tabular',
            tone === 'up' ? 'text-[#3f7a45]' : 'text-[#c2410c]',
          )}
        >
          {tone === 'up' ? (
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          )}
          {caption}
        </p>
      </div>
    </div>
  )
}

function AllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-9 items-center gap-1 font-geist text-[13px] font-bold text-ink transition-colors hover:text-brand"
    >
      Barchasi
      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.6} />
    </Link>
  )
}

export default function DashboardPage() {
  const users = useAppStore((state) => state.users)
  const topics = useAppStore((state) => state.topics)
  const transactions = useAppStore((state) => state.transactions)
  const olympiads = useAppStore((state) => state.olympiads)
  const { toast } = useToast()

  const [growthRange, setGrowthRange] = useState<GrowthRange>('30d')
  const [revenueRange, setRevenueRange] = useState<RevenueRange>('6m')

  const growth = useMemo(() => growthSeries(growthRange), [growthRange])
  const revenue = useMemo(() => revenueSeries(revenueRange), [revenueRange])

  const monthRevenue = useMemo(() => {
    const currentYear = MOCK_NOW.getFullYear()
    const currentMonth = MOCK_NOW.getMonth()
    return transactions
      .filter((transaction) => transaction.status === 'success')
      .filter((transaction) => {
        const date = new Date(transaction.createdAt)
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }, [transactions])

  const previousRevenue = useMemo(() => {
    const series = revenueSeries('6m')
    return series[series.length - 2]?.value ?? 0
  }, [])

  const revenueTrend = previousRevenue > 0 ? ((monthRevenue - previousRevenue) / previousRevenue) * 100 : 0

  const topTopics = useMemo(
    () =>
      [...topics]
        .filter((topic) => topic.status === 'active')
        .sort((left, right) => right.views - left.views)
        .slice(0, 5),
    [topics],
  )

  const maxTopicViews = topTopics[0]?.views ?? 1

  const recentPayments = useMemo(
    () => [...transactions].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5),
    [transactions],
  )

  const regions = useMemo(() => {
    const map = new Map<string, number>()
    for (const user of users) map.set(user.region, (map.get(user.region) ?? 0) + 1)
    const catchAll = map.get('Boshqa') ?? 0
    map.delete('Boshqa')
    const sorted = [...map.entries()].sort((left, right) => right[1] - left[1])
    const top = sorted.slice(0, 5)
    const rest = sorted.slice(5).reduce((sum, [, count]) => sum + count, 0) + catchAll
    const rows = top.map(([name, count]) => ({ name, count }))
    if (rest > 0) rows.push({ name: 'Boshqa tumanlar', count: rest })
    return rows
  }, [users])

  const liveOlympiad = useMemo(() => olympiads.find((olympiad) => olympiad.status === 'live'), [olympiads])

  const liveMetrics = useMemo(() => {
    const now = MOCK_NOW.getTime()
    const day = 86_400_000
    const daysSince = (iso: string) => now - new Date(iso).getTime()
    const proUsers = users.filter((user) => user.plan === 'pro')
    return {
      proUsers: proUsers.length,
      todayActive: users.filter((user) => daysSince(user.lastSeenAt) < day).length,
      yesterdayActive: users.filter((user) => {
        const diff = daysSince(user.lastSeenAt)
        return diff >= day && diff < 2 * day
      }).length,
      weeklyNew: users.filter((user) => daysSince(user.createdAt) < 7 * day).length,
      monthlyNewPro: proUsers.filter((user) => daysSince(user.createdAt) < 30 * day).length,
    }
  }, [users])

  const packageDistribution = useMemo(() => {
    const counts: Record<PackageId, number> = { '1m': 0, '3m': 0, '1y': 0 }
    for (const user of users) {
      if (user.plan === 'pro' && user.planPackage) counts[user.planPackage] += 1
    }
    return [
      { key: '1m' as PackageId, label: '1 oylik', value: counts['1m'] },
      { key: '3m' as PackageId, label: '3 oylik', value: counts['3m'] },
      { key: '1y' as PackageId, label: '1 yillik', value: counts['1y'] },
    ]
  }, [users])

  const totalUsers = users.length
  const regionCount = useMemo(() => new Set(users.map((user) => user.region)).size, [users])
  const maxRegionCount = regions[0]?.count ?? 1
  const revenueTotal = revenue.reduce((sum, point) => sum + point.value, 0)

  const exportReport = () => {
    downloadCsv(`hdp-hisobot-${MOCK_NOW.toISOString().slice(0, 10)}.csv`, [
      ["Ko'rsatkich", 'Qiymat'],
      ['Jami foydalanuvchilar', totalUsers],
      ['Pro obunalar', liveMetrics.proUsers],
      ['Bu oy daromad', monthRevenue],
      ['Bugun faol', liveMetrics.todayActive],
      ['Bu hafta yangi', liveMetrics.weeklyNew],
      ['Hisobot sanasi', dateLong(MOCK_NOW)],
    ])
    toast({ title: 'Hisobot yuklandi', description: 'CSV fayl kompyuteringizga saqlandi.', tone: 'success' })
  }

  const axisTick = { fill: '#9a9488', fontSize: 10.5, fontFamily: 'var(--font-geist-sans)', fontWeight: 600 }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col overflow-hidden  ">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="h2 truncate text-ink">Bugungi holat</h1>
            <span className="hidden truncate text-[12px] text-ink-3 sm:inline">
              <span className="capitalize">{weekday(MOCK_NOW)}</span>, {dateLong(MOCK_NOW)} — platforma bir qarashda
            </span>
          </div>
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-ink px-3 font-geist text-[12.5px] font-bold text-white transition-colors hover:bg-brand active:translate-y-px sm:w-auto"
          >
            <Download className="h-4 w-4" strokeWidth={2.4} />
            Hisobot yuklab olish
          </button>
        </header>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-12 gap-3 overflow-y-auto overscroll-contain pb-1 pr-1 sm:gap-4">
          <Reveal className="relative col-span-12 overflow-hidden rounded-[22px] bg-ink p-5 text-white sm:p-6 lg:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <Eyebrow className="text-white/45">Jami o'quvchilar</Eyebrow>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-geist text-[11px] font-bold tabular text-white/85 ring-1 ring-white/10">
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />+{number(liveMetrics.weeklyNew)} bu hafta
              </span>
            </div>
            <p className="mt-3 font-geist text-[52px] font-extrabold leading-none tracking-[-0.045em] tabular sm:text-[62px]">
              {number(totalUsers)}
            </p>
            <div className="mt-5 h-[128px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ top: 6, right: 2, left: 2, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f1efe7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f1efe7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={['dataMin - 150', 'dataMax + 80']} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeDasharray: '4 4' }}
                    content={({ active, payload, label }: any) =>
                      active && payload?.length ? (
                        <ChartTip label={label} value={number(payload[0]?.value ?? 0)} sub="Jami o'quvchi" />
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#f1efe7"
                    strokeWidth={2.4}
                    fill="url(#hero-area)"
                    dot={false}
                    activeDot={{ r: 4, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5">
              <span className="text-[11.5px] font-medium text-white/45">O'sish dinamikasi</span>
              <RangeSwitch
                dark
                value={growthRange}
                onChange={setGrowthRange}
                options={[
                  { value: '7d', label: '7 kun' },
                  { value: '30d', label: '30 kun' },
                  { value: '3m', label: '3 oy' },
                  { value: '1y', label: '1 yil' },
                ]}
              />
            </div>
          </Reveal>

          {liveOlympiad ? (
            <Reveal
              delay={0.05}
              className="col-span-12 flex flex-col justify-between rounded-[22px] border border-line bg-white p-5 sm:col-span-6 sm:p-6 lg:col-span-3"
            >
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 font-geist text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-80" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                  </span>
                  Jonli efir
                </span>
                <h2 className="mt-4 font-geist text-[20px] font-bold leading-snug tracking-[-0.015em] text-ink">
                  {liveOlympiad.name}
                </h2>
                <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-ink-3">
                  {number(liveOlympiad.playing)} o'quvchi hozir ishlayapti
                </p>
              </div>
              <div className="mt-6">
                <p className="font-geist text-[46px] font-extrabold leading-none tracking-[-0.045em] tabular text-ink">
                  {liveOlympiad.left}
                  <span className="ml-2 font-geist text-[13px] font-bold tracking-normal text-ink-3">daqiqa</span>
                </p>
                <p className="mt-1.5 text-[11.5px] font-medium text-ink-3">
                  {number(liveOlympiad.registered)} ro'yxatdan o'tgan
                </p>
                <Link
                  href={`/admin/olympiads/${liveOlympiad.id}/live`}
                  className="group mt-4 flex h-12 w-full items-center justify-between rounded-[12px] bg-ink px-4 font-geist text-[14px] font-bold text-white transition-colors hover:bg-brand"
                >
                  Jonli kuzatish
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.6} />
                </Link>
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={0.1} className="col-span-12 grid grid-cols-3 gap-3 sm:col-span-6 lg:col-span-4 lg:grid-cols-1">
            <Tile
              label="Faol Pro obunalar"
              value={number(liveMetrics.proUsers)}
              caption={`+${number(liveMetrics.monthlyNewPro)} bu oy`}
            />
            <Tile
              label="Bugun faol"
              value={number(liveMetrics.todayActive)}
              caption={`${liveMetrics.todayActive >= liveMetrics.yesterdayActive ? '+' : '−'}${number(
                Math.abs(liveMetrics.todayActive - liveMetrics.yesterdayActive),
              )} kechaga`}
              tone={liveMetrics.todayActive >= liveMetrics.yesterdayActive ? 'up' : 'down'}
            />
            <Tile
              label="Bu hafta yangi"
              value={`+${number(liveMetrics.weeklyNew)}`}
              caption="o'quvchi qo'shildi"
            />
          </Reveal>

          <Reveal
            delay={0.15}
            className="col-span-12 rounded-[20px] border border-line bg-white p-5 sm:p-6 lg:col-span-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Eyebrow className="text-ink-3">Pul oqimi · bu oy</Eyebrow>
                <h2 className="mt-1.5 font-geist text-[18px] font-bold tracking-[-0.015em] text-ink">Daromad</h2>
              </div>
              <RangeSwitch
                value={revenueRange}
                onChange={setRevenueRange}
                options={[
                  { value: '3m', label: '3 oy' },
                  { value: '6m', label: '6 oy' },
                  { value: '1y', label: '1 yil' },
                ]}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1.5">
              <span className="font-geist text-[32px] font-extrabold leading-none tracking-[-0.035em] tabular text-ink sm:text-[38px]">
                {number(monthRevenue)}
                <span className="ml-1.5 text-[14px] font-bold tracking-normal text-ink-3">so'm</span>
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 font-geist text-[11px] font-bold tabular',
                  revenueTrend >= 0 ? 'bg-[#e9efdf] text-[#3f7a45]' : 'bg-[#fbe4da] text-[#c2410c]',
                )}
              >
                {revenueTrend >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.8} />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.8} />
                )}
                {percent(Math.abs(revenueTrend), 1)} o'tgan oyga
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] font-medium text-ink-3">
              Tanlangan davrda jami {money(revenueTotal)}
            </p>
            <div className="mt-3 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 10, right: 0, left: -22, bottom: 0 }} barCategoryGap="26%">
                  <CartesianGrid stroke="#f3f1ec" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Tooltip
                    cursor={{ fill: 'rgba(25,24,19,0.045)' }}
                    content={({ active, payload, label }: any) =>
                      active && payload?.length ? (
                        <ChartTip label={label} value={money(payload[0]?.value ?? 0)} sub="oylik tushum" />
                      ) : null
                    }
                  />
                  <Bar dataKey="value" radius={[7, 7, 7, 7]} isAnimationActive={false}>
                    {revenue.map((point, index) => (
                      <Cell
                        key={`${point.label}-${index}`}
                        fill={index === revenue.length - 1 ? ACCENT : INK}
                        fillOpacity={index === revenue.length - 1 ? 1 : 0.88}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          <Reveal
            delay={0.2}
            className="col-span-12 rounded-[20px] border border-line bg-white p-5 sm:col-span-6 sm:p-6 lg:col-span-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow className="text-ink-3">Kontent</Eyebrow>
                <h2 className="mt-1.5 font-geist text-[18px] font-bold tracking-[-0.015em] text-ink">
                  Eng ko'p o'qilgan
                </h2>
              </div>
              <AllLink href="/admin/content/topics" />
            </div>
            <ul className="mt-2">
              {topTopics.map((topic, index) => (
                <li
                  key={topic.id}
                  className="group flex items-center gap-3 border-t border-line-2 py-[9px] first:border-t-0"
                >
                  <span className="w-6 shrink-0 font-geist text-[12px] font-bold tabular text-placeholder transition-colors group-hover:text-brand">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink-2">{topic.name}</span>
                      <span className="shrink-0 font-geist text-[12px] font-bold tabular text-ink-3">
                        {number(topic.views)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(topic.views / maxTopicViews) * 100}%`,
                          background: index === 0 ? ACCENT : INK,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={0.25}
            className="col-span-12 rounded-[20px] border border-line bg-white p-5 sm:col-span-6 sm:p-6 lg:col-span-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow className="text-ink-3">Tariflar</Eyebrow>
                <h2 className="mt-1.5 font-geist text-[18px] font-bold tracking-[-0.015em] text-ink">
                  Obuna tarkibi
                </h2>
              </div>
            </div>
            <p className="mt-4 font-geist text-[34px] font-extrabold leading-none tracking-[-0.04em] tabular text-ink">
              {number(liveMetrics.proUsers)}
              <span className="ml-1.5 text-[11.5px] font-bold tracking-normal text-ink-3">faol Pro</span>
            </p>
            <div className="mt-4 flex h-9 gap-1">
              {packageDistribution.map((item, index) => {
                const share = (item.value / Math.max(1, liveMetrics.proUsers)) * 100
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-center rounded-full font-geist text-[10.5px] font-bold tabular text-white"
                    style={{ width: `${share}%`, background: packageTone[index % packageTone.length] }}
                    title={`${item.label}: ${number(item.value)}`}
                  >
                    {share >= 16 ? percent(share) : null}
                  </div>
                )
              })}
            </div>
            <ul className="mt-4 space-y-2.5">
              {packageDistribution.map((item, index) => (
                <li key={item.key} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ background: packageTone[index % packageTone.length] }}
                  />
                  <span className="flex-1 font-semibold text-ink-2">{item.label}</span>
                  <span className="font-geist font-bold tabular text-ink">{number(item.value)}</span>
                  <span className="w-9 text-right tabular text-ink-3">
                    {percent((item.value / Math.max(1, liveMetrics.proUsers)) * 100)}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={0.3}
            className="col-span-12 rounded-[20px] border border-line bg-white p-5 sm:p-6 lg:col-span-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow className="text-ink-3">Tranzaksiyalar</Eyebrow>
                <h2 className="mt-1.5 font-geist text-[18px] font-bold tracking-[-0.015em] text-ink">
                  So'nggi to'lovlar
                </h2>
              </div>
              <AllLink href="/admin/payments" />
            </div>
            <ul className="mt-2">
              {recentPayments.map((payment) => (
                <li
                  key={payment.id}
                  className="group flex items-center gap-3 border-t border-line-2 py-2.5 first:border-t-0"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted font-geist text-[12px] font-bold text-ink transition-colors group-hover:bg-ink group-hover:text-white">
                    {initials(payment.userName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{payment.userName}</p>
                    <p className="truncate text-[11.5px] font-medium text-ink-3">
                      {packageLabel[payment.packageId]} · {relative(payment.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-geist text-[13px] font-bold tabular text-ink">
                    {money(payment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={0.35}
            className="col-span-12 rounded-[20px] border border-line bg-white p-5 sm:p-6 lg:col-span-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow className="text-ink-3">Hududlar</Eyebrow>
                <h2 className="mt-1.5 font-geist text-[18px] font-bold tracking-[-0.015em] text-ink">
                  Tumanlar kesimi
                </h2>
              </div>
              <Link
                href="/admin/analytics"
                className="group inline-flex h-9 items-center gap-1 font-geist text-[13px] font-bold text-ink transition-colors hover:text-brand"
              >
                Xaritada
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.6} />
              </Link>
            </div>
            <ul className="mt-3.5 space-y-3">
              {regions.map((region) => {
                const share = (region.count / Math.max(1, totalUsers)) * 100
                return (
                  <li key={region.name} className="flex items-center gap-3">
                    <span className="w-[92px] shrink-0 truncate text-[12.5px] font-semibold text-ink-2">
                      {region.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(region.count / maxRegionCount) * 100}%`,
                          background: region.name === regions[0]?.name ? ACCENT : INK,
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right font-geist text-[11.5px] font-bold tabular text-ink-3">
                      {percent(share)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 border-t border-line-2 pt-3 text-[11.5px] font-medium text-ink-3">
              Jami {number(totalUsers)} o'quvchi · {regionCount} hudud
            </p>
          </Reveal>

          <div className="col-span-12 mt-1 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-line pb-1 pt-4">
            <span className="inline-flex items-center gap-2 font-geist text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Tizim holati
            </span>
            {systemStatus.map((service) => (
              <span key={service.name} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success/60" />
                {service.name}
                <span className="tabular text-placeholder">{service.uptime}</span>
              </span>
            ))}
            <Link
              href="/admin/system"
              className="group ml-auto inline-flex h-9 items-center gap-1.5 text-[12px] font-bold text-ink transition-colors hover:text-brand"
            >
              Batafsil
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.6} />
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
