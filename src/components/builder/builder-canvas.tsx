'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, Target } from '@/lib/types'
import { toast } from 'sonner'

type BuilderMode = 'task' | 'connect'

const V_SPACING = 56
const NODE_R = 12
const PADDING = 20

interface PosNode {
  id: string
  title: string
  x: number
  y: number
}

interface Connection {
  fromX: number
  fromY: number
  toX: number
  toY: number
}

interface TargetData {
  targetId: string
  targetTitle: string
  nodes: PosNode[]
  connections: Connection[]
  width: number
  height: number
}

function layoutTargetTree(tasks: Task[], targetId: string, startX: number, startY: number, outNodes: PosNode[], outConns: Connection[]): void {
  const byParent = new Map<string | null, Task[]>()
  const targetTasks = tasks.filter((t) => t.target_id === targetId)
  for (const t of targetTasks) {
    const key = t.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(t)
  }

  function place(parentId: string | null, depth: number, yStart: number): number {
    const kids = byParent.get(parentId) ?? []
    let cy = yStart
    const childPositions: { id: string; y: number }[] = []

    for (const kid of kids) {
      const subH = place(kid.id, depth + 1, cy)
      const childY = cy + (subH - V_SPACING) / 2
      childPositions.push({ id: kid.id, y: childY })
      cy += subH
    }

    if (parentId) {
      const parent = tasks.find((t) => t.id === parentId)!
      const parentY = childPositions.length > 0
        ? childPositions[0].y + (childPositions[childPositions.length - 1].y - childPositions[0].y) / 2
        : yStart + V_SPACING / 2

      outNodes.push({
        id: parentId,
        title: parent.title,
        x: startX + depth * 80,
        y: parentY,
      })

      for (const cp of childPositions) {
        const childNode = outNodes.find((n) => n.id === cp.id)
        if (childNode) {
          outConns.push({
            fromX: startX + depth * 80 + NODE_R,
            fromY: parentY,
            toX: childNode.x - NODE_R,
            toY: childNode.y,
          })
        }
      }
    }

    if (childPositions.length === 0 && parentId) {
      return V_SPACING
    }

    return cy - yStart
  }

  place(null, 0, startY)
}

function bezierPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = Math.max(Math.abs(toX - fromX) * 0.45, 20)
  return `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`
}

interface BuilderCanvasProps {
  targets: Target[]
  tasks: Task[]
  onAddTask: (parentId: string | null) => void
  onDeleteTask: (id: string) => void
  onEditTask: (id: string) => void
  onConnect: (sourceId: string, targetId: string) => void
  onDisconnect?: (id: string) => void
}

