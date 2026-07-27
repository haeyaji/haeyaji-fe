import { create } from 'zustand'
import { loadKakaoMaps } from '@/lib/kakaoLoader'

// navigator.geolocation 기반 현재 위치. 거부/미지원 시 강남역 기본값.
const DEFAULT = { lat: 37.4979, lng: 127.0276 }

interface LocationState {
  lat: number
  lng: number
  label: string
  region: string // 역지오코딩된 동네명 (예: "역삼동")
  source: 'geo' | 'default'
  ready: boolean
  locating: boolean
  init: () => void
  locate: () => void
  applyRegion: (lat: number, lng: number) => void
  setLocation: (lat: number, lng: number, label?: string) => void // 수동(지명 검색) 위치 지정
}

// 좌표 → 행정동명 (카카오 services 역지오코딩)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const maps = await loadKakaoMaps()
    return await new Promise<string>((resolve) => {
      new maps.services.Geocoder().coord2RegionCode(lng, lat, (res: Record<string, string>[], status: string) => {
        if (status === maps.services.Status.OK && res.length) {
          const r = res.find((x) => x.region_type === 'H') ?? res[0]
          resolve(r.region_3depth_name || r.region_2depth_name || '현재 위치')
        } else resolve('현재 위치')
      })
    })
  } catch {
    return '현재 위치'
  }
}

export const useLocationStore = create<LocationState>((set, get) => ({
  ...DEFAULT,
  label: '강남역 · 기본 위치',
  region: '',
  source: 'default',
  ready: false,
  locating: false,
  init: () => {
    if (get().ready) return
    set({ ready: true })
    get().applyRegion(get().lat, get().lng) // 기본 좌표 지역명 먼저
    get().locate()
  },
  // 현재 위치 재요청
  locate: () => {
    if (!('geolocation' in navigator) || get().locating) return
    set({ locating: true })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        set({ lat, lng, label: '현위치', source: 'geo', locating: false })
        get().applyRegion(lat, lng)
      },
      () => set({ locating: false }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  },
  applyRegion: (lat, lng) => {
    reverseGeocode(lat, lng).then((region) => set({ region }))
  },
  setLocation: (lat, lng, label) => {
    set({ lat, lng, label: label ?? '지정 위치', source: 'geo', locating: false })
    get().applyRegion(lat, lng)
  },
}))
