'use client'

import { useState, FormEvent } from 'react'

export default function GatePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Incorrect password')
        setLoading(false)
        return
      }
      window.location.href = '/'
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black px-4">
      <div className="glass rounded-none p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white/90 text-center mb-2">Unluck</h1>
        <p className="text-sm text-white/40 text-center mb-6">Enter the password to continue</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white/80 placeholder-white/30 outline-none focus:border-white/30 transition-colors"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-none bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
