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
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
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
  StatCard,
  Tabs,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, dateInput, money, number, percent } from '@/lib/format'
import { referralStats, referrals as seedReferrals } from '@/lib/mock'
import type { Campaign, CampaignStatus, CampaignType, PackageId, Promo, PromoStatus } from '@/lib/types'

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
      if (promoStatus !== 'all' && promo.status !== promoStatus) return false
      if (term && !promo.code.toLowerCase().includes(term)) return false
      return true
    })
  }, [promos, promoStatus, search])

  const referralRows = useMemo(
    () => [...referrals].sort((left, right) => right.revenue - left.revenue),
    [referrals],
  )

  const savePromo = (promo: Promo) => {
    const code = promo.code.trim().toUpperCase()
    if (!code) return toast({ title: 'Promo kodni kiriting', tone: 'warning' })
    if (promo.amount <= 0) return toast({ title: "Chegirma miqdorini kiriting", tone: 'warning' })
    if (promo.limit <= 0) return toast({ title: 'Foydalanish limitini kiriting', tone: 'warning' })
    if (promos.some((item) => item.code === code && item.id !== promo.id)) {
      return toast({ title: 'Bu kod allaqachon mavjud', tone: 'warning' })
    }
    const expired = new Date(promo.expiresAt).getTime() < new Date('2026-11-08T09:00:00+05:00').getTime()
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

  const totalUsed = promos.reduce((total, promo) => total + promo.used, 0)
  const activePromos = promos.filter((promo) => promo.status === 'active').length
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Marketing <Badge tone="brand">{number(promos.length)} promo</Badge>
          </span>
        }
        subtitle="Promo kodlar, referral dasturi va aksiyalarni boshqaring"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Marketing' }]}
        actions={
          tab === 'promos' ? (
            <Button onClick={() => setEditingPromo({ ...EMPTY_PROMO, code: generateCode() })}>
              <Plus className="h-4 w-4" /> Yangi kod
            </Button>
          ) : tab === 'campaigns' ? (
            <Button onClick={() => setEditingCampaign({ ...EMPTY_CAMPAIGN })}>
              <Plus className="h-4 w-4" /> Yangi aksiya
            </Button>
          ) : null
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faol promo kodlar" value={number(activePromos)} hint={`Jami ${number(promos.length)} ta kod`} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Ishlatilgan" value={number(totalUsed)} hint="Barcha promo kodlar bo'yicha" icon={<BadgePercent className="h-5 w-5" />} iconClass="bg-info-bg text-info" />
        <StatCard label="Referral kodlar" value={number(referralStats.codes)} hint={`Bu oy: ${number(referralStats.usedThisMonth)} ta`} icon={<Share2 className="h-5 w-5" />} iconClass="bg-violet-100 text-[#6d28d9]" />
        <StatCard label="Referral daromad" value={money(referralStats.revenue)} hint="Bu oy ishlatilgan kodlar" icon={<Wallet className="h-5 w-5" />} iconClass="bg-coin-bg text-[#b45309]" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'promos', label: 'Promo kodlar', count: promos.length },
          { value: 'referrals', label: 'Referral', count: referrals.length },
          { value: 'campaigns', label: 'Aksiyalar', count: campaigns.length },
        ]}
        className="mb-5"
      />

      {tab === 'promos' ? (
        <div className="card p-0">
          <div className="flex flex-col gap-3 border-b border-line-2 p-4 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Kod bo'yicha qidirish..." className="sm:max-w-xs" />
            <div className="overflow-x-auto no-scrollbar">
              <Segmented
                value={promoStatus}
                onChange={setPromoStatus}
                options={[
                  { value: 'all', label: 'Barchasi', count: promos.length },
                  { value: 'active', label: 'Faol', count: promos.filter((promo) => promo.status === 'active').length },
                  { value: 'expired', label: 'Tugagan', count: promos.filter((promo) => promo.status === 'expired').length },
                  { value: 'disabled', label: "O'chirilgan", count: promos.filter((promo) => promo.status === 'disabled').length },
                ]}
              />
            </div>
          </div>

          {filteredPromos.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Tag className="h-6 w-6" />} title="Promo kod topilmadi" text="Yangi kod yaratib, chegirma tarqating." />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                      <th className="px-4 py-3 font-semibold">Kod</th>
                      <th className="px-4 py-3 font-semibold">Chegirma</th>
                      <th className="px-4 py-3 font-semibold">Ishlatilgan / Limit</th>
                      <th className="px-4 py-3 font-semibold">Paket</th>
                      <th className="px-4 py-3 font-semibold">Muddati</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {filteredPromos.map((promo) => (
                      <tr key={promo.id} className="transition hover:bg-canvas">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-canvas px-2.5 py-1 font-mono text-[12px] font-bold tracking-[0.06em] text-ink">
                            {promo.code}
                            <button
                              type="button"
                              aria-label="Kodni nusxalash"
                              className="text-ink-3 transition hover:text-brand-text"
                              onClick={() => {
                                navigator.clipboard?.writeText(promo.code)
                                toast({ title: 'Kod nusxalandi', description: promo.code, tone: 'success' })
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">
                          {promo.discountType === 'percent' ? percent(promo.amount) : money(promo.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-36">
                            <div className="mb-1 flex items-center justify-between text-[11.5px] text-ink-3">
                              <span className="font-semibold text-ink-2">{number(promo.used)}</span>
                              <span>{number(promo.limit)}</span>
                            </div>
                            <ProgressBar value={Math.min(100, (promo.used / promo.limit) * 100)} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{PACKAGE_LABEL[promo.packageId]}</td>
                        <td className="px-4 py-3 text-ink-3">{date(promo.expiresAt)}</td>
                        <td className="px-4 py-3"><Badge tone={PROMO_STATUS[promo.status].tone}>{PROMO_STATUS[promo.status].label}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => setEditingPromo(promo)}><Pencil className="h-3.5 w-3.5" /> Tahrirlash</Button>
                            <Button size="sm" variant="ghost" onClick={() => togglePromo(promo)}>
                              {promo.status === 'disabled' ? <Check className="h-3.5 w-3.5 text-success" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeletePromoTarget(promo)} aria-label="O'chirish">
                              <Trash2 className="h-3.5 w-3.5 text-error" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line-2 md:hidden">
                {filteredPromos.map((promo) => (
                  <li key={promo.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-canvas px-2.5 py-1 font-mono text-[12px] font-bold tracking-[0.06em] text-ink">
                        {promo.code}
                        <button
                          type="button"
                          aria-label="Nusxalash"
                          className="text-ink-3"
                          onClick={() => {
                            navigator.clipboard?.writeText(promo.code)
                            toast({ title: 'Kod nusxalandi', description: promo.code, tone: 'success' })
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </span>
                      <Badge tone={PROMO_STATUS[promo.status].tone}>{PROMO_STATUS[promo.status].label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
                      <span className="font-semibold text-ink">{promo.discountType === 'percent' ? percent(promo.amount) : money(promo.amount)}</span>
                      <span>Paket: {PACKAGE_LABEL[promo.packageId]}</span>
                      <span>Muddat: {date(promo.expiresAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar value={Math.min(100, (promo.used / promo.limit) * 100)} />
                      </div>
                      <span className="text-[11.5px] text-ink-3 tabular">{number(promo.used)}/{number(promo.limit)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditingPromo(promo)}><Pencil className="h-3.5 w-3.5" /> Tahrirlash</Button>
                      <Button size="sm" variant="ghost" onClick={() => togglePromo(promo)}>{promo.status === 'disabled' ? 'Yoqish' : "To'xtatish"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeletePromoTarget(promo)} aria-label="O'chirish"><Trash2 className="h-3.5 w-3.5 text-error" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      {tab === 'referrals' ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Jami referral kodlar" value={number(referralStats.codes)} icon={<Share2 className="h-5 w-5" />} />
            <StatCard label="Bu oy ishlatilgan" value={number(referralStats.usedThisMonth)} icon={<Users className="h-5 w-5" />} iconClass="bg-info-bg text-info" />
            <StatCard label="Daromad" value={money(referralStats.revenue)} icon={<Wallet className="h-5 w-5" />} iconClass="bg-coin-bg text-[#b45309]" />
          </div>

          <div className="card p-0">
            <div className="border-b border-line-2 px-4 py-3.5">
              <h3 className="text-[14px] font-semibold text-ink">Referral natijalari</h3>
              <p className="mt-0.5 text-[11.5px] text-ink-3">Foydalanuvchilar tomonidan taklif qilingan do'stlar va daromad</p>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                    <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                    <th className="px-4 py-3 font-semibold">Referral kodi</th>
                    <th className="px-4 py-3 font-semibold">Taklif qilingan</th>
                    <th className="px-4 py-3 font-semibold">Daromad</th>
                    <th className="px-4 py-3 font-semibold">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {referralRows.map((referral) => (
                    <tr key={referral.id} className="transition hover:bg-canvas">
                      <td className="px-4 py-3 font-medium text-ink">{referral.userName}</td>
                      <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-2">{referral.code}</td>
                      <td className="px-4 py-3">
                        <Badge tone="brand">{number(referral.invited)} ta</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular text-ink">{money(referral.revenue)}</td>
                      <td className="px-4 py-3 text-ink-3">{date(referral.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line-2 md:hidden">
              {referralRows.map((referral) => (
                <li key={referral.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{referral.userName}</p>
                    <p className="mt-0.5 font-mono text-[11.5px] text-ink-3">{referral.code} · {date(referral.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-semibold text-ink">{money(referral.revenue)}</p>
                    <p className="text-[11.5px] text-ink-3">{number(referral.invited)} ta taklif</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === 'campaigns' ? (
        campaigns.length === 0 ? (
          <div className="card p-6">
            <EmptyState icon={<Megaphone className="h-6 w-6" />} title="Aksiya yo'q" text="Yangi aksiya yaratib, foydalanuvchilarni jalb qiling." action={<Button onClick={() => setEditingCampaign({ ...EMPTY_CAMPAIGN })}><Plus className="h-4 w-4" /> Yangi aksiya</Button>} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {[...campaigns]
              .sort((left, right) => right.startsAt.localeCompare(left.startsAt))
              .map((campaign) => (
                <div key={campaign.id} className="card card-hover flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        'grid h-10 w-10 place-items-center rounded-xl',
                        campaign.status === 'active' ? 'bg-brand-soft text-brand-text' : 'bg-muted text-ink-3',
                      )}>
                        <Gift className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{campaign.name}</p>
                        <p className="text-[11.5px] text-ink-3">{CAMPAIGN_TYPE[campaign.type]}</p>
                      </div>
                    </div>
                    <Badge tone={CAMPAIGN_STATUS[campaign.status].tone}>{CAMPAIGN_STATUS[campaign.status].label}</Badge>
                  </div>

                  <div className="mt-4 rounded-xl bg-canvas px-3.5 py-3">
                    <p className="text-[12px] text-ink-3">Qiymati</p>
                    <p className="mt-0.5 font-display text-[20px] font-extrabold tracking-[-0.01em] text-ink">{campaign.value}</p>
                    <p className="mt-2 line-clamp-2 text-[12px] text-ink-2">{campaign.banner}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-3">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {date(campaign.startsAt)} — {date(campaign.endsAt)}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-line-2 pt-3">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditingCampaign(campaign)}><Pencil className="h-3.5 w-3.5" /> Tahrirlash</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteCampaignTarget(campaign)} aria-label="O'chirish"><Trash2 className="h-3.5 w-3.5 text-error" /></Button>
                  </div>
                </div>
              ))}
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
