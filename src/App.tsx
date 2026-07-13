import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { timeOfDay } from '@/lib/weather'
import { usePrefStore } from '@/store/usePrefStore'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { OnboardingSurvey } from '@/features/auth/OnboardingSurvey'
import { HomeDashboard } from '@/features/home/HomeDashboard'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { KanbanPage } from '@/features/kanban/KanbanPage'
import { MyPage } from '@/features/profile/MyPage'
import { MeetupPage } from '@/features/meetup/MeetupPage'
import { AiDrawer } from '@/features/recommend/AiDrawer'
import { WeatherDrawer } from '@/features/weather/WeatherDrawer'
import { RoutineDrawer } from '@/features/routine/RoutineDrawer'
import { AddTaskModal } from '@/features/todo/AddTaskModal'
import { MapModal } from '@/features/map/MapModal'
import { Sidebar } from '@/components/Sidebar'
import { Fab } from '@/components/Fab'
import { Toast } from '@/components/Toast'

export default function App() {
  const { authed, view } = useAppStore()
  const surveyDone = usePrefStore((s) => s.surveyDone)
  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)

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

  if (!authed) {
    return (
      <>
        <LoginScreen />
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
        <main style={{ flex: 1, minWidth: 0 }}>{view === 'home' ? <HomeDashboard /> : view === 'kanban' ? <KanbanPage /> : view === 'mypage' ? <MyPage /> : view === 'meetup' ? <MeetupPage /> : <CalendarPage />}</main>
      </div>

      {/* overlays */}
      <Fab />
      <AiDrawer />
      <WeatherDrawer />
      <RoutineDrawer />
      <AddTaskModal />
      <MapModal />
      <Toast />
    </>
  )
}
