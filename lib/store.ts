'use client'

import { create } from 'zustand'
import type {
  AdminUser,
  AppSettings,
  Backup,
  Campaign,
  CertTemplate,
  CertType,
  Certificate,
  LogEntry,
  NotificationRecord,
  NotificationType,
  Olympiad,
  PackageId,
  Order,
  OrderStatus,
  PermissionKey,
  Product,
  Profile,
  Promo,
  Role,
  Subject,
  Test,
  Ticket,
  TicketPriority,
  TicketStatus,
  Topic,
  Transaction,
  User,
  UserStatus,
  Video,
} from './types'
import * as seed from './mock'
import { MOCK_NOW } from './format'

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
const nowIso = () => new Date().toISOString()

type Lang = 'uz' | 'ru'

interface AppStore {
  lang: Lang
  users: User[]
  subjects: Subject[]
  topics: Topic[]
  videos: Video[]
  tests: Test[]
  olympiads: Olympiad[]
  transactions: Transaction[]
  products: Product[]
  orders: Order[]
  promos: Promo[]
  campaigns: Campaign[]
  tickets: Ticket[]
  certificates: Certificate[]
  certTemplates: CertTemplate[]
  notifications: NotificationRecord[]
  logs: LogEntry[]
  backups: Backup[]
  admins: AdminUser[]
  roles: Role[]
  settings: AppSettings
  profile: Profile

  setLang: (lang: Lang) => void
  updateUser: (id: string, patch: Partial<User>) => void
  updateUsers: (ids: string[], patch: Partial<User>) => void
  addCoins: (ids: string[], amount: number) => void
  setUserPlan: (ids: string[], pro: boolean) => void
  grantPro: (ids: string[], packageId: PackageId) => void
  setUserStatus: (ids: string[], status: UserStatus) => void
  deleteUsers: (ids: string[]) => void

  upsertSubject: (subject: Subject) => void
  deleteSubject: (id: string) => void
  upsertTopic: (topic: Topic) => void
  deleteTopic: (id: string) => void
  reorderTopics: (ids: string[]) => void
  upsertVideo: (video: Video) => void
  deleteVideo: (id: string) => void
  reorderVideos: (ids: string[]) => void
  upsertTest: (test: Test) => void
  deleteTest: (id: string) => void
  importTests: (topicId: string, incoming: Test[]) => void

  upsertOlympiad: (olympiad: Olympiad) => void
  deleteOlympiad: (id: string) => void
  duplicateOlympiad: (id: string) => void
  stopOlympiad: (id: string) => void
  publishResults: (id: string) => void
  toggleOlympiadQuestion: (id: string, testId: string) => void

  refundTransaction: (id: string) => void
  upsertProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  setOrderStatus: (id: string, status: OrderStatus) => void

  upsertPromo: (promo: Promo) => void
  deletePromo: (id: string) => void
  upsertCampaign: (campaign: Campaign) => void
  deleteCampaign: (id: string) => void

  updateTicket: (id: string, patch: Partial<Pick<Ticket, 'status' | 'priority' | 'admin'>>) => void
  replyTicket: (id: string, text: string) => void

  addCertificate: (userId: string, type: CertType) => void
  deleteCertificate: (id: string) => void
  resendCertificate: (id: string) => void
  updateTemplate: (template: CertTemplate) => void

  sendNotification: (payload: { title: string; body: string; link: string; audience: NotificationRecord['audience']; type: NotificationType; recipients: number; scheduled: boolean }) => void
  deleteNotification: (id: string) => void

  addLog: (entry: Omit<LogEntry, 'id'>) => void
  createBackup: () => void

  upsertAdmin: (admin: AdminUser) => void
  updateAdminStatus: (id: string, status: AdminUser['status']) => void
  updateRolePermission: (roleId: string, key: PermissionKey, value: boolean) => void

