'use client'

import { useState } from 'react'
import { GEO_REGIONS, GEO_TOTAL } from '@/lib/geo'
import { number, percent } from '@/lib/format'
import { cn } from '@/components/ui'
import { KHOREZM_SHAPES, KHOREZM_VIEWBOX } from './khorezm-map'

const MAX_USERS = Math.max(...GEO_REGIONS.map((region) => region.users), 1)

const mix = (from: number[], to: number[], ratio: number) =>
  `rgb(${from.map((value, index) => Math.round(value + (to[index] - value) * ratio)).join(', ')})`

const heat = (users: number) => {
  const ratio = Math.max(0, Math.min(1, users / MAX_USERS)) ** 0.7
  return mix([253, 241, 236], [194, 65, 12], ratio)
}

interface HoverState {
  x: number
  y: number
  name: string
}

export function KhorezmDistricts() {
  const [activeName, setActiveName] = useState(GEO_REGIONS[0]?.name ?? '')
  const [hover, setHover] = useState<HoverState | null>(null)
  const active = GEO_REGIONS.find((region) => region.name === activeName) ?? GEO_REGIONS[0]
  const share = active ? (active.users / Math.max(1, GEO_TOTAL)) * 100 : 0
  const hovered = hover ? GEO_REGIONS.find((region) => region.name === hover.name) : null

  return (
    <div className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
      <div
        className="relative xl:flex xl:min-h-0 xl:flex-1 xl:items-center xl:justify-center"
        onMouseLeave={() => setHover(null)}
      >
        <svg
          viewBox={KHOREZM_VIEWBOX}
          role="img"
          aria-label="Xorazm viloyati xaritasi — tumanlar bo'yicha foydalanuvchilar"
          className="mx-auto h-auto w-full max-w-[460px] select-none xl:h-full xl:w-full xl:max-w-none"
        >
          {KHOREZM_SHAPES.map((shape) => {
            const region = GEO_REGIONS.find((item) => item.name === shape.name)
            if (!region) return null
            const isActive = region.name === active?.name
            return (
              <path
                key={shape.name}
                d={shape.d}
                data-geo-district
                data-name={region.name}
                data-users={region.users}
                fill={heat(region.users)}
                fillRule="evenodd"
                stroke={isActive ? '#191813' : '#ffffff'}
                strokeWidth={isActive ? 1.8 : 0.7}
                strokeLinejoin="round"
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`${region.name} — ${number(region.users)} foydalanuvchi`}
                className={cn(
                  'cursor-pointer transition-[filter,opacity] duration-150 focus:outline-none',
                  isActive ? 'drop-shadow-[0_2px_5px_rgba(25,24,19,0.28)]' : 'hover:brightness-[0.96]',
                )}
                onClick={() => setActiveName(region.name)}
                onFocus={() => setActiveName(region.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setActiveName(region.name)
                  }
                }}
                onMouseMove={(event) => {
                  const box = event.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
                  if (!box) return
                  setHover({
                    x: Math.min(Math.max(event.clientX - box.left, 52), box.width - 52),
                    y: event.clientY - box.top,
                    name: region.name,
                  })
                }}
              >
                <title>{`${region.name} — ${number(region.users)} foydalanuvchi`}</title>
              </path>
            )
          })}
        </svg>

        {hover && hovered ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[8px] bg-ink px-2.5 py-1.5 text-white shadow-[0_8px_20px_rgba(25,24,19,0.22)]"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <p className="whitespace-nowrap text-[10.5px] font-bold leading-tight">{hovered.name}</p>
            <p className="mt-0.5 whitespace-nowrap text-[9.5px] font-medium text-white/70">
              {number(hovered.users)} foydalanuvchi · Pro {percent(hovered.proPercent, 1)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-3" aria-hidden>
          Kam
          <span className="h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,#fdf1ec,#c2410c)]" />
          Ko'p
        </div>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="text-[9px] font-medium text-ink-3 transition-colors hover:text-brand-text"
        >
          Xarita: © OpenStreetMap
        </a>
      </div>

      {active ? (
        <div data-geo-selected className="mt-2.5 shrink-0 rounded-[10px] border border-line bg-muted/60 px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[12.5px] font-bold text-ink">{active.name}</p>
            <p className="shrink-0 text-[10.5px] font-semibold text-ink-3">Ulush {percent(share, 1)}</p>
          </div>
          <dl className="mt-1.5 grid grid-cols-3 gap-2">
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">Foydalanuvchi</dt>
              <dd className="mt-0.5 font-geist text-[12.5px] font-bold tabular-nums text-ink">{number(active.users)}</dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">Pro ulushi</dt>
              <dd className="mt-0.5 font-geist text-[12.5px] font-bold tabular-nums text-ink">{percent(active.proPercent, 1)}</dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">O'sish</dt>
              <dd className="mt-0.5 font-geist text-[12.5px] font-bold tabular-nums text-success">+{percent(active.growth, 1)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  )
}
