// be의 할 일/루틴 CRUD. 현재는 stub.
import type { Task } from '@/types'
import { http } from './client'

export function fetchTasks(date: string): Promise<Task[]> {
  return http<Task[]>(`/todos?date=${encodeURIComponent(date)}`)
}

export function createTask(date: string, task: Omit<Task, 'id'>): Promise<Task> {
  return http<Task>('/todos', { method: 'POST', body: JSON.stringify({ date, ...task }) })
}

export function deleteTask(id: string): Promise<void> {
  return http<void>(`/todos/${id}`, { method: 'DELETE' })
}
