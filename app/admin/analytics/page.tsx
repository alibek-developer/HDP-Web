'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock,
  Download,
  FileQuestion,
  Flame,
  Gauge,
  Gem,
  MapPin,
  Minus,
  Percent,
  Target,
  TrendingDown,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  CountUp,
  Field,
  Input,
  Modal,
  ProgressBar,
  SectionCard,
  Segmented,
  cn,
  useToast,
} from '@/components/ui'
import {
  DistributionBarChart,
  DonutChart,
  FunnelChart,
  Heatmap,
  NewVsTotalChart,
  RankingBars,
  RevenueChart,
  Sparkline,
} from '@/components/charts'
import { KhorezmDistricts } from '@/components/analytics/KhorezmDistricts'
import { useAppStore } from '@/lib/store'
import { cohortMatrix, sessionDistribution } from '@/lib/mock'
import { methodDistribution, revenueSeries } from '@/lib/series'
import { GEO_PRO_SHARE, GEO_REGIONS, GEO_TOTAL } from '@/lib/geo'
import {
  MOCK_NOW,
  dateInput,
  dateLong,
  downloadCsv,
  money,
  number,
  percent,
} from '@/lib/format'

type AnalyticsTab = 'users' | 'content' | 'finance' | 'geo'
type Period = 'today' | '7d' | '30d' | '3m' | 'custom'

