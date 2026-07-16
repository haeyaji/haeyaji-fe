// 칸반 보드 · 할 일 리스트 · 상세 모달이 공유하는 메타(상태·우선순위·라벨·날짜 뱃지).
import { addDays, dateShortLabel, todayKey } from '@/lib/dates'
import type { Subtask, Task, TaskPriority, TaskStatus } from '@/types'

export const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'todo', label: '할 일', dot: '#8B8579' },
  { key: 'doing', label: '진행 중', dot: '#E0883A' },
  { key: 'done', label: '완료', dot: '#15795A' },
]

/* 우선순위 (지라식 화살표). 미지정 = 보통 */
export const PRIORITIES: { key: TaskPriority; label: string; color: string; d: string }[] = [
  { key: 'high', label: '높음', color: '#D6544A', d: 'M6 15l6-6 6 6' },
  { key: 'mid', label: '보통', color: '#E0883A', d: 'M5 9h14M5 15h14' },
  { key: 'low', label: '낮음', color: '#3F82C2', d: 'M6 9l6 6 6-6' },
]
export const prioOf = (t: Task): TaskPriority => t.priority ?? 'mid'
export const PRIO_RANK: Record<TaskPriority, number> = { high: 0, mid: 1, low: 2 }

export function PrioIcon({ p, w = 15 }: { p: TaskPriority; w?: number }) {
  const m = PRIORITIES.find((x) => x.key === p)!
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={m.d} />
    </svg>
  )
}

/* 라벨 색: 텍스트 해시 → 고정 팔레트 */
const LABEL_PALETTE = [
  { bg: '#E7F0F8', color: '#3F82C2' },
  { bg: '#F3EAF6', color: '#8A5AA8' },
  { bg: '#FDF0E3', color: '#C2702A' },
  { bg: '#E4F2EC', color: '#15795A' },
  { bg: '#F6ECEA', color: '#B05B52' },
]
export const labelStyle = (name: string) => {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return LABEL_PALETTE[h % LABEL_PALETTE.length]
}

/* 세부 할 일 진행현황 */
export const subStatusOf = (x: Subtask): TaskStatus => x.status ?? (x.done ? 'done' : 'todo')
export const SUB_STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  todo: { bg: '#F0F2F6', color: '#5A554B' },
  doing: { bg: '#FBF1E4', color: '#B26A14' },
  done: { bg: '#E4F2EC', color: '#15795A' },
}

export function dateBadge(dateKey: string): { label: string; color: string; bg: string } {
  const T = todayKey()
  if (dateKey === T) return { label: '오늘', color: '#15795A', bg: '#E4F2EC' }
  if (dateKey === addDays(T, 1)) return { label: '내일', color: '#3F82C2', bg: '#E7F0F8' }
  const label = dateShortLabel(dateKey).replace(/ \(.\)$/, '')
  if (dateKey < T) return { label, color: '#A39C8E', bg: '#F0F2F6' }
  return { label, color: '#5A554B', bg: '#F0F2F6' }
}
