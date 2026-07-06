import { create } from 'zustand'
import type { WeatherRaw } from '@/api/weatherApi'
import { fetchWeather } from '@/api/weatherApi'
import { dayState } from '@/lib/dates'

// 날짜(YYYY-MM-DD)별 실날씨 캐시.
// - 좌표도 키에 포함: 기본좌표(강남)로 먼저 받았어도 실위치 잡히면 다시 받아 갱신
// - 실패 시 자동 재시도(최대 2회): 첫 로드 폴백 고정 방지
interface WeatherState {
  byDate: Record<string, WeatherRaw>
  fetchedWith: Record<string, string> // dateKey → "lat,lng" (어느 좌표로 받은 데이터인지)
  loading: Record<string, boolean>
  retries: Record<string, number>
  loadDay: (lat: number, lng: number, dateKey: string) => Promise<void>
}

const coordKey = (lat: number, lng: number) => `${lat.toFixed(2)},${lng.toFixed(2)}`

export const useWeatherStore = create<WeatherState>((set, get) => ({
  byDate: {},
  fetchedWith: {},
  loading: {},
  retries: {},
  loadDay: async (lat, lng, dateKey) => {
    if (dayState(dateKey) === 'past') return // 과거는 기록 없음 → fe에서 안내 처리
    const ck = coordKey(lat, lng)
    if (get().loading[dateKey]) return
    if (get().byDate[dateKey] && get().fetchedWith[dateKey] === ck) return // 같은 좌표로 이미 로드됨

    set((s) => ({ loading: { ...s.loading, [dateKey]: true } }))
    try {
      const raw = await fetchWeather(lat, lng, dateKey)
      set((s) => ({
        byDate: { ...s.byDate, [dateKey]: raw },
        fetchedWith: { ...s.fetchedWith, [dateKey]: ck },
        loading: { ...s.loading, [dateKey]: false },
        retries: { ...s.retries, [dateKey]: 0 },
      }))
    } catch {
      set((s) => ({ loading: { ...s.loading, [dateKey]: false } }))
      // 자동 재시도 (최대 2회) — 새로고침 없이 회복
      const n = get().retries[dateKey] ?? 0
      if (n < 2) {
        set((s) => ({ retries: { ...s.retries, [dateKey]: n + 1 } }))
        setTimeout(() => get().loadDay(lat, lng, dateKey), 2500)
      }
    }
  },
}))
