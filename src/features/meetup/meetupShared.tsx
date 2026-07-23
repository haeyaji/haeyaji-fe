// 약속 공유 유틸·컴포넌트 — be 슬롯 모델. (구 mock 시간칸/친구가용 폐기)
import { dowLabel } from '@/lib/dates'
import type { MeetingType } from '@/api/meetingApi'
import { MC } from './tokens'

// be meeting.type ENUM ↔ 표시 라벨 (저장은 code, UI만 label)
export const MEET_TYPES: { code: MeetingType; label: string }[] = [
  { code: 'CASUAL', label: '가벼운 모임' },
  { code: 'TEAM', label: '팀 회의' },
  { code: 'REGULAR', label: '정기 모임' },
  { code: 'ETC', label: '기타' },
]
export const meetTypeLabel = (code: string): string => MEET_TYPES.find((t) => t.code === code)?.label ?? code

// ── 슬롯/시각 포맷 헬퍼 (be datetime "yyyy-MM-ddTHH:mm:ss[.SSS]") ──
export const slotDate = (dt: string): string => dt.slice(0, 10) // "YYYY-MM-DD"
export const slotHM = (dt: string): string => dt.slice(11, 16) // "HH:mm"
export const dateLabel = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number)
  const k = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return `${m}.${String(d).padStart(2, '0')}(${dowLabel(k)})`
}
export const longDate = (ymd: string): string => {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일 (${dowLabel(ymd)})`
}
/** 확정 범위 표시 "7.29(수) 09:30~10:30" */
export const confirmedRange = (startAt: string, endAt: string): string => `${dateLabel(slotDate(startAt))} ${slotHM(startAt)}~${slotHM(endAt)}`

// 히트맵 6단계 색 (freeCount / participantCount)
export function heatColor(count: number, total: number): { bg: string; txt: string } {
  if (count <= 0 || total <= 0) return { bg: '#F6F5F0', txt: '#C4C0B4' }
  const r = count / total
  if (count === total) return { bg: '#12664A', txt: '#fff' }
  if (r >= 0.66) return { bg: '#2F9E73', txt: '#fff' }
  if (r >= 0.5) return { bg: '#66B896', txt: '#0E4D38' }
  if (r >= 0.34) return { bg: '#A6D6BF', txt: '#0E4D38' }
  return { bg: '#D8ECE1', txt: '#3C7B60' }
}

export function Avatar({ name, size = 40, font = 17, ring }: { name: string; size?: number; font?: number; ring?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: MC.gradAvatar, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(31,122,92,.2)', border: ring ? '2px solid #fff' : 'none' }}>
      {(name || '?').slice(0, 1)}
    </div>
  )
}

export function AvatarStack({ names, size = 30 }: { names: string[]; size?: number }) {
  const show = names.slice(0, 4)
  const more = names.length - show.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {show.map((n, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}><Avatar name={n} size={size} font={size * 0.42} ring /></div>
      ))}
      {more > 0 && (
        <div style={{ marginLeft: -size * 0.35, width: size, height: size, borderRadius: '50%', background: '#E2DFD5', color: MC.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, border: '2px solid #fff' }}>+{more}</div>
      )}
    </div>
  )
}
