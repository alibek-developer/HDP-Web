'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock,
  Download,
  Flame,
  Gauge,
  Gem,
  MapPin,
  Percent,
  Target,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader, PageTransition, Stagger, StaggerItem } from '@/components/layout/Page'
import {
  Badge,
  Button,
  Card,
  CountUp,
  Field,
  Input,
  Modal,
  ProgressBar,
  SectionCard,
  Segmented,
  StatCard,
  Tabs,
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
} from '@/components/charts'
import { UzbekistanMap } from '@/components/analytics/UzbekistanMap'
import { useAppStore } from '@/lib/store'
import { cohortMatrix, metrics, sessionDistribution } from '@/lib/mock'
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

const METHOD_LABEL: Record<string, string> = {
  payme: 'Payme',
  click: 'Click',
  uzum: 'Uzum',
  uzcard: 'Uzcard',
}

const COHORT_ROWS = Array.from({ length: 8 }, (_, index) => `Hafta ${index + 1}`)
const COHORT_COLS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']

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
      const previousCutoff = index === 0 ? start - DAY : start + ((index - 1) / (points - 1)) * (end - start)
      return {
        label: shortDate(cutoff),
        newUsers: registered.filter((value) => value > previousCutoff && value <= cutoff).length,
        total: countUpTo(cutoff),
      }
    })
  }, [users, period, custom])

  const journey = [
    { label: 'Kirdi', value: totalUsers },
    { label: "Dars ko'rdi", value: Math.round(totalUsers * 0.72) },
    { label: 'Test yechdi', value: Math.round(totalUsers * 0.499) },
    { label: 'Pro oldi', value: proUsers || metrics.proUsers },
  ]

  const topTopics = useMemo(
    () =>
      [...topics]
        .filter((topic) => topic.status === 'active')
        .sort((left, right) => right.views - left.views)
        .slice(0, 10),
    [topics],
  )

  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.nameUz ?? '—'
  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? '—'

  const hardestTests = useMemo(
    () =>
      [...tests]
        .filter((test) => test.status !== 'hidden')
        .sort((left, right) => right.errorRate - left.errorRate)
        .slice(0, 8),
    [tests],
  )

  const lessonSteps = [
    { label: '1-dars', value: totalUsers },
    { label: '2-dars', value: Math.round(totalUsers * 0.85) },
    { label: '3-dars', value: Math.round(totalUsers * 0.58) },
    { label: '4-dars', value: Math.round(totalUsers * 0.41) },
    { label: '5-dars', value: Math.round(totalUsers * 0.3) },
  ]
  const biggestDrop = ((lessonSteps[1].value - lessonSteps[2].value) / Math.max(1, lessonSteps[1].value)) * 100

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
        color: '#22C55E',
      },
      {
        key: '3m',
        label: '3 oylik',
        value: users.filter((user) => user.plan === 'pro' && user.planPackage === '3m').length,
        color: '#16A34A',
      },
      {
        key: '1y',
        label: '1 yillik',
        value: users.filter((user) => user.plan === 'pro' && user.planPackage === '1y').length,
        color: '#14532D',
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
        ['DAU', metrics.todayActive],
        ['MAU', 24_180],
        ['Retention (7 kun)', '68%'],
        ["O'rtacha sessiya", '24 daq'],
        ['Churn rate', '8.2%'],
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
        ['LTV', 184_000],
        ['CAC', 12_000],
      )
      rows.push([], ['Paket', 'Soni', 'Ulush (%)'])
      for (const item of packages) {
        rows.push([item.label, item.value, ((item.value / Math.max(1, packageTotal)) * 100).toFixed(1)])
      }
      rows.push([], ['To\'lov usuli', 'Ulush (%)'])
      for (const method of methods) rows.push([method.label, method.value.toFixed(1)])
    } else {
      rows.push(['Viloyat', 'Foydalanuvchilar', 'Pro (%)', "O'sish (%)"])
      for (const region of GEO_REGIONS) {
        rows.push([region.name, region.users, region.proPercent, region.growth])
      }
    }

    downloadCsv(`hdp-analitika-${tab}-${dateInput(MOCK_NOW)}.csv`, rows)
    toast({ title: 'Hisobot yuklandi', description: 'CSV fayl kompyuteringizga saqlandi.', tone: 'success' })
  }

  const applyCustom = () => {
    const from = new Date(`${custom.from}T00:00:00`).getTime()
    const to = new Date(`${custom.to}T23:59:59`).getTime()
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
      toast({ title: "Noto'g'ri davr", description: 'Tugash sanasi boshlanish sanasidan keyin bo’lishi kerak.', tone: 'error' })
      return
    }
    setPeriod('custom')
    setCustomOpen(false)
    toast({ title: 'Davr qo’llanildi', description: `${custom.from} — ${custom.to}`, tone: 'success' })
  }

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Analitika <Badge tone="brand">Live</Badge>
          </span>
        }
        subtitle={`${dateLong(MOCK_NOW)} · Platforma bo'yicha chuqur tahlil`}
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Analitika' }]}
        actions={
          <Button variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" /> Eksport CSV
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        items={[
          { value: 'users', label: 'Foydalanuvchilar' },
          { value: 'content', label: 'Kontent' },
          { value: 'finance', label: 'Moliya' },
          { value: 'geo', label: 'Geografiya' },
        ]}
      />

      {tab === 'users' ? (
        <Stagger className="space-y-4 sm:space-y-5">
          <StaggerItem>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3 shadow-card">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
                <CalendarDays className="h-4 w-4 text-ink-3" /> Davr
              </span>
              <Segmented
                value={period}
                onChange={(value) => {
                  setPeriod(value)
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
          </StaggerItem>

          <StaggerItem>
            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="DAU (kunlik faol)"
                value={<CountUp value={metrics.todayActive} format={number} />}
                trend={
                  <span className="inline-flex items-center gap-1">
                    <ArrowDownRight className="h-3.5 w-3.5" /> −{number(metrics.yesterdayActive - metrics.todayActive)} kechaga nisbatan
                  </span>
                }
                trendTone="down"
                icon={<Flame className="h-5 w-5" />}
                iconClass="bg-error-bg text-error"
              />
              <StatCard
                label="MAU (oylik faol)"
                value={<CountUp value={24_180} format={number} />}
                hint="Oxirgi 30 kun ichida kirganlar"
                icon={<Users className="h-5 w-5" />}
                iconClass="bg-brand-soft text-brand"
              />
              <StatCard
                label="Retention (7 kun)"
                value={<CountUp value={68} suffix="%" />}
                hint="Kogorta bo'yicha qaytish"
                icon={<Target className="h-5 w-5" />}
                iconClass="bg-info-bg text-info"
              />
              <StatCard
                label="O'rtacha sessiya"
                value={
                  <span className="flex items-baseline gap-1">
                    <CountUp value={24} /> <span className="text-[15px] font-bold text-ink-3">daq</span>
                  </span>
                }
                hint="Bir sessiyadagi o'rtacha vaqt"
                icon={<Clock className="h-5 w-5" />}
                iconClass="bg-[#ede9fe] text-[#6d28d9]"
              />
              <StatCard
                label="Churn rate"
                value={<CountUp value={8.2} format={(value) => percent(value, 1)} />}
                trend={
                  <span className="inline-flex items-center gap-1">
                    <ArrowDownRight className="h-3.5 w-3.5" /> O'tgan oy 9.1%
                  </span>
                }
                icon={<TrendingDown className="h-5 w-5" />}
                iconClass="bg-warning-bg text-warning"
              />
            </div>
          </StaggerItem>

          <StaggerItem>
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
          </StaggerItem>

          <StaggerItem>
            <div className="grid gap-4 xl:grid-cols-5">
              <SectionCard
                className="xl:col-span-3"
                title="Retention cohort"
                subtitle="Ro'yxatdan o'tgan hafta bo'yicha 7-kunlik qaytish (%)"
                action={<Badge tone="success" dot>68% o'rtacha</Badge>}
              >
                <Heatmap matrix={cohortMatrix} rows={COHORT_ROWS} cols={COHORT_COLS} />
              </SectionCard>

              <SectionCard
                className="xl:col-span-2"
                title="Foydalanuvchi yo'li"
                subtitle="Kirdi → Dars ko'rdi → Test yechdi → Pro oldi"
              >
                <FunnelChart steps={journey} />
                <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
                  Pro konversiya:{' '}
                  <span className="font-semibold text-ink">
                    {percent((journey[3].value / Math.max(1, journey[0].value)) * 100, 1)}
                  </span>{' '}
                  — har {number(Math.round(totalUsers / Math.max(1, proUsers)))} foydalanuvchidan bittasi.
                </p>
              </SectionCard>
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionCard
              title="Sessiya uzunligi taqsimoti"
              subtitle="Foydalanuvchilar bir sessiyada qancha vaqt o'tkazadi"
              action={<Badge tone="brand" dot>{number(sessionDistribution.reduce((sum, item) => sum + item.value, 0))} sessiya</Badge>}
            >
              <DistributionBarChart
                data={sessionDistribution}
                height={230}
                tooltipLabel="Sessiyalar"
                yFormatter={(value) => number(value)}
              />
            </SectionCard>
          </StaggerItem>
        </Stagger>
      ) : null}

      {tab === 'content' ? (
        <Stagger className="space-y-4 sm:space-y-5">
          <StaggerItem>
            <SectionCard
              title="Top 10 mavzu"
              subtitle="Ko'rishlar soni bo'yicha eng ommabop mavzular"
              action={<Badge tone="brand" dot>{number(totalUsers)} foydalanuvchi bazasi</Badge>}
            >
              <ul className="divide-y divide-line-2 md:hidden">
                {topTopics.map((topic, index) => (
                  <li key={topic.id} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-ink-3">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{topic.name}</p>
                      <p className="mt-0.5 text-[11px] text-ink-3">
                        {subjectName(topic.subjectId)} · {topic.avgMinutes} daq
                      </p>
                      <div className="mt-1.5">
                        <ProgressBar value={(topic.views / Math.max(1, topTopics[0]?.views ?? 1)) * 100} height={4} animated={false} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12px] font-semibold tabular text-ink">{number(topic.views)}</p>
                      <Badge
                        tone={topic.avgScore >= 7 ? 'success' : topic.avgScore >= 5.5 ? 'warning' : 'danger'}
                        className="mt-1"
                      >
                        {topic.avgScore.toFixed(1)}/10
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-line-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                      <th className="pb-2 pr-3 font-semibold">#</th>
                      <th className="pb-2 pr-3 font-semibold">Mavzu</th>
                      <th className="pb-2 pr-3 font-semibold">Fan</th>
                      <th className="pb-2 pr-3 text-right font-semibold">Ko'rishlar</th>
                      <th className="pb-2 pr-3 text-right font-semibold">O'rtacha vaqt</th>
                      <th className="pb-2 text-right font-semibold">Test ball</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {topTopics.map((topic, index) => (
                      <tr key={topic.id} className="text-[13px] transition hover:bg-canvas">
                        <td className="py-2.5 pr-3">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-[11px] font-bold text-ink-3">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-ink">{topic.name}</p>
                          <div className="mt-1 w-40">
                            <ProgressBar value={(topic.views / Math.max(1, topTopics[0]?.views ?? 1)) * 100} height={4} animated={false} />
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-3">{subjectName(topic.subjectId)}</td>
                        <td className="py-2.5 pr-3 text-right tabular text-ink-2">{number(topic.views)}</td>
                        <td className="py-2.5 pr-3 text-right tabular text-ink-2">{topic.avgMinutes} daq</td>
                        <td className="py-2.5 text-right">
                          <Badge tone={topic.avgScore >= 7 ? 'success' : topic.avgScore >= 5.5 ? 'warning' : 'danger'}>
                            {topic.avgScore.toFixed(1)}/10
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </StaggerItem>

          <StaggerItem>
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard
                title="Eng qiyin testlar"
                subtitle="Noto'g'ri javob berish foizi bo'yicha"
                action={<Badge tone="danger" dot>Top 8</Badge>}
              >
                <ul className="divide-y divide-line-2 md:hidden">
                  {hardestTests.map((test) => (
                    <li key={test.id} className="space-y-1.5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-medium text-ink">{test.question}</p>
                        <Badge
                          tone={test.errorRate >= 60 ? 'danger' : test.errorRate >= 40 ? 'warning' : 'gray'}
                          className="shrink-0"
                        >
                          {percent(test.errorRate, 0)}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-ink-3">{topicName(test.topicId)}</p>
                      <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-error-bg text-[10px] font-bold text-error">
                          {test.topWrong.toUpperCase()}
                        </span>
                        <span className="truncate">{test.options[test.topWrong]}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[560px] text-left">
                    <thead>
                      <tr className="border-b border-line-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                        <th className="pb-2 pr-3 font-semibold">Test</th>
                        <th className="pb-2 pr-3 font-semibold">Mavzu</th>
                        <th className="pb-2 pr-3 text-right font-semibold">Xato</th>
                        <th className="pb-2 font-semibold">Ko'p xato variant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-2">
                      {hardestTests.map((test) => (
                        <tr key={test.id} className="align-top text-[12.5px] transition hover:bg-canvas">
                          <td className="max-w-[220px] py-2.5 pr-3">
                            <p className="line-clamp-2 font-medium text-ink">{test.question}</p>
                          </td>
                          <td className="py-2.5 pr-3 text-ink-3">{topicName(test.topicId)}</td>
                          <td className="py-2.5 pr-3 text-right">
                            <Badge tone={test.errorRate >= 60 ? 'danger' : test.errorRate >= 40 ? 'warning' : 'gray'}>
                              {percent(test.errorRate, 0)}
                            </Badge>
                          </td>
                          <td className="max-w-[190px] py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-error-bg text-[10px] font-bold text-error">
                                {test.topWrong.toUpperCase()}
                              </span>
                              <span className="truncate text-ink-3">{test.options[test.topWrong]}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard
                title="Foydalanuvchi tashlab ketadigan joylar"
                subtitle="Darslar bo'yicha ketma-ket o'tish funneli"
              >
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning-bg px-3.5 py-3 text-[12.5px] text-[#92400e]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Foydalanuvchilar eng ko'p <span className="font-bold">3-dars oldidan</span> chiqib ketadi — 2-darsdan
                    3-darsga o'tishda <span className="font-bold">{percent(biggestDrop, 0)}</span> yo'qotish kuzatilmoqda.
                  </p>
                </div>
                <FunnelChart steps={lessonSteps} />
                <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-3">
                  <BookOpen className="h-3.5 w-3.5" />
                  Kursni to'liq tugatganlar:{' '}
                  <span className="font-semibold text-ink">
                    {percent((lessonSteps[4].value / Math.max(1, lessonSteps[0].value)) * 100, 0)}
                  </span>
                </div>
              </SectionCard>
            </div>
          </StaggerItem>
        </Stagger>
      ) : null}

      {tab === 'finance' ? (
        <Stagger className="space-y-4 sm:space-y-5">
          <StaggerItem>
            <div className="grid gap-3.5 sm:grid-cols-3">
              <StatCard
                label="Bu oy daromad"
                value={
                  <span className="flex flex-wrap items-baseline gap-1.5">
                    <CountUp value={finance.current} format={number} />
                    <span className="text-[13px] font-semibold text-ink-3">so'm</span>
                  </span>
                }
                trend={
                  <span className="inline-flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> +{percent(finance.growth, 1)} o'tgan oyga nisbatan
                  </span>
                }
                icon={<Wallet className="h-5 w-5" />}
                iconClass="bg-brand-soft text-brand"
              />
              <StatCard
                label="O'tgan oy daromad"
                value={
                  <span className="flex flex-wrap items-baseline gap-1.5">
                    <CountUp value={finance.previous} format={number} />
                    <span className="text-[13px] font-semibold text-ink-3">so'm</span>
                  </span>
                }
                hint={money(finance.current - finance.previous) + " farq"}
                icon={<Gauge className="h-5 w-5" />}
                iconClass="bg-info-bg text-info"
              />
              <StatCard
                label="O'sish"
                value={<CountUp value={finance.growth} format={(value) => `+${percent(value, 1)}`} />}
                trend={
                  <span className="inline-flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> {money(finance.current - finance.previous)}
                  </span>
                }
                icon={<Percent className="h-5 w-5" />}
                iconClass="bg-coin-bg text-coin"
              />
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="grid gap-4 xl:grid-cols-3">
              <SectionCard
                className="xl:col-span-2"
                title="Daromad dinamikasi"
                subtitle="Oylik muvaffaqiyatli to'lovlar"
                action={<Badge tone="brand" dot>{money(revenue.reduce((sum, point) => sum + point.value, 0))}</Badge>}
              >
                <RevenueChart data={revenue} />
              </SectionCard>

              <SectionCard title="Paket taqsimoti" subtitle="Faol Pro obunalar bo'yicha">
                <DonutChart
                  data={packages.map((item) => ({ label: item.label, value: item.value, color: item.color }))}
                  centerLabel="Jami"
                  centerValue={number(packageTotal)}
                />
                <ul className="mt-4 space-y-2">
                  {packages.map((item) => (
                    <li key={item.key} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      <span className="flex-1 text-ink-2">{item.label}</span>
                      <span className="font-semibold tabular text-ink">{number(item.value)}</span>
                      <span className="w-10 text-right tabular text-ink-3">
                        {percent((item.value / Math.max(1, packageTotal)) * 100, 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="To'lov usullari" subtitle="Muvaffaqiyatli tranzaksiyalar ulushi">
                <RankingBars data={methods} valueFormatter={(value) => percent(value, 0)} />
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
                  <Gem className="h-3.5 w-3.5 text-coin" />
                  Eng ommabop usul —{' '}
                  <span className="font-semibold text-ink">{methods[0]?.label ?? '—'}</span>
                </div>
              </SectionCard>

              <SectionCard
                title="LTV va CAC"
                subtitle="Mijoz qiymati va jalb qilish narxi"
                action={<Badge tone="success" dot>15.3x</Badge>}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="bg-brand-soft/60 shadow-none">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-text">LTV</p>
                    <p className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink">
                      {money(184_000)}
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-3">O'rtacha umr bo'yi qiymati</p>
                  </Card>
                  <Card className="shadow-none">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">CAC</p>
                    <p className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink">
                      {money(12_000)}
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-3">Mijozni jalb qilish narxi</p>
                  </Card>
                </div>
                <div className="mt-4 rounded-lg bg-canvas px-3.5 py-3 text-[12px] text-ink-3">
                  Har <span className="font-semibold text-ink">1 so'm</span> marketingga sarflangan pul{' '}
                  <span className="font-semibold text-success">15.3 so'm</span> LTV keltiradi. LTV/CAC nisbati sog'lom
                  darajada.
                </div>
              </SectionCard>
            </div>
          </StaggerItem>
        </Stagger>
      ) : null}

      {tab === 'geo' ? (
        <Stagger className="space-y-4 sm:space-y-5">
          <StaggerItem>
            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Hududlar"
                value={<CountUp value={GEO_REGIONS.length} />}
                hint="Toshkent shahri viloyat bilan birga"
                icon={<MapPin className="h-5 w-5" />}
                iconClass="bg-brand-soft text-brand"
              />
              <StatCard
                label="Jami foydalanuvchi"
                value={<CountUp value={GEO_TOTAL} format={number} />}
                hint="Barcha hududlar bo'yicha"
                icon={<Users className="h-5 w-5" />}
                iconClass="bg-info-bg text-info"
              />
              <StatCard
                label="Eng faol hudud"
                value={<span className="text-[24px]">{GEO_REGIONS[0]?.name}</span>}
                hint={`${number(GEO_REGIONS[0]?.users ?? 0)} foydalanuvchi`}
                icon={<Flame className="h-5 w-5" />}
                iconClass="bg-error-bg text-error"
              />
              <StatCard
                label="O'rtacha Pro ulushi"
                value={<CountUp value={GEO_PRO_SHARE} format={(value) => percent(value, 1)} />}
                hint="Hududlar bo'yicha o'rtacha"
                icon={<Gem className="h-5 w-5" />}
                iconClass="bg-coin-bg text-coin"
              />
            </div>
          </StaggerItem>

          <StaggerItem>
            <SectionCard
              title="O'zbekiston xaritasi"
              subtitle="Viloyatlar bo'yicha foydalanuvchilar zichligi — kursorni ustiga olib boring"
              action={<Badge tone="brand" dot>Interaktiv</Badge>}
            >
              <div className="mx-auto max-w-3xl">
                <UzbekistanMap />
              </div>
            </SectionCard>
          </StaggerItem>

          <StaggerItem>
            <SectionCard
              title="Viloyatlar bo'yicha statistika"
              subtitle="Foydalanuvchilar, Pro ulushi va o'sish dinamikasi"
              action={<Badge tone="gray">{GEO_REGIONS.length} hudud</Badge>}
            >
              <ul className="divide-y divide-line-2 md:hidden">
                {GEO_REGIONS.map((region, index) => (
                  <li key={region.name} className="flex items-center gap-2.5 py-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-bold text-ink-3">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{region.name}</p>
                      <div className="mt-1.5">
                        <ProgressBar
                          value={(region.users / Math.max(1, GEO_REGIONS[0]?.users ?? 1)) * 100}
                          height={4}
                          animated={false}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12px] font-semibold tabular text-ink">{number(region.users)}</p>
                      <p className="mt-0.5 text-[10.5px] text-ink-3">
                        Pro {percent(region.proPercent, 1)} ·{' '}
                        <span className="font-semibold text-success">+{percent(region.growth, 1)}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-line-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                      <th className="pb-2 pr-3 font-semibold">#</th>
                      <th className="pb-2 pr-3 font-semibold">Viloyat</th>
                      <th className="pb-2 pr-3 font-semibold">Foydalanuvchilar</th>
                      <th className="pb-2 pr-3 text-right font-semibold">Pro %</th>
                      <th className="pb-2 text-right font-semibold">O'sish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {GEO_REGIONS.map((region, index) => (
                      <tr key={region.name} className="text-[13px] transition hover:bg-canvas">
                        <td className="py-2.5 pr-3">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-[11px] font-bold text-ink-3">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-ink">{region.name}</td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-3">
                            <span className="w-16 tabular text-ink-2">{number(region.users)}</span>
                            <div className="w-28 sm:w-40">
                              <ProgressBar
                                value={(region.users / Math.max(1, GEO_REGIONS[0]?.users ?? 1)) * 100}
                                height={5}
                                animated={false}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <Badge tone={region.proPercent >= 9 ? 'success' : region.proPercent >= 8 ? 'brand' : 'gray'}>
                            {percent(region.proPercent, 1)}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-0.5 font-semibold text-success">
                            <ArrowUpRight className="h-3.5 w-3.5" /> {percent(region.growth, 1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </StaggerItem>
        </Stagger>
      ) : null}

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
    </PageTransition>
  )
}
