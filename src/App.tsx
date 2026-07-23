import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useTodoStore } from '@/store/useTodoStore'
import { todayKey } from '@/lib/dates'
import { timeOfDay } from '@/lib/weather'
import { usePrefStore } from '@/store/usePrefStore'
import { fetchMe, getMemberProfile } from '@/api/authApi'
import { getPreferences } from '@/api/personalizeApi'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { ProfileSetup } from '@/features/auth/ProfileSetup'
import { OnboardingSurvey } from '@/features/auth/OnboardingSurvey'
import { HomeDashboard } from '@/features/home/HomeDashboard'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { TodoListPage } from '@/features/todo/TodoListPage'
import { MyPage } from '@/features/profile/MyPage'
import { MeetupPage } from '@/features/meetup/MeetupPage'
import { AiDrawer } from '@/features/recommend/AiDrawer'
import { WeatherDrawer } from '@/features/weather/WeatherDrawer'
import { RoutineDrawer } from '@/features/routine/RoutineDrawer'
import { NotificationBell } from '@/features/notification/NotificationBell'
import { AddTaskModal } from '@/features/todo/AddTaskModal'
import { LabelManagerModal } from '@/features/todo/LabelManagerModal'
import { MapModal } from '@/features/map/MapModal'
import { Sidebar } from '@/components/Sidebar'
import { Fab } from '@/components/Fab'
import { Toast } from '@/components/Toast'

