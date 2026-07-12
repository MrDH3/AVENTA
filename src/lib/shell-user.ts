import type { User } from '@prisma/client'

/** Profile-chip summary for the shared left-sidebar {@link AccountShell}. */
export interface ShellUser {
  fullName: string
  initial: string
  tierName: string
}

/** Derive the shell profile chip from a logged-in user (no extra DB call). */
export function toShellUser(
  user: Pick<User, 'firstName' | 'lastName' | 'email' | 'loyaltyTier'>,
): ShellUser {
  return {
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'AVENTA',
    initial: ((user.firstName || user.email || 'A').trim()[0] || 'A').toUpperCase(),
    tierName: (user.loyaltyTier as string) || 'SILVER',
  }
}
