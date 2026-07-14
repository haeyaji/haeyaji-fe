// 약속 공유 유틸·컴포넌트 — 디자인 핸드오프 반영(30분 단위 그리드·6단계 히트맵·웜 팔레트).
import { useEffect, useRef } from 'react'
import { WeatherIcon } from '@/lib/icons'
import { dowLabel, dayNum, parseKey } from '@/lib/dates'
import type { WeatherCond } from '@/types'
import type { MeetCell } from '@/store/useMeetupStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { MC } from './tokens'

export const MEET_TYPES = ['가벼운 모임', '팀 회의', '정기 모임', '기타']
// 오전 7시~새벽 2시, 30분 단위: [7, 7.5, …, 25.5] (24=자정, 25=새벽1시, 26=새벽2시)
export const TICKS: number[] = []
for (let hh = 7; hh < 26; hh++) { TICKS.push(hh); TICKS.push(hh + 0.5) }

// 할 일 시간 문자열("오전 07:00")을 tick으로. 새벽(0~6시)은 +24로 07~26 범위에 매핑.
export function taskTick(time?: string): number | null {
  if (!time) return null
  const m = /(오전|오후)\s*(\d{1,2}):(\d{2})/.exec(time)
  if (!m) return null
  let hr = parseInt(m[2], 10)
  const min = parseInt(m[3], 10)
  const pm = m[1] === '오후'
  if (pm && hr !== 12) hr += 12
  if (!pm && hr === 12) hr = 0
  if (hr < 7) hr += 24
  const tick = hr + (min >= 30 ? 0.5 : 0)
  return tick >= 7 && tick <= 25.5 ? tick : null
}

function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}
export const friendFree = (friendId: string, date: string, tick: number): boolean => hash(friendId + date + tick) % 4 !== 0
export const friendEntered = (friendId: string, meetupId: string): boolean => hash(meetupId + friendId) % 4 !== 0
export const mdLabel = (k: string) => `${String(parseKey(k).getMonth() + 1).padStart(2, '0')}.${String(dayNum(k)).padStart(2, '0')}(${dowLabel(k)})`
export const longDate = (k: string) => `${parseKey(k).getMonth() + 1}월 ${dayNum(k)}일 (${dowLabel(k)})`
export const hhmm = (t: number) => { const hr = Math.floor(t) % 24; const mn = Math.round((t - Math.floor(t)) * 60); return `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}` }
export const dur = (a: number, b: number) => { const t = b - a; const hr = Math.floor(t); const mn = Math.round((t - hr) * 60); return (hr > 0 ? `${hr}시간` : '') + (mn > 0 ? `${hr > 0 ? ' ' : ''}${mn}분` : '') }

