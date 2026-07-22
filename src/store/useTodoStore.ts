import { create } from 'zustand'
import type { Category, Task, TaskGroup, TaskStatus, TasksByDate } from '@/types'
import { fetchTodos, createTodo, updateTodo, deleteTodo } from '@/api/todoApi'
import { useAppStore } from './useAppStore'
import { useLabelStore } from './useLabelStore'

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
  labelId?: string | null // 사용자 라벨 (생성 후 서버 id에 매핑)
}

/** 리스트 드래그 정렬용 참조 */
export interface TaskRef {
  dateKey: string
  id: string
}

interface TodoState {
  tasksByDate: TasksByDate
  /** GET /todos?date= 로 해당 날짜 로드 */
  loadDate: (dateKey: string) => Promise<void>
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addPlaceTask: (input: PlaceTaskInput) => void
  submitTask: (input: SubmitTaskInput) => boolean
  setStatus: (dateKey: string, id: string, status: TaskStatus) => void
  updateTitle: (dateKey: string, id: string, title: string) => void
  removeTask: (dateKey: string, id: string) => void
  patchTask: (dateKey: string, id: string, patch: Partial<Task>) => void
  addTaskAt: (dateKey: string, title: string, status: TaskStatus) => void
  togglePin: (dateKey: string, id: string) => void
  reorderTasks: (ordered: TaskRef[]) => void
  bulkAddRoutine: (entries: { dateKey: string; title: string; time: string }[]) => number
}

// 특정 날짜의 특정 task를 변환하는 헬퍼
function mapTask(m: TasksByDate, dateKey: string, id: string, fn: (t: Task) => Task): TasksByDate {
  return { ...m, [dateKey]: (m[dateKey] ?? []).map((t) => (t.id === id ? fn(t) : t)) }
}

// 새 task의 정렬 순서 = 그 날 목록의 맨 뒤
const nextSort = (list: Task[]) => list.reduce((mx, t) => Math.max(mx, t.sortOrder ?? 0), 0) + 1

const sel = () => useAppStore.getState().selId
const find = (dateKey: string, id: string) => (useTodoStore.getState().tasksByDate[dateKey] ?? []).find((t) => t.id === id)

