'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SkillTree } from '@/components/skill-tree'
import { TargetBuilderTree } from '@/components/builder/target-builder-tree'
import { PointBadge } from '@/components/points/point-badge'
import { StreakIndicator } from '@/components/streaks/streak-indicator'
import { Dialog } from '@/components/ui/dialog'
import { TargetForm } from '@/components/targets/target-form'
import { TaskForm } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import { TargetWithProgress, Task, TimeSection, CompletionType } from '@/lib/types'
import { buildTaskTree, getParentChain, getAllDescendantIds } from '@/lib/utils'
import { demoUserId } from '@/lib/demo-data'
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
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function isSubtreeComplete(node: any, completed: Set<string>): boolean {
  if (!completed.has(node.id)) return false
  for (const child of node.children) {
    if (!isSubtreeComplete(child, completed)) return false
  }
  return true
}

function markSubtreeComplete(node: any, completed: Set<string>, subtreeSet: Set<string>) {
  if (isSubtreeComplete(node, completed)) {
    subtreeSet.add(node.id)
  }
  for (const child of node.children) {
    markSubtreeComplete(child, completed, subtreeSet)
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [mode, setMode] = useState<'main' | 'builder'>('main')
  const [builderSubMode, setBuilderSubMode] = useState<'task' | 'connect'>('task')
  const [connectSource, setConnectSource] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState<string | null>(null)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set())
  const [dragTargetId, setDragTargetId] = useState<string | null>(null)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)

  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

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

  useEffect(() => {
    if (mode === 'main') {
      setBuilderSubMode('task')
      setConnectSource(null)
      setShowPopup(null)
    }
  }, [mode])

  const persist = useCallback((newData: any) => {
    setData(newData)
    saveData(newData)
  }, [])

  if (!data) return null

  const completedIds = new Set<string>(data.completions.map((c: any) => c.task_id))

  const targetsWithProgress: TargetWithProgress[] = data.targets.map((t: any) => {
    const targetTasks = data.tasks.filter((tk: any) => tk.target_id === t.id)
    const tree = buildTaskTree(targetTasks, completedIds)

    const rootIds = new Set(
      targetTasks.filter((tk: any) => !tk.parent_id).map((tk: any) => tk.id)
    )

    const subtreeCompleteIds = new Set<string>()
    for (const root of tree) {
      markSubtreeComplete(root, completedIds, subtreeCompleteIds)
    }

    function countAll(node: any): { total: number; completed: number } {
      let total = 1
      const isCompleted = rootIds.has(node.id)
        ? subtreeCompleteIds.has(node.id)
        : completedIds.has(node.id)
      let completed = isCompleted ? 1 : 0
      for (const child of node.children) {
        const sub = countAll(child)
        total += sub.total
        completed += sub.completed
      }
      return { total, completed }
    }

    function markSubtreeFlag(node: any): any {
      return {
        ...node,
        completed: rootIds.has(node.id)
          ? subtreeCompleteIds.has(node.id)
          : completedIds.has(node.id),
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
    const d = dataRef.current
    if (!d) return
    const task = d.tasks.find((t: any) => t.id === taskId)
    if (!task) return

    const rootIds = new Set(d.tasks.filter((t: any) => !t.parent_id).map((t: any) => t.id))
    const existingIds = new Set(d.completions.map((c: any) => c.task_id))

    if (existingIds.has(taskId)) {
      const toRemove = getAllDescendantIds(taskId, d.tasks)
      const finalCompletions = d.completions.filter((c: any) => !toRemove.includes(c.task_id))

      const removedSet = new Set(toRemove)
      const pointLoss = d.completions
        .filter((c: any) => removedSet.has(c.task_id))
        .reduce((sum: number, c: any) => sum + (c.points_awarded ?? 1), 0)

      let bonusPenalty = 0
      const targetTasks = d.tasks.filter((t: any) => t.target_id === task.target_id)
      const allTaskIds = new Set(targetTasks.map((t: any) => t.id))
      const wasTargetComplete = [...allTaskIds].every((id) =>
        d.completions.some((c: any) => c.task_id === id)
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
        ...d.points,
        total_earned: Math.max(0, d.points.total_earned - pointLoss - bonusPenalty),
        current_balance: Math.max(0, d.points.current_balance - pointLoss - bonusPenalty),
      }

      persist({ ...d, completions: finalCompletions, points: newPoints })

      const penaltyMsg = bonusPenalty > 0 ? ` -${bonusPenalty} bonus` : ''
      toast.info(pointLoss > 0 ? `-${pointLoss} pt${pointLoss > 1 ? 's' : ''}${penaltyMsg}` : 'Already undone')
      return
    }

    if (rootIds.has(taskId)) {
      toast.info('Complete all tasks under this target first')
      return
    }

    const chain = getParentChain(taskId, d.tasks)
    const newCompletions: any[] = []

    for (const id of chain) {
      if (!existingIds.has(id)) {
        newCompletions.push({
          id: crypto.randomUUID(),
          user_id: demoUserId,
          task_id: id,
          completed_date: new Date().toISOString().split('T')[0],
          points_awarded: rootIds.has(id) ? 0 : 1,
          created_at: new Date().toISOString(),
        })
      }
    }

    if (newCompletions.length === 0) {
      toast.info('Already completed')
      return
    }

    const earned = newCompletions.reduce((sum: number, c: any) => sum + (c.points_awarded ?? 1), 0)
    let bonusEarned = 0

    const targetTasks = d.tasks.filter((t: any) => t.target_id === task.target_id)
    const allTaskIds = new Set(targetTasks.map((t: any) => t.id))
    const allNowComplete = [...allTaskIds].every((id) =>
      existingIds.has(id) || newCompletions.some((c: any) => c.task_id === id)
    )

    if (allNowComplete) {
      bonusEarned = 5
    }

    const newPoints = {
      ...d.points,
      total_earned: d.points.total_earned + earned + bonusEarned,
      current_balance: d.points.current_balance + earned + bonusEarned,
    }

    const today = new Date().toISOString().split('T')[0]
    let newStreak = { ...d.streak }
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
      ...d,
      completions: [...d.completions, ...newCompletions],
      points: newPoints,
      streak: newStreak,
    })

    toast.success(bonusEarned ? `+${earned} pt${earned > 1 ? 's' : ''} +${bonusEarned} bonus` : `+${earned} pt${earned > 1 ? 's' : ''}`)
  }

  const handleTargetSubmit = (formData: { title: string }) => {
    const newTarget = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      title: formData.title,
      time_section: null,
      sort_order: data.targets.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    persist({ ...data, targets: [...data.targets, newTarget] })
    setShowTargetDialog(false)
    toast.success('Target created')
  }

  const handleTaskSubmit = (formData: { title: string; description: string; completion_type: CompletionType }) => {
    if (editingTask) {
      persist({
        ...data,
        tasks: data.tasks.map((t: any) =>
          t.id === editingTask.id
            ? { ...t, title: formData.title, description: formData.description, completion_type: formData.completion_type, updated_at: new Date().toISOString() }
            : t
        ),
      })
      setShowTaskDialog(false)
      setEditingTask(null)
      setSelectedParentId(null)
      toast.success('Task updated')
      return
    }

    const targetId = selectedParentId
      ? (data.tasks.find((t: any) => t.id === selectedParentId)?.target_id ?? selectedTargetId ?? null)
      : (selectedTargetId ?? data.targets[0]?.id ?? null)

    if (!targetId) {
      toast.error('No target available')
      return
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      target_id: targetId,
      parent_id: selectedParentId,
      title: formData.title,
      description: formData.description,
      completion_type: formData.completion_type,
      custom_schedule: null,
      sort_order: data.tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    persist({ ...data, tasks: [...data.tasks, newTask] })
    setShowTaskDialog(false)
    setSelectedParentId(null)
    toast.success('Task added')
  }

  const handleDeleteTask = (id: string) => {
    const toDelete = new Set<string>()
    const collectIds = (taskId: string) => {
      toDelete.add(taskId)
      data.tasks.filter((t: any) => t.parent_id === taskId).forEach((t: any) => collectIds(t.id))
    }
    collectIds(id)
    persist({
      ...data,
      tasks: data.tasks.filter((t: any) => !toDelete.has(t.id)),
    })
    toast.success('Deleted')
  }

  const handleDeleteTarget = (targetId: string) => {
    if (!confirm('Delete this target and all its tasks?')) return
    const taskIds = data.tasks.filter((t: any) => t.target_id === targetId).map((t: any) => t.id)
    persist({
      ...data,
      targets: data.targets.filter((t: any) => t.id !== targetId),
      tasks: data.tasks.filter((t: any) => t.target_id !== targetId),
      completions: data.completions.filter((c: any) => !taskIds.includes(c.task_id)),
    })
    toast.success('Target deleted')
  }

  const handleDisconnect = (id: string) => {
    persist({
      ...data,
      tasks: data.tasks.map((t: any) => t.id === id ? { ...t, parent_id: null } : t),
    })
  }

  const handleEditTask = (id: string) => {
    const task = data.tasks.find((t: any) => t.id === id)
    if (task) {
      setEditingTask(task)
      setShowTaskDialog(true)
    }
  }

  const handleBuilderAddChild = (targetId: string, parentId: string | null) => {
    setSelectedTargetId(targetId)
    setSelectedParentId(parentId)
    setShowTaskDialog(true)
  }

  const handleBuilderNodeTap = (nodeId: string) => {
    if (builderSubMode === 'connect') {
      if (!connectSource) {
        setConnectSource(nodeId)
      } else if (connectSource !== nodeId) {
        const srcTask = data.tasks.find((t: any) => t.id === connectSource)
        const tgtTask = data.tasks.find((t: any) => t.id === nodeId)
        if (!srcTask || !tgtTask) {
          toast.error('Invalid connection')
          setConnectSource(null)
          return
        }
        if (srcTask.target_id !== tgtTask.target_id) {
          toast.error('Cannot connect tasks from different targets')
          setConnectSource(null)
          return
        }
        let current = connectSource
        while (current) {
          const t = data.tasks.find((tk: any) => tk.id === current)
          if (!t || !t.parent_id) break
          if (t.parent_id === nodeId) {
            toast.error('Cannot create a loop')
            setConnectSource(null)
            return
          }
          current = t.parent_id
        }
        const updated = data.tasks.map((t: any) =>
          t.id === nodeId ? { ...t, parent_id: connectSource } : t
        )
        persist({ ...data, tasks: updated })
        setConnectSource(null)
        toast.success('Connected')
      } else {
        setConnectSource(null)
      }
    } else {
      setShowPopup(showPopup === nodeId ? null : nodeId)
    }
  }

  const handleSeedTemplates = () => {
    if (!confirm('Replace all data with template targets?')) return
    const templateTargets = ['Mind', 'Body', 'School', 'Environment', 'Discipline', 'Career', 'Digital'].map((title, i) => ({
      id: crypto.randomUUID(),
      user_id: demoUserId,
      title,
      time_section: ['morning', 'morning', 'afternoon', 'night', 'morning', 'afternoon', 'night'][i] as any,
      sort_order: i,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const templateTasks: Task[] = [
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[0].id, parent_id: null, title: 'Meditate', description: '10 min', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[0].id, parent_id: null, title: 'Read', description: '20 pages', completion_type: 'daily', custom_schedule: null, sort_order: 1, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[1].id, parent_id: null, title: 'Exercise', description: '30 min', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[1].id, parent_id: null, title: 'Stretch', description: '', completion_type: 'daily', custom_schedule: null, sort_order: 1, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[2].id, parent_id: null, title: 'Study', description: '', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[3].id, parent_id: null, title: 'Tidy room', description: '', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[4].id, parent_id: null, title: 'Wake up early', description: 'Before 7am', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[5].id, parent_id: null, title: 'Learn a skill', description: '30 min', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
      { id: crypto.randomUUID(), user_id: demoUserId, target_id: templateTargets[6].id, parent_id: null, title: 'Limit social media', description: '< 30 min', completion_type: 'daily', custom_schedule: null, sort_order: 0, created_at: '', updated_at: '' },
    ]

    persist({ targets: templateTargets, tasks: templateTasks, completions: [], points: data.points, streak: data.streak })
    toast.success('Templates loaded')
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

  const closeTaskDialog = () => {
    setShowTaskDialog(false)
    setEditingTask(null)
    setSelectedParentId(null)
  }

  const switchBuilderSubMode = (m: 'task' | 'connect') => {
    setBuilderSubMode(m)
    setConnectSource(null)
    setShowPopup(null)
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5 pt-3">
        <div>
          <h1 className="text-xl font-bold text-white/90">Unluck</h1>
          {mode === 'main' && (
            <p className="text-xs text-white/40 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StreakIndicator current={data.streak.current_streak} longest={data.streak.longest_streak} />
          <PointBadge balance={data.points.current_balance} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex gap-1 rounded-none border border-white/10 p-0.5">
          <button
            onClick={() => setMode('main')}
            className={`px-4 py-1.5 rounded-none text-xs font-medium transition-all ${
              mode === 'main' ? 'bg-white text-black' : 'text-white/60 hover:text-white/80'
            }`}
          >
            Main
          </button>
          <button
            onClick={() => setMode('builder')}
            className={`px-4 py-1.5 rounded-none text-xs font-medium transition-all ${
              mode === 'builder' ? 'bg-white text-black' : 'text-white/60 hover:text-white/80'
            }`}
          >
            Builder
          </button>
        </div>

        {mode === 'builder' && (
          <div className="glass rounded-none flex items-center gap-2 px-2 py-1.5">
            <div className="flex gap-1 rounded-none border border-white/10 p-0.5">
              {(['task', 'connect'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchBuilderSubMode(m)}
                  className={`px-3 py-1.5 rounded-none text-xs font-medium transition-all ${
                    builderSubMode === m
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {m === 'task' ? 'Task' : 'Connect'}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-white/10" />
            <button
              onClick={() => setShowTargetDialog(true)}
              className="px-3 py-1.5 rounded-none text-xs font-medium text-white/80 hover:text-white transition-all"
            >
              + Target
            </button>
            <button
              onClick={handleSeedTemplates}
              className="px-3 py-1.5 rounded-none text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
            >
              Load Templates
            </button>
          </div>
        )}
      </div>

      {targetsWithProgress.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">No targets yet</p>
          <p className="text-white/20 text-xs mt-2">
            {mode === 'main' ? 'Switch to Builder to create targets' : 'Create your first target to get started'}
          </p>
          {mode === 'builder' && (
            <Button size="sm" className="mt-4" onClick={() => setShowTargetDialog(true)}>Create your first target</Button>
          )}
        </div>
      ) : (
        <div>
          {SECTIONS.map(({ label, key }) => {
            const sectionTargets = targetsWithProgress.filter((t) => t.time_section === key)
            const isOver = dragOverSection === (key ?? '__unscheduled__')
            return (
              <div key={key ?? 'unscheduled'} className="mb-5">
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
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleTarget(target.id)}
                              className="flex-1 flex items-center justify-between p-3 text-left"
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
                            {mode === 'builder' && (
                              <button
                                onClick={() => handleDeleteTarget(target.id)}
                                className="px-3 py-3 text-white/30 hover:text-red-400 transition-colors text-sm leading-none"
                                title="Delete target"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          {expanded && (
                            <div className="px-3 pb-6 pt-2 overflow-x-auto">
                              {target.tasks.length > 0 ? (
                                mode === 'main' ? (
                                  <SkillTree tasks={target.tasks} onToggleComplete={handleToggleComplete} />
                                ) : (
                                  <TargetBuilderTree
                                    tasks={target.tasks}
                                    builderMode={builderSubMode}
                                    connectSource={connectSource}
                                    showPopup={showPopup}
                                    onNodeTap={handleBuilderNodeTap}
                                    onDisconnect={handleDisconnect}
                                    onAddChild={(nodeId) => handleBuilderAddChild(target.id, nodeId)}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                    onPopupClose={() => setShowPopup(null)}
                                  />
                                )
                              ) : (
                                <p className="text-white/40 text-xs text-center py-3">
                                  {mode === 'builder' ? (
                                    <button
                                      onClick={() => handleBuilderAddChild(target.id, null)}
                                      className="underline underline-offset-2 hover:text-white/60"
                                    >
                                      Add first task
                                    </button>
                                  ) : (
                                    'No tasks yet'
                                  )}
                                </p>
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
        <TargetForm onSubmit={handleTargetSubmit} onCancel={() => setShowTargetDialog(false)} />
      </Dialog>

      <Dialog open={showTaskDialog} onClose={closeTaskDialog} title={editingTask ? 'Edit Task' : 'New Task'}>
        <TaskForm
          onSubmit={handleTaskSubmit}
          onCancel={closeTaskDialog}
          initial={editingTask ? {
            title: editingTask.title,
            description: editingTask.description,
            completion_type: editingTask.completion_type,
          } : undefined}
        />
      </Dialog>
    </div>
  )
}
