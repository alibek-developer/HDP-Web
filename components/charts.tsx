'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { compact, money, number } from '@/lib/format'
import { cn, ProgressBar } from '@/components/ui'

const axisTick = { fill: '#9ca3af', fontSize: 11 }

function TooltipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-[12px] shadow-modal">{children}</div>
  )
}

export function GrowthChart({ data }: { data: Array<{ label: string; total: number; pro: number }> }) {
  return (
    <div className="h-[248px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="growth-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="growth-pro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(value) => compact(value)} width={52} />
          <Tooltip
            cursor={{ stroke: '#d1d5db', strokeDasharray: '4 4' }}
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null
              return (
                <TooltipShell>
                  <p className="mb-1 font-semibold text-ink">{label}</p>
                  <p className="flex items-center gap-1.5 text-ink-3">
                    <span className="h-2 w-2 rounded-full bg-brand" /> Jami:{' '}
                    <span className="font-semibold text-ink">{number(payload[0]?.value ?? 0)}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-ink-3">
                    <span className="h-2 w-2 rounded-full bg-coin" /> Pro:{' '}
                    <span className="font-semibold text-ink">{number(payload[1]?.value ?? 0)}</span>
                  </p>
                </TooltipShell>
              )
            }}
          />
          <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.2} fill="url(#growth-total)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
          <Area type="monotone" dataKey="pro" stroke="#f59e0b" strokeWidth={2} fill="url(#growth-pro)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RevenueChart({ data }: { data: Array<{ label: string; value: number; orders?: number }> }) {
  return (
    <div className="h-[248px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value / 1_000_000)} mln`}
            width={58}
          />
          <Tooltip
            cursor={{ fill: 'rgba(22,163,74,0.06)' }}
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null
              return (
                <TooltipShell>
                  <p className="mb-1 font-semibold text-ink">{label}</p>
                  <p className="text-ink-3">
                    Daromad: <span className="font-semibold text-ink">{money(payload[0]?.value ?? 0)}</span>
                  </p>
                  {payload[0]?.payload?.orders ? (
                    <p className="text-ink-3">
                      To'lovlar: <span className="font-semibold text-ink">{number(payload[0].payload.orders)}</span>
                    </p>
                  ) : null}
                </TooltipShell>
              )
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#16a34a" activeBar={{ fill: '#15803d' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ActiveChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="active-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(value) => compact(value)} width={48} />
          <Tooltip
            content={({ active, payload, label }: any) =>
              active && payload?.length ? (
                <TooltipShell>
                  <p className="font-semibold text-ink">{label}</p>
                  <p className="text-ink-3">Faol: {number(payload[0]?.value ?? 0)}</p>
                </TooltipShell>
              ) : null
            }
          />
          <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2.2} fill="url(#active-fill)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 180,
}: {
  data: Array<{ label: string; value: number; color: string }>
  centerLabel: string
  centerValue: string
  size?: number
}) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="66%"
            outerRadius="94%"
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <TooltipShell>
                  <p className="font-semibold text-ink">{payload[0]?.name}</p>
                  <p className="text-ink-3">{number(payload[0]?.value ?? 0)} ta</p>
                </TooltipShell>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">{centerLabel}</span>
        <span className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-ink">{centerValue}</span>
      </div>
    </div>
  )
}