// ── be 동기화 헬퍼 (낙관적 업데이트 이후 호출) ──
// 수정 실패 시 서버 기준으로 그 날짜 재동기화
function rollback(dateKey: string) {
  useAppStore.getState().toast('저장에 실패했어요')
  void useTodoStore.getState().loadDate(dateKey)
}
// 생성 성공: 임시 task를 서버 발급 task(실 UUID)로 교체
function reconcile(dateKey: string, tempId: string, saved: Task) {
  useTodoStore.setState((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).map((t) => (t.id === tempId ? saved : t)) } }))
}
// 생성 실패: 임시 task 제거 + 토스트
function failCreate(dateKey: string, tempId: string) {
  useTodoStore.setState((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== tempId) } }))
  useAppStore.getState().toast('저장에 실패했어요')
}
// 제목 입력 디바운스 PATCH (키 입력마다 저장 방지)
const titleTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const useTodoStore = create<TodoState>((set, get) => ({
  tasksByDate: {},
  loadDate: async (dateKey) => {
    try {
      const tasks = await fetchTodos(dateKey)
      set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: tasks } }))
    } catch {
      /* be 미기동/오류 — 기존 상태 유지 (조용히 무시) */
    }
  },
  toggleTask: (id) => {
    const dateKey = sel()
    const cur = find(dateKey, id)
    if (!cur) return
    const done = !cur.done
    const updated: Task = { ...cur, done, status: done ? 'done' : 'todo' }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    updateTodo(updated).catch(() => rollback(dateKey))
  },
  deleteTask: (id) => {
    const dateKey = sel()
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== id) } }))
    useAppStore.getState().toast('할 일을 삭제했어요')
    deleteTodo(id).catch(() => rollback(dateKey))
  },
  addPlaceTask: (input) => {
    const dateKey = sel()
    const list = get().tasksByDate[dateKey] ?? []
    const temp: Task = { id: 'tmp' + Date.now(), title: input.title, time: '', group: 'personal', done: false, ai: true, category: input.category ?? null, placeName: input.placeName ?? null, placeUrl: input.placeUrl ?? null, lat: input.lat ?? null, lng: input.lng ?? null, pinned: false, sortOrder: nextSort(list) }
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: [...(s.tasksByDate[dateKey] ?? []), temp] } }))
    useAppStore.getState().toast(`'${input.title}' 일정에 추가됨`)
    createTodo(dateKey, temp, 'AI').then((saved) => reconcile(dateKey, temp.id, saved)).catch(() => failCreate(dateKey, temp.id))
  },
  submitTask: ({ dateKey, title, time, group, category, labelId }) => {
    const t = title.trim()
    if (!t) return false
    const list = get().tasksByDate[dateKey] ?? []
    const temp: Task = { id: 'tmp' + Date.now(), title: t, time: time || '', group, done: false, category: category ?? null, pinned: false, sortOrder: nextSort(list) }
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: [...(s.tasksByDate[dateKey] ?? []), temp] } }))
    useAppStore.getState().toast(`'${t}' 추가됨`)
    createTodo(dateKey, temp)
      .then((saved) => {
        reconcile(dateKey, temp.id, saved)
        if (labelId) useLabelStore.getState().setTodoLabel(saved.id, labelId) // 서버 발급 id에 라벨 매핑
      })
      .catch(() => failCreate(dateKey, temp.id))
    return true
  },
  setStatus: (dateKey, id, status) => {
    const cur = find(dateKey, id)
    if (!cur) return
    const updated: Task = { ...cur, status, done: status === 'done' }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    updateTodo(updated).catch(() => rollback(dateKey))
  },
  updateTitle: (dateKey, id, title) => {
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, title })) }))
    const prev = titleTimers.get(id)
    if (prev) clearTimeout(prev)
    titleTimers.set(id, setTimeout(() => {
      const cur = find(dateKey, id)
      if (cur) updateTodo(cur).catch(() => rollback(dateKey))
    }, 600))
  },
  removeTask: (dateKey, id) => {
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== id) } }))
    useAppStore.getState().toast('할 일을 삭제했어요')
    deleteTodo(id).catch(() => rollback(dateKey))
  },
  patchTask: (dateKey, id, patch) => {
    const cur = find(dateKey, id)
    if (!cur) return
    const updated = { ...cur, ...patch }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    // participants(공유)는 별도 todo_participant 기능 — 이 todo CRUD로는 저장 안 함
    const keys = Object.keys(patch)
    if (keys.length === 1 && keys[0] === 'participants') return
    updateTodo(updated).catch(() => rollback(dateKey))
  },
  addTaskAt: (dateKey, title, status) => {
    const t = title.trim()
    if (!t) return
    const list = get().tasksByDate[dateKey] ?? []
    const temp: Task = { id: 'tmp' + Date.now(), title: t, group: 'personal', done: status === 'done', status, pinned: false, sortOrder: nextSort(list) }
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: [...(s.tasksByDate[dateKey] ?? []), temp] } }))
    createTodo(dateKey, temp, 'MEETING').then((saved) => reconcile(dateKey, temp.id, saved)).catch(() => failCreate(dateKey, temp.id))
  },
  togglePin: (dateKey, id) => {
    const cur = find(dateKey, id)
    if (!cur) return
    const updated: Task = { ...cur, pinned: !cur.pinned }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    updateTodo(updated).catch(() => rollback(dateKey))
  },
  reorderTasks: (ordered) => {
    const idx = new Map(ordered.map((r, i) => [`${r.dateKey}:${r.id}`, i]))
    const changed: Task[] = []
    set((s) => {
      const m: TasksByDate = {}
      for (const dk of Object.keys(s.tasksByDate)) {
        m[dk] = (s.tasksByDate[dk] ?? []).map((t) => {
          const i = idx.get(`${dk}:${t.id}`)
          if (i === undefined || i === (t.sortOrder ?? 0)) return t
          const nt = { ...t, sortOrder: i }
          changed.push(nt)
          return nt
        })
      }
      return { tasksByDate: m }
    })
    if (!changed.length) return
    Promise.all(changed.map((t) => updateTodo(t))).catch(() => {
      useAppStore.getState().toast('정렬 저장에 실패했어요')
      new Set(ordered.map((r) => r.dateKey)).forEach((d) => void get().loadDate(d))
    })
  },
  bulkAddRoutine: (entries) => {
    let created = 0
    const temps: { dateKey: string; task: Task }[] = []
    set((s) => {
      const m = { ...s.tasksByDate }
      entries.forEach((e, i) => {
        const list = m[e.dateKey] ?? []
        // 이미 같은 루틴(제목·시간)이 그 날에 있으면 스킵 (ROUT-5 중복 미생성)
        if (list.some((t) => t.group === 'routine' && t.title === e.title && t.time === e.time)) return
        const temp: Task = { id: `tmp${Date.now()}_${i}`, title: e.title, time: e.time, group: 'routine', done: false, pinned: false, sortOrder: nextSort(list) }
        m[e.dateKey] = [...list, temp]
        temps.push({ dateKey: e.dateKey, task: temp })
        created++
      })
      return { tasksByDate: m }
    })
    temps.forEach(({ dateKey, task }) => {
      createTodo(dateKey, task, 'ROUTINE').then((saved) => reconcile(dateKey, task.id, saved)).catch(() => failCreate(dateKey, task.id))
    })
    return created
  },
}))
