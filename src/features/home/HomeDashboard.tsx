import { PlusIcon, WeatherIcon, CategoryIcon, SparkleIcon } from '@/lib/icons'
import { useEffect } from 'react'
import { PLACES } from '@/lib/mockData'
import { aiHint, catGrad, useDayWeather, recsFor, pseudoCond } from '@/lib/weather'
import { dateFullLabel, dowLabel, dayNum, greeting, todayKey, weekOf } from '@/lib/dates'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useAppStore } from '@/store/useAppStore'
import { useMapStore } from '@/store/useMapStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useDayTasks } from '@/features/todo/useDayTasks'
import { TaskRow, EmptyTasks } from '@/features/todo/TaskRow'
import { WeatherScene } from '@/features/weather/WeatherScene'
import { WeatherStatsStrip } from './WeatherStatsStrip'
import { MonthCalendarCard } from './MonthCalendarCard'
import { AdherenceCard } from './AdherenceCard'

export function HomeDashboard() {
  const { selId, setSelId, openWeather, openAdd, openAi, openMap, nickname } = useAppStore()
  const setMapSel = useMapStore((s) => s.setMapSel)
  const { tasks, done, total, progPct, frac } = useDayTasks()

  const region = useLocationStore((s) => s.region) || '현재 위치'
  const w = useDayWeather(selId)
  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)
  const weekKeys = weekOf(selId)

  // 주간 스트립용 날씨 미리 로드 (날짜별 캐시, 과거는 스토어가 스킵)
  useEffect(() => {
    weekKeys.forEach((k) => useWeatherStore.getState().loadDay(lat, lng, k))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, selId])

  const dateLabel = `${dateFullLabel(selId)} · ${region}`
  const completedText = `${done} / ${total} 완료`
  const taskTitle = selId === todayKey() ? '오늘 할 일' : '할 일'
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
    <div className="page-pad" style={{ minHeight: '100vh', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.7px' }}>{greeting()}, {nickname}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8B8579', marginTop: 2 }}>{dateLabel}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 14, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, boxShadow: '0 1px 2px rgba(22,26,32,.04), 0 8px 22px rgba(22,26,32,.045)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#15795A' }} />
              {completedText}
            </div>
            <div onClick={openAdd} className="lift" style={{ width: 44, height: 44, borderRadius: 14, background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PlusIcon />
            </div>
          </div>
        </div>

        {/* bento grid */}
        <div className="bento">
          {/* WEATHER 2x2 */}
          <div onClick={openWeather} className="tile lift" style={{ gridColumn: '1 / 3', gridRow: '1 / 2', padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', background: w.sky, backgroundClip: 'padding-box', borderColor: 'rgba(24,21,15,.12)' }}>
            <WeatherScene cond={w.cond} tod={w.tod} ink={w.ink} />
            <div style={{ position: 'relative', padding: '26px 28px', height: '100%', display: 'flex', flexDirection: 'column', color: w.ink }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.6 }}>LOCAL FORECAST</div>
                  <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{region}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 'auto' }}>
                <div style={{ fontSize: 64, fontWeight: 300, letterSpacing: '-2.5px', lineHeight: 0.8 }}>{w.temp}°</div>
                <div style={{ paddingBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{w.condKo}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>최고 {w.hi}° / 최저 {w.lo}°</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {tileHourly.map((h, i) => (
                  <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,.42)', borderRadius: 12, padding: '9px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{h.label}</div>
                    <div style={{ width: 16, height: 16, margin: '4px auto' }}>
                      <WeatherIcon cond={w.cond} c={w.iconC} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{h.temp}°</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TASKS 2x3 */}
          <div className="tile" style={{ gridColumn: '3 / 5', gridRow: '1 / 4', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px' }}>{taskTitle}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#A39C8E' }}>{frac}</div>
            </div>
            <div style={{ height: 5, borderRadius: 5, background: '#E4E7EE', marginTop: 14, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progPct, borderRadius: 5, background: '#15795A', transition: 'width .3s ease' }} />
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', marginRight: -8, paddingRight: 8 }}>
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} variant="home" />
              ))}
              {total === 0 && <EmptyTasks />}
            </div>
            <div onClick={openAdd} className="hbtn" style={{ borderTop: '1px solid #E4E7EE', paddingTop: 14, marginTop: 4, fontSize: 14, fontWeight: 700, color: '#A39C8E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <PlusIcon c="currentColor" w={17} />
              할 일 추가
            </div>
          </div>
          {/* 지표 스트립 (신규) */}
          <WeatherStatsStrip selId={selId} />

          {/* WEEK selector */}
          <div className="tile" style={{ gridColumn: '1 / 3', gridRow: '3 / 4', padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>이번 주 날씨</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#A39C8E' }}>날짜를 눌러 전환</div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <WeekStrip selId={selId} weekKeys={weekKeys} onPick={onWeekClick} />
            </div>
          </div>

          {/* AI 1x1 */}
          <div onClick={openAi} className="tile lift" style={{ gridColumn: '3 / 4', gridRow: '6 / 7', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', background: '#17150F', border: '1px solid rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -28, right: -22, width: 116, height: 116, borderRadius: '50%', background: 'rgba(21,121,90,.4)', filter: 'blur(28px)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SparkleIcon c="#5BD6A6" />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AI 추천</div>
            </div>
            <div style={{ position: 'relative', fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.92)' }}>{aiHint(w.cond)}</div>
            <div style={{ position: 'relative', fontSize: 13.5, fontWeight: 800, color: '#6FE6B8' }}>대화 열기 →</div>
          </div>

          {/* RECOMMENDATION 1x1 */}
          <div onClick={openRecMap} className="tile lift" style={{ gridColumn: '4 / 5', gridRow: '6 / 7', padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
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
          {/* 월간 캘린더 (신규) */}
          <MonthCalendarCard />

          {/* 주간 달성률 (신규) */}
          <AdherenceCard />
        </div>
      </div>
    </div>
  )
}

function WeekStrip({ selId, weekKeys, onPick }: { selId: string; weekKeys: string[]; onPick: (id: string) => void }) {
  const byDate = useWeatherStore((s) => s.byDate)
  return (
    <>
      {weekKeys.map((k) => {
        const on = k === selId
        const raw = byDate[k]
        const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as 'sunny') : pseudoCond(k)
        const hi = raw?.hi
        const today = k === todayKey()
        const iconColor = on ? '#fff' : cond === 'sunny' ? '#E6A52E' : '#9AA0A8'
        return (
          <div
            key={k}
            onClick={() => onPick(k)}
            className="hbtn"
            style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 13, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6' }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: on ? 'rgba(255,255,255,.7)' : today ? '#15795A' : '#A39C8E' }}>{today ? '오늘' : dowLabel(k)}</div>
            <div style={{ height: 18, margin: '5px auto 0', width: 18 }}>
              <WeatherIcon cond={cond} c={iconColor} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 5, color: on ? '#fff' : '#17150F' }}>{hi != null ? `${hi}°` : `${dayNum(k)}일`}</div>
          </div>
        )
      })}
    </>
  )
}