  updateSettings: (patch: Partial<AppSettings>) => void
  updateProfile: (patch: Partial<Profile>) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  lang: 'uz',
  users: seed.users,
  subjects: seed.subjects,
  topics: seed.topics,
  videos: seed.videos,
  tests: seed.tests,
  olympiads: seed.olympiads,
  transactions: seed.transactions,
  products: seed.products,
  orders: seed.orders,
  promos: seed.promos,
  campaigns: seed.campaigns,
  tickets: seed.tickets,
  certificates: seed.certificates,
  certTemplates: seed.certTemplates,
  notifications: seed.notifications,
  logs: seed.logs,
  backups: seed.backups,
  admins: seed.admins,
  roles: seed.roles,
  settings: seed.settings,
  profile: seed.profile,

  setLang: (lang) => set({ lang }),

  updateUser: (id, patch) =>
    set((state) => ({ users: state.users.map((user) => (user.id === id ? { ...user, ...patch } : user)) })),

  updateUsers: (ids, patch) => {
    const target = new Set(ids)
    set((state) => ({ users: state.users.map((user) => (target.has(user.id) ? { ...user, ...patch } : user)) }))
  },

  addCoins: (ids, amount) => {
    const target = new Set(ids)
    set((state) => ({
      users: state.users.map((user) =>
        target.has(user.id) ? { ...user, coins: Math.max(0, user.coins + amount) } : user,
      ),
    }))
  },

  setUserPlan: (ids, pro) => {
    const target = new Set(ids)
    const endsAt = new Date(Date.now() + 30 * 86_400_000).toISOString()
    set((state) => ({
      users: state.users.map((user) =>
        target.has(user.id)
          ? {
              ...user,
              plan: pro ? 'pro' : 'free',
              planPackage: pro ? '1m' : null,
              planEndsAt: pro ? endsAt : null,
              planPaid: pro ? 49_000 : null,
              verified: pro ? true : user.verified,
            }
          : user,
      ),
    }))
  },

  grantPro: (ids, packageId) => {
    const target = new Set(ids)
    const days: Record<PackageId, number> = { '1m': 30, '3m': 90, '1y': 365 }
    const prices: Record<PackageId, number> = { '1m': 49_000, '3m': 129_000, '1y': 399_000 }
    const endsAt = new Date(MOCK_NOW.getTime() + days[packageId] * 86_400_000).toISOString()
    set((state) => ({
      users: state.users.map((user) =>
        target.has(user.id)
          ? {
              ...user,
              plan: 'pro',
              planPackage: packageId,
              planEndsAt: endsAt,
              planPaid: prices[packageId],
              verified: true,
            }
          : user,
      ),
    }))
  },

  setUserStatus: (ids, status) => {
    const target = new Set(ids)
    set((state) => ({
      users: state.users.map((user) => (target.has(user.id) ? { ...user, status } : user)),
    }))
  },

  deleteUsers: (ids) => {
    const target = new Set(ids)
    set((state) => ({ users: state.users.filter((user) => !target.has(user.id)) }))
  },

  upsertSubject: (subject) =>
    set((state) => ({
      subjects: state.subjects.some((item) => item.id === subject.id)
        ? state.subjects.map((item) => (item.id === subject.id ? subject : item))
        : [...state.subjects, subject],
    })),

  deleteSubject: (id) =>
    set((state) => {
      const topicIds = new Set(state.topics.filter((topic) => topic.subjectId === id).map((topic) => topic.id))
      return {
        subjects: state.subjects.filter((subject) => subject.id !== id),
        topics: state.topics.filter((topic) => topic.subjectId !== id),
        videos: state.videos.filter((video) => !topicIds.has(video.topicId)),
        tests: state.tests.filter((test) => !topicIds.has(test.topicId)),
      }
    }),

  upsertTopic: (topic) =>
    set((state) => ({
      topics: state.topics.some((item) => item.id === topic.id)
        ? state.topics.map((item) => (item.id === topic.id ? topic : item))
        : [...state.topics, topic],
    })),

