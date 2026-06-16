'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { StreakIndicator } from '@/components/streaks/streak-indicator'
import { StreakMode } from '@/lib/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers'

export default function SettingsPage() {
  const { user } = useAuth()
  const [streakMode, setStreakMode] = useState<StreakMode>('easy')
  const [streak, setStreak] = useState<{ current_streak: number; longest_streak: number }>({ current_streak: 0, longest_streak: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('streaks').select('*').maybeSingle()
      if (data) {
        setStreakMode((data.streak_mode as StreakMode) || 'easy')
        setStreak({ current_streak: data.current_streak ?? 0, longest_streak: data.longest_streak ?? 0 })
      }
      setLoaded(true)
    })()
  }, [user])

  const updateMode = async (mode: StreakMode) => {
    setStreakMode(mode)
    await supabase.from('streaks').upsert({ streak_mode: mode }, { onConflict: 'user_id' })
    toast.success(`Streak mode set to ${mode}`)
  }

  const clearData = async () => {
    if (!confirm('Clear all data? This cannot be undone.')) return
    await Promise.all([
      supabase.from('targets').delete().neq('id', 'none'),
      supabase.from('tasks').delete().neq('id', 'none'),
      supabase.from('completions').delete().neq('id', 'none'),
      supabase.from('user_points').delete().neq('id', 'none'),
      supabase.from('streaks').delete().neq('id', 'none'),
      supabase.from('reward_templates').delete().neq('id', 'none'),
      supabase.from('reward_redemptions').delete().neq('id', 'none'),
      supabase.from('reference_links').delete().neq('id', 'none'),
    ])
    toast.success('Data cleared. Reload the page.')
  }

  if (!loaded) return null

  return (
    <div className="pb-4">
      <h1 className="text-xl font-bold text-white/90 mb-5 pt-3">Settings</h1>

      <div className="glass rounded-none p-4 mb-3">
        <h2 className="font-semibold text-sm text-white/90 mb-3">Consistency</h2>
        <StreakIndicator current={streak.current_streak} longest={streak.longest_streak} />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateMode('easy')}
            className={`flex-1 px-3 py-3 rounded-none text-sm font-medium border transition-all text-left ${
              streakMode === 'easy'
                ? 'bg-white text-black border-white'
                : 'glass glass-hover text-white/60 border-white/10'
            }`}
          >
            <span className="block font-semibold">Easy</span>
            <span className={`text-xs ${streakMode === 'easy' ? 'text-black/60' : 'text-white/40'}`}>
              50% on any scheduled target
            </span>
          </button>
          <button
            onClick={() => updateMode('hard')}
            className={`flex-1 px-3 py-3 rounded-none text-sm font-medium border transition-all text-left ${
              streakMode === 'hard'
                ? 'bg-white text-black border-white'
                : 'glass glass-hover text-white/60 border-white/10'
            }`}
          >
            <span className="block font-semibold">Hard</span>
            <span className={`text-xs ${streakMode === 'hard' ? 'text-black/60' : 'text-white/40'}`}>
              80% on every scheduled target
            </span>
          </button>
        </div>
      </div>

      <div className="glass rounded-none p-4 mb-3">
        <h2 className="font-semibold text-sm text-white/90 mb-2">About</h2>
        <p className="text-xs text-white/40">Unluck — Personal Improvement Tracker v0.1</p>
        <p className="text-xs text-white/40 mt-1">Mobile-first self-improvement roadmap.</p>
      </div>

      <div className="glass rounded-none p-4">
        <h2 className="font-semibold text-sm text-white/90 mb-2">Data</h2>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={clearData}>
            Clear All Data
          </Button>
        </div>
      </div>
    </div>
  )
}
