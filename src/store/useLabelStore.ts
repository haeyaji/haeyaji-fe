// 사용자 커스텀 분류 라벨 — be /labels CRUD 연동. (category 10종·AI와 별개, 사용자 자유 분류)
// 라벨 정의는 be. todo↔label 연결은 todo.label_id(useTodoStore.setTaskLabel로 be PATCH).
// assignments(todoId→labelId)는 즉시 UI용 오버레이 + 로드 시 todo.labelId에서 동기화.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Label, Task } from '@/types'
import { fetchLabels, createLabel, updateLabel, deleteLabel } from '@/api/labelApi'
import { useAppStore } from './useAppStore'
import { useTodoStore } from './useTodoStore'

// 라벨 색 팔레트 (color 미지정 시 자동배정)
export const LABEL_COLORS = ['#15795A', '#3F82C2', '#8A5AA8', '#C2702A', '#B05B52', '#D6544A', '#2E9E8F', '#5B6472']

let tmpSeq = 0
const tmpId = () => `tmplb${Date.now()}_${++tmpSeq}`
const isTemp = (id: string) => id.startsWith('tmplb')
const toast = (m: string) => useAppStore.getState().toast(m)

interface LabelState {
  labels: Label[]
  assignments: Record<string, string> // todoId → labelId (UI 오버레이)
  loadLabels: () => Promise<void>
  addLabel: (name: string, color?: string) => Label | null
  renameLabel: (id: string, name: string) => void
  setColor: (id: string, color: string) => void
  removeLabel: (id: string) => void
  setTodoLabel: (todoId: string, labelId: string | null) => void
  labelOf: (todoId: string) => Label | undefined
  hydrateAssignments: (tasks: Task[]) => void // 로드된 todo.labelId로 오버레이 동기화
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      labels: [],
      assignments: {},

      loadLabels: async () => {
        try {
          set({ labels: await fetchLabels() })
        } catch {
          /* be 미가동 → 로컬 캐시 유지 */
        }
      },

      addLabel: (name, color) => {
        const nm = name.trim()
        if (!nm) return null
        const dup = get().labels.find((l) => l.name === nm)
        if (dup) return dup // uk_label_member_name — 같은 이름 재사용
        const col = color ?? LABEL_COLORS[get().labels.length % LABEL_COLORS.length]
        const temp: Label = { id: tmpId(), name: nm, color: col }
        set((s) => ({ labels: [...s.labels, temp] }))
        createLabel(nm, col)
          .then((saved) => {
            set((s) => ({
              labels: s.labels.map((l) => (l.id === temp.id ? saved : l)),
              assignments: Object.fromEntries(Object.entries(s.assignments).map(([tid, lid]) => [tid, lid === temp.id ? saved.id : lid])),
            }))
            // temp로 이미 붙은 todo가 있으면 서버 label_id로 재PATCH
            for (const [tid, lid] of Object.entries(get().assignments)) if (lid === saved.id) useTodoStore.getState().setTaskLabel(tid, saved.id)
          })
          .catch(() => {
            set((s) => ({ labels: s.labels.filter((l) => l.id !== temp.id) }))
            toast('분류 저장에 실패했어요')
          })
        return temp
      },

      renameLabel: (id, name) => {
        const nm = name.trim()
        if (!nm) return
        const prev = get().labels.find((l) => l.id === id)
        set((s) => ({ labels: s.labels.map((l) => (l.id === id ? { ...l, name: nm } : l)) }))
        if (!isTemp(id)) updateLabel(id, { name: nm }).catch(() => { if (prev) set((s) => ({ labels: s.labels.map((l) => (l.id === id ? prev : l)) })); toast('이름 변경에 실패했어요') })
      },

      setColor: (id, color) => {
        const prev = get().labels.find((l) => l.id === id)
        set((s) => ({ labels: s.labels.map((l) => (l.id === id ? { ...l, color } : l)) }))
        if (!isTemp(id)) updateLabel(id, { color }).catch(() => { if (prev) set((s) => ({ labels: s.labels.map((l) => (l.id === id ? prev : l)) })); toast('색 변경에 실패했어요') })
      },

      removeLabel: (id) => {
        set((s) => {
          const assignments = { ...s.assignments }
          for (const [tid, lid] of Object.entries(assignments)) if (lid === id) delete assignments[tid]
          return { labels: s.labels.filter((l) => l.id !== id), assignments }
        })
        if (!isTemp(id)) deleteLabel(id).catch(() => toast('분류 삭제에 실패했어요'))
      },

      setTodoLabel: (todoId, labelId) => {
        set((s) => {
          const assignments = { ...s.assignments }
          if (labelId) assignments[todoId] = labelId
          else delete assignments[todoId]
          return { assignments }
        })
        useTodoStore.getState().setTaskLabel(todoId, labelId) // be todo.label_id로 영속
      },

      labelOf: (todoId) => {
        const lid = get().assignments[todoId]
        return lid ? get().labels.find((l) => l.id === lid) : undefined
      },

      hydrateAssignments: (tasks) => {
        set((s) => {
          const assignments = { ...s.assignments }
          for (const t of tasks) {
            if (t.labelId) assignments[t.id] = t.labelId
            else if (assignments[t.id]) delete assignments[t.id]
          }
          return { assignments }
        })
      },
    }),
    { name: 'haeyaji-labels' },
  ),
)
