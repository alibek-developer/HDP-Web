'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Ban, Coins, Gem, Users } from 'lucide-react'
import { PageHeader, PageTransition } from '@/components/layout/Page'
import { Button, Card, EmptyState, useToast } from '@/components/ui'
import { UserProfile } from '@/components/users/UserProfile'
import { CoinsModal, GiveProModal } from '@/components/users/UserModals'
import { useAppStore } from '@/lib/store'
import type { User } from '@/lib/types'

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const users = useAppStore((state) => state.users)
  const transactions = useAppStore((state) => state.transactions)
  const olympiads = useAppStore((state) => state.olympiads)
  const setUserStatus = useAppStore((state) => state.setUserStatus)
  const { toast } = useToast()

  const [proOpen, setProOpen] = useState(false)
  const [coinsOpen, setCoinsOpen] = useState(false)

  const user = users.find((entry) => entry.id === params.id)
  const decodedId = decodeURIComponent(params.id ?? '')

  if (!user) {
    return (
      <PageTransition>
        <PageHeader title="Foydalanuvchi topilmadi" subtitle={`#${decodedId}`} />
        <Card>
          <EmptyState
            title="Bunday foydalanuvchi yo'q"
            text={`#${decodedId} ID bilan foydalanuvchi topilmadi. U o'chirilgan bo'lishi mumkin.`}
            icon={<Users className="h-5 w-5" />}
            action={
              <Link href="/admin/users">
                <Button variant="secondary">Foydalanuvchilar ro'yxatiga qaytish</Button>
              </Link>
            }
          />
        </Card>
      </PageTransition>
    )
  }

  const toggleBlock = (target: User) => {
    if (target.status === 'blocked') {
      setUserStatus([target.id], 'active')
      toast({ title: `${target.name} blokdan chiqarildi`, tone: 'success' })
    } else {
      setUserStatus([target.id], 'blocked')
      toast({ title: `${target.name} bloklandi`, tone: 'warning' })
    }
  }

  return (
    <PageTransition>
      <div className="flex admin-workspace flex-col overflow-hidden  ">
      <div className="shrink-0">
      <PageHeader
        title={user.name}
        subtitle={`#${user.id} · @${user.username}`}
        actions={
          <>
            <Link href="/admin/users">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" /> Orqaga
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setCoinsOpen(true)}>
              <Coins className="h-4 w-4" /> Coin qo'shish
            </Button>
            <Button onClick={() => setProOpen(true)}>
              <Gem className="h-4 w-4" /> {user.plan === 'pro' ? 'Pro obunani yangilash' : 'Pro berish'}
            </Button>
            <Button variant="destructive" onClick={() => toggleBlock(user)}>
              <Ban className="h-4 w-4" /> {user.status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash'}
            </Button>
          </>
        }
      />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 pr-1">
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <UserProfile
            user={user}
            transactions={transactions}
            olympiads={olympiads}
            onGivePro={() => setProOpen(true)}
            onGiveCoins={() => setCoinsOpen(true)}
            onToggleBlock={toggleBlock}
          />
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="h4 text-ink">Administrator eslatmasi</p>
            <ul className="mt-2 space-y-2 text-[12px] text-ink-3">
              <li className="flex justify-between gap-2">
                <span>Foydalanuvchi ID</span>
                <span className="font-mono text-[11px] text-ink-2">{user.id}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Holat</span>
                <span className="font-semibold text-ink-2">
                  {user.status === 'active' ? 'Faol' : user.status === 'blocked' ? 'Bloklangan' : 'Nofaol'}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Sinflar</span>
                <span className="font-semibold text-ink-2">{user.grade}-sinf</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Tuman</span>
                <span className="font-semibold text-ink-2">{user.region}</span>
              </li>
            </ul>
          </Card>
          <Card className="bg-gradient-to-br from-brand-soft to-white">
            <p className="text-[12.5px] font-semibold text-ink">Tezkor amallar bo'yicha maslahat</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
              Pro obunani qo'lda berganda to'lov olinmaydi. Coin qo'shish va bloklash amallari audit logda qayd etiladi.
            </p>
            <Link href="/admin/system#logs" className="mt-2 inline-block text-[11.5px] font-semibold text-brand-text hover:underline">
              Loglarni ko'rish →
            </Link>
          </Card>
        </div>
      </div>
      </div>

      <GiveProModal open={proOpen} onClose={() => setProOpen(false)} targets={[user]} />
      <CoinsModal open={coinsOpen} onClose={() => setCoinsOpen(false)} targets={[user]} />
      </div>
    </PageTransition>
  )
}
