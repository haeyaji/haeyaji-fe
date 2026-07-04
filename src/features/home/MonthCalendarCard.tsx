// 홈 내 월간 캘린더 (핸드오프 §5.4) — 모든 날짜 선택 가능 + 월 이동 + 완료율 점.
import { useState } from 'react'
import { fmtKey, parseKey, todayKey } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useTodoStore } from '@/store/useTodoStore'

const DOW_HDR = ['월', '화', '수', '목', '금', '토', '일']

export function MonthCalendarCard() {
  const { selId, setSelId } = useAppStore()
  const tasksByDate = useTodoStore((s) => s.tasksByDate)

  const sel = parseKey(selId)
  const [ym, setYm] = useState({ y: sel.getFullYear(), m: sel.getMonth() })
  const moveMonth = (d: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + d) / 12), m: (((m + d) % 12) + 12) % 12 }))

  const T = todayKey()
  const lastDay = new Date(ym.y, ym.m + 1, 0).getDate()
  const firstDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7 // 월=0

  const cells: (string | null)[] = [...Array(firstDow).fill(null)]
  for (let d = 1; d <= lastDay; d++) cells.push(fmtKey(new Date(ym.y, ym.m, d)))

  // 완료율 점: 100%=채움, 부분=초록 링, 0%=회색 링, 할일 없음=점 없음
  const dotOf = (k: string) => {
    const list = tasksByDate[k]
    if (!list || list.length === 0) return null
    const done = list.filter((t) => t.done).length
    if (done === list.length) return { background: '#15795A' }
    if (done > 0) return { border: '1.5px solid #15795A' }
    return { border: '1.5px solid #CBD0D8' }
  }

  return (
    <div className="tile" style={{ gridColumn: '1 / 3', gridRow: '4 / 6', minHeight: 520, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 35, fontWeight: 800 }}>{ym.y}년 {ym.m + 1}월</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[-1, 1].map((d) => (
            <div key={d} onClick={() => moveMonth(d)} className="hbtn" style={{ width: 30, height: 30, borderRadius: 9, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={d < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {DOW_HDR.map((l, i) => (
          <div key={l} style={{ textAlign: 'center', fontSize: 25, fontWeight: 700, color: i === 5 ? '#8E93A6' : i === 6 ? '#A68E8A' : '#A39C8E', padding: '4px 0' }}>{l}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, flex: 1, minHeight: 0, alignContent: 'space-evenly' }}>
        {cells.map((k, i) => {
          if (!k) return <div key={`b${i}`} />
          const isToday = k === T
          const isSel = k === selId
          const dot = dotOf(k)
          return (
            <div key={k} onClick={() => setSelId(k)} className="hbtn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '3px 0', borderRadius: 10, cursor: 'pointer', background: isSel && !isToday ? 'rgba(21,121,90,.09)' : 'transparent' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: isToday || isSel ? 800 : 600,
                  background: isToday ? '#17150F' : 'transparent',
                  color: isToday ? '#fff' : isSel ? '#15795A' : '#17150F',
                }}
              >
                {parseKey(k).getDate()}
              </div>
              <div style={{ width: 5, height: 5, borderRadius: '50%', ...(dot ?? { background: 'transparent' }) }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