const DAY = 86_400_000
const HOUR = 3_600_000
const pad = (value: number) => String(value).padStart(2, '0')
const shortDate = (ms: number) => {
  const date = new Date(ms)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`
}

const TABS: Array<{ value: AnalyticsTab; label: string; short: string; icon: LucideIcon }> = [
  { value: 'users', label: 'Foydalanuvchilar', short: 'Faol', icon: Users },
  { value: 'content', label: 'Kontent', short: 'Kontent', icon: BookOpen },
  { value: 'finance', label: 'Moliya', short: 'Moliya', icon: Wallet },
  { value: 'geo', label: 'Geografiya', short: 'Hudud', icon: MapPin },
]

const METHOD_LABEL: Record<string, string> = {
  payme: 'Payme',
  click: 'Click',
  uzum: 'Uzum',
  uzcard: 'Uzcard',
}

const COHORT_ROWS = Array.from({ length: 8 }, (_, index) => `Hafta ${index + 1}`)
const COHORT_COLS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']

function KpiCard({
  icon: Icon,
  iconClass,
  label,
  children,
  foot,
}: {
  icon: LucideIcon
  iconClass: string
  label: string
  children: ReactNode
  foot?: ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-line bg-white p-3 shadow-card">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
        <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-[6px]', iconClass)}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 text-[20px] font-geist leading-none tabular-nums text-ink">
        {children}
      </div>
      {foot ? <div className="mt-1.5">{foot}</div> : null}
    </div>
  )
}

function Delta({ tone, children }: { tone: 'up' | 'down' | 'flat'; children: ReactNode }) {
  const cls =
    tone === 'up'
      ? 'bg-success-bg text-success'
      : tone === 'down'
        ? 'bg-error-bg text-error'
        : 'bg-muted text-ink-3'
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  )
}

export default function AnalyticsPage() {
  const users = useAppStore((state) => state.users)
  const topics = useAppStore((state) => state.topics)
  const subjects = useAppStore((state) => state.subjects)
  const tests = useAppStore((state) => state.tests)
  const transactions = useAppStore((state) => state.transactions)
  const { toast } = useToast()

  const [tab, setTab] = useState<AnalyticsTab>('users')
  const [period, setPeriod] = useState<Period>('7d')
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState({
    from: dateInput(MOCK_NOW.getTime() - 30 * DAY),
    to: dateInput(MOCK_NOW),
  })

  const totalUsers = users.length
  const proUsers = users.filter((user) => user.plan === 'pro').length

  const activity = useMemo(() => {
    const registered = users
      .map((user) => new Date(user.createdAt).getTime())
      .sort((left, right) => left - right)

    const countUpTo = (cutoff: number) => {
      let low = 0
      let high = registered.length
      while (low < high) {
        const middle = (low + high) >> 1
        if (registered[middle] <= cutoff) low = middle + 1
        else high = middle
      }
      return low
    }

    if (period === 'today') {
      const end = MOCK_NOW.getTime()
      const start = end - DAY
      return Array.from({ length: 12 }, (_, index) => {
        const from = start + index * 2 * HOUR
        const to = from + 2 * HOUR
        return {
          label: `${pad(new Date(to).getHours())}:00`,
          newUsers: registered.filter((value) => value >= from && value < to).length,
          total: countUpTo(to),
        }
      })
    }

    let points = 10
    let spanDays = 30
    let end = MOCK_NOW.getTime()
    if (period === '7d') {
      points = 7
      spanDays = 7
    } else if (period === '30d') {
      points = 10
      spanDays = 30
    } else if (period === '3m') {
      points = 12
      spanDays = 90
    } else {
      const from = new Date(`${custom.from}T00:00:00`).getTime()
      const to = new Date(`${custom.to}T23:59:59`).getTime()
      const valid = Number.isFinite(from) && Number.isFinite(to) && to > from
      const start = valid ? from : end - 30 * DAY
      end = valid ? to : end
      spanDays = Math.max(1, Math.round((end - start) / DAY))
      points = Math.min(18, Math.max(3, spanDays))
    }

    const start = end - spanDays * DAY
    return Array.from({ length: points }, (_, index) => {
      const cutoff = start + (index / (points - 1)) * (end - start)
      const previousCutoff =
        index === 0 ? start - DAY : start + ((index - 1) / (points - 1)) * (end - start)
      return {
        label: shortDate(cutoff),
        newUsers: registered.filter((value) => value > previousCutoff && value <= cutoff).length,
        total: countUpTo(cutoff),
      }
    })
  }, [users, period, custom])

  const newUserSpark = useMemo(() => activity.map((point) => point.newUsers), [activity])

  const journey = [
    { label: 'Kirdi', value: totalUsers },
    { label: "Dars ko'rdi", value: Math.round(totalUsers * 0.72) },
    { label: 'Test yechdi', value: Math.round(totalUsers * 0.499) },
    { label: 'Pro oldi', value: proUsers },
  ]

  const activeTopics = useMemo(() => topics.filter((topic) => topic.status === 'active'), [topics])
  const visibleTests = useMemo(
    () => tests.filter((test) => test.status !== 'hidden'),
    [tests],
  )

  const engagement = useMemo(() => {
    const now = MOCK_NOW.getTime()
    const daysSince = (iso: string) => now - new Date(iso).getTime()
    const oldUsers = users.filter((user) => daysSince(user.createdAt) >= 30 * DAY)
    const churned = oldUsers.filter((user) => daysSince(user.lastSeenAt) >= 30 * DAY).length
    const totalViews = activeTopics.reduce((sum, topic) => sum + topic.views, 0)
    const weightedMinutes = activeTopics.reduce((sum, topic) => sum + topic.avgMinutes * topic.views, 0)
    const cohortAvg = cohortMatrix.flat().reduce((sum, value) => sum + value, 0) / Math.max(1, cohortMatrix.flat().length)
    return {
      dau: users.filter((user) => daysSince(user.lastSeenAt) < DAY).length,
      yesterday: users.filter((user) => {
        const diff = daysSince(user.lastSeenAt)
        return diff >= DAY && diff < 2 * DAY
      }).length,
      mau: users.filter((user) => daysSince(user.lastSeenAt) < 30 * DAY).length,
      churn: oldUsers.length ? (churned / oldUsers.length) * 100 : 0,
      avgSession: totalViews > 0 ? Math.round(weightedMinutes / totalViews) : 0,
      retention: cohortAvg,
    }
  }, [users, activeTopics])

  const lifetime = useMemo(() => {
    const paid = transactions.filter((transaction) => transaction.status === 'success')
    const total = paid.reduce((sum, transaction) => sum + transaction.amount, 0)
    const payingUsers = new Set(paid.map((transaction) => transaction.userId)).size
    return {
      revenue: total,
      payingUsers,
      ltv: payingUsers > 0 ? total / payingUsers : 0,
      payingShare: totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0,
    }
  }, [transactions, totalUsers])

  const topTopics = useMemo(
    () => [...activeTopics].sort((left, right) => right.views - left.views).slice(0, 10),
    [activeTopics],
  )

  const subjectName = (id: string) =>
    subjects.find((subject) => subject.id === id)?.nameUz ?? '—'
  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? '—'

  const hardestTests = useMemo(
    () => [...visibleTests].sort((left, right) => right.errorRate - left.errorRate).slice(0, 6),
    [visibleTests],
  )

  const avgTopicScore = topTopics.length
    ? topTopics.reduce((sum, topic) => sum + topic.avgScore, 0) / topTopics.length
    : 0

  const lessonSteps = [
    { label: '1-dars', value: totalUsers },
    { label: '2-dars', value: Math.round(totalUsers * 0.85) },
    { label: '3-dars', value: Math.round(totalUsers * 0.58) },
    { label: '4-dars', value: Math.round(totalUsers * 0.41) },
    { label: '5-dars', value: Math.round(totalUsers * 0.3) },
  ]
  const biggestDrop =
    ((lessonSteps[1].value - lessonSteps[2].value) / Math.max(1, lessonSteps[1].value)) * 100

  const revenue = useMemo(() => revenueSeries('6m'), [])

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
      growth: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    }
  }, [transactions])

  const packages = useMemo(
    () => [
      {
        key: '1m',
        label: '1 oylik',
        value: users.filter((user) => user.plan === 'pro' && user.planPackage === '1m').length,
        color: '#f4764f',
      },
      {
        key: '3m',
        label: '3 oylik',
        value: users.filter((user) => user.plan === 'pro' && user.planPackage === '3m').length,
        color: '#e8522a',
      },
      {
        key: '1y',
        label: '1 yillik',
        value: users.filter((user) => user.plan === 'pro' && user.planPackage === '1y').length,
        color: '#a83618',
      },
    ],
    [users],
  )
  const packageTotal = packages.reduce((sum, item) => sum + item.value, 0)

  const methods = useMemo(
    () =>
      [...methodDistribution]
        .sort((left, right) => right.share - left.share)
        .map((item) => ({
          label: METHOD_LABEL[item.method] ?? item.method,
          value: item.share,
          hint: `${number(item.count)} ta`,
        })),
    [],
  )

  const exportReport = () => {
    const rows: Array<Array<string | number>> = []
    if (tab === 'users') {
      rows.push(
        ['Ko\'rsatkich', 'Qiymat'],
        ['Davr', period],
        ['DAU', engagement.dau],
        ['MAU', engagement.mau],
        ['Retention (7 kun)', `${engagement.retention.toFixed(1)}%`],
        ["O'rtacha sessiya", `${engagement.avgSession} daq`],
        ['Churn rate', `${engagement.churn.toFixed(1)}%`],
      )
      rows.push([], ['Sana', 'Yangi', 'Jami'])
      for (const point of activity) rows.push([point.label, point.newUsers, point.total])
    } else if (tab === 'content') {
      rows.push(['Mavzu', 'Fan', "Ko'rishlar", "O'rtacha vaqt (daq)", 'Test ball (/10)'])
      for (const topic of topTopics) {
        rows.push([topic.name, subjectName(topic.subjectId), topic.views, topic.avgMinutes, topic.avgScore])
      }
      rows.push([], ['Test', 'Mavzu', 'Xato (%)', 'Ko\'p xato variant'])
      for (const test of hardestTests) {
        rows.push([test.question, topicName(test.topicId), test.errorRate, test.topWrong.toUpperCase()])
      }
    } else if (tab === 'finance') {
      rows.push(
        ['Ko\'rsatkich', 'Qiymat'],
        ['Bu oy daromad', finance.current],
        ["O'tgan oy daromad", finance.previous],
        ["O'sish (%)", finance.growth.toFixed(1)],
        ['LTV', Math.round(lifetime.ltv)],
        ["To'lovchilar", lifetime.payingUsers],
      )
      rows.push([], ['Paket', 'Soni', 'Ulush (%)'])
      for (const item of packages) {
        rows.push([item.label, item.value, ((item.value / Math.max(1, packageTotal)) * 100).toFixed(1)])
      }
      rows.push([], ['To\'lov usuli', 'Ulush (%)'])
      for (const method of methods) rows.push([method.label, method.value.toFixed(1)])
    } else {
      rows.push(['Tuman', 'Foydalanuvchilar', 'Pro (%)', "O'sish (%)"])
      for (const region of GEO_REGIONS) {
        rows.push([region.name, region.users, region.proPercent, region.growth])
      }
    }

    downloadCsv(`hdp-analitika-${tab}-${dateInput(MOCK_NOW)}.csv`, rows)
    toast({ title: 'Hisobot yuklandi', description: 'CSV fayl kompyuteringizga saqlandi.' })
  }

  const applyCustom = () => {
    const from = new Date(`${custom.from}T00:00:00`).getTime()
    const to = new Date(`${custom.to}T23:59:59`).getTime()
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
      toast({
        title: "Noto'g'ri davr",
        description: 'Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak.',
        tone: 'error',
      })
      return
    }
    setPeriod('custom')
    setCustomOpen(false)
    toast({ title: 'Davr qo\'llanildi', description: `${custom.from} — ${custom.to}` })
  }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3.5  [@media(max-height:720px)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="h2 truncate text-ink">Analitika</h1>
            <Badge tone="brand" dot>
              Live
            </Badge>
            <span className="hidden truncate text-[12px] text-ink-3 md:inline">
              {dateLong(MOCK_NOW)} · Platforma bo'yicha chuqur tahlil
            </span>
          </div>
          <Button variant="secondary" onClick={exportReport} className="h-9">
            <Download className="h-4 w-4" />
            <span className="max-[360px]:hidden">Eksport CSV</span>
          </Button>
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto" role="tablist" aria-label="Analitika bo'limlari">
          {TABS.map((item) => {
            const Icon = item.icon
            const active = tab === item.value
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.value)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold transition',
                  active ? 'bg-ink text-white shadow-sm' : 'text-ink-3 hover:bg-muted hover:text-ink',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [contain:paint]">
          <div className="h-full space-y-2.5 sm:space-y-3.5">
            {tab === 'users' ? (
              <>
                <div className="flex flex-col gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 shadow-card sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">
                    <CalendarDays className="h-3.5 w-3.5" /> Davr
                  </span>
                  <div className="min-w-0 flex-1 sm:order-3 md:order-2">
                    <Segmented
                      className="w-full overflow-x-auto"
                      value={period}
                      onChange={(value) => {
                        setPeriod(value as Period)
                        if (value === 'custom') setCustomOpen(true)
                      }}
                      options={[
                        { value: 'today', label: 'Bugun' },
                        { value: '7d', label: '7 kun' },
                        { value: '30d', label: '30 kun' },
                        { value: '3m', label: '3 oy' },
                        { value: 'custom', label: 'Maxsus' },
                      ]}
                    />
                  </div>
                  <div className="hidden w-28 shrink-0 md:order-3 md:block">
                    <Sparkline data={newUserSpark} color="#e8522a" height={30} />
                    <p className="mt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                      Yangi trend
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
                  <KpiCard
                    icon={Flame}
                    iconClass="bg-error-bg text-error"
                    label="DAU (kunlik faol)"
                    foot={
                      <Delta tone={engagement.dau >= engagement.yesterday ? 'up' : 'down'}>
                        {engagement.dau >= engagement.yesterday ? '+' : '−'}
                        {number(Math.abs(engagement.dau - engagement.yesterday))} kechaga nisbatan
                      </Delta>
                    }
                  >
                    <CountUp value={engagement.dau} format={number} />
                  </KpiCard>
                  <KpiCard
                    icon={Users}
                    iconClass="bg-brand-soft text-brand"
                    label="MAU (oylik faol)"
                    foot={<span className="text-[10.5px] font-semibold text-ink-3">Oxirgi 30 kunda kirganlar</span>}
                  >
                    <CountUp value={engagement.mau} format={number} />
                  </KpiCard>
                  <KpiCard
                    icon={Target}
                    iconClass="bg-info-bg text-info"
                    label="Retention (7 kun)"
                    foot={<span className="text-[10.5px] font-semibold text-ink-3">Kogorta bo'yicha qaytish</span>}
                  >
                    <CountUp value={engagement.retention} suffix="%" />
                  </KpiCard>
                  <KpiCard
                    icon={Clock}
                    iconClass="bg-[#ede9fe] text-[#6d28d9]"
                    label="O'rtacha sessiya"
                    foot={<span className="text-[10.5px] font-semibold text-ink-3">Bir sessiyadagi o'rtacha vaqt</span>}
                  >
                    <span className="flex items-baseline gap-1">
                      <CountUp value={engagement.avgSession} />
                      <span className="text-[13px] font-bold text-ink-3">daq</span>
                    </span>
                  </KpiCard>
                  <KpiCard
                    icon={TrendingDown}
                    iconClass="bg-warning-bg text-warning"
                    label="Churn rate"
                    foot={
                      <span className="text-[10.5px] font-semibold text-ink-3">
                        30 kunda kirmaganlar ulushi
                      </span>
                    }
                  >
                    <CountUp value={engagement.churn} format={(value) => percent(value, 1)} />
                  </KpiCard>
                </div>

                <SectionCard
                  title="Foydalanuvchilar o'sishi"
                  subtitle="Kunlik yangi ro'yxatdan o'tishlar va jami foydalanuvchilar"
                  action={
                    <div className="flex items-center gap-3 text-[11px] font-medium text-ink-3">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Yangi
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-brand" /> Jami
                      </span>
                    </div>
                  }
                >
                  <NewVsTotalChart data={activity} />
                </SectionCard>

                <div className="grid gap-2.5 sm:gap-3.5 xl:grid-cols-5">
                  <SectionCard
                    className="xl:col-span-3"
                    title="Retention cohort"
                    subtitle="Ro'yxatdan o'tgan hafta bo'yicha 7-kunlik qaytish (%)"
                    action={<Badge tone="success" dot>{percent(engagement.retention, 0)} o'rtacha</Badge>}
                  >
                    <Heatmap matrix={cohortMatrix} rows={COHORT_ROWS} cols={COHORT_COLS} />
                  </SectionCard>

                  <SectionCard
                    className="xl:col-span-2"
                    title="Foydalanuvchi yo'li"
                    subtitle="Kirdi → Dars ko'rdi → Test yechdi → Pro oldi"
                  >
                    <FunnelChart steps={journey} />
                    <p className="mt-3 rounded-[10px] bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
                      Pro konversiya:{' '}
                      <span className="font-semibold text-ink">
                        {percent((journey[3].value / Math.max(1, journey[0].value)) * 100, 1)}
                      </span>{' '}
                      — har {number(Math.round(totalUsers / Math.max(1, proUsers)))} foydalanuvchidan
                      bittasi.
                    </p>
                  </SectionCard>
                </div>

                <SectionCard
                  title="Sessiya uzunligi taqsimoti"
                  subtitle="Foydalanuvchilar bir sessiyada qancha vaqt o'tkazadi"
                  action={
                    <Badge tone="brand" dot>
                      {number(sessionDistribution.reduce((sum, item) => sum + item.value, 0))} sessiya
                    </Badge>
                  }
                >
                  <DistributionBarChart
                    data={sessionDistribution}
                    height={200}
                    tooltipLabel="Sessiyalar"
                    yFormatter={(value) => number(value)}
                  />
                </SectionCard>
              </>
            ) : null}

            {tab === 'content' ? (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <KpiCard icon={BookOpen} iconClass="bg-brand-soft text-brand" label="Faol mavzular">
                    <CountUp value={activeTopics.length} />
                  </KpiCard>
                  <KpiCard icon={FileQuestion} iconClass="bg-info-bg text-info" label="Ko'rinadigan testlar">
                    <CountUp value={visibleTests.length} />
                  </KpiCard>
                  <KpiCard icon={Target} iconClass="bg-success-bg text-success" label="O'rtacha ball">
                    <span className="flex items-baseline gap-1">
                      <CountUp value={avgTopicScore} format={(value) => value.toFixed(1)} />
                      <span className="text-[13px] font-bold text-ink-3">/10</span>
                    </span>
                  </KpiCard>
                </div>

                <div className="grid gap-2.5 sm:gap-3.5 xl:grid-cols-[1.15fr_1fr]">
                  <SectionCard
                    title="Top 10 mavzu"
                    subtitle="Ko'rishlar soni bo'yicha eng ommabop mavzular"
                    action={<Badge tone="brand" dot>{number(totalUsers)} foydalanuvchi bazasi</Badge>}
                  >
                    <ol className="divide-y divide-line-2">
                      {topTopics.map((topic, index) => (
                        <li key={topic.id} className="flex items-center gap-2.5 py-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-muted text-[10.5px] font-bold text-ink-3">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-ink">
                              {topic.name}
                            </p>
                            <p className="text-[10.5px] text-ink-3">
                              {subjectName(topic.subjectId)} · {topic.avgMinutes} daq
                            </p>
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{
                                  width: `${(topic.views / Math.max(1, topTopics[0]?.views ?? 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[12px] font-semibold tabular-nums text-ink">
                              {number(topic.views)}
                            </p>
                            <Badge
                              tone={
                                topic.avgScore >= 7 ? 'success' : topic.avgScore >= 5.5 ? 'warning' : 'danger'
                              }
                              className="mt-0.5"
                            >
                              {topic.avgScore.toFixed(1)}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </SectionCard>

                  <div className="flex min-w-0 flex-col gap-2.5 sm:gap-3.5">
                    <SectionCard
                      title="Eng qiyin testlar"
                      subtitle="Noto'g'ri javob foizi bo'yicha"
                      action={<Badge tone="danger" dot>Top {hardestTests.length}</Badge>}
                    >
                      <ol className="divide-y divide-line-2">
                        {hardestTests.map((test) => (
                          <li key={test.id} className="space-y-1 py-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-[12px] font-medium text-ink">
                                {test.question}
                              </p>
                              <Badge
                                tone={test.errorRate >= 60 ? 'danger' : test.errorRate >= 40 ? 'warning' : 'gray'}
                                className="shrink-0"
                              >
                                {percent(test.errorRate, 0)}
                              </Badge>
                            </div>
                            <p className="text-[10.5px] text-ink-3">{topicName(test.topicId)}</p>
                            <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
                              <span className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded bg-error-bg text-[9.5px] font-bold text-error">
                                {test.topWrong.toUpperCase()}
                              </span>
                              <span className="truncate">{test.options[test.topWrong]}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </SectionCard>

                    <SectionCard
                      title="Darslardan chiqib ketish"
                      subtitle="Darslar bo'yicha ketma-ket o'tish funneli"
                    >
                      <div className="mb-3 flex items-start gap-2 rounded-[10px] bg-warning-bg px-3 py-2.5 text-[12px] text-[#92400e]">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>
                          Eng katta yo'qotish{' '}
                          <span className="font-bold">2-darsdan 3-darsga</span> o'tishda —{' '}
                          <span className="font-bold">{percent(biggestDrop, 0)}</span>.
                        </p>
                      </div>
                      <FunnelChart steps={lessonSteps} />
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-3">
                        <BookOpen className="h-3.5 w-3.5" />
                        Kursni to'liq tugatganlar:{' '}
                        <span className="font-semibold text-ink">
                          {percent((lessonSteps[4].value / Math.max(1, lessonSteps[0].value)) * 100, 0)}
                        </span>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </>
            ) : null}

            {tab === 'finance' ? (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <KpiCard
                    icon={Wallet}
                    iconClass="bg-coin-bg text-coin"
                    label="Bu oy daromad"
                    foot={
                      <Delta tone="up">+{percent(finance.growth, 1)} o'tgan oyga nisbatan</Delta>
                    }
                  >
                    <span className="flex items-baseline gap-1">
                      <CountUp value={finance.current} format={number} />
                      <span className="text-[11px] font-bold text-ink-3">so'm</span>
                    </span>
                  </KpiCard>
                  <KpiCard
                    icon={Gauge}
                    iconClass="bg-info-bg text-info"
                    label="O'tgan oy daromad"
                    foot={
                      <span className="text-[10.5px] font-semibold text-ink-3">
                        {money(finance.current - finance.previous)} farq
                      </span>
                    }
                  >
                    <span className="flex items-baseline gap-1">
                      <CountUp value={finance.previous} format={number} />
                      <span className="text-[11px] font-bold text-ink-3">so'm</span>
                    </span>
                  </KpiCard>
                  <KpiCard
                    icon={Percent}
                    iconClass="bg-success-bg text-success"
                    label="O'sish"
                    foot={
                      <span className="text-[10.5px] font-semibold text-ink-3">
                        {money(finance.current - finance.previous)} ortiq
                      </span>
                    }
                  >
                    <CountUp value={finance.growth} format={(value) => `+${percent(value, 1)}`} />
                  </KpiCard>
                </div>

                <div className="grid gap-2.5 sm:gap-3.5 xl:grid-cols-3">
                  <SectionCard
                    className="xl:col-span-2"
                    title="Daromad dinamikasi"
                    subtitle="Oylik muvaffaqiyatli to'lovlar"
                    action={
                      <Badge tone="brand" dot>
                        {money(revenue.reduce((sum, point) => sum + point.value, 0))}
                      </Badge>
                    }
                  >
                    <RevenueChart data={revenue} />
                  </SectionCard>

                  <SectionCard title="Paket taqsimoti" subtitle="Faol Pro obunalar bo'yicha">
                    <DonutChart
                      data={packages.map((item) => ({ label: item.label, value: item.value, color: item.color }))}
                      centerLabel="Jami"
                      centerValue={number(packageTotal)}
                    />
                    <ul className="mt-3 space-y-1.5">
                      {packages.map((item) => (
                        <li key={item.key} className="flex items-center gap-2 text-[11.5px]">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                          <span className="flex-1 text-ink-2">{item.label}</span>
                          <span className="font-semibold tabular-nums text-ink">{number(item.value)}</span>
                          <span className="w-10 text-right tabular-nums text-ink-3">
                            {percent((item.value / Math.max(1, packageTotal)) * 100, 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                </div>

                <div className="grid gap-2.5 sm:gap-3.5 xl:grid-cols-2">
                  <SectionCard title="To'lov usullari" subtitle="Muvaffaqiyatli tranzaksiyalar ulushi">
                    <RankingBars data={methods} valueFormatter={(value) => percent(value, 0)} />
                    <div className="mt-3 flex items-center gap-1.5 rounded-[10px] bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
                      <Gem className="h-3.5 w-3.5 text-coin" />
                      Eng ommabop usul —{' '}
                      <span className="font-semibold text-ink">{methods[0]?.label ?? '—'}</span>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Mijoz qiymati"
                    subtitle="Muvaffaqiyatli to'lovlar asosida"
                    action={<Badge tone="success" dot>{number(lifetime.payingUsers)} to'lovchi</Badge>}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[12px] bg-coin-bg/60 px-3 py-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#92400e]">
                          LTV
                        </p>
                        <p className="mt-1 font-display text-[20px] font-extrabold tabular-nums text-ink">
                          {money(Math.round(lifetime.ltv))}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-ink-3">Bir to'lovchiga o'rtacha</p>
                      </div>
                      <div className="rounded-[12px] bg-canvas px-3 py-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                          To'lovchilar
                        </p>
                        <p className="mt-1 font-display text-[20px] font-extrabold tabular-nums text-ink">
                          {percent(lifetime.payingShare, 1)}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-ink-3">Jami foydalanuvchidan</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-[10px] bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
                      <span className="font-semibold text-ink">{number(lifetime.payingUsers)}</span>{' '}
                      foydalanuvchi to'lov qilgan, jami{' '}
                      <span className="font-semibold text-success">{money(lifetime.revenue)}</span>{' '}
                      tushum.
                    </div>
                  </SectionCard>
                </div>
              </>
            ) : null}

            {tab === 'geo' ? (
              <div className="flex flex-col gap-2.5 sm:gap-3.5 xl:h-full xl:min-h-0">
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                  <KpiCard icon={MapPin} iconClass="bg-brand-soft text-brand" label="Tumanlar">
                    <CountUp value={GEO_REGIONS.length} />
                  </KpiCard>
                  <KpiCard icon={Users} iconClass="bg-info-bg text-info" label="Jami foydalanuvchi">
                    <span data-geo-total>
                      <CountUp value={GEO_TOTAL} format={number} />
                    </span>
                  </KpiCard>
                  <KpiCard
                    icon={Flame}
                    iconClass="bg-error-bg text-error"
                    label="Eng faol tuman"
                  >
                    <span className="truncate text-[16px]">{GEO_REGIONS[0]?.name}</span>
                  </KpiCard>
                  <KpiCard
                    icon={Gem}
                    iconClass="bg-coin-bg text-coin"
                    label="O'rtacha Pro ulushi"
                  >
                    <span data-geo-pro>
                      <CountUp value={GEO_PRO_SHARE} format={(value) => percent(value, 1)} />
                    </span>
                  </KpiCard>
                </div>

                <div className="grid gap-2.5 sm:gap-3.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[1.35fr_1fr] xl:grid-rows-[minmax(0,1fr)]">
                  <SectionCard
                    title="Xorazm xaritasi"
                    subtitle="Tumanlar bo'yicha foydalanuvchilar zichligi — hududni tanlang"
                    action={<Badge tone="brand" dot className="max-sm:hidden">Xorazm viloyati</Badge>}
                    className="xl:flex xl:min-h-0 xl:flex-col"
                    bodyClassName="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col"
                  >
                    <KhorezmDistricts />
                  </SectionCard>

                  <SectionCard
                    title="Tumanlar reytingi"
                    subtitle="Foydalanuvchilar, Pro ulushi va o'sish"
                    action={<Badge tone="gray">{GEO_REGIONS.length} tuman</Badge>}
                    className="xl:flex xl:min-h-0 xl:flex-col"
                    bodyClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto"
                  >
                    <ol className="divide-y divide-line-2">
                      {GEO_REGIONS.map((region, index) => (
                        <li key={region.name} className="flex items-center gap-2.5 py-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-muted text-[10.5px] font-bold text-ink-3">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-ink">
                              {region.name}
                            </p>
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-info"
                                style={{
                                  width: `${(region.users / Math.max(1, GEO_REGIONS[0]?.users ?? 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[12px] font-semibold tabular-nums text-ink">
                              {number(region.users)}
                            </p>
                            <p className="text-[10px] text-ink-3">
                              Pro {percent(region.proPercent, 1)} ·{' '}
                              <span className="font-semibold text-success">
                                +{percent(region.growth, 1)}
                              </span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </SectionCard>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Modal
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          title="Maxsus davr"
          description="Analitika uchun sana oralig'ini tanlang"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setCustomOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={applyCustom}>Qo'llash</Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dan" required>
              <Input
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(event) => setCustom({ ...custom, from: event.target.value })}
              />
            </Field>
            <Field label="Gacha" required>
              <Input
                type="date"
                value={custom.to}
                min={custom.from}
                onChange={(event) => setCustom({ ...custom, to: event.target.value })}
              />
            </Field>
          </div>
        </Modal>
      </div>
    </PageTransition>
  )
}
