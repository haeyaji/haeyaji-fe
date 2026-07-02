// 시안의 인라인 SVG들을 React 컴포넌트로 포팅. (dangerouslySetInnerHTML 대신 JSX)
import type { CSSProperties } from 'react'
import type { PlaceCat, RoutineCat, WeatherCond } from '@/types'

interface SvgProps {
  c?: string
  style?: CSSProperties
}

const full = { width: '100%', height: '100%' } as const

export function SunIcon({ c = '#F6B23A', style }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" {...full} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <circle cx="12" cy="12" r="4.2" fill={c} stroke="none" />
      <path d="M12 1.8v2.4M12 19.6v2.4M1.8 12h2.4M19.6 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
    </svg>
  )
}

export function CloudIcon({ c = '#5E6B78', style }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" {...full} fill={c} style={style}>
      <path d="M7.5 18h9a3.6 3.6 0 0 0 .4-7.18 5 5 0 0 0-9.65-1.2A4 4 0 0 0 7.5 18z" />
    </svg>
  )
}

export function RainIcon({ c = '#4E6276', style }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" {...full} style={style}>
      <path d="M7.5 15h9a3.6 3.6 0 0 0 .4-7.18 5 5 0 0 0-9.65-1.2A4 4 0 0 0 7.5 15z" fill={c} />
      <g stroke={c} strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 17.5l-1 2.5M13 17.5l-1 2.5" />
      </g>
    </svg>
  )
}

export function SnowIcon({ c = '#8FA6BC', style }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" {...full} style={style}>
      <path d="M7.5 14h9a3.6 3.6 0 0 0 .4-7.18 5 5 0 0 0-9.65-1.2A4 4 0 0 0 7.5 14z" fill={c} />
      <g fill={c}>
        <circle cx="8.5" cy="17" r="1.1" />
        <circle cx="12" cy="19.5" r="1.1" />
        <circle cx="15.5" cy="17" r="1.1" />
      </g>
    </svg>
  )
}

export function WeatherIcon({ cond, c, style }: { cond: WeatherCond; c?: string; style?: CSSProperties }) {
  if (cond === 'sunny') return <SunIcon c={c} style={style} />
  if (cond === 'cloudy') return <CloudIcon c={c} style={style} />
  if (cond === 'snowy') return <SnowIcon c={c} style={style} />
  return <RainIcon c={c} style={style} />
}

export function CategoryIcon({ cat, c = '#15795A', style }: { cat: PlaceCat; c?: string; style?: CSSProperties }) {
  const p = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (cat === 'cafe')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
        <path d="M17 9h2.2a2 2 0 0 1 0 4H17" />
        <path d="M7 2.5v2M11 2.5v2" />
      </svg>
    )
  if (cat === 'park')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M12 3l5 7h-3l3 5h-4v6h-2v-6H7l3-5H7z" />
      </svg>
    )
  if (cat === 'food')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
      <path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6" />
    </svg>
  )
}

export function RoutineIcon({ cat, c = '#15795A', style }: { cat: RoutineCat; c?: string; style?: CSSProperties }) {
  const p = { fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (cat === 'yoga')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <circle cx="12" cy="5" r="2" />
        <path d="M5 9l7 2 7-2M12 11v5M12 16l-4 5M12 16l4 5" />
      </svg>
    )
  if (cat === 'shop')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M6 8h12l-1 12H7z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
    </svg>
  )
}

export type DetailKey = 'pop' | 'humid' | 'wind' | 'feels' | 'uv' | 'dust'

export function DetailIcon({ name, c, style }: { name: DetailKey; c: string; style?: CSSProperties }) {
  const p = { fill: 'none', stroke: c, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'pop')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
      </svg>
    )
  if (name === 'humid')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
        <path d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" />
      </svg>
    )
  if (name === 'wind')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 14h15a2.5 2.5 0 1 1-2.5 2.5" />
      </svg>
    )
  if (name === 'feels')
    return (
      <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
        <path d="M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z" />
      </svg>
    )
  if (name === 'uv')
    return (
      <svg viewBox="0 0 24 24" {...full} fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" style={style}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...full} {...p} style={style}>
      <path d="M4 16a4 4 0 0 1 0-8h1M9 17a4 4 0 0 1 0-8M14 7h6M14 12h7M14 17h5" />
    </svg>
  )
}

export function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l4.5 4.5L19 7" />
    </svg>
  )
}

export function PlusIcon({ c = '#fff', w = 20 }: { c?: string; w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CloseIcon({ c = '#17150F', w = 15 }: { c?: string; w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

export function TrashIcon({ c = 'currentColor', w = 15 }: { c?: string; w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M7 7l1 13h8l1-13" />
    </svg>
  )
}

export function SparkleIcon({ c = '#5BD6A6', w = 19 }: { c?: string; w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill={c}>
      <path d="M12 2l1.6 4.9 4.9 1.6-4.9 1.6L12 15l-1.6-4.9L5.5 8.5l4.9-1.6z" />
    </svg>
  )
}

/** UV / 미세먼지 반원 게이지 */
export function Gauge({ value, max, color, big, small }: { value: number; max: number; color: string; big: string | number; small: string }) {
  const track = 188.5
  const frac = Math.max(0, Math.min(value / max, 1))
  const len = (frac * track).toFixed(1)
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#ECE8DF" strokeWidth="9" strokeLinecap="round" transform="rotate(135 50 50)" strokeDasharray="188.5 251.3" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" transform="rotate(135 50 50)" strokeDasharray={`${len} 251.3`} />
      <text x="50" y="45" textAnchor="middle" dominantBaseline="central" fontFamily="Pretendard,sans-serif" fontSize="28" fontWeight="800" fill="#17150F">
        {big}
      </text>
      <text x="50" y="89" textAnchor="middle" fontFamily="Pretendard,sans-serif" fontSize="12.5" fontWeight="800" fill={color}>
        {small}
      </text>
    </svg>
  )
}

export function BrandLogo({ size = 56, id = 'lg' }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="7" y1="41" x2="41" y2="7">
          <stop offset="0" stopColor="#FBC02D" />
          <stop offset="0.55" stopColor="#F79A2B" />
          <stop offset="1" stopColor="#F2682C" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${id})`} strokeWidth="3.4" strokeLinecap="round">
        <path d="M24 9.5V5.5" />
        <path d="M24 38.5v4" />
        <path d="M9.5 24H5.5" />
        <path d="M38.5 24h4" />
        <path d="M34.2 13.8l2.8-2.8" />
        <path d="M13.8 13.8l-2.8-2.8" />
        <path d="M34.2 34.2l2.8 2.8" />
        <path d="M13.8 34.2l-2.8 2.8" />
      </g>
      <circle cx="24" cy="24" r="10.5" fill="none" stroke={`url(#${id})`} strokeWidth="3.3" />
      <path d="M19.2 24.4l3.3 3.3L28.8 20.4" fill="none" stroke={`url(#${id})`} strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
