// be 루틴 CRUD (/routines). ApiResponse<T> → data.data. 반복요일은 DayOfWeek[] (월~일 boolean[7] ↔ 코드).
// 실제 todo는 be RoutineScheduler(매일 자정)가 활성 루틴에서 자동 생성. /apply는 기간 수동 생성.
import { be } from './client'
import { toApiTime, fromApiTime } from '@/lib/dates'
import type { Routine } from '@/types'

interface Env<T> { data: T }

// FE days index(0=월 … 6=일, DOW=['월','화','수','목','금','토','일']) ↔ be DayOfWeek 이름
const DOW_CODES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const
const daysToApi = (days: boolean[]): string[] => DOW_CODES.filter((_, i) => days[i])
const daysFromApi = (codes: string[] | null | undefined): boolean[] => DOW_CODES.map((c) => (codes ?? []).includes(c))

interface RoutineDto {
  id: string
  title: string
  startTime: string | null // LocalTime "HH:mm:ss"
  labelId: string | null
  active: boolean
  days: string[] // DayOfWeek[]
  preset: string // DAILY|WEEKDAY|WEEKEND|CUSTOM (파생, 미사용)
}

const toRoutine = (r: RoutineDto): Routine => ({ id: r.id, title: r.title, time: fromApiTime(r.startTime), days: daysFromApi(r.days), active: r.active, labelId: r.labelId })

export interface RoutineApiInput { title: string; time: string; days: boolean[]; labelId?: string | null }

export async function fetchRoutines(): Promise<Routine[]> {
  const res = await be.get<Env<RoutineDto[]>>('/routines')
  return (res.data.data ?? []).map(toRoutine)
}

export async function createRoutineApi(input: RoutineApiInput): Promise<Routine> {
  const res = await be.post<Env<RoutineDto>>('/routines', {
    title: input.title,
    startTime: toApiTime(input.time),
    days: daysToApi(input.days),
    labelId: input.labelId ?? null,
  })
  return toRoutine(res.data.data)
}

export async function updateRoutineApi(id: string, patch: Partial<Routine>): Promise<Routine> {
  const body: Record<string, unknown> = {}
  if (patch.title !== undefined) body.title = patch.title
  if (patch.time !== undefined) body.startTime = toApiTime(patch.time)
  if (patch.days !== undefined) body.days = daysToApi(patch.days)
  if (patch.active !== undefined) body.active = patch.active
  if (patch.labelId !== undefined) body.labelId = patch.labelId
  const res = await be.patch<Env<RoutineDto>>(`/routines/${id}`, body)
  return toRoutine(res.data.data)
}

export async function deleteRoutineApi(id: string): Promise<void> {
  await be.delete(`/routines/${id}`)
}

/** POST /routines/apply — 기간(from~to, inclusive) 활성 루틴을 todo로 수동 생성. 생성 개수 반환. */
export async function applyRoutines(from: string, to: string): Promise<number> {
  const res = await be.post<Env<{ created: number }>>('/routines/apply', { from, to })
  return res.data.data?.created ?? 0
}
