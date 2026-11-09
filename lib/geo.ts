import { regionStats } from './mock'
import type { RegionStat } from './types'

export interface GeoRegion extends RegionStat {
  mapIds: string[]
}

const MAP_IDS: Record<string, string[]> = {
  Toshkent: ['tashkent'],
  Samarqand: ['samarqand'],
  "Farg'ona": ['fergana'],
  Xorazm: ['xorazm'],
  Qashqadaryo: ['qashqadaryo'],
}

const OTHER_SPLIT: Array<{ name: string; mapId: string; weight: number; proPercent: number; growth: number }> = [
  { name: 'Andijon', mapId: 'andijan', weight: 472, proPercent: 9.1, growth: 7.4 },
  { name: 'Buxoro', mapId: 'bukhara', weight: 388, proPercent: 8.6, growth: 6.2 },
  { name: 'Jizzax', mapId: 'jizzakh', weight: 264, proPercent: 7.9, growth: 5.8 },
  { name: 'Namangan', mapId: 'namangan', weight: 438, proPercent: 8.8, growth: 7.1 },
  { name: 'Navoiy', mapId: 'navoiy', weight: 301, proPercent: 9.4, growth: 6.4 },
  { name: "Qoraqalpog'iston", mapId: 'karakalpakstan', weight: 268, proPercent: 6.9, growth: 4.8 },
  { name: 'Sirdaryo', mapId: 'sirdaryo', weight: 245, proPercent: 7.5, growth: 5.5 },
  { name: 'Surxondaryo', mapId: 'surxondaryo', weight: 480, proPercent: 7.2, growth: 6.0 },
]

const SPLIT_TOTAL = OTHER_SPLIT.reduce((sum, region) => sum + region.weight, 0)

export const GEO_REGIONS: GeoRegion[] = (() => {
  const known = regionStats
    .filter((region) => region.name !== 'Boshqa')
    .map((region) => ({ ...region, mapIds: MAP_IDS[region.name] ?? [] }))

  const other = regionStats.find((region) => region.name === 'Boshqa')?.users ?? 0
  const split = OTHER_SPLIT.map((region) => ({
    name: region.name,
    users: Math.round((other * region.weight) / SPLIT_TOTAL),
    proPercent: region.proPercent,
    growth: region.growth,
    mapIds: [region.mapId],
  }))

  return [...known, ...split].sort((left, right) => right.users - left.users)
})()

export const GEO_BY_MAP_ID = new Map<string, GeoRegion>(
  GEO_REGIONS.flatMap((region) => region.mapIds.map((id) => [id, region] as [string, GeoRegion])),
)

export const GEO_TOTAL = GEO_REGIONS.reduce((sum, region) => sum + region.users, 0)

export const GEO_PRO_SHARE =
  GEO_REGIONS.reduce((sum, region) => sum + (region.users * region.proPercent) / 100, 0) / Math.max(1, GEO_TOTAL)
