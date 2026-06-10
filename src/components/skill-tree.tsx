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
  description: string
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
      description: task.description,
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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const holdTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
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
    pointerStart.current[nodeId] = { x: e.clientX, y: e.clientY }
    pointerDownTime.current[nodeId] = Date.now()
    if (highlightTimers.current[nodeId]) {
      clearTimeout(highlightTimers.current[nodeId])
    }
    holdTimers.current[nodeId] = setTimeout(() => {
      setAnimating((prev) => ({ ...prev, [nodeId]: true }))
      setHighlighted((prev) => ({ ...prev, [nodeId]: true }))
      onToggleComplete(nodeId)
      setTimeout(() => {
        setAnimating((prev) => ({ ...prev, [nodeId]: false }))
        setHighlighted((prev) => ({ ...prev, [nodeId]: false }))
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
      }, 700)
    }
    delete pointerStart.current[nodeId]
    delete pointerDownTime.current[nodeId]
  }, [])

  const highlightedId = Object.keys(highlighted).find((k) => highlighted[k])
  const rootIds = useMemo(() => {
    const toIds = new Set(connections.map(c => c.toId))
    return new Set(connections.map(c => c.fromId).filter(id => !toIds.has(id)))
  }, [connections])
  const chainIds = useMemo(() => {
    if (!highlightedId) return new Set<string>()
    const ids = new Set([highlightedId])
    let current = highlightedId
    while (current) {
      const parent = connections.find(c => c.toId === current)
      if (!parent || rootIds.has(parent.fromId)) break
      ids.add(parent.fromId)
      current = parent.fromId
    }
    return ids
  }, [highlightedId, connections, rootIds])

  if (nodes.length === 0) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      style={{ touchAction: 'none' }}
    >
      {connections.map((conn) => {
        const connected = highlightedId && chainIds.has(conn.fromId) && chainIds.has(conn.toId)
        return (
          <path
            key={conn.fromId + '-' + conn.toId}
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
        const isComplete = node.completed
        const isHighlighted = highlighted[node.id] ?? false
        const isInChain = chainIds.has(node.id) && !isComplete
        const isHovered = hoveredNode === node.id
        const showDescription = (isHighlighted || isHovered) && !!node.description

        const scale = isAnimating ? 1.3 : isHighlighted ? 1.15 : 1
        const fill = isComplete ? 'rgba(255,255,255,0.15)' : isInChain ? 'rgba(255,255,255,0.12)' : 'none'
        const stroke = isComplete ? 'rgba(255,255,255,0.8)' : isInChain ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'
        const shadowBlur = isComplete ? 12 : isInChain ? 8 : 0
        const labelOpacity = isComplete ? 0.9 : isInChain ? 0.8 : 0.6

        const descLines = showDescription ? Math.min(Math.ceil(node.description.length / 18), 5) : 0
        const descHeight = descLines * 14 + 6

        return (
          <g
            key={node.id}
            tabIndex={0}
            role="button"
            aria-label={node.title}
            onPointerDown={(e) => handlePointerDown(node.id, node.completed, e)}
            onPointerMove={(e) => handlePointerMove(node.id, e)}
            onPointerUp={() => handlePointerUp(node.id)}
            onPointerCancel={() => handlePointerUp(node.id)}
            onPointerEnter={() => setHoveredNode(node.id)}
            onPointerLeave={() => setHoveredNode(null)}
            style={{ userSelect: 'none', outline: 'none', cursor: 'default' }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={CIRCLE_R * scale}
              fill={fill}
              stroke={stroke}
              strokeWidth={2}
              style={{
                transition: 'all 0.2s',
                filter: shadowBlur > 0 ? `drop-shadow(0 0 ${shadowBlur}px rgba(255,255,255,0.5))` : 'none',
                pointerEvents: 'all',
              }}
            />
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
            {showDescription && (
              <foreignObject
                x={cx - 70}
                y={cy - CIRCLE_R - descHeight - 4}
                width={140}
                height={descHeight}
              >
                <div className="text-center text-[9px] text-white/60 leading-snug break-words px-1"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '2px 4px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {node.description}
                </div>
              </foreignObject>
            )}
          </g>
        )
      })}
    </svg>
  )
}
