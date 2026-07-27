import { create } from 'zustand'
import type { Task, TaskGroup, TaskStatus, TasksByDate } from '@/types'
import { fetchTodos, createTodo, updateTodo, updateTodoDate, deleteTodo, toTask } from '@/api/todoApi'
import { listSharedTodos, leaveTodo } from '@/api/todoShareApi'
import { todayKey } from '@/lib/dates'
import { useAppStore } from './useAppStore'
import { useLabelStore } from './useLabelStore'

/** 상태 유추: status 미지정 구데이터는 done 값으로 (be todo_status TODO/DONE) */
export const statusOf = (t: Task): TaskStatus => t.status ?? (t.done ? 'done' : 'todo')

/** 추천 → 할 일 추가 입력 (be todo.place_* 배관) */
export interface PlaceTaskInput {
  title: string
  placeName?: string | null
  placeUrl?: string | null
  lat?: number | null
  lng?: number | null
  ai?: boolean // AI 추천(드로어)=true(기본). 지도에서 직접 추가=false → 수동(MANUAL)
}

/** 수동 추가 입력 (AddTaskModal) */
export interface SubmitTaskInput {
  dateKey: string
  title: string
  time?: string
  group: TaskGroup
  labelId?: string | null // 사용자 라벨 (생성 후 서버 id에 매핑)
}

/** 리스트 드래그 정렬용 참조 */
export interface TaskRef {
  dateKey: string
  id: string
}

interface TodoState {
  tasksByDate: TasksByDate
  sharedByDate: Record<string, Task[]> // GET /todos/shared 캐시(날짜별). loadDate에서 내 할일과 병합
  /** GET /todos?date= 로 해당 날짜 로드 (공유받은 일정도 병합) */
  loadDate: (dateKey: string) => Promise<void>
  /** GET /todos/shared 로 공유받은 일정 캐시 갱신 + 로드된 날짜 재병합 */
  loadShared: () => Promise<void>
  /** 공유 나가기(참여자 본인) */
  leaveShared: (id: string) => Promise<void>
  /** 다른 날짜로 이동 (be는 PATCH로 date 변경 불가 → 새로 만들고 기존 삭제). 소유·MANUAL/AI만. */
  moveTask: (dateKey: string, id: string, newDateKey: string) => Promise<void>
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addPlaceTask: (input: PlaceTaskInput) => void
  submitTask: (input: SubmitTaskInput) => boolean
  setStatus: (dateKey: string, id: string, status: TaskStatus) => void
  updateTitle: (dateKey: string, id: string, title: string) => void
  removeTask: (dateKey: string, id: string) => void
  patchTask: (dateKey: string, id: string, patch: Partial<Task>) => void
  setTaskLabel: (id: string, labelId: string | null) => void // todo.label_id be PATCH
  addTaskAt: (dateKey: string, title: string, status: TaskStatus) => void
  togglePin: (dateKey: string, id: string) => void
  reorderTasks: (ordered: TaskRef[]) => void
  bulkAddRoutine: (entries: { dateKey: string; title: string; time: string; labelId?: string | null }[]) => number
}

// 특정 날짜의 특정 task를 변환하는 헬퍼
function mapTask(m: TasksByDate, dateKey: string, id: string, fn: (t: Task) => Task): TasksByDate {
  return { ...m, [dateKey]: (m[dateKey] ?? []).map((t) => (t.id === id ? fn(t) : t)) }
}

// 새 task의 정렬 순서 = 그 날 목록의 맨 뒤
const nextSort = (list: Task[]) => list.reduce((mx, t) => Math.max(mx, t.sortOrder ?? 0), 0) + 1

const sel = () => useAppStore.getState().selId
const find = (dateKey: string, id: string) => (useTodoStore.getState().tasksByDate[dateKey] ?? []).find((t) => t.id === id)

// 낙관적 생성 임시 id — 아직 서버에 없으므로 write(PATCH/DELETE) 금지 대상
const isTemp = (id: string) => id.startsWith('tmp')
let tmpSeq = 0
const newTempId = () => `tmp${Date.now()}_${++tmpSeq}` // 동일 ms 충돌 방지

