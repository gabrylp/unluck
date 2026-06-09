'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@/components/ui/dialog'
import { RewardForm } from '@/components/rewards/reward-form'
import { Button } from '@/components/ui/button'
import { PointBadge } from '@/components/points/point-badge'
import { RewardTemplate, UserPoints, RewardRedemption } from '@/lib/types'
import { demoRewards, demoPoints, demoUserId } from '@/lib/demo-data'
import { toast } from 'sonner'

const STORAGE_KEY = 'unluck-rewards'

function loadData() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  return null
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function RewardsPage() {
  const [data, setData] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedReward, setSelectedReward] = useState<RewardTemplate | null>(null)
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])

  useEffect(() => {
    const saved = loadData()
    setData(saved || { rewards: demoRewards, points: demoPoints })
  }, [])

  const persist = useCallback((newData: any) => {
    setData(newData)
    saveData(newData)
  }, [])

  if (!data) return null

  const handleAddReward = (formData: { title: string; description: string; point_cost: number; icon: string }) => {
    const newReward: RewardTemplate = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      title: formData.title,
      description: formData.description,
      point_cost: formData.point_cost,
      icon: formData.icon || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    persist({ ...data, rewards: [...data.rewards, newReward] })
    setShowForm(false)
    toast.success('Reward created')
  }

  const handleRedeem = (reward: RewardTemplate) => {
    if (data.points.current_balance < reward.point_cost) {
      toast.error('Not enough points')
      return
    }
    const newPoints: UserPoints = {
      ...data.points,
      total_spent: data.points.total_spent + reward.point_cost,
      current_balance: data.points.current_balance - reward.point_cost,
    }
    const newRedemption: RewardRedemption = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      reward_template_id: reward.id,
      points_spent: reward.point_cost,
      redeemed_at: new Date().toISOString(),
    }
    persist({ ...data, points: newPoints })
    setRedemptions([newRedemption, ...redemptions])
    setSelectedReward(null)
    toast.success(`"${reward.title}" redeemed!`)
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5 pt-3">
        <h1 className="text-xl font-bold text-white/90">Rewards</h1>
        <div className="flex items-center gap-2">
          <PointBadge balance={data.points.current_balance} />
          <Button size="sm" onClick={() => setShowForm(true)}>+ New Reward</Button>
        </div>
      </div>

      {data.rewards.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">No rewards yet</p>
          <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>Create your first reward</Button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {data.rewards.map((reward: RewardTemplate) => (
            <div
              key={reward.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedReward(reward)}
              className="glass glass-hover rounded-none p-3 flex flex-col items-center gap-1.5 aspect-square cursor-pointer"
            >
              {reward.icon ? (
                <span className="text-xl">{reward.icon}</span>
              ) : (
                <span className="w-7 h-7 rounded-none border border-white/20 flex items-center justify-center text-xs text-white/40">✦</span>
              )}
              <span className="text-[10px] text-white/60 text-center leading-tight line-clamp-2">
                {reward.title}
              </span>
              <span className="text-[9px] text-white/40">✦{reward.point_cost}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRedeem(reward) }}
                disabled={data.points.current_balance < reward.point_cost}
                className="w-full mt-auto py-1 rounded-none bg-white/10 text-[9px] font-medium text-white/60 hover:bg-white/20 disabled:opacity-20 transition-colors"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedReward(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-strong rounded-none p-5 w-full max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-2 mb-4">
                {selectedReward.icon && <span className="text-3xl">{selectedReward.icon}</span>}
                <h2 className="text-base font-semibold text-white/90">{selectedReward.title}</h2>
                {selectedReward.description && (
                  <p className="text-xs text-white/50 text-center">{selectedReward.description}</p>
                )}
                <p className="text-sm font-medium text-white/70">✦{selectedReward.point_cost}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRedeem(selectedReward)}
                  disabled={data.points.current_balance < selectedReward.point_cost}
                  className="flex-1 py-2.5 rounded-none bg-white text-black text-sm font-medium disabled:opacity-30"
                >
                  Redeem
                </button>
                <button
                  onClick={() => setSelectedReward(null)}
                  className="py-2.5 px-4 rounded-none glass glass-hover text-sm text-white/50"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="New Reward">
        <RewardForm onSubmit={handleAddReward} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  )
}
