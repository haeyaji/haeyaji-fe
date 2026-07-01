// 날씨 타일 배경 위에 얹는 경량 애니메이션 오버레이 (순수 CSS, 의존성 X).
// 조건 × 시간대에 따라: 비=빗줄기, 흐림=구름 드리프트, 맑음(낮)=햇살, 맑음(밤)=별.
import type { TimeOfDay, WeatherCond } from '@/types'

export function WeatherOverlay({ cond, tod }: { cond: WeatherCond; tod: TimeOfDay }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      {cond === 'rainy' && <Rain />}
      {cond === 'cloudy' && <Clouds />}
      {cond === 'sunny' && tod !== 'night' && <Rays />}
      {cond === 'sunny' && tod === 'night' && <Stars />}
    </div>
  )
}

function Rain() {
  return (
    <>
      {Array.from({ length: 18 }).map((_, i) => {
        const left = (i * 6.1 + ((i * 17) % 9)) % 100
        const delay = ((i * 13) % 10) / 10
        const dur = 0.7 + ((i * 7) % 5) / 10
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${left}%`,
              width: 1.5,
              height: 20,
              borderRadius: 2,
              background: 'linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.55))',
              animation: `rb-rain ${dur}s linear ${delay}s infinite`,
            }}
          />
        )
      })}
    </>
  )
}

function Cloud({ top, w, dur, delay, op }: { top: number; w: number; dur: number; delay: number; op: number }) {
  return (
    <div style={{ position: 'absolute', top: `${top}%`, left: -160, opacity: op, animation: `rb-drift ${dur}s linear ${delay}s infinite` }}>
      <svg width={w} height={w * 0.5} viewBox="0 0 120 60" fill="#fff">
        <path d="M30 48h60a16 16 0 0 0 2-31.9 22 22 0 0 0-42-5.2A18 18 0 0 0 30 48z" />
      </svg>
    </div>
  )
}

function Clouds() {
  return (
    <>
      <Cloud top={12} w={130} dur={26} delay={0} op={0.28} />
      <Cloud top={38} w={90} dur={34} delay={6} op={0.2} />
      <Cloud top={4} w={70} dur={44} delay={14} op={0.16} />
    </>
  )
}

function Rays() {
  const mask = 'radial-gradient(circle, #000 28%, transparent 70%)'
  return (
    <div
      style={{
        position: 'absolute',
        top: -70,
        right: -50,
        width: 240,
        height: 240,
        borderRadius: '50%',
        background: 'repeating-conic-gradient(rgba(255,240,190,.22) 0deg 7deg, transparent 7deg 20deg)',
        animation: 'rb-rays 44s linear infinite',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  )
}

function Stars() {
  return (
    <>
      {Array.from({ length: 16 }).map((_, i) => {
        const left = (i * 13 + 7) % 100
        const top = (i * 29 + 5) % 58
        const dur = 1.8 + ((i * 5) % 6) / 2
        const delay = ((i * 11) % 10) / 5
        const size = i % 4 === 0 ? 2.4 : 1.6
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
              animation: `rb-twinkle ${dur}s ease-in-out ${delay}s infinite`,
            }}
          />
        )
      })}
    </>
  )
}
