import { create } from 'zustand'

// navigator.geolocation 기반 현재 위치. 거부/미지원 시 강남역 기본값.
// Kakao는 한국 좌표만 유효 → 기본값도 국내.
const DEFAULT = { lat: 37.4979, lng: 127.0276 }

interface LocationState {
  lat: number
  lng: number
  label: string
  source: 'geo' | 'default'
  ready: boolean
  locating: boolean
  init: () => void
  locate: () => void
}

export const useLocationStore = create<LocationState>((set, get) => ({
  ...DEFAULT,
  label: '강남역 · 기본 위치',
  source: 'default',
  ready: false,
  locating: false,
  init: () => {
    if (get().ready) return
    set({ ready: true })
    get().locate()
  },
  // 현재 위치 재요청 (지도 열 때마다 호출 → 항상 최신 내 위치)
  locate: () => {
    if (!('geolocation' in navigator) || get().locating) return
    set({ locating: true })
    navigator.geolocation.getCurrentPosition(
      (pos) => set({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: '현재 위치', source: 'geo', locating: false }),
      () => set({ locating: false }), // 거부/실패 시 기존값(기본 or 이전) 유지
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  },
}))
