import { create } from 'zustand'

interface MapState {
  mapSelId: string | null
  mapSearch: string
  mapOrigin: string
  setMapSel: (id: string | null) => void
  setMapSearch: (v: string) => void
  setMapOrigin: (v: string) => void
}

export const useMapStore = create<MapState>((set) => ({
  mapSelId: null,
  mapSearch: '',
  mapOrigin: '현재 위치 · 샌프란시스코',
  setMapSel: (mapSelId) => set({ mapSelId }),
  setMapSearch: (mapSearch) => set({ mapSearch }),
  setMapOrigin: (mapOrigin) => set({ mapOrigin }),
}))
