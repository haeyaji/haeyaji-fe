// 할 일 리스트·상세 모달이 공유하는 메타(상태·날짜 뱃지). be todo_status = TODO/DONE 2상태.
import { addDays, dateShortLabel, todayKey } from '@/lib/dates'
import type { TaskStatus } from '@/types'

export const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'todo', label: '할 일', dot: '#8B8579' },
  { key: 'done', label: '완료', dot: '#15795A' },
]

export function dateBadge(dateKey: string): { label: string; color: string; bg: string } {
  const T = todayKey()
  if (dateKey === T) return { label: '오늘', color: '#15795A', bg: '#E4F2EC' }
  if (dateKey === addDays(T, 1)) return { label: '내일', color: '#3F82C2', bg: '#E7F0F8' }
  const label = dateShortLabel(dateKey).replace(/ \(.\)$/, '')
  if (dateKey < T) return { label, color: '#A39C8E', bg: '#F0F2F6' }
  return { label, color: '#5A554B', bg: '#F0F2F6' }
}