  deleteTopic: (id) =>
    set((state) => ({
      topics: state.topics.filter((topic) => topic.id !== id),
      videos: state.videos.filter((video) => video.topicId !== id),
      tests: state.tests.filter((test) => test.topicId !== id),
    })),

  reorderTopics: (ids) =>
    set((state) => {
      const positions = new Map(ids.map((id, index) => [id, index + 1]))
      return {
        topics: state.topics.map((topic) =>
          positions.has(topic.id) ? { ...topic, order: positions.get(topic.id) ?? topic.order } : topic,
        ),
      }
    }),

  upsertVideo: (video) =>
    set((state) => ({
      videos: state.videos.some((item) => item.id === video.id)
        ? state.videos.map((item) => (item.id === video.id ? video : item))
        : [...state.videos, video],
    })),

  deleteVideo: (id) => set((state) => ({ videos: state.videos.filter((video) => video.id !== id) })),

  reorderVideos: (ids) =>
    set((state) => {
      const positions = new Map(ids.map((id, index) => [id, index + 1]))
      return {
        videos: state.videos.map((video) =>
          positions.has(video.id) ? { ...video, order: positions.get(video.id) ?? video.order } : video,
        ),
      }
    }),

  upsertTest: (test) =>
    set((state) => ({
      tests: state.tests.some((item) => item.id === test.id)
        ? state.tests.map((item) => (item.id === test.id ? test : item))
        : [test, ...state.tests],
    })),

  deleteTest: (id) => set((state) => ({ tests: state.tests.filter((test) => test.id !== id) })),

  importTests: (topicId, incoming) =>
    set((state) => ({
      tests: [
        ...incoming.map((test) => ({ ...test, topicId })),
        ...state.tests,
      ],
    })),

  upsertOlympiad: (olympiad) =>
    set((state) => ({
      olympiads: state.olympiads.some((item) => item.id === olympiad.id)
        ? state.olympiads.map((item) => (item.id === olympiad.id ? olympiad : item))
        : [olympiad, ...state.olympiads],
    })),

  deleteOlympiad: (id) => set((state) => ({ olympiads: state.olympiads.filter((item) => item.id !== id) })),

  duplicateOlympiad: (id) => {
    const source = get().olympiads.find((olympiad) => olympiad.id === id)
    if (!source) return
    const copy: Olympiad = {
      ...source,
      id: uid('olymp'),
      name: `${source.name} (nusxa)`,
      status: 'draft',
      registered: 0,
      playing: 0,
      finished: 0,
      left: 0,
      resultsPublished: false,
      results: [],
      createdAt: nowIso(),
    }
    set((state) => ({ olympiads: [copy, ...state.olympiads] }))
  },

  stopOlympiad: (id) =>
    set((state) => ({
      olympiads: state.olympiads.map((olympiad) =>
        olympiad.id === id
          ? { ...olympiad, status: 'finished', playing: 0, left: olympiad.left + olympiad.playing, finished: olympiad.finished }
          : olympiad,
      ),
    })),

  publishResults: (id) =>
    set((state) => ({
      olympiads: state.olympiads.map((olympiad) =>
        olympiad.id === id ? { ...olympiad, resultsPublished: true, status: 'finished' } : olympiad,
      ),
    })),

  toggleOlympiadQuestion: (id, testId) =>
    set((state) => ({
      olympiads: state.olympiads.map((olympiad) => {
        if (olympiad.id !== id) return olympiad
        const exists = olympiad.questionIds.includes(testId)
        return {
          ...olympiad,
          questionIds: exists
            ? olympiad.questionIds.filter((questionId) => questionId !== testId)
            : [...olympiad.questionIds, testId],
        }
      }),
    })),

  refundTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id ? { ...transaction, status: 'refunded' } : transaction,
      ),
    })),

  upsertProduct: (product) =>
    set((state) => ({
      products: state.products.some((item) => item.id === product.id)
        ? state.products.map((item) => (item.id === product.id ? product : item))
        : [product, ...state.products],
    })),

  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
      orders: state.orders.filter((order) => order.productId !== id),
    })),

  setOrderStatus: (id, status) =>
    set((state) => ({ orders: state.orders.map((order) => (order.id === id ? { ...order, status } : order)) })),

  upsertPromo: (promo) =>
    set((state) => ({
      promos: state.promos.some((item) => item.id === promo.id)
        ? state.promos.map((item) => (item.id === promo.id ? promo : item))
        : [promo, ...state.promos],
    })),

  deletePromo: (id) => set((state) => ({ promos: state.promos.filter((promo) => promo.id !== id) })),

  upsertCampaign: (campaign) =>
    set((state) => ({
      campaigns: state.campaigns.some((item) => item.id === campaign.id)
        ? state.campaigns.map((item) => (item.id === campaign.id ? campaign : item))
        : [campaign, ...state.campaigns],
    })),

  deleteCampaign: (id) => set((state) => ({ campaigns: state.campaigns.filter((campaign) => campaign.id !== id) })),

  updateTicket: (id, patch) =>
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, ...patch, updatedAt: nowIso() } : ticket,
      ),
    })),

  replyTicket: (id, text) =>
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              status: ticket.status === 'new' ? 'progress' : ticket.status,
              admin: ticket.admin || 'Administrator',
              updatedAt: nowIso(),
              messages: [
                ...ticket.messages,
                { id: uid('msg'), from: 'admin' as const, text, at: nowIso() },
              ],
            }
          : ticket,
      ),
    })),

  addCertificate: (userId, type) => {
    const user = get().users.find((item) => item.id === userId)
    if (!user) return
    const certificate: Certificate = {
      id: uid('CERT'),
      userId,
      userName: user.name,
      type,
      issuedAt: nowIso(),
      status: 'issued',
    }
    set((state) => ({ certificates: [certificate, ...state.certificates] }))
  },

  deleteCertificate: (id) =>
    set((state) => ({ certificates: state.certificates.filter((certificate) => certificate.id !== id) })),

  resendCertificate: (id) =>
    set((state) => ({
      certificates: state.certificates.map((certificate) =>
        certificate.id === id ? { ...certificate, status: 'sent' } : certificate,
      ),
    })),

  updateTemplate: (template) =>
    set((state) => ({
      certTemplates: state.certTemplates.map((item) => (item.id === template.id ? template : item)),
    })),

  sendNotification: (payload) => {
    const record: NotificationRecord = {
      id: uid('notif'),
      title: payload.title,
      body: payload.body,
      link: payload.link,
      audience: payload.audience,
      type: payload.type,
      sentAt: nowIso(),
      recipients: payload.recipients,
      read: 0,
      clicked: 0,
      scheduled: payload.scheduled,
    }
    set((state) => ({ notifications: [record, ...state.notifications] }))
  },

  deleteNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((notification) => notification.id !== id) })),

  addLog: (entry) =>
    set((state) => ({
      logs: [{ ...entry, id: uid('log') }, ...state.logs].slice(0, 120),
    })),

  createBackup: () => {
    const backup: Backup = {
      id: uid('backup'),
      at: nowIso(),
      size: `${Math.floor(130 + Math.random() * 60)} MB`,
      status: 'success',
    }
    set((state) => ({ backups: [backup, ...state.backups] }))
  },

  upsertAdmin: (admin) =>
    set((state) => ({
      admins: state.admins.some((item) => item.id === admin.id)
        ? state.admins.map((item) => (item.id === admin.id ? admin : item))
        : [...state.admins, admin],
    })),

  updateAdminStatus: (id, status) =>
    set((state) => ({
      admins: state.admins.map((admin) => (admin.id === id ? { ...admin, status } : admin)),
    })),

  updateRolePermission: (roleId, key, value) =>
    set((state) => ({
      roles: state.roles.map((role) =>
        role.id === roleId
          ? { ...role, permissions: { ...role.permissions, [key]: value } }
          : role,
      ),
    })),

  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
  updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
}))

export type { AppStore }
