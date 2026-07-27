import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey } from '@/lib/dates'
import { logoutApi } from '@/api/authApi'

type View = 'home' | 'todo' | 'calendar' | 'mypage' | 'meetup'

interface AppState {
  authed: boolean
  sidebarCollapsed: boolean
  view: View
  selId: string // 할일·캘린더용 선택 날짜
  weatherSelId: string // 날씨(히어로·지표·주간예보)용 — 할일 이동과 독립
  pendingInvite: string | null // /invite/{shareToken} 진입 시 약속 화면이 자동으로 열 토큰
  // drawers / modals
  aiOpen: boolean
  weatherOpen: boolean
  routineOpen: boolean
  addOpen: boolean
  mapOpen: boolean
  meetupCreateOpen: boolean // 약속 만들기 모달 (사이드바 컨텍스트 추가 버튼에서 열림)
  friendSearchOpen: boolean // 친구 추가/검색 모달 (마이페이지 컨텍스트 추가 버튼에서 열림)
  labelManagerOpen: boolean // 분류(라벨) 관리 모달
  notiOpen: boolean // 알림 드로어
  // toast
  toastText: string
  showToast: boolean

  login: (msg?: string) => void // 세션 확인(/me) 성공 후 호출. msg 있으면 토스트.
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
  openMeetupCreate: () => void
  closeMeetupCreate: () => void
  openFriendSearch: () => void
  closeFriendSearch: () => void
  openLabelManager: () => void
  closeLabelManager: () => void
  openNoti: () => void
  closeNoti: () => void
  toast: (msg: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  authed: false,
  sidebarCollapsed: false,
  view: 'home',
  selId: todayKey(),
  weatherSelId: todayKey(),
  pendingInvite: null,
  aiOpen: false,
  weatherOpen: false,
  routineOpen: false,
  addOpen: false,
  mapOpen: false,
  meetupCreateOpen: false,
  friendSearchOpen: false,
  labelManagerOpen: false,
  notiOpen: false,
  toastText: '',
  showToast: false,

  login: (msg) => {
    set({ authed: true }) // view는 persist된 값 유지(새로고침 시 현재 화면 보존). 초대 링크는 부팅에서 meetup으로 덮음.
    if (msg) useAppStore.getState().toast(msg)
  },
  logout: () => {
    logoutApi().catch(() => {}) // 쿠키 만료는 be에 위임, 실패해도 클라는 정리
    // 로컬 데이터는 남겨둔다(같은 계정 재로그인 시 유지). 다른 계정으로 로그인하면 부팅의 계정단위 wipe가 정리.
    set({ authed: false, aiOpen: false, weatherOpen: false, routineOpen: false, addOpen: false, mapOpen: false, meetupCreateOpen: false, friendSearchOpen: false, labelManagerOpen: false, view: 'home' })
  },
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
  openMeetupCreate: () => set({ meetupCreateOpen: true }),
  closeMeetupCreate: () => set({ meetupCreateOpen: false }),
  openFriendSearch: () => set({ friendSearchOpen: true }),
  closeFriendSearch: () => set({ friendSearchOpen: false }),
  openLabelManager: () => set({ labelManagerOpen: true }),
  closeLabelManager: () => set({ labelManagerOpen: false }),
  openNoti: () => set({ notiOpen: true }),
  closeNoti: () => set({ notiOpen: false }),
  toast: (msg) => {
    set({ toastText: msg, showToast: true })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ showToast: false }), 2400)
  },
    }),
    // 새로고침해도 현재 화면 유지 → home으로 튕기지 않음. (인증·모달 등 나머지는 매번 초기화)
    { name: 'haeyaji-app', partialize: (s) => ({ view: s.view }) },
  ),
)
