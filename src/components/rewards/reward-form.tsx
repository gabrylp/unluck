'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RewardFormProps {
  onSubmit: (data: { title: string; description: string; point_cost: number; icon: string }) => void
  onCancel: () => void
}

export function RewardForm({ onSubmit, onCancel }: RewardFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointCost, setPointCost] = useState('10')
  const [icon, setIcon] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const cost = parseInt(pointCost)
        if (title.trim() && cost > 0) {
          onSubmit({ title: title.trim(), description: description.trim(), point_cost: cost, icon: icon.trim() })
        }
      }}
      className="flex flex-col gap-3"
    >
      <Input label="Reward title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Buy a coffee" />
      <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this reward?" />
      <Input label="Icon (optional)" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="☕" />
      <Input label="Point cost" type="number" min="1" value={pointCost} onChange={(e) => setPointCost(e.target.value)} />
      <div className="flex gap-2 justify-end mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!title.trim() || parseInt(pointCost) < 1}>Save</Button>
      </div>
    </form>
  )
}
