'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Check, ChevronRight, Eye, EyeOff, Fingerprint, KeyRound, LockKeyhole, Mail, Pencil, Plus, Save, Search, ShieldCheck, SlidersHorizontal, Trash2, Upload, UserRound, Users, X } from 'lucide-react'
import { PageTransition } from '@/components/layout/Page'
import { Avatar, Badge, Button, Checkbox, EmptyState, Field, IconButton, Input, Modal, Select, Switch, cn, useToast } from '@/components/ui'
import { useAppStore } from '@/lib/store'
import { relative } from '@/lib/format'
import type { AdminUser, PermissionKey, ProfilePreferences, Role } from '@/lib/types'

const PERMISSIONS: Array<{ key: PermissionKey; label: string; group: string }> = [
  { key: 'dashboard', label: 'Dashboard', group: 'Boshqaruv' },
  { key: 'users', label: 'Foydalanuvchilar', group: 'Boshqaruv' },
  { key: 'analytics', label: 'Analitika', group: 'Boshqaruv' },
  { key: 'content', label: 'Kontent', group: 'Ta’lim' },
  { key: 'tests', label: 'Testlar', group: 'Ta’lim' },
  { key: 'olympiads', label: 'Olimpiadalar', group: 'Ta’lim' },
  { key: 'certificates', label: 'Sertifikatlar', group: 'Ta’lim' },
  { key: 'payments', label: 'To‘lovlar', group: 'Savdo va aloqa' },
  { key: 'shop', label: 'Do‘kon', group: 'Savdo va aloqa' },
  { key: 'marketing', label: 'Marketing', group: 'Savdo va aloqa' },
  { key: 'support', label: 'Support', group: 'Savdo va aloqa' },
  { key: 'notifications', label: 'Bildirishnomalar', group: 'Savdo va aloqa' },
  { key: 'system', label: 'Tizim', group: 'Administratsiya' },
  { key: 'settings', label: 'Sozlamalar', group: 'Administratsiya' },
]
const NAV = [
  { id: 'profile', title: 'Profil', icon: UserRound, description: 'Shaxsiy ma’lumotlar' },
  { id: 'security', title: 'Xavfsizlik', icon: KeyRound, description: 'Parol va kirish' },
  { id: 'team', title: 'Jamoa', icon: Users, description: 'Administratorlar' },
  { id: 'roles', title: 'Rollar', icon: ShieldCheck, description: 'Bo‘limlarga ruxsatlar' },
] as const

const passwordStrength = (value: string) => {
  if (!value) return { score: 0, label: '', color: '' }
  let score = 0
  if (value.length >= 6) score++
  if (value.length >= 10) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  score = Math.min(score, 4)
  return [
    { label: 'Juda kuchsiz', color: 'bg-error' },
    { label: 'Kuchsiz', color: 'bg-error' },
    { label: 'O‘rtacha', color: 'bg-warning' },
    { label: 'Yaxshi', color: 'bg-success' },
    { label: 'Kuchli', color: 'bg-success' },
  ][score]
}

const PREF_ROWS: Array<{ key: keyof ProfilePreferences; title: string; text: string }> = [
  { key: 'emailReports', title: 'Hisobotlar', text: 'Haftalik daromad va faollik hisoboti emailga keladi.' },
  { key: 'securityAlerts', title: 'Xavfsizlik ogohlantirishlari', text: 'Yangi qurilma yoki shubhali kirish haqida xabar.' },
  { key: 'weeklyDigest', title: 'Haftalik xulosa', text: 'Platforma bo‘yicha qisqa umumiy xulosa.' },
]

