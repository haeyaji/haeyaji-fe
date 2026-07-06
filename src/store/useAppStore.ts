import { create } from 'zustand'
import { todayKey } from '@/lib/dates'

type View = 'home' | 'calendar' | 'kanban'

interface AppState {
  authed: boolean
  nickname: string // 회원가입 닉네임 (be 인증 붙으면 그 값으로 대체)
  sidebarCollapsed: boolean
  view: View
  selId: string // 할일·캘린더용 선택 날짜
  weatherSelId: string // 날씨(히어로·지표·주간예보)용 — 할일 이동과 독립
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
  toggleSidebar: () => void
  setView: (v: View) => void
  setSelId: (id: string) => void
  setWeatherSelId: (id: string) => void
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
  nickname: '알렉스', // TODO: be 회원가입 연동 시 실제 닉네임
  sidebarCollapsed: false,
  view: 'home',
  selId: todayKey(),
  weatherSelId: todayKey(),
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
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setView: (view) => set({ view }),
  setSelId: (selId) => set({ selId }),
  setWeatherSelId: (weatherSelId) => set({ weatherSelId }),
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
