'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import Link from 'next/link'
import {
  Award,
  BadgeCheck,
  Check,
  Clock,
  Download,
  Eye,
  LayoutGrid,
  LayoutTemplate,
  List,
  Move,
  Pencil,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, dateInput, dateLong, number } from '@/lib/format'
import type { CertStatus, CertTemplate, CertType, Certificate, TemplateTheme } from '@/lib/types'

const TYPE_LABEL: Record<CertType, string> = {
  course: 'Kurs sertifikati',
  olympiad: 'Olimpiada sertifikati',
  pro: 'Pro sertifikat',
}

const TYPE_SHORT: Record<CertType, string> = { course: 'Kurs', olympiad: 'Olimpiada', pro: 'Pro' }

const TYPE_TONE: Record<CertType, 'brand' | 'coin' | 'violet'> = {
  course: 'brand',
  olympiad: 'coin',
  pro: 'violet',
}

const STATUS: Record<CertStatus, { label: string; tone: 'success' | 'info' | 'warning'; dot: string }> = {
  issued: { label: 'Berilgan', tone: 'success', dot: 'bg-success' },
  sent: { label: 'Yuborilgan', tone: 'info', dot: 'bg-info' },
  pending: { label: 'Kutilmoqda', tone: 'warning', dot: 'bg-warning' },
}

const THEME_LABEL: Record<TemplateTheme, string> = { green: 'Yashil', gold: 'Oltin', premium: 'Premium' }

const THEME_SWATCH: Record<TemplateTheme, string> = { green: '#16a34a', gold: '#d97706', premium: '#14532d' }

interface Palette {
  frame: string
  from: string
  via: string
  to: string
  title: string
  subtitle: string
  element: string
  accent: string
  footer: string
}

const THEMES: Record<TemplateTheme, Palette> = {
  green: {
    frame: '#86efac',
    from: '#f0fdf4',
    via: '#ffffff',
    to: '#dcfce7',
    title: '#14532d',
    subtitle: '#166534',
    element: '#14532d',
    accent: '#16a34a',
    footer: '#15803d',
  },
  gold: {
    frame: '#fcd34d',
    from: '#fffbeb',
    via: '#fef3c7',
    to: '#fde68a',
    title: '#78350f',
    subtitle: '#92400e',
    element: '#78350f',
    accent: '#d97706',
    footer: '#92400e',
  },
  premium: {
    frame: '#fbbf24',
    from: '#052e16',
    via: '#14532d',
    to: '#166534',
    title: '#ffffff',
    subtitle: '#bbf7d0',
    element: '#ffffff',
    accent: '#fbbf24',
    footer: '#86efac',
  },
}

const sampleFor = (name: string, issuedAt: string): Record<string, string> => ({
  name,
  course: 'Matematika — Algebra II',
  place: '1-o‘rin · 96/100 ball',
  program: 'HDP Pro dasturi',
  date: date(issuedAt),
  signature: 'HDP Academy',
})

function Laurel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="currentColor">
      <circle cx="50" cy="40" r="27" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M50 24l4.6 9.9 10.8 1.3-7.9 7.4 2.1 10.7L50 48l-9.6 5.3 2.1-10.7-7.9-7.4 10.8-1.3z" />
      <path d="M30 66c6 8 13 12 20 12s14-4 20-12l-4 16c-5 4-10 6-16 6s-11-2-16-6z" opacity="0.85" />
    </svg>
  )
}

