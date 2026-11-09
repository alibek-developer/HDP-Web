'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CornerDownLeft,
  FileQuestion,
  Library,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/components/ui'
import { money } from '@/lib/format'

type ResultGroup = 'users' | 'topics' | 'tests' | 'payments'

interface ResultItem {
  id: string
  group: ResultGroup
  title: string
  subtitle: string
  href: string
}

const groupLabels: Record<ResultGroup, string> = {
  users: 'Foydalanuvchilar',
  topics: 'Mavzular',
  tests: 'Testlar',
  payments: "To'lovlar",
}

const groupIcons: Record<ResultGroup, typeof Users> = {
  users: Users,
  topics: Library,
  tests: FileQuestion,
  payments: Wallet,
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const users = useAppStore((state) => state.users)
  const topics = useAppStore((state) => state.topics)
  const tests = useAppStore((state) => state.tests)
  const transactions = useAppStore((state) => state.transactions)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(timer)
  }, [open])

  const results = useMemo<ResultItem[]>(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) return []

    const found: ResultItem[] = []

    for (const user of users) {
      if (found.filter((item) => item.group === 'users').length >= 4) break
      if (
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
      ) {
        found.push({
          id: `u-${user.id}`,
          group: 'users',
          title: user.name,
          subtitle: `@${user.username} · ${user.id}`,
          href: `/admin/users/${user.id}`,
        })
      }
    }

    for (const topic of topics) {
      if (found.filter((item) => item.group === 'topics').length >= 3) break
      if (topic.name.toLowerCase().includes(term)) {
        found.push({
          id: `t-${topic.id}`,
          group: 'topics',
          title: topic.name,
          subtitle: `Mavzu · ${topic.views.toLocaleString('uz-UZ')} ko'rish`,
          href: `/admin/content/topics?topic=${topic.id}`,
        })
      }
    }

    for (const test of tests) {
      if (found.filter((item) => item.group === 'tests').length >= 3) break
      if (test.question.toLowerCase().includes(term)) {
        found.push({
          id: `q-${test.id}`,
          group: 'tests',
          title: test.question,
          subtitle: `Test · ${test.id}`,
          href: `/admin/tests?test=${test.id}`,
        })
      }
    }

    for (const transaction of transactions) {
      if (found.filter((item) => item.group === 'payments').length >= 3) break
      if (
        transaction.id.toLowerCase().includes(term) ||
        transaction.userName.toLowerCase().includes(term)
      ) {
        found.push({
          id: `x-${transaction.id}`,
          group: 'payments',
          title: transaction.id,
          subtitle: `${transaction.userName} · ${money(transaction.amount)}`,
          href: `/admin/payments?txn=${transaction.id}`,
        })
      }
    }

    return found
  }, [query, users, topics, tests, transactions])

  useEffect(() => {
    setActive(0)
  }, [results.length])

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((current) => (results.length === 0 ? 0 : (current + 1) % results.length))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((current) => (results.length === 0 ? 0 : (current - 1 + results.length) % results.length))
      }
      if (event.key === 'Enter' && results[active]) {
        event.preventDefault()
        onClose()
        router.push(results[active].href)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, active, onClose, router])

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const grouped = useMemo(() => {
    const map = new Map<ResultGroup, ResultItem[]>()
    for (const item of results) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return Array.from(map.entries())
  }, [results])

  let cursor = -1

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-[4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-modal"
          >
            <div className="flex items-center gap-2.5 border-b border-line-2 px-4">
              <Search className="h-4 w-4 shrink-0 text-ink-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Foydalanuvchi, mavzu, test yoki to'lov qidirish..."
                className="h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-placeholder"
              />
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-ink-3 sm:block">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="px-3 py-10 text-center text-[13px] text-ink-3">
                  Kamida 2 ta belgi kiriting — qidiruv real vaqtda ishlaydi.
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-10 text-center text-[13px] text-ink-3">
                  "{query}" bo'yicha natija topilmadi.
                </div>
              ) : (
                grouped.map(([group, items]) => {
                  const Icon = groupIcons[group]
                  return (
                    <div key={group} className="mb-1.5 last:mb-0">
                      <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-placeholder">
                        {groupLabels[group]}
                      </p>
                      {items.map((item) => {
                        cursor += 1
                        const index = cursor
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-index={index}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => {
                              onClose()
                              router.push(item.href)
                            }}
                            className={cn(
                              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                              index === active ? 'bg-brand-soft' : 'hover:bg-canvas',
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-7 w-7 shrink-0 place-items-center rounded-md',
                                index === active ? 'bg-white text-brand' : 'bg-muted text-ink-3',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold text-ink">{item.title}</span>
                              <span className="block truncate text-[11px] text-ink-3">{item.subtitle}</span>
                            </span>
                            {index === active ? <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand" /> : null}
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line-2 bg-canvas px-4 py-2 text-[11px] text-ink-3">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-white px-1 py-0.5 text-[10px]">↑</kbd>
                  <kbd className="rounded border border-line bg-white px-1 py-0.5 text-[10px]">↓</kbd>
                  navigatsiya
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" /> ochish
                </span>
              </span>
              <span>{results.length} natija</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
