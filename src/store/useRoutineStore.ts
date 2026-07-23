// 루틴 = 반복 정의(휴대폰 알람식). fe는 정의만 관리하고, 실제 todo는 be 스케줄러가 만든다.
// be RoutineScheduler: 매일 자정(cron 0 0 0 * * *, KST)에 활성 루틴을 그날 todo로 자동 생성(중복 방지).
// TODO(be): GET/POST/PATCH/DELETE /routines + POST /routines/apply. 현재는 로컬 persist.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Routine } from '@/types'
import { useAppStore } from './useAppStore'

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
  labelId?: string | null
}

interface RoutineState {
  routines: Routine[]
  toggleActive: (id: string) => void // is_active — 완전 비활성화(스케줄러 생성 중단)
  toggleDay: (id: string, i: number) => void
  setPreset: (id: string, kind: PresetKind) => void
  deleteRoutine: (id: string) => void
  /** 루틴 정의 생성 (모달·아코디언) — 생성된 루틴 반환. todo 생성은 be 스케줄러가 담당 */
  createRoutine: (input: RoutineInput) => Routine
  updateRoutine: (id: string, patch: Partial<Routine>) => void
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set) => ({
      routines: [],
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
      createRoutine: ({ title, time, days, labelId = null }) => {
        const routine: Routine = { id: 'nr' + Date.now(), title: title.trim() || '새 루틴', time, days, active: true, labelId }
        set((s) => ({ routines: [...s.routines, routine] }))
        return routine
      },
      updateRoutine: (id, patch) => set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
    }),
    { name: 'haeyaji-routines' },
  ),
)
