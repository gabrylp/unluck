'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TargetFormProps {
  onSubmit: (data: { title: string }) => void
  onCancel: () => void
  initial?: { title: string }
}

export function TargetForm({ onSubmit, onCancel, initial }: TargetFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) {
          onSubmit({ title: title.trim() })
        }
      }}
      className="flex flex-col gap-3"
    >
      <Input label="Target name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Mind, Body" />
      <div className="flex gap-2 justify-end mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!title.trim()}>Save</Button>
      </div>
    </form>
  )
}
