'use client'

import { useState, useEffect, useCallback } from 'react'
import { IconGrid } from '@/components/library/icon-grid'
import { Dialog } from '@/components/ui/dialog'
import { LinkForm } from '@/components/library/link-form'
import { Button } from '@/components/ui/button'
import { ReferenceLink } from '@/lib/types'
import { demoLinks, demoUserId } from '@/lib/demo-data'
import { toast } from 'sonner'

const STORAGE_KEY = 'unluck-library'

function loadData() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  return null
}

function saveData(data: ReferenceLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function LibraryPage() {
  const [links, setLinks] = useState<ReferenceLink[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingLink, setEditingLink] = useState<ReferenceLink | null>(null)

  useEffect(() => {
    const saved = loadData()
    setLinks(saved || demoLinks)
  }, [])

  const persist = useCallback((newLinks: ReferenceLink[]) => {
    setLinks(newLinks)
    saveData(newLinks)
  }, [])

  const handleAdd = (formData: { title: string; url: string; description: string; tags: string[] }) => {
    const newLink: ReferenceLink = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      title: formData.title,
      url: formData.url,
      description: formData.description || null,
      thumbnail_url: null,
      tags: formData.tags,
      created_at: new Date().toISOString(),
    }
    persist([newLink, ...links])
    setShowDialog(false)
    toast.success('Link saved')
  }

  const handleEdit = (link: ReferenceLink) => {
    setEditingLink(link)
    setShowDialog(true)
  }

  const handleUpdate = (formData: { title: string; url: string; description: string; tags: string[] }) => {
    if (!editingLink) return
    const updated = links.map((l) =>
      l.id === editingLink.id
        ? { ...l, title: formData.title, url: formData.url, description: formData.description || null, tags: formData.tags }
        : l
    )
    persist(updated)
    setShowDialog(false)
    setEditingLink(null)
    toast.success('Link updated')
  }

  const handleDelete = (id: string) => {
    persist(links.filter((l) => l.id !== id))
    toast.success('Link removed')
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5 pt-3">
        <h1 className="text-xl font-bold text-white/90">Library</h1>
        <Button size="sm" onClick={() => setShowDialog(true)}>+ Add Link</Button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">Library is empty</p>
          <Button size="sm" className="mt-3" onClick={() => setShowDialog(true)}>Add your first link</Button>
        </div>
      ) : (
        <IconGrid links={links} onDelete={handleDelete} onEdit={handleEdit} />
      )}

      <Dialog open={showDialog} onClose={() => { setShowDialog(false); setEditingLink(null) }} title={editingLink ? 'Edit Link' : 'Add Link'}>
        {editingLink ? (
          <LinkForm
            onSubmit={handleUpdate}
            onCancel={() => { setShowDialog(false); setEditingLink(null) }}
            initial={editingLink}
          />
        ) : (
          <LinkForm onSubmit={handleAdd} onCancel={() => setShowDialog(false)} />
        )}
      </Dialog>
    </div>
  )
}
