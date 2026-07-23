import { create } from 'zustand'
import type { Routine, RoutineCat } from '@/types'
import { dowIndexOf } from '@/lib/weather'
import { fmtKey } from '@/lib/dates'
import { useAppStore } from './useAppStore'
import { useTodoStore } from './useTodoStore'

type PresetKind = 'every' | 'week' | 'weekend'

const PRESETS: Record<PresetKind, boolean[]> = {
  every: [true, true, true, true, true, true, true],
  week: [true, true, true, true, true, false, false],
  weekend: [false, false, false, false, false, true, true],
}

export interface RoutineInput {
  title: string
  time: string
  days: boolean[]
  cat?: RoutineCat
}

interface RoutineState {
  routines: Routine[]
  toggleActive: (id: string) => void
  toggleDay: (id: string, i: number) => void
  setPreset: (id: string, kind: PresetKind) => void
  deleteRoutine: (id: string) => void
  /** 루틴 생성 (모달·아코디언) — 생성된 루틴 반환 */
  createRoutine: (input: RoutineInput) => Routine
  updateRoutine: (id: string, patch: Partial<Routine>) => void
  /** 루틴 1개를 이번 달 잔여일에 할 일로 적용 — 생성 건수 반환 */
  applyRoutine: (r: Routine) => number
  batchApply: () => void
}

// 활성/지정 루틴들을 이번 달 잔여일(오늘~말일)의 해당 요일 항목으로 펼침
function monthEntries(routines: Routine[]): { dateKey: string; title: string; time: string }[] {
  const now = new Date()
  const y = now.getFullYear()
  const mo = now.getMonth()
  const lastDay = new Date(y, mo + 1, 0).getDate()
  const entries: { dateKey: string; title: string; time: string }[] = []
  routines.forEach((r) => {
    for (let d = now.getDate(); d <= lastDay; d++) {
      const date = new Date(y, mo, d)
      if (r.days[dowIndexOf(date)]) entries.push({ dateKey: fmtKey(date), title: r.title, time: r.time })
    }
  })
  return entries
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [], // TODO(be): GET /routines 로 채움 (현재는 빈 상태로 시작)
  toggleActive: (id) => set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, active: !r.active } : r)) })),
  toggleDay: (id, i) =>
    set((s) => ({
      routines: s.routines.map((r) => {
        if (r.id !== id) return r
        const days = r.days.slice()
        days[i] = !days[i]
        return { ...r, days }
      }),
    })),
  setPreset: (id, kind) => set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, days: PRESETS[kind] } : r)) })),
  deleteRoutine: (id) => {
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
    useAppStore.getState().toast('루틴을 삭제했어요')
  },
  createRoutine: ({ title, time, days, cat = 'code' }) => {
    const routine: Routine = { id: 'nr' + Date.now(), title: title.trim() || '새 루틴', cat, time, days, active: true }
    set((s) => ({ routines: [...s.routines, routine] }))
    return routine
  },
  updateRoutine: (id, patch) => set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  applyRoutine: (r) => useTodoStore.getState().bulkAddRoutine(monthEntries([r])),
  batchApply: () => {
    // 활성 루틴을 이번 달 잔여일의 해당 요일에 실제 할 일로 등록 (중복은 스킵)
    const created = useTodoStore.getState().bulkAddRoutine(monthEntries(get().routines.filter((r) => r.active)))
    useAppStore.getState().toast(created > 0 ? `${created}개 일정을 이번 달에 등록했어요` : '이미 모두 등록되어 있어요')
    useAppStore.getState().closeRoutine()
  },
}))
