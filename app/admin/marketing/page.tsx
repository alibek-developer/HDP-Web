'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BadgePercent,
  CalendarDays,
  Check,
  Copy,
  Gift,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Tag,
  Trash2,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  SearchInput,
  Segmented,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, dateInput, money, number, percent } from '@/lib/format'
import { referralStats, referrals as seedReferrals } from '@/lib/mock'
import type { Campaign, CampaignStatus, CampaignType, PackageId, Promo, PromoStatus } from '@/lib/types'

const NOW = new Date('2026-11-08T09:00:00+05:00').getTime()
const DAY = 86_400_000

const PACKAGE_LABEL: Record<'all' | PackageId, string> = {
  all: 'Barchasi',
  '1m': '1 oy',
  '3m': '3 oy',
  '1y': '1 yil',
}

const PROMO_STATUS: Record<PromoStatus, { label: string; tone: 'success' | 'gray' | 'danger' }> = {
  active: { label: 'Faol', tone: 'success' },
  expired: { label: 'Muddati tugagan', tone: 'gray' },
  disabled: { label: "O'chirilgan", tone: 'danger' },
}

const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: 'success' | 'info' | 'gray' | 'warning' }> = {
  active: { label: 'Faol', tone: 'success' },
  scheduled: { label: 'Rejalashtirilgan', tone: 'info' },
  finished: { label: 'Yakunlangan', tone: 'gray' },
  draft: { label: 'Draft', tone: 'warning' },
}

const CAMPAIGN_TYPE: Record<CampaignType, string> = {
  discount: 'Vaqtinchalik chegirma',
  custom: "X oy uchun Y so'm",
  trial: 'Bepul trial',
  bonus: '2+1 sovg‘a',
}

const EMPTY_PROMO: Promo = {
  id: '',
  code: '',
  discountType: 'percent',
  amount: 10,
  used: 0,
  limit: 100,
  expiresAt: '2026-12-31T23:59:00+05:00',
  packageId: 'all',
  status: 'active',
}

const EMPTY_CAMPAIGN: Campaign = {
  id: '',
  name: '',
  type: 'discount',
  value: '',
  startsAt: '2026-11-10T00:00:00+05:00',
  endsAt: '2026-12-10T23:59:00+05:00',
  banner: '',
  status: 'scheduled',
}

const generateCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

const daysLeft = (expiresAt: string) => Math.ceil((new Date(expiresAt).getTime() - NOW) / DAY)

const promoState = (promo: Promo): PromoStatus => {
  if (promo.status === 'disabled') return 'disabled'
  if (new Date(promo.expiresAt).getTime() < NOW || promo.used >= promo.limit) return 'expired'
  return 'active'
}