// ── be 동기화 헬퍼 (낙관적 업데이트 이후 호출) ──
// 수정 실패 시 서버 기준으로 그 날짜 재동기화
function rollback(dateKey: string) {
  useAppStore.getState().toast('저장에 실패했어요')
  void useTodoStore.getState().loadDate(dateKey)
}
// 생성 성공: 임시 task를 서버 발급 task(실 UUID)로 교체.
// in-flight 동안 로컬 편집(완료/핀/제목)이 있었으면 보존 후 서버 동기화, 라벨 매핑도 실 id로 이관.
function reconcile(dateKey: string, tempId: string, saved: Task) {
  let merged: Task = saved
  let diverged = false
  useTodoStore.setState((s) => ({
    tasksByDate: {
      ...s.tasksByDate,
      [dateKey]: (s.tasksByDate[dateKey] ?? []).map((t) => {
        if (t.id !== tempId) return t
        merged = { ...saved, done: t.done, status: t.status, pinned: t.pinned, title: t.title, time: t.time }
        diverged = t.done !== saved.done || t.pinned !== saved.pinned || t.title !== saved.title || t.time !== saved.time
        return merged
      }),
    },
  }))
  // 라벨: 임시 id에 붙은 매핑 → 실 id로 이관
  const lid = useLabelStore.getState().assignments[tempId]
  if (lid) {
    useLabelStore.getState().setTodoLabel(saved.id, lid)
    useLabelStore.getState().setTodoLabel(tempId, null)
  }
  // in-flight 편집이 서버와 다르면 실 id로 한 번 동기화
  if (diverged) updateTodo(merged).catch(() => rollback(dateKey))
}
// 생성 실패: 임시 task 제거 + 토스트 (be 에러 메시지 노출: 과거 날짜 등)
function failCreate(dateKey: string, tempId: string, err?: unknown) {
  useTodoStore.setState((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== tempId) } }))
  useAppStore.getState().toast(err instanceof Error && err.message ? err.message : '저장에 실패했어요')
}
// 제목 입력 디바운스 PATCH (키 입력마다 저장 방지)
const titleTimers = new Map<string, ReturnType<typeof setTimeout>>()

// 토글/핀/상태 광클 시 동시 PATCH가 be 동시성 오류(500)·CSRF 레이스를 유발 → per-id 디바운스로
// 최종 상태만 1번 전송(직렬화). 낙관적 UI는 즉시 반영되므로 체감은 그대로.
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>()
function queueWrite(dateKey: string, id: string) {
  if (isTemp(id)) return
  const prev = writeTimers.get(id)
  if (prev) clearTimeout(prev)
  writeTimers.set(id, setTimeout(() => {
    writeTimers.delete(id)
    const cur = find(dateKey, id)
    if (cur && !isTemp(cur.id)) updateTodo(cur).catch(() => rollback(dateKey))
  }, 250))
}

