// be의 날씨 중계. 현재는 stub (UI는 lib/weather mock으로 동작).
import type { DayWeather } from '@/types'
import { http } from './client'

export function fetchWeather(lat: number, lng: number, date: string): Promise<DayWeather> {
  return http<DayWeather>(`/weather?lat=${lat}&lng=${lng}&date=${encodeURIComponent(date)}`)
}
