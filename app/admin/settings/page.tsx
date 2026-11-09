'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyRound, Mail, Plus, Save, ShieldCheck, Upload, UserRound, Users } from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { relative } from '@/lib/format'
import type { PermissionKey, Role } from '@/lib/types'

const PERMISSIONS: Array<{ key: PermissionKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Foydalanuvchilar' },
  { key: 'content', label: 'Kontent' },
  { key: 'tests', label: 'Testlar' },
  { key: 'olympiads', label: 'Olimpiadalar' },
  { key: 'analytics', label: 'Analitika' },
  { key: 'payments', label: "To'lovlar" },
  { key: 'shop', label: "Do'kon" },
  { key: 'marketing', label: 'Marketing' },
  { key: 'support', label: 'Support' },
  { key: 'certificates', label: 'Sertifikatlar' },
  { key: 'notifications', label: 'Bildirishnomalar' },
  { key: 'system', label: 'Tizim' },
  { key: 'settings', label: 'Sozlamalar' },
]

const ROLE_TONE: Record<string, 'violet' | 'info' | 'brand' | 'warning'> = {
  'role-super': 'violet',
  'role-content': 'info',
  'role-finance': 'brand',
  'role-moderator': 'warning',
}

export default function SettingsPage() {
  const profile = useAppStore((state) => state.profile)
  const admins = useAppStore((state) => state.admins)
  const roles = useAppStore((state) => state.roles)
  const updateProfile = useAppStore((state) => state.updateProfile)
  const upsertAdmin = useAppStore((state) => state.upsertAdmin)
  const updateAdminStatus = useAppStore((state) => state.updateAdminStatus)
  const updateRolePermission = useAppStore((state) => state.updateRolePermission)
  const { toast } = useToast()

  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const avatarInput = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('role-content')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    setName(profile.name)
    setEmail(profile.email)
    setAvatar(profile.avatar)
  }, [profile])

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles])

  const saveProfile = () => {
    if (!name.trim()) return toast({ title: 'Ismni kiriting', tone: 'warning' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast({ title: 'Email noto‘g‘ri', tone: 'warning' })
    updateProfile({ name: name.trim(), email: email.trim(), avatar })
    toast({ title: 'Profil saqlandi', tone: 'success' })
  }

  const savePassword = () => {
    setPasswordError('')
    if (!currentPassword) return setPasswordError('Joriy parolni kiriting')
    if (currentPassword !== 'hdp2026') return setPasswordError('Joriy parol noto‘g‘ri')
    if (newPassword.length < 6) return setPasswordError('Yangi parol kamida 6 belgi bo‘lishi kerak')
    if (newPassword !== confirmPassword) return setPasswordError('Parollar mos kelmadi')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast({ title: 'Parol o‘zgartirildi', description: 'Keyingi kirishda yangi paroldan foydalaning.', tone: 'success' })
  }

  const sendInvite = () => {
    setInviteError('')
    const value = inviteEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setInviteError('Email noto‘g‘ri')
    if (admins.some((admin) => admin.email.toLowerCase() === value)) return setInviteError('Bu email allaqachon adminlar ro‘yxatida')

    const local = value.split('@')[0] ?? 'admin'
    const name = local
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    upsertAdmin({
      id: `admin-${Date.now()}`,
      name,
      email: value,
      roleId: inviteRole,
      lastLogin: '',
      status: 'inactive',
    })
    toast({
      title: 'Taklif yuborildi',
      description: `${value} manziliga ro'yxatdan o'tish havolasi yuborildi.`,
      tone: 'success',
    })
    setInviteOpen(false)
    setInviteEmail('')
    setInviteRole('role-content')
  }

  const toggleAdmin = (id: string, active: boolean) => {
    const admin = admins.find((item) => item.id === id)
    if (!admin) return
    updateAdminStatus(id, active ? 'active' : 'inactive')
    toast({
      title: active ? 'Admin faollashtirildi' : 'Admin bloklandi',
      description: admin.name,
      tone: active ? 'success' : 'warning',
    })
  }

  return (
    <PageTransition>
      <PageHeader
        title="Sozlamalar"
        subtitle="Profil, administratorlar va rollar ruxsatlari"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Sozlamalar' }]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="card p-0">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <div>
              <h3 className="h4 text-ink">Profil</h3>
              <p className="mt-0.5 text-[12px] text-ink-3">Shaxsiy ma'lumotlar va avatar</p>
            </div>
            <UserRound className="h-4 w-4 text-ink-3" />
          </header>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={name} className="h-16 w-16 rounded-full border border-line-2 object-cover" />
              ) : (
                <Avatar name={name || 'Admin'} size="xl" />
              )}
              <div>
                <p className="text-[13px] font-semibold text-ink">{name || 'Administrator'}</p>
                <p className="text-[11.5px] text-ink-3">Super Admin</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => avatarInput.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Avatar yuklash
                  </Button>
                  {avatar ? (
                    <button type="button" onClick={() => setAvatar(null)} className="text-[11.5px] font-semibold text-error hover:underline">
                      O'chirish
                    </button>
                  ) : null}
                </div>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => setAvatar(String(reader.result))
                    reader.readAsDataURL(file)
                  }}
                />
              </div>
            </div>

            <Field label="Ism, familiya" required>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Administrator" />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@hdp.uz" />
            </Field>

            <div className="flex justify-end">
              <Button onClick={saveProfile}><Save className="h-4 w-4" /> Saqlash</Button>
            </div>
          </div>
        </section>

        <section className="card p-0">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <div>
              <h3 className="h4 text-ink">Parolni o'zgartirish</h3>
              <p className="mt-0.5 text-[12px] text-ink-3">Xavfsizlik uchun kuchli parol tanlang</p>
            </div>
            <KeyRound className="h-4 w-4 text-ink-3" />
          </header>
          <div className="space-y-4 p-5">
            <Field label="Joriy parol" required>
              <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="Yangi parol" required hint="Kamida 6 belgi">
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Tasdiqlash" required error={passwordError || undefined}>
              <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
            </Field>
            <div className="flex justify-end">
              <Button onClick={savePassword}><ShieldCheck className="h-4 w-4" /> Parolni saqlash</Button>
            </div>
            <p className="text-[11px] text-ink-3">Demo rejimda joriy parol: <span className="font-mono font-semibold text-ink-2">hdp2026</span></p>
          </div>
        </section>
      </div>

      <section className="card mt-5 p-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 px-5 py-4">
          <div>
            <h3 className="h4 text-ink">Adminlar</h3>
            <p className="mt-0.5 text-[12px] text-ink-3">Administratorlar ro'yxati va rollari</p>
          </div>
          <Button onClick={() => setInviteOpen(true)}><Plus className="h-4 w-4" /> Yangi admin qo'shish</Button>
        </header>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-2 text-[11.5px] uppercase tracking-[0.04em] text-ink-3">
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Oxirgi kirish</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {admins.map((admin) => {
                const role = roleById.get(admin.roleId)
                return (
                  <tr key={admin.id} className="transition hover:bg-canvas">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={admin.name} size="sm" />
                        <span className="font-medium text-ink">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{admin.email}</td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[admin.roleId] ?? 'gray'}>{role?.name ?? '—'}</Badge></td>
                    <td className="px-4 py-3 text-ink-3">{admin.lastLogin ? relative(admin.lastLogin) : 'Kirmagan'}</td>
                    <td className="px-4 py-3">
                      {admin.status === 'active' ? <Badge tone="success" dot>Faol</Badge> : <Badge tone="gray" dot>Nofaol</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button size="sm" variant={admin.status === 'active' ? 'ghost' : 'secondary'} onClick={() => toggleAdmin(admin.id, admin.status !== 'active')}>
                          {admin.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-line-2 md:hidden">
          {admins.map((admin) => {
            const role = roleById.get(admin.roleId)
            return (
              <li key={admin.id} className="space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={admin.name} size="sm" />
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{admin.name}</p>
                      <p className="text-[11px] text-ink-3">{admin.email}</p>
                    </div>
                  </div>
                  {admin.status === 'active' ? <Badge tone="success" dot>Faol</Badge> : <Badge tone="gray" dot>Nofaol</Badge>}
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-ink-3">
                  <Badge tone={ROLE_TONE[admin.roleId] ?? 'gray'}>{role?.name ?? '—'}</Badge>
                  <span>{admin.lastLogin ? relative(admin.lastLogin) : 'Kirmagan'}</span>
                </div>
                <Button size="sm" variant={admin.status === 'active' ? 'secondary' : 'primary'} className="w-full" onClick={() => toggleAdmin(admin.id, admin.status !== 'active')}>
                  {admin.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
                </Button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card mt-5 p-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 px-5 py-4">
          <div>
            <h3 className="h4 text-ink">Rollar va ruxsatlar</h3>
            <p className="mt-0.5 text-[12px] text-ink-3">Har bir rol uchun bo'limlarga kirish huquqini belgilang</p>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
            <Users className="h-4 w-4" /> {roles.length} rol · {PERMISSIONS.length} bo'lim
          </div>
        </header>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1080px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line-2 text-[11px] uppercase tracking-[0.04em] text-ink-3">
                <th className="sticky left-0 z-10 min-w-[170px] bg-white px-4 py-3 font-semibold">Rol</th>
                {PERMISSIONS.map((permission) => (
                  <th key={permission.key} className="px-2 py-3 text-center font-semibold" title={permission.label}>
                    {permission.label.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {roles.map((role) => (
                <tr key={role.id} className="transition hover:bg-canvas/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <p className="font-semibold text-ink">{role.name}</p>
                    <p className="mt-0.5 max-w-[190px] text-[11px] leading-snug text-ink-3">{role.description}</p>
                  </td>
                  {PERMISSIONS.map((permission) => (
                    <td key={permission.key} className="px-2 py-3">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={role.permissions[permission.key]}
                          onChange={(value) => updateRolePermission(role.id, permission.key, value)}
                          label={<span className="sr-only">{role.name} · {permission.label}</span>}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 p-4 md:hidden">
          {roles.map((role) => (
            <MobileRole key={role.id} role={role} onToggle={updateRolePermission} />
          ))}
        </div>

        <div className="border-t border-line-2 px-4 py-3 text-[11.5px] text-ink-3">
          O'zgarishlar darhol saqlanadi. Super Admin barcha bo'limlarga kira oladi.
        </div>
      </section>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Yangi admin qo'shish"
        description="Email yuboriladi va yangi admin ro'yxatdan o'tadi"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Bekor qilish</Button>
            <Button onClick={sendInvite}><Mail className="h-4 w-4" /> Taklif yuborish</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Email" required error={inviteError || undefined}>
            <Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="ism@hdp.uz" />
          </Field>
          <Field label="Rol">
            <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-start gap-2 rounded-lg bg-brand-soft/50 px-3 py-2.5 text-[11.5px] text-brand-text">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            Taklif havolasi 48 soat amal qiladi. Admin ro'yxatdan o'tgach, tanlangan rol beriladi.
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}

function MobileRole({
  role,
  onToggle,
}: {
  role: Role
  onToggle: (roleId: string, key: PermissionKey, value: boolean) => void
}) {
  return (
    <div className="rounded-xl border border-line-2">
      <div className="flex items-start justify-between gap-3 border-b border-line-2 bg-canvas/60 px-3.5 py-3">
        <div>
          <p className="text-[13px] font-semibold text-ink">{role.name}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-3">{role.description}</p>
        </div>
        <Badge tone={ROLE_TONE[role.id] ?? 'gray'}>
          {Object.values(role.permissions).filter(Boolean).length} ruxsat
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2">
        {PERMISSIONS.map((permission) => (
          <Checkbox
            key={permission.key}
            checked={role.permissions[permission.key]}
            onChange={(value) => onToggle(role.id, permission.key, value)}
            label={permission.label}
            className="rounded-md px-2 py-1.5 hover:bg-canvas"
          />
        ))}
      </div>
    </div>
  )
}
