'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Trophy } from 'lucide-react'
import OlympiadEditor from '@/components/olympiads/OlympiadEditor'
import { Button, Card, EmptyState } from '@/components/ui'
import { useAppStore } from '@/lib/store'

export default function EditOlympiadPage() {
  const params = useParams<{ id: string }>()
  const olympiad = useAppStore((state) => state.olympiads.find((item) => item.id === params.id))

  if (!olympiad) {
    return (
      <Card>
        <EmptyState
          title="Olimpiada topilmadi"
          text="Bu olimpiada o'chirilgan yoki mavjud emas."
          icon={<Trophy className="h-5 w-5" />}
          action={
            <Link href="/admin/olympiads">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Olimpiadalar ro'yxati
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  return <OlympiadEditor olympiad={olympiad} />
}
