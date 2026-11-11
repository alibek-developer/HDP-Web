import { regionStats } from './mock'
import type { RegionStat } from './types'

export type GeoRegion = RegionStat

export const GEO_REGIONS: GeoRegion[] = [...regionStats].sort((left, right) => right.users - left.users)

export const GEO_TOTAL = GEO_REGIONS.reduce((sum, region) => sum + region.users, 0)

export const GEO_PRO_SHARE =
  GEO_REGIONS.reduce((sum, region) => sum + region.users * region.proPercent, 0) / Math.max(1, GEO_TOTAL)
