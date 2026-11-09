import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth'
import { ToastProvider } from '@/components/ui'
import { AdminShell } from '@/components/layout/AdminShell'

export const metadata: Metadata = {
  title: {
    default: 'HDP Admin',
    template: '%s · HDP Admin',
  },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  return (
    <ToastProvider>
      <AdminShell email={session.email}>{children}</AdminShell>
    </ToastProvider>
  )
}