export default function MarketingPage() {
  const promos = useAppStore((state) => state.promos)
  const campaigns = useAppStore((state) => state.campaigns)
  const referrals = seedReferrals
  const upsertPromo = useAppStore((state) => state.upsertPromo)
  const deletePromo = useAppStore((state) => state.deletePromo)
  const upsertCampaign = useAppStore((state) => state.upsertCampaign)
  const deleteCampaign = useAppStore((state) => state.deleteCampaign)
  const { toast } = useToast()

  const [tab, setTab] = useState<'promos' | 'referrals' | 'campaigns'>('promos')
  const [search, setSearch] = useState('')
  const [promoStatus, setPromoStatus] = useState<'all' | PromoStatus>('all')
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null)
  const [deletePromoTarget, setDeletePromoTarget] = useState<Promo | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState<Campaign | null>(null)

  const filteredPromos = useMemo(() => {
    const term = search.trim().toLowerCase()
    return promos.filter((promo) => {
      if (promoStatus !== 'all' && promoState(promo) !== promoStatus) return false
      if (term && !promo.code.toLowerCase().includes(term)) return false
      return true
    })
  }, [promos, promoStatus, search])

  const referralRows = useMemo(
    () => [...referrals].sort((left, right) => right.revenue - left.revenue),
    [referrals],
  )
  const podium = referralRows.slice(0, 3)
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean)
  const restRows = referralRows.slice(3)

  const campaignRows = useMemo(
    () => [...campaigns].sort((left, right) => right.startsAt.localeCompare(left.startsAt)),
    [campaigns],
  )

  const savePromo = (promo: Promo) => {
    const code = promo.code.trim().toUpperCase()
    if (!code) return toast({ title: 'Promo kodni kiriting', tone: 'warning' })
    if (promo.amount <= 0) return toast({ title: 'Chegirma miqdorini kiriting', tone: 'warning' })
    if (promo.limit <= 0) return toast({ title: 'Foydalanish limitini kiriting', tone: 'warning' })
    if (promos.some((item) => item.code === code && item.id !== promo.id)) {
      return toast({ title: 'Bu kod allaqachon mavjud', tone: 'warning' })
    }
    const expired = new Date(promo.expiresAt).getTime() < NOW
    upsertPromo({
      ...promo,
      id: promo.id || `promo-${Date.now()}`,
      code,
      status: expired ? 'expired' : promo.status === 'expired' ? 'active' : promo.status,
    })
    toast({ title: promo.id ? 'Promo kod yangilandi' : 'Promo kod yaratildi', description: code, tone: 'success' })
    setEditingPromo(null)
  }

  const togglePromo = (promo: Promo) => {
    if (promoState(promo) === 'expired') {
      toast({ title: 'Muddati tugagan kodni yoqib bo‘lmaydi', description: 'Avval amal qilish muddatini yangilang.', tone: 'warning' })
      return
    }
    upsertPromo({ ...promo, status: promo.status === 'disabled' ? 'active' : 'disabled' })
    toast({
      title: promo.status === 'disabled' ? 'Promo kod yoqildi' : 'Promo kod to‘xtatildi',
      description: promo.code,
      tone: promo.status === 'disabled' ? 'success' : 'warning',
    })
  }

  const confirmDeletePromo = () => {
    if (!deletePromoTarget) return
    deletePromo(deletePromoTarget.id)
    toast({ title: 'Promo kod o‘chirildi', description: deletePromoTarget.code, tone: 'success' })
    setDeletePromoTarget(null)
  }

  const saveCampaign = (campaign: Campaign) => {
    if (!campaign.name.trim()) return toast({ title: 'Aksiya nomini kiriting', tone: 'warning' })
    if (!campaign.value.trim()) return toast({ title: 'Aksiya qiymatini kiriting', tone: 'warning' })
    if (new Date(campaign.endsAt) <= new Date(campaign.startsAt)) {
      return toast({ title: 'Tugash sanasi boshlanishdan keyin bo‘lishi kerak', tone: 'warning' })
    }
    upsertCampaign({
      ...campaign,
      id: campaign.id || `camp-${Date.now()}`,
      name: campaign.name.trim(),
      value: campaign.value.trim(),
      banner: campaign.banner.trim(),
    })
    toast({ title: campaign.id ? 'Aksiya yangilandi' : 'Aksiya yaratildi', description: campaign.name, tone: 'success' })
    setEditingCampaign(null)
  }

  const confirmDeleteCampaign = () => {
    if (!deleteCampaignTarget) return
    deleteCampaign(deleteCampaignTarget.id)
    toast({ title: 'Aksiya o‘chirildi', description: deleteCampaignTarget.name, tone: 'success' })
    setDeleteCampaignTarget(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => toast({ title: 'Kod nusxalandi', description: code, tone: 'success' }))
      .catch(() => toast({ title: 'Nusxalash imkonsiz', description: code, tone: 'warning' }))
  }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3.5  [@media(max-height:720px)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="h2 truncate text-ink">Marketing</h1>
            <Badge tone="brand">{number(promos.length)} promo</Badge>
            <span className="hidden truncate text-[12px] text-ink-3 lg:inline">
              Promo kodlar, referral dasturi va aksiyalarni boshqaring
            </span>
          </div>
          {tab === 'promos' ? (
            <Button onClick={() => setEditingPromo({ ...EMPTY_PROMO, code: generateCode() })} className="h-9">
              <Plus className="h-4 w-4" />
              <span className="max-[360px]:hidden">Yangi kod</span>
            </Button>
          ) : tab === 'campaigns' ? (
            <Button onClick={() => setEditingCampaign({ ...EMPTY_CAMPAIGN })} className="h-9">
              <Plus className="h-4 w-4" />
              <span className="max-[360px]:hidden">Yangi aksiya</span>
            </Button>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2" role="tablist" aria-label="Marketing bo'limlari">
          {(
            [
              { value: 'promos', label: 'Promo kodlar', count: promos.length, icon: Tag, desc: 'Chegirma kodlari' },
              { value: 'referrals', label: 'Referral', count: referrals.length, icon: Share2, desc: "Do'stini taklif qil" },
              { value: 'campaigns', label: 'Aksiyalar', count: campaigns.length, icon: Megaphone, desc: 'Vaqtinchalik takliflar' },
            ] as const
          ).map((item) => {
            const active = tab === item.value
            const Icon = item.icon
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.value)}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-[14px] border p-2 text-left transition sm:gap-2.5 sm:p-3',
                  active
                    ? 'border-brand/50 bg-brand-soft/60 shadow-card'
                    : 'border-line bg-white shadow-card hover:border-line-2',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition sm:h-9 sm:w-9',
                    active ? 'bg-brand text-white' : 'bg-muted text-ink-3',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[11.5px] font-semibold leading-tight text-ink sm:text-[12.5px]">
                    <span className="truncate">{item.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                        active ? 'bg-white text-brand-text' : 'bg-muted text-ink-3',
                      )}
                    >
                      {number(item.count)}
                    </span>
                  </span>
                  <span className="hidden truncate text-[10.5px] text-ink-3 sm:block">{item.desc}</span>
                </span>
              </button>
            )
          })}
        </div>

        {tab === 'promos' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3.5">
            <div className="flex shrink-0 flex-col gap-2 rounded-[14px] border border-line bg-white px-3 py-2.5 shadow-card lg:flex-row lg:flex-wrap lg:items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Kod bo'yicha qidirish..."
                className="min-w-0 flex-1 lg:max-w-xs"
              />
              <div className="overflow-x-auto no-scrollbar">
                <Segmented
                  className="w-full overflow-x-auto"
                  value={promoStatus}
                  onChange={setPromoStatus}
                  options={[
                    { value: 'all', label: 'Barchasi', count: promos.length },
                    { value: 'active', label: 'Faol', count: promos.filter((promo) => promoState(promo) === 'active').length },
                    { value: 'expired', label: 'Tugagan', count: promos.filter((promo) => promoState(promo) === 'expired').length },
                    { value: 'disabled', label: "O'chirilgan", count: promos.filter((promo) => promoState(promo) === 'disabled').length },
                  ]}
                />
              </div>
              <span className="text-[11px] font-semibold text-ink-3 lg:ml-auto">
                Topildi: <span className="text-ink">{number(filteredPromos.length)}</span> ta
              </span>
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              {filteredPromos.length === 0 ? (
                <div className="grid min-h-0 flex-1 place-items-center p-4">
                  <EmptyState
                    icon={<Tag className="h-5 w-5" />}
                    title="Promo kod topilmadi"
                    text="Yangi kod yaratib, chegirma tarqating."
                    action={
                      <Button onClick={() => setEditingPromo({ ...EMPTY_PROMO, code: generateCode() })}>
                        <Plus className="h-4 w-4" /> Yangi kod
                      </Button>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="hidden min-h-0 flex-1 overflow-y-auto [contain:paint] md:block">
                    <table className="w-full min-w-[860px] text-left">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-line-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                          <th className="px-4 py-2 font-semibold">Kod</th>
                          <th className="py-2 pr-3 font-semibold">Chegirma</th>
                          <th className="py-2 pr-3 font-semibold">Ishlatilgan</th>
                          <th className="py-2 pr-3 font-semibold">Paket</th>
                          <th className="py-2 pr-3 font-semibold">Muddat</th>
                          <th className="py-2 pr-3 font-semibold">Status</th>
                          <th className="px-4 py-2 text-right font-semibold">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-2">
                        {filteredPromos.map((promo) => {
                          const left = daysLeft(promo.expiresAt)
                          const state = promoState(promo)
                          return (
                            <tr key={promo.id} className="text-[12.5px] transition hover:bg-canvas">
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-2 rounded-[8px] border border-dashed border-line bg-canvas px-2.5 py-1 font-mono text-[12px] font-bold tracking-[0.06em] text-ink">
                                  {promo.code}
                                  <button
                                    type="button"
                                    aria-label="Kodni nusxalash"
                                    className="text-ink-3 transition hover:text-brand-text"
                                    onClick={() => copyCode(promo.code)}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              </td>
                              <td className="py-2.5 pr-3 font-semibold text-ink">
                                {promo.discountType === 'percent' ? percent(promo.amount) : money(promo.amount)}
                              </td>
                              <td className="py-2.5 pr-3">
                                <div className="w-36">
                                  <div className="mb-1 flex items-center justify-between text-[11px] text-ink-3">
                                    <span className="font-semibold tabular-nums text-ink-2">{number(promo.used)}</span>
                                    <span className="tabular-nums">{number(promo.limit)}</span>
                                  </div>
                                  <ProgressBar value={Math.min(100, (promo.used / promo.limit) * 100)} />
                                </div>
                              </td>
                              <td className="py-2.5 pr-3 text-ink-2">{PACKAGE_LABEL[promo.packageId]}</td>
                              <td className="py-2.5 pr-3">
                                <div className="text-ink-3">{date(promo.expiresAt)}</div>
                                {state !== 'expired' ? (
                                  <span
                                    className={cn(
                                      'mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                                      left <= 0
                                        ? 'bg-error-bg text-error'
                                        : left <= 7
                                          ? 'bg-warning-bg text-warning'
                                          : 'bg-muted text-ink-3',
                                    )}
                                  >
                                    {left <= 0 ? 'Tugagan' : `${number(left)} kun qoldi`}
                                  </span>
                                ) : null}
                              </td>
                              <td className="py-2.5 pr-3">
                                <Badge tone={PROMO_STATUS[state].tone}>{PROMO_STATUS[state].label}</Badge>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button size="sm" variant="secondary" onClick={() => setEditingPromo(promo)}>
                                    <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => togglePromo(promo)} disabled={state === 'expired'} aria-label={state === 'disabled' ? 'Yoqish' : 'Toʻxtatish'}>
                                    {state === 'disabled' ? (
                                      <Check className="h-3.5 w-3.5 text-success" />
                                    ) : (
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setDeletePromoTarget(promo)} aria-label="O'chirish">
                                    <Trash2 className="h-3.5 w-3.5 text-error" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <ul className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint] md:hidden">
                    {filteredPromos.map((promo) => {
                      const left = daysLeft(promo.expiresAt)
                      const state = promoState(promo)
                      return (
                        <li key={promo.id} className="px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center gap-2 rounded-[8px] border border-dashed border-line bg-canvas px-2.5 py-1 font-mono text-[12px] font-bold tracking-[0.06em] text-ink">
                              {promo.code}
                              <button type="button" aria-label="Nusxalash" className="text-ink-3" onClick={() => copyCode(promo.code)}>
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </span>
                            <Badge tone={PROMO_STATUS[state].tone}>{PROMO_STATUS[state].label}</Badge>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-3">
                            <span className="font-semibold text-ink">
                              {promo.discountType === 'percent' ? percent(promo.amount) : money(promo.amount)}
                            </span>
                            <span>Paket: {PACKAGE_LABEL[promo.packageId]}</span>
                            <span>{date(promo.expiresAt)}</span>
                            {state !== 'expired' ? (
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                                  left <= 0 ? 'bg-error-bg text-error' : left <= 7 ? 'bg-warning-bg text-warning' : 'bg-muted text-ink-3',
                                )}
                              >
                                {left <= 0 ? 'Tugagan' : `${number(left)} kun qoldi`}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1">
                              <ProgressBar value={Math.min(100, (promo.used / promo.limit) * 100)} />
                            </div>
                            <span className="text-[11px] tabular-nums text-ink-3">
                              {number(promo.used)}/{number(promo.limit)}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-1.5">
                            <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditingPromo(promo)}>
                              <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => togglePromo(promo)} disabled={state === 'expired'}>
                              {state === 'disabled' ? 'Yoqish' : 'Toʻxtatish'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeletePromoTarget(promo)} aria-label="O'chirish">
                              <Trash2 className="h-3.5 w-3.5 text-error" />
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </section>
          </div>
        ) : null}

        {tab === 'referrals' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3.5">
            <div className="grid shrink-0 grid-cols-3 divide-x divide-line-2 overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              {[
                { icon: Share2, label: 'Referral kodlar', value: number(referralStats.codes), foot: `${number(referralStats.usedThisMonth)} ta ishlatilgan` },
                { icon: Users, label: 'Taklif qilingan', value: number(referralRows.reduce((total, row) => total + row.invited, 0)), foot: "Jami do'stlar" },
                { icon: Wallet, label: 'Referral daromad', value: money(referralStats.revenue), foot: 'Bu oy ishlatilgan kodlar' },
              ].map((cell) => {
                const Icon = cell.icon
                return (
                  <div key={cell.label} className="min-w-0 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-3">
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{cell.label}</span>
                    </div>
                    <p className="mt-1 truncate text-[17px] font-geist leading-none tabular-nums text-ink sm:text-[18px]">
                      {cell.value}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-ink-3">{cell.foot}</p>
                  </div>
                )
              })}
            </div>

            <div className="grid shrink-0 grid-cols-3 items-end gap-2">
              {podiumOrder.map((referral) => {
                if (!referral) return null
                const rank = referralRows.indexOf(referral) + 1
                const isFirst = rank === 1
                return (
                  <div
                    key={referral.id}
                    className={cn(
                      'flex min-w-0 flex-col items-center rounded-[14px] border bg-white px-2 pb-2.5 pt-3 text-center shadow-card',
                      isFirst ? 'border-brand/50 bg-brand-soft/40' : 'border-line',
                    )}
                  >
                    <span
                      className={cn(
                        'mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                        rank === 1
                          ? 'bg-coin-bg text-[#b45309]'
                          : rank === 2
                            ? 'bg-muted text-ink-2'
                            : 'bg-warning-bg text-warning',
                      )}
                    >
                      <Trophy className="h-3 w-3" />
                      {number(rank)}-o‘rin
                    </span>
                    <Avatar name={referral.userName} size={isFirst ? 'lg' : 'md'} />
                    <p className="mt-1.5 w-full truncate text-[11.5px] font-semibold leading-tight text-ink sm:text-[12.5px]">
                      {referral.userName}
                    </p>
                    <p className="w-full truncate font-mono text-[10px] text-ink-3">{referral.code}</p>
                    <p className={cn('mt-1 tabular-nums', isFirst ? 'text-[14px] font-bold text-ink' : 'text-[12.5px] font-semibold text-ink')}>
                      {money(referral.revenue)}
                    </p>
                    <p className="text-[10px] text-ink-3">{number(referral.invited)} ta taklif</p>
                  </div>
                )
              })}
            </div>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              {restRows.length === 0 ? (
                <div className="grid min-h-0 flex-1 place-items-center p-4">
                  <EmptyState icon={<Share2 className="h-5 w-5" />} title="Boshqa ishtirokchi yo'q" text="Top-3 dan tashqari referral yozuvlari shu yerda ko'rinadi." />
                </div>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-line-2 overflow-y-auto [contain:paint]">
                  {restRows.map((referral) => {
                    const rank = referralRows.indexOf(referral) + 1
                    return (
                      <li key={referral.id} className="flex items-center gap-2.5 px-3 py-2 sm:px-4">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-2 bg-canvas text-[11px] font-bold tabular-nums text-ink-3">
                          {number(rank)}
                        </span>
                        <Avatar name={referral.userName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-semibold text-ink">{referral.userName}</p>
                          <p className="truncate font-mono text-[10.5px] text-ink-3">
                            {referral.code} · {date(referral.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 text-[12.5px] font-bold tabular-nums text-ink">{money(referral.revenue)}</span>
                        <Badge tone="brand">{number(referral.invited)} ta</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        {tab === 'campaigns' ? (
          campaignRows.length === 0 ? (
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
              <div className="grid min-h-0 flex-1 place-items-center p-4">
                <EmptyState
                  icon={<Megaphone className="h-5 w-5" />}
                  title="Aksiya yo'q"
                  text="Yangi aksiya yaratib, foydalanuvchilarni jalb qiling."
                  action={<Button onClick={() => setEditingCampaign({ ...EMPTY_CAMPAIGN })}><Plus className="h-4 w-4" /> Yangi aksiya</Button>}
                />
              </div>
            </section>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto [contain:paint] sm:gap-3.5 lg:grid-cols-2 lg:content-start">
              {campaignRows.map((campaign) => {
                const start = Date.parse(campaign.startsAt)
                const end = Date.parse(campaign.endsAt)
                const elapsed = Math.min(100, Math.max(0, ((NOW - start) / (end - start)) * 100))
                return (
                  <div key={campaign.id} className="flex flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-[10px]',
                            campaign.status === 'active' ? 'bg-brand-soft text-brand-text' : 'bg-muted text-ink-3',
                          )}
                        >
                          <Gift className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">{campaign.name}</p>
                          <p className="truncate text-[11px] text-ink-3">{CAMPAIGN_TYPE[campaign.type]}</p>
                        </div>
                      </div>
                      <Badge tone={CAMPAIGN_STATUS[campaign.status].tone}>{CAMPAIGN_STATUS[campaign.status].label}</Badge>
                    </div>

                    <div className="mt-3 rounded-xl bg-canvas px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">Qiymati</p>
                      <p className="mt-0.5 truncate font-geist text-[17px] font-bold tracking-[-0.01em] text-ink">{campaign.value}</p>
                      {campaign.banner ? (
                        <p className="mt-1.5 line-clamp-2 border-t border-line-2 pt-1.5 text-[11.5px] leading-snug text-ink-2">
                          “{campaign.banner}”
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10.5px] text-ink-3">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {date(campaign.startsAt)} — {date(campaign.endsAt)}
                        </span>
                        <span className="font-bold tabular-nums">{Math.round(elapsed)}%</span>
                      </div>
                      <ProgressBar value={elapsed} />
                    </div>

                    <div className="mt-3 flex gap-1.5 border-t border-line-2 pt-2.5">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditingCampaign(campaign)}>
                        <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteCampaignTarget(campaign)} aria-label="O'chirish">
                        <Trash2 className="h-3.5 w-3.5 text-error" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : null}

        <PromoModal promo={editingPromo} promos={promos} onClose={() => setEditingPromo(null)} onSave={savePromo} />

        <Modal
          open={deletePromoTarget !== null}
          onClose={() => setDeletePromoTarget(null)}
          title="Promo kodni o'chirish"
          description={deletePromoTarget?.code}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeletePromoTarget(null)}>Bekor qilish</Button>
              <Button variant="destructive" onClick={confirmDeletePromo}><Trash2 className="h-4 w-4" /> O'chirish</Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2"><b>{deletePromoTarget?.code}</b> promo kodi o'chiriladi. Foydalanuvchilar uni boshqa ishlata olmaydi.</p>
        </Modal>

        <CampaignModal campaign={editingCampaign} onClose={() => setEditingCampaign(null)} onSave={saveCampaign} />

        <Modal
          open={deleteCampaignTarget !== null}
          onClose={() => setDeleteCampaignTarget(null)}
          title="Aksiyani o'chirish"
          description={deleteCampaignTarget?.name}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteCampaignTarget(null)}>Bekor qilish</Button>
              <Button variant="destructive" onClick={confirmDeleteCampaign}><Trash2 className="h-4 w-4" /> O'chirish</Button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2"><b>{deleteCampaignTarget?.name}</b> aksiyasi o'chiriladi va ilovadagi banner olib tashlanadi.</p>
        </Modal>
      </div>
    </PageTransition>
  )
}

function PromoModal({
  promo,
  promos,
  onClose,
  onSave,
}: {
  promo: Promo | null
  promos: Promo[]
  onClose: () => void
  onSave: (promo: Promo) => void
}) {
  const [draft, setDraft] = useState<Promo | null>(null)
  const current = draft && promo && draft.id === promo.id ? draft : promo

  useEffect(() => {
    setDraft(promo)
  }, [promo])

  const update = (patch: Partial<Promo>) => setDraft((value) => ({ ...(value ?? promo!), ...patch }))

  const duplicates = current ? promos.filter((item) => item.code === current.code && item.id !== current.id) : []

  return (
    <Modal
      open={promo !== null}
      onClose={onClose}
      title={promo?.id ? 'Promo kodni tahrirlash' : 'Yangi promo kod'}
      description={promo?.id ? promo.code : 'Chegirma kodi yarating'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={() => current && onSave(current)}><Check className="h-4 w-4" /> Saqlash</Button>
        </>
      }
    >
      {current ? (
        <div className="space-y-4">
          <Field label="Kod" required error={duplicates.length ? 'Bu kod band' : undefined}>
            <div className="flex gap-2">
              <Input
                value={current.code}
                onChange={(event) => update({ code: event.target.value.toUpperCase() })}
                placeholder="HDP2026"
                className="font-mono uppercase tracking-[0.06em]"
              />
              <Button type="button" variant="secondary" onClick={() => update({ code: generateCode() })} title="Avtomatik generatsiya">
                <RefreshCw className="h-4 w-4" /> Generate
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Chegirma turi">
              <Select value={current.discountType} onChange={(event) => update({ discountType: event.target.value as Promo['discountType'] })}>
                <option value="percent">Foiz (%)</option>
                <option value="amount">So'm</option>
              </Select>
            </Field>
            <Field label="Chegirma miqdori" required>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  value={current.amount}
                  onChange={(event) => update({ amount: Math.max(0, Number(event.target.value)) })}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-3">
                  {current.discountType === 'percent' ? '%' : "so'm"}
                </span>
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Foydalanish limiti" required>
              <Input
                type="number"
                min={1}
                value={current.limit}
                onChange={(event) => update({ limit: Math.max(0, Number(event.target.value)) })}
              />
            </Field>
            <Field label="Muddat" required>
              <Input
                type="date"
                value={dateInput(current.expiresAt)}
                onChange={(event) => update({ expiresAt: `${event.target.value}T23:59:00+05:00` })}
              />
            </Field>
          </div>

          <Field label="Qaysi paket">
            <Select value={current.packageId} onChange={(event) => update({ packageId: event.target.value as Promo['packageId'] })}>
              <option value="all">Barchasi</option>
              <option value="1m">1 oy</option>
              <option value="3m">3 oy</option>
              <option value="1y">1 yil</option>
            </Select>
          </Field>

          <div className="flex items-start gap-2 rounded-lg bg-brand-soft/50 px-3 py-2.5 text-[11.5px] text-brand-text">
            <BadgePercent className="mt-0.5 h-4 w-4 shrink-0" />
            Kod {date(current.expiresAt)} gacha amal qiladi. Har bir foydalanuvchi bir marta ishlatadi.
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function CampaignModal({
  campaign,
  onClose,
  onSave,
}: {
  campaign: Campaign | null
  onClose: () => void
  onSave: (campaign: Campaign) => void
}) {
  const [draft, setDraft] = useState<Campaign | null>(null)
  const current = draft && campaign && draft.id === campaign.id ? draft : campaign
  const update = (patch: Partial<Campaign>) => setDraft((value) => ({ ...(value ?? campaign!), ...patch }))

  useEffect(() => {
    setDraft(campaign)
  }, [campaign])

  const placeholders: Record<CampaignType, string> = {
    discount: 'Masalan: 1 yillik Pro — 299 000 so‘m',
    custom: 'Masalan: 3 oy — 99 000 so‘m',
    trial: 'Masalan: 7 kun',
    bonus: 'Masalan: 3+1 oy',
  }

  return (
    <Modal
      open={campaign !== null}
      onClose={onClose}
      title={campaign?.id ? 'Aksiyani tahrirlash' : 'Yangi aksiya'}
      description={campaign?.id ? campaign.name : 'Vaqtinchalik taklif yoki chegirma yarating'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={() => current && onSave(current)}><Check className="h-4 w-4" /> Saqlash</Button>
        </>
      }
    >
      {current ? (
        <div className="space-y-4">
          <Field label="Nomi" required>
            <Input value={current.name} onChange={(event) => update({ name: event.target.value })} placeholder="Yangi yil aksiyasi" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Aksiya turi">
              <Select value={current.type} onChange={(event) => update({ type: event.target.value as CampaignType })}>
                <option value="discount">Vaqtinchalik chegirma</option>
                <option value="custom">X oy uchun Y so'm</option>
                <option value="trial">Bepul trial (N kun)</option>
                <option value="bonus">2+1 (sovg'a oy)</option>
              </Select>
            </Field>
            <Field label="Qiymati" required>
              <Input value={current.value} onChange={(event) => update({ value: event.target.value })} placeholder={placeholders[current.type]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Boshlanish sanasi">
              <Input
                type="date"
                value={dateInput(current.startsAt)}
                onChange={(event) => update({ startsAt: `${event.target.value}T00:00:00+05:00` })}
              />
            </Field>
            <Field label="Tugash sanasi">
              <Input
                type="date"
                value={dateInput(current.endsAt)}
                onChange={(event) => update({ endsAt: `${event.target.value}T23:59:00+05:00` })}
              />
            </Field>
          </div>

          <Field label="Banner matni" hint="Ilovada foydalanuvchiga ko'rinadigan matn">
            <Textarea value={current.banner} onChange={(event) => update({ banner: event.target.value })} rows={3} maxLength={120} placeholder="Yangi yil sovg'asi: yillik Proga 25% chegirma!" />
          </Field>

          <Field label="Status">
            <Select value={current.status} onChange={(event) => update({ status: event.target.value as CampaignStatus })}>
              <option value="draft">Draft</option>
              <option value="scheduled">Rejalashtirilgan</option>
              <option value="active">Faol</option>
              <option value="finished">Yakunlangan</option>
            </Select>
          </Field>
        </div>
      ) : null}
    </Modal>
  )
}
