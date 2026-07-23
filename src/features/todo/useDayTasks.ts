import { useAppStore } from '@/store/useAppStore'
import { useTodoStore } from '@/store/useTodoStore'
import type { Task } from '@/types'

export interface DayTasksView {
  tasks: Task[] // 루틴 먼저 정렬
  done: number
  total: number
  progPct: string
  frac: string
}

/** 선택된 날짜의 할 일 + 진행률. 루틴 → 개별 순으로 정렬. */
export function useDayTasks(): DayTasksView {
  const selId = useAppStore((s) => s.selId)
  const raw = useTodoStore((s) => s.tasksByDate[selId]) ?? []
  const done = raw.filter((t) => t.done).length
  const total = raw.length
  // 핀 먼저 → 루틴 → 개별 (핀은 be todo.pinned, 홈/할일/상세 공통 상태)
  const pin = (t: Task) => (t.pinned ? 0 : 1)
  const grp = (t: Task) => (t.group === 'routine' ? 0 : 1)
  const tasks = [...raw].sort((a, b) => pin(a) - pin(b) || grp(a) - grp(b))
  return {
    tasks,
    done,
    total,
    progPct: (total ? Math.round((done / total) * 100) : 0) + '%',
    frac: `${done} / ${total}`,
  }
}
