'use client'

import { useEffect, useMemo, useState } from 'react'
import { Coins, Gem, Search } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Modal,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { money, number } from '@/lib/format'
import type { PackageId, User } from '@/lib/types'

const PACKAGES: Array<{ id: PackageId; label: string; days: number; price: number; hint: string }> = [
  { id: '1m', label: '1 oylik', days: 30, price: 49_000, hint: 'Boshlash uchun' },
  { id: '3m', label: '3 oylik', days: 90, price: 129_000, hint: 'Eng ommabop' },
  { id: '1y', label: '1 yillik', days: 365, price: 399_000, hint: 'Eng tejamkor' },
]

function UserPicker({
  value,
  onChange,
  multiple = false,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  multiple?: boolean
}) {
  const users = useAppStore((state) => state.users)
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = term.length < 2
      ? []
      : users.filter(
          (user) =>
            user.name.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term) ||
            user.id.toLowerCase().includes(term),
        )
    return list.slice(0, 6)
  }, [query, users])

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ism, username yoki #ID bo'yicha qidiring"
          className="field pl-9"
        />
      </div>
      {value.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((id) => {
            const user = users.find((entry) => entry.id === id)
            if (!user) return null
            return (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-0.5 pl-1 pr-2 text-[11.5px] font-medium text-brand-text">
                <Avatar name={user.name} size="sm" className="h-5 w-5 text-[8px]" />
                {user.name}
                <button
                  type="button"
                  aria-label="Olib tashlash"
                  onClick={() => onChange(value.filter((entry) => entry !== id))}
                  className="ml-0.5 text-brand-hover hover:text-brand-active"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      ) : null}
      {matches.length > 0 ? (
        <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-line">
          {matches.map((user) => {
            const checked = value.includes(user.id)
            return (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (multiple) onChange(checked ? value.filter((id) => id !== user.id) : [...value, user.id])
                    else onChange([user.id])
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 border-b border-line-2 px-2.5 py-2 text-left last:border-0 hover:bg-canvas',
                    checked && 'bg-brand-soft/60',
                  )}
                >
                  {multiple ? (
                    <Checkbox checked={checked} onChange={() => undefined} />
                  ) : (
                    <span
                      className={cn(
                        'grid h-3.5 w-3.5 place-items-center rounded-full border',
                        checked ? 'border-brand' : 'border-[#d1d5db]',
                      )}
                    >
                      {checked ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                    </span>
                  )}
                  <Avatar name={user.name} size="sm" tone={user.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-ink">{user.name}</span>
                    <span className="block truncate text-[10.5px] text-ink-3">
                      @{user.username} · {user.id}
                    </span>
                  </span>
                  {user.plan === 'pro' ? <Badge tone="brand">PRO</Badge> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : query.trim().length >= 2 ? (
        <p className="mt-2 text-[12px] text-ink-3">Foydalanuvchi topilmadi.</p>
      ) : null}
    </div>
  )
}

export function GiveProModal({
  open,
  onClose,
  targets,
}: {
  open: boolean
  onClose: () => void
  targets?: User[] | null
}) {
  const users = useAppStore((state) => state.users)
  const grantPro = useAppStore((state) => state.grantPro)
  const { toast } = useToast()
  const [picked, setPicked] = useState<string[]>([])
  const [packageId, setPackageId] = useState<PackageId>('1m')

  useEffect(() => {
    if (open && targets?.length) setPicked(targets.map((user) => user.id))
    if (!open) setPicked([])
  }, [open, targets])

  const selected = users.filter((user) => picked.includes(user.id))
  const pack = PACKAGES.find((item) => item.id === packageId)!

  const submit = () => {
    if (selected.length === 0) {
      toast({ title: 'Foydalanuvchini tanlang', tone: 'warning' })
      return
    }
    grantPro(selected.map((user) => user.id), packageId)
    toast({
      title: `${selected.length} ta foydalanuvchiga Pro berildi`,
      description: `${pack.label} paket · ${pack.days} kun amal qiladi`,
      tone: 'success',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Qo'lda Pro berish"
      description="Tanlangan foydalanuvchilarga bepul Pro obuna biriktiriladi."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit}>
            <Gem className="h-4 w-4" /> Pro berish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {targets?.length ? (
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-brand-soft px-3 py-2.5">
            {targets.slice(0, 4).map((user) => (
              <span key={user.id} className="inline-flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-1 pr-2 text-[11.5px] font-medium text-brand-text">
                <Avatar name={user.name} size="sm" className="h-5 w-5 text-[8px]" /> {user.name}
              </span>
            ))}
            {targets.length > 4 ? (
              <span className="inline-flex items-center rounded-full bg-white px-2 text-[11.5px] font-semibold text-brand-text">
                +{targets.length - 4} ta
              </span>
            ) : null}
          </div>
        ) : (
          <Field label="Foydalanuvchi" required>
            <UserPicker value={picked} onChange={setPicked} multiple />
          </Field>
        )}

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">Paket</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {PACKAGES.map((item) => {
              const active = item.id === packageId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPackageId(item.id)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    active
                      ? 'border-brand bg-brand-soft shadow-glow'
                      : 'border-line bg-white hover:border-line-brand hover:bg-brand-soft/40',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink">{item.label}</span>
                    <span
                      className={cn(
                        'grid h-3.5 w-3.5 place-items-center rounded-full border',
                        active ? 'border-brand' : 'border-[#d1d5db]',
                      )}
                    >
                      {active ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-3">{item.hint}</p>
                  <p className="mt-1.5 text-[12px] font-semibold text-brand-text">{money(item.price)}</p>
                </button>
              )
            })}
          </div>
        </div>

        {selected.length > 0 ? (
          <div className="rounded-lg bg-canvas px-3 py-2.5 text-[12px] text-ink-2">
            <div className="flex justify-between">
              <span>Tanlangan</span>
              <span className="font-semibold">{number(selected.length)} ta</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Muddat</span>
              <span className="font-semibold">{pack.days} kun</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Umumiy qiymat</span>
              <span className="font-semibold">{money(pack.price * selected.length)}</span>
            </div>
            <p className="mt-1 text-[11px] text-ink-3">Qo'lda berilganligi uchun to'lov olinmaydi.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export function CoinsModal({
  open,
  onClose,
  targets,
}: {
  open: boolean
  onClose: () => void
  targets?: User[] | null
}) {
  const users = useAppStore((state) => state.users)
  const addCoins = useAppStore((state) => state.addCoins)
  const { toast } = useToast()
  const [picked, setPicked] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open && targets?.length) setPicked(targets.map((user) => user.id))
    if (!open) {
      setPicked([])
      setAmount('')
      setNote('')
    }
  }, [open, targets])

  const selected = users.filter((user) => picked.includes(user.id))
  const numeric = Number(amount.replace(/\s/g, '').replace(',', '.'))

  const submit = () => {
    if (selected.length === 0) {
      toast({ title: 'Foydalanuvchini tanlang', tone: 'warning' })
      return
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      toast({ title: "To'g'ri miqdor kiriting", tone: 'warning' })
      return
    }
    addCoins(selected.map((user) => user.id), Math.round(numeric))
    toast({
      title: `${number(numeric)} coin qo'shildi`,
      description: `${selected.length} ta foydalanuvchi · ${note || 'admin tomonidan'}`,
      tone: 'success',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Coin qo'shish"
      description="Foydalanuvchi balansiga qo'lda coin qo'shing."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit}>
            <Coins className="h-4 w-4" /> Qo'shish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {targets?.length ? (
          <div className="space-y-1 rounded-lg bg-brand-soft px-3 py-2.5">
            {targets.slice(0, 4).map((user) => (
              <div key={user.id} className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-brand-text">{user.name}</span>
                <span className="tabular text-ink-3">{number(user.coins)} coin</span>
              </div>
            ))}
            {targets.length > 4 ? (
              <p className="text-[11px] text-brand-text">+{targets.length - 4} ta foydalanuvchi</p>
            ) : null}
          </div>
        ) : (
          <Field label="Foydalanuvchi" required>
            <UserPicker value={picked} onChange={setPicked} multiple />
          </Field>
        )}

        <Field label="Coin miqdori" required hint={numeric > 0 ? `Har bir foydalanuvchiga ${number(numeric)} coin` : undefined}>
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            placeholder="Masalan: 500"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[100, 500, 1_000, 5_000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                  Number(amount) === preset
                    ? 'border-brand bg-brand-soft text-brand-text'
                    : 'border-line text-ink-3 hover:border-line-brand hover:text-brand-text',
                )}
              >
                +{number(preset)}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Izoh" hint="Log yozuvida ko'rinadi">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Masalan: olimpiada g'olibi uchun mukofot"
            rows={2}
          />
        </Field>

        {selected.length > 0 && numeric > 0 ? (
          <div className="rounded-lg bg-coin-bg px-3 py-2.5 text-[12px] text-[#92400e]">
            Jami tarqatiladi: <span className="font-bold">{number(numeric * selected.length)} coin</span> ·{' '}
            {selected.length} ta foydalanuvchi
            {selected.length === 1 ? (
              <span className="mt-1 block">Yangi balans: {number((selected[0].coins ?? 0) + numeric)} coin</span>
            ) : null}
          </div>
        ) : null}
        <p className="text-[11px] text-ink-3">
          Qo'shilgan coinlar keyinchalik qaytarilmaydi. Barcha amallar audit logda saqlanadi.
        </p>
      </div>
    </Modal>
  )
}
