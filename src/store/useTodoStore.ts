import { create } from 'zustand'
import type { TaskGroup, TasksByDate } from '@/types'
import { INITIAL_TASKS } from '@/lib/mockData'
import { useAppStore } from './useAppStore'

interface TodoState {
  tasksByDate: TasksByDate
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addPlaceTask: (name: string) => void
  submitTask: (title: string, time: string, group: TaskGroup) => boolean
}

const sel = () => useAppStore.getState().selId

export const useTodoStore = create<TodoState>((set) => ({
  tasksByDate: INITIAL_TASKS,
  toggleTask: (id) =>
    set((s) => {
      const selId = sel()
      const m = { ...s.tasksByDate }
      m[selId] = (m[selId] ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      return { tasksByDate: m }
    }),
  deleteTask: (id) => {
    set((s) => {
      const selId = sel()
      const m = { ...s.tasksByDate }
      m[selId] = (m[selId] ?? []).filter((t) => t.id !== id)
      return { tasksByDate: m }
    })
    useAppStore.getState().toast('할 일을 삭제했어요')
  },
  addPlaceTask: (name) => {
    set((s) => {
      const selId = sel()
      const m = { ...s.tasksByDate }
      m[selId] = [...(m[selId] ?? []), { id: 'a' + Date.now(), title: name, time: '', group: 'personal', done: false, ai: true }]
      return { tasksByDate: m }
    })
    useAppStore.getState().toast(`'${name}' 일정에 추가됨`)
  },
  submitTask: (title, time, group) => {
    const t = title.trim()
    if (!t) return false
    set((s) => {
      const selId = sel()
      const m = { ...s.tasksByDate }
      m[selId] = [...(m[selId] ?? []), { id: 'n' + Date.now(), title: t, time: time || '', group, done: false }]
      return { tasksByDate: m }
    })
    useAppStore.getState().toast(`'${t}' 추가됨`)
    return true
  },
}))