export function RankingBars({
  data,
  valueFormatter = number,
}: {
  data: Array<{ label: string; value: number; hint?: string }>
  valueFormatter?: (value: number) => string
}) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <ul className="space-y-2.5">
      {data.map((item, index) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-[11px] font-semibold tabular text-ink-3">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[12.5px] font-medium text-ink-2">{item.label}</span>
              <span className="shrink-0 text-[11px] tabular text-ink-3">
                {valueFormatter(item.value)}
                {item.hint ? <span className="ml-1 text-placeholder">· {item.hint}</span> : null}
              </span>
            </div>
            <ProgressBar value={(item.value / max) * 100} height={5} animated={false} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Heatmap({ matrix, rows, cols }: { matrix: number[][]; rows: string[]; cols: string[] }) {
  const cellColor = (value: number) => {
    const ratio = Math.max(0, Math.min(1, value / 100))
    return `rgba(22, 163, 74, ${0.08 + ratio * 0.78})`
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="mb-1 grid gap-1 pl-12" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
          {cols.map((col) => (
            <span key={col} className="text-center text-[10px] font-medium text-ink-3">
              {col}
            </span>
          ))}
        </div>
        <div className="space-y-1">
          {matrix.map((row, rowIndex) => (
            <div key={rows[rowIndex]} className="flex items-center gap-1">
              <span className="w-11 shrink-0 text-[10px] font-medium text-ink-3">{rows[rowIndex]}</span>
              <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
                {row.map((value, colIndex) => (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (rowIndex * cols.length + colIndex) * 0.006 }}
                    title={`${rows[rowIndex]} · ${cols[colIndex]}: ${value}%`}
                    className="grid h-7 place-items-center rounded text-[9px] font-semibold text-white/90"
                    style={{ background: cellColor(value) }}
                  >
                    {value}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-ink-3">
          Kam
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((ratio) => (
            <span
              key={ratio}
              className="h-3 w-4 rounded-sm"
              style={{ background: `rgba(22,163,74,${ratio})` }}
            />
          ))}
          Ko'p
        </div>
      </div>
    </div>
  )
}

export function NewVsTotalChart({
  data,
}: {
  data: Array<{ label: string; newUsers: number; total: number }>
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: -8, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            dy={6}
            minTickGap={26}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="total"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => compact(value)}
            width={46}
          />
          <YAxis
            yAxisId="new"
            orientation="right"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => compact(value)}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: '#d1d5db', strokeDasharray: '4 4' }}
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null
              const total = payload.find((item: any) => item.dataKey === 'total')?.value ?? 0
              const fresh = payload.find((item: any) => item.dataKey === 'newUsers')?.value ?? 0
              return (
                <TooltipShell>
                  <p className="mb-1 font-semibold text-ink">{label}</p>
                  <p className="flex items-center gap-1.5 text-ink-3">
                    <span className="h-2 w-2 rounded-full bg-brand" /> Jami:{' '}
                    <span className="font-semibold text-ink">{number(total)}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-ink-3">
                    <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Yangi:{' '}
                    <span className="font-semibold text-ink">{number(fresh)}</span>
                  </p>
                </TooltipShell>
              )
            }}
          />
          <Line
            yAxisId="total"
            type="monotone"
            dataKey="total"
            stroke="#16a34a"
            strokeWidth={2.2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
          <Line
            yAxisId="new"
            type="monotone"
            dataKey="newUsers"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DistributionBarChart({
  data,
  height = 230,
  tooltipLabel = 'Qiymat',
  valueFormatter = number,
  yFormatter = compact,
}: {
  data: Array<{ label: string; value: number }>
  height?: number
  tooltipLabel?: string
  valueFormatter?: (value: number) => string
  yFormatter?: (value: number) => string
}) {
  const shades = ['#14532d', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac']
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="26%">
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} dy={6} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={yFormatter}
            width={46}
          />
          <Tooltip
            cursor={{ fill: 'rgba(22,163,74,0.06)' }}
            content={({ active, payload, label }: any) =>
              active && payload?.length ? (
                <TooltipShell>
                  <p className="mb-1 font-semibold text-ink">{label}</p>
                  <p className="text-ink-3">
                    {tooltipLabel}:{' '}
                    <span className="font-semibold text-ink">{valueFormatter(payload[0]?.value ?? 0)}</span>
                  </p>
                </TooltipShell>
              ) : null
            }
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={item.label} fill={shades[index % shades.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DailyRevenueChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-[248px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            dy={6}
            interval={4}
            minTickGap={10}
          />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value / 1_000_000)} mln`}
            width={54}
          />
          <Tooltip
            cursor={{ fill: 'rgba(22,163,74,0.06)' }}
            content={({ active, payload, label }: any) =>
              active && payload?.length ? (
                <TooltipShell>
                  <p className="mb-1 font-semibold text-ink">{label}-kun</p>
                  <p className="text-ink-3">
                    Daromad: <span className="font-semibold text-ink">{money(payload[0]?.value ?? 0)}</span>
                  </p>
                </TooltipShell>
              ) : null
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#16a34a" activeBar={{ fill: '#14532d' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CumulativeChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-[248px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="cumulative-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            dy={6}
            interval={4}
            minTickGap={10}
          />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value / 1_000_000)} mln`}
            width={54}
          />
          <Tooltip
            content={({ active, payload, label }: any) =>
              active && payload?.length ? (
                <TooltipShell>
                  <p className="mb-1 font-semibold text-ink">{label}-kun</p>
                  <p className="text-ink-3">
                    Jami: <span className="font-semibold text-ink">{money(payload[0]?.value ?? 0)}</span>
                  </p>
                </TooltipShell>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#16a34a"
            strokeWidth={2.2}
            fill="url(#cumulative-fill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunnelChart({ steps }: { steps: Array<{ label: string; value: number }> }) {
  const first = steps[0]?.value || 1
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const share = (step.value / first) * 100
        const drop = index === 0 ? 0 : ((steps[index - 1].value - step.value) / (steps[index - 1].value || 1)) * 100
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-medium text-ink-2">{step.label}</span>
              <span className="tabular text-ink-3">
                {number(step.value)}
                {index > 0 ? <span className="ml-2 text-error">−{drop.toFixed(1)}%</span> : null}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-md bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${share}%` }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeOut' }}
                className={cn('h-full rounded-md', index === 0 ? 'bg-[#14532d]' : index === 1 ? 'bg-[#15803d]' : index === 2 ? 'bg-[#16a34a]' : 'bg-[#22c55e]')}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Sparkline({
  data,
  color = '#e8522a',
  height = 36,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  const points = data.map((value, index) => ({ index, value }))
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.6}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
