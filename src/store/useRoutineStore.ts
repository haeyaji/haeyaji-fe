// 루틴 = 반복 정의(휴대폰 알람식) — be /routines CRUD 연동. fe는 정의만 관리.
// 실제 todo는 be RoutineScheduler(매일 자정 KST)가 활성 루틴에서 자동 생성(중복 방지).
// /apply는 기간 수동 생성.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Routine } from '@/types'
import { fetchRoutines, createRoutineApi, updateRoutineApi, deleteRoutineApi, applyRoutines } from '@/api/routineApi'
import { useAppStore } from './useAppStore'

type PresetKind = 'every' | 'week' | 'weekend'

const PRESETS: Record<PresetKind, boolean[]> = {
  every: [true, true, true, true, true, true, true],
  week: [true, true, true, true, true, false, false],
  weekend: [false, false, false, false, false, true, true],
}

let tmpSeq = 0
const tmpId = () => `tmpr${Date.now()}_${++tmpSeq}`
const isTemp = (id: string) => id.startsWith('tmpr')
const toast = (m: string) => useAppStore.getState().toast(m)

export interface RoutineInput {
  title: string
  time: string
  days: boolean[]
  labelId?: string | null
}

interface RoutineState {
  routines: Routine[]
  loadRoutines: () => Promise<void>
  toggleActive: (id: string) => void // is_active — 완전 비활성화(스케줄러 생성 중단)
  toggleDay: (id: string, i: number) => void
  setPreset: (id: string, kind: PresetKind) => void
  deleteRoutine: (id: string) => void
  /** 루틴 정의 생성 — 생성된 루틴 반환(낙관적). todo 생성은 be 스케줄러 담당 */
  createRoutine: (input: RoutineInput) => Routine
  updateRoutine: (id: string, patch: Partial<Routine>) => void
  /** 기간 수동 적용 — 생성 개수 반환 */
  apply: (from: string, to: string) => Promise<number>
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => {
      // 공통: 낙관적 갱신 + be PATCH (실패 시 롤백)
      const patchRemote = (id: string, patch: Partial<Routine>) => {
        const prev = get().routines.find((r) => r.id === id)
        set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
        if (!isTemp(id)) updateRoutineApi(id, patch).catch(() => { if (prev) set((s) => ({ routines: s.routines.map((r) => (r.id === id ? prev : r)) })); toast('루틴 저장에 실패했어요') })
      }
      return {
        routines: [],
        loadRoutines: async () => {
          try {
            set({ routines: await fetchRoutines() })
          } catch {
            /* be 미가동 → 로컬 캐시 유지 */
          }
        },
        toggleActive: (id) => {
          const cur = get().routines.find((r) => r.id === id)
          if (cur) patchRemote(id, { active: !cur.active })
        },
        toggleDay: (id, i) => {
          const cur = get().routines.find((r) => r.id === id)
          if (!cur) return
          const days = cur.days.slice()
          days[i] = !days[i]
          patchRemote(id, { days })
        },
        setPreset: (id, kind) => patchRemote(id, { days: PRESETS[kind] }),
        deleteRoutine: (id) => {
          set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
          if (!isTemp(id)) deleteRoutineApi(id).catch(() => toast('루틴 삭제에 실패했어요'))
          toast('루틴을 삭제했어요')
        },
        createRoutine: ({ title, time, days, labelId = null }) => {
          const temp: Routine = { id: tmpId(), title: title.trim() || '새 루틴', time, days, active: true, labelId }
          set((s) => ({ routines: [...s.routines, temp] }))
          createRoutineApi({ title: temp.title, time, days, labelId })
            .then((saved) => set((s) => ({ routines: s.routines.map((r) => (r.id === temp.id ? saved : r)) })))
            .catch(() => { set((s) => ({ routines: s.routines.filter((r) => r.id !== temp.id) })); toast('루틴 생성에 실패했어요') })
          return temp
        },
        updateRoutine: (id, patch) => patchRemote(id, patch),
        apply: async (from, to) => {
          try {
            const n = await applyRoutines(from, to)
            toast(n > 0 ? `루틴 ${n}건을 일정에 추가했어요` : '추가할 루틴이 없어요')
            return n
          } catch {
            toast('루틴 적용에 실패했어요')
            return 0
          }
        },
      }
    },
    { name: 'haeyaji-routines' },
  ),
)
