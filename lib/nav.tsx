import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Bell,
  ChartNoAxesColumn,
  CreditCard,
  FileQuestion,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Megaphone,
  Server,
  Settings,
  Store,
  Trophy,
  Users,
} from 'lucide-react'

export interface NavChild {
  href: string
  label: string
  labelRu: string
}

export interface NavItem {
  href: string
  label: string
  labelRu: string
  icon: LucideIcon
  badgeKey?: 'support'
  children?: NavChild[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', labelRu: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Foydalanuvchilar', labelRu: 'Пользователи', icon: Users },
  {
    href: '/admin/content',
    label: 'Kontent',
    labelRu: 'Контент',
    icon: Library,
    children: [
      { href: '/admin/content', label: 'Fanlar', labelRu: 'Предметы' },
      { href: '/admin/content/topics', label: 'Mavzular', labelRu: 'Темы' },
      { href: '/admin/content/videos', label: 'Videolar', labelRu: 'Видео' },
      { href: '/admin/content/import', label: 'PDF Import', labelRu: 'PDF импорт' },
    ],
  },
  { href: '/admin/tests', label: 'Testlar', labelRu: 'Тесты', icon: FileQuestion },
  { href: '/admin/olympiads', label: 'Olimpiadalar', labelRu: 'Олимпиады', icon: Trophy },
  { href: '/admin/analytics', label: 'Analitika', labelRu: 'Аналитика', icon: ChartNoAxesColumn },
  { href: '/admin/payments', label: "To'lovlar", labelRu: 'Платежи', icon: CreditCard },
  { href: '/admin/shop', label: "Do'kon", labelRu: 'Магазин', icon: Store },
  { href: '/admin/marketing', label: 'Marketing', labelRu: 'Маркетинг', icon: Megaphone },
  { href: '/admin/support', label: 'Support', labelRu: 'Поддержка', icon: LifeBuoy, badgeKey: 'support' },
  { href: '/admin/certificates', label: 'Sertifikatlar', labelRu: 'Сертификаты', icon: Award },
  { href: '/admin/notifications', label: 'Bildirishnomalar', labelRu: 'Уведомления', icon: Bell },
  { href: '/admin/system', label: 'Tizim', labelRu: 'Система', icon: Server },
  { href: '/admin/settings', label: 'Sozlamalar', labelRu: 'Настройки', icon: Settings },
]

export const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Foydalanuvchilar',
  '/admin/content': 'Fanlar',
  '/admin/content/topics': 'Mavzular',
  '/admin/content/videos': 'Videolar',
  '/admin/content/import': 'AI bilan PDF Import',
  '/admin/tests': 'Testlar',
  '/admin/olympiads': 'Olimpiadalar',
  '/admin/analytics': 'Analitika',
  '/admin/payments': "To'lovlar",
  '/admin/shop': "Do'kon",
  '/admin/marketing': 'Marketing',
  '/admin/support': 'Support',
  '/admin/certificates': 'Sertifikatlar',
  '/admin/notifications': 'Bildirishnomalar',
  '/admin/system': 'Tizim',
  '/admin/settings': 'Sozlamalar',
}

export const titleForPath = (pathname: string): string => {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/admin/users/')) return 'Foydalanuvchi profili'
  if (pathname.includes('/live')) return 'Jonli monitoring'
  if (pathname.includes('/results')) return 'Olimpiada natijalari'
  if (pathname.startsWith('/admin/olympiads/new')) return 'Yangi olimpiada'
  if (pathname.startsWith('/admin/olympiads/')) return 'Olimpiada'
  return 'Admin panel'
}
