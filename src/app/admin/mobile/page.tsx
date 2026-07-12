import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import MobileAdmin from '@/views/MobileAdmin'

export const dynamic = 'force-dynamic'

export default async function MobileAdminPage() {
  const u = await getCurrentUser()
  if (!u || (u.role !== 'ADMIN' && u.role !== 'OWNER')) redirect('/auth')
  return <MobileAdmin />
}
