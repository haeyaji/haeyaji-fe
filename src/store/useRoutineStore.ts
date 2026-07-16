import { create } from 'zustand'
import type { Routine } from '@/types'
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
  addRoutine: () =>
    set((s) => ({
      routines: [...s.routines, { id: 'nr' + Date.now(), title: '새 루틴', cat: 'code', time: '오전 09:00', days: [true, true, true, true, true, false, false], active: true }],
    })),
  batchApply: () => {
    // 활성 루틴을 이번 달 잔여일(오늘~말일)의 해당 요일에 실제 할 일로 등록 (중복은 스킵)
    const now = new Date()
    const y = now.getFullYear()
    const mo = now.getMonth()
    const lastDay = new Date(y, mo + 1, 0).getDate()
    const entries: { dateKey: string; title: string; time: string }[] = []
    get()
      .routines.filter((r) => r.active)
      .forEach((r) => {
        for (let d = now.getDate(); d <= lastDay; d++) {
          const date = new Date(y, mo, d)
          if (r.days[dowIndexOf(date)]) entries.push({ dateKey: fmtKey(date), title: r.title, time: r.time })
        }
      })
    const created = useTodoStore.getState().bulkAddRoutine(entries)
    useAppStore.getState().toast(created > 0 ? `${created}개 일정을 이번 달에 등록했어요` : '이미 모두 등록되어 있어요')
    useAppStore.getState().closeRoutine()
  },
}))
