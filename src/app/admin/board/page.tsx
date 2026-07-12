import { redirect } from 'next/navigation'
import { getCurrentUser, canManageSettings } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AdminShell from '@/components/AdminShell'
import KanbanBoard, { type BoardCard } from '@/views/KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  const bookings = await prisma.booking.findMany({
    orderBy: [{ startAt: 'asc' }],
    include: {
      car: { select: { brand: true, model: true } },
      user: { select: { firstName: true, lastName: true, email: true, profile: { select: { verificationStatus: true } } } },
      payments: { select: { kind: true, status: true } },
    },
  })

  const todayKey = new Date().toISOString().slice(0, 10)

  const cards: BoardCard[] = bookings.map((b) => {
    const name = [b.user.firstName, b.user.lastName].filter(Boolean).join(' ') || b.user.email
    const subtotal = Number(b.subtotal)
    const balance = Number(b.balanceAmount)
    const prepaid = Number(b.prepaidAmount)
    const pay: BoardCard['pay'] = subtotal > 0 && balance <= 0 ? 'paid' : prepaid > 0 ? 'partial' : 'none'
    const depositHeld = b.payments.some((p) => p.kind === 'DEPOSIT' && p.status === 'DEPOSIT_HELD')
    const endKey = b.endAt.toISOString().slice(0, 10)
    // Return urgency is only meaningful once the car is out (DELIVERED/ACTIVE) — the owner's most
    // time-sensitive concern.
    let returnFlag: BoardCard['returnFlag'] = null
    if (b.status === 'ACTIVE' || b.status === 'DELIVERED') {
      if (endKey < todayKey) returnFlag = 'overdue'
      else if (endKey === todayKey) returnFlag = 'today'
    }
    return {
      id: b.id,
      number: b.number,
      status: b.status,
      customer: name,
      car: `${b.car.brand} ${b.car.model}`,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      pay,
      depositHeld,
      verification: b.user.profile?.verificationStatus ?? 'NONE',
      returnFlag,
    }
  })

  return (
    <AdminShell
      active="board"
      title="Доска заказов"
      subtitle="Канбан по этапам аренды — перетащите карточку, чтобы сменить статус"
      canSettings={canManageSettings(user)}
    >
      <KanbanBoard cards={cards} />
    </AdminShell>
  )
}
