import { MOCK_NOW } from './format'
import { users, transactions } from './mock'
import type { PackageId } from './types'

export type GrowthRange = '7d' | '30d' | '3m' | '1y'
export type RevenueRange = '3m' | '6m' | '1y'

const DAY = 86_400_000
const NOW = MOCK_NOW.getTime()
const PACKAGE_DAYS: Record<PackageId, number> = { '1m': 30, '3m': 90, '1y': 365 }
const MONTH_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

const pad = (value: number) => String(value).padStart(2, '0')

const dayLabel = (ms: number) => {
  const date = new Date(ms)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`
}

const registered = users.map((user) => new Date(user.createdAt).getTime())

const proStarts = users
  .filter((user) => user.plan === 'pro' && user.planEndsAt && user.planPackage)
  .map((user) => new Date(user.planEndsAt as string).getTime() - PACKAGE_DAYS[user.planPackage as PackageId] * DAY)
  .filter((value) => Number.isFinite(value))

const countUpTo = (values: number[], cutoff: number) => {
  let total = 0
  for (const value of values) if (value <= cutoff) total += 1
  return total
}

export function growthSeries(range: GrowthRange): Array<{ label: string; total: number; pro: number }> {
  const config: Record<GrowthRange, { points: number; stepDays: number }> = {
    '7d': { points: 7, stepDays: 1 },
    '30d': { points: 10, stepDays: 3 },
    '3m': { points: 7, stepDays: 15 },
    '1y': { points: 12, stepDays: 30 },
  }
  const { points, stepDays } = config[range]
  const result: Array<{ label: string; total: number; pro: number }> = []
  for (let index = 0; index < points; index += 1) {
    const cutoff = NOW - (points - 1 - index) * stepDays * DAY
    result.push({
      label: range === '1y' ? MONTH_SHORT[new Date(cutoff).getMonth()] : dayLabel(cutoff),
      total: countUpTo(registered, cutoff),
      pro: countUpTo(proStarts, cutoff),
    })
  }
  return result
}

export function revenueSeries(range: RevenueRange): Array<{ label: string; value: number; orders: number }> {
  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12
  const result: Array<{ label: string; value: number; orders: number }> = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(MOCK_NOW.getFullYear(), MOCK_NOW.getMonth() - offset, 1)
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    let value = 0
    let orders = 0
    for (const transaction of transactions) {
      if (transaction.status !== 'success') continue
      const at = new Date(transaction.createdAt)
      if (at.getFullYear() === year && at.getMonth() === month) {
        value += transaction.amount
        orders += 1
      }
    }
    result.push({ label: MONTH_SHORT[month], value, orders })
  }
  return result
}

export function activeSeries(): Array<{ label: string; value: number }> {
  const result: Array<{ label: string; value: number }> = []
  for (let offset = 13; offset >= 0; offset -= 1) {
    const dayStart = new Date(MOCK_NOW.getFullYear(), MOCK_NOW.getMonth(), MOCK_NOW.getDate() - offset).getTime()
    const count = users.filter((user) => {
      const seen = new Date(user.lastSeenAt).getTime()
      return seen >= dayStart && seen < dayStart + DAY
    }).length
    result.push({ label: dayLabel(dayStart), value: count })
  }
  return result
}

export const methodDistribution = (() => {
  const map = new Map<string, number>()
  for (const transaction of transactions) {
    if (transaction.status !== 'success') continue
    map.set(transaction.method, (map.get(transaction.method) ?? 0) + 1)
  }
  const total = [...map.values()].reduce((sum, value) => sum + value, 0) || 1
  return [...map.entries()].map(([method, count]) => ({ method, count, share: (count / total) * 100 }))
})()
