'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface SessionUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  image: string | null
  role: string
}

const Ctx = createContext<SessionUser | null>(null)

export function AuthProvider({ user, children }: { user: SessionUser | null; children: ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>
}

export function useAuth(): SessionUser | null {
  return useContext(Ctx)
}
