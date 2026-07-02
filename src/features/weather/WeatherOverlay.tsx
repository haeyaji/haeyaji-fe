// 날씨 타일 배경 위에 얹는 애니메이션 오버레이 (순수 CSS, 의존성 X).
// 조건 × 시간대: 비=2겹 빗줄기+구름 스크림, 흐림=구름 레이어+안개, 맑음(낮)=햇살+글로우, 맑음(밤)=별+달+별똥별.
import type { TimeOfDay, WeatherCond } from '@/types'

export function WeatherOverlay({ cond, tod }: { cond: WeatherCond; tod: TimeOfDay }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {cond === 'rainy' && <Rain night={tod === 'night'} />}
      {cond === 'snowy' && <Snow />}
      {cond === 'cloudy' && <Clouds night={tod === 'night'} />}
      {cond === 'sunny' && tod !== 'night' && <Sunny tod={tod} />}
      {cond === 'sunny' && tod === 'night' && <NightSky />}
    </div>
  )
}

/* ── 비: 원근 2겹 빗줄기 + 상단 비구름 스크림 ───────────────────── */
function Rain({ night }: { night: boolean }) {
  const streak = (i: number, layer: 'near' | 'far') => {
    const near = layer === 'near'
    const left = ((i * 7.3 + (near ? 2 : 5) + ((i * 13) % 7)) % 102) - 1
    const delay = ((i * 17) % 12) / 12
    const dur = near ? 0.55 + ((i * 7) % 4) / 20 : 0.9 + ((i * 5) % 5) / 12
    return (
      <div
        key={`${layer}${i}`}
        style={{
          position: 'absolute',
          top: 0,
          left: `${left}%`,
          width: near ? 2 : 1.2,
          height: near ? 30 : 16,
          borderRadius: 2,
          background: `linear-gradient(rgba(255,255,255,0), rgba(255,255,255,${near ? 0.75 : 0.4}))`,
          animation: `rb-rain ${dur}s linear ${delay}s infinite`,
        }}
      />
    )
  }
  return (
    <>
      {/* 상단 비구름 스크림 */}
      <div style={{ position: 'absolute', top: -30, left: -20, right: -20, height: 110, background: `linear-gradient(rgba(30,40,54,${night ? 0.55 : 0.34}), transparent)`, filter: 'blur(6px)' }} />
      <Cloud top={-4} left={-8} w={170} dur={38} delay={0} op={night ? 0.5 : 0.42} dark />
      <Cloud top={2} left={40} w={130} dur={46} delay={10} op={night ? 0.42 : 0.3} dark />
      {Array.from({ length: 14 }).map((_, i) => streak(i, 'far'))}
      {Array.from({ length: 22 }).map((_, i) => streak(i, 'near'))}
    </>
  )
}

