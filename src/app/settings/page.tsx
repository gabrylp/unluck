'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { StreakIndicator } from '@/components/streaks/streak-indicator'
import { StreakMode } from '@/lib/types'
import { demoStreak } from '@/lib/demo-data'
import { toast } from 'sonner'

const STORAGE_KEY = 'unluck-settings'

export default function SettingsPage() {
  const [streakMode, setStreakMode] = useState<StreakMode>(() => {
    if (typeof window === 'undefined') return 'easy'

    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return 'easy'

    try {
      const parsed = JSON.parse(saved)
      return parsed.streakMode || 'easy'
    } catch {
      return 'easy'
    }
  })

  const updateMode = (mode: StreakMode) => {
    setStreakMode(mode)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ streakMode: mode }))
    toast.success(`Streak mode set to ${mode}`)
  }

  return (
    <div className="pb-4">
      <h1 className="text-xl font-bold text-white/90 mb-5 pt-3">Settings</h1>

      <div className="glass rounded-none p-4 mb-3">
        <h2 className="font-semibold text-sm text-white/90 mb-3">Consistency</h2>
        <StreakIndicator current={demoStreak.current_streak} longest={demoStreak.longest_streak} />
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Clear all demo data?')) {
                localStorage.clear()
                toast.success('Data cleared. Reload the page.')
              }
            }}
          >
            Clear All Data
          </Button>
        </div>
      </div>
    </div>
  )
}
