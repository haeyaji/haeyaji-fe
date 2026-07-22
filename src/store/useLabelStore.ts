// 사용자 커스텀 분류 라벨 (be label 테이블 대응). category(6종·AI)와 별개로, 사용자가 직접
// 만들어 관리하는 자유 분류. todo당 라벨 1개(be todo.label_id). be 미구현이라 로컬 persist.
// TODO(be): /labels CRUD + todo.label_id 붙으면 assignments를 서버 label_id로 대체.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Label } from '@/types'

// 라벨 색 팔레트 (color 미지정 시 자동배정 — 스키마 label.color note)
export const LABEL_COLORS = ['#15795A', '#3F82C2', '#8A5AA8', '#C2702A', '#B05B52', '#D6544A', '#2E9E8F', '#5B6472']

// 처음 화면이 비지 않도록 편집·삭제 가능한 스타터 분류 3개 (사용자 데이터, mock 아님)
const STARTER: Label[] = [
  { id: 'lb_work', name: '업무', color: '#3F82C2' },
  { id: 'lb_personal', name: '개인', color: '#15795A' },
  { id: 'lb_health', name: '운동', color: '#C2702A' },
]

interface LabelState {
  labels: Label[]
  assignments: Record<string, string> // todoId → labelId
  addLabel: (name: string, color?: string) => Label | null
  renameLabel: (id: string, name: string) => void
  setColor: (id: string, color: string) => void
  removeLabel: (id: string) => void
  setTodoLabel: (todoId: string, labelId: string | null) => void
  labelOf: (todoId: string) => Label | undefined
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      labels: STARTER,
      assignments: {},
      addLabel: (name, color) => {
        const nm = name.trim()
        if (!nm) return null
        const dup = get().labels.find((l) => l.name === nm)
        if (dup) return dup // uk_label_member_name (같은 이름 재사용)
        const label: Label = { id: 'lb' + Date.now(), name: nm, color: color ?? LABEL_COLORS[get().labels.length % LABEL_COLORS.length] }
        set((s) => ({ labels: [...s.labels, label] }))
        return label
      },
      renameLabel: (id, name) => {
        const nm = name.trim()
        if (!nm) return
        set((s) => ({ labels: s.labels.map((l) => (l.id === id ? { ...l, name: nm } : l)) }))
      },
      setColor: (id, color) => set((s) => ({ labels: s.labels.map((l) => (l.id === id ? { ...l, color } : l)) })),
      removeLabel: (id) =>
        set((s) => {
          const assignments = { ...s.assignments }
          for (const [todoId, lid] of Object.entries(assignments)) if (lid === id) delete assignments[todoId]
          return { labels: s.labels.filter((l) => l.id !== id), assignments }
        }),
      setTodoLabel: (todoId, labelId) =>
        set((s) => {
          const assignments = { ...s.assignments }
          if (labelId) assignments[todoId] = labelId
          else delete assignments[todoId]
          return { assignments }
        }),
      labelOf: (todoId) => {
        const lid = get().assignments[todoId]
        return lid ? get().labels.find((l) => l.id === lid) : undefined
      },
    }),
    { name: 'haeyaji-labels' },
  ),
)
