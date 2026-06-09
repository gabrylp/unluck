'use client'

import { useState, useEffect, useCallback } from 'react'
import { BuilderCanvas } from '@/components/builder/builder-canvas'
import { Dialog } from '@/components/ui/dialog'
import { TargetForm } from '@/components/targets/target-form'
import { TaskForm } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import { Task, CompletionType } from '@/lib/types'
import { demoTargets, demoTasks, demoCompletions, demoPoints, demoStreak, demoUserId } from '@/lib/demo-data'
import { toast } from 'sonner'

const STORAGE_KEY = 'unluck-demo'

function loadData() {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  return null
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function BuilderPage() {
  const [data, setData] = useState<any>(null)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadData()
    setData(saved || { targets: demoTargets, tasks: demoTasks, completions: demoCompletions, points: demoPoints, streak: demoStreak })
  }, [])

  const persist = useCallback((newData: any) => {
    setData(newData)
    saveData(newData)
  }, [])

  const handleAddTask = (parentId: string | null) => {
    if (!parentId) {
      setSelectedParentId(null)
      setShowTargetDialog(true)
    } else {
      const parent = data.tasks.find((t: any) => t.id === parentId)
      const targetId = parent ? parent.target_id : null
      setSelectedParentId(parentId)
      setShowTaskDialog(true)
    }
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
    const targetId = selectedParentId
      ? (data.tasks.find((t: any) => t.id === selectedParentId)?.target_id ?? selectedParentId)
      : (data.targets[0]?.id ?? '')

    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: demoUserId,
      target_id: targetId as string,
      parent_id: null,
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

  const handleSeedTemplates = () => {
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

    persist({ targets: templateTargets, tasks: templateTasks, completions: [], points: demoPoints, streak: demoStreak })
    toast.success('Templates loaded')
  }

  if (!data) return null

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-5 pt-3">
        <h1 className="text-xl font-bold text-white/90">Builder</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleSeedTemplates}>Load Templates</Button>
          <Button size="sm" onClick={() => setShowTargetDialog(true)}>+ Target</Button>
        </div>
      </div>

          <BuilderCanvas
        targets={data.targets}
        tasks={data.tasks}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
        onDisconnect={handleDisconnect}
        onConnect={(sourceId, targetId) => {
          if (sourceId === targetId) {
            toast.error('Cannot connect a node to itself')
            return
          }
          const srcTask = data.tasks.find((t: any) => t.id === sourceId)
          const tgtTask = data.tasks.find((t: any) => t.id === targetId)
          if (!srcTask || !tgtTask) {
            toast.error('Invalid connection')
            return
          }
          if (srcTask.target_id !== tgtTask.target_id) {
            toast.error('Cannot connect tasks from different targets')
            return
          }
          let current = sourceId
          while (current) {
            const t = data.tasks.find((tk: any) => tk.id === current)
            if (!t || !t.parent_id) break
            if (t.parent_id === targetId) {
              toast.error('Cannot create a loop')
              return
            }
            current = t.parent_id
          }
          const updated = data.tasks.map((t: any) =>
            t.id === targetId ? { ...t, parent_id: sourceId } : t
          )
          persist({ ...data, tasks: updated })
          toast.success('Connected')
        }}
      />

      <Dialog open={showTargetDialog} onClose={() => setShowTargetDialog(false)} title="New Target">
        <TargetForm onSubmit={handleTargetSubmit} onCancel={() => setShowTargetDialog(false)} />
      </Dialog>

      <Dialog open={showTaskDialog} onClose={() => {
        setShowTaskDialog(false)
        setEditingTask(null)
        setSelectedParentId(null)
      }} title={editingTask ? 'Edit Task' : 'New Task'}>
        <TaskForm
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setShowTaskDialog(false)
            setEditingTask(null)
            setSelectedParentId(null)
          }}
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
