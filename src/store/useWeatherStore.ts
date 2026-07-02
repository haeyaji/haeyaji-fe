import { create } from 'zustand'
import type { WeatherRaw } from '@/api/weatherApi'
import { fetchWeather } from '@/api/weatherApi'

interface WeatherState {
  raw: WeatherRaw | null
  loading: boolean
  error: string | null
  loadedKey: string | null // "lat,lng" 중복 호출 방지
  load: (lat: number, lng: number) => Promise<void>
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  raw: null,
  loading: false,
  error: null,
  loadedKey: null,
  load: async (lat, lng) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
    if (get().loading || get().loadedKey === key) return
    set({ loading: true, error: null })
    try {
      const raw = await fetchWeather(lat, lng)
      set({ raw, loading: false, loadedKey: key })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },
}))