export const useTodoStore = create<TodoState>((set, get) => ({
  tasksByDate: {},
  sharedByDate: {},
  loadDate: async (dateKey) => {
    try {
      const own = await fetchTodos(dateKey)
      const ownIds = new Set(own.map((t) => t.id))
      const shared = (get().sharedByDate[dateKey] ?? []).filter((t) => !ownIds.has(t.id)) // 내 소유와 중복 제거
      const tasks = [...own, ...shared]
      set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: tasks } }))
      useLabelStore.getState().hydrateAssignments(tasks) // todo.labelId → 라벨 오버레이 동기화
    } catch {
      /* be 미기동/오류 — 기존 상태 유지 (조용히 무시) */
    }
  },
  loadShared: async () => {
    try {
      const list = await listSharedTodos()
      const byDate: Record<string, Task[]> = {}
      for (const r of list) (byDate[r.date] ??= []).push({ ...toTask(r), shared: true })
      set({ sharedByDate: byDate })
      // 이미 로드된 날짜 재병합 (공유 일정이 그 날짜 목록/캘린더에 반영되도록)
      const loaded = Object.keys(get().tasksByDate)
      await Promise.all(loaded.map((d) => get().loadDate(d)))
    } catch {
      /* be 미기동/오류 무시 */
    }
  },
  leaveShared: async (id) => {
    try {
      await leaveTodo(id)
      await get().loadShared()
      useAppStore.getState().toast('공유에서 나갔어요')
    } catch (e) {
      useAppStore.getState().toast((e as Error)?.message || '나가기에 실패했어요')
    }
  },
  moveTask: async (dateKey, id, newDateKey) => {
    if (dateKey === newDateKey) return
    const cur = find(dateKey, id)
    const toast = useAppStore.getState().toast
    if (!cur || isTemp(id)) return
    if (cur.shared) { toast('공유받은 할 일은 옮길 수 없어요'); return }
    if (cur.group === 'routine') { toast('루틴 할 일은 날짜 이동을 지원하지 않아요'); return }
    if (newDateKey < todayKey()) { toast('지난 날짜로는 옮길 수 없어요'); return }
    try {
      // be-61: PATCH date 지원 → 같은 행을 옮김(id·공유·라벨 보존). be가 과거·중복키 검증.
      await updateTodoDate(id, newDateKey)
      await Promise.all([get().loadDate(dateKey), get().loadDate(newDateKey)])
      toast('날짜를 옮겼어요')
    } catch (e) {
      toast((e as Error)?.message || '날짜 이동에 실패했어요')
    }
  },
  toggleTask: (id) => {
    const dateKey = sel()
    const cur = find(dateKey, id)
    if (!cur) return
    const done = !cur.done
    const updated: Task = { ...cur, done, status: done ? 'done' : 'todo' }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    queueWrite(dateKey, id)
  },
  deleteTask: (id) => {
    const dateKey = sel()
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== id) } }))
    useAppStore.getState().toast('할 일을 삭제했어요')
    useLabelStore.getState().setTodoLabel(id, null) // 라벨 매핑 정리(orphan 방지)
    if (!isTemp(id)) deleteTodo(id).catch(() => rollback(dateKey))
  },
  addPlaceTask: (input) => {
    const dateKey = sel()
    const list = get().tasksByDate[dateKey] ?? []
    const isAi = input.ai !== false // 기본 AI, 지도 직접 추가는 false
    const temp: Task = { id: newTempId(), title: input.title, time: '', group: 'personal', done: false, ai: isAi, placeName: input.placeName ?? null, placeUrl: input.placeUrl ?? null, lat: input.lat ?? null, lng: input.lng ?? null, pinned: false, sortOrder: nextSort(list) }
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: [...(s.tasksByDate[dateKey] ?? []), temp] } }))
    useAppStore.getState().toast(`'${input.title}' 일정에 추가됨`)
    createTodo(dateKey, temp, isAi ? 'AI' : 'MANUAL').then((saved) => reconcile(dateKey, temp.id, saved)).catch((err) => failCreate(dateKey, temp.id, err))
  },
  submitTask: ({ dateKey, title, time, group, labelId }) => {
    const t = title.trim()
    if (!t) return false
    const list = get().tasksByDate[dateKey] ?? []
    const temp: Task = { id: newTempId(), title: t, time: time || '', group, done: false, pinned: false, sortOrder: nextSort(list) }
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: [...(s.tasksByDate[dateKey] ?? []), temp] } }))
    useAppStore.getState().toast(`'${t}' 추가됨`)
    createTodo(dateKey, temp)
      .then((saved) => {
        reconcile(dateKey, temp.id, saved)
        if (labelId) useLabelStore.getState().setTodoLabel(saved.id, labelId) // 서버 발급 id에 라벨 매핑
      })
      .catch((err) => failCreate(dateKey, temp.id, err))
    return true
  },
  setStatus: (dateKey, id, status) => {
    const cur = find(dateKey, id)
    if (!cur) return
    const updated: Task = { ...cur, status, done: status === 'done' }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    queueWrite(dateKey, id)
  },
  updateTitle: (dateKey, id, title) => {
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, (t) => ({ ...t, title })) }))
    const prev = titleTimers.get(id)
    if (prev) clearTimeout(prev)
    titleTimers.set(id, setTimeout(() => {
      const cur = find(dateKey, id)
      if (cur && !isTemp(id)) updateTodo(cur).catch(() => rollback(dateKey))
    }, 600))
  },
  removeTask: (dateKey, id) => {
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: (s.tasksByDate[dateKey] ?? []).filter((t) => t.id !== id) } }))
    useAppStore.getState().toast('할 일을 삭제했어요')
    useLabelStore.getState().setTodoLabel(id, null) // 라벨 매핑 정리(orphan 방지)
    if (!isTemp(id)) deleteTodo(id).catch(() => rollback(dateKey))
  },
  patchTask: (dateKey, id, patch) => {
    const cur = find(dateKey, id)
    if (!cur) return
    const updated = { ...cur, ...patch }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    // participants(공유)는 별도 todo_participant 기능 — 이 todo CRUD로는 저장 안 함
    const keys = Object.keys(patch)
    if (keys.length === 1 && keys[0] === 'participants') return
    queueWrite(dateKey, id)
  },
  setTaskLabel: (id, labelId) => {
    // 라벨 할당은 날짜 무관 — 전체 날짜에서 해당 todo 찾아 labelId 갱신 + be PATCH
    let target: { dateKey: string; task: Task } | null = null
    const byDate = get().tasksByDate
    for (const [dk, arr] of Object.entries(byDate)) {
      const t = arr.find((x) => x.id === id)
      if (t) { target = { dateKey: dk, task: t }; break }
    }
    if (!target) return
    const updated = { ...target.task, labelId }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, target!.dateKey, id, () => updated) }))
    if (!isTemp(id)) updateTodo(updated).catch(() => rollback(target!.dateKey))
  },
  addTaskAt: (dateKey, title, status) => {
    const t = title.trim()
    if (!t) return
    const list = get().tasksByDate[dateKey] ?? []
    const temp: Task = { id: newTempId(), title: t, group: 'personal', done: status === 'done', status, pinned: false, sortOrder: nextSort(list) }
    set((s) => ({ tasksByDate: { ...s.tasksByDate, [dateKey]: [...(s.tasksByDate[dateKey] ?? []), temp] } }))
    createTodo(dateKey, temp, 'MEETING').then((saved) => reconcile(dateKey, temp.id, saved)).catch((err) => failCreate(dateKey, temp.id, err))
  },
  togglePin: (dateKey, id) => {
    const cur = find(dateKey, id)
    if (!cur) return
    const updated: Task = { ...cur, pinned: !cur.pinned }
    set((s) => ({ tasksByDate: mapTask(s.tasksByDate, dateKey, id, () => updated) }))
    queueWrite(dateKey, id)
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
    Promise.all(changed.filter((t) => !isTemp(t.id)).map((t) => updateTodo(t))).catch(() => {
      useAppStore.getState().toast('정렬 저장에 실패했어요')
      new Set(ordered.map((r) => r.dateKey)).forEach((d) => void get().loadDate(d))
    })
  },
  bulkAddRoutine: (entries) => {
    let created = 0
    const temps: { dateKey: string; task: Task; labelId?: string | null }[] = []
    set((s) => {
      const m = { ...s.tasksByDate }
      entries.forEach((e, i) => {
        const list = m[e.dateKey] ?? []
        // 이미 같은 루틴(제목·시간)이 그 날에 있으면 스킵 (ROUT-5 중복 미생성)
        if (list.some((t) => t.group === 'routine' && t.title === e.title && t.time === e.time)) return
        const temp: Task = { id: `tmp${Date.now()}_${i}`, title: e.title, time: e.time, group: 'routine', done: false, pinned: false, sortOrder: nextSort(list) }
        m[e.dateKey] = [...list, temp]
        temps.push({ dateKey: e.dateKey, task: temp, labelId: e.labelId })
        created++
      })
      return { tasksByDate: m }
    })
    temps.forEach(({ dateKey, task, labelId }) => {
      createTodo(dateKey, task, 'ROUTINE')
        .then((saved) => {
          reconcile(dateKey, task.id, saved)
          if (labelId) useLabelStore.getState().setTodoLabel(saved.id, labelId) // 루틴 라벨 상속
        })
        .catch((err) => failCreate(dateKey, task.id, err))
    })
    return created
  },
}))
