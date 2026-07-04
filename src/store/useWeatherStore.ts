import { create } from 'zustand'
import type { WeatherRaw } from '@/api/weatherApi'
import { fetchWeather } from '@/api/weatherApi'
import { dayState } from '@/lib/dates'

// 날짜(YYYY-MM-DD)별 실날씨 캐시. 과거 날짜는 be가 예보를 못 주므로 요청하지 않는다.
interface WeatherState {
  byDate: Record<string, WeatherRaw>
  loading: Record<string, boolean>
  loadDay: (lat: number, lng: number, dateKey: string) => Promise<void>
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  byDate: {},
  loading: {},
  loadDay: async (lat, lng, dateKey) => {
    if (dayState(dateKey) === 'past') return // 과거는 기록 없음 → fe에서 안내 처리
    if (get().byDate[dateKey] || get().loading[dateKey]) return
    set((s) => ({ loading: { ...s.loading, [dateKey]: true } }))
    try {
      const raw = await fetchWeather(lat, lng, dateKey)
      set((s) => ({ byDate: { ...s.byDate, [dateKey]: raw }, loading: { ...s.loading, [dateKey]: false } }))
    } catch {
      set((s) => ({ loading: { ...s.loading, [dateKey]: false } }))
    }
  },
}))
