// be 할 일 CRUD (FR-1). be는 ApiResponse<T> envelope로 감싸 내려주므로 data.data 로 언랩한다.
// 인증(JWT) 전 단계라 member 스코프 없음 — 붙는 순간 be가 member_id 필터 추가(fe 계약 불변).
// 리뷰 대응: PATCH가 전체 덮어쓰기라 항상 "현재 전체 상태"를 실어 보낸다(toUpdateBody).
import type { Task, TaskStatus } from '@/types'
import { toApiTime, fromApiTime } from '@/lib/dates'
import { be } from './client'

/** be 공통 응답 envelope */
interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  timestamp: string
}

/** be TodoResponse (camelCase) */
interface TodoResponse {
  id: string
  title: string
  date: string // "yyyy-MM-dd"
  time: string | null // "HH:mm[:ss]"
  endedAt: string | null
  placeName: string | null
  placeUrl: string | null
  lat: number | null
  lng: number | null
  source: 'MANUAL' | 'AI' | 'ROUTINE' | 'MEETING' | string
  sourceRefId: string | null
  completed: boolean
  pinned: boolean
  sortOrder: number
}

interface TodoListResponse {
  tasks: TodoResponse[]
  total: number
  completed: number
}

/** be todo_source ↔ fe (group + ai). ROUTINE→routine, AI→ai:true, 그 외→personal */
export type TodoSource = 'MANUAL' | 'AI' | 'ROUTINE' | 'MEETING'
const sourceOf = (t: Pick<Task, 'group' | 'ai'>): TodoSource => (t.group === 'routine' ? 'ROUTINE' : t.ai ? 'AI' : 'MANUAL')

/** be TodoResponse → fe Task */
function toTask(r: TodoResponse): Task {
  const status: TaskStatus = r.completed ? 'done' : 'todo'
  return {
    id: r.id,
    title: r.title,
    time: fromApiTime(r.time),
    group: r.source === 'ROUTINE' ? 'routine' : 'personal',
    done: r.completed,
    status,
    placeName: r.placeName,
    placeUrl: r.placeUrl,
    lat: r.lat,
    lng: r.lng,
    pinned: r.pinned,
    sortOrder: r.sortOrder,
    ai: r.source === 'AI',
  }
}

/** fe Task → be TodoRequest (생성) */
function toCreateBody(dateKey: string, t: Task, source?: TodoSource) {
  return {
    title: t.title,
    date: dateKey,
    time: toApiTime(t.time),
    placeName: t.placeName ?? null,
    placeUrl: t.placeUrl ?? null,
    lat: t.lat ?? null,
    lng: t.lng ?? null,
    source: source ?? sourceOf(t),
    pinned: t.pinned ?? false,
    sortOrder: t.sortOrder ?? 0,
  }
}

/** fe Task → be TodoUpdateRequest (전체 payload — 부분수정도 전 필드 전송) */
function toUpdateBody(t: Task) {
  return {
    title: t.title,
    time: toApiTime(t.time),
    placeName: t.placeName ?? null,
    placeUrl: t.placeUrl ?? null,
    lat: t.lat ?? null,
    lng: t.lng ?? null,
    pinned: t.pinned ?? false,
    sortOrder: t.sortOrder ?? 0,
    completed: (t.status ?? (t.done ? 'done' : 'todo')) === 'done',
  }
}

/** GET /todos?date= — 그 날짜 할 일 목록 */
export async function fetchTodos(date: string): Promise<Task[]> {
  const { data } = await be.get<ApiResponse<TodoListResponse>>('/todos', { params: { date } })
  return (data.data.tasks ?? []).map(toTask)
}

/** POST /todos — 생성 (서버 발급 id 포함 Task 반환) */
export async function createTodo(dateKey: string, task: Task, source?: TodoSource): Promise<Task> {
  const { data } = await be.post<ApiResponse<TodoResponse>>('/todos', toCreateBody(dateKey, task, source))
  return toTask(data.data)
}

/** PATCH /todos/{id} — 전체 상태 전송 */
export async function updateTodo(task: Task): Promise<Task> {
  const { data } = await be.patch<ApiResponse<TodoResponse>>(`/todos/${task.id}`, toUpdateBody(task))
  return toTask(data.data)
}

/** DELETE /todos/{id} */
export async function deleteTodo(id: string): Promise<void> {
  await be.delete(`/todos/${id}`)
}
