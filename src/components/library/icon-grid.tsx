'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReferenceLink } from '@/lib/types'

interface IconGridProps {
  links: ReferenceLink[]
  onDelete: (id: string) => void
  onEdit?: (link: ReferenceLink) => void
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ''
  }
}

export function IconGrid({ links, onDelete, onEdit }: IconGridProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {links.map((link) => (
          <motion.div
            key={link.id}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="glass glass-hover rounded-none p-3 flex flex-col items-center gap-1.5 aspect-square relative"
          >
            <button
              className="flex flex-col items-center gap-1.5 flex-1 w-full"
              onClick={() => {
                if (selected === link.id) {
                  window.open(link.url, '_blank', 'noopener')
                  setSelected(null)
                } else {
                  setSelected(link.id)
                }
              }}
            >
              {link.thumbnail_url ? (
                <img src={link.thumbnail_url} alt="" className="w-8 h-8 rounded-none object-cover" />
              ) : (
                <img
                  src={getFaviconUrl(link.url)}
                  alt=""
                  className="w-8 h-8 rounded-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ''
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <span className="text-[10px] text-white/60 text-center leading-tight line-clamp-2">
                {link.title}
              </span>
              {link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-auto">
                  {link.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[7px] text-white/30 px-1 py-0.5 bg-white/5 rounded-none">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === link.id ? null : link.id) }}
              className="absolute bottom-1 right-1 w-5 h-5 rounded-none flex items-center justify-center text-[10px] text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            >
              ⋮
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && !menuOpen && (() => {
          const link = links.find((l) => l.id === selected)
          if (!link) return null
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 left-4 right-4 glass-strong rounded-none p-4 z-50"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={link.thumbnail_url || getFaviconUrl(link.url)}
                    alt=""
                    className="w-10 h-10 rounded-none object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/90 truncate">{link.title}</p>
                    {link.description && (
                      <p className="text-xs text-white/50 truncate">{link.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 rounded-none glass glass-hover text-sm text-white/80"
                    onClick={() => { window.open(link.url, '_blank', 'noopener'); setSelected(null) }}
                  >
                    Open
                  </button>
                  <button
                    className="py-2 px-4 rounded-none glass glass-hover text-sm text-red-400"
                    onClick={() => { onDelete(link.id); setSelected(null) }}
                  >
                    Delete
                  </button>
                  <button
                    className="py-2 px-3 rounded-none glass glass-hover text-sm text-white/50"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (() => {
          const link = links.find((l) => l.id === menuOpen)
          if (!link) return null
          return (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 glass-strong rounded-none p-2 shadow-2xl"
              style={{
                bottom: '5rem',
                right: '1rem',
              }}
            >
              <button
                onClick={() => { onEdit?.(link); setMenuOpen(null) }}
                className="w-full px-4 py-2 rounded-none text-sm text-white/80 hover:bg-white/10 text-left transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => { onDelete(link.id); setMenuOpen(null); setSelected(null) }}
                className="w-full px-4 py-2 rounded-none text-sm text-red-400 hover:bg-white/10 text-left transition-colors"
              >
                Delete
              </button>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </>
  )
}
