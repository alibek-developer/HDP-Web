'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDownToLine, ArrowUpRight, BellRing, Check, ChevronRight, CircleHelp, Clock3, Code2, Copy, DatabaseBackup, Eye, EyeOff, FileJson, FileText, Fingerprint, Globe2, Layers3, PlugZap, RefreshCw, RotateCcw, Save, Server, ShieldCheck, SlidersHorizontal, Smartphone, Terminal, Upload, Wrench, X } from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { Badge, Button, EmptyState, Field, IconButton, Input, Modal, SearchInput, Select, Switch, Textarea, cn, useToast } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { dateTime, downloadCsv, money, number, time } from '@/lib/format'
import type { AppSettings, Backup, LogEntry } from '@/lib/types'

const LEVEL = {
  error: { label: 'Error', tone: 'danger' as const, color: 'bg-error' },
  warning: { label: 'Warning', tone: 'warning' as const, color: 'bg-warning' },
  info: { label: 'Info', tone: 'info' as const, color: 'bg-info' },
}
const SECTIONS = [
  { id: 'app', label: 'Ilova', hint: 'Brend va versiya', icon: SlidersHorizontal },
  { id: 'payments', label: 'To‘lovlar', hint: 'Integratsiya va tariflar', icon: PlugZap },
  { id: 'logs', label: 'Jurnal', hint: 'Tizim voqealari', icon: Terminal },
  { id: 'backup', label: 'Zaxira', hint: 'Nusxalar va tiklash', icon: DatabaseBackup },
] as const

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
  const [period, setPeriod] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [logDetail, setLogDetail] = useState<LogEntry | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null)
  const [restoreText, setRestoreText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  useEffect(() => setDraft(settings), [settings])
  useEffect(() => { scrollRef.current?.scrollTo(0, 0) }, [tab])
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => setRefreshedAt(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [autoRefresh])

  const update = (patch: Partial<AppSettings>) => setDraft((value) => ({ ...value, ...patch }))
  const save = () => {
    if (!draft.appName.trim()) return toast({ title: 'Ilova nomini kiriting', tone: 'warning' })
    if (Object.values(draft.prices).some((price) => !Number.isFinite(price) || price < 0)) return toast({ title: 'Narxlar manfiy bo‘lmasligi kerak', tone: 'warning' })
    updateSettings({ ...draft, appName: draft.appName.trim() })
    toast({ title: 'Sozlamalar saqlandi', description: 'O‘zgarishlar joriy demo sessiyasida saqlanadi.', tone: 'success' })
  }
  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase()
    const anchor = Math.max(...logs.map((entry) => new Date(entry.at).getTime()))
    return logs.filter((entry) => (level === 'all' || entry.level === level)
      && (period === 'all' || anchor - new Date(entry.at).getTime() <= Number(period) * 3_600_000)
      && (!term || `${entry.message} ${entry.user} ${entry.ip}`.toLowerCase().includes(term)))
  }, [logs, level, period, logSearch])
  const levelCounts = { error: logs.filter((e) => e.level === 'error').length, warning: logs.filter((e) => e.level === 'warning').length, info: logs.filter((e) => e.level === 'info').length }
  const lastSuccess = backups.find((backup) => backup.status === 'success')
  const failedCount = backups.filter((backup) => backup.status === 'failed').length
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast({ title: 'Nusxalandi', tone: 'success' }) }
    catch { toast({ title: 'Nusxalab bo‘lmadi', description: 'Matnni belgilab nusxalang.', tone: 'warning' }) }
  }
  const downloadMetadata = (backup: Backup) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${backup.id}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <PageTransition>
      <div data-system-workspace className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-brand">
        <header className="flex shrink-0 items-end justify-between gap-3">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-ink-3"><Link href="/admin" className="hover:text-brand">Dashboard</Link><ChevronRight className="h-3 w-3" /><span>Tizim</span></nav>
            <h1 className="h2 mt-1 text-ink">Tizim boshqaruvi</h1>
          </div>
          <div className="mb-0.5 flex items-center gap-2"><span className="hidden text-[12px] text-ink-3 sm:block">Mahalliy muhit</span><Badge tone="gray">Demo</Badge></div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line-2 bg-white">
          <div className="hidden shrink-0 items-center justify-between gap-4 border-b border-line-2 px-5 py-3 sm:flex">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-white"><Server className="h-[18px] w-[18px]" /></span><div className="min-w-0"><p className="truncate text-[13px] font-bold text-ink">{settings.appName}</p><p className="text-[11px] text-ink-3">Platforma konfiguratsiyasi</p></div></div>
            <div className="flex items-center gap-5 text-[11px] text-ink-3"><span className="font-mono">BUILD <b className="font-medium text-ink">{settings.build}</b></span><Badge tone="brand">v{settings.currentVersion}</Badge></div>
          </div>
          <nav aria-label="Tizim bo‘limlari" className="grid shrink-0 grid-cols-4 border-b border-line-2 bg-canvas/40 px-1 sm:px-4">
            {SECTIONS.map(({ id, label, hint, icon: Icon }) => <button key={id} data-system-tab={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)} className={cn('relative flex min-w-0 items-center justify-center gap-2 px-1 py-3 text-left transition sm:justify-start sm:px-3', tab === id ? 'text-brand-text' : 'text-ink-3 hover:bg-white hover:text-ink')}><Icon className="hidden h-[18px] w-[18px] shrink-0 min-[430px]:block" /><span><span className="block text-[12px] font-semibold sm:text-[13px]">{label}</span><span className="mt-0.5 hidden text-[10px] font-normal text-ink-3 lg:block">{hint}</span></span>{tab === id ? <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand sm:left-3 sm:right-6" /> : null}</button>)}
          </nav>

          {tab === 'app' ? <div data-system-panel="app" ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
            <div className="grid lg:grid-cols-[1fr_260px] xl:grid-cols-[1fr_290px]">
              <div className="min-w-0 px-4 sm:px-6">
                <SectionHeading number="01" title="Ilova identifikatsiyasi" text="Foydalanuvchilar sizni qanday ko‘radi" />
                <div className="space-y-4 pb-6">
                  <div className="grid gap-4 xl:grid-cols-2"><Field label="Ilova nomi" required><Input aria-label="Ilova nomi" value={draft.appName} onChange={(e) => update({ appName: e.target.value })} /></Field><Field label="Qisqa tavsif"><Input aria-label="Ilova tavsifi" value={draft.description} onChange={(e) => update({ description: e.target.value })} /></Field></div>
                  <div className="grid gap-3 min-[430px]:grid-cols-2"><ImageField label="Ilova logosi" hint="PNG, SVG · 512 × 512" value={draft.logo} onChange={(logo) => update({ logo })} /><ImageField label="Favicon" hint="PNG, ICO · 64 × 64" value={draft.favicon} onChange={(favicon) => update({ favicon })} /></div>
                </div>
                <div className="border-t border-line-2">
                  <SectionHeading number="02" title="Texnik ishlar" text="Xizmat vaqtincha to‘xtaganda ko‘rinadigan ekran" action={<Switch checked={draft.maintenance} onChange={(maintenance) => update({ maintenance })} label="Maintenance" />} />
                  <div className="space-y-4 pb-6"><Field label="Foydalanuvchiga xabar"><Textarea aria-label="Texnik ishlar xabari" value={draft.maintenanceMessage} onChange={(e) => update({ maintenanceMessage: e.target.value })} rows={2} disabled={!draft.maintenance} /></Field><Field label="Ruxsat etilgan IP manzillar" hint="Vergul bilan ajrating. Ushbu manzillar uchun kirish ochiq qoladi."><Input aria-label="Ruxsat etilgan IP manzillar" className="font-mono text-[12px]" value={draft.allowedIps} onChange={(e) => update({ allowedIps: e.target.value })} /></Field></div>
                </div>
                <div className="border-t border-line-2">
                  <SectionHeading number="03" title="Versiya nazorati" text="Qo‘llab-quvvatlash va yangilanish talablari" />
                  <div className="space-y-4 pb-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Minimal versiya"><Input aria-label="Minimal versiya" value={draft.minVersion} onChange={(e) => update({ minVersion: e.target.value })} className="font-mono" /></Field><Field label="Majburiy yangilash"><div className="flex h-10 items-center gap-2.5"><Switch label="Majburiy yangilash" checked={draft.forceUpdate} onChange={(forceUpdate) => update({ forceUpdate })} /><span className="text-[12px] text-ink-3">{draft.forceUpdate ? 'Yoqilgan' : 'O‘chirilgan'}</span></div></Field></div><Field label="Yangilash xabari"><Textarea aria-label="Yangilash xabari" rows={2} value={draft.updateMessage} onChange={(e) => update({ updateMessage: e.target.value })} /></Field></div>
                </div>
              </div>
              <aside className="border-t border-line-2 bg-[#fafaf9] p-4 sm:p-5 lg:border-l lg:border-t-0">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3"><Eye className="h-3.5 w-3.5" /> Jonli ko‘rinish</p>
                <div data-app-preview className="mt-4 overflow-hidden rounded-xl border border-line-2 bg-white shadow-sm"><div className="flex items-center gap-1.5 border-b border-line-2 bg-canvas/50 px-3 py-2"><span className="h-1.5 w-1.5 rounded-full bg-line" /><span className="h-1.5 w-1.5 rounded-full bg-line" /><span className="h-1.5 w-1.5 rounded-full bg-line" /><span className="ml-2 truncate text-[10px] text-ink-3">{draft.appName}</span></div><div className="px-4 py-6 text-center"><span className="mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-line-brand bg-brand-soft text-brand">{draft.logo ? <img src={draft.logo} alt="Ilova logosi" className="h-full w-full object-contain" /> : <Layers3 className="h-7 w-7" />}</span><p className="mt-3 break-words text-[16px] font-bold tracking-tight text-ink">{draft.appName || 'Ilova nomi'}</p><p className="mt-1 break-words text-[12px] leading-relaxed text-ink-3">{draft.description || 'Qisqa tavsif'}</p></div><div data-maintenance-preview className={cn('border-t px-4 py-3 text-[11px] leading-relaxed', draft.maintenance ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-line-2 bg-canvas/40 text-ink-3')}>{draft.maintenance ? <><span className="mb-1 flex items-center gap-1.5 font-semibold"><Wrench className="h-3.5 w-3.5" />Texnik ishlar</span>{draft.maintenanceMessage}</> : <span className="flex items-center justify-center gap-1.5"><Globe2 className="h-3.5 w-3.5" />Texnik ishlar rejimi o‘chirilgan</span>}</div></div>
                <div className="mt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Reliz ma’lumotlari</p><dl className="mt-3 divide-y divide-line-2 text-[12px]"><div className="flex justify-between py-2.5"><dt className="text-ink-3">Joriy versiya</dt><dd className="font-mono font-semibold text-ink">v{draft.currentVersion}</dd></div><div className="flex justify-between py-2.5"><dt className="text-ink-3">Build raqami</dt><dd className="font-mono text-ink">{draft.build}</dd></div><div className="flex justify-between py-2.5"><dt className="text-ink-3">Minimal versiya</dt><dd className="font-mono text-ink">{draft.minVersion}</dd></div></dl></div>
                <div className="mt-5 flex gap-2 text-[11px] leading-relaxed text-ink-3"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0" /><p>Ko‘rinish o‘zgarishlarni darhol aks ettiradi. Qo‘llash uchun pastdagi saqlash tugmasini bosing.</p></div>
              </aside>
            </div>
          </div> : null}

          {tab === 'payments' ? <div data-system-panel="payments" ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 [contain:paint]">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-[17px] font-bold tracking-tight text-ink">To‘lov infratuzilmasi</h2><p className="mt-1 text-[12px] text-ink-3">Provayder rekvizitlari, maxfiy kalitlar va obuna tariflari.</p></div><Badge tone="gray">3 provayder</Badge></div>
            <div className="grid gap-3 xl:grid-cols-3">
              <Provider name="Payme" mark="P" accent="bg-[#e5f7f7] text-[#168187]" fields={[{ label: 'Merchant ID', value: draft.payme.merchantId, onChange: (merchantId) => update({ payme: { ...draft.payme, merchantId } }) }, { label: 'Secret key', value: draft.payme.secretKey, secret: true, onChange: (secretKey) => update({ payme: { ...draft.payme, secretKey } }) }]} onTest={() => toast({ title: 'Demo muhit', description: 'Serverga so‘rov yuborilmadi. Haqiqiy ulanish uchun backend kerak.', tone: 'warning' })}>
                <div className="flex items-center justify-between gap-2 border-t border-line-2 pt-3"><span className="text-[12px] text-ink-3">Test rejimi</span><Switch label="Payme test rejimi" checked={draft.payme.testMode} onChange={(testMode) => update({ payme: { ...draft.payme, testMode } })} size="sm" /></div>
              </Provider>
              <Provider name="Click" mark="C" accent="bg-[#e8efff] text-[#3863c5]" fields={[{ label: 'Service ID', value: draft.click.serviceId, onChange: (serviceId) => update({ click: { ...draft.click, serviceId } }) }, { label: 'Secret key', value: draft.click.secretKey, secret: true, onChange: (secretKey) => update({ click: { ...draft.click, secretKey } }) }]} onTest={() => toast({ title: 'Demo muhit', description: 'Serverga so‘rov yuborilmadi. Haqiqiy ulanish uchun backend kerak.', tone: 'warning' })} />
              <Provider name="Uzum Bank" mark="U" accent="bg-[#f0eaff] text-[#773cd1]" fields={[{ label: 'Merchant ID', value: draft.uzum.merchantId, onChange: (merchantId) => update({ uzum: { ...draft.uzum, merchantId } }) }, { label: 'Secret key', value: draft.uzum.secretKey, secret: true, onChange: (secretKey) => update({ uzum: { ...draft.uzum, secretKey } }) }]} onTest={() => toast({ title: 'Demo muhit', description: 'Serverga so‘rov yuborilmadi. Haqiqiy ulanish uchun backend kerak.', tone: 'warning' })} />
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line-2 bg-canvas/40 p-4 sm:flex-row sm:items-center"><div className="flex shrink-0 items-center gap-2 text-[12px] font-semibold text-ink"><Code2 className="h-4 w-4 text-ink-3" />Payme webhook</div><div className="flex min-w-0 flex-1 items-center gap-2"><Input aria-label="Payme webhook" readOnly value={draft.payme.webhook} className="min-w-0 font-mono text-[11px]" /><IconButton label="Webhook nusxalash" onClick={() => copy(draft.payme.webhook)}><Copy className="h-4 w-4" /></IconButton></div></div>
            <div className="mt-7 border-t border-line-2 pt-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-[15px] font-bold text-ink">Pro tariflari</h3><p className="mt-1 text-[12px] text-ink-3">Obuna narxlari va bepul sinov muddati</p></div><span className="font-mono text-[11px] text-ink-3">UZS</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{([{ key: '1m', label: '1 oylik Pro', tag: '01 OY' }, { key: '3m', label: '3 oylik Pro', tag: '03 OY' }, { key: '1y', label: '1 yillik Pro', tag: '12 OY' }, { key: 'trialDays', label: 'Trial davomiyligi', tag: 'SINOV' }] as const).map(({ key, label, tag }) => <div key={key} className="rounded-xl border border-line-2 p-4"><span className="font-mono text-[10px] tracking-wider text-brand-text">{tag}</span><div className="mt-3"><Field label={label} hint={key === 'trialDays' ? `${draft.prices[key]} kun` : money(draft.prices[key])}><Input aria-label={label} type="number" min={0} value={draft.prices[key]} onChange={(e) => update({ prices: { ...draft.prices, [key]: Number(e.target.value) } })} /></Field></div></div>)}</div></div>
          </div> : null}

          {tab === 'logs' ? <div data-system-panel="logs" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-line-2 px-3 py-3 sm:px-5">
              <div className="flex items-center gap-3"><SearchInput aria-label="Jurnalni qidirish" value={logSearch} onChange={setLogSearch} placeholder="Xabar, foydalanuvchi yoki IP..." className="min-w-0 flex-1" /><IconButton label="Jurnalni CSV yuklab olish" onClick={() => downloadCsv('hdp-system-logs.csv', [['Vaqt', 'Daraja', 'Xabar', 'Foydalanuvchi', 'IP'], ...filteredLogs.map((entry) => [dateTime(entry.at), entry.level, entry.message, entry.user, entry.ip])])}><ArrowDownToLine className="h-4 w-4" /></IconButton><IconButton label="Jurnalni yangilash" onClick={() => setRefreshedAt(new Date())}><RefreshCw className="h-4 w-4" /></IconButton></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1" aria-label="Jurnal darajasi">{(['all', 'error', 'warning', 'info'] as const).map((value) => <button type="button" key={value} data-log-level={value} aria-pressed={value === level} onClick={() => setLevel(value)} className={cn('flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition sm:px-2.5 sm:text-[12px]', value === level ? 'bg-ink text-white' : 'text-ink-3 hover:bg-muted')}>{value === 'all' ? 'Barchasi' : LEVEL[value].label}<span className={cn('hidden min-[430px]:inline', value === level ? 'text-white/60' : 'text-ink-3')}>{value === 'all' ? logs.length : levelCounts[value]}</span></button>)}</div><div className="w-[138px]"><Select aria-label="Jurnal davri" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="all">Barcha davr</option><option value="1">So‘nggi 1 soat</option><option value="6">So‘nggi 6 soat</option><option value="24">So‘nggi 24 soat</option></Select></div></div>
            </div>
            <div className="hidden shrink-0 grid-cols-[148px_76px_1fr_120px] gap-3 border-b border-line-2 bg-canvas/60 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-3 lg:grid"><span>Vaqt</span><span>Daraja</span><span>Voqea</span><span>Manba / IP</span></div>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
              {filteredLogs.length ? <ul className="divide-y divide-line-2">{filteredLogs.map((entry) => <li data-log-row data-level={entry.level} key={entry.id}><button type="button" data-log-open onClick={() => setLogDetail(entry)} className="group grid w-full gap-x-3 gap-y-2 px-4 py-3 text-left transition hover:bg-canvas/70 lg:grid-cols-[148px_76px_1fr_120px] lg:items-center lg:px-5"><span className="flex items-center justify-between gap-2 lg:contents"><span className="font-mono text-[11px] text-ink-3">{dateTime(entry.at)}</span><span><Badge tone={LEVEL[entry.level].tone}>{LEVEL[entry.level].label}</Badge></span></span><span className="text-[12px] leading-relaxed text-ink-2 lg:font-mono">{entry.message}</span><span className="flex justify-between text-[11px] text-ink-3 lg:block"><span className="block">{entry.user}</span><span className="block font-mono text-[10px] lg:mt-1">{entry.ip}</span></span></button></li>)}</ul> : <div className="p-8"><EmptyState icon={<FileText className="h-6 w-6" />} title="Yozuv topilmadi" text="Qidiruv yoki vaqt filtrini o‘zgartiring." /></div>}
            </div>
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line-2 bg-canvas/30 px-4 py-3 text-[11px] text-ink-3"><span><b className="text-ink">{number(filteredLogs.length)}</b> yozuv <span className="hidden sm:inline">/ {number(logs.length)} · demo jurnal</span></span><div className="flex items-center gap-2"><span className="hidden xl:inline">{refreshedAt ? `Tekshirildi ${time(refreshedAt.toISOString())}` : 'Mahalliy yozuvlar'}</span><Switch label="Auto-refresh" size="sm" checked={autoRefresh} onChange={setAutoRefresh} /><span>Auto 30s</span></div></footer>
          </div> : null}

          {tab === 'backup' ? <div data-system-panel="backup" ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
            <div className="grid lg:grid-cols-[1fr_260px]">
              <div className="min-w-0 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-[17px] font-bold tracking-tight text-ink">Zaxira nusxalar</h2><p className="mt-1 text-[12px] text-ink-3">Saqlangan nuqtalar va tiklash tarixi</p></div><Button data-backup-create size="sm" onClick={() => { createBackup(); toast({ title: 'Demo yozuv yaratildi', description: 'Haqiqiy ma’lumotlar arxivi yaratilmaydi.', tone: 'info' }) }}><DatabaseBackup className="h-4 w-4" />Nusxa olish</Button></div>
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-line-2 bg-canvas/40 px-4 py-3"><ShieldCheck className="h-5 w-5 shrink-0 text-brand" /><div><p className="text-[12px] font-semibold text-ink">{lastSuccess ? 'Oxirgi muvaffaqiyatli nusxa' : 'Muvaffaqiyatli nusxa yo‘q'}</p><p className="mt-0.5 text-[11px] text-ink-3">{lastSuccess ? `${dateTime(lastSuccess.at)} · ${lastSuccess.size}` : 'Yangi nusxa olishdan boshlang'}</p></div></div>
                <div className="mb-1 mt-6 flex items-center justify-between"><h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Nusxalar tarixi</h3><span className="font-mono text-[11px] text-ink-3">{backups.length} yozuv</span></div>
                {backups.length ? <ul>{backups.map((backup, index) => <li data-backup-row data-status={backup.status} key={backup.id} className="relative flex gap-3 py-4"><div className="relative flex w-7 shrink-0 justify-center"><span className={cn('z-10 mt-1 grid h-7 w-7 place-items-center rounded-full border bg-white', backup.status === 'success' ? 'border-line-2 text-ink-3' : 'border-red-200 text-error')} >{backup.status === 'success' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</span>{index !== backups.length - 1 ? <span className="absolute bottom-[-24px] top-8 w-px bg-line-2" /> : null}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[13px] font-semibold text-ink">{dateTime(backup.at)}</p><Badge tone={backup.status === 'success' ? 'success' : 'danger'}>{backup.status === 'success' ? 'Tayyor' : 'Xatolik'}</Badge></div><p className="mt-1 truncate font-mono text-[10px] text-ink-3">{backup.id} <span className="mx-1">·</span> {backup.size}</p><div className="mt-2 flex flex-wrap items-center gap-1"><Button data-backup-metadata size="sm" variant="ghost" onClick={() => downloadMetadata(backup)}><FileJson className="h-3.5 w-3.5" />Ma’lumot</Button><Button data-backup-restore size="sm" variant="ghost" disabled={backup.status !== 'success'} onClick={() => { setRestoreTarget(backup); setRestoreText('') }}><RotateCcw className="h-3.5 w-3.5" />Tiklash</Button></div></div></li>)}</ul> : <EmptyState icon={<DatabaseBackup className="h-6 w-6" />} title="Zaxira nusxa yo‘q" text="Nusxalar tarixi shu yerda ko‘rinadi." />}
              </div>
              <aside className="border-t border-line-2 bg-[#fafaf9] p-5 lg:border-l lg:border-t-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Saqlash xulosasi</p><div className="mt-4 flex items-end gap-2"><span className="font-display text-[40px] font-semibold leading-none tracking-[-0.06em] text-ink">{backups.length}</span><span className="pb-1 text-[12px] text-ink-3">jami nusxa</span></div><div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-line-2">{backups.length ? <><span className="bg-brand" style={{ width: `${(backups.length - failedCount) / backups.length * 100}%` }} /><span className="bg-error" style={{ width: `${failedCount / backups.length * 100}%` }} /></> : null}</div><div className="mt-3 flex justify-between text-[11px] text-ink-3"><span>{backups.length - failedCount} tayyor</span><span>{failedCount} xatolik</span></div><div className="mt-6 border-t border-line-2 pt-5"><div className="flex items-center gap-2 text-[12px] font-semibold text-ink"><Clock3 className="h-4 w-4" />Avtomatik zaxira</div><p className="mt-2 text-[12px] leading-relaxed text-ink-3">Server ulanmagan. Keyingi nusxa olish vaqti belgilanmagan.</p></div><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><p className="text-[12px] font-semibold text-amber-900">Tiklashdan oldin</p><p className="mt-2 text-[11px] leading-relaxed text-amber-800">Haqiqiy muhitda tiklash joriy ma’lumotlarni almashtiradi. Avval yangi nusxa oling.</p></div><p className="mt-4 text-[11px] leading-relaxed text-ink-3">Demo rejimda faqat nusxa yozuvlari boshqariladi. “Ma’lumot” tugmasi JSON tavsifini yuklaydi, ma’lumotlar bazasi arxivini emas.</p></aside>
            </div>
          </div> : null}

          {tab === 'app' || tab === 'payments' ? <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line-2 bg-canvas/30 px-3 py-3 sm:px-6"><span className="flex min-w-0 items-center gap-2 text-[11px] text-ink-3"><span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dirty ? 'bg-brand' : 'bg-line')} /><span className="hidden min-[430px]:inline">{dirty ? 'Saqlanmagan o‘zgarishlar' : 'Barcha o‘zgarishlar saqlangan'}</span><span className="min-[430px]:hidden">{dirty ? 'O‘zgartirildi' : 'Saqlangan'}</span></span><div className="flex items-center gap-1.5"><Button data-reset-settings variant="ghost" size="sm" disabled={!dirty} onClick={() => setDraft(settings)}>Bekor qilish</Button><Button data-save-settings size="sm" disabled={!dirty} onClick={save}><Save className="h-3.5 w-3.5" />Saqlash</Button></div></footer> : null}
        </div>
      </div>

      <Modal open={logDetail !== null} onClose={() => setLogDetail(null)} title="Voqea tafsilotlari" description={logDetail?.id} size="md" footer={<Button variant="ghost" onClick={() => setLogDetail(null)}>Yopish</Button>}>
        {logDetail ? <div className="space-y-5"><div className="flex items-center justify-between gap-3"><Badge tone={LEVEL[logDetail.level].tone}>{LEVEL[logDetail.level].label}</Badge><span className="font-mono text-[11px] text-ink-3">{dateTime(logDetail.at)}</span></div><p className="break-words rounded-xl border border-line-2 bg-canvas p-4 font-mono text-[13px] leading-relaxed text-ink">{logDetail.message}</p><dl className="grid grid-cols-2 gap-4"><div><dt className="text-[11px] text-ink-3">Foydalanuvchi</dt><dd className="mt-1 text-[13px] font-semibold text-ink">{logDetail.user}</dd></div><div><dt className="text-[11px] text-ink-3">IP manzil</dt><dd className="mt-1 font-mono text-[13px] text-ink">{logDetail.ip}</dd></div></dl><Button size="sm" variant="secondary" onClick={() => copy(JSON.stringify(logDetail, null, 2))}><Copy className="h-3.5 w-3.5" />JSON nusxalash</Button></div> : null}
      </Modal>
      <Modal open={restoreTarget !== null} onClose={() => setRestoreTarget(null)} title="Zaxira nusxasini tiklash" description={restoreTarget ? dateTime(restoreTarget.at) : undefined} size="sm" footer={<><Button variant="ghost" onClick={() => setRestoreTarget(null)}>Bekor qilish</Button><Button data-confirm-restore variant="destructive" disabled={restoreText !== 'TIKLASH'} onClick={() => { setRestoreTarget(null); toast({ title: 'Demo: tiklash bajarilmadi', description: 'Ma’lumotlar o‘zgartirilmadi. Haqiqiy tiklash uchun backend kerak.', tone: 'warning' }) }}><RotateCcw className="h-4 w-4" />Tiklash</Button></>}>
        <div className="space-y-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] leading-relaxed text-amber-900">Haqiqiy muhitda bu amal joriy ma’lumotlarni tanlangan nusxa bilan almashtiradi. Demo rejimda hech qanday ma’lumot o‘zgarmaydi.</div><Field label="Tasdiqlash uchun TIKLASH deb yozing"><Input aria-label="Tiklashni tasdiqlash" value={restoreText} onChange={(e) => setRestoreText(e.target.value)} autoComplete="off" placeholder="TIKLASH" /></Field></div>
      </Modal>
    </PageTransition>
  )
}

function SectionHeading({ number, title, text, action }: { number: string; title: string; text: string; action?: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-5"><div><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-brand-text">{number}</span><h2 className="text-[14px] font-bold text-ink">{title}</h2></div><p className="mt-1 text-[11px] leading-relaxed text-ink-3">{text}</p></div>{action}</div>
}

function Provider({ name, mark, accent, fields, onTest, children }: { name: string; mark: string; accent: string; fields: Array<{ label: string; value: string; secret?: boolean; onChange: (value: string) => void }>; onTest: () => void; children?: ReactNode }) {
  return <section data-provider className="flex flex-col rounded-xl border border-line-2 p-4"><header className="mb-4 flex items-center gap-2.5"><span className={cn('grid h-9 w-9 place-items-center rounded-xl text-[20px] font-extrabold', accent)}>{mark}</span><div><h3 className="text-[14px] font-bold text-ink">{name}</h3><p className="text-[10px] text-ink-3">Ulanish tekshirilmagan</p></div></header><div className="flex-1 space-y-3">{fields.map((field) => <Field key={field.label} label={field.label}>{field.secret ? <SecretInput label={`${name} ${field.label}`} value={field.value} onChange={field.onChange} /> : <Input aria-label={`${name} ${field.label}`} value={field.value} onChange={(e) => field.onChange(e.target.value)} className="font-mono text-[12px]" />}</Field>)}{children}</div><Button data-test-provider={name} variant="ghost" size="sm" className="mt-4 w-full border border-line-2" onClick={onTest}><PlugZap className="h-3.5 w-3.5" />Ulanishni tekshirish<ArrowUpRight className="ml-auto h-3 w-3" /></Button></section>
}

function SecretInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false)
  return <div className="relative"><Input aria-label={label} type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" spellCheck={false} className="pr-10 font-mono text-[12px]" /><button type="button" aria-label={`${label} ${visible ? 'yashirish' : 'ko‘rsatish'}`} onClick={() => setVisible(!visible)} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-muted">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
}

function ImageField({ label, hint, value, onChange }: { label: string; hint: string; value: string | null; onChange: (value: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  return <div className="rounded-xl border border-dashed border-line p-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-line-2 bg-canvas text-ink-3">{value ? <img src={value} alt={label} className="h-full w-full object-contain" /> : <Fingerprint className="h-5 w-5" />}</span><div className="min-w-0"><p className="text-[12px] font-semibold text-ink">{label}</p><p className="mt-0.5 text-[10px] text-ink-3">{hint}</p></div></div><div className="mt-3 flex items-center gap-2"><Button aria-label={`${label} yuklash`} variant="ghost" size="sm" className="border border-line-2" onClick={() => input.current?.click()}><Upload className="h-3.5 w-3.5" />Yuklash</Button>{value ? <IconButton label={`${label} o‘chirish`} onClick={() => onChange(null)}><X className="h-4 w-4" /></IconButton> : null}</div><input ref={input} aria-label={`${label} fayli`} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) return toast({ title: 'Rasm faylini tanlang', tone: 'warning' }); const reader = new FileReader(); reader.onload = () => onChange(String(reader.result)); reader.readAsDataURL(file); e.target.value = '' }} /></div>
}
