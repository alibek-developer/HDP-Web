'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layers, PlaySquare, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { number } from '@/lib/format'

export const contentRoot =
  'flex admin-workspace flex-col gap-3 overflow-hidden  sm:gap-3.5 '

const TABS = [
  { href: '/admin/content', label: 'Fanlar', icon: Layers, count: 'subjects' as const },
  { href: '/admin/content/videos', label: 'Videolar', icon: PlaySquare, count: 'videos' as const },
  { href: '/admin/content/import', label: 'PDF import', icon: Sparkles, count: null },
]

export function ContentHeader({
  title,
  count,
  subtitle,
  actions,
}: {
  title: string
  count?: number
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h1 className="h2 truncate text-ink">{title}</h1>
        {typeof count === 'number' ? (
          <span className="rounded-full bg-muted px-2 py-0.5 font-geist text-[11px] font-bold tabular text-ink-2">
            {number(count)}
          </span>
        ) : null}
        {subtitle ? (
          <span className="hidden truncate text-[12px] text-ink-3 lg:inline">{subtitle}</span>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}
    </header>
  )
}

export function ContentTabs() {
  const pathname = usePathname()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const videos = useAppStore((state) => state.videos)
  const counts = { subjects: subjects.length, topics: topics.length, videos: videos.length }

  return (
    <nav className="grid shrink-0 grid-cols-4 gap-0.5 rounded-[12px] border border-line bg-white p-1 sm:flex sm:items-center">
      {TABS.map((tab) => {
        const active = tab.href === '/admin/content' ? pathname === tab.href : pathname.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'inline-flex h-12 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[9px] px-1 font-geist text-[10.5px] font-semibold leading-none transition max-sm:flex-col sm:h-10 sm:flex-row sm:gap-2 sm:px-3 sm:text-[12.5px]',
              active ? 'bg-ink text-white' : 'text-ink-3 hover:bg-muted hover:text-ink',
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-brand-light' : 'text-ink-3')} />
            {tab.label}
            {tab.count ? (
              <span
                className={cn(
                  'hidden rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular sm:inline-block',
                  active ? 'bg-white/15 text-white/85' : 'bg-muted text-ink-3',
                )}
              >
                {number(counts[tab.count])}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
