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

/** 오늘 기준 앞으로 7일(오늘 … +6일) 키 배열 — 주간 예보용 */
export function next7Days(): string[] {
  const t = todayKey()
  return Array.from({ length: 7 }, (_, i) => addDays(t, i))
}

/** 오늘 기준 최근 7일(6일 전 … 오늘) 키 배열 */
export function last7Days(): string[] {
  const t = todayKey()
  return Array.from({ length: 7 }, (_, i) => addDays(t, i - 6))
}

/**
 * 자유 입력 시간 문자열을 "오전/오후 HH:MM" 형태로 정규화.
 * 허용 예: "14:00"→오후 02:00, "오후 2시"→오후 02:00, "2:30"→오전 02:30,
 *          "오전 7"→오전 07:00, "2시반"→오전 02:30, "오후 12:00"→오후 12:00
 * - 빈 문자열 → '' (시간 미입력, 유효)
 * - 형식을 못 알아보면 → null (호출부에서 힌트 표시/저장 차단)
 * 오전/오후 없이 숫자만 오면 24시간제로 해석(2→오전 2시, 14→오후 2시).
 */
export function normalizeTime(raw: string): string | null {
  const s = raw.trim()
  if (!s) return ''
  const ampm = /오전|am|a\.m/i.test(s) ? 'am' : /오후|pm|p\.m/i.test(s) ? 'pm' : null
  const half = /반/.test(s)
  const hm = /(\d{1,2})\s*(?::|시)\s*(\d{1,2})?/.exec(s)
  let hour: number
  let min: number
  if (hm) {
    hour = parseInt(hm[1], 10)
    min = hm[2] != null ? parseInt(hm[2], 10) : half ? 30 : 0
  } else {
    const only = /(\d{1,2})/.exec(s)
    if (!only) return null
    hour = parseInt(only[1], 10)
    min = half ? 30 : 0
  }
  if (min > 59) return null
  let h24: number
  if (ampm) {
    if (hour < 1 || hour > 12) return null
    h24 = ampm === 'am' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12
  } else {
    if (hour > 23) return null
    h24 = hour
  }
  const mer = h24 < 12 ? '오전' : '오후'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${mer} ${pad(h12)}:${pad(min)}`
}

/** 시간대별 인사말 */
/** fe 표시용 시각("오후 02:00") → be LocalTime("HH:mm"). 빈값/파싱실패 → null */
export function toApiTime(display?: string | null): string | null {
  if (!display || !display.trim()) return null
  const m = /(오전|오후)?\s*(\d{1,2}):(\d{2})/.exec(display.trim())
  if (!m) return null
  let h = parseInt(m[2], 10)
  if (m[1] === '오후' && h !== 12) h += 12
  if (m[1] === '오전' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m[3]}`
}

/** be LocalTime("14:00[:ss]") → fe 표시용("오후 02:00"). null → "" */
export function fromApiTime(hhmm?: string | null): string {
  if (!hhmm) return ''
  const m = /(\d{1,2}):(\d{2})/.exec(hhmm)
  if (!m) return ''
  const h = parseInt(m[1], 10)
  const mer = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${mer} ${String(h12).padStart(2, '0')}:${m[2]}`
}

export function greeting(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요'
  if (hour >= 11 && hour < 14) return '점심시간이에요'
  if (hour >= 14 && hour < 18) return '좋은 오후예요'
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요'
  return '늦은 밤이에요'
}
