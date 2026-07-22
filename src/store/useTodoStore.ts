import { create } from 'zustand'
import type { Category, Task, TaskGroup, TaskStatus, TasksByDate } from '@/types'
import { useAppStore } from './useAppStore'

/** 상태 유추: status 미지정 구데이터는 done 값으로 (be todo_status TODO/DONE) */
export const statusOf = (t: Task): TaskStatus => t.status ?? (t.done ? 'done' : 'todo')

/** 추천 → 할 일 추가 입력 (be todo.place_* / category 배관) */
export interface PlaceTaskInput {
  title: string
  placeName?: string | null
  placeUrl?: string | null
  lat?: number | null
  lng?: number | null
  category?: Category | null
}

/** 수동 추가 입력 (AddTaskModal) */
export interface SubmitTaskInput {
  dateKey: string
  title: string
  time?: string
  group: TaskGroup
  category?: Category | null
}

/** 리스트 드래그 정렬용 참조 */
export interface TaskRef {
  dateKey: string
  id: string
}

interface TodoState {
  tasksByDate: TasksByDate
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addPlaceTask: (input: PlaceTaskInput) => void
  submitTask: (input: SubmitTaskInput) => boolean
  setStatus: (dateKey: string, id: string, status: TaskStatus) => void
  updateTitle: (dateKey: string, id: string, title: string) => void
  removeTask: (dateKey: string, id: string) => void
  patchTask: (dateKey: string, id: string, patch: Partial<Task>) => void
  /** 특정 날짜에 할 일 생성 (약속 확정 → MEETING todo 등, 토스트 없음) */
  addTaskAt: (dateKey: string, title: string, status: TaskStatus) => void
  togglePin: (dateKey: string, id: string) => void
  /** 드래그 수동 정렬 — 전달된 순서대로 sortOrder 재부여 (be todo.sort_order) */
  reorderTasks: (ordered: TaskRef[]) => void
  /** 루틴 일괄 등록 — (date,title,time) 중복은 스킵하고 실제 생성 건수 반환 */
  bulkAddRoutine: (entries: { dateKey: string; title: string; time: string }[]) => number
}

// 특정 날짜의 특정 task를 변환하는 헬퍼
function mapTask(m: TasksByDate, dateKey: string, id: string, fn: (t: Task) => Task): TasksByDate {
  return { ...m, [dateKey]: (m[dateKey] ?? []).map((t) => (t.id === id ? fn(t) : t)) }
}

// 새 task의 정렬 순서 = 그 날 목록의 맨 뒤
const nextSort = (list: Task[]) => list.reduce((mx, t) => Math.max(mx, t.sortOrder ?? 0), 0) + 1

const sel = () => useAppStore.getState().selId

export const useTodoStore = create<TodoState>((set) => ({
  tasksByDate: {}, // TODO(be): GET /todos 로 채움 (현재는 빈 상태로 시작)
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
  addPlaceTask: (input) => {
    set((s) => {
      const selId = sel()
      const m = { ...s.tasksByDate }
      const list = m[selId] ?? []
      // ai:true=source AI, category/place=추천 원본 유지(be todo.place_*/category)
      m[selId] = [
        ...list,
        {
          id: 'a' + Date.now(),
          title: input.title,
          time: '',
          group: 'personal',
          done: false,
          ai: true,
          category: input.category ?? null,
          placeName: input.placeName ?? null,
          placeUrl: input.placeUrl ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          pinned: false,
          sortOrder: nextSort(list),
        },
      ]
      return { tasksByDate: m }
    })
    useAppStore.getState().toast(`'${input.title}' 일정에 추가됨`)
  },
  submitTask: ({ dateKey, title, time, group, category }) => {
    const t = title.trim()
    if (!t) return false
    set((s) => {
      const m = { ...s.tasksByDate }
      const list = m[dateKey] ?? []
      m[dateKey] = [...list, { id: 'n' + Date.now(), title: t, time: time || '', group, done: false, category: category ?? null, pinned: false, sortOrder: nextSort(list) }]
      return { tasksByDate: m }
    })
    useAppStore.getState().toast(`'${t}' 추가됨`)
    return true
  },
  setStatus: (dateKey, id, status) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, status, done: status === 'done' })) })),
  updateTitle: (dateKey, id, title) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, title })) })),
  removeTask: (dateKey, id) => {
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== id) } }))
    useAppStore.getState().toast('할 일을 삭제했어요')
  },
  patchTask: (dateKey, id, patch) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, ...patch })) })),
  addTaskAt: (dateKey, title, status) => {
    const t = title.trim()
    if (!t) return
    set((s) => {
      const list = s.tasksByDate[dateKey] ?? []
      return { tasksByDate: { ...s.tasksByDate, [dateKey]: [...list, { id: 'k' + Date.now(), title: t, group: 'personal' as const, done: status === 'done', status, pinned: false, sortOrder: nextSort(list) }] } }
    })
  },
  togglePin: (dateKey, id) =>
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, pinned: !t.pinned })) })),
  reorderTasks: (ordered) =>
    set((s) => {
      const idx = new Map(ordered.map((r, i) => [`${r.dateKey}:${r.id}`, i]))
      const m: TasksByDate = {}
      for (const dk of Object.keys(s.tasksByDate)) {
        m[dk] = (s.tasksByDate[dk] ?? []).map((t) => {
          const i = idx.get(`${dk}:${t.id}`)
          return i === undefined ? t : { ...t, sortOrder: i }
        })
      }
      return { tasksByDate: m }
    }),
  bulkAddRoutine: (entries) => {
    let created = 0
    set((s) => {
      const m = { ...s.tasksByDate }
      entries.forEach((e, i) => {
        const list = m[e.dateKey] ?? []
        // 이미 같은 루틴(제목·시간)이 그 날에 있으면 스킵 (ROUT-5 중복 미생성)
        if (list.some((t) => t.group === 'routine' && t.title === e.title && t.time === e.time)) return
        m[e.dateKey] = [...list, { id: `rt${Date.now()}_${i}`, title: e.title, time: e.time, group: 'routine', done: false, pinned: false, sortOrder: nextSort(list) }]
        created++
      })
      return { tasksByDate: m }
    })
    return created
  },
}))
