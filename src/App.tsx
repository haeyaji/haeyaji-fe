import { useAppStore } from '@/store/useAppStore'
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
