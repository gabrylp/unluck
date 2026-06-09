import { Task, TaskWithChildren } from './types'

export function buildTaskTree(tasks: Task[], completedTaskIds: Set<string>): TaskWithChildren[] {
  const map = new Map<string, TaskWithChildren>()
  const roots: TaskWithChildren[] = []

  for (const t of tasks) {
    map.set(t.id, { ...t, children: [], completed: completedTaskIds.has(t.id) })
  }

  for (const t of tasks) {
    const node = map.get(t.id)!
    if (t.parent_id && map.has(t.parent_id)) {
      map.get(t.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function getParentChain(taskId: string, tasks: Task[]): string[] {
  const chain: string[] = [taskId]
  let currentId: string | undefined = taskId
  while (currentId) {
    const task = tasks.find((t) => t.id === currentId)
    if (!task || !task.parent_id) break
    chain.unshift(task.parent_id)
    currentId = task.parent_id
  }
  return chain
}

export function getDeepTaskCount(tasks: Task[]): number {
  const map = new Map<string, Task>()
  for (const t of tasks) map.set(t.id, t)
  return tasks.filter((t) => {
    let parent = t.parent_id ? map.get(t.parent_id) : null
    while (parent) {
      if (parent.parent_id === null) return true
      parent = parent.parent_id ? map.get(parent.parent_id) : null
    }
    return t.parent_id === null
  }).length
}

export function formatTimeSection(section: string | null): string {
  if (!section) return ''
  return section.charAt(0).toUpperCase() + section.slice(1)
}
