import { create } from 'zustand'

export interface OriginPoint {
  lat: number
  lng: number
  label: string
}

interface MapState {
  mapSelId: string | null
  mapSearch: string
  origin: OriginPoint | null // null = 현재 위치 사용, 값 있으면 사용자 지정 출발지
  setMapSel: (id: string | null) => void
  setMapSearch: (v: string) => void
  setOrigin: (o: OriginPoint) => void
  resetOrigin: () => void
}

export const useMapStore = create<MapState>((set) => ({
  mapSelId: null,
  mapSearch: '',
  origin: null,
  setMapSel: (mapSelId) => set({ mapSelId }),
  setMapSearch: (mapSearch) => set({ mapSearch }),
  setOrigin: (origin) => set({ origin }),
  resetOrigin: () => set({ origin: null }),
}))
