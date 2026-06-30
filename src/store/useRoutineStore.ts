import { create } from 'zustand'
import type { Routine } from '@/types'
import { INITIAL_ROUTINES } from '@/lib/mockData'
import { dowIndex } from '@/lib/weather'
import { useAppStore } from './useAppStore'

type PresetKind = 'every' | 'week' | 'weekend'

const PRESETS: Record<PresetKind, boolean[]> = {
  every: [true, true, true, true, true, true, true],
  week: [true, true, true, true, true, false, false],
  weekend: [false, false, false, false, false, true, true],
}

interface RoutineState {
  routines: Routine[]
  toggleActive: (id: string) => void
  toggleDay: (id: string, i: number) => void
  setPreset: (id: string, kind: PresetKind) => void
  deleteRoutine: (id: string) => void
  addRoutine: () => void
  batchApply: () => void
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: INITIAL_ROUTINES,
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
  addRoutine: () =>
    set((s) => ({
      routines: [...s.routines, { id: 'nr' + Date.now(), title: '새 루틴', cat: 'code', time: '오전 09:00', days: [true, true, true, true, true, false, false], active: true }],
    })),
  batchApply: () => {
    // 활성 루틴이 5월 잔여일(24~31)에 등록되는 횟수 집계
    let cnt = 0
    get()
      .routines.filter((r) => r.active)
      .forEach((r) => {
        for (let d = 24; d <= 31; d++) {
          if (r.days[dowIndex(d)]) cnt++
        }
      })
    useAppStore.getState().toast(`${cnt}개 일정을 이번 달에 등록했어요`)
    useAppStore.getState().closeRoutine()
  },
}))
