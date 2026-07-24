import { PlusIcon, WeatherIcon, CategoryIcon, SparkleIcon } from '@/lib/icons'
import { useEffect, useState } from 'react'
import { aiHint, catGrad, useDayWeather, pseudoCond, isLightInk } from '@/lib/weather'
import { useHomeRecStore } from '@/store/useHomeRecStore'
import { addDays, dateFullLabel, dateShortLabel, dowLabel, greeting, next7Days, todayKey } from '@/lib/dates'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore } from '@/store/usePrefStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useDayTasks } from '@/features/todo/useDayTasks'
import { TaskRow, EmptyTasks } from '@/features/todo/TaskRow'
import { TaskDetailModal } from '@/features/todo/TaskDetailModal'
import type { Task } from '@/types'
import { WeatherScene } from '@/features/weather/WeatherScene'
import { WeatherStatsStrip } from './WeatherStatsStrip'
import { MonthCalendarCard } from './MonthCalendarCard'
import { AdherenceCard } from './AdherenceCard'

export function HomeDashboard() {
  const { selId, setSelId, weatherSelId, setWeatherSelId, openWeather, openAdd, openAi, openMap } = useAppStore()
  const nickname = usePrefStore((s) => s.nickname)
  const { tasks, done, total, progPct, frac } = useDayTasks()
  const [detail, setDetail] = useState<Task | null>(null)

  const region = useLocationStore((s) => s.region) || '현재 위치'
  const w = useDayWeather(weatherSelId)
  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)
  const weekKeys = next7Days() // 오늘 기준 앞으로 7일 (실예보 범위)

  // 주간 예보 미리 로드 (날짜별 캐시)
  useEffect(() => {
    weekKeys.forEach((k) => useWeatherStore.getState().loadDay(lat, lng, k))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  const dateLabel = `${dateFullLabel(selId)} · ${region}`
  const completedText = `${done} / ${total} 완료`
  const taskTitle =
    selId === todayKey()
      ? '오늘 할 일'
      : selId === addDays(todayKey(), 1)
        ? '내일 할 일'
        : dateShortLabel(selId).replace(/ \(.\)$/, '')
  const tileHourly = w.hourly.slice(0, 5)

  // 개인화 추천(be /message) + 실검색(be /places/search) → 대표 장소 1건. 위치·날씨 확정 시 1회.
  const rec = useHomeRecStore((s) => s.rec)
  const recLoading = useHomeRecStore((s) => s.loading)
  useEffect(() => {
    if (lat && lng) void useHomeRecStore.getState().load(lat, lng, w.condKo ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])
  const recCat = rec?.cat ?? 'cafe'
  const recInk = recCat === 'culture' ? '#241F33' : '#1E3318'

  const openRecMap = () => {
    openMap()
  }
  // 주간 예보 클릭 = 날씨만 전환 (할일·캘린더는 그대로)
  const onWeekClick = (id: string) => {
    setWeatherSelId(id)
  }

  return (
    <div className="page-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      {/* 스케일은 index.css .home-wrap zoom 미디어쿼리에서 (데탑 .8 / 노트북 .77) */}
      <div className="home-wrap">
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.7px' }}>{greeting()}, {nickname}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#8B8579', marginTop: 2 }}>{dateLabel}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 14, padding: '10px 16px', fontSize: 18, fontWeight: 700, boxShadow: '0 1px 2px rgba(22,26,32,.04), 0 8px 22px rgba(22,26,32,.045)' }}>
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
          <div onClick={openWeather} className="tile lift" style={{ gridColumn: '1 / 3', gridRow: '1 / 2', minHeight: 340, padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', background: w.sky, backgroundClip: 'padding-box', borderColor: 'rgba(24,21,15,.12)' }}>
            <WeatherScene cond={w.cond} tod={w.tod} ink={w.ink} />
            <div style={{ position: 'relative', padding: '18px 22px', height: '100%', display: 'flex', flexDirection: 'column', color: w.ink }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.6 }}>LOCAL FORECAST</div>
                  <div style={{ fontSize: 27, fontWeight: 800, marginTop: 4 }}>{region}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 'auto', paddingTop: 6 }}>
                <div style={{ fontSize: 'clamp(44px, 3.6vw, 64px)', fontWeight: 300, letterSpacing: '-2.5px', lineHeight: 0.85 }}>{w.temp}°</div>
                <div style={{ paddingTop: 0, marginTop: -2 }}>
                  <div style={{ fontSize: 21, fontWeight: 700 }}>{w.condKo}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.7 }}>최고 {w.hi}° / 최저 {w.lo}°</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {tileHourly.map((h, i) => (
                  <div key={i} style={{ flex: 1, background: isLightInk(w.ink) ? 'rgba(10,16,28,.42)' : 'rgba(255,255,255,.5)', borderRadius: 12, padding: '9px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.7 }}>{h.label}</div>
                    <div style={{ width: 20, height: 20, margin: '4px auto' }}>
                      <WeatherIcon cond={w.cond} c={w.iconC} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{h.temp}°</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TASKS 2x3 */}
          <div className="tile" style={{ gridColumn: '3 / 5', gridRow: '1 / 4', minHeight: 560, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div onClick={() => setSelId(addDays(selId, -1))} className="hbtn" title="전날" style={{ width: 30, height: 30, borderRadius: 9, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.4px' }}>{taskTitle}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#A39C8E', marginLeft: 10 }}>{frac}</span>
              </div>
              <div onClick={() => setSelId(addDays(selId, 1))} className="hbtn" title="다음날" style={{ width: 30, height: 30, borderRadius: 9, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 6, borderRadius: 6, background: '#E4E7EE', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: progPct, borderRadius: 6, background: '#15795A', transition: 'width .3s ease' }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#8B8579', marginTop: 6 }}>{progPct}</div>
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', marginRight: -8, paddingRight: 8 }}>
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} variant="home" onOpen={setDetail} />
              ))}
              {total === 0 && <EmptyTasks />}
            </div>
            <div onClick={openAdd} className="hbtn" style={{ borderTop: '1px solid #E4E7EE', paddingTop: 14, marginTop: 4, fontSize: 18, fontWeight: 700, color: '#A39C8E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <PlusIcon c="currentColor" w={17} />
              할 일 추가
            </div>
          </div>
          {/* 지표 스트립 (신규) */}
          <WeatherStatsStrip selId={weatherSelId} />

          {/* WEEK selector */}
          <div className="tile" style={{ gridColumn: '1 / 3', gridRow: '3 / 4', padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 21, fontWeight: 800 }}>주간 예보</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#A39C8E' }}>날짜를 눌러 전환</div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <WeekStrip selId={weatherSelId} weekKeys={weekKeys} onPick={onWeekClick} />
            </div>
          </div>

          {/* AI 1x1 */}
          <div onClick={openAi} className="tile lift" style={{ gridColumn: '3 / 4', gridRow: '5 / 6', minHeight: 150, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', background: '#17150F', border: '1px solid rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -28, right: -22, width: 116, height: 116, borderRadius: '50%', background: 'rgba(21,121,90,.4)', filter: 'blur(28px)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SparkleIcon c="#5BD6A6" />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>AI 추천</div>
            </div>
            <div style={{ position: 'relative', fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: 'rgba(255,255,255,.92)' }}>{aiHint(w.cond)}</div>
            <div style={{ position: 'relative', fontSize: 13.5, fontWeight: 800, color: '#6FE6B8' }}>대화 열기 →</div>
          </div>

          {/* RECOMMENDATION 1x1 — 개인화 추천 + 실검색 대표 장소 */}
          <div onClick={openRecMap} className="tile lift" style={{ gridColumn: '4 / 5', gridRow: '5 / 6', minHeight: 150, padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: catGrad(recCat) }} />
            <div style={{ position: 'relative', padding: 18, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: recInk }}>
              <div style={{ position: 'absolute', top: 14, left: 14, fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.85)', color: '#1E3318', padding: '5px 10px', borderRadius: 20 }}>{rec ? rec.catLabel : '추천'}</div>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 16, height: 16, display: 'inline-flex' }}>
                  <CategoryIcon cat={recCat} c="#17150F" />
                </span>
              </div>
              {rec ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{rec.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.72, marginTop: 2 }}>{[rec.typeLabel, rec.dist].filter(Boolean).join(' · ')}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{recLoading ? '추천 찾는 중…' : '추천 준비 중'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.72, marginTop: 2 }}>취향·날씨 기반 장소</div>
                </>
              )}
            </div>
          </div>
          {/* 월간 캘린더 (신규) */}
          <MonthCalendarCard />

          {/* 주간 달성률 (신규) */}
          <AdherenceCard />
        </div>
      </div>

      {detail && <TaskDetailModal dateKey={selId} taskId={detail.id} onClose={() => setDetail(null)} />}
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
        const today = k === todayKey()
        const iconColor = on ? '#fff' : cond === 'sunny' ? '#E6A52E' : '#9AA0A8'
        return (
          <div
            key={k}
            onClick={() => onPick(k)}
            className="hbtn"
            style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 13, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6' }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: on ? 'rgba(255,255,255,.7)' : today ? '#15795A' : '#A39C8E' }}>{today ? '오늘' : dowLabel(k)}</div>
            <div style={{ height: 24, margin: '5px auto 0', width: 24 }}>
              <WeatherIcon cond={cond} c={iconColor} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 5, color: on ? '#fff' : '#17150F' }}>{raw?.hi != null ? `${raw.hi}°` : '–'}</div>
          </div>
        )
      })}
    </>
  )
}
