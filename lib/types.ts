export type Plan = 'free' | 'pro'
export type UserStatus = 'active' | 'inactive' | 'blocked'
export type PackageId = '1m' | '3m' | '1y'
export type ContentStatus = 'active' | 'draft' | 'hidden'
export type SubjectColor = 'green' | 'blue' | 'violet' | 'amber' | 'red' | 'gray'
export type TestDifficulty = 'easy' | 'medium' | 'hard' | 'olympiad'
export type OlympiadStatus = 'scheduled' | 'live' | 'finished' | 'draft'
export type PaymentMethod = 'payme' | 'click' | 'uzum' | 'uzcard'
export type TransactionStatus = 'success' | 'pending' | 'cancelled' | 'refunded'
export type OrderStatus = 'pending' | 'done' | 'cancelled'
export type TicketStatus = 'new' | 'progress' | 'closed'
export type TicketPriority = 'high' | 'medium' | 'low'
export type CertType = 'course' | 'olympiad' | 'pro'
export type CertStatus = 'issued' | 'sent' | 'pending'
export type TemplateTheme = 'green' | 'gold' | 'premium'
export type NotificationType = 'push' | 'inapp' | 'both'
export type NotificationAudience = 'all' | 'pro' | 'free' | 'custom'
export type PromoStatus = 'active' | 'expired' | 'disabled'
export type CampaignType = 'discount' | 'custom' | 'trial' | 'bonus'
export type CampaignStatus = 'active' | 'scheduled' | 'finished' | 'draft'

export interface User {
  id: string
  name: string
  username: string
  email: string
  telegram: string
  verified: boolean
  plan: Plan
  planEndsAt: string | null
  planPackage: PackageId | null
  planPaid: number | null
  xp: number
  level: number
  coins: number
  streak: number
  solved: number
  accuracy: number
  region: string
  grade: number
  status: UserStatus
  createdAt: string
  lastSeenAt: string
  tone: string
}

export interface Subject {
  id: string
  nameUz: string
  nameRu: string
  description: string
  color: SubjectColor
  icon: string
  status: ContentStatus
  order: number
  createdAt: string
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  description: string
  order: number
  status: ContentStatus
  proOnly: boolean
  views: number
  avgMinutes: number
  testTakers: number
  avgScore: number
  createdAt: string
}

export interface Video {
  id: string
  topicId: string
  name: string
  youtubeId: string
  duration: string
  views: number
  status: ContentStatus
  proOnly: boolean
  order: number
  createdAt: string
}

export interface Test {
  id: string
  question: string
  options: { a: string; b: string; c: string; d: string }
  correct: 'a' | 'b' | 'c' | 'd'
  topicId: string
  difficulty: TestDifficulty
  status: ContentStatus
  used: number
  errorRate: number
  topWrong: 'a' | 'b' | 'c' | 'd'
  note: string
  createdAt: string
}

export interface OlympiadResult {
  userId: string
  name: string
  score: number
  total: number
  timeSeconds: number
  region: string
}

export interface Olympiad {
  id: string
  name: string
  description: string
  startAt: string
  duration: number
  audience: 'all' | 'pro' | 'group'
  regionLimit: string
  gradeLimit: string
  rewards: [number, number, number]
  questionIds: string[]
  status: OlympiadStatus
  registered: number
  playing: number
  finished: number
  left: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  resultReveal: 'now' | 'after' | 'manual'
  blockScreenshot: boolean
  certificate: boolean
  certMinScore: number
  certTemplate: string
  resultsPublished: boolean
  results: OlympiadResult[]
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  userName: string
  packageId: PackageId
  amount: number
  method: PaymentMethod
  status: TransactionStatus
  providerTxId: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  status: 'active' | 'draft' | 'out'
  image: string | null
  emoji: string
  sold: number
}

export interface Order {
  id: string
  userId: string
  userName: string
  productId: string
  productName: string
  coins: number
  status: OrderStatus
  createdAt: string
}

export interface Promo {
  id: string
  code: string
  discountType: 'percent' | 'amount'
  amount: number
  used: number
  limit: number
  expiresAt: string
  packageId: 'all' | PackageId
  status: PromoStatus
}

export interface Referral {
  id: string
  userId: string
  userName: string
  code: string
  invited: number
  revenue: number
  createdAt: string
}

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  value: string
  startsAt: string
  endsAt: string
  banner: string
  status: CampaignStatus
}

export interface TicketMessage {
  id: string
  from: 'user' | 'admin'
  text: string
  at: string
}

export interface Ticket {
  id: string
  subject: string
  userId: string
  userName: string
  telegram: string
  priority: TicketPriority
  status: TicketStatus
  admin: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

export interface Certificate {
  id: string
  userId: string
  userName: string
  type: CertType
  issuedAt: string
  status: CertStatus
}

export interface CertElement {
  id: string
  label: string
  x: number
  y: number
  size: number
  weight: number
}

export interface CertTemplate {
  id: string
  name: string
  type: CertType
  theme: TemplateTheme
  title: string
  subtitle: string
  footer: string
  elements: CertElement[]
}

export interface NotificationRecord {
  id: string
  title: string
  body: string
  link: string
  audience: NotificationAudience
  type: NotificationType
  sentAt: string
  recipients: number
  read: number
  clicked: number
  scheduled: boolean
  scheduledAt?: string
}

export type AutomationTrigger = 'signup' | 'plan_expiring' | 'inactive' | 'streak' | 'payment_failed'

export interface NotificationAutomation {
  id: string
  name: string
  trigger: AutomationTrigger
  audience: NotificationAudience
  type: NotificationType
  delayHours: number
  enabled: boolean
  title: string
  body: string
  link: string
  lastRunAt?: string
  sent: number
}

export interface LogEntry {
  id: string
  at: string
  level: 'error' | 'warning' | 'info'
  message: string
  user: string
  ip: string
}

export interface Backup {
  id: string
  at: string
  size: string
  status: 'success' | 'failed'
}

export type PermissionsMap = Record<PermissionKey, boolean>

export type PermissionKey =
  | 'dashboard'
  | 'users'
  | 'content'
  | 'tests'
  | 'olympiads'
  | 'analytics'
  | 'payments'
  | 'shop'
  | 'marketing'
  | 'support'
  | 'certificates'
  | 'notifications'
  | 'system'
  | 'settings'

export interface Role {
  id: string
  name: string
  description: string
  permissions: Record<PermissionKey, boolean>
}

export interface AdminUser {
  id: string
  name: string
  email: string
  roleId: string
  lastLogin: string
  status: 'active' | 'inactive'
}

export interface AppSettings {
  appName: string
  description: string
  logo: string | null
  favicon: string | null
  maintenance: boolean
  maintenanceMessage: string
  allowedIps: string
  currentVersion: string
  build: string
  minVersion: string
  forceUpdate: boolean
  updateMessage: string
  payme: { merchantId: string; secretKey: string; testMode: boolean; webhook: string }
  click: { serviceId: string; secretKey: string }
  uzum: { merchantId: string; secretKey: string }
  prices: { '1m': number; '3m': number; '1y': number; trialDays: number }
  autoBackup: boolean
  backupIntervalHours: number
}

export interface ProfilePreferences {
  emailReports: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
}

export interface Profile {
  name: string
  email: string
  avatar: string | null
  preferences: ProfilePreferences
}

export interface RegionStat {
  name: string
  users: number
  proPercent: number
  growth: number
}
