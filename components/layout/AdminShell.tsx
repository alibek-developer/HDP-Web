'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UserRound,
  X,
} from 'lucide-react'
import { NAV_ITEMS, type NavItem } from '@/lib/nav'
import { useAppStore } from '@/lib/store'
import { Avatar, Badge, cn } from '@/components/ui'

const isItemActive = (pathname: string, item: NavItem): boolean => {
  if (item.href === '/admin') return pathname === '/admin'
  if (item.children?.some((child) => child.href === pathname)) return true
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function SidebarContent({
  collapsed,
  pathname,
  onNavigate,
  onExpand,
  lang,
}: {
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
  onExpand?: () => void
  lang: 'uz' | 'ru'
}) {
  const tickets = useAppStore((state) => state.tickets)
  const profile = useAppStore((state) => state.profile)
  const newTickets = tickets.filter((ticket) => ticket.status === 'new').length
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Kontent: pathname.startsWith('/admin/content'),
  })

  useEffect(() => {
    if (pathname.startsWith('/admin/content')) {
      setOpenGroups((current) => ({ ...current, Kontent: true }))
    }
  }, [pathname])

  return (
    <div className="flex h-full flex-col bg-white text-ink">
      <div
        className={cn(
          'flex h-[56px] shrink-0 items-center border-b border-line',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-4',
        )}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand font-geist text-[15px] font-extrabold text-white shadow-[0_4px_12px_-2px_rgba(232,82,42,0.45)] transition-transform duration-150 hover:scale-[1.03]"
          aria-label="HDP Academy bosh sahifa"
        >
          H
        </Link>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-geist text-[14.5px] font-extrabold tracking-[-0.02em] text-ink">HDP Academy</p>
            <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-3">
              Boshqaruv paneli
            </p>
          </div>
        ) : null}
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 pb-2 pt-1">
        {!collapsed ? (
          <p className="px-2.5 pb-1 pt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-placeholder">Menyu</p>
        ) : (
          <div className="mx-auto mb-2 mt-2 h-px w-8 bg-line" />
        )}
        <div className="space-y-px">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isItemActive(pathname, item)
            const hasChildren = Boolean(item.children?.length)
            const isOpen = collapsed ? false : (openGroups[item.label] ?? false)
            const badge = item.badgeKey === 'support' && newTickets > 0 ? newTickets : null

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? (lang === 'uz' ? item.label : item.labelRu) : undefined}
                  onClick={(event) => {
                    if (onNavigate) onNavigate()
                    if (hasChildren) {
                      if (collapsed && onExpand) {
                        onExpand()
                        setOpenGroups((current) => ({ ...current, [item.label]: true }))
                        return
                      }
                      if (active) event.preventDefault()
                      setOpenGroups((current) => ({ ...current, [item.label]: !isOpen }))
                    }
                  }}
                  className={cn(
                    'group relative flex items-center rounded-[9px] font-geist transition-all duration-150',
                    collapsed ? 'h-[38px] justify-center' : 'h-[38px] gap-2.5 px-2.5',
                    active ? 'bg-brand-soft text-brand-text' : 'text-ink-2 hover:bg-muted hover:text-ink',
                  )}
                >
                  <Icon
                    className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-brand' : 'text-ink-3 group-hover:text-ink')}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  {!collapsed ? (
                    <>
                      <span className={cn('flex-1 truncate text-[13.5px]', active ? 'font-bold' : 'font-semibold')}>
                        {lang === 'uz' ? item.label : item.labelRu}
                      </span>
                      {badge ? (
                        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                          {badge}
                        </span>
                      ) : null}
                      {hasChildren ? (
                        <ChevronRight
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                            active ? 'text-brand-text/60' : 'text-placeholder',
                            isOpen && 'rotate-90',
                          )}
                        />
                      ) : null}
                    </>
                  ) : badge ? (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white ring-2 ring-white">
                      {badge}
                    </span>
                  ) : null}
                </Link>

                {hasChildren && !collapsed ? (
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[21px] mt-0.5 space-y-px border-l border-line pl-2.5">
                          {item.children?.map((child) => {
                            const childActive = pathname === child.href
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={cn(
                                  'flex h-8 items-center rounded-[8px] px-2.5 font-geist text-[12.5px] transition-colors',
                                  childActive
                                    ? 'bg-muted font-bold text-ink'
                                    : 'font-medium text-ink-3 hover:bg-muted hover:text-ink',
                                )}
                              >
                                {lang === 'uz' ? child.label : child.labelRu}
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                ) : null}
              </div>
            )
          })}
        </div>
      </nav>

      <div className={cn('shrink-0 border-t border-line', collapsed ? 'p-1.5' : 'p-2.5')}>
        {collapsed ? (
          <Link
            href="/admin/settings"
            className="grid h-10 place-items-center rounded-[10px] hover:bg-muted"
            title={profile.name}
          >
            <Avatar name={profile.name} size="sm" tone="bg-brand-soft text-brand-text" />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 rounded-[11px] bg-muted p-2">
            <Avatar name={profile.name} size="sm" tone="bg-brand-soft text-brand-text" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-geist text-[12.5px] font-bold text-ink">{profile.name}</p>
              <p className="truncate text-[10.5px] text-ink-3">Super admin</p>
            </div>
            <Link
              href="/admin/settings"
              aria-label="Sozlamalar"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-ink-3 transition-colors hover:bg-white hover:text-ink"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const lang = useAppStore((state) => state.lang)
  const setLang = useAppStore((state) => state.setLang)
  const profile = useAppStore((state) => state.profile)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const logout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="admin-theme flex min-h-screen bg-canvas">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-line bg-white transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[64px]' : 'w-[228px]',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          pathname={pathname}
          lang={lang}
          onExpand={() => setCollapsed(false)}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative h-full w-[272px] border-r border-line bg-white shadow-[0_30px_80px_rgba(25,24,19,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarContent
                collapsed={false}
                pathname={pathname}
                lang={lang}
                onNavigate={() => setMobileOpen(false)}
              />
              <button
                type="button"
                aria-label="Yopish"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2.5 top-[18px] z-10 grid h-9 w-9 place-items-center rounded-[10px] text-ink-3 hover:bg-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center gap-2 border-b border-line bg-white/90 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
          <button
            type="button"
            aria-label="Menyu"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-line bg-white text-ink transition-colors hover:border-ink/20 hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={collapsed ? 'Sidebarni ochish' : 'Sidebarni yopish'}
            onClick={() => setCollapsed((current) => !current)}
            className="hidden h-9 w-9 place-items-center rounded-[10px] border border-line bg-white text-ink-3 transition-colors hover:border-ink/20 hover:bg-muted hover:text-ink lg:grid"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center rounded-[9px] border border-line bg-white p-0.5 sm:flex">
              {(['uz', 'ru'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={cn(
                    'h-7 rounded-[7px] px-2.5 text-[11px] font-bold uppercase transition-colors',
                    lang === code ? 'bg-ink text-white' : 'text-ink-3 hover:text-ink',
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex h-9 items-center gap-2.5 rounded-[10px] border border-transparent pl-1.5 pr-2 transition-colors hover:border-line hover:bg-muted sm:pr-2.5"
              >
                <Avatar name={profile.name} size="sm" tone="bg-brand-soft text-brand-text" />
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-[130px] truncate font-geist text-[12.5px] font-bold leading-tight text-ink">
                    {profile.name}
                  </span>
                  <span className="block max-w-[130px] truncate text-[11px] leading-tight text-ink-3">{email}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-ink-3 sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full z-50 mt-2 w-[248px] overflow-hidden rounded-[18px] border border-line bg-white p-1.5 shadow-[0_20px_50px_rgba(25,24,19,0.12)]"
                  >
                    <div className="px-2.5 py-2.5">
                      <p className="font-geist text-[14px] font-extrabold text-ink">{profile.name}</p>
                      <p className="text-[11.5px] text-ink-3">{email}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <Badge tone="brand" dot>
                          Faol
                        </Badge>
                        <Badge tone="violet">Super admin</Badge>
                      </div>
                    </div>
                    <div className="my-1.5 h-px bg-line-2" />
                    <Link
                      href="/admin/settings"
                      className="flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-muted"
                    >
                      <UserRound className="h-[18px] w-[18px] text-ink-3" /> Profil sozlamalari
                    </Link>
                    <Link
                      href="/admin/settings#roles"
                      className="flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-muted"
                    >
                      <Shield className="h-[18px] w-[18px] text-ink-3" /> Rollar va huquqlar
                    </Link>
                    <Link
                      href="/admin/system"
                      className="flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-muted"
                    >
                      <Settings className="h-[18px] w-[18px] text-ink-3" /> Tizim holati
                    </Link>
                    <div className="my-1.5 h-px bg-line-2" />
                    <button
                      type="button"
                      disabled={loggingOut}
                      onClick={logout}
                      className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] font-semibold text-error hover:bg-error-bg disabled:opacity-60"
                    >
                      <LogOut className="h-[18px] w-[18px]" /> {loggingOut ? 'Chiqilmoqda...' : 'Chiqish'}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1500px] px-3 py-3 sm:px-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
