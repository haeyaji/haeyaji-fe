// 약속 공유 유틸·컴포넌트 — 생성/상세에서 재사용.
import { useEffect, useRef } from 'react'
import { WeatherIcon } from '@/lib/icons'
import { dowLabel, dayNum, parseKey } from '@/lib/dates'
import type { WeatherCond } from '@/types'
import type { MeetCell } from '@/store/useMeetupStore'
import { useWeatherStore } from '@/store/useWeatherStore'

export const MEET_TYPES = ['가벼운 모임', '팀 회의', '정기 모임', '기타']
export const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i) // 09~21

// 결정론 가용성 mock (같은 입력 → 같은 결과)
function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}
export const friendFree = (friendId: string, date: string, hour: number): boolean => hash(friendId + date + hour) % 4 !== 0
// 이 친구가 약속에 시간을 입력했는지 (mock, 약속별 결정론) — 75%는 입력 완료, 나머지는 대기
export const friendEntered = (friendId: string, meetupId: string): boolean => hash(meetupId + friendId) % 4 !== 0
export const mdLabel = (k: string) => `${String(parseKey(k).getMonth() + 1).padStart(2, '0')}.${String(dayNum(k)).padStart(2, '0')}(${dowLabel(k)})`
export const longDate = (k: string) => `${parseKey(k).getMonth() + 1}월 ${dayNum(k)}일 (${dowLabel(k)})`

export function Avatar({ name, size = 40, font = 17, ring }: { name: string; size?: number; font?: number; ring?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(21,121,90,.22)', border: ring ? '2px solid #fff' : 'none' }}>
      {name.slice(0, 1)}
    </div>
  )
}

// 겹친 아바타 스택
export function AvatarStack({ names, size = 30 }: { names: string[]; size?: number }) {
  const show = names.slice(0, 4)
  const more = names.length - show.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {show.map((n, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}><Avatar name={n} size={size} font={size * 0.42} ring /></div>
      ))}
      {more > 0 && (
        <div style={{ marginLeft: -size * 0.35, width: size, height: size, borderRadius: '50%', background: '#E4E7EE', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 800, border: '2px solid #fff' }}>+{more}</div>
      )}
    </div>
  )
}

