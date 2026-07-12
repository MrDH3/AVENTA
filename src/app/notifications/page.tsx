import { redirect } from 'next/navigation'
import { getCurrentUser, isStaff, canManageSettings } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { NotificationChannel, NotificationStatus } from '@prisma/client'
import Notifications from '@/views/Notifications'

export const dynamic = 'force-dynamic'

/** Plain, JSON-serializable notification-log row for the "recent sent" list. */
export interface RecentNotification {
  id: string
  event: string
  channel: NotificationChannel
  status: NotificationStatus
  subject: string | null
  toAddress: string | null
  bookingId: string | null
  createdAt: string // ISO
  sentAt: string | null // ISO
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user || !isStaff(user.role)) redirect('/auth')

  const rows = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const recent: RecentNotification[] = rows.map((n) => ({
    id: n.id,
    event: n.event,
    channel: n.channel,
    status: n.status,
    subject: n.subject,
    toAddress: n.toAddress,
    bookingId: n.bookingId,
    createdAt: n.createdAt.toISOString(),
    sentAt: n.sentAt ? n.sentAt.toISOString() : null,
  }))

  return <Notifications recent={recent} canSettings={canManageSettings(user)} />
}
