import 'server-only'
import { prisma } from './db'
import { REQUIRED_DOC_TYPES, buildReviewDocs, deriveVerification, type ReviewDoc } from './verification'

export interface QueueRow {
  userId: string
  name: string
  email: string
  verified: boolean // derived: all required current docs APPROVED + not expired
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  submittedAt: string | null // oldest current-pending doc — drives oldest-first ordering
  reviewedAt: string | null // most recent decision on a current doc
  bookings: { number: string; status: string }[]
  docs: ReviewDoc[] // one entry per required type (per-document status + thumbnail)
}

/**
 * The manual-verification work queue, now PER-DOCUMENT. A customer appears while ANY required
 * document's current (non-superseded) attempt is still pending review. Each row carries the full
 * per-type breakdown so the admin sees exactly which documents are pending/approved/rejected —
 * a customer with the ID approved but the licence pending shows as partially reviewed.
 *
 * `pending` = someone with ≥1 current doc awaiting review, OLDEST-first (longest wait). `reviewed`
 * = everyone whose current docs are all decided, most-recently-decided first.
 */
export async function getVerificationQueue(filter: 'pending' | 'reviewed'): Promise<QueueRow[]> {
  // Every CURRENT (non-superseded) required document, with its owner + recent bookings.
  const docs = await prisma.document.findMany({
    where: { type: { in: [...REQUIRED_DOC_TYPES] }, supersededAt: null },
    select: {
      id: true, userId: true, type: true, status: true, mime: true, rejectionReason: true, expiresAt: true, uploadedAt: true, reviewedAt: true,
      user: {
        select: {
          firstName: true, lastName: true, email: true,
          bookings: { select: { number: true, status: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        },
      },
    },
    orderBy: { uploadedAt: 'asc' },
  })

  // Group by customer.
  const byUser = new Map<string, typeof docs>()
  for (const d of docs) {
    const arr = byUser.get(d.userId)
    if (arr) arr.push(d)
    else byUser.set(d.userId, [d])
  }

  const rows: QueueRow[] = []
  for (const [userId, uDocs] of byUser) {
    const first = uDocs[0]
    const reviewDocs = buildReviewDocs(uDocs, 'ru')
    const derived = deriveVerification(uDocs)
    const pendingCount = reviewDocs.filter((d) => d.decision === 'PENDING').length
    const approvedCount = reviewDocs.filter((d) => d.decision === 'APPROVED').length
    const rejectedCount = reviewDocs.filter((d) => d.decision === 'REJECTED').length

    // Oldest still-pending upload → how long this customer has waited.
    const pendingUploads = uDocs.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'UPLOADED').map((d) => d.uploadedAt.getTime())
    const submittedAt = pendingUploads.length ? new Date(Math.min(...pendingUploads)).toISOString() : null
    // Most recent decision across this customer's current docs.
    const reviews = uDocs.map((d) => d.reviewedAt?.getTime()).filter((n): n is number => typeof n === 'number')
    const reviewedAt = reviews.length ? new Date(Math.max(...reviews)).toISOString() : null

    rows.push({
      userId,
      name: [first.user.firstName, first.user.lastName].filter(Boolean).join(' ') || first.user.email,
      email: first.user.email,
      verified: derived.verified,
      pendingCount,
      approvedCount,
      rejectedCount,
      submittedAt,
      reviewedAt,
      bookings: first.user.bookings.map((b) => ({ number: b.number, status: b.status })),
      docs: reviewDocs,
    })
  }

  const filtered = filter === 'pending' ? rows.filter((r) => r.pendingCount > 0) : rows.filter((r) => r.pendingCount === 0)
  if (filter === 'pending') {
    filtered.sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '')) // oldest first
  } else {
    filtered.sort((a, b) => (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? '')) // newest decision first
  }
  return filtered
}

/** Count of customers with ≥1 required document still awaiting review (nav badge / summary). */
export async function getPendingVerificationCount(): Promise<number> {
  const rows = await prisma.document.findMany({
    where: { type: { in: [...REQUIRED_DOC_TYPES] }, supersededAt: null, status: { in: ['UNDER_REVIEW', 'UPLOADED'] } },
    select: { userId: true },
    distinct: ['userId'],
  })
  return rows.length
}
