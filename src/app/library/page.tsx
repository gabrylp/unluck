'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconGrid } from '@/components/library/icon-grid'
import { YouTubeEmbed } from '@/components/library/youtube-embed'
import { Dialog } from '@/components/ui/dialog'
import { LinkForm } from '@/components/library/link-form'
import { Button } from '@/components/ui/button'
import { ReferenceLink } from '@/lib/types'
import { demoLinks, demoUserId } from '@/lib/demo-data'
import { toast } from 'sonner'

const STORAGE_KEY = 'unluck-library'

const CATEGORIES: { key: ReferenceLink['category']; label: string }[] = [
  { key: 'video', label: 'Videos' },
  { key: 'text', label: 'Text' },
  { key: 'book', label: 'Books' },
  { key: 'other', label: 'Other' },
]

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
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadData()
    setLinks(saved || [])
  }, [])

  const persist = useCallback((newLinks: ReferenceLink[]) => {
    setLinks(newLinks)
    saveData(newLinks)
  }, [])

  const handleAdd = (formData: { title: string; url: string; description: string; tags: string[]; category: string }) => {
    const newLink: ReferenceLink = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      title: formData.title,
      url: formData.url,
      description: formData.description || null,
      thumbnail_url: null,
      tags: formData.tags,
      category: formData.category as ReferenceLink['category'],
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

  const handleUpdate = (formData: { title: string; url: string; description: string; tags: string[]; category: string }) => {
    if (!editingLink) return
    const updated = links.map((l) =>
      l.id === editingLink.id
        ? { ...l, title: formData.title, url: formData.url, description: formData.description || null, tags: formData.tags, category: formData.category as ReferenceLink['category'] }
        : l
    )
    persist(updated)
    setShowDialog(false)
    setEditingLink(null)
    toast.success('Link updated')
  }

  const handleSeedTemplates = () => {
    if (!confirm('Replace all links with template links?')) return
    persist(demoLinks)
    toast.success('Templates loaded')
  }

  const handleDelete = (id: string) => {
    persist(links.filter((l) => l.id !== id))
    toast.success('Link removed')
  }

  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    e.dataTransfer.setData('text/plain', linkId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSection(category)
  }

  const handleDragLeave = () => {
    setDragOverSection(null)
  }

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault()
    const linkId = e.dataTransfer.getData('text/plain')
    if (!linkId) return
    const updated = links.map((l) =>
      l.id === linkId ? { ...l, category: targetCategory as ReferenceLink['category'] } : l
    )
    persist(updated)
    setDragOverSection(null)
    toast.success('Moved')
  }

  const handleDragEnd = () => {
    setDragOverSection(null)
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5 pt-3">
        <h1 className="text-xl font-bold text-white/90">Library</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedTemplates}
            className="px-3 py-1.5 rounded-none text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            Load Templates
          </button>
          <Button size="sm" onClick={() => setShowDialog(true)}>+ Add Link</Button>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">Library is empty</p>
          <Button size="sm" className="mt-3" onClick={() => setShowDialog(true)}>Add your first link</Button>
        </div>
      ) : (
        <div>
          {CATEGORIES.map(({ key, label }) => {
            const sectionLinks = links.filter((l) => (l.category || 'other') === key)
            const isOver = dragOverSection === key
            return (
              <div key={key} className="mb-6">
                <div
                  className={`flex items-center gap-3 mb-2 px-1 py-1.5 rounded-none transition-colors ${
                    isOver ? 'bg-white/10' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, key)}
                >
                  <h2 className="text-sm font-semibold text-white/60 tracking-wide">{label}</h2>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] text-white/30 font-medium">{sectionLinks.length}</span>
                </div>
                {sectionLinks.length > 0 ? (
                  <IconGrid
                    links={sectionLinks}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onPlayVideo={(videoId) => setPlayingVideo(videoId)}
                    draggable
                    onDragStart={handleDragStart}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-white/15">Drop links here</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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

      <AnimatePresence>
        {playingVideo && (
          <YouTubeEmbed videoId={playingVideo} onClose={() => setPlayingVideo(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
