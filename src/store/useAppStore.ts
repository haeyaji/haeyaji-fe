import { create } from 'zustand'
import { todayKey } from '@/lib/dates'

type View = 'home' | 'calendar'

interface AppState {
  authed: boolean
  view: View
  selId: string
  // drawers / modals
  aiOpen: boolean
  weatherOpen: boolean
  routineOpen: boolean
  addOpen: boolean
  mapOpen: boolean
  // toast
  toastText: string
  showToast: boolean

  login: (msg: string) => void
  logout: () => void
  setView: (v: View) => void
  setSelId: (id: string) => void
  openAi: () => void
  closeAi: () => void
  openWeather: () => void
  closeWeather: () => void
  openRoutine: () => void
  closeRoutine: () => void
  openAdd: () => void
  closeAdd: () => void
  openMap: () => void
  closeMap: () => void
  toast: (msg: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useAppStore = create<AppState>((set) => ({
  authed: false,
  view: 'home',
  selId: todayKey(),
  aiOpen: false,
  weatherOpen: false,
  routineOpen: false,
  addOpen: false,
  mapOpen: false,
  toastText: '',
  showToast: false,

  login: (msg) => {
    set({ authed: true, view: 'home' })
    useAppStore.getState().toast(msg)
  },
  logout: () =>
    set({ authed: false, aiOpen: false, weatherOpen: false, routineOpen: false, addOpen: false, mapOpen: false, view: 'home' }),
  setView: (view) => set({ view }),
  setSelId: (selId) => set({ selId }),
  openAi: () => set({ aiOpen: true }),
  closeAi: () => set({ aiOpen: false }),
  openWeather: () => set({ weatherOpen: true }),
  closeWeather: () => set({ weatherOpen: false }),
  openRoutine: () => set({ routineOpen: true }),
  closeRoutine: () => set({ routineOpen: false }),
  openAdd: () => set({ addOpen: true }),
  closeAdd: () => set({ addOpen: false }),
  openMap: () => set({ mapOpen: true }),
  closeMap: () => set({ mapOpen: false }),
  toast: (msg) => {
    set({ toastText: msg, showToast: true })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ showToast: false }), 2400)
  },
}))