const HourCol = () => (
  <div style={{ flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
    <div style={{ height: 34, borderBottom: '1px solid #EAECEF' }} />
    {HOURS.map((h) => (
      <div key={h} style={{ width: 34, height: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#A39C8E', transform: 'translateY(-6px)' }}>{h}</div>
    ))}
  </div>
)

// 편집용 시간 그리드 (드래그 페인트)
export function TimeGrid({ dates, cells, onChange, paintMode }: { dates: string[]; cells: Record<string, MeetCell>; onChange: (next: Record<string, MeetCell>) => void; paintMode: MeetCell }) {
  const painting = useRef<MeetCell | 'clear' | null>(null)
  useEffect(() => {
    const up = () => { painting.current = null }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])
  // 드래그 중 setState가 비동기라 최신 셀 상태를 ref로 추적하며 즉시 반영
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const applyLive = (key: string, value: MeetCell | 'clear') => {
    const next = { ...cellsRef.current }
    if (value === 'clear') delete next[key]
    else next[key] = value
    cellsRef.current = next
    onChange(next)
  }
  const down = (key: string) => {
    const value = cellsRef.current[key] === paintMode ? 'clear' : paintMode
    painting.current = value
    applyLive(key, value)
  }
  const enter = (key: string) => { if (painting.current) applyLive(key, painting.current) }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #EAECEF', borderRadius: 14, touchAction: 'none' }}>
      <div style={{ display: 'flex', minWidth: 'min-content' }}>
        <HourCol />
        {dates.map((d) => (
          <div key={d} style={{ flex: 1, minWidth: 72, borderLeft: '1px solid #EAECEF' }}>
            <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#17150F', borderBottom: '1px solid #EAECEF' }}>{mdLabel(d)}</div>
            {HOURS.map((h) => {
              const key = `${d}|${h}`
              const st = cells[key]
              return (
                <div key={h} onPointerDown={(e) => { e.preventDefault(); down(key) }} onPointerEnter={() => enter(key)} style={{ height: 30, borderTop: h === HOURS[0] ? 'none' : '1px solid #F0F1F3', cursor: 'pointer', background: st === 'free' ? '#57B48C' : st === 'busy' ? '#E8A05B' : '#fff' }} />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// 겹침 히트맵 (읽기 + 클릭 → 해당 셀이 속한 시간대 선택)
export function HeatGrid({ dates, myCells, friendIds, total, onPick, confirmed }: { dates: string[]; myCells: Record<string, MeetCell>; friendIds: string[]; total: number; onPick: (date: string, hour: number) => void; confirmed?: { date: string; startH: number; endH: number } }) {
  const byDate = useWeatherStore((s) => s.byDate)
  let max = 0
  dates.forEach((d) => HOURS.forEach((h) => {
    const c = (myCells[`${d}|${h}`] === 'free' ? 1 : 0) + friendIds.filter((id) => friendFree(id, d, h)).length
    if (c > max) max = c
  }))
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #EAECEF', borderRadius: 14 }}>
      <div style={{ display: 'flex', minWidth: 'min-content' }}>
        <HourCol />
        {dates.map((d) => {
          const raw = byDate[d]
          const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
          return (
            <div key={d} style={{ flex: 1, minWidth: 72, borderLeft: '1px solid #EAECEF' }}>
              <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 800, borderBottom: '1px solid #EAECEF' }}>
                {cond && <span style={{ width: 14, height: 14, display: 'inline-flex' }}><WeatherIcon cond={cond} c={cond === 'sunny' ? '#E6A52E' : '#B6BCC7'} /></span>}
                {mdLabel(d)}
              </div>
              {HOURS.map((h) => {
                const count = (myCells[`${d}|${h}`] === 'free' ? 1 : 0) + friendIds.filter((id) => friendFree(id, d, h)).length
                const r = total ? count / total : 0
                const best = count === max && count > 0
                const isConf = !!confirmed && confirmed.date === d && h >= confirmed.startH && h < confirmed.endH
                return (
                  <div key={h} onClick={() => count > 0 && onPick(d, h)} title={`${count}/${total}명`} style={{ height: 30, borderTop: h === HOURS[0] ? 'none' : '1px solid #F0F1F3', cursor: count > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isConf ? '#17150F' : r === 0 ? '#fff' : `rgba(21,121,90,${(0.15 + 0.85 * r).toFixed(2)})`, boxShadow: best && !isConf ? 'inset 0 0 0 2px #17150F' : 'none' }}>
                    {count > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: isConf || r > 0.5 ? '#fff' : '#0F5A42' }}>{count}</span>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface Slot { date: string; startH: number; endH: number; count: number } // endH 배타

// 약속 가능한 "시간대"(연속 구간) — 내가 되는 시간만 후보로, 겹치는 친구 수 많은 순.
// 내가 안 되는 시각(0)은 후보에서 제외(약속엔 내가 꼭 참석). 같은 겹침 수의 연속 시간을 하나로 묶음.
export function candidateSlots(dates: string[], myCells: Record<string, MeetCell>, friendIds: string[]): Slot[] {
  const countAt = (d: string, h: number) => (myCells[`${d}|${h}`] === 'free' ? 1 + friendIds.filter((id) => friendFree(id, d, h)).length : 0)
  const slots: Slot[] = []
  for (const d of dates) {
    let start = 0
    for (let i = 1; i <= HOURS.length; i++) {
      const cntPrev = countAt(d, HOURS[i - 1])
      const cntCur = i < HOURS.length ? countAt(d, HOURS[i]) : null
      if (cntCur !== cntPrev) {
        if (cntPrev >= 1) slots.push({ date: d, startH: HOURS[start], endH: HOURS[i - 1] + 1, count: cntPrev })
        start = i
      }
    }
  }
  return slots.sort((a, b) => b.count - a.count || (b.endH - b.startH) - (a.endH - a.startH) || a.date.localeCompare(b.date) || a.startH - b.startH)
}

export const hhmm = (h: number) => `${String(h).padStart(2, '0')}:00`
