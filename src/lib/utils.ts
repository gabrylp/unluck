import { Task, TaskWithChildren } from './types'

export function buildTaskTree(tasks: Task[], completedTaskIds: Set<string>): TaskWithChildren[] {
  const sorted = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const map = new Map<string, TaskWithChildren>()
  const roots: TaskWithChildren[] = []

  for (const t of sorted) {
    map.set(t.id, { ...t, children: [], completed: completedTaskIds.has(t.id) })
  }

  for (const t of sorted) {
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
  const taskMap = new Map<string, Task>()
  for (const t of tasks) taskMap.set(t.id, t)

  const chain: string[] = [taskId]
  const visited = new Set<string>([taskId])
  let currentId: string | undefined = taskId
  while (currentId) {
    const task = taskMap.get(currentId)
    if (!task || !task.parent_id) break
    if (visited.has(task.parent_id)) return []
    visited.add(task.parent_id)
    chain.unshift(task.parent_id)
    currentId = task.parent_id
  }
  return chain
}

export function getAllDescendantIds(taskId: string, tasks: Task[]): string[] {
  const result: string[] = [taskId]
  const visited = new Set<string>([taskId])
  const stack = [taskId]
  while (stack.length > 0) {
    const id = stack.pop()!
    for (const t of tasks) {
      if (t.parent_id === id && !visited.has(t.id)) {
        visited.add(t.id)
        result.push(t.id)
        stack.push(t.id)
      }
    }
  }
  return result
}

export function formatTimeSection(section: string | null): string {
  if (!section) return ''
  return section.charAt(0).toUpperCase() + section.slice(1)
}
