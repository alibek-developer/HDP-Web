'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { Award, Check, Download, Eye, Move, Pencil, RefreshCw, Trash2 } from 'lucide-react'
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
  Tabs,
  cn,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { date, dateInput } from '@/lib/format'
import type { CertStatus, CertTemplate, CertType, Certificate } from '@/lib/types'

const TYPE_LABEL: Record<CertType, string> = {
  course: 'Kurs sertifikati',
  olympiad: 'Olimpiada sertifikati',
  pro: 'Pro sertifikat',
}

const STATUS: Record<CertStatus, { label: string; tone: 'success' | 'info' | 'warning' }> = {
  issued: { label: 'Berilgan', tone: 'success' },
  sent: { label: 'Yuborilgan', tone: 'info' },
  pending: { label: 'Kutilmoqda', tone: 'warning' },
}

const THEME_LABEL = {
  green: 'Yashil',
  gold: 'Oltin',
  premium: 'Premium',
}

const THEMES: Record<
  CertTemplate['theme'],
  { frame: string; panel: string; title: string; subtitle: string; element: string; accent: string; footer: string }
> = {
  green: {
    frame: 'border-[#bbf7d0]',
    panel: 'bg-gradient-to-br from-[#f0fdf4] via-white to-[#dcfce7]',
    title: 'text-[#14532d]',
    subtitle: 'text-[#166534]',
    element: 'text-[#14532d]',
    accent: 'bg-[#16a34a]',
    footer: 'text-[#15803d]',
  },
  gold: {
    frame: 'border-[#fde68a]',
    panel: 'bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a]/60',
    title: 'text-[#78350f]',
    subtitle: 'text-[#92400e]',
    element: 'text-[#78350f]',
    accent: 'bg-[#d97706]',
    footer: 'text-[#92400e]',
  },
  premium: {
    frame: 'border-[#14532d]',
    panel: 'bg-gradient-to-br from-[#052e16] via-[#14532d] to-[#166534]',
    title: 'text-white',
    subtitle: 'text-[#bbf7d0]',
    element: 'text-white',
    accent: 'bg-[#fbbf24]',
    footer: 'text-[#86efac]',
  },
}

