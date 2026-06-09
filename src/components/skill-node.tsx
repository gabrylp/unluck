'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface SkillNodeProps {
  id: string
  completed: boolean
  onToggleComplete: (taskId: string) => void
}

export function SkillNode({ id, completed, onToggleComplete }: SkillNodeProps) {
  const [animating, setAnimating] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasCompleted = useRef(completed)

  const handlePointerDown = useCallback(() => {
    wasCompleted.current = completed
    holdTimer.current = setTimeout(() => {
      setAnimating(true)
      onToggleComplete(id)
      setTimeout(() => setAnimating(false), 800)
    }, 400)
  }, [id, onToggleComplete, completed])

  const handlePointerUp = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }, [])

  const glowClass = completed
    ? 'shadow-[0_0_12px_rgba(255,255,255,0.5)] border-white/80'
    : 'border-white/30'

  return (
    <motion.button
      className={`relative rounded-full outline-none cursor-default select-none transition-colors ${glowClass}`}
      style={{
        width: 24,
        height: 24,
        borderWidth: 2,
        borderStyle: 'solid',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      animate={
        animating
          ? wasCompleted.current
            ? {
                scale: [1, 1.2, 1],
                borderColor: [
                  'rgba(255,255,255,0.8)',
                  'rgba(255,255,255,0.4)',
                  'rgba(255,255,255,0.3)',
                ],
                boxShadow: [
                  '0 0 12px rgba(255,255,255,0.5)',
                  '0 0 4px rgba(255,255,255,0.2)',
                  '0 0 0px rgba(255,255,255,0)',
                ],
              }
            : {
                scale: [1, 1.3, 1],
                borderColor: [
                  'rgba(255,255,255,0.3)',
                  'rgba(255,255,255,1)',
                  'rgba(255,255,255,0.8)',
                ],
                boxShadow: [
                  '0 0 0px rgba(255,255,255,0)',
                  '0 0 20px rgba(255,255,255,0.6)',
                  '0 0 12px rgba(255,255,255,0.5)',
                ],
              }
          : {}
      }
      transition={{ duration: 0.35 }}
    >
      {animating && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ backgroundColor: wasCompleted.current ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.4)' }}
          animate={{ backgroundColor: wasCompleted.current ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0)' }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  )
}
