// 실제 날짜 유틸 — selId는 'YYYY-MM-DD' 키를 쓴다 (mock 5/20~26 제거).

export const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']

export function fmtKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return fmtKey(new Date())
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return fmtKey(d)
}

/** key가 속한 주(월요일 시작)의 7개 날짜 키 */
export function weekOf(key: string): string[] {
  const d = parseKey(key)
  const dow = d.getDay() // 0=일
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const start = addDays(key, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const dowLabel = (key: string): string => DOW_KO[parseKey(key).getDay()]
export const dayNum = (key: string): number => parseKey(key).getDate()

/** "M월 D일 (X)" */
export function dateShortLabel(key: string): string {
  const d = parseKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW_KO[d.getDay()]})`
}

/** "M월 D일 X요일" */
export function dateFullLabel(key: string): string {
  const d = parseKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW_KO[d.getDay()]}요일`
}

export type DayState = 'past' | 'today' | 'future'
export function dayState(key: string): DayState {
  const t = todayKey()
  if (key === t) return 'today'
  return key < t ? 'past' : 'future'
}

/** 오늘 기준 최근 7일(6일 전 … 오늘) 키 배열 */
export function last7Days(): string[] {
  const t = todayKey()
  return Array.from({ length: 7 }, (_, i) => addDays(t, i - 6))
}

/** 시간대별 인사말 */
export function greeting(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요'
  if (hour >= 11 && hour < 14) return '점심시간이에요'
  if (hour >= 14 && hour < 18) return '좋은 오후예요'
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요'
  return '늦은 밤이에요'
}