export default function CertificatesPage() {
  const certificates = useAppStore((state) => state.certificates)
  const certTemplates = useAppStore((state) => state.certTemplates)
  const resendCertificate = useAppStore((state) => state.resendCertificate)
  const deleteCertificate = useAppStore((state) => state.deleteCertificate)
  const updateTemplate = useAppStore((state) => state.updateTemplate)
  const { toast } = useToast()

  const [tab, setTab] = useState<'list' | 'templates'>('list')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | CertType>('all')
  const [status, setStatus] = useState<'all' | CertStatus>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [viewing, setViewing] = useState<Certificate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<CertTemplate | null>(null)

  const templateFor = (certType: CertType) => certTemplates.find((template) => template.type === certType) ?? certTemplates[0]

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return certificates
      .filter((certificate) => {
        if (type !== 'all' && certificate.type !== type) return false
        if (status !== 'all' && certificate.status !== status) return false
        const issued = dateInput(certificate.issuedAt)
        if (from && issued < from) return false
        if (to && issued > to) return false
        if (term && !certificate.userName.toLowerCase().includes(term)) return false
        return true
      })
      .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt))
  }, [certificates, type, status, from, to, search])

  const resend = (certificate: Certificate) => {
    resendCertificate(certificate.id)
    toast({ title: 'Sertifikat qayta yuborildi', description: `${certificate.userName} · ${TYPE_LABEL[certificate.type]}`, tone: 'success' })
    setViewing(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCertificate(deleteTarget.id)
    toast({ title: 'Sertifikat o‘chirildi', description: deleteTarget.userName, tone: 'success' })
    setDeleteTarget(null)
    setViewing(null)
  }

  const saveTemplate = (template: CertTemplate) => {
    updateTemplate(template)
    toast({ title: 'Shablon saqlandi', description: template.name, tone: 'success' })
    setEditingTemplate(null)
  }

  return (
    <PageTransition>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            Sertifikatlar <Badge tone="brand">{certificates.length} ta</Badge>
          </span>
        }
        subtitle="Berilgan sertifikatlar va dizayn shablonlarini boshqaring"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Sertifikatlar' }]}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'list', label: 'Sertifikatlar', count: certificates.length },
          { value: 'templates', label: 'Shablonlar', count: certTemplates.length },
        ]}
        className="mb-5"
      />

      {tab === 'list' ? (
        <div className="card p-0">
          <div className="flex flex-col gap-3 border-b border-line-2 p-4 lg:flex-row lg:flex-wrap lg:items-end">
            <SearchInput value={search} onChange={setSearch} placeholder="Foydalanuvchi ismi..." className="lg:max-w-xs" />
            <div className="overflow-x-auto no-scrollbar">
              <Segmented
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'Barchasi', count: certificates.length },
                  { value: 'issued', label: 'Berilgan', count: certificates.filter((item) => item.status === 'issued').length },
                  { value: 'sent', label: 'Yuborilgan', count: certificates.filter((item) => item.status === 'sent').length },
                  { value: 'pending', label: 'Kutilmoqda', count: certificates.filter((item) => item.status === 'pending').length },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Select value={type} onChange={(event) => setType(event.target.value as 'all' | CertType)} className="min-w-[150px]">
                <option value="all">Barcha tur</option>
                <option value="course">Kurs sertifikati</option>
                <option value="olympiad">Olimpiada sertifikati</option>
                <option value="pro">Pro sertifikat</option>
              </Select>
              <Field label="Dan" className="hidden sm:block">
                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </Field>
              <Field label="Gacha" className="hidden sm:block">
                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </Field>
              <Field label="Dan" className="sm:hidden">
                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </Field>
              <Field label="Gacha" className="sm:hidden">
                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </Field>
            </div>
            <span className="text-[12px] text-ink-3 lg:ml-auto">Topildi: <span className="font-semibold text-ink">{filtered.length}</span> ta</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Award className="h-6 w-6" />} title="Sertifikat topilmadi" text="Filtrlarni o'zgartirib qayta urinib ko'ring." />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                      <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                      <th className="px-4 py-3 font-semibold">Tur</th>
                      <th className="px-4 py-3 font-semibold">Sana</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {filtered.map((certificate) => (
                      <tr key={certificate.id} className="transition hover:bg-canvas">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{certificate.userName}</p>
                          <p className="font-mono text-[11px] text-ink-3">{certificate.id}</p>
                        </td>
                        <td className="px-4 py-3"><Badge tone={certificate.type === 'pro' ? 'violet' : certificate.type === 'olympiad' ? 'coin' : 'brand'}>{TYPE_LABEL[certificate.type]}</Badge></td>
                        <td className="px-4 py-3 text-ink-3">{date(certificate.issuedAt)}</td>
                        <td className="px-4 py-3"><Badge tone={STATUS[certificate.status].tone}>{STATUS[certificate.status].label}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => setViewing(certificate)}><Eye className="h-3.5 w-3.5" /> Ko'rish</Button>
                            <Button size="sm" variant="ghost" onClick={() => resend(certificate)} title="Qayta yuborish"><RefreshCw className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(certificate)} title="O'chirish"><Trash2 className="h-3.5 w-3.5 text-error" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line-2 md:hidden">
                {filtered.map((certificate) => (
                  <li key={certificate.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{certificate.userName}</p>
                        <p className="font-mono text-[11px] text-ink-3">{certificate.id} · {date(certificate.issuedAt)}</p>
                      </div>
                      <Badge tone={STATUS[certificate.status].tone}>{STATUS[certificate.status].label}</Badge>
                    </div>
                    <Badge tone={certificate.type === 'pro' ? 'violet' : certificate.type === 'olympiad' ? 'coin' : 'brand'}>{TYPE_LABEL[certificate.type]}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => setViewing(certificate)}><Eye className="h-3.5 w-3.5" /> Ko'rish</Button>
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => resend(certificate)}><RefreshCw className="h-3.5 w-3.5" /> Qayta yuborish</Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(certificate)} aria-label="O'chirish"><Trash2 className="h-3.5 w-3.5 text-error" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certTemplates.map((template) => (
            <div key={template.id} className="card card-hover flex flex-col p-0">
              <div className="p-4">
                <CertificateCanvas template={template} name="Aziza Karimova" issuedAt="2026-11-01T10:00:00+05:00" compact />
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{template.name}</p>
                  <p className="text-[11.5px] text-ink-3">{THEME_LABEL[template.theme]} dizayn · {template.elements.length} element</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditingTemplate(template)}><Pencil className="h-3.5 w-3.5" /> Tahrirlash</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title="Sertifikat"
        description={viewing ? `${viewing.id} · ${viewing.userName}` : undefined}
        size="lg"
        footer={
          viewing ? (
            <>
              <Button variant="ghost" onClick={() => setViewing(null)}>Yopish</Button>
              <Button variant="secondary" onClick={() => toast({ title: 'Yuklab olindi', description: `${viewing.id}.pdf`, tone: 'success' })}><Download className="h-4 w-4" /> PDF yuklab olish</Button>
              <Button onClick={() => resend(viewing)}><RefreshCw className="h-4 w-4" /> Qayta yuborish</Button>
            </>
          ) : null
        }
      >
        {viewing ? (
          <div className="space-y-3">
            <CertificateCanvas template={templateFor(viewing.type)} name={viewing.userName} issuedAt={viewing.issuedAt} />
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2.5 text-[12px] text-ink-3">
              <span>{TYPE_LABEL[viewing.type]}</span>
              <span>{date(viewing.issuedAt)}</span>
              <Badge tone={STATUS[viewing.status].tone}>{STATUS[viewing.status].label}</Badge>
            </div>
          </div>
        ) : null}
      </Modal>

      <TemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} onSave={saveTemplate} />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Sertifikatni o'chirish"
        description={deleteTarget?.userName}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> O'chirish</Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2"><b>{deleteTarget?.userName}</b> ga berilgan sertifikat o'chiriladi. Bu amalni bekor qilib bo'lmaydi.</p>
      </Modal>
    </PageTransition>
  )
}

