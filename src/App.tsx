import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { HomeDashboard } from '@/features/home/HomeDashboard'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { AiDrawer } from '@/features/recommend/AiDrawer'
import { WeatherDrawer } from '@/features/weather/WeatherDrawer'
import { RoutineDrawer } from '@/features/routine/RoutineDrawer'
import { AddTaskModal } from '@/features/todo/AddTaskModal'
import { MapModal } from '@/features/map/MapModal'
import { Fab } from '@/components/Fab'
import { Toast } from '@/components/Toast'

export default function App() {
  const { authed, view } = useAppStore()
  const lat = useLocationStore((s) => s.lat)
  const lng = useLocationStore((s) => s.lng)

  // 위치 1회 획득 (거부/미지원 시 기본값 강남)
  useEffect(() => {
    useLocationStore.getState().init()
  }, [])

  const selId = useAppStore((s) => s.selId)

  // 위치·선택날짜 기준 실날씨 로드 (날짜별 캐시)
  useEffect(() => {
    useWeatherStore.getState().loadDay(lat, lng, selId)
  }, [lat, lng, selId])

  if (!authed) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    )
  }

  return (
    <>
      {view === 'home' ? <HomeDashboard /> : <CalendarPage />}

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