export function BuilderCanvas({ targets, tasks, onAddTask, onDeleteTask, onEditTask, onConnect, onDisconnect }: BuilderCanvasProps) {
  const [mode, setMode] = useState<BuilderMode>('task')
  const [connectSource, setConnectSource] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState<string | null>(null)

  const holdTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const holdFired = useRef<Record<string, boolean>>({})
  const pointerStart = useRef<Record<string, { x: number; y: number }>>({})

  const targetNodes = useMemo(() => {
    const allTargetIds = new Set(tasks.map((t) => t.target_id))
    return [...allTargetIds].map((tid) => {
      const t = targets.find((t) => t.id === tid)
      const nodes: PosNode[] = []
      const connections: Connection[] = []
      layoutTargetTree(tasks, tid, 0, 24, nodes, connections)
      const maxX = nodes.reduce((m, n) => Math.max(m, n.x + 80), 160)
      const maxY = nodes.reduce((m, n) => Math.max(m, n.y + 40), 60)
      return { targetId: tid, targetTitle: t?.title ?? tid, nodes, connections, width: maxX + PADDING * 2, height: Math.max(maxY + PADDING, 60) }
    })
  }, [targets, tasks])

  const handleNodeTap = useCallback((nodeId: string) => {
    if (mode === 'connect') {
      if (!connectSource) {
        setConnectSource(nodeId)
      } else if (connectSource !== nodeId) {
        const srcTask = tasks.find((t) => t.id === connectSource)
        const tgtTask = tasks.find((t) => t.id === nodeId)
        if (srcTask && tgtTask && srcTask.target_id !== tgtTask.target_id) {
          toast.error('Cannot connect tasks from different targets')
          setConnectSource(null)
          return
        }
        onConnect(connectSource, nodeId)
        setConnectSource(null)
      } else {
        setConnectSource(null)
      }
      return
    }
    setShowPopup(showPopup === nodeId ? null : nodeId)
  }, [mode, connectSource, onConnect, showPopup, tasks])

  const handleNodePointerDown = useCallback((nodeId: string, e: React.PointerEvent) => {
    if (mode === 'connect') {
      handleNodeTap(nodeId)
      return
    }
    pointerStart.current[nodeId] = { x: e.clientX, y: e.clientY }
    delete holdFired.current[nodeId]
    holdTimers.current[nodeId] = setTimeout(() => {
      holdFired.current[nodeId] = true
      onDisconnect?.(nodeId)
      toast.success('Disconnected')
    }, 400)
  }, [mode, handleNodeTap, onDisconnect])

  const handleNodePointerMove = useCallback((nodeId: string, e: React.PointerEvent) => {
    if (mode !== 'task') return
    const start = pointerStart.current[nodeId]
    if (!start) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      if (holdTimers.current[nodeId]) {
        clearTimeout(holdTimers.current[nodeId])
        delete holdTimers.current[nodeId]
      }
    }
  }, [mode])

  const handleNodePointerUp = useCallback((nodeId: string) => {
    if (holdTimers.current[nodeId]) {
      clearTimeout(holdTimers.current[nodeId])
      delete holdTimers.current[nodeId]
    }
    if (!holdFired.current[nodeId] && mode === 'task') {
      handleNodeTap(nodeId)
    }
    delete pointerStart.current[nodeId]
    delete holdFired.current[nodeId]
  }, [mode, handleNodeTap])

  const switchMode = useCallback((m: BuilderMode) => {
    setMode(m)
    setConnectSource(null)
    setShowPopup(null)
  }, [])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['task', 'connect'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-2 rounded-none text-sm font-medium transition-all border ${
              mode === m
                ? 'bg-white text-black border-white'
                : 'glass glass-hover text-white/60 border-white/10'
            }`}
          >
            {m === 'task' ? 'Task' : 'Connect'}
          </button>
        ))}
      </div>

      {targetNodes.length === 0 && (
        <div className="text-center py-8 text-white/40 text-sm">
          No targets yet. Create one or load templates.
        </div>
      )}

      {targetNodes.map((td) => (
        <div className="glass rounded-none p-4 mb-4" key={td.targetId}>
          <h3 className="text-sm font-medium text-white/80 mb-3">{td.targetTitle}</h3>

          <svg
            width={td.width}
            height={td.height}
            viewBox={`0 0 ${td.width} ${td.height}`}
            className="overflow-visible"
            style={{ touchAction: 'none' }}
          >
            <rect
              width="100%"
              height="100%"
              fill="transparent"
              onPointerDown={() => { if (mode === 'task') onAddTask(null) }}
            />

            {td.connections.map((conn, i) => (
              <path
                key={i}
                d={bezierPath(conn.fromX + PADDING, conn.fromY, conn.toX + PADDING, conn.toY)}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}

            {td.nodes.map((node) => {
              const cx = node.x + PADDING
              const cy = node.y
              const isActiveSource = mode === 'connect' && connectSource === node.id
              const isPopupActive = showPopup === node.id

              return (
                <g key={node.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NODE_R}
                    fill={isActiveSource ? 'rgba(255,255,255,0.25)' : 'none'}
                    stroke={isActiveSource ? 'white' : isPopupActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={2}
                    onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                    onPointerMove={(e) => handleNodePointerMove(node.id, e)}
                    onPointerUp={() => handleNodePointerUp(node.id)}
                    onPointerCancel={() => handleNodePointerUp(node.id)}
                    style={{
                      transition: 'all 0.2s',
                      cursor: 'default',
                      filter: isActiveSource ? 'drop-shadow(0 0 12px rgba(255,255,255,0.5))' : 'none',
                      pointerEvents: 'all',
                    }}
                  />

                  {mode !== 'connect' && (
                    <g
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        onAddTask(node.id)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={cx + NODE_R + 6}
                        cy={cy - NODE_R - 6}
                        r={6}
                        fill="rgba(255,255,255,0.3)"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={1}
                      />
                      <text
                        x={cx + NODE_R + 6}
                        y={cy - NODE_R - 6}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="8"
                        fill="rgba(255,255,255,0.7)"
                        style={{ pointerEvents: 'none' }}
                      >+</text>
                    </g>
                  )}

                  {mode === 'connect' && (
                    <circle
                      cx={cx + NODE_R + 4}
                      cy={cy}
                      r={4}
                      fill="rgba(255,255,255,0.4)"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        handleNodeTap(node.id)
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )}

                  <text
                    x={cx}
                    y={cy + NODE_R + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="rgba(255,255,255,0.6)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.title.length > 9 ? node.title.slice(0, 8) + '\u2026' : node.title}
                  </text>
                </g>
              )
            })}
          </svg>

          <AnimatePresence>
            {showPopup && (() => {
              const allNodes = targetNodes.flatMap(td => td.nodes)
              const node = allNodes.find(n => n.id === showPopup)
              if (!node) return null
              return (
                <motion.div
                  key="popup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-3 glass-strong rounded-none p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white/90">{node.title}</span>
                    <span className="text-[10px] text-white/40">Task</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onEditTask(node.id); setShowPopup(null) }}
                      className="flex-1 py-2 rounded-none glass glass-hover text-sm text-white/80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { onAddTask(node.id); setShowPopup(null) }}
                      className="flex-1 py-2 rounded-none glass glass-hover text-sm text-white/80"
                    >
                      + Child
                    </button>
                    <button
                      onClick={() => { onDeleteTask(node.id); setShowPopup(null) }}
                      className="py-2 px-4 rounded-none glass glass-hover text-sm text-red-400"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowPopup(null)}
                      className="py-2 px-3 rounded-none glass glass-hover text-sm text-white/50"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )
            })()}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
