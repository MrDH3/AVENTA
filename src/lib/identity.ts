import 'server-only'
import type { User } from '@prisma/client'
import { prisma } from './db'

export interface ExternalIdentity {
  provider: string // google | yandex | telegram | max | phone
  providerAccountId: string
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  image?: string
  telegram?: string
}

/**
 * Resolve an external identity to a user: reuse the linked account, else match a
 * verified email/phone and link, else create a fresh CLIENT. Returns the user.
 */
export async function linkOrCreateUser(id: ExternalIdentity): Promise<User> {
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: id.provider, providerAccountId: id.providerAccountId } },
    include: { user: true },
  })
  if (linked) return linked.user

  // Treat blank/whitespace email (e.g. Yandex returns default_email:"") as absent,
  // so we never create a user with an empty-string email.
  const email = id.email?.trim().toLowerCase() || undefined
  let user: User | null = null
  if (email) user = await prisma.user.findUnique({ where: { email } })
  if (!user && id.phone) user = await prisma.user.findFirst({ where: { phone: id.phone } })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email ?? `${id.provider}_${id.providerAccountId}@aventa.local`,
        firstName: id.firstName ?? null,
        lastName: id.lastName ?? null,
        phone: id.phone ?? null,
        telegram: id.telegram ?? null,
        image: id.image ?? null,
        emailVerified: Boolean(email),
        phoneVerified: Boolean(id.phone),
        role: 'CLIENT',
      },
    })
  } else {
    // Existing account matched. The provider has already verified this email, so clear any pending
    // "confirm your email" state for a matching account (no confirmation email is ever sent on OAuth).
    const data: { image?: string; emailVerified?: boolean } = {}
    if (id.image && !user.image) data.image = id.image
    if (email && user.email === email && !user.emailVerified) data.emailVerified = true
    if (Object.keys(data).length) user = await prisma.user.update({ where: { id: user.id }, data })
  }

  await prisma.oAuthAccount
    .create({ data: { userId: user.id, provider: id.provider, providerAccountId: id.providerAccountId, email } })
    .catch(() => {}) // ignore race / already linked

  return user
}
