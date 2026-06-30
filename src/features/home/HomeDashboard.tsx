import { Gauge, PlusIcon, WeatherIcon, CategoryIcon, SparkleIcon } from '@/lib/icons'
import { PLACES, WEEK } from '@/lib/mockData'
import { aiHint, catGrad, dayMeta, dayWeather, dustColor, recsFor, uvColor } from '@/lib/weather'
import { useAppStore } from '@/store/useAppStore'
import { useMapStore } from '@/store/useMapStore'
import { useDayTasks } from '@/features/todo/useDayTasks'
import { TaskRow, EmptyTasks } from '@/features/todo/TaskRow'

const navBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  background: '#fff',
  border: '1px solid rgba(24,21,15,.07)',
  borderRadius: 14,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 700,
  color: '#5A554B',
  cursor: 'pointer',
} as const

const navIcon = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function HomeDashboard() {
  const { selId, setSelId, openWeather, openAdd, openAi, openMap, openRoutine, setView, logout } = useAppStore()
  const setMapSel = useMapStore((s) => s.setMapSel)
  const { tasks, done, total, progPct, frac } = useDayTasks()

  const w = dayWeather(selId)
  const meta = dayMeta(selId)
  const dateLabel = `5월 ${meta.date}일 ${meta.dow}요일 · 샌프란시스코`
  const completedText = `${done} / ${total} 완료`
  const taskTitle = selId === '24' ? '오늘 할 일' : '할 일'
  const tileHourly = w.hourly.slice(0, 4)

  const recs = recsFor(w.cond)
  const top = PLACES.find((p) => p.id === recs[0].id)!
  const recName = top.name.replace(' (페리 빌딩)', '')
  const recInk = top.cat === 'culture' ? '#241F33' : '#1E3318'

  const openRecMap = () => {
    setMapSel(top.id)
    openMap()
  }
  const onWeekClick = (id: string) => {
    setSelId(id)
    setMapSel(null)
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', padding: '30px 34px 44px', color: '#17150F', background: '#EEEBE3' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div onClick={logout} title="로그아웃" style={{ width: 44, height: 44, borderRadius: '50%', background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}>
              A
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.7px' }}>좋은 아침이에요, 알렉스</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8B8579', marginTop: 2 }}>{dateLabel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(24,21,15,.07)', borderRadius: 14, padding: '10px 16px', fontSize: 13.5, fontWeight: 700 }}>{completedText}</div>
            <div onClick={() => setView('calendar')} className="hbtn" style={navBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" {...navIcon}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
              캘린더
            </div>
            <div onClick={openMap} className="hbtn" style={navBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" {...navIcon}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
              지도
            </div>
            <div onClick={openRoutine} className="hbtn" style={navBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" {...navIcon}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 13l2.5 2.5L16 11" /></svg>
              루틴
            </div>
            <div onClick={openAdd} className="lift" style={{ width: 44, height: 44, borderRadius: 14, background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PlusIcon />
            </div>
          </div>
        </div>

        {/* bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: '168px', gap: 16 }}>
          {/* WEATHER 2x2 */}
          <div onClick={openWeather} className="tile lift" style={{ gridColumn: 'span 2', gridRow: 'span 2', padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', background: w.sky }}>
            <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: '50%', background: w.glow, filter: 'blur(30px)' }} />
            <div style={{ position: 'relative', padding: '26px 28px', height: '100%', display: 'flex', flexDirection: 'column', color: w.ink }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.6 }}>LOCAL FORECAST</div>
                  <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>샌프란시스코</div>
                </div>
                <div style={{ width: 56, height: 56 }}>
                  <WeatherIcon cond={w.cond} c={w.iconC} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 'auto' }}>
                <div style={{ fontSize: 88, fontWeight: 300, letterSpacing: '-4px', lineHeight: 0.8 }}>{w.temp}°</div>
                <div style={{ paddingBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{w.condKo}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>최고 {w.hi}° / 최저 {w.lo}°</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {tileHourly.map((h, i) => (
                  <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,.42)', borderRadius: 14, padding: '11px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{h.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 5 }}>{h.temp}°</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TASKS 2x3 */}
          <div className="tile" style={{ gridColumn: 'span 2', gridRow: 'span 3', padding: '24px 26px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px' }}>{taskTitle}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#A39C8E' }}>{frac}</div>
            </div>
            <div style={{ height: 5, borderRadius: 5, background: '#EDEAE2', marginTop: 14, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progPct, borderRadius: 5, background: '#15795A', transition: 'width .3s ease' }} />
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', marginRight: -8, paddingRight: 8 }}>
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} variant="home" />
              ))}
              {total === 0 && <EmptyTasks />}
            </div>
            <div onClick={openAdd} className="hbtn" style={{ borderTop: '1px solid #EDEAE2', paddingTop: 14, marginTop: 4, fontSize: 14, fontWeight: 700, color: '#A39C8E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <PlusIcon c="currentColor" w={17} />
              할 일 추가
            </div>
          </div>

          {/* UV 1x1 */}
          <div className="tile" style={{ gridColumn: 'span 1', gridRow: 'span 1', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E' }}>자외선 지수</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 106, height: 106 }}>
                <Gauge value={w.uvIdx} max={11} color={uvColor(w.uvIdx)} big={w.uvIdx} small={w.uvLv} />
              </div>
            </div>
          </div>

          {/* DUST 1x1 */}
          <div className="tile" style={{ gridColumn: 'span 1', gridRow: 'span 1', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E' }}>
              미세먼지 <span style={{ fontWeight: 600, color: '#C9C3B6' }}>㎍/㎥</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 106, height: 106 }}>
                <Gauge value={w.dustVal} max={150} color={dustColor(w.dustVal)} big={w.dustVal} small={w.dustLv} />
              </div>
            </div>
          </div>

          {/* WEEK selector 2x1 */}
          <div className="tile" style={{ gridColumn: 'span 2', gridRow: 'span 1', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>이번 주 날씨</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#A39C8E' }}>날짜를 눌러 전환</div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <WeekStrip selId={selId} onPick={onWeekClick} />
            </div>
          </div>

          {/* AI 1x1 */}
          <div onClick={openAi} className="tile lift" style={{ gridColumn: 'span 1', gridRow: 'span 1', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', background: '#17150F', border: '1px solid rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -28, right: -22, width: 116, height: 116, borderRadius: '50%', background: 'rgba(21,121,90,.4)', filter: 'blur(28px)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SparkleIcon c="#5BD6A6" />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AI 추천</div>
            </div>
            <div style={{ position: 'relative', fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.92)' }}>{aiHint(w.cond)}</div>
            <div style={{ position: 'relative', fontSize: 13.5, fontWeight: 800, color: '#6FE6B8' }}>대화 열기 →</div>
          </div>

          {/* RECOMMENDATION 1x1 */}
          <div onClick={openRecMap} className="tile lift" style={{ gridColumn: 'span 1', gridRow: 'span 1', padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: catGrad(top.cat) }} />
            <div style={{ position: 'relative', padding: 18, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: recInk }}>
              <div style={{ position: 'absolute', top: 14, left: 14, fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.85)', color: '#1E3318', padding: '5px 10px', borderRadius: 20 }}>적합도 {recs[0].fit}%</div>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 16, height: 16, display: 'inline-flex' }}>
                  <CategoryIcon cat={top.cat} c="#17150F" />
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{recName}</div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.72, marginTop: 2 }}>{top.type} · {top.dist}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekStrip({ selId, onPick }: { selId: string; onPick: (id: string) => void }) {
  return (
    <>
      {WEEK.map((d) => {
        const on = d.id === selId
        const iconColor = on ? '#fff' : d.cond === 'sunny' ? '#E6A52E' : '#9AA0A8'
        return (
          <div
            key={d.id}
            onClick={() => onPick(d.id)}
            className="hbtn"
            style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 13, cursor: 'pointer', background: on ? '#17150F' : '#F6F4EE' }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: on ? 'rgba(255,255,255,.7)' : '#A39C8E' }}>{d.dow}</div>
            <div style={{ height: 18, margin: '5px auto 0', width: 18 }}>
              <WeatherIcon cond={d.cond} c={iconColor} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 5, color: on ? '#fff' : '#17150F' }}>{d.hi}°</div>
          </div>
        )
      })}
    </>
  )
}
