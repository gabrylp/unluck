'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LinkFormProps {
  onSubmit: (data: { title: string; url: string; description: string; tags: string[] }) => void
  onCancel: () => void
  initial?: { title: string; url: string; description: string | null; tags: string[] }
}

export function LinkForm({ onSubmit, onCancel, initial }: LinkFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(', ') ?? '')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim() && url.trim()) {
          const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
          onSubmit({ title: title.trim(), url: url.trim(), description: description.trim(), tags })
        }
      }}
      className="flex flex-col gap-3"
    >
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How to focus better" />
      <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief note" />
      <Input label="Tags (comma-separated)" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="focus, productivity" />
      <div className="flex gap-2 justify-end mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!title.trim() || !url.trim()}>Save</Button>
      </div>
    </form>
  )
}
