import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import About, { type AboutReview } from '@/views/About'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'О нас · AVENTA',
  description: 'Премиум-аренда автомобилей в Анталии: кто мы, гарантии, отзывы гостей и реквизиты компании.',
}

export default async function AboutPage() {
  const rows = await prisma.review.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' } })
  const reviews: AboutReview[] = rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    locale: r.locale,
    createdAt: r.createdAt.toISOString(),
  }))
  return <About reviews={reviews} />
}
