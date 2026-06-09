'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { TaskWithChildren } from '@/lib/types'

const H_GAP = 80
const V_SPACING = 56
const CIRCLE_R = 12
const PADDING = 20

interface PosNode {
  id: string
  title: string
  completed: boolean
  x: number
  y: number
  depth: number
}

interface Connection {
  fromId: string
  toId: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  completed: boolean
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
      completed: task.completed ?? false,
      x,
      y: parentY,
      depth,
    })

    for (const child of task.children) {
      const childPos = outNodes.find((n) => n.id === child.id)
      if (childPos) {
        outConns.push({
          fromId: task.id,
          toId: child.id,
          fromX: x + CIRCLE_R,
          fromY: parentY,
          toX: childPos.x - CIRCLE_R,
          toY: childPos.y,
          completed: (task.completed ?? false) && (child.completed ?? false),
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

interface SkillTreeProps {
  tasks: TaskWithChildren[]
  onToggleComplete: (taskId: string) => void
}

export function SkillTree({ tasks, onToggleComplete }: SkillTreeProps) {
  const [animating, setAnimating] = useState<Record<string, boolean>>({})
  const [highlighted, setHighlighted] = useState<Record<string, boolean>>({})
  const holdTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const wasCompleted = useRef<Record<string, boolean>>({})
  const pointerStart = useRef<Record<string, { x: number; y: number }>>({})
  const pointerDownTime = useRef<Record<string, number>>({})

  const { nodes, connections, width, height } = useMemo(() => {
    const n: PosNode[] = []
    const c: Connection[] = []
    layout(tasks, 0, PADDING + CIRCLE_R, n, c)
    const maxX = n.reduce((m, node) => Math.max(m, node.x + H_GAP), H_GAP * 2)
    const maxY = n.reduce((m, node) => Math.max(m, node.y + V_SPACING), 60)
    return { nodes: n, connections: c, width: maxX + PADDING * 2, height: maxY + PADDING }
  }, [tasks])

  const handlePointerDown = useCallback((nodeId: string, completed: boolean, e: React.PointerEvent) => {
    wasCompleted.current[nodeId] = completed
    pointerStart.current[nodeId] = { x: e.clientX, y: e.clientY }
    pointerDownTime.current[nodeId] = Date.now()
    if (highlightTimers.current[nodeId]) {
      clearTimeout(highlightTimers.current[nodeId])
    }
    holdTimers.current[nodeId] = setTimeout(() => {
      setAnimating((prev) => ({ ...prev, [nodeId]: true }))
      onToggleComplete(nodeId)
      setTimeout(() => {
        setAnimating((prev) => ({ ...prev, [nodeId]: false }))
      }, 800)
    }, 400)
  }, [onToggleComplete])

  const handlePointerMove = useCallback((nodeId: string, e: React.PointerEvent) => {
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
  }, [])

  const handlePointerUp = useCallback((nodeId: string) => {
    if (holdTimers.current[nodeId]) {
      clearTimeout(holdTimers.current[nodeId])
      delete holdTimers.current[nodeId]
    }
    const downTime = pointerDownTime.current[nodeId]
    if (downTime && Date.now() - downTime < 400) {
      setHighlighted((prev) => ({ ...prev, [nodeId]: true }))
      if (highlightTimers.current[nodeId]) {
        clearTimeout(highlightTimers.current[nodeId])
      }
      highlightTimers.current[nodeId] = setTimeout(() => {
        setHighlighted((prev) => ({ ...prev, [nodeId]: false }))
      }, 300)
    }
    delete pointerStart.current[nodeId]
    delete pointerDownTime.current[nodeId]
  }, [])

  const highlightedId = Object.keys(highlighted).find((k) => highlighted[k])

  if (nodes.length === 0) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      style={{ touchAction: 'none' }}
    >
      {connections.map((conn, i) => {
        const connected = highlightedId && (conn.fromId === highlightedId || conn.toId === highlightedId)
        return (
          <path
            key={i}
            d={bezierPath(conn.fromX + PADDING, conn.fromY, conn.toX + PADDING, conn.toY)}
            fill="none"
            stroke={connected ? 'rgba(255,255,255,0.5)' : conn.completed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={connected ? 3 : 2}
            strokeLinecap="round"
            style={{ transition: 'all 0.15s' }}
          />
        )
      })}

      {nodes.map((node) => {
        const cx = node.x + PADDING
        const cy = node.y
        const isAnimating = animating[node.id] ?? false
        const isHighlighted = highlighted[node.id] ?? false
        const wasComp = wasCompleted.current[node.id]
        const isComplete = node.completed
        const scale = isAnimating ? 1.3 : isHighlighted ? 1.15 : 1
        const fill = isComplete ? 'rgba(255,255,255,0.15)' : 'none'
        const stroke = isComplete ? 'rgba(255,255,255,0.8)' : isHighlighted ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'
        const shadowBlur = isComplete ? 12 : 0
        const labelOpacity = isComplete ? 0.9 : isHighlighted ? 0.8 : 0.6

        return (
          <g key={node.id} style={{ userSelect: 'none' }}>
            <circle
              cx={cx}
              cy={cy}
              r={CIRCLE_R * scale}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
              onPointerDown={(e) => handlePointerDown(node.id, node.completed, e)}
              onPointerMove={(e) => handlePointerMove(node.id, e)}
              onPointerUp={() => handlePointerUp(node.id)}
              onPointerCancel={() => handlePointerUp(node.id)}
              style={{
                transition: 'all 0.2s',
                cursor: 'default',
                filter: shadowBlur > 0 ? `drop-shadow(0 0 ${shadowBlur}px rgba(255,255,255,0.5))` : 'none',
                pointerEvents: 'all',
              }}
            />
            {isAnimating && (
              <circle
                cx={cx}
                cy={cy}
                r={CIRCLE_R}
                fill={wasComp ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0)'}
                style={{ transition: 'fill 0.5s' }}
              />
            )}
            <text
              x={cx}
              y={cy + CIRCLE_R + 14}
              textAnchor="middle"
              fontSize="10"
              fill={`rgba(255,255,255,${labelOpacity})`}
              style={{ pointerEvents: 'none' }}
            >
              {node.title.length > 10 ? node.title.slice(0, 9) + '\u2026' : node.title}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
