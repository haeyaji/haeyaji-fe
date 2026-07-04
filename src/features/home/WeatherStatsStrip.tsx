// 날씨 지표 스트립 (핸드오프 §5.2) — 날짜 상태별 분기:
// 오늘=실시간 4지표 / 미래=강수확률만+안내 / 과거=그날 날씨 기록+안내
import { DetailIcon, WeatherIcon } from '@/lib/icons'
import { dayState } from '@/lib/dates'
import { useDayWeather } from '@/lib/weather'

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <div style={{ width: 28, height: 28 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#A39C8E' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.4px' }}>
        {value}
        {sub && <span style={{ fontSize: 15, fontWeight: 700, color: '#A39C8E', marginLeft: 4 }}>{sub}</span>}
      </div>
    </div>
  )
}

const Divider = () => <div style={{ width: 1, alignSelf: 'stretch', margin: '14px 0', background: '#EEF0F2' }} />

export function WeatherStatsStrip({ selId }: { selId: string }) {
  const w = useDayWeather(selId)
  const state = dayState(selId)

  return (
    <div className="tile" style={{ gridColumn: '1 / 3', gridRow: '2 / 3', minHeight: 150, display: 'flex', alignItems: 'stretch', padding: '0 8px' }}>
      {state === 'today' && (
        <>
          <Stat icon={<DetailIcon name="pop" c="#3F82C2" />} label="강수확률" value={`${w.pop}%`} />
          <Divider />
          <Stat icon={<DetailIcon name="uv" c="#E0883A" />} label="자외선" value={String(w.uvIdx)} sub={w.uvLv} />
          <Divider />
          <Stat icon={<DetailIcon name="dust" c="#7C8794" />} label="미세먼지" value={String(w.dustVal)} sub={w.dustLv} />
          <Divider />
          <Stat icon={<DetailIcon name="humid" c="#3F82C2" />} label="습도" value={`${w.humid}%`} />
        </>
      )}
      {state === 'future' && (
        <>
          <Stat icon={<DetailIcon name="pop" c="#3F82C2" />} label="강수확률" value={`${w.pop}%`} />
          <Divider />
          <div style={{ flex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#A39C8E', textAlign: 'center', lineHeight: 1.55 }}>
              자외선·미세먼지·습도는 실시간 정보라
              <br />
              당일에만 표시돼요
            </div>
          </div>
        </>
      )}
      {state === 'past' && (
        <>
          <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30 }}>
              <WeatherIcon cond={w.cond} c={w.iconC} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{w.condKo}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#A39C8E' }}>최고 {w.hi}° / 최저 {w.lo}°</div>
            </div>
          </div>
          <Divider />
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#A39C8E', textAlign: 'center', lineHeight: 1.55 }}>
              지난 날짜예요 — 실시간 지표는
              <br />
              기록하지 않아요
            </div>
          </div>
        </>
      )}
    </div>
  )
}
