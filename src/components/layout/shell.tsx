'use client'

import { Nav } from './nav'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <main className="px-4 pt-3 pb-24">{children}</main>
      <Nav />
    </div>
  )
}
