// 주간 달성률 (핸드오프 §5.6) — 오늘 기준 최근 7일 롤링, 실제 할 일 완료 이력 연결.
import { dowLabel, last7Days, todayKey } from '@/lib/dates'
import { useTodoStore } from '@/store/useTodoStore'

export function AdherenceCard() {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const T = todayKey()
  const days = last7Days()

  const rows = days.map((k) => {
    const list = tasksByDate[k]
    if (!list || list.length === 0) return { k, pct: null as number | null }
    const done = list.filter((t) => t.done).length
    return { k, pct: Math.round((done / list.length) * 100) }
  })
  const withData = rows.filter((r) => r.pct != null) as { k: string; pct: number }[]
  const avg = withData.length ? Math.round(withData.reduce((s, r) => s + r.pct, 0) / withData.length) : 0
  const doneSum = days.reduce((s, k) => s + (tasksByDate[k]?.filter((t) => t.done).length ?? 0), 0)
  const totalSum = days.reduce((s, k) => s + (tasksByDate[k]?.length ?? 0), 0)

  return (
    <div className="tile" style={{ gridColumn: '3 / 5', gridRow: '4 / 5', minHeight: 370, padding: '18px 22px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 23, fontWeight: 800 }}>주간 달성률</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#15795A' }}>평균 {avg}%</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#A39C8E', marginTop: 2 }}>최근 7일 완료 {doneSum} / {totalSum}개</div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 12, paddingBottom: 2 }}>
        {rows.map(({ k, pct }) => {
          const isToday = k === T
          const h = pct == null ? 4 : Math.max(4, pct)
          return (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: pct == null ? '#C1C7D2' : isToday ? '#17150F' : '#8B8579' }}>
                {pct == null ? '–' : `${pct}%`}
              </div>
              <div style={{ width: '100%', maxWidth: 30, height: `${h}%`, minHeight: 4, borderRadius: 7, background: isToday ? '#17150F' : pct ? '#57B48C' : '#E7EAEF', transition: 'height .3s ease' }} />
              <div style={{ fontSize: 16, fontWeight: isToday ? 800 : 700, color: isToday ? '#17150F' : '#A39C8E' }}>{isToday ? '오늘' : dowLabel(k)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
