// be의 할 일/루틴 CRUD. 현재는 stub (be 구현 시 연동).
import type { Task } from '@/types'
import { be } from './client'

export async function fetchTasks(date: string): Promise<Task[]> {
  const { data } = await be.get<Task[]>('/todos', { params: { date } })
  return data
}

export async function createTask(date: string, task: Omit<Task, 'id'>): Promise<Task> {
  const { data } = await be.post<Task>('/todos', { date, ...task })
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await be.delete(`/todos/${id}`)
}
