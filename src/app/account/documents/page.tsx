import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getVerificationForUser } from '@/lib/verification-server'
import AccountShell from '@/components/AccountShell'
import { toShellUser } from '@/lib/shell-user'
import MyDocuments from '@/views/MyDocuments'

export const dynamic = 'force-dynamic'

/** Standalone "My documents" page — manage identity documents without starting a booking. */
export default async function DocumentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  const [verification, profile] = await Promise.all([
    getVerificationForUser(user.id),
    prisma.clientProfile.findUnique({ where: { userId: user.id }, select: { docCountry: true, docRegion: true } }),
  ])

  return (
    <AccountShell active="documents" user={toShellUser(user)}>
      <MyDocuments
        verification={verification}
        method={verification.method}
        initialCountry={profile?.docCountry ?? ''}
        initialRegion={profile?.docRegion ?? ''}
      />
    </AccountShell>
  )
}
