'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h1 className="h2 truncate text-ink">{title}</h1>
        {subtitle ? <span className="truncate text-[12px] text-ink-3">{subtitle}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
    </header>
  )
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PageActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}