function CertificateCanvas({
  template,
  name,
  issuedAt,
  compact = false,
  interactive = false,
  selectedId,
  containerRef,
  onElementPointerDown,
  onElementPointerMove,
  onElementPointerUp,
}: {
  template: CertTemplate
  name: string
  issuedAt: string
  compact?: boolean
  interactive?: boolean
  selectedId?: string | null
  containerRef?: RefObject<HTMLDivElement | null>
  onElementPointerDown?: (elementId: string, event: ReactPointerEvent<HTMLDivElement>) => void
  onElementPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onElementPointerUp?: () => void
}) {
  const theme = THEMES[template.theme]
  const sample = sampleFor(name, issuedAt)

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border-2 shadow-sm',
        compact ? 'aspect-[1.5/1]' : 'aspect-[1.414/1]',
      )}
      style={{
        borderColor: theme.frame,
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 52%, ${theme.to} 100%)`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-[3.5%] rounded-md border opacity-70"
        style={{ borderColor: theme.frame }}
      />
      <span className="pointer-events-none absolute left-[3.5%] top-[3.5%] h-[7%] w-[5%] border-l-2 border-t-2" style={{ borderColor: theme.accent }} />
      <span className="pointer-events-none absolute right-[3.5%] top-[3.5%] h-[7%] w-[5%] border-r-2 border-t-2" style={{ borderColor: theme.accent }} />
      <span className="pointer-events-none absolute bottom-[3.5%] left-[3.5%] h-[7%] w-[5%] border-b-2 border-l-2" style={{ borderColor: theme.accent }} />
      <span className="pointer-events-none absolute bottom-[3.5%] right-[3.5%] h-[7%] w-[5%] border-b-2 border-r-2" style={{ borderColor: theme.accent }} />
      <Laurel className="pointer-events-none absolute inset-0 m-auto h-[62%] w-[62%] opacity-[0.06]" />
      <span className="pointer-events-none absolute left-[8%] top-[8%] h-[3px] w-[10%] rounded" style={{ background: theme.accent }} />
      <span className="pointer-events-none absolute right-[8%] top-[8%] h-[3px] w-[10%] rounded" style={{ background: theme.accent }} />

      <div className="pointer-events-none absolute inset-x-[8%] top-[15%] text-center">
        <p
          className={cn('font-display font-extrabold uppercase tracking-[0.18em]', compact ? 'text-[9px]' : 'text-[12px] sm:text-[15px]')}
          style={{ color: theme.title }}
        >
          {template.title}
        </p>
        <p
          className={cn('mx-auto mt-1 max-w-[85%] leading-snug', compact ? 'text-[6px]' : 'text-[8.5px] sm:text-[11px]')}
          style={{ color: theme.subtitle }}
        >
          {template.subtitle}
        </p>
        <span className="mx-auto mt-[3%] block h-px w-[26%]" style={{ background: theme.accent }} />
      </div>

      {template.elements.map((element) => (
        <div
          key={element.id}
          data-element={interactive ? element.id : undefined}
          onPointerDown={interactive ? (event) => onElementPointerDown?.(element.id, event) : undefined}
          onPointerMove={interactive ? onElementPointerMove : undefined}
          onPointerUp={interactive ? onElementPointerUp : undefined}
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            fontSize: `${element.size * (compact ? 0.42 : 0.62)}px`,
            fontWeight: element.weight,
            transform: 'translate(-50%, -50%)',
            width: `${Math.max(28, 92 - Math.abs(element.x - 50))}%`,
            color: theme.element,
            fontFamily: element.id === 'name' ? 'var(--font-display)' : undefined,
          }}
          className={cn(
            'absolute select-none whitespace-nowrap text-center leading-tight',
            interactive
              ? 'z-10 cursor-grab touch-none rounded outline-offset-4 active:cursor-grabbing'
              : 'pointer-events-none',
            interactive && selectedId === element.id && 'outline outline-2 outline-dashed outline-brand',
          )}
        >
          {sample[element.id] ?? element.label}
        </div>
      ))}

      <p
        className={cn('pointer-events-none absolute inset-x-0 bottom-[7%] text-center', compact ? 'text-[6px]' : 'text-[8px] sm:text-[10px]')}
        style={{ color: theme.footer }}
      >
        {template.footer}
      </p>
    </div>
  )
}

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] as string)

function buildCertificateSvg(template: CertTemplate, name: string, issuedAt: string): string {
  const theme = THEMES[template.theme]
  const sample = sampleFor(name, issuedAt)
  const width = 1200
  const height = 849
  const elements = template.elements
    .map((element) => {
      const x = (element.x / 100) * width
      const y = (element.y / 100) * height
      const family = element.id === 'name' ? "Georgia, 'Times New Roman', serif" : 'Arial, Helvetica, sans-serif'
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-family="${family}" font-size="${(element.size * 1.18).toFixed(1)}" font-weight="${element.weight}" fill="${theme.element}">${escapeXml(sample[element.id] ?? element.label)}</text>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.from}"/><stop offset="0.52" stop-color="${theme.via}"/><stop offset="1" stop-color="${theme.to}"/></linearGradient></defs>
<rect width="${width}" height="${height}" fill="url(#bg)"/>
<rect x="18" y="18" width="${width - 36}" height="${height - 36}" fill="none" stroke="${theme.frame}" stroke-width="3"/>
<rect x="42" y="42" width="${width - 84}" height="${height - 84}" fill="none" stroke="${theme.frame}" stroke-width="1" opacity="0.7"/>
<path d="M42 92V42h50M${width - 42} 92V42h-50M42 ${height - 92}v50h50M${width - 42} ${height - 92}v50h-50" fill="none" stroke="${theme.accent}" stroke-width="3"/>
<g opacity="0.06" transform="translate(${width / 2} ${height / 2 - 20})" fill="${theme.element}"><circle r="150" fill="none" stroke="${theme.element}" stroke-width="12"/><circle r="112" fill="none" stroke="${theme.element}" stroke-width="6"/><path d="M0-90l26 56 61 7-45 42 12 60L0 44l-54 31 12-60-45-42 61-7z"/></g>
<rect x="96" y="68" width="120" height="4" rx="2" fill="${theme.accent}"/>
<rect x="${width - 216}" y="68" width="120" height="4" rx="2" fill="${theme.accent}"/>
<text x="${width / 2}" y="140" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="800" letter-spacing="6" fill="${theme.title}">${escapeXml(template.title.toUpperCase())}</text>
<text x="${width / 2}" y="180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="${theme.subtitle}">${escapeXml(template.subtitle)}</text>
<line x1="${width / 2 - 120}" y1="205" x2="${width / 2 + 120}" y2="205" stroke="${theme.accent}" stroke-width="1.5"/>
${elements}
<text x="${width / 2}" y="${height - 57}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="${theme.footer}">${escapeXml(template.footer)}</text>
</svg>`
}