export function Avatar({ name, size = 40, font = 17, ring }: { name: string; size?: number; font?: number; ring?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: MC.gradAvatar, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(31,122,92,.2)', border: ring ? '2px solid #fff' : 'none' }}>
      {name.slice(0, 1)}
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

// 히트맵 6단계 색
function heatColor(count: number, total: number): { bg: string; txt: string } {
  if (count <= 0) return { bg: '#F6F5F0', txt: 'transparent' }
  const r = count / total
  if (count === total) return { bg: '#12664A', txt: '#fff' }
  if (r >= 0.66) return { bg: '#2F9E73', txt: '#fff' }
  if (r >= 0.5) return { bg: '#66B896', txt: '#0E4D38' }
  if (r >= 0.34) return { bg: '#A6D6BF', txt: '#0E4D38' }
  return { bg: '#D8ECE1', txt: '#3C7B60' }
}

const RH = 26 // 셀 높이(기본, 읽기 히트맵용)
function HourCol({ rowH = RH, headerH = 34, hourW = 40 }: { rowH?: number; headerH?: number; hourW?: number }) {
  return (
    <div style={{ flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 2, borderRight: '1px solid #ECE9E0' }}>
      <div style={{ height: headerH, borderBottom: '1px solid #ECE9E0', position: 'sticky', top: 0, left: 0, zIndex: 3, background: '#fff' }} />
      {TICKS.map((tk) => (
        <div key={tk} style={{ width: hourW, height: rowH, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 7, fontSize: 11, fontWeight: 700, color: MC.muted, transform: 'translateY(-7px)' }}>{Number.isInteger(tk) ? hhmm(tk) : ''}</div>
      ))}
    </div>
  )
}

function DateHeader({ date, headerH = 34 }: { date: string; headerH?: number }) {
  const raw = useWeatherStore.getState().byDate[date]
  const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
  return (
    <div style={{ height: headerH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 800, borderBottom: '1px solid #ECE9E0', position: 'sticky', top: 0, zIndex: 1, background: '#fff' }}>
      {cond && <span style={{ width: 15, height: 15, display: 'inline-flex' }}><WeatherIcon cond={cond} c={cond === 'sunny' ? MC.amber : MC.faint} /></span>}
      {mdLabel(date)}
    </div>
  )
}

// 편집용 시간 그리드 (30분 단위, 드래그 페인트). marks: "date|tick"→할 일 제목들(표시 전용, 선택은 그대로).
export function TimeGrid({ dates, cells, onChange, paintMode, marks, rowH = 38, colMinW = 100, headerH = 46, hourW = 54, maxH = 780 }: { dates: string[]; cells: Record<string, MeetCell>; onChange: (next: Record<string, MeetCell>) => void; paintMode: MeetCell; marks?: Record<string, string[]>; rowH?: number; colMinW?: number; headerH?: number; hourW?: number; maxH?: number }) {
  const painting = useRef<MeetCell | 'clear' | null>(null)
  useEffect(() => {
    const up = () => { painting.current = null }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const applyLive = (key: string, value: MeetCell | 'clear') => {
    const next = { ...cellsRef.current }
    if (value === 'clear') delete next[key]
    else next[key] = value
    cellsRef.current = next
    onChange(next)
  }
  const down = (key: string) => { const value = cellsRef.current[key] === paintMode ? 'clear' : paintMode; painting.current = value; applyLive(key, value) }
  const enter = (key: string) => { if (painting.current) applyLive(key, painting.current) }

  return (
    <div style={{ overflow: 'auto', maxHeight: `min(${maxH}px, 68vh)`, border: '1px solid #E4E0D6', borderRadius: 16, touchAction: 'none' }}>
      <div style={{ display: 'flex', minWidth: 'min-content' }}>
        <HourCol rowH={rowH} headerH={headerH} hourW={hourW} />
        {dates.map((d) => (
          <div key={d} style={{ flex: 1, minWidth: colMinW, borderLeft: '1px solid #ECE9E0' }}>
            <DateHeader date={d} headerH={headerH} />
            {TICKS.map((tk, i) => {
              const key = `${d}|${tk}`
              const st = cells[key]
              const mk = marks?.[key]
              return (
                <div key={tk} onPointerDown={(e) => { e.preventDefault(); down(key) }} onPointerEnter={() => enter(key)} title={mk ? mk.join(', ') : undefined} style={{ position: 'relative', height: rowH, borderTop: i === 0 ? 'none' : `1px solid ${Number.isInteger(tk) ? 'rgba(30,28,23,.06)' : 'rgba(255,255,255,.5)'}`, cursor: 'pointer', background: st === 'free' ? '#2F9E73' : st === 'busy' ? '#EA8850' : '#fff' }}>
                  {mk && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px', pointerEvents: 'none', overflow: 'hidden' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st ? 'rgba(255,255,255,.85)' : '#C08A3A', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: st ? 'rgba(255,255,255,.92)' : '#9A7A3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mk[0]}{mk.length > 1 ? ` +${mk.length - 1}` : ''}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// 겹침 히트맵 (읽기 + 클릭 → 시간대 선택)
export function HeatGrid({ dates, myCells, friendIds, total, onPick, confirmed }: { dates: string[]; myCells: Record<string, MeetCell>; friendIds: string[]; total: number; onPick: (date: string, tick: number) => void; confirmed?: { date: string; startH: number; endH: number } }) {
  return (
    <div style={{ overflow: 'hidden', overflowX: 'auto', border: '1px solid #E4E0D6', borderRadius: 16 }}>
      <div style={{ display: 'flex', minWidth: 'min-content' }}>
        <HourCol />
        {dates.map((d) => (
          <div key={d} style={{ flex: 1, minWidth: 66, borderLeft: '1px solid #ECE9E0' }}>
            <DateHeader date={d} />
            {TICKS.map((tk, i) => {
              const count = (myCells[`${d}|${tk}`] === 'free' ? 1 : 0) + friendIds.filter((id) => friendFree(id, d, tk)).length
              const isConf = !!confirmed && confirmed.date === d && tk >= confirmed.startH && tk < confirmed.endH
              const col = heatColor(count, total)
              return (
                <div key={tk} onClick={() => count > 0 && onPick(d, tk)} title={`${count}/${total}명`} style={{ height: RH, borderTop: i === 0 ? 'none' : `1px solid ${Number.isInteger(tk) ? 'rgba(30,28,23,.06)' : 'rgba(255,255,255,.5)'}`, cursor: count > 0 ? 'pointer' : 'default', background: isConf ? '#12664A' : col.bg, boxShadow: isConf ? 'inset 0 0 0 2px #0E4D38' : 'none' }} />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export interface Slot { date: string; startH: number; endH: number; count: number } // endH 배타

// 내가 되는 시간만 후보로, 겹치는(입력완료 친구) 인원 많은 순. 같은 겹침 수 연속 시간을 하나로 묶음.
export function candidateSlots(dates: string[], myCells: Record<string, MeetCell>, enteredIds: string[]): Slot[] {
  const countAt = (d: string, t: number) => (myCells[`${d}|${t}`] === 'free' ? 1 + enteredIds.filter((id) => friendFree(id, d, t)).length : 0)
  const slots: Slot[] = []
  for (const d of dates) {
    let start = 0
    for (let i = 1; i <= TICKS.length; i++) {
      const cntPrev = countAt(d, TICKS[i - 1])
      const cntCur = i < TICKS.length ? countAt(d, TICKS[i]) : null
      if (cntCur !== cntPrev) {
        if (cntPrev >= 1) slots.push({ date: d, startH: TICKS[start], endH: TICKS[i - 1] + 0.5, count: cntPrev })
        start = i
      }
    }
  }
  return slots.sort((a, b) => b.count - a.count || (b.endH - b.startH) - (a.endH - a.startH) || a.date.localeCompare(b.date) || a.startH - b.startH)
}