function CertificateCanvas({
  template,
  name,
  issuedAt,
  compact = false,
  interactive,
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
  const sample: Record<string, string> = {
    name,
    course: 'Matematika — Algebra II',
    place: '1-o‘rin · 96/100 ball',
    program: 'HDP Pro dasturi',
    date: date(issuedAt),
    signature: 'HDP Academy',
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg border-2 shadow-sm',
        theme.frame,
        theme.panel,
        compact ? 'aspect-[1.5/1]' : 'aspect-[1.414/1]',
      )}
    >
      <span className={cn('absolute left-[6%] top-[7%] h-[3px] w-[10%] rounded', theme.accent)} />
      <span className={cn('absolute right-[6%] top-[7%] h-[3px] w-[10%] rounded', theme.accent)} />
      <div className={cn('absolute inset-x-[8%] top-[14%] text-center', theme.title)}>
        <p className={cn('font-display font-extrabold uppercase tracking-[0.18em]', compact ? 'text-[10px]' : 'text-[13px] sm:text-[16px]')}>{template.title}</p>
        <p className={cn('mx-auto mt-1 max-w-[85%] leading-snug', theme.subtitle, compact ? 'text-[6.5px]' : 'text-[9px] sm:text-[11px]')}>{template.subtitle}</p>
      </div>

      {template.elements.map((element) => (
        <div
          key={element.id}
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
          }}
          className={cn(
            'absolute select-none whitespace-nowrap text-center leading-tight',
            theme.element,
            interactive && 'cursor-grab touch-none rounded outline-offset-4 active:cursor-grabbing',
            interactive && selectedId === element.id && 'outline outline-2 outline-dashed outline-[#16a34a]',
          )}
        >
          {sample[element.id] ?? element.label}
        </div>
      ))}

      <p className={cn('absolute inset-x-0 bottom-[7%] text-center', theme.footer, compact ? 'text-[6.5px]' : 'text-[8.5px] sm:text-[10px]')}>{template.footer}</p>
    </div>
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
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(template)
    setSelectedId(template?.elements[0]?.id ?? null)
    setDragging(false)
  }, [template])

  const selected = draft?.elements.find((element) => element.id === selectedId) ?? null

  const updateElement = (patch: Partial<CertTemplate['elements'][number]>) => {
    if (!draft || !selectedId) return
    setDraft({
      ...draft,
      elements: draft.elements.map((element) => (element.id === selectedId ? { ...element, ...patch } : element)),
    })
  }

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !selectedId || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.min(94, Math.max(6, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(94, Math.max(6, ((event.clientY - rect.top) / rect.height) * 100))
    updateElement({ x: Math.round(x), y: Math.round(y) })
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
        <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
          <div className="space-y-3">
            <CertificateCanvas
              template={draft}
              name="Aziza Karimova"
              issuedAt="2026-11-01T10:00:00+05:00"
              interactive
              selectedId={selectedId}
              containerRef={containerRef}
              onElementPointerDown={(elementId, event) => {
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                setSelectedId(elementId)
                setDragging(true)
              }}
              onElementPointerMove={move}
              onElementPointerUp={() => setDragging(false)}
            />
            <div className="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 text-[11.5px] text-ink-3">
              <Move className="h-4 w-4 shrink-0" />
              Elementni ushlab, kerakli joyga sudrab o'tkazing. O'lcham va qalinlikni o'ng paneldan sozlang.
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Sarlavha">
              <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </Field>
            <Field label="Tavsif">
              <Input value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
            </Field>
            <Field label="Pastki matn">
              <Input value={draft.footer} onChange={(event) => setDraft({ ...draft, footer: event.target.value })} />
            </Field>

            <div className="rounded-xl border border-line-2 p-3.5">
              <p className="mb-2 text-[12px] font-semibold text-ink-2">Elementlar</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.elements.map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => setSelectedId(element.id)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11.5px] font-semibold transition',
                      selectedId === element.id ? 'bg-brand-soft text-brand-text' : 'bg-muted text-ink-3 hover:text-ink-2',
                    )}
                  >
                    {element.label}
                  </button>
                ))}
              </div>

              {selected ? (
                <div className="mt-3.5 space-y-3">
                  <Field label="Matn / izoh">
                    <Input value={selected.label} onChange={(event) => updateElement({ label: event.target.value })} />
                  </Field>
                  <Field label={`O'lcham: ${selected.size}px`}>
                    <input
                      type="range"
                      min={8}
                      max={44}
                      step={1}
                      value={selected.size}
                      onChange={(event) => updateElement({ size: Number(event.target.value) })}
                      className="w-full accent-[#16a34a]"
                    />
                  </Field>
                  <Field label="Qalinlik">
                    <Select value={selected.weight} onChange={(event) => updateElement({ weight: Number(event.target.value) })}>
                      <option value={400}>400 — Oddiy</option>
                      <option value={500}>500 — O'rtacha</option>
                      <option value={600}>600 — Yarim qalin</option>
                      <option value={700}>700 — Qalin</option>
                      <option value={800}>800 — Juda qalin</option>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="X (%)">
                      <Input type="number" min={6} max={94} value={Math.round(selected.x)} onChange={(event) => updateElement({ x: Number(event.target.value) })} />
                    </Field>
                    <Field label="Y (%)">
                      <Input type="number" min={6} max={94} value={Math.round(selected.y)} onChange={(event) => updateElement({ y: Number(event.target.value) })} />
                    </Field>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