export default function SettingsPage() {
  const profile = useAppStore((state) => state.profile)
  const admins = useAppStore((state) => state.admins)
  const roles = useAppStore((state) => state.roles)
  const updateProfile = useAppStore((state) => state.updateProfile)
  const upsertAdmin = useAppStore((state) => state.upsertAdmin)
  const deleteAdmin = useAppStore((state) => state.deleteAdmin)
  const updateAdminStatus = useAppStore((state) => state.updateAdminStatus)
  const updateRolePermission = useAppStore((state) => state.updateRolePermission)
  const upsertRole = useAppStore((state) => state.upsertRole)
  const deleteRole = useAppStore((state) => state.deleteRole)
  const { toast } = useToast()
  const [tab, setTab] = useState<'profile' | 'security' | 'team' | 'roles'>('profile')
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [prefs, setPrefs] = useState<ProfilePreferences>(profile.preferences)
  const avatarInput = useRef<HTMLInputElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('role-content')
  const [inviteError, setInviteError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedRole, setSelectedRole] = useState('role-super')
  const [roleDraft, setRoleDraft] = useState<Role | null>(null)
  const [roleDeleteTarget, setRoleDeleteTarget] = useState<Role | null>(null)
  const [adminDeleteTarget, setAdminDeleteTarget] = useState<AdminUser | null>(null)
  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles])
  const myRole = roleById.get(admins.find((admin) => admin.email.toLowerCase() === profile.email.toLowerCase())?.roleId ?? '')
  const activeRole = roleById.get(selectedRole)
  const visibleAdmins = admins.filter((admin) => (status === 'all' || admin.status === status) && `${admin.name} ${admin.email}`.toLowerCase().includes(search.trim().toLowerCase()))
  const myAdmin = admins.find((admin) => admin.email.toLowerCase() === profile.email.toLowerCase())
  const dirty = name !== profile.name || email !== profile.email || avatar !== profile.avatar || JSON.stringify(prefs) !== JSON.stringify(profile.preferences)
  const strength = passwordStrength(newPassword)
  useEffect(() => { setName(profile.name); setEmail(profile.email); setAvatar(profile.avatar); setPrefs(profile.preferences) }, [profile])
  useEffect(() => { scroll.current?.scrollTo(0, 0) }, [tab])

  const saveProfile = () => {
    if (!name.trim()) return toast({ title: 'Ismni kiriting', tone: 'warning' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast({ title: 'Email noto‘g‘ri', tone: 'warning' })
    updateProfile({ name: name.trim(), email: email.trim(), avatar, preferences: prefs })
    toast({ title: 'Profil saqlandi', description: 'Joriy demo sessiyasi uchun.', tone: 'success' })
  }
  const savePassword = async () => {
    setPasswordError('')
    if (!currentPassword) return setPasswordError('Joriy parolni kiriting')
    if (newPassword.length < 6) return setPasswordError('Yangi parol kamida 6 belgi bo‘lishi kerak')
    if (newPassword !== confirmPassword) return setPasswordError('Parollar mos kelmadi')
    setSavingPassword(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) return setPasswordError(result.error ?? 'Parolni o‘zgartirib bo‘lmadi')
      toast({ title: 'Parol o‘zgartirildi', description: 'Keyingi kirishda yangi parol ishlatiladi.', tone: 'success' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch {
      setPasswordError('Serverga ulanib bo‘lmadi. Qayta harakat qiling.')
    } finally {
      setSavingPassword(false)
    }
  }
  const sendInvite = () => {
    setInviteError('')
    const value = inviteEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setInviteError('Email noto‘g‘ri')
    if (admins.some((admin) => admin.email.toLowerCase() === value)) return setInviteError('Bu email allaqachon adminlar ro‘yxatida')
    upsertAdmin({ id: `admin-${crypto.randomUUID()}`, name: value.split('@')[0], email: value, roleId: inviteRole, lastLogin: '', status: 'inactive' })
    toast({ title: 'Admin demo ro‘yxatga qo‘shildi', description: 'Email yuborilmadi. Haqiqiy taklif uchun backend kerak.', tone: 'success' })
    setInviteOpen(false); setInviteEmail(''); setInviteRole('role-content'); setSearch(''); setStatus('all')
  }
  const createRole = () => {
    const permissions = Object.fromEntries(PERMISSIONS.map((permission) => [permission.key, false])) as Record<PermissionKey, boolean>
    setRoleDraft({ id: `role-${crypto.randomUUID()}`, name: '', description: '', permissions })
  }
  const saveRole = () => {
    if (!roleDraft) return
    const name = roleDraft.name.trim()
    if (!name) return toast({ title: 'Rol nomini kiriting', tone: 'warning' })
    if (roles.some((role) => role.id !== roleDraft.id && role.name.toLowerCase() === name.toLowerCase())) {
      return toast({ title: 'Bu nomdagi rol mavjud', tone: 'warning' })
    }
    const isNew = !roles.some((role) => role.id === roleDraft.id)
    upsertRole({ ...roleDraft, name, description: roleDraft.description.trim() || 'Yangi rol' })
    if (isNew) setSelectedRole(roleDraft.id)
    toast({ title: isNew ? 'Rol yaratildi' : 'Rol yangilandi', description: name, tone: 'success' })
    setRoleDraft(null)
  }
  const confirmDeleteRole = () => {
    if (!roleDeleteTarget) return
    const fallback = roles.find((role) => role.id !== roleDeleteTarget.id)
    const removed = deleteRole(roleDeleteTarget.id)
    toast(
      removed
        ? { title: 'Rol o‘chirildi', description: roleDeleteTarget.name, tone: 'success' }
        : { title: 'Rol ishlatilmoqda', description: 'Avval adminlarni boshqa rolga o‘tkazing.', tone: 'warning' },
    )
    if (removed && selectedRole === roleDeleteTarget.id && fallback) setSelectedRole(fallback.id)
    setRoleDeleteTarget(null)
  }
  const confirmDeleteAdmin = () => {
    if (!adminDeleteTarget) return
    deleteAdmin(adminDeleteTarget.id)
    toast({ title: 'Administrator o‘chirildi', description: adminDeleteTarget.name, tone: 'success' })
    setAdminDeleteTarget(null)
  }

  return <PageTransition>
    <div data-settings-workspace className="flex admin-workspace flex-col gap-2.5 overflow-hidden  sm:gap-3  [@media(max-height:720px)]:gap-2 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-brand [&_button]:focus-visible:outline-offset-2">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><h1 className="h2 truncate text-ink">Sozlamalar</h1>{myRole ? <Badge tone="brand">{myRole.name}</Badge> : null}</div><span className="hidden text-[11px] text-ink-3 sm:inline">Hisobingiz. Jamoangiz. Ruxsatlaringiz.</span></header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line-2 bg-white md:flex-row">
        <aside className="shrink-0 border-b border-line-2 bg-[#fafaf9] md:flex md:w-[210px] md:flex-col md:border-b-0 md:border-r xl:w-[240px]">
          <div data-identity className="hidden p-5 md:block"><div className="relative inline-block">{profile.avatar ? <img src={profile.avatar} alt={profile.name} className="h-14 w-14 rounded-2xl object-cover" /> : <Avatar name={profile.name} size="xl" />}<span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#fafaf9] bg-brand text-white"><UserRound className="h-3 w-3" /></span></div><p className="mt-3 break-words text-[15px] font-bold tracking-tight text-ink">{profile.name}</p><p className="mt-1 break-all text-[11px] text-ink-3">{profile.email}</p>{myRole ? <span className="mt-3 inline-block"><Badge tone="brand">{myRole.name}</Badge></span> : null}</div>
          <div className="hidden px-5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 md:block">Hisob boshqaruvi</div>
          <nav aria-label="Sozlamalar bo‘limlari" className="grid grid-cols-4 gap-1 p-1.5 md:grid-cols-1 md:px-3">{NAV.map(({ id, title, icon: Icon, description }) => <button key={id} data-settings-tab={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)} className={cn('flex min-w-0 items-center justify-center gap-2 rounded-lg px-1.5 py-3 text-left text-[11px] font-semibold transition md:justify-start md:px-3 md:py-3.5 md:text-[13px]', tab === id ? 'bg-white text-brand-text shadow-sm ring-1 ring-line-2' : 'text-ink-3 hover:bg-white/70 hover:text-ink')}><Icon className="hidden h-4 w-4 shrink-0 min-[430px]:block" /><span className="min-w-0">{title}<span className="mt-0.5 hidden text-[10px] font-normal text-ink-3 xl:block">{description}</span></span><ChevronRight className={cn('ml-auto hidden h-3.5 w-3.5 md:block', tab !== id && 'opacity-0')} /></button>)}</nav>
          <div className="mt-auto hidden p-5 md:block"><div className="border-t border-line-2 pt-4"><div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-2"><Fingerprint className="h-4 w-4" />Demo ish maydoni</div><p className="mt-2 text-[11px] leading-relaxed text-ink-3">O‘zgarishlar shu sessiyada saqlanadi. Sahifa yangilansa, demo holati tiklanadi.</p></div></div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {tab === 'profile' ? <>
            <div data-settings-panel="profile" ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 xl:p-8 [contain:paint]">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text">Shaxsiy hisob</p><h2 className="mt-2 text-[23px] font-semibold tracking-[-0.04em] text-ink">Siz haqingizda</h2><p className="mt-1 text-[12px] leading-relaxed text-ink-3">Jamoangizga ko‘rinadigan ma’lumotlarni boshqaring.</p></div><UserRound className="mt-1 hidden h-6 w-6 text-line sm:block" /></div>
              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-line-2 bg-canvas/30 p-4 sm:p-5">{avatar ? <img src={avatar} alt={name || 'Avatar'} className="h-16 w-16 rounded-2xl object-cover" /> : <Avatar name={name || 'Admin'} size="xl" />}<div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-ink">Profil rasmi</p><p className="mt-1 text-[11px] text-ink-3">PNG, JPG yoki WebP</p><div className="mt-2.5 flex flex-wrap gap-2"><Button size="sm" variant="ghost" className="border border-line-2 bg-white" onClick={() => avatarInput.current?.click()}><Upload className="h-3.5 w-3.5" />Rasm yuklash</Button>{avatar ? <IconButton label="Avatarni o‘chirish" onClick={() => setAvatar(null)}><X className="h-4 w-4" /></IconButton> : null}</div></div><input ref={avatarInput} aria-label="Avatar fayli" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return toast({ title: 'PNG, JPG yoki WebP tanlang', tone: 'warning' }); const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.readAsDataURL(file); event.target.value = '' }} /></div>
              <div className="mt-6 divide-y divide-line-2"><div className="grid gap-3 py-5 lg:grid-cols-[150px_1fr]"><div><p className="text-[13px] font-semibold text-ink">To‘liq ism</p><p className="mt-1 text-[11px] text-ink-3">Jamoa ro‘yxatidagi nom</p></div><Input aria-label="Ism, familiya" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism, familiya" /></div><div className="grid gap-3 py-5 lg:grid-cols-[150px_1fr]"><div><p className="text-[13px] font-semibold text-ink">Email manzili</p><p className="mt-1 text-[11px] text-ink-3">Hisob bilan bog‘langan manzil</p></div><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-3" /><Input aria-label="Profil email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" /></div></div><div className="grid gap-3 py-5 lg:grid-cols-[150px_1fr]"><div><p className="text-[13px] font-semibold text-ink">Hisob roli</p><p className="mt-1 text-[11px] text-ink-3">Joriy kirish huquqlari</p></div><div className="flex items-center justify-between gap-2"><span className="text-[13px] text-ink-2">{myRole?.name ?? 'Rol belgilanmagan'}</span><Button variant="ghost" size="sm" onClick={() => { if (myRole) setSelectedRole(myRole.id); setTab('roles') }}>Ruxsatlar<ArrowUpRight className="h-3.5 w-3.5" /></Button></div></div></div>
              <div className="mt-2 border-t border-line-2 pt-5">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /><p className="text-[13px] font-semibold text-ink">Email bildirishnomalari</p></div>
                <p className="mt-1 text-[11px] text-ink-3">Qaysi xabarlarni email orqali olishingizni tanlang. O‘zgarishlar saqlash tugmasi bilan qo‘llanadi.</p>
                <div className="mt-3 divide-y divide-line-2 rounded-xl border border-line-2">
                  {PREF_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink">{row.title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-3">{row.text}</p>
                      </div>
                      <Switch
                        checked={prefs[row.key]}
                        onChange={(value) => setPrefs((current) => ({ ...current, [row.key]: value }))}
                        label={row.title}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line-2 px-4 py-3 sm:px-6"><span className="text-[11px] text-ink-3">{dirty ? 'O‘zgartirildi' : 'Saqlangan'}</span><div className="flex items-center gap-1"><Button variant="ghost" size="sm" disabled={!dirty} onClick={() => { setName(profile.name); setEmail(profile.email); setAvatar(profile.avatar); setPrefs(profile.preferences) }}>Bekor qilish</Button><Button data-profile-save size="sm" onClick={saveProfile}><Save className="h-3.5 w-3.5" />Saqlash</Button></div></footer>
          </> : null}
          {tab === 'security' ? <div data-settings-panel="security" ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 xl:p-8 [contain:paint]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text">Kirish nazorati</p><h2 className="mt-2 text-[23px] font-semibold tracking-[-0.04em] text-ink">Hisob xavfsizligi</h2><p className="mt-1 text-[12px] text-ink-3">Kirish parolini boshqarish va yangilash.</p>
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_220px]"><div><div className="mb-5 flex items-center gap-2 border-b border-line-2 pb-4"><KeyRound className="h-4 w-4 text-brand" /><h3 className="text-[14px] font-semibold text-ink">Parolni o‘zgartirish</h3></div><div className="space-y-4"><Field label="Joriy parol" required><PasswordInput label="Joriy parol" value={currentPassword} onChange={setCurrentPassword} current /></Field><Field label="Yangi parol" required hint="Kamida 6 belgi"><PasswordInput label="Yangi parol" value={newPassword} onChange={setNewPassword} /></Field>{newPassword ? <div aria-live="polite"><div className="flex gap-1">{([0, 1, 2, 3] as const).map((index) => <span key={index} className={cn('h-1 flex-1 rounded-full transition-colors', index < (strength.score || 1) ? strength.color : 'bg-line-2')} />)}</div><p className="mt-1 text-[11px] text-ink-3">Parol kuchi: <span className="font-semibold text-ink">{strength.label}</span></p></div> : null}<Field label="Parolni tasdiqlash" required error={passwordError || undefined}><PasswordInput label="Parolni tasdiqlash" value={confirmPassword} onChange={setConfirmPassword} /></Field><Button data-password-save onClick={savePassword} disabled={savingPassword} className="w-full sm:w-auto"><LockKeyhole className="h-4 w-4" />{savingPassword ? 'Saqlanmoqda...' : 'Parolni saqlash'}</Button></div></div><aside className="self-start rounded-xl border border-line-2 bg-canvas/40 p-4"><ShieldCheck className="h-6 w-6 text-brand" /><p className="mt-3 text-[13px] font-semibold text-ink">Yaxshi parol — birinchi himoya</p><ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink-3"><li>Har bir hisob uchun alohida parol ishlating.</li><li>Uzun va taxmin qilish qiyin bo‘lgan ibora tanlang.</li><li>Parolingizni boshqalar bilan ulashmang.</li></ul><div className="mt-4 border-t border-line-2 pt-3 text-[11px] leading-relaxed text-ink-3">Parol serverda yangilanadi va keyingi kirishlarda amal qiladi. Joriy sessiya ochiq qoladi.</div><dl className="mt-3 space-y-1.5 border-t border-line-2 pt-3 text-[11px]"><div className="flex justify-between gap-2"><dt className="text-ink-3">Oxirgi kirish</dt><dd className="font-medium text-ink-2">{myAdmin?.lastLogin ? relative(myAdmin.lastLogin) : '—'}</dd></div><div className="flex justify-between gap-2"><dt className="text-ink-3">Sessiya</dt><dd className="font-medium text-ink-2">Faol · himoyalangan cookie</dd></div><div className="flex justify-between gap-2"><dt className="text-ink-3">Rol</dt><dd className="font-medium text-ink-2">{myRole?.name ?? '—'}</dd></div></dl></aside></div>
          </div> : null}
          {tab === 'team' ? <div data-settings-panel="team" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-4 pb-4 pt-5 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text">Birgalikda boshqarish</p><h2 className="mt-1.5 text-[23px] font-semibold tracking-[-0.04em] text-ink">Sizning jamoangiz</h2></div><Button data-invite-open size="sm" onClick={() => { setInviteError(''); setInviteOpen(true) }}><Plus className="h-4 w-4" />Admin qo‘shish</Button></div><div className="mt-3 flex gap-4 text-[11px] text-ink-3"><span><b className="text-ink">{admins.length}</b> administrator</span><span><b className="text-ink">{admins.filter((admin) => admin.status === 'active').length}</b> faol</span><span><b className="text-ink">{roles.length}</b> rol</span></div><div className="mt-4 flex gap-2"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-3" /><Input aria-label="Adminlarni qidirish" placeholder="Ism yoki email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><div className="w-[112px] shrink-0"><Select aria-label="Admin holati" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Barchasi</option><option value="active">Faol</option><option value="inactive">Nofaol</option></Select></div></div></div>
            <div className="hidden shrink-0 grid-cols-[minmax(0,1fr)_130px_130px] gap-3 border-y border-line-2 bg-canvas/50 px-6 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-3 xl:grid"><span>Administrator</span><span>Rol / oxirgi kirish</span><span className="text-right">Holat</span></div>
            <div ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:paint]">{visibleAdmins.length ? <ul className="divide-y divide-line-2">{visibleAdmins.map((admin) => <li key={admin.id} data-admin-row data-status={admin.status} className="grid gap-3 px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_130px_130px] xl:items-center"><div className="flex min-w-0 items-center gap-3"><Avatar name={admin.name} size="md" /><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-ink">{admin.name}</p><p className="mt-1 break-all text-[11px] text-ink-3">{admin.email}</p></div></div><div className="flex items-center justify-between gap-2 xl:block"><span className="text-[12px] font-medium text-ink-2">{roleById.get(admin.roleId)?.name ?? '—'}</span><p className="text-[10px] text-ink-3 xl:mt-1.5">{admin.lastLogin ? relative(admin.lastLogin) : 'Hali kirmagan'}</p></div><div className="flex items-center justify-between gap-2 xl:justify-end"><Badge tone={admin.status === 'active' ? 'success' : 'gray'} dot>{admin.status === 'active' ? 'Faol' : 'Nofaol'}</Badge><Button data-admin-toggle size="sm" variant="ghost" className="text-[11px]" onClick={() => { updateAdminStatus(admin.id, admin.status === 'active' ? 'inactive' : 'active'); toast({ title: admin.status === 'active' ? 'Admin bloklandi' : 'Admin faollashtirildi', tone: 'success' }) }}>{admin.status === 'active' ? 'Bloklash' : 'Faollashtirish'}</Button><Button data-admin-delete size="sm" variant="ghost" aria-label={`${admin.name} ni o‘chirish`} disabled={admin.email.toLowerCase() === profile.email.toLowerCase()} onClick={() => setAdminDeleteTarget(admin)}><Trash2 className="h-3.5 w-3.5 text-error" /></Button></div></li>)}</ul> : <div className="p-6"><EmptyState icon={<Users className="h-6 w-6" />} title="Admin topilmadi" text="Ism, email yoki holat filtrini o‘zgartiring." /></div>}</div>
            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line-2 px-4 py-3 text-[11px] text-ink-3 sm:px-6"><span>{visibleAdmins.length} / {admins.length} administrator</span><button type="button" onClick={() => setTab('roles')} className="flex items-center gap-1 font-semibold text-brand-text">Rollarni boshqarish<ArrowUpRight className="h-3 w-3" /></button></footer>
          </div> : null}
          {tab === 'roles' ? <div data-settings-panel="roles" ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 xl:p-8 [contain:paint]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text">Kirish huquqlari</p><h2 className="mt-2 text-[23px] font-semibold tracking-[-0.04em] text-ink">Kim nimani boshqaradi?</h2><p className="mt-1 text-[12px] text-ink-3">Rolni tanlang va unga ochiq bo‘limlarni belgilang.</p>
            <div className="mt-5 flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">Rollar</p><Button size="sm" variant="secondary" onClick={createRole}><Plus className="h-3.5 w-3.5" />Yangi rol</Button></div>
            <div aria-label="Rol tanlash" className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">{roles.map((role) => <button key={role.id} data-role-select={role.id} type="button" aria-pressed={selectedRole === role.id} onClick={() => setSelectedRole(role.id)} className={cn('rounded-xl border p-3 text-left transition', selectedRole === role.id ? 'border-brand bg-brand-soft/40' : 'border-line-2 hover:bg-canvas')}><div className="flex items-center justify-between gap-1"><ShieldCheck className={cn('h-4 w-4', selectedRole === role.id ? 'text-brand' : 'text-ink-3')} />{selectedRole === role.id ? <Check className="h-3.5 w-3.5 text-brand" /> : null}</div><p className="mt-2 text-[12px] font-semibold text-ink">{role.name}</p><p className="mt-1 text-[10px] text-ink-3">{admins.filter((admin) => admin.roleId === role.id).length} admin · {Object.values(role.permissions).filter(Boolean).length} ruxsat</p></button>)}</div>
            {activeRole ? <><div className="mb-4 mt-6 flex flex-wrap items-start justify-between gap-2 border-b border-line-2 pb-4"><div><h3 className="text-[15px] font-bold text-ink">{activeRole.name}</h3><p className="mt-1 text-[12px] text-ink-3">{activeRole.description}</p></div><div className="flex items-center gap-1.5"><Badge tone="brand">{Object.values(activeRole.permissions).filter(Boolean).length} / {PERMISSIONS.length}</Badge><Button size="sm" variant="secondary" onClick={() => setRoleDraft(activeRole)}><Pencil className="h-3 w-3" />Tahrirlash</Button><Button size="sm" variant="ghost" aria-label={`${activeRole.name} rolini o‘chirish`} onClick={() => setRoleDeleteTarget(activeRole)} disabled={admins.some((admin) => admin.roleId === activeRole.id)}><Trash2 className="h-3.5 w-3.5 text-error" /></Button></div></div><div className="grid gap-5 xl:grid-cols-2">{['Boshqaruv', 'Ta’lim', 'Savdo va aloqa', 'Administratsiya'].map((group) => <section key={group}><h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">{group}</h4><div className="divide-y divide-line-2 rounded-xl border border-line-2">{PERMISSIONS.filter((permission) => permission.group === group).map((permission) => <div key={permission.key} data-permission={permission.key} className="px-3 py-2.5"><Checkbox checked={activeRole.permissions[permission.key]} onChange={(value) => updateRolePermission(activeRole.id, permission.key, value)} label={permission.label} className="w-full text-[13px]" /></div>)}</div></section>)}</div><div className="mt-5 flex items-start gap-2 rounded-lg bg-canvas p-3 text-[11px] leading-relaxed text-ink-3"><SlidersHorizontal className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>O‘zgarishlar demo sessiyasida darhol saqlanadi. Haqiqiy kirish nazorati serverda tekshirilishi kerak.</span></div></> : null}
          </div> : null}
        </div>
      </div>
    </div>
    <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Jamoaga admin qo‘shish" description="Yangi administrator uchun email va rolni belgilang" size="sm" footer={<><Button variant="ghost" onClick={() => setInviteOpen(false)}>Bekor qilish</Button><Button data-invite-submit onClick={sendInvite}><Plus className="h-4 w-4" />Qo‘shish</Button></>}><div className="space-y-4"><Field label="Email" required error={inviteError || undefined}><Input aria-label="Taklif email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ism@hdp.uz" /></Field><Field label="Rol"><Select aria-label="Taklif roli" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field><p className="rounded-lg border border-line-2 bg-canvas p-3 text-[12px] leading-relaxed text-ink-3">Demo rejim: administrator mahalliy ro‘yxatga qo‘shiladi, email taklifi yuborilmaydi.</p></div></Modal>

    <Modal
      open={roleDraft !== null}
      onClose={() => setRoleDraft(null)}
      title={roles.some((role) => role.id === roleDraft?.id) ? 'Rolni tahrirlash' : 'Yangi rol'}
      description="Rol nomi va tavsifini belgilang"
      size="sm"
      footer={<><Button variant="ghost" onClick={() => setRoleDraft(null)}>Bekor qilish</Button><Button data-role-save onClick={saveRole}><Save className="h-4 w-4" />Saqlash</Button></>}
    >
      <div className="space-y-4">
        <Field label="Rol nomi" required>
          <Input aria-label="Rol nomi" value={roleDraft?.name ?? ''} onChange={(event) => setRoleDraft((draft) => (draft ? { ...draft, name: event.target.value } : draft))} placeholder="Masalan: Kontent menejeri" />
        </Field>
        <Field label="Tavsif">
          <Input aria-label="Rol tavsifi" value={roleDraft?.description ?? ''} onChange={(event) => setRoleDraft((draft) => (draft ? { ...draft, description: event.target.value } : draft))} placeholder="Qisqa tavsif" />
        </Field>
        <p className="rounded-lg border border-line-2 bg-canvas p-3 text-[12px] leading-relaxed text-ink-3">Saqlangandan so‘ng ruxsatlar checkboxlari orqali belgilanadi.</p>
      </div>
    </Modal>

    <Modal
      open={roleDeleteTarget !== null}
      onClose={() => setRoleDeleteTarget(null)}
      title="Rolni o‘chirish"
      description={roleDeleteTarget?.name}
      size="sm"
      footer={<><Button variant="ghost" onClick={() => setRoleDeleteTarget(null)}>Bekor qilish</Button><Button variant="destructive" onClick={confirmDeleteRole}><Trash2 className="h-4 w-4" />O‘chirish</Button></>}
    >
      <p className="text-[13px] text-ink-2"><b>{roleDeleteTarget?.name}</b> roli o‘chiriladi. Bu rol biriktirilgan adminlar bo‘lsa, avval ularni boshqa rolga o‘tkazing.</p>
    </Modal>

    <Modal
      open={adminDeleteTarget !== null}
      onClose={() => setAdminDeleteTarget(null)}
      title="Administratorni o‘chirish"
      description={adminDeleteTarget?.email}
      size="sm"
      footer={<><Button variant="ghost" onClick={() => setAdminDeleteTarget(null)}>Bekor qilish</Button><Button variant="destructive" onClick={confirmDeleteAdmin}><Trash2 className="h-4 w-4" />O‘chirish</Button></>}
    >
      <p className="text-[13px] text-ink-2"><b>{adminDeleteTarget?.name}</b> jamoa ro‘yxatidan o‘chiriladi va tizimga kira olmaydi.</p>
    </Modal>
  </PageTransition>
}

function PasswordInput({ label, value, onChange, current = false }: { label: string; value: string; onChange: (value: string) => void; current?: boolean }) {
  const [visible, setVisible] = useState(false)
  return <div className="relative"><Input aria-label={label} type={visible ? 'text' : 'password'} autoComplete={current ? 'current-password' : 'new-password'} value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" /><button type="button" aria-label={`${label} ${visible ? 'yashirish' : 'ko‘rsatish'}`} onClick={() => setVisible(!visible)} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-ink-3 hover:bg-muted">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
}
