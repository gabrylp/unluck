'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CompletionType } from '@/lib/types'

interface TaskFormProps {
  onSubmit: (data: { title: string; description: string; completion_type: CompletionType }) => void
  onCancel: () => void
  initial?: { title: string; description: string; completion_type: CompletionType }
}

export function TaskForm({ onSubmit, onCancel, initial }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [completionType, setCompletionType] = useState<CompletionType>(initial?.completion_type ?? 'manual')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) {
          onSubmit({ title: title.trim(), description: description.trim(), completion_type: completionType })
        }
      }}
      className="flex flex-col gap-3"
    >
      <Input label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Meditate" />
      <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-white/60">Completion type</label>
        <div className="flex gap-2">
          {(['manual', 'daily', 'custom'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCompletionType(t)}
              className={`px-3 py-1.5 rounded-none text-sm font-medium border transition-all ${
                completionType === t
                  ? 'bg-white text-black border-white'
                  : 'glass glass-hover text-white/60 border-white/10'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!title.trim()}>Save</Button>
      </div>
    </form>
  )
}
