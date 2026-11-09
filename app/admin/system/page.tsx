'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Copy,
  DatabaseBackup,
  Download,
  Eye,
  EyeOff,
  FileText,
  PlugZap,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Upload,
  Wrench,
} from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  SearchInput,
  Segmented,
  Select,
  Switch,
  Tabs,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, downloadCsv, money, number, time } from '@/lib/format'
import type { AppSettings, Backup, LogEntry } from '@/lib/types'

const LEVEL: Record<LogEntry['level'], { label: string; tone: 'danger' | 'warning' | 'info' }> = {
  error: { label: 'Error', tone: 'danger' },
  warning: { label: 'Warning', tone: 'warning' },
  info: { label: 'Info', tone: 'info' },
}

export default function SystemPage() {
  const settings = useAppStore((state) => state.settings)
  const logs = useAppStore((state) => state.logs)
  const backups = useAppStore((state) => state.backups)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const createBackup = useAppStore((state) => state.createBackup)
  const { toast } = useToast()

  const [tab, setTab] = useState<'app' | 'payments' | 'logs' | 'backup'>('app')
  const [draft, setDraft] = useState(settings)

  const [level, setLevel] = useState<'all' | LogEntry['level']>('all')
  const [period, setPeriod] = useState('30')
  const [logSearch, setLogSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState(() => new Date())
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null)
  const [testing, setTesting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => setRefreshedAt(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [autoRefresh])

  const update = (patch: Partial<AppSettings>) => setDraft((value) => ({ ...value, ...patch }))

  const saveSettings = () => {
    updateSettings(draft)
    toast({ title: 'Sozlamalar saqlandi', tone: 'success' })
  }

  const testConnection = (provider: 'Payme' | 'Click' | 'Uzum Bank') => {
    setTesting((value) => ({ ...value, [provider]: true }))
    window.setTimeout(() => {
      setTesting((value) => ({ ...value, [provider]: false }))
      toast({
        title: `${provider} ulanishi tekshirildi`,
        description: 'Ulanish muvaffaqiyatli. Webhook javobi 200 OK.',
        tone: 'success',
      })
    }, 900)
  }

  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase()
    const limit = period === 'all' ? Infinity : Number(period) * 3_600_000
    const anchor = new Date('2026-11-08T09:00:00+05:00').getTime()
    return logs.filter((entry) => {
      if (level !== 'all' && entry.level !== level) return false
      if (limit !== Infinity && anchor - new Date(entry.at).getTime() > limit) return false
      if (term && !`${entry.message} ${entry.user} ${entry.ip}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [logs, level, period, logSearch])

  const lastBackup = backups[0]
  const nextBackup = lastBackup ? new Date(new Date(lastBackup.at).getTime() + 86_400_000) : new Date()

  const backupNow = () => {
    createBackup()
    toast({ title: 'Zaxira nusxa yaratildi', description: 'Ma\'lumotlar muvaffaqiyatli saqlandi.', tone: 'success' })
  }

  const restore = () => {
    if (!restoreTarget) return
    toast({
      title: 'Tiklash boshlandi',
      description: `${dateTime(restoreTarget.at)} holatiga tiklanmoqda. Ilova vaqtincha ishlamaydi.`,
      tone: 'warning',
    })
    setRestoreTarget(null)
  }

  return (
    <PageTransition>
      <PageHeader
        title="Tizim"
        subtitle="Ilova sozlamalari, to'lov integratsiyalari, jurnal va zaxira nusxalar"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Tizim' }]}
        actions={
          <Badge tone="success" dot>
            Tizim barqaror · v{settings.currentVersion}
          </Badge>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'app', label: 'Ilova' },
          { value: 'payments', label: "To'lovlar" },
          { value: 'logs', label: 'Jurnal', count: logs.length },
          { value: 'backup', label: 'Zaxira', count: backups.length },
        ]}
        className="mb-5"
      />

      {tab === 'app' ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <section className="card p-0">
              <header className="border-b border-line-2 px-5 py-4">
                <h3 className="h4 text-ink">Umumiy</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Ilova nomi, tavsifi va brending</p>
              </header>
              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ilova nomi">
                    <Input value={draft.appName} onChange={(event) => update({ appName: event.target.value })} />
                  </Field>
                  <Field label="Tavsif">
                    <Input value={draft.description} onChange={(event) => update({ description: event.target.value })} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageField
                    label="Logo yuklash"
                    hint="PNG yoki SVG, tavsiya 512×512"
                    value={draft.logo}
                    onChange={(value) => update({ logo: value })}
                    previewClass="h-14 w-14 rounded-xl"
                  />
                  <ImageField
                    label="Favicon"
                    hint="ICO yoki PNG, 64×64"
                    value={draft.favicon}
                    onChange={(value) => update({ favicon: value })}
                    previewClass="h-10 w-10 rounded-lg"
                  />
                </div>
              </div>
            </section>

            <section className="card p-0">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 px-5 py-4">
                <div>
                  <h3 className="h4 text-ink">Maintenance rejim</h3>
                  <p className="mt-0.5 text-[12px] text-ink-3">Texnik ishlar paytida foydalanuvchi ko'radigan ekran</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[12px] font-semibold', draft.maintenance ? 'text-error' : 'text-ink-3')}>
                    {draft.maintenance ? 'ON' : 'OFF'}
                  </span>
                  <Switch checked={draft.maintenance} onChange={(value) => update({ maintenance: value })} label="Maintenance" />
                </div>
              </header>
              <div className="space-y-4 p-5">
                <Field label="Xabar" hint="Maintenance yoqilganda foydalanuvchiga ko'rinadi">
                  <Textarea
                    value={draft.maintenanceMessage}
                    onChange={(event) => update({ maintenanceMessage: event.target.value })}
                    rows={3}
                    disabled={!draft.maintenance}
                  />
                </Field>
                <Field label="Ruxsat etilgan IP lar" hint="Vergul bilan ajratilgan ro'yxat">
                  <Input value={draft.allowedIps} onChange={(event) => update({ allowedIps: event.target.value })} placeholder="84.54.12.9, 91.186.4.2" />
                </Field>
              </div>
            </section>

            <section className="card p-0">
              <header className="border-b border-line-2 px-5 py-4">
                <h3 className="h4 text-ink">Versiya</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Joriy versiya va majburiy yangilash</p>
              </header>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-canvas px-3.5 py-3">
                  <Badge tone="brand">v{draft.currentVersion}</Badge>
                  <span className="text-[12px] text-ink-3">Build {draft.build}</span>
                  <span className="ml-auto text-[11.5px] text-ink-3">Minimal: {draft.minVersion}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Minimal qo'llab-quvvatlanadigan versiya">
                    <Input value={draft.minVersion} onChange={(event) => update({ minVersion: event.target.value })} />
                  </Field>
                  <Field label="Majburiy yangilash">
                    <div className="flex h-[42px] items-center gap-2">
                      <Switch checked={draft.forceUpdate} onChange={(value) => update({ forceUpdate: value })} label="Majburiy yangilash" />
                      <span className="text-[12px] text-ink-3">{draft.forceUpdate ? 'Yoqilgan' : "O'chirilgan"}</span>
                    </div>
                  </Field>
                </div>
                <Field label="Yangilash xabari">
                  <Textarea value={draft.updateMessage} onChange={(event) => update({ updateMessage: event.target.value })} rows={2} />
                </Field>
              </div>
            </section>

            <div className="flex justify-end">
              <Button onClick={saveSettings}><Save className="h-4 w-4" /> Saqlash</Button>
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className="card">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-text">
                  <Server className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{draft.appName}</p>
                  <p className="text-[11.5px] text-ink-3">{draft.description}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2.5 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-3">Versiya</dt>
                  <dd className="font-semibold text-ink">v{draft.currentVersion} ({draft.build})</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-3">Minimal versiya</dt>
                  <dd className="font-semibold text-ink">{draft.minVersion}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-3">Majburiy yangilash</dt>
                  <dd>{draft.forceUpdate ? <Badge tone="warning">Yoqilgan</Badge> : <Badge tone="gray">O'chirilgan</Badge>}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-3">Maintenance</dt>
                  <dd>{draft.maintenance ? <Badge tone="danger">ON</Badge> : <Badge tone="success">OFF</Badge>}</dd>
                </div>
              </dl>
            </section>

            <section className="card">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                <ShieldCheck className="h-4 w-4" /> Xavfsizlik
              </div>
              <ul className="mt-3 space-y-2 text-[12.5px] text-ink-2">
                <li className="flex items-center justify-between"><span>Ruxsat etilgan IP</span><span className="font-semibold text-ink">{draft.allowedIps.split(',').filter(Boolean).length} ta</span></li>
                <li className="flex items-center justify-between"><span>Jurnal yozuvlari</span><span className="font-semibold text-ink">{logs.length} ta</span></li>
                <li className="flex items-center justify-between"><span>Oxirgi zaxira</span><span className="font-semibold text-ink">{lastBackup ? dateTime(lastBackup.at) : '—'}</span></li>
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      {tab === 'payments' ? (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-3">
            <ProviderCard
              name="Payme"
              fields={[
                { label: 'Merchant ID', value: draft.payme.merchantId, onChange: (value) => update({ payme: { ...draft.payme, merchantId: value } }) },
                { label: 'Secret key', value: draft.payme.secretKey, onChange: (value) => update({ payme: { ...draft.payme, secretKey: value } }) },
              ]}
              footer={
                <div className="space-y-3">
                  <Field label="Webhook URL">
                    <div className="flex gap-2">
                      <Input value={draft.payme.webhook} readOnly className="font-mono text-[11px]" />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard?.writeText(draft.payme.webhook)
                          toast({ title: 'Webhook nusxalandi', tone: 'success' })
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </Field>
                  <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5">
                    <span className="text-[12.5px] font-medium text-ink-2">Test rejim</span>
                    <Switch checked={draft.payme.testMode} onChange={(value) => update({ payme: { ...draft.payme, testMode: value } })} label="Test rejim" />
                  </div>
                </div>
              }
              testing={testing.Payme}
              onTest={() => testConnection('Payme')}
            />

            <ProviderCard
              name="Click"
              fields={[
                { label: 'Service ID', value: draft.click.serviceId, onChange: (value) => update({ click: { ...draft.click, serviceId: value } }) },
                { label: 'Secret key', value: draft.click.secretKey, onChange: (value) => update({ click: { ...draft.click, secretKey: value } }) },
              ]}
              testing={testing.Click}
              onTest={() => testConnection('Click')}
            />

            <ProviderCard
              name="Uzum Bank"
              fields={[
                { label: 'Merchant ID', value: draft.uzum.merchantId, onChange: (value) => update({ uzum: { ...draft.uzum, merchantId: value } }) },
                { label: 'Secret key', value: draft.uzum.secretKey, onChange: (value) => update({ uzum: { ...draft.uzum, secretKey: value } }) },
              ]}
              testing={testing['Uzum Bank']}
              onTest={() => testConnection('Uzum Bank')}
            />
          </div>

          <section className="card p-0">
            <header className="border-b border-line-2 px-5 py-4">
              <h3 className="h4 text-ink">Narxlar</h3>
              <p className="mt-0.5 text-[12px] text-ink-3">Pro paketlar narxi va trial davomiyligi</p>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="1 oylik Pro" hint={money(draft.prices['1m'])}>
                <Input type="number" min={0} value={draft.prices['1m']} onChange={(event) => update({ prices: { ...draft.prices, '1m': Number(event.target.value) } })} />
              </Field>
              <Field label="3 oylik Pro" hint={money(draft.prices['3m'])}>
                <Input type="number" min={0} value={draft.prices['3m']} onChange={(event) => update({ prices: { ...draft.prices, '3m': Number(event.target.value) } })} />
              </Field>
              <Field label="1 yillik Pro" hint={money(draft.prices['1y'])}>
                <Input type="number" min={0} value={draft.prices['1y']} onChange={(event) => update({ prices: { ...draft.prices, '1y': Number(event.target.value) } })} />
              </Field>
              <Field label="Trial davomiyligi" hint="kun">
                <Input type="number" min={0} value={draft.prices.trialDays} onChange={(event) => update({ prices: { ...draft.prices, trialDays: Number(event.target.value) } })} />
              </Field>
            </div>
            <div className="flex justify-end border-t border-line-2 px-5 py-3.5">
              <Button onClick={saveSettings}><Save className="h-4 w-4" /> Saqlash</Button>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'logs' ? (
        <div className="card p-0">
          <div className="flex flex-col gap-3 border-b border-line-2 p-4 lg:flex-row lg:flex-wrap lg:items-center">
            <SearchInput value={logSearch} onChange={setLogSearch} placeholder="Xabar, foydalanuvchi yoki IP..." className="lg:max-w-xs" />
            <div className="overflow-x-auto no-scrollbar">
              <Segmented
                value={level}
                onChange={setLevel}
                options={[
                  { value: 'all', label: 'Barchasi', count: logs.length },
                  { value: 'error', label: 'Error', count: logs.filter((entry) => entry.level === 'error').length },
                  { value: 'warning', label: 'Warning', count: logs.filter((entry) => entry.level === 'warning').length },
                  { value: 'info', label: 'Info', count: logs.filter((entry) => entry.level === 'info').length },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <Select value={period} onChange={(event) => setPeriod(event.target.value)} className="w-[150px]">
                <option value="1">Oxirgi 1 soat</option>
                <option value="6">Oxirgi 6 soat</option>
                <option value="24">Oxirgi 24 soat</option>
                <option value="all">Barcha davr</option>
              </Select>
              <div className="flex items-center gap-2 rounded-lg border border-line-2 px-3 py-2">
                <Switch checked={autoRefresh} onChange={setAutoRefresh} label="Auto-refresh" size="sm" />
                <span className="text-[11.5px] text-ink-3">Auto 30s</span>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCsv(
                    'hdp-system-logs.csv',
                    [
                      ['Vaqt', 'Daraja', 'Xabar', 'Foydalanuvchi', 'IP'],
                      ...filteredLogs.map((entry) => [dateTime(entry.at), entry.level, entry.message, entry.user, entry.ip]),
                    ],
                  )
                }
              >
                <Download className="h-4 w-4" /> CSV
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-2 bg-canvas/60 px-4 py-2 text-[11.5px] text-ink-3">
            <span>Topildi: <b className="text-ink">{number(filteredLogs.length)}</b> ta yozuv</span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className={cn('h-3.5 w-3.5', autoRefresh && 'text-brand-text')} />
              Oxirgi tekshiruv: {time(refreshedAt.toISOString())}
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<FileText className="h-6 w-6" />} title="Jurnal bo'sh" text="Tanlangan filtrlar bo'yicha yozuvlar topilmadi." />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                      <th className="px-4 py-3 font-semibold">Vaqt</th>
                      <th className="px-4 py-3 font-semibold">Daraja</th>
                      <th className="px-4 py-3 font-semibold">Xabar</th>
                      <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                      <th className="px-4 py-3 font-semibold">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {filteredLogs.map((entry) => (
                      <tr key={entry.id} className="transition hover:bg-canvas">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11.5px] text-ink-3">{dateTime(entry.at)}</td>
                        <td className="px-4 py-3"><Badge tone={LEVEL[entry.level].tone}>{LEVEL[entry.level].label}</Badge></td>
                        <td className="px-4 py-3 text-ink-2">{entry.message}</td>
                        <td className="px-4 py-3 text-ink-2">{entry.user}</td>
                        <td className="px-4 py-3 font-mono text-[11.5px] text-ink-3">{entry.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line-2 md:hidden">
                {filteredLogs.map((entry) => (
                  <li key={entry.id} className="space-y-1.5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={LEVEL[entry.level].tone}>{LEVEL[entry.level].label}</Badge>
                      <span className="font-mono text-[11px] text-ink-3">{dateTime(entry.at)}</span>
                    </div>
                    <p className="text-[12.5px] text-ink-2">{entry.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-ink-3">
                      <span>{entry.user}</span>
                      <span className="font-mono">{entry.ip}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      {tab === 'backup' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">So'nggi backup</p>
              <p className="mt-2 font-display text-[20px] font-extrabold text-ink">{lastBackup ? dateTime(lastBackup.at) : '—'}</p>
              <p className="mt-1 text-[11.5px] text-ink-3">{lastBackup?.size ?? ''} hajm</p>
            </div>
            <div className="card">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Keyingi backup</p>
              <p className="mt-2 font-display text-[20px] font-extrabold text-ink">{dateTime(nextBackup.toISOString())}</p>
              <p className="mt-1 text-[11.5px] text-ink-3">Avtomatik, har kuni</p>
            </div>
            <div className="card flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Qo'lda zaxira</p>
                <p className="mt-2 text-[12px] text-ink-3">Barcha ma'lumotlarni hozir saqlang</p>
              </div>
              <Button className="mt-3 w-full" onClick={backupNow}><DatabaseBackup className="h-4 w-4" /> Zaxira nusxa olish</Button>
            </div>
          </div>

          <div className="card p-0">
            <header className="flex items-center justify-between gap-3 border-b border-line-2 px-5 py-4">
              <div>
                <h3 className="h4 text-ink">Tarix</h3>
                <p className="mt-0.5 text-[12px] text-ink-3">Yaratilgan zaxira nusxalar</p>
              </div>
              <Badge tone="gray">{backups.length} ta</Badge>
            </header>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                    <th className="px-4 py-3 font-semibold">Sana</th>
                    <th className="px-4 py-3 font-semibold">Hajm</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="transition hover:bg-canvas">
                      <td className="px-4 py-3 font-medium text-ink">{dateTime(backup.at)}</td>
                      <td className="px-4 py-3 text-ink-2">{backup.size}</td>
                      <td className="px-4 py-3">
                        {backup.status === 'success' ? <Badge tone="success">Muvaffaqiyatli</Badge> : <Badge tone="danger">Xatolik</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => toast({ title: 'Yuklab olindi', description: `${backup.id}.zip`, tone: 'success' })}>
                            <Download className="h-3.5 w-3.5" /> Yuklab olish
                          </Button>
                          <Button size="sm" variant="ghost" disabled={backup.status !== 'success'} onClick={() => setRestoreTarget(backup)}>
                            <RotateCcw className="h-3.5 w-3.5" /> Tiklash
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line-2 md:hidden">
              {backups.map((backup) => (
                <li key={backup.id} className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{dateTime(backup.at)}</p>
                      <p className="text-[11.5px] text-ink-3">{backup.size}</p>
                    </div>
                    {backup.status === 'success' ? <Badge tone="success">Muvaffaqiyatli</Badge> : <Badge tone="danger">Xatolik</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => toast({ title: 'Yuklab olindi', description: `${backup.id}.zip`, tone: 'success' })}>
                      <Download className="h-3.5 w-3.5" /> Yuklab olish
                    </Button>
                    <Button size="sm" variant="ghost" disabled={backup.status !== 'success'} onClick={() => setRestoreTarget(backup)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Tiklash
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-warning-bg bg-warning-bg/50 px-4 py-3 text-[12px] text-[#92400e]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Zaxira nusxasini tiklash joriy ma'lumotlarni almashtiradi. Tiklashdan oldin yangi zaxira nusxa oling.
          </div>
        </div>
      ) : null}

      <Modal
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        title="Zaxira nusxasini tiklash"
        description={restoreTarget ? dateTime(restoreTarget.at) : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRestoreTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={restore}><RotateCcw className="h-4 w-4" /> Ha, tiklash</Button>
          </>
        }
      >
        <div className="flex items-start gap-2.5 rounded-lg bg-warning-bg px-3.5 py-3 text-[12.5px] text-[#92400e]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <b>{restoreTarget ? dateTime(restoreTarget.at) : ''}</b> holatiga tiklanadi. Tiklash jarayonida barcha foydalanuvchilar uchun ilova vaqtincha yopiladi.
          </p>
        </div>
      </Modal>
    </PageTransition>
  )
}

function ProviderCard({
  name,
  fields,
  footer,
  testing,
  onTest,
}: {
  name: string
  fields: Array<{ label: string; value: string; onChange: (value: string) => void }>
  footer?: ReactNode
  testing?: boolean
  onTest: () => void
}) {
  return (
    <section className="card p-0">
      <header className="flex items-center gap-2.5 border-b border-line-2 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-text">
          <PlugZap className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-[14px] font-semibold text-ink">{name}</h3>
          <p className="text-[11px] text-ink-3">To'lov integratsiyasi</p>
        </div>
      </header>
      <div className="space-y-3.5 p-5">
        {fields.map((field) => (
          <Field key={field.label} label={field.label}>
            <SecretInput value={field.value} onChange={field.onChange} />
          </Field>
        ))}
        {footer}
        <Button variant="secondary" className="w-full" onClick={onTest} disabled={testing}>
          <Wrench className={cn('h-4 w-4', testing && 'animate-spin')} />
          {testing ? 'Tekshirilmoqda...' : 'Test ulanishni tekshirish'}
        </Button>
      </div>
    </section>
  )
}

function SecretInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pr-10 font-mono text-[12px]"
        autoComplete="off"
      />
      <button
        type="button"
        aria-label={visible ? 'Yashirish' : "Ko'rsatish"}
        onClick={() => setVisible((state) => !state)}
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-ink-3 transition hover:bg-muted"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function ImageField({
  label,
  hint,
  value,
  onChange,
  previewClass,
}: {
  label: string
  hint: string
  value: string | null
  onChange: (value: string | null) => void
  previewClass: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-canvas px-3 py-3">
        <span className={cn('grid shrink-0 place-items-center overflow-hidden border border-line-2 bg-white text-ink-3', previewClass)}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Yuklash
          </Button>
          {value ? (
            <button type="button" onClick={() => onChange(null)} className="ml-2 text-[11.5px] font-semibold text-error hover:underline">
              O'chirish
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => onChange(String(reader.result))
            reader.readAsDataURL(file)
          }}
        />
      </div>
    </Field>
  )
}
