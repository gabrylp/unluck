'use client'

import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RewardTemplate } from '@/lib/types'

interface RedeemModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  reward: RewardTemplate
}

export function RedeemModal({ open, onClose, onConfirm, reward }: RedeemModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Confirm">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-white/60">
          Spend <strong className="text-white/90">{reward.point_cost}✦</strong> on "{reward.title}"?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Dialog>
  )
}
