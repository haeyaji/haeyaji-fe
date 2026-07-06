import { create } from 'zustand'
import type { Task, TaskGroup, TaskStatus, TasksByDate } from '@/types'
import { INITIAL_TASKS } from '@/lib/mockData'
import { useAppStore } from './useAppStore'

/** 칸반 상태 유추: status 미지정 구데이터는 done 값으로 */
export const statusOf = (t: Task): TaskStatus => t.status ?? (t.done ? 'done' : 'todo')

// 지라식 이슈 키 발급 — 목데이터 최대 번호 다음부터 (be 붙으면 서버 발급으로 대체)
let keySeq = Object.values(INITIAL_TASKS)
  .flat()
  .reduce((m, t) => Math.max(m, Number(t.key?.split('-')[1] ?? 0)), 0)
const nextKey = () => `HAE-${++keySeq}`

interface TodoState {
  tasksByDate: TasksByDate
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addPlaceTask: (name: string) => void
  submitTask: (title: string, time: string, group: TaskGroup) => boolean
  // ── 칸반 (dateKey 명시 버전) ──
  setStatus: (dateKey: string, id: string, status: TaskStatus) => void
  updateTitle: (dateKey: string, id: string, title: string) => void
  removeTask: (dateKey: string, id: string) => void
  addTaskAt: (dateKey: string, title: string, status: TaskStatus) => void
  patchTask: (dateKey: string, id: string, patch: Partial<Task>) => void
  addSubtask: (dateKey: string, id: string, title: string) => void
  toggleSubtask: (dateKey: string, id: string, subId: string) => void
  deleteSubtask: (dateKey: string, id: string, subId: string) => void
}

// 특정 날짜의 특정 task를 변환하는 헬퍼
function mapTask(m: TasksByDate, dateKey: string, id: string, fn: (t: Task) => Task): TasksByDate {
  return { ...m, [dateKey]: (m[dateKey] ?? []).map((t) => (t.id === id ? fn(t) : t)) }
}

const sel = () => useAppStore.getState().selId

export const useTodoStore = create<TodoState>((set) => ({
  tasksByDate: INITIAL_TASKS,
  toggleTask: (id) =>
    set((s) => {
      const selId = sel()
      const m = { ...s.tasksByDate }
      m[selId] = (m[selId] ?? []).map((t) => (t.id === id ? { ...t, done: !t.done, status: (!t.done ? 'done' : 'todo') as TaskStatus } : t))
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
      m[selId] = [...(m[selId] ?? []), { id: 'a' + Date.now(), key: nextKey(), title: name, time: '', group: 'personal', done: false, ai: true }]
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
      m[selId] = [...(m[selId] ?? []), { id: 'n' + Date.now(), key: nextKey(), title: t, time: time || '', group, done: false }]
      return { tasksByDate: m }
    })
    useAppStore.getState().toast(`'${t}' 추가됨`)
    return true
  },

  // ── 칸반 ──
  patchTask: (dateKey, id, patch) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, ...patch })) })),
  setStatus: (dateKey, id, status) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, status, done: status === 'done' })) })),
  updateTitle: (dateKey, id, title) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, title })) })),
  removeTask: (dateKey, id) => {
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== id) } }))
    useAppStore.getState().toast('할 일을 삭제했어요')
  },
  addTaskAt: (dateKey, title, status) => {
    const t = title.trim()
    if (!t) return
    set((s) => ({
      tasksByDate: {
        ...s.tasksByDate,
        [dateKey]: [...(s.tasksByDate[dateKey] ?? []), { id: 'k' + Date.now(), key: nextKey(), title: t, group: 'personal' as const, done: status === 'done', status, subtasks: [] }],
      },
    }))
  },
  addSubtask: (dateKey, id, title) => {
    const v = title.trim()
    if (!v) return
    set((s) => ({
      tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, subtasks: [...(t.subtasks ?? []), { id: 's' + Date.now(), title: v, done: false }] })),
    }))
  },
  toggleSubtask: (dateKey, id, subId) =>
    set((s) => ({
      tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, subtasks: (t.subtasks ?? []).map((x) => (x.id === subId ? { ...x, done: !x.done } : x)) })),
    })),
  deleteSubtask: (dateKey, id, subId) =>
    set((s) => ({
      tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, subtasks: (t.subtasks ?? []).filter((x) => x.id !== subId) })),
    })),
}))
