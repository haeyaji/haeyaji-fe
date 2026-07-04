import { CloseIcon, DetailIcon, WeatherIcon, type DetailKey } from '@/lib/icons'
import { useDayWeather } from '@/lib/weather'
import { dateShortLabel } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useLocationStore } from '@/store/useLocationStore'
import { WeatherScene } from './WeatherScene'

export function WeatherDrawer() {
  const { weatherOpen, closeWeather, weatherSelId: selId } = useAppStore()
  const region = useLocationStore((s) => s.region) || '현재 위치'
  const w = useDayWeather(selId) // 훅은 early return보다 먼저

  if (!weatherOpen) return null

  const dateShort = dateShortLabel(selId)
  const hourIconC = w.cond === 'sunny' ? '#E6A52E' : '#7C8794'

  const details: { key: DetailKey; label: string; value: string; c: string }[] = [
    { key: 'pop', label: '강수확률', value: `${w.pop}%`, c: '#3F82C2' },
    { key: 'humid', label: '습도', value: `${w.humid}%`, c: '#3F82C2' },
    { key: 'wind', label: '바람', value: `${w.wind} km/h`, c: '#7C8794' },
    { key: 'feels', label: '체감온도', value: `${w.feels}°`, c: '#E0883A' },
    { key: 'uv', label: '자외선', value: `${w.uvLv} ${w.uvIdx}`, c: '#E0883A' },
    { key: 'dust', label: '미세먼지', value: `${w.dustLv} ${w.dustVal}`, c: '#7C8794' },
  ]

  return (
    <>
      <div onClick={closeWeather} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(24,21,15,.3)', animation: 'rb-fade .18s ease' }} />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 41,
          width: 418,
          maxWidth: '100%',
          background: 'var(--canvas)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-26px 0 56px rgba(24,21,15,.2)',
          animation: 'rb-drawer .3s cubic-bezier(.22,1,.36,1)',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '24px 24px 30px', background: w.sky, color: w.ink, position: 'relative', overflow: 'hidden' }}>
          <WeatherScene cond={w.cond} tod={w.tod} ink={w.ink} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{dateShort} · {region}</div>
            <div onClick={closeWeather} style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <CloseIcon c="currentColor" />
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 18 }}>
            <div style={{ fontSize: 72, fontWeight: 300, letterSpacing: '-3px', lineHeight: 0.8 }}>{w.temp}°</div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{w.condKo}</div>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>최고 {w.hi}° / 최저 {w.lo}°</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A39C8E', marginBottom: 12 }}>시간별 예보</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {w.hourly.map((h, i) => (
              <div key={i} style={{ flex: 1, background: '#fff', border: '1px solid #E1E5EC', borderRadius: 16, padding: '14px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#A39C8E' }}>{h.label}</div>
                <div style={{ width: 22, height: 22, margin: '9px auto' }}>
                  <WeatherIcon cond={w.cond} c={hourIconC} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{h.temp}°</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3F82C2', marginTop: 4 }}>{h.pop}%</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: '#A39C8E', margin: '22px 0 12px' }}>상세 정보</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {details.map((d) => (
              <div key={d.key} style={{ background: '#fff', border: '1px solid #E1E5EC', borderRadius: 16, padding: '15px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#A39C8E' }}>
                  <div style={{ width: 16, height: 16 }}>
                    <DetailIcon name={d.key} c={d.c} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{d.label}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 7, letterSpacing: '-.5px' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
