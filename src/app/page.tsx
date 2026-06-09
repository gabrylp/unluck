'use client'

import { useState, useEffect, useCallback } from 'react'
// framer-motion imports removed
import { SkillTree } from '@/components/skill-tree'
import { PointBadge } from '@/components/points/point-badge'
import { StreakIndicator } from '@/components/streaks/streak-indicator'
import { Dialog } from '@/components/ui/dialog'
import { TargetForm } from '@/components/targets/target-form'
import { TaskForm } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import { TargetWithProgress, Task, TimeSection, CompletionType, TaskWithChildren } from '@/lib/types'
import { buildTaskTree, getParentChain } from '@/lib/utils'
import {
  demoTargets, demoTasks, demoCompletions, demoPoints, demoStreak, demoUserId,
} from '@/lib/demo-data'
import { toast } from 'sonner'

const STORAGE_KEY = 'unluck-demo'

const SECTIONS: { label: string; key: TimeSection | null }[] = [
  { label: 'Morning', key: 'morning' },
  { label: 'Afternoon', key: 'afternoon' },
  { label: 'Night', key: 'night' },
  { label: 'Unscheduled', key: null },
]

function loadData() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  return null
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function isSubtreeComplete(node: TaskWithChildren, completed: Set<string>): boolean {
  if (!completed.has(node.id)) return false
  for (const child of node.children) {
    if (!isSubtreeComplete(child, completed)) return false
  }
  return true
}

function markSubtreeComplete(node: TaskWithChildren, completed: Set<string>, subtreeSet: Set<string>) {
  if (isSubtreeComplete(node, completed)) {
    subtreeSet.add(node.id)
  }
  for (const child of node.children) {
    markSubtreeComplete(child, completed, subtreeSet)
  }
}

