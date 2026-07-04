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
import { Sidebar } from '@/components/Sidebar'
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

  const weatherSelId = useAppStore((s) => s.weatherSelId)

  // 위치·날씨선택날짜 기준 실날씨 로드 (날짜별 캐시)
  useEffect(() => {
    useWeatherStore.getState().loadDay(lat, lng, weatherSelId)
  }, [lat, lng, weatherSelId])

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
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0 }}>{view === 'home' ? <HomeDashboard /> : <CalendarPage />}</main>
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
