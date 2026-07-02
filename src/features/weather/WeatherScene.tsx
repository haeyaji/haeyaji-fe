// 실사 루프 배경 — GIF급 경량판(360p, 개당 1~2MB, 총 ~8.5MB). mixkit 무료 라이선스.
// 조건(맑음/흐림/비) × 낮/밤 = 6종. 슬로우 재생 + 가독성 스크림. 실패 시 CSS 오버레이 폴백.
import { useState } from 'react'
import type { TimeOfDay, WeatherCond } from '@/types'
import { WeatherOverlay } from './WeatherOverlay'

function videoSrc(cond: WeatherCond, tod: TimeOfDay): string {
  const night = tod === 'night'
  if (cond === 'rainy') return night ? '/weather/rainy-night.mp4' : '/weather/rainy.mp4'
  if (cond === 'snowy') return night ? '/weather/snowy-night.mp4' : '/weather/snowy.mp4'
  if (cond === 'cloudy') return night ? '/weather/cloudy-night.mp4' : '/weather/cloudy.mp4'
  return night ? '/weather/sunny-night.mp4' : '/weather/sunny.mp4'
}

// 재생 속도 (구름이 너무 빨리 흐르지 않게 슬로우)
function playRate(cond: WeatherCond, tod: TimeOfDay): number {
  if (cond === 'rainy') return tod === 'night' ? 0.6 : 0.7
  if (cond === 'snowy') return 0.6
  if (cond === 'sunny' && tod === 'night') return 0.6
  return 0.45 // 하늘/구름은 느긋하게
}

// ink 밝기로 스크림 방향 결정 (밝은 글자=어두운 스크림, 어두운 글자=밝은 스크림)
function isLightInk(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return false
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

export function WeatherScene({ cond, tod, ink }: { cond: WeatherCond; tod: TimeOfDay; ink: string }) {
  const [failed, setFailed] = useState(false)
  const light = isLightInk(ink)

  if (failed) {
    return <WeatherOverlay cond={cond} tod={tod} />
  }

  return (
    // inset -1px + 자체 배경: 둥근 모서리에서 밑 그라데이션이 1px 비쳐 보이는 테두리 방지
    <div style={{ position: 'absolute', inset: -1, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none', background: '#0E141F' }}>
      <video
        key={videoSrc(cond, tod)}
        src={videoSrc(cond, tod)}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = playRate(cond, tod)
        }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* 가독성 스크림 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: light
            ? 'linear-gradient(180deg, rgba(10,16,28,.42), rgba(10,16,28,.12) 42%, rgba(10,16,28,.46))'
            : 'linear-gradient(180deg, rgba(255,255,255,.34), rgba(255,255,255,.06) 45%, rgba(255,255,255,.30))',
        }}
      />
    </div>
  )
}
