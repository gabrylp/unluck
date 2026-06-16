'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GatePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push('/')
  }

  const handleSignUp = async () => {
    if (!email || !password) return
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setError('Account created! You can now sign in.')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black px-4">
      <div className="glass rounded-none p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white/90 text-center mb-2">Unluck</h1>
        <p className="text-sm text-white/40 text-center mb-6">Sign in to continue</p>
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white/80 placeholder-white/30 outline-none focus:border-white/30 transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white/80 placeholder-white/30 outline-none focus:border-white/30 transition-colors"
          />
          {error && <p className={`text-xs text-center ${error.startsWith('Account') ? 'text-green-400' : 'text-red-400'}`}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-none bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-none glass text-sm font-medium text-white/60 hover:text-white/90 transition-colors disabled:opacity-40"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  )
}
