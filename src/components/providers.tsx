'use client'

import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading && !user && pathname !== '/gate') {
      router.push('/gate')
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <AuthContext.Provider value={{ user, loading }}>
        {children}
      </AuthContext.Provider>
      <Toaster position="top-center" />
    </>
  )
}

import { createContext, useContext } from 'react'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const useAuth = () => useContext(AuthContext)
