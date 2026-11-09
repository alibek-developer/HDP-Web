'use client'

import { useState } from 'react'
import uzbekistan from '@svg-maps/uzbekistan'
import { GEO_BY_MAP_ID, GEO_REGIONS } from '@/lib/geo'
import { number, percent } from '@/lib/format'

const MAX_USERS = Math.max(...GEO_REGIONS.map((region) => region.users), 1)

const mix = (from: number[], to: number[], ratio: number) =>
  `rgb(${from.map((value, index) => Math.round(value + (to[index] - value) * ratio)).join(', ')})`

const fillFor = (users?: number) => {
  if (users === undefined) return '#e5e7eb'
  const ratio = Math.max(0, Math.min(1, users / MAX_USERS)) ** 0.65
  return mix([240, 253, 244], [20, 83, 45], 0.12 + ratio * 0.88)
}

interface HoverState {
  x: number
  y: number
  name: string
  users: number | null
  proPercent: number | null
  growth: number | null
}

export function UzbekistanMap() {
  const [hover, setHover] = useState<HoverState | null>(null)

  const showTooltip = (
    event: React.MouseEvent<SVGPathElement>,
    locationId: string,
    locationName: string,
  ) => {
    const box = event.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
    if (!box) return
    const region = GEO_BY_MAP_ID.get(locationId)
    setHover({
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      name: region?.name ?? (locationId === 'aral-sea' ? 'Orol dengizi' : locationName),
      users: region?.users ?? null,
      proPercent: region?.proPercent ?? null,
      growth: region?.growth ?? null,
    })
  }

  return (
    <div className="relative">
      <svg
        viewBox={uzbekistan.viewBox}
        role="img"
        aria-label="O'zbekiston xaritasi — viloyatlar bo'yicha foydalanuvchilar"
        className="h-auto w-full select-none"
        onMouseLeave={() => setHover(null)}
      >
        {uzbekistan.locations.map((location, index) => {
          const region = GEO_BY_MAP_ID.get(location.id)
          const isSea = location.id === 'aral-sea'
          const active = hover?.name === (region?.name ?? (isSea ? 'Orol dengizi' : location.name))
          return (
            <path
              key={`${location.id}-${index}`}
              d={location.path}
              fill={fillFor(region?.users)}
              stroke={active ? '#14532d' : '#ffffff'}
              strokeWidth={active ? 1.8 : 1}
              className="cursor-pointer transition-[fill,stroke] duration-150"
              style={active ? { filter: 'brightness(1.08)' } : undefined}
              onMouseMove={(event) => showTooltip(event, location.id, location.name)}
              onMouseEnter={(event) => showTooltip(event, location.id, location.name)}
            >
              <title>{region ? `${region.name}: ${number(region.users)} foydalanuvchi` : location.name}</title>
            </path>
          )
        })}
      </svg>

      {hover ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[168px] rounded-lg border border-line bg-white px-3 py-2 shadow-modal"
          style={{
            left: Math.max(4, hover.x + 14),
            top: Math.max(4, hover.y - 64),
          }}
        >
          <p className="text-[12.5px] font-semibold text-ink">{hover.name}</p>
          {hover.users !== null ? (
            <>
              <p className="mt-0.5 text-[12px] text-ink-3">
                <span className="font-semibold text-ink">{number(hover.users)}</span> foydalanuvchi
              </p>
              <p className="mt-0.5 text-[11px] text-ink-3">
                Pro {percent(hover.proPercent ?? 0, 1)} · O'sish{' '}
                <span className="font-semibold text-success">+{percent(hover.growth ?? 0, 1)}</span>
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-[11px] text-ink-3">Ma'lumot yo'q</p>
          )}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-ink-3">
        <div className="flex items-center gap-1.5">
          Kam
          {[0.16, 0.32, 0.48, 0.64, 0.8, 0.96].map((ratio) => (
            <span
              key={ratio}
              className="h-3 w-4 rounded-sm"
              style={{ background: mix([240, 253, 244], [20, 83, 45], ratio) }}
            />
          ))}
          Ko'p
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-[#e5e7eb]" /> Ma'lumot yo'q
        </div>
      </div>
      <p className="mt-2 text-[10px] text-placeholder">
        Xarita: @svg-maps/uzbekistan · CC BY 4.0. Toshkent shahri Toshkent viloyati bilan birga ko'rsatilgan.
      </p>
    </div>
  )
}
