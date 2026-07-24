import { useEffect, useState } from 'react'
import { CategoryIcon, PlusIcon, WeatherIcon } from '@/lib/icons'
import { catGrad, useDayWeather, isLightInk } from '@/lib/weather'
import { useHomeRecStore } from '@/store/useHomeRecStore'
import { addDays, dateShortLabel, fmtKey, parseKey, todayKey } from '@/lib/dates'
import { WeatherScene } from '@/features/weather/WeatherScene'
import { useAppStore } from '@/store/useAppStore'
import { useMapStore } from '@/store/useMapStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useDayTasks } from '@/features/todo/useDayTasks'
import { TaskRow, EmptyTasks } from '@/features/todo/TaskRow'
import { TaskDetailModal } from '@/features/todo/TaskDetailModal'
import type { Task, WeatherCond } from '@/types'

function evColor(t: Task): { bg: string; color: string } {
  if (t.ai) return { bg: '#E4F2EC', color: '#15795A' }
  if (t.done) return { bg: '#ECEFF3', color: '#B3ADA0' }
  return { bg: '#E9EDF3', color: '#5A554B' }
}

export function CalendarPage() {
  const { selId, setSelId, openAdd, openWeather, openAi } = useAppStore()
  const setMapSel = useMapStore((s) => s.setMapSel)
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { tasks, total, frac } = useDayTasks()
  const [detail, setDetail] = useState<Task | null>(null)

  // 실제 예보 최대한 로드 — 단기+중기(오늘~+10일). 캘린더 셀 아이콘은 실데이터 있는 날만 표시
  const byDate = useWeatherStore((s) => s.byDate)
  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)
  const region = useLocationStore((s) => s.region) || '현재 위치'
  useEffect(() => {
    for (let i = 0; i <= 10; i++) void useWeatherStore.getState().loadDay(lat, lng, addDays(todayKey(), i))
  }, [lat, lng])

  const w = useDayWeather(selId)
  const tileHourly = w.hourly.slice(0, 5)
  const dateShort = dateShortLabel(selId)
  const rec = useHomeRecStore((s) => s.rec) // 개인화 추천(HomeDashboard와 공유, 캐시로 중복호출 차단)
  const recCat = rec?.cat ?? 'cafe'
  useEffect(() => {
    if (lat && lng) void useHomeRecStore.getState().load(lat, lng, w.condKo ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  // 표시 중인 연·월 (기본: 선택 날짜의 달), 좌우로 이동 가능
  const sel = parseKey(selId)
  const [ym, setYm] = useState({ y: sel.getFullYear(), m: sel.getMonth() }) // m: 0-based
  const moveMonth = (d: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + d) / 12), m: (((m + d) % 12) + 12) % 12 }))
  // 선택 날짜가 다른 달로 이동하면 달력도 그 달로 따라간다 (월 브라우징은 selId를 안 바꾸므로 영향 없음)
  useEffect(() => {
    const d = parseKey(selId)
    setYm((cur) => (cur.y === d.getFullYear() && cur.m === d.getMonth() ? cur : { y: d.getFullYear(), m: d.getMonth() }))
  }, [selId])

  const monthKeys: string[] = []
  const lastDay = new Date(ym.y, ym.m + 1, 0).getDate()
  for (let d = 1; d <= lastDay; d++) monthKeys.push(fmtKey(new Date(ym.y, ym.m, d)))
  const monthTotal = monthKeys.reduce((n, k) => n + (tasksByDate[k]?.length ?? 0), 0)
  const calSummary = `이번 달 일정 ${monthTotal}개 · ${dateShort} 선택됨`

  // 표시 중인 달의 할 일을 be에서 로드 (셀 이벤트·개수 실데이터)
  useEffect(() => {
    monthKeys.forEach((k) => void useTodoStore.getState().loadDate(k))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym.y, ym.m])

  const weekHdr = ['일', '월', '화', '수', '목', '금', '토'].map((label, i) => ({ label, color: i === 0 ? '#C2453B' : i === 6 ? '#3F82C2' : '#A39C8E' }))

  type Cell = { key: string; day: number | null; cond?: WeatherCond; isToday?: boolean; inWeek?: boolean; wid?: string }
  const firstDow = new Date(ym.y, ym.m, 1).getDay() // 0=일 (헤더가 일요일 시작)
  const cells: Cell[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ key: 'b' + i, day: null })
  const T = todayKey()
  monthKeys.forEach((k, i) => {
    // 실제 예보가 로드된 날만 아이콘 표시 (범위 밖·과거는 아이콘 없음 — 가짜 날씨 금지)
    const raw = byDate[k]
    const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
    cells.push({ key: k, day: i + 1, cond, isToday: k === T, inWeek: true, wid: k })
  })
  // 항상 6주(42칸) 고정 — 후행 빈칸 채워 달마다 그리드 높이가 변하지 않게 (aside도 안 흔들림)
  while (cells.length < 42) cells.push({ key: 't' + cells.length, day: null })

  const pickDay = (wid: string) => {
    setSelId(wid)
    setMapSel(null)
  }

  return (
    <div className="page-pad-cal" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.8px' }}>캘린더</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8B8579', marginTop: 2 }}>{calSummary}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div onClick={openAdd} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 17px', borderRadius: 14, background: '#17150F', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              <PlusIcon w={16} />
              할 일 추가
            </div>
          </div>
        </div>

        {/* body */}
        <div className="cal-body">
          {/* month grid */}
          <div className="tile" style={{ flex: 1, minWidth: 0, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div onClick={() => moveMonth(-1)} className="hbtn" style={{ width: 32, height: 32, borderRadius: 10, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{ym.y}년 {ym.m + 1}월</div>
              <div onClick={() => moveMonth(1)} className="hbtn" style={{ width: 32, height: 32, borderRadius: 10, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 10 }}>
              {weekHdr.map((h) => (
                <div key={h.label} style={{ textAlign: 'left', padding: '0 11px 8px', fontSize: 16, fontWeight: 700, color: h.color }}>{h.label}</div>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((c) => {
                const on = !!c.inWeek && c.wid === selId
                const tl = c.wid ? tasksByDate[c.wid] ?? [] : []
                const events = tl.slice(0, 2)
                const more = tl.length > 2 ? tl.length - 2 : 0
                const dowIdx = c.wid ? parseKey(c.wid).getDay() : -1 // 0=일, 6=토 (빈 셀은 wid 없음)
                const numColor = on ? '#15795A' : dowIdx === 0 ? '#A68E8A' : dowIdx === 6 ? '#8E93A6' : '#17150F'
                return (
                  <div
                    key={c.key}
                    onClick={() => c.inWeek && c.wid && pickDay(c.wid)}
                    style={{
                      borderRadius: 16,
                      padding: '9px 10px',
                      cursor: c.inWeek ? 'pointer' : 'default',
                      background: c.day == null ? 'transparent' : on ? '#E4F2EC' : '#fff',
                      boxShadow: on ? 'inset 0 0 0 2px #15795A' : 'none',
                      border: '1px solid #ECEFF4',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    {c.day != null && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: numColor }}>{c.day}</div>
                            {c.isToday && <div style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '2px 7px', borderRadius: 10 }}>오늘</div>}
                          </div>
                          <div style={{ width: 16, height: 16 }}>{c.cond && <WeatherIcon cond={c.cond} c={c.cond === 'sunny' ? '#E6A52E' : '#9AA0A8'} />}</div>
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                          {events.map((ev, i) => {
                            const cc = evColor(ev)
                            return (
                              <div key={i} style={{ fontSize: 13, fontWeight: 700, color: cc.color, background: cc.bg, borderRadius: 7, padding: '3px 7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                            )
                          })}
                          {more > 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E', paddingLeft: 3 }}>+{more}개</div>}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* aside */}
          <div className="cal-aside" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 메인과 동일한 애니메이션 날씨 씬 (움직이는 배경 + LOCAL FORECAST 오버레이) */}
            <div onClick={openWeather} className="lift" style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', cursor: 'pointer', background: w.sky, backgroundClip: 'padding-box', border: '1px solid rgba(24,21,15,.12)' }}>
              <WeatherScene cond={w.cond} tod={w.tod} ink={w.ink} />
              <div style={{ position: 'relative', padding: '18px 20px', color: w.ink, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.6 }}>LOCAL FORECAST</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 3 }}>{region}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.72, marginTop: 2 }}>{dateShort}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 14 }}>
                  <div style={{ fontSize: 54, fontWeight: 300, letterSpacing: '-2.5px', lineHeight: 0.82 }}>{w.temp}°</div>
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{w.condKo}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>최고 {w.hi}° / 최저 {w.lo}°</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                  {tileHourly.map((h, i) => (
                    <div key={i} style={{ flex: 1, background: isLightInk(w.ink) ? 'rgba(10,16,28,.42)' : 'rgba(255,255,255,.5)', borderRadius: 10, padding: '7px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>{h.label}</div>
                      <div style={{ width: 18, height: 18, margin: '3px auto' }}><WeatherIcon cond={w.cond} c={w.iconC} /></div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{h.temp}°</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>상세 날씨 →</div>
              </div>
            </div>

            <div className="tile" style={{ flex: 1, minHeight: 0, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>이 날 일정</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E' }}>{frac}</div>
              </div>
              <div style={{ marginTop: 8, flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', marginRight: -8, paddingRight: 8 }}>
                {tasks.map((t) => (
                  <TaskRow key={t.id} task={t} variant="aside" onOpen={setDetail} />
                ))}
                {total === 0 && <EmptyTasks />}
              </div>
              <div onClick={openAdd} className="hbtn" style={{ borderTop: '1px solid #E4E7EE', paddingTop: 13, marginTop: 4, fontSize: 13.5, fontWeight: 700, color: '#A39C8E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <PlusIcon c="currentColor" w={16} />
                할 일 추가
              </div>
            </div>

            <div onClick={openAi} className="lift" style={{ borderRadius: 24, padding: '16px 18px', cursor: 'pointer', background: catGrad(recCat), color: recCat === 'culture' ? '#241F33' : '#1E3318', display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 16, height: 16, display: 'inline-flex' }}><CategoryIcon cat={recCat} c="#17150F" /></span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.66 }}>{rec ? `AI 추천 · ${rec.catLabel}` : 'AI 추천 장소'}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec ? rec.name : '대화로 추천받기'}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}><path d="M9 6l6 6-6 6" /></svg>
            </div>
          </div>
        </div>
      </div>

      {detail && <TaskDetailModal dateKey={selId} taskId={detail.id} onClose={() => setDetail(null)} />}
    </div>
  )
}