function getAllDescendantIds(taskId: string, tasks: Task[]): string[] {
  const ids: string[] = [taskId]
  const children = tasks.filter((t) => t.parent_id === taskId)
  for (const child of children) {
    ids.push(...getAllDescendantIds(child.id, tasks))
  }
  return ids
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set())
  const [dragTargetId, setDragTargetId] = useState<string | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadData()
    const initial = saved || {
      targets: [],
      tasks: [],
      completions: [],
      points: { total_earned: 0, total_spent: 0, current_balance: 0 },
      streak: { current_streak: 0, longest_streak: 0, last_activity_date: '', streak_mode: 'easy' },
    }
    setData(initial)
    setExpandedTargets(new Set(initial.targets.map((t: any) => t.id)))
  }, [])

  const persist = useCallback((newData: any) => {
    setData(newData)
    saveData(newData)
  }, [])

  if (!data) return null

  const completedIds = new Set<string>(data.completions.map((c: any) => c.task_id))

  const targetsWithProgress: TargetWithProgress[] = data.targets.map((t: any) => {
    const targetTasks = data.tasks.filter((tk: any) => tk.target_id === t.id)
    const tree = buildTaskTree(targetTasks, completedIds)

    const subtreeCompleteIds = new Set<string>()
    for (const root of tree) {
      markSubtreeComplete(root, completedIds, subtreeCompleteIds)
    }

    function countAll(node: TaskWithChildren): { total: number; completed: number } {
      let total = 1
      let completed = subtreeCompleteIds.has(node.id) ? 1 : 0
      for (const child of node.children) {
        const sub = countAll(child)
        total += sub.total
        completed += sub.completed
      }
      return { total, completed }
    }

    function markSubtreeFlag(node: TaskWithChildren): TaskWithChildren {
      return {
        ...node,
        completed: subtreeCompleteIds.has(node.id),
        children: node.children.map(markSubtreeFlag),
      }
    }

    const flaggedTree = tree.map(markSubtreeFlag)

    let totalCount = 0
    let completedCount = 0
    for (const root of flaggedTree) {
      const c = countAll(root)
      totalCount += c.total
      completedCount += c.completed
    }

    return {
      ...t,
      tasks: flaggedTree,
      completion_pct: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      completed_count: completedCount,
      total_count: totalCount,
      is_completed: totalCount > 0 && completedCount === totalCount,
    }
  })

  const handleToggleComplete = (taskId: string) => {
    const task = data.tasks.find((t: any) => t.id === taskId)
    if (!task) return

    const existingIds = new Set(data.completions.map((c: any) => c.task_id))

    if (existingIds.has(taskId)) {
      const toRemove = getAllDescendantIds(taskId, data.tasks)
      const newCompletions = data.completions.filter((c: any) => !toRemove.includes(c.task_id))

      const ancestorIds = getParentChain(taskId, data.tasks).filter((id) => id !== taskId)
      const ancestorsToRemove: string[] = []
      for (const aid of ancestorIds) {
        const descs = getAllDescendantIds(aid, data.tasks)
        const allComplete = descs.every((did) =>
          newCompletions.some((c: any) => c.task_id === did)
        )
        if (!allComplete) {
          ancestorsToRemove.push(aid)
        }
      }

      const finalCompletions = newCompletions.filter(
        (c: any) => !ancestorsToRemove.includes(c.task_id)
      )

      const allRemoved = [...toRemove, ...ancestorsToRemove]
      const removedCount = allRemoved.filter((id) => existingIds.has(id)).length

      let bonusPenalty = 0
      const targetTasks = data.tasks.filter((t: any) => t.target_id === task.target_id)
      const allTaskIds = new Set(targetTasks.map((t: any) => t.id))
      const wasTargetComplete = [...allTaskIds].every((id) =>
        data.completions.some((c: any) => c.task_id === id)
      )
      if (wasTargetComplete) {
        const isTargetNowComplete = [...allTaskIds].every((id) =>
          finalCompletions.some((c: any) => c.task_id === id)
        )
        if (!isTargetNowComplete) {
          bonusPenalty = 5
        }
      }

      const newPoints = {
        ...data.points,
        total_earned: Math.max(0, data.points.total_earned - removedCount - bonusPenalty),
        current_balance: Math.max(0, data.points.current_balance - removedCount - bonusPenalty),
      }

      persist({
        ...data,
        completions: finalCompletions,
        points: newPoints,
      })

      const penaltyMsg = bonusPenalty > 0 ? ` -${bonusPenalty} bonus` : ''
      toast.info(removedCount > 0 ? `-${removedCount} pts${penaltyMsg}` : 'Already undone')
      return
    }

    const chain = getParentChain(taskId, data.tasks)
    const newCompletions: any[] = []

    for (const id of chain) {
      if (!existingIds.has(id)) {
        newCompletions.push({
          id: crypto.randomUUID(),
          user_id: demoUserId,
          task_id: id,
          completed_date: new Date().toISOString().split('T')[0],
          points_awarded: 1,
          created_at: new Date().toISOString(),
        })
      }
    }

    if (newCompletions.length === 0) {
      toast.info('Already completed')
      return
    }

    const earned = newCompletions.length
    let bonusEarned = 0

    const targetTasks = data.tasks.filter((t: any) => t.target_id === task.target_id)
    const allTaskIds = new Set(targetTasks.map((t: any) => t.id))
    const allNowComplete = [...allTaskIds].every((id) =>
      existingIds.has(id) || newCompletions.some((c: any) => c.task_id === id)
    )

    if (allNowComplete) {
      bonusEarned = 5
    }

    const newPoints = {
      ...data.points,
      total_earned: data.points.total_earned + earned + bonusEarned,
      current_balance: data.points.current_balance + earned + bonusEarned,
    }

    const today = new Date().toISOString().split('T')[0]
    let newStreak = { ...data.streak }
    if (newStreak.last_activity_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (newStreak.last_activity_date === yesterday || !newStreak.last_activity_date) {
        newStreak.current_streak += 1
        newStreak.longest_streak = Math.max(newStreak.longest_streak, newStreak.current_streak)
      } else {
        newStreak.current_streak = 1
      }
      newStreak.last_activity_date = today
    }

    persist({
      ...data,
      completions: [...data.completions, ...newCompletions],
      points: newPoints,
      streak: newStreak,
    })

    const msg = earned > 1 ? `+${earned} pts chain` : `+1 pt`
    toast.success(bonusEarned ? `${msg} +${bonusEarned} bonus` : msg)
  }

  const handleAddTarget = (formData: { title: string }) => {
    const newTarget = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      title: formData.title,
      time_section: null,
      sort_order: data.targets.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const newData = { ...data, targets: [...data.targets, newTarget] }
    persist(newData)
    setExpandedTargets(new Set([...expandedTargets, newTarget.id]))
    setShowTargetDialog(false)
    toast.success('Target created')
  }

  const handleAddTask = (formData: { title: string; description: string; completion_type: CompletionType }) => {
    if (!selectedTargetId) return
    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      target_id: selectedTargetId,
      parent_id: null,
      title: formData.title,
      description: formData.description,
      completion_type: formData.completion_type,
      custom_schedule: null,
      sort_order: data.tasks.filter((t: any) => t.target_id === selectedTargetId).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    persist({ ...data, tasks: [...data.tasks, newTask] })
    setShowTaskDialog(false)
    toast.success('Task added')
  }

  const toggleTarget = (id: string) => {
    setExpandedTargets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDragStart = (e: React.DragEvent, targetId: string) => {
    e.dataTransfer.setData('text/plain', targetId)
    e.dataTransfer.effectAllowed = 'move'
    setDragTargetId(targetId)
  }

  const handleDragOver = (e: React.DragEvent, section: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSection(section ?? '__unscheduled__')
  }

  const handleDragLeave = () => {
    setDragOverSection(null)
  }

  const handleDrop = (e: React.DragEvent, section: TimeSection | null) => {
    e.preventDefault()
    const tid = e.dataTransfer.getData('text/plain')
    if (!tid) return
    const updated = data.targets.map((t: any) =>
      t.id === tid ? { ...t, time_section: section } : t
    )
    persist({ ...data, targets: updated })
    setDragTargetId(null)
    setDragOverSection(null)
    toast.success('Target moved')
  }

  const handleDragEnd = () => {
    setDragTargetId(null)
    setDragOverSection(null)
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5 pt-3">
        <div>
          <h1 className="text-xl font-bold text-white/90">Roadmap</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StreakIndicator current={data.streak.current_streak} longest={data.streak.longest_streak} />
          <PointBadge balance={data.points.current_balance} />
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <Button size="sm" onClick={() => setShowTargetDialog(true)}>+ Target</Button>
        <Button size="sm" variant="secondary" onClick={() => {
          const t = data.targets[0]
          if (t) {
            setSelectedTargetId(t.id)
            setShowTaskDialog(true)
          } else {
            toast.error('Create a target first')
          }
        }}>+ Task</Button>
      </div>

      {targetsWithProgress.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">No targets yet</p>
          <Button size="sm" className="mt-3" onClick={() => setShowTargetDialog(true)}>Create your first target</Button>
        </div>
      ) : (
        <div>
          {SECTIONS.map(({ label, key }) => {
            const sectionTargets = targetsWithProgress.filter((t) => t.time_section === key)
            const isOver = dragOverSection === (key ?? '__unscheduled__')
            return (
              <div key={label} className="mb-5">
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
                  <span className="text-[10px] text-white/30 font-medium">{sectionTargets.length}</span>
                </div>

                {sectionTargets.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-white/15">Drop targets here</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sectionTargets.map((target) => {
                      const expanded = expandedTargets.has(target.id)
                      return (
                        <div
                          key={target.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, target.id)}
                          onDragEnd={handleDragEnd}
                          className={`glass rounded-none overflow-hidden transition-all ${
                            target.is_completed ? 'border-white/80' : ''
                          } ${dragTargetId === target.id ? 'opacity-30' : ''}`}
                        >
                          <button
                            onClick={() => toggleTarget(target.id)}
                            className="w-full flex items-center justify-between p-3 text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="text-white/40 transition-transform duration-200 text-base shrink-0"
                                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                              >
                                ›
                              </span>
                              <h3 className="font-semibold text-sm text-white/90 truncate">{target.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs font-medium text-white/50">
                                ◈ {target.completed_count}/{target.total_count}
                              </span>
                              <div className="w-12 h-1 rounded-none bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    target.is_completed ? 'bg-white' : 'bg-white/60'
                                  }`}
                                  style={{ width: `${target.completion_pct}%` }}
                                />
                              </div>
                            </div>
                          </button>
                          {expanded && (
                            <div className="px-3 pb-6 pt-2 overflow-x-auto">
                              {target.tasks.length > 0 ? (
                                <SkillTree tasks={target.tasks} onToggleComplete={handleToggleComplete} />
                              ) : (
                                <p className="text-white/40 text-xs text-center py-3">No tasks yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showTargetDialog} onClose={() => setShowTargetDialog(false)} title="New Target">
        <TargetForm onSubmit={handleAddTarget} onCancel={() => setShowTargetDialog(false)} />
      </Dialog>

      <Dialog open={showTaskDialog} onClose={() => setShowTaskDialog(false)} title="New Task">
        <TaskForm onSubmit={handleAddTask} onCancel={() => setShowTaskDialog(false)} />
      </Dialog>
    </div>
  )
}