export default function App() {
  const { authed, view } = useAppStore()
  const surveyDone = usePrefStore((s) => s.surveyDone)
  const nickname = usePrefStore((s) => s.nickname)
  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)
  const selId = useAppStore((s) => s.selId)
  const [authChecked, setAuthChecked] = useState(false) // /me 확인 전엔 로그인화면 깜빡임 방지

  // 부팅 시 세션 복원 + OAuth 콜백 처리 (be는 쿠키로 세션 유지 → 새로고침에도 로그인 유지)
  useEffect(() => {
    let cancelled = false
    // 로그인 시 be가 직접 심은 XSRF-TOKEN(path=/api)은 SPA(page /)에서 못 읽음 → 제거.
    // 이후 프록시 경유 요청이 path=/ 로 재발급하면 JS가 읽어 CSRF 헤더로 실어보낼 수 있다.
    document.cookie = 'XSRF-TOKEN=; path=/api; max-age=0; SameSite=Lax'
    const isCallback = window.location.pathname === '/oauth/callback'
    const isNewMember = new URLSearchParams(window.location.search).get('isNewMember') === 'true'
    if (isCallback) history.replaceState(null, '', '/') // 콜백 쿼리 URL 정리
    ;(async () => {
      try {
        const me = await fetchMe() // 쿠키로 세션 확인 (401이면 client 인터셉터가 reissue 시도)
        if (cancelled) return
        // 계정 변경/최초 실로그인 감지 → 이전(또는 목업) 계정의 로컬 데이터 제거 후 클린 재하이드레이트.
        // (localStorage는 브라우저 단위라 다른 계정 데이터가 남는 걸 방지. be 붙으면 서버 데이터로 대체)
        const ACCOUNT_KEY = 'haeyaji-account'
        if (localStorage.getItem(ACCOUNT_KEY) !== me.memberId) {
          ;['haeyaji-friends', 'haeyaji-meetups', 'haeyaji-notis', 'haeyaji-routines', 'haeyaji-labels', 'haeyaji-pref'].forEach((k) => localStorage.removeItem(k))
          localStorage.setItem(ACCOUNT_KEY, me.memberId)
          window.location.reload() // 빈 localStorage로 스토어 재하이드레이트 (한 번만; 재로드 후 account 일치 → 재발 안 함)
          return
        }
        // 회원 프로필에서 닉네임 로드 (신규는 null → ProfileSetup에서 입력·PATCH). best-effort.
        try { const p = await getMemberProfile(); if (p.nickname) usePrefStore.setState({ nickname: p.nickname }) } catch { /* be 미가동/미구현 → 로컬 폴백 */ }
        // be 저장 설문 복원 (다른 기기·계정 wipe 후에도 취향 유지 → 설문 재노출 방지). best-effort.
        try { usePrefStore.getState().hydrateFromServer(await getPreferences()) } catch { /* be 미가동/미저장 무시 */ }
        if (cancelled) return
        useAppStore.getState().login(isCallback ? '로그인했어요' : undefined)
        if (isCallback && isNewMember) usePrefStore.setState({ surveyDone: false }) // 신규 → 온보딩
      } catch {
        /* 미인증 → 로그인 화면 */
      } finally {
        if (!cancelled) setAuthChecked(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // 세션 만료(refresh까지 실패) → 로그인 화면으로 (client 인터셉터가 dispatch)
  useEffect(() => {
    const onExpired = () => { if (useAppStore.getState().authed) useAppStore.getState().logout() }
    window.addEventListener('haeyaji:auth-expired', onExpired)
    return () => window.removeEventListener('haeyaji:auth-expired', onExpired)
  }, [])

  // 로그인 후 선택 날짜 + 오늘 할 일 로드 (be GET /todos?date=)
  useEffect(() => {
    if (!authed) return
    useTodoStore.getState().loadDate(selId)
    useTodoStore.getState().loadDate(todayKey())
  }, [authed, selId])

  // 위치 1회 획득 (거부/미지원 시 기본값 강남)
  useEffect(() => {
    useLocationStore.getState().init()
  }, [])

  const weatherSelId = useAppStore((s) => s.weatherSelId)

  // 위치·날씨선택날짜 기준 실날씨 로드 (날짜별 캐시)
  useEffect(() => {
    useWeatherStore.getState().loadDay(lat, lng, weatherSelId)
  }, [lat, lng, weatherSelId])

  // 1분 틱: TTL 지난 날씨 재조회 + 시간대(dawn/day/dusk/night) 경계에서 배경 리렌더
  const [, setTod] = useState(timeOfDay())
  useEffect(() => {
    const t = setInterval(() => {
      useWeatherStore.getState().loadDay(lat, lng, weatherSelId)
      setTod(timeOfDay()) // 같은 값이면 리렌더 스킵
    }, 60_000)
    return () => clearInterval(t)
  }, [lat, lng, weatherSelId])

  // 세션 확인 중엔 로그인화면/앱 대신 빈 캔버스 (깜빡임 방지)
  if (!authChecked) {
    return <div style={{ minHeight: 'var(--full-vh)', background: 'var(--canvas)' }} />
  }

  if (!authed) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    )
  }

  // 신규(또는 닉네임 미설정) 회원: 표시 이름부터 입력 (ERD member.nickname 대응)
  if (!nickname) {
    return (
      <>
        <ProfileSetup />
        <Toast />
      </>
    )
  }

  // 회원가입(로그인) 직후 1회: 개인화 설문 (완료/스킵 여부는 persist)
  if (!surveyDone) {
    return (
      <>
        <OnboardingSurvey />
        <Toast />
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'var(--full-vh)' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* 상단 바 — 우측 알림 벨 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px 28px 0', flexShrink: 0 }}>
            <NotificationBell />
          </div>
          <div style={{ flex: 1, minWidth: 0, marginTop: -18 }}>{view === 'home' ? <HomeDashboard /> : view === 'todo' ? <TodoListPage /> : view === 'mypage' ? <MyPage /> : view === 'meetup' ? <MeetupPage /> : <CalendarPage />}</div>
        </main>
      </div>

      {/* overlays */}
      <Fab />
      <AiDrawer />
      <WeatherDrawer />
      <RoutineDrawer />
      <AddTaskModal />
      <LabelManagerModal />
      <MapModal />
      <Toast />
    </>
  )
}
