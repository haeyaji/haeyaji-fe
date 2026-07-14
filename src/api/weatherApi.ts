// be의 날씨 중계 (FR-2). fe는 위치를 보내고 be가 기상청 조회해 응답.
// GET {VITE_BE_BASE}/weather?lat&lng&date  (be context-path /api 포함)
import type { WeatherCond } from '@/types'
import { be } from './client'

export interface HourlyRaw {
  time: string // "HH:mm"
  temp: number
  pop: number
}

// be WeatherResponse (camelCase). 일부 필드는 null 가능 → fe에서 파생/폴백.
export interface WeatherRaw {
  cond: WeatherCond | string
  condKo: string
  temp: number
  hi: number
  lo: number
  feels: number | null
  pop: number
  humidity: number | null
  windMs: number | null
  uvIndex: number | null
  pm10: number | null
  pm25: number | null
  hourly: HourlyRaw[]
}

export async function fetchWeather(lat: number, lng: number, date?: string): Promise<WeatherRaw> {
  const res = await be.get<WeatherRaw>('/weather', { params: { lat, lng, ...(date ? { date } : {}) } })
  return res.data
}
