'use client'

import { useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TaskWithChildren } from '@/lib/types'

const H_GAP = 80
const V_SPACING = 56
const CIRCLE_R = 12
const PADDING = 20

interface PosNode {
  id: string
  title: string
  x: number
  y: number
  depth: number
}

interface Connection {
  fromX: number
  fromY: number
  toX: number
  toY: number
}

function layout(
  tasks: TaskWithChildren[],
  depth: number,
  startY: number,
  outNodes: PosNode[],
  outConns: Connection[],
): number {
  let cy = startY
  for (const task of tasks) {
    const childCount = task.children.length
    let subHeight = 0
    let childStartY = cy

    if (childCount > 0) {
      subHeight = layout(task.children, depth + 1, cy, outNodes, outConns)
      childStartY = cy
      cy += subHeight + V_SPACING
    } else {
      cy += V_SPACING
    }

    const parentY = childCount > 0
      ? childStartY + (subHeight - V_SPACING) / 2
      : cy - V_SPACING / 2

    const x = depth * H_GAP
    outNodes.push({
      id: task.id,
      title: task.title,
      x,
      y: parentY,
      depth,
    })

    for (const child of task.children) {
      const childPos = outNodes.find((n) => n.id === child.id)
      if (childPos) {
        outConns.push({
          fromX: x + CIRCLE_R,
          fromY: parentY,
          toX: childPos.x - CIRCLE_R,
          toY: childPos.y,
        })
      }
    }
  }
  return cy - startY
}

function bezierPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = Math.max(Math.abs(toX - fromX) * 0.45, 20)
  return `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`
}

interface TargetBuilderTreeProps {
  tasks: TaskWithChildren[]
  builderMode: 'task' | 'connect'
  connectSource: string | null
  showPopup: string | null
  onNodeTap: (nodeId: string) => void
  onDisconnect: (nodeId: string) => void
  onAddChild: (nodeId: string | null) => void
  onEdit: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onPopupClose: () => void
}

export function TargetBuilderTree({
  tasks,
  builderMode,
  connectSource,
  showPopup,
  onNodeTap,
  onDisconnect,
  onAddChild,
  onEdit,
  onDelete,
  onPopupClose,
}: TargetBuilderTreeProps) {
  const holdTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const holdFired = useRef<Record<string, boolean>>({})
  const pointerStart = useRef<Record<string, { x: number; y: number }>>({})

  const { nodes, connections, width, height } = useMemo(() => {
    const n: PosNode[] = []
    const c: Connection[] = []
    layout(tasks, 0, PADDING + CIRCLE_R, n, c)
    const maxX = n.reduce((m, node) => Math.max(m, node.x + H_GAP), H_GAP * 2)
    const maxY = n.reduce((m, node) => Math.max(m, node.y + V_SPACING), 60)
    return { nodes: n, connections: c, width: maxX + PADDING * 2, height: maxY + PADDING }
  }, [tasks])

  const handlePointerDown = useCallback((nodeId: string, e: React.PointerEvent) => {
    if (builderMode === 'connect') {
      pointerStart.current[nodeId] = { x: e.clientX, y: e.clientY }
      delete holdFired.current[nodeId]
      holdTimers.current[nodeId] = setTimeout(() => {
        holdFired.current[nodeId] = true
        onDisconnect(nodeId)
      }, 400)
    } else {
      onNodeTap(nodeId)
    }
  }, [builderMode, onNodeTap, onDisconnect])

  const handlePointerMove = useCallback((nodeId: string, e: React.PointerEvent) => {
    if (builderMode !== 'connect') return
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
  }, [builderMode])

  const handlePointerUp = useCallback((nodeId: string) => {
    if (holdTimers.current[nodeId]) {
      clearTimeout(holdTimers.current[nodeId])
      delete holdTimers.current[nodeId]
    }
    if (!holdFired.current[nodeId] && builderMode === 'connect') {
      onNodeTap(nodeId)
    }
    delete pointerStart.current[nodeId]
    delete holdFired.current[nodeId]
  }, [builderMode, onNodeTap])

  if (nodes.length === 0) return <p className="text-white/40 text-xs text-center py-3">No tasks yet</p>

  const popupNode = showPopup ? nodes.find(n => n.id === showPopup) : null

  return (
    <div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        style={{ touchAction: 'none' }}
      >
        {builderMode === 'task' && (
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            onPointerDown={() => onAddChild(null)}
          />
        )}

        {connections.map((conn, i) => (
          <path
            key={i}
            d={bezierPath(conn.fromX + PADDING, conn.fromY, conn.toX + PADDING, conn.toY)}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}

        {nodes.map((node) => {
          const cx = node.x + PADDING
          const cy = node.y
          const isActiveSource = builderMode === 'connect' && connectSource === node.id
          const isPopupActive = showPopup === node.id

          return (
            <g
              key={node.id}
              onPointerDown={(e) => handlePointerDown(node.id, e)}
              onPointerMove={(e) => handlePointerMove(node.id, e)}
              onPointerUp={() => handlePointerUp(node.id)}
              onPointerCancel={() => handlePointerUp(node.id)}
              style={{ cursor: 'default', userSelect: 'none' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={CIRCLE_R}
                fill={isActiveSource ? 'rgba(255,255,255,0.25)' : 'none'}
                stroke={isActiveSource ? 'white' : isPopupActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}
                strokeWidth={2}
                style={{
                  transition: 'all 0.2s',
                  filter: isActiveSource ? 'drop-shadow(0 0 12px rgba(255,255,255,0.5))' : 'none',
                  pointerEvents: 'all',
                }}
              />

              {builderMode === 'task' && (
                <g
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onAddChild(node.id)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={cx + CIRCLE_R + 6}
                    cy={cy - CIRCLE_R - 6}
                    r={6}
                    fill="rgba(255,255,255,0.3)"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={1}
                  />
                  <text
                    x={cx + CIRCLE_R + 6}
                    y={cy - CIRCLE_R - 6}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fill="rgba(255,255,255,0.7)"
                    style={{ pointerEvents: 'none' }}
                  >+</text>
                </g>
              )}

              {builderMode === 'connect' && (
                <circle
                  cx={cx + CIRCLE_R + 4}
                  cy={cy}
                  r={5}
                  fill="rgba(255,255,255,0.4)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onNodeTap(node.id)
                  }}
                  style={{ cursor: 'pointer' }}
                />
              )}

              <text
                x={cx}
                y={cy + CIRCLE_R + 14}
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
        {popupNode && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 glass-strong rounded-none p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/90">{popupNode.title}</span>
              <span className="text-[10px] text-white/40">Task</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onEdit(popupNode.id); onPopupClose() }}
                className="flex-1 py-2 rounded-none glass glass-hover text-sm text-white/80"
              >
                Edit
              </button>
              <button
                onClick={() => { onAddChild(popupNode.id); onPopupClose() }}
                className="flex-1 py-2 rounded-none glass glass-hover text-sm text-white/80"
              >
                + Child
              </button>
              <button
                onClick={() => { onDelete(popupNode.id); onPopupClose() }}
                className="py-2 px-4 rounded-none glass glass-hover text-sm text-red-400"
              >
                Delete
              </button>
              <button
                onClick={onPopupClose}
                className="py-2 px-3 rounded-none glass glass-hover text-sm text-white/50"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