/* ── 눈: 흔들리며 떨어지는 눈송이 ───────────────────────────────── */
function Snow() {
  return (
    <>
      <Cloud top={-4} left={-8} w={150} dur={40} delay={0} op={0.4} />
      {Array.from({ length: 26 }).map((_, i) => {
        const left = (i * 8.9 + ((i * 11) % 6)) % 100
        const delay = ((i * 19) % 14) / 4
        const dur = 4.5 + ((i * 7) % 6) / 1.5
        const size = i % 4 === 0 ? 5 : i % 2 === 0 ? 3.6 : 2.6
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: -8,
              left: `${left}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.9)',
              filter: size > 4 ? 'blur(0.5px)' : 'none',
              animation: `rb-snow ${dur}s linear ${delay}s infinite`,
            }}
          />
        )
      })}
    </>
  )
}

/* ── 구름 조각 (공용) ───────────────────────────────────────────── */
function Cloud({ top, left = -170, w, dur, delay, op, dark }: { top: number; left?: number; w: number; dur: number; delay: number; op: number; dark?: boolean }) {
  return (
    <div style={{ position: 'absolute', top: `${top}%`, left, opacity: op, animation: `rb-drift ${dur}s linear ${delay}s infinite` }}>
      <svg width={w} height={w * 0.5} viewBox="0 0 120 60" fill={dark ? '#2E3A48' : '#fff'}>
        <path d="M30 48h60a16 16 0 0 0 2-31.9 22 22 0 0 0-42-5.2A18 18 0 0 0 30 48z" />
      </svg>
    </div>
  )
}

/* ── 흐림: 구름 4겹 + 안개 밴드 ─────────────────────────────────── */
function Clouds({ night }: { night: boolean }) {
  return (
    <>
      <Cloud top={6} w={180} dur={22} delay={0} op={night ? 0.34 : 0.55} />
      <Cloud top={30} w={120} dur={30} delay={5} op={night ? 0.26 : 0.4} />
      <Cloud top={-2} w={90} dur={40} delay={12} op={night ? 0.2 : 0.3} />
      <Cloud top={46} w={150} dur={34} delay={18} op={night ? 0.18 : 0.26} />
      {/* 낮게 깔리는 안개 밴드 */}
      <div style={{ position: 'absolute', bottom: '18%', left: '-30%', width: '160%', height: 46, borderRadius: 40, background: `rgba(255,255,255,${night ? 0.1 : 0.22})`, filter: 'blur(14px)', animation: 'rb-fog 26s ease-in-out infinite' }} />
    </>
  )
}

/* ── 맑음(낮·새벽·노을): 큰 햇살 + 맥동 글로우 + 옅은 구름 ──────── */
function Sunny({ tod }: { tod: TimeOfDay }) {
  const warm = tod === 'dusk' ? '255,170,120' : tod === 'dawn' ? '255,205,150' : '255,236,170'
  const mask = 'radial-gradient(circle, #000 30%, transparent 72%)'
  return (
    <>
      {/* 맥동하는 태양 글로우 */}
      <div style={{ position: 'absolute', top: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, rgba(${warm},.55), transparent 65%)`, animation: 'rb-pulse 5s ease-in-out infinite' }} />
      {/* 회전 햇살 */}
      <div
        style={{
          position: 'absolute',
          top: -110,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `repeating-conic-gradient(rgba(${warm},.4) 0deg 6deg, transparent 6deg 17deg)`,
          animation: 'rb-rays 36s linear infinite',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      {/* 지나가는 옅은 구름 한두 점 (깊이감) */}
      <Cloud top={58} w={110} dur={48} delay={4} op={0.28} />
      <Cloud top={12} w={70} dur={60} delay={20} op={0.2} />
    </>
  )
}

/* ── 맑은 밤: 별 무리 + 달 + 별똥별 ─────────────────────────────── */
function NightSky() {
  return (
    <>
      {/* 달 + 은은한 달빛 */}
      <div style={{ position: 'absolute', top: 26, right: 92, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,232,255,.35), transparent 65%)', animation: 'rb-pulse 7s ease-in-out infinite' }} />
      <svg width="44" height="44" viewBox="0 0 40 40" style={{ position: 'absolute', top: 62, right: 128 }}>
        <path d="M28 6a15 15 0 1 0 6 26A17 17 0 0 1 28 6z" fill="#EAF0FA" opacity="0.95" />
      </svg>
      {Array.from({ length: 30 }).map((_, i) => {
        const left = (i * 11.7 + 3) % 100
        const top = (i * 23 + 4) % 72
        const dur = 1.6 + ((i * 5) % 7) / 2.5
        const delay = ((i * 13) % 12) / 5
        const size = i % 5 === 0 ? 2.8 : i % 3 === 0 ? 2 : 1.4
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: size > 2 ? '0 0 6px rgba(255,255,255,.8)' : 'none',
              animation: `rb-twinkle ${dur}s ease-in-out ${delay}s infinite`,
            }}
          />
        )
      })}
      {/* 별똥별 (주기적으로 한 번씩) */}
      <div style={{ position: 'absolute', top: '14%', left: '8%', width: 90, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, rgba(255,255,255,.9), transparent)', transform: 'rotate(24deg)', animation: 'rb-shoot 9s ease-in 2s infinite' }} />
    </>
  )
}