function downloadCertificatePng(certificate: Certificate, template: CertTemplate): Promise<void> {
  return new Promise((resolve, reject) => {
    const svg = buildCertificateSvg(template, certificate.userName, certificate.issuedAt)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 2400
      canvas.height = 1698
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG blob unavailable'))
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${certificate.id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(url), 1500)
        resolve()
      }, 'image/png')
    }
    image.onerror = () => reject(new Error('SVG render failed'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

export default function CertificatesPage() {
  const certificates = useAppStore((state) => state.certificates)
  const certTemplates = useAppStore((state) => state.certTemplates)
  const resendCertificate = useAppStore((state) => state.resendCertificate)
  const deleteCertificate = useAppStore((state) => state.deleteCertificate)
  const updateTemplate = useAppStore((state) => state.updateTemplate)
  const { toast } = useToast()

  const [tab, setTab] = useState<'list' | 'templates'>('list')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | CertType>('all')
  const [status, setStatus] = useState<'all' | CertStatus>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CertTemplate | null>(null)
  const [downloading, setDownloading] = useState(false)

  const viewing = certificates.find((certificate) => certificate.id === viewingId) ?? null
  const templateFor = (certType: CertType) => certTemplates.find((template) => template.type === certType) ?? certTemplates[0]

  const counts = useMemo(
    () => ({
      all: certificates.length,
      issued: certificates.filter((certificate) => certificate.status === 'issued').length,
      sent: certificates.filter((certificate) => certificate.status === 'sent').length,
      pending: certificates.filter((certificate) => certificate.status === 'pending').length,
    }),
    [certificates],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return certificates
      .filter((certificate) => {
        if (type !== 'all' && certificate.type !== type) return false
        if (status !== 'all' && certificate.status !== status) return false
        const issued = dateInput(certificate.issuedAt)
        if (from && issued < from) return false
        if (to && issued > to) return false
        if (term && !certificate.userName.toLowerCase().includes(term) && !certificate.id.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt))
  }, [certificates, type, status, from, to, search])

  const resend = (certificate: Certificate) => {
    resendCertificate(certificate.id)
    toast({ title: 'Sertifikat qayta yuborildi', description: `${certificate.userName} · ${TYPE_LABEL[certificate.type]}`, tone: 'success' })
  }

  const sendPending = () => {
    const pending = certificates.filter((certificate) => certificate.status === 'pending')
    pending.forEach((certificate) => resendCertificate(certificate.id))
    toast({ title: `${pending.length} ta sertifikat yuborildi`, description: 'Kutilayotgan sertifikatlar yuborildi', tone: 'success' })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCertificate(deleteTarget.id)
    toast({ title: 'Sertifikat o‘chirildi', description: deleteTarget.userName, tone: 'success' })
    if (viewingId === deleteTarget.id) setViewingId(null)
    setDeleteTarget(null)
  }

  const download = async (certificate: Certificate) => {
    setDownloading(true)
    try {
      await downloadCertificatePng(certificate, templateFor(certificate.type))
      toast({ title: 'Sertifikat yuklab olindi', description: `${certificate.id}.png`, tone: 'success' })
    } catch {
      toast({ title: 'Yuklab olish imkonsiz', description: 'Sertifikatni render qilib bo‘lmadi', tone: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  const saveTemplate = (template: CertTemplate) => {
    updateTemplate(template)
    toast({ title: 'Shablon saqlandi', description: template.name, tone: 'success' })
    setEditingTemplate(null)
  }

  const statCells = [
    { value: 'all' as const, label: 'Barchasi', count: counts.all, icon: Award, color: 'text-brand', foot: 'Jami sertifikatlar' },
    { value: 'issued' as const, label: 'Berilgan', count: counts.issued, icon: BadgeCheck, color: 'text-success', foot: 'Faol sertifikatlar' },
    { value: 'sent' as const, label: 'Yuborilgan', count: counts.sent, icon: Send, color: 'text-info', foot: 'Yetkazilganlar' },
    { value: 'pending' as const, label: 'Kutilmoqda', count: counts.pending, icon: Clock, color: 'text-warning', foot: 'Yuborish navbati' },
  ]

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-177px)] flex-col gap-2.5 overflow-hidden min-[430px]:h-[calc(100dvh-153px)] sm:gap-3 sm:h-[calc(100dvh-161px)] [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-brand">
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-[12px] text-ink-3" aria-label="Breadcrumb">
              <Link href="/admin" className="transition hover:text-brand">Dashboard</Link>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-ink-2">Sertifikatlar</span>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <h1 className="h2 text-ink">Sertifikatlar</h1>
              <Badge tone="brand">{number(certificates.length)} ta</Badge>
            </div>
          </div>
          <div role="group" aria-label="Sertifikatlar bo‘limi" className="grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:inline-flex">
            <button
              type="button"
              aria-pressed={tab === 'list'}
              onClick={() => setTab('list')}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition',
                tab === 'list' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              <Award className="h-4 w-4" /> Sertifikatlar
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] tabular', tab === 'list' ? 'bg-brand-soft text-brand-text' : 'bg-white/70 text-ink-3')}>{certificates.length}</span>
            </button>
            <button
              type="button"
              aria-pressed={tab === 'templates'}
              onClick={() => setTab('templates')}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition',
                tab === 'templates' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              <LayoutTemplate className="h-4 w-4" /> Shablonlar
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] tabular', tab === 'templates' ? 'bg-brand-soft text-brand-text' : 'bg-white/70 text-ink-3')}>{certTemplates.length}</span>
            </button>
          </div>
        </div>

        {tab === 'list' ? (
          <>
            <div role="group" aria-label="Sertifikat holati bo‘yicha filtr" className="grid shrink-0 grid-cols-4 divide-x divide-line-2 overflow-hidden rounded-xl border border-line-2 bg-white shadow-card">
              {statCells.map((cell) => {
                const Icon = cell.icon
                const active = status === cell.value
                return (
                  <button
                    key={cell.value}
                    type="button"
                    data-status={cell.value}
                    aria-pressed={active}
                    onClick={() => setStatus(cell.value)}
                    className={cn('flex min-w-0 flex-col items-start gap-0.5 p-2.5 text-left transition sm:p-3', active ? 'bg-brand-soft' : 'hover:bg-canvas')}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', cell.color)} />
                      <span className={cn('truncate text-[11px] font-semibold sm:text-[12px]', active ? 'text-brand-text' : 'text-ink-3')}>{cell.label}</span>
                    </span>
                    <span className={cn('font-display text-[20px] font-extrabold leading-none tracking-[-0.02em] tabular sm:text-[24px]', active ? 'text-brand-text' : 'text-ink')}>{number(cell.count)}</span>
                    <span className="hidden truncate text-[11px] text-ink-3 sm:block">{cell.foot}</span>
                  </button>
                )
              })}
            </div>

            <div className="card shrink-0 space-y-2 p-3">
              <div className="flex items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Ism yoki ID bo‘yicha qidirish..." className="min-w-0 flex-1" />
                <IconButton
                  label="Sana filtrlari"
                  aria-expanded={filtersOpen}
                  aria-controls="cert-date-filters"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className={cn('shrink-0 border border-line-2 xl:hidden', filtersOpen && 'bg-brand-soft text-brand-text')}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </IconButton>
                <div role="group" aria-label="Ko‘rinish" className="flex shrink-0 items-center gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    aria-label="Katak ko‘rinish"
                    aria-pressed={view === 'grid'}
                    onClick={() => setView('grid')}
                    className={cn('grid h-7 w-7 place-items-center rounded-md transition', view === 'grid' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ro‘yxat ko‘rinish"
                    aria-pressed={view === 'list'}
                    onClick={() => setView('list')}
                    className={cn('grid h-7 w-7 place-items-center rounded-md transition', view === 'list' ? 'bg-white text-brand-text shadow-sm' : 'text-ink-3 hover:text-ink-2')}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-48">
                  <Select aria-label="Sertifikat turi" value={type} onChange={(event) => setType(event.target.value as 'all' | CertType)} className="w-full">
                    <option value="all">Barcha tur</option>
                    <option value="course">Kurs sertifikati</option>
                    <option value="olympiad">Olimpiada sertifikati</option>
                    <option value="pro">Pro sertifikat</option>
                  </Select>
                </div>
                <div id="cert-date-filters" className={cn('grid-cols-2 gap-2 sm:flex sm:items-center', filtersOpen ? 'grid w-full sm:w-auto' : 'hidden sm:flex')}>
                  <Input type="date" aria-label="Boshlanish sanasi" value={from} onChange={(event) => setFrom(event.target.value)} className="sm:w-40" />
                  <Input type="date" aria-label="Tugash sanasi" value={to} onChange={(event) => setTo(event.target.value)} className="sm:w-40" />
                </div>
                {counts.pending > 0 ? (
                  <Button size="sm" variant="secondary" aria-label="Kutilayotgan sertifikatlarni yuborish" onClick={sendPending} className="ml-auto">
                    <Send className="h-3.5 w-3.5" /> Yuborish
                    <span className="rounded-full bg-warning-bg px-1.5 py-0.5 text-[11px] font-bold text-warning tabular">{counts.pending}</span>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">
              {filtered.length === 0 ? (
                <div className="card">
                  <EmptyState icon={<Award className="h-6 w-6" />} title="Sertifikat topilmadi" text="Filtrlarni o‘zgartirib qayta urinib ko‘ring." />
                </div>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 gap-3 pb-1 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filtered.map((certificate) => (
                    <article key={certificate.id} data-cert-card data-status={certificate.status} data-type={certificate.type} className="card card-hover group flex flex-col p-0">
                      <button
                        type="button"
                        data-cert-open
                        aria-label={`${certificate.userName} sertifikatini ko‘rish`}
                        onClick={() => setViewingId(certificate.id)}
                        className="relative block w-full overflow-hidden rounded-t-xl p-3 text-left"
                      >
                        <CertificateCanvas template={templateFor(certificate.type)} name={certificate.userName} issuedAt={certificate.issuedAt} compact />
                        <span className={cn('absolute right-5 top-5 h-2.5 w-2.5 rounded-full ring-2 ring-white', STATUS[certificate.status].dot)} />
                        <span className="absolute inset-3 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-ink shadow-sm">
                            <Eye className="h-3.5 w-3.5" /> Ko‘rish
                          </span>
                        </span>
                      </button>
                      <div className="mt-auto space-y-2 border-t border-line-2 px-3 py-2.5">
                        <div className="min-w-0">
                          <p data-cert-name className="truncate text-[13px] font-semibold text-ink">{certificate.userName}</p>
                          <p className="font-mono text-[11px] text-ink-3">{certificate.id}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge tone={TYPE_TONE[certificate.type]}>{TYPE_SHORT[certificate.type]}</Badge>
                          <span className="text-[11.5px] text-ink-3">{date(certificate.issuedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge tone={STATUS[certificate.status].tone} dot>{STATUS[certificate.status].label}</Badge>
                          <div className="flex items-center gap-0.5">
                            <IconButton label={`${certificate.userName} sertifikatini qayta yuborish`} onClick={() => resend(certificate)} className="h-7 w-7">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton label={`${certificate.userName} sertifikatini o‘chirish`} onClick={() => setDeleteTarget(certificate)} className="h-7 w-7">
                              <Trash2 className="h-3.5 w-3.5 text-error" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="card overflow-hidden p-0">
                  <div className="sticky top-0 z-10 hidden grid-cols-[1.6fr_0.9fr_0.8fr_0.9fr_108px] gap-2 border-b border-line-2 bg-canvas px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3 md:grid">
                    <span>Foydalanuvchi</span>
                    <span>Tur</span>
                    <span>Sana</span>
                    <span>Status</span>
                    <span className="text-right">Amallar</span>
                  </div>
                  <ul className="divide-y divide-line-2">
                    {filtered.map((certificate) => (
                      <li
                        key={certificate.id}
                        data-cert-row
                        data-status={certificate.status}
                        data-type={certificate.type}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3 transition hover:bg-canvas md:grid-cols-[1.6fr_0.9fr_0.8fr_0.9fr_108px]"
                      >
                        <button type="button" data-cert-open onClick={() => setViewingId(certificate.id)} className="min-w-0 text-left">
                          <p className="truncate text-[13px] font-semibold text-ink">{certificate.userName}</p>
                          <p className="font-mono text-[11px] text-ink-3">{certificate.id}</p>
                        </button>
                        <span className="hidden md:block"><Badge tone={TYPE_TONE[certificate.type]}>{TYPE_SHORT[certificate.type]}</Badge></span>
                        <span className="hidden text-[12.5px] text-ink-3 md:block">{date(certificate.issuedAt)}</span>
                        <span className="justify-self-end md:justify-self-auto"><Badge tone={STATUS[certificate.status].tone} dot>{STATUS[certificate.status].label}</Badge></span>
                        <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
                          <Button size="sm" variant="secondary" onClick={() => setViewingId(certificate.id)}><Eye className="h-3.5 w-3.5" /> Ko‘rish</Button>
                          <IconButton label={`${certificate.userName} sertifikatini qayta yuborish`} onClick={() => resend(certificate)} className="h-8 w-8">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton label={`${certificate.userName} sertifikatini o‘chirish`} onClick={() => setDeleteTarget(certificate)} className="h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5 text-error" />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-[12px] text-ink-3">
              <span>Topildi: <span className="font-semibold text-ink">{filtered.length}</span> · Jami: <span className="font-semibold text-ink">{certificates.length}</span></span>
              {counts.pending > 0 ? <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> {counts.pending} ta yuborish navbatida</span> : <span className="inline-flex items-center gap-1.5 text-success"><Check className="h-3.5 w-3.5" /> Navbat toza</span>}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [contain:paint]">
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2.5 text-[12px] text-brand-text">
              <LayoutTemplate className="h-4 w-4 shrink-0" />
              <span>Har bir sertifikat turi uchun dizayn shabloni. Elementlarni sudrab joylashtiring va rang mavzusini tanlang.</span>
            </div>
            <div className="grid grid-cols-1 gap-4 pb-1 md:grid-cols-2 xl:grid-cols-3">
              {certTemplates.map((template) => (
                <div key={template.id} data-template-card className="card card-hover flex flex-col p-0">
                  <div className="p-4">
                    <CertificateCanvas template={template} name="Aziza Karimova" issuedAt="2026-11-01T10:00:00+05:00" compact />
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{template.name}</p>
                      <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: THEME_SWATCH[template.theme] }} />
                        {THEME_LABEL[template.theme]} · {template.elements.length} element
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setEditingTemplate(template)}><Pencil className="h-3.5 w-3.5" /> Tahrirlash</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={viewing !== null}
        onClose={() => setViewingId(null)}
        title="Sertifikat"
        description={viewing ? `${viewing.id} · ${viewing.userName}` : undefined}
        size="xl"
        footer={
          viewing ? (
            <>
              <Button variant="ghost" aria-label="Sertifikatni o‘chirish" onClick={() => setDeleteTarget(viewing)} className="mr-auto text-error">
                <Trash2 className="h-4 w-4" /> O‘chirish
              </Button>
              <Button variant="secondary" aria-label="Sertifikatni yuklab olish" disabled={downloading} onClick={() => download(viewing)}>
                <Download className="h-4 w-4" /> {downloading ? 'Yuklanmoqda...' : 'PNG yuklab olish'}
              </Button>
              <Button aria-label="Sertifikatni qayta yuborish" onClick={() => resend(viewing)}>
                <RefreshCw className="h-4 w-4" /> Qayta yuborish
              </Button>
            </>
          ) : null
        }
      >
        {viewing ? (
          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <CertificateCanvas template={templateFor(viewing.type)} name={viewing.userName} issuedAt={viewing.issuedAt} />
            <div className="space-y-4">
              <div className="rounded-lg border border-line-2 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">O‘quvchi</p>
                <p className="mt-1 text-[15px] font-semibold text-ink">{viewing.userName}</p>
                <Link href={`/admin/users/${viewing.userId}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-brand transition hover:text-brand-hover">
                  Profilni ko‘rish <Eye className="h-3 w-3" />
                </Link>
              </div>
              <dl className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-3">Turi</dt>
                  <dd><Badge tone={TYPE_TONE[viewing.type]}>{TYPE_LABEL[viewing.type]}</Badge></dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-3">Status</dt>
                  <dd><Badge tone={STATUS[viewing.status].tone} dot>{STATUS[viewing.status].label}</Badge></dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-3">Berilgan sana</dt>
                  <dd className="font-medium text-ink">{dateLong(viewing.issuedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-3">Sertifikat ID</dt>
                  <dd className="font-mono text-[12px] text-ink-2">{viewing.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </Modal>

      <TemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} onSave={saveTemplate} />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Sertifikatni o‘chirish"
        description={deleteTarget?.userName}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> O‘chirish</Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2"><b>{deleteTarget?.userName}</b> ga berilgan sertifikat o‘chiriladi. Bu amalni bekor qilib bo‘lmaydi.</p>
      </Modal>
    </PageTransition>
  )
}

function TemplateEditor({
  template,
  onClose,
  onSave,
}: {
  template: CertTemplate | null
  onClose: () => void
  onSave: (template: CertTemplate) => void
}) {
  const [draft, setDraft] = useState<CertTemplate | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const draggingRef = useRef(false)
  const selectedIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(template)
    const firstId = template?.elements[0]?.id ?? null
    setSelectedId(firstId)
    selectedIdRef.current = firstId
    draggingRef.current = false
  }, [template])

  const selected = draft?.elements.find((element) => element.id === selectedId) ?? null

  const updateElement = (patch: Partial<CertTemplate['elements'][number]>) => {
    if (!selectedId) return
    setDraft((prev) =>
      prev ? { ...prev, elements: prev.elements.map((element) => (element.id === selectedId ? { ...element, ...patch } : element)) } : prev,
    )
  }

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !selectedIdRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.round(Math.min(94, Math.max(6, ((event.clientX - rect.left) / rect.width) * 100)))
    const y = Math.round(Math.min(94, Math.max(6, ((event.clientY - rect.top) / rect.height) * 100)))
    const id = selectedIdRef.current
    setDraft((prev) => (prev ? { ...prev, elements: prev.elements.map((element) => (element.id === id ? { ...element, x, y } : element)) } : prev))
  }

  return (
    <Modal
      open={template !== null}
      onClose={onClose}
      title="Shablon muharriri"
      description={template ? `${template.name} · elementlarni sudrab joylashtiring` : undefined}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={() => draft && onSave(draft)}><Check className="h-4 w-4" /> Saqlash</Button>
        </>
      }
    >
      {draft ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-2">
            <CertificateCanvas
              template={draft}
              name="Aziza Karimova"
              issuedAt="2026-11-01T10:00:00+05:00"
              interactive
              selectedId={selectedId}
              containerRef={containerRef}
              onElementPointerDown={(elementId, event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                draggingRef.current = true
                selectedIdRef.current = elementId
                setSelectedId(elementId)
              }}
              onElementPointerMove={move}
              onElementPointerUp={() => {
                draggingRef.current = false
              }}
            />
            <p className="flex items-center gap-1.5 text-[12px] text-ink-3"><Move className="h-3.5 w-3.5" /> Elementni tanlang va sudrab kerakli joyga qo‘ying.</p>
          </div>
          <div className="space-y-4">
            <Field label="Sarlavha">
              <Input aria-label="Shablon sarlavhasi" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </Field>
            <Field label="Tavsif">
              <Input aria-label="Shablon tavsifi" value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
            </Field>
            <Field label="Pastki matn">
              <Input aria-label="Shablon pastki matni" value={draft.footer} onChange={(event) => setDraft({ ...draft, footer: event.target.value })} />
            </Field>
            <Field label="Rang mavzusi">
              <div role="group" aria-label="Shablon rang mavzusi" className="grid grid-cols-3 gap-2">
                {(Object.keys(THEMES) as TemplateTheme[]).map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    aria-pressed={draft.theme === themeKey}
                    aria-label={`${THEME_LABEL[themeKey]} mavzu`}
                    onClick={() => setDraft({ ...draft, theme: themeKey })}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[12px] font-semibold transition',
                      draft.theme === themeKey ? 'border-brand bg-brand-soft text-brand-text' : 'border-line-2 text-ink-3 hover:border-line hover:text-ink-2',
                    )}
                  >
                    <span className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: THEME_SWATCH[themeKey] }} />
                    {THEME_LABEL[themeKey]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Elementlar">
              <div className="flex flex-wrap gap-1.5">
                {draft.elements.map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    aria-pressed={selectedId === element.id}
                    onClick={() => setSelectedId(element.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[12px] font-semibold transition',
                      selectedId === element.id ? 'border-brand bg-brand-soft text-brand-text' : 'border-line-2 text-ink-3 hover:text-ink-2',
                    )}
                  >
                    {element.label}
                  </button>
                ))}
              </div>
            </Field>
            {selected ? (
              <div className="space-y-3 rounded-lg border border-line-2 bg-canvas p-3">
                <p className="text-[12px] font-semibold text-ink-2">{selected.label} elementini sozlash</p>
                <Field label="Matn / izoh">
                  <Input aria-label="Element matni" value={selected.label} onChange={(event) => updateElement({ label: event.target.value })} />
                </Field>
                <Field label={`O‘lcham · ${selected.size}px`}>
                  <input
                    type="range"
                    aria-label="Element o‘lchami"
                    min={8}
                    max={44}
                    value={selected.size}
                    onChange={(event) => updateElement({ size: Number(event.target.value) })}
                    className="w-full accent-brand"
                  />
                </Field>
                <Field label="Qalinlik">
                  <Select aria-label="Element qalinligi" value={selected.weight} onChange={(event) => updateElement({ weight: Number(event.target.value) })} className="w-full">
                    {[400, 500, 600, 700, 800].map((weight) => (
                      <option key={weight} value={weight}>{weight}</option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="X (%)">
                    <Input type="number" aria-label="Element X koordinatasi" min={6} max={94} value={selected.x} onChange={(event) => updateElement({ x: Math.min(94, Math.max(6, Number(event.target.value) || 0)) })} />
                  </Field>
                  <Field label="Y (%)">
                    <Input type="number" aria-label="Element Y koordinatasi" min={6} max={94} value={selected.y} onChange={(event) => updateElement({ y: Math.min(94, Math.max(6, Number(event.target.value) || 0)) })} />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}