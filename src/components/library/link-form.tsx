'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CATEGORIES = [
  { key: 'video', label: 'Video' },
  { key: 'text', label: 'Text' },
  { key: 'book', label: 'Book' },
  { key: 'other', label: 'Other' },
] as const

interface LinkFormProps {
  onSubmit: (data: { title: string; url: string; description: string; tags: string[]; category: string }) => void
  onCancel: () => void
  initial?: { title: string; url: string; description: string | null; tags: string[]; category?: string }
}

export function LinkForm({ onSubmit, onCancel, initial }: LinkFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(', ') ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'other')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim() && url.trim()) {
          const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
          onSubmit({ title: title.trim(), url: url.trim(), description: description.trim(), tags, category })
        }
      }}
      className="flex flex-col gap-3"
    >
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How to focus better" />
      <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief note" />
      <Input label="Tags (comma-separated)" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="focus, productivity" />

      <div>
        <p className="text-xs text-white/40 mb-2">Category</p>
        <div className="flex gap-1 rounded-none border border-white/10 p-0.5 w-fit">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-none text-xs font-medium transition-all ${
                category === c.key
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!title.trim() || !url.trim()}>Save</Button>
      </div>
    </form>
  )
}
