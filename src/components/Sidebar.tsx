// 앱 셸 좌측 사이드바 (핸드오프 §4) — 프로토타입과 달리 전부 실동작:
// 홈/캘린더=view 전환, 루틴=드로어, 지도=모달, CTA=할일 추가. (AI 추천은 우하단 말풍선 FAB 전담)
import { useEffect } from 'react'
import { BrandLogo, PlusIcon } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'

const NAV_ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function HomeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" /></svg>
}
function CalIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
}
function MapIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
}
function BoardIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><rect x="3" y="4" width="5.5" height="16" rx="1.5" /><rect x="10.5" y="4" width="5.5" height="10" rx="1.5" /><rect x="18" y="4" width="3" height="13" rx="1.5" /></svg>
}
function RoutineIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 13l2.5 2.5L16 11" /></svg>
}

export function Sidebar() {
  const { view, setView, openMap, openRoutine, openAdd, sidebarCollapsed: c, toggleSidebar, nickname, logout } = useAppStore()

  // 노트북 이하 폭에서는 처음부터 접힘 (콘텐츠 1220px 확보)
  useEffect(() => {
    if (window.innerWidth < 1700 && !useAppStore.getState().sidebarCollapsed) toggleSidebar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items = [
    { key: 'home', label: '홈', icon: <HomeIcon />, active: view === 'home', onClick: () => setView('home') },
    { key: 'calendar', label: '캘린더', icon: <CalIcon />, active: view === 'calendar', onClick: () => setView('calendar') },
    { key: 'kanban', label: '칸반보드', icon: <BoardIcon />, active: view === 'kanban', onClick: () => setView('kanban') },
    { key: 'map', label: '지도', icon: <MapIcon />, active: false, onClick: openMap },
    { key: 'routine', label: '루틴', icon: <RoutineIcon />, active: false, onClick: openRoutine },
  ]

  return (
    <aside
      style={{
        width: c ? 80 : 262,
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid rgba(24,21,15,.06)',
        position: 'sticky',
        top: 0,
        height: 'var(--full-vh)',
        padding: c ? '26px 16px' : '26px 22px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .22s ease, padding .22s ease',
        overflow: 'hidden',
      }}
    >
      {/* 로고 행 */}
      <div style={{ display: 'flex', flexDirection: c ? 'column' : 'row', alignItems: 'center', gap: c ? 10 : 10 }}>
        <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BrandLogo size={40} id="sblg" />
        </div>
        {!c && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.4px' }}>해야지</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>날씨 기반 할 일</div>
          </div>
        )}
        <div
          onClick={toggleSidebar}
          className="hbtn"
          title={c ? '펼치기' : '접기'}
          style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" {...NAV_ICON} style={{ transform: c ? 'rotate(180deg)' : 'none', transition: 'transform .22s ease' }}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </div>
      </div>

      {/* CTA */}
      <div
        onClick={openAdd}
        className="lift"
        style={{ marginTop: 26, height: 50, borderRadius: 15, background: '#17150F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
      >
        <PlusIcon w={17} />
        {!c && <div style={{ fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>새 일정 추가</div>}
      </div>

      {/* 내비게이션 */}
      <nav style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it) => (
          <div
            key={it.key}
            onClick={it.onClick}
            className="hbtn"
            style={{
              height: 48,
              borderRadius: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: c ? 'center' : 'flex-start',
              gap: 11,
              padding: c ? 0 : '0 13px',
              cursor: 'pointer',
              color: it.active ? '#15795A' : '#8B8579',
              background: it.active ? 'rgba(21,121,90,.09)' : 'transparent',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {it.icon}
            {!c && <span style={{ whiteSpace: 'nowrap' }}>{it.label}</span>}
          </div>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* 프로필 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: c ? 'center' : 'flex-start', gap: 11 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#17150F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800, flexShrink: 0 }}>
          {nickname.slice(0, 1)}
        </div>
        {!c && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nickname}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#A39C8E' }}>무료 플랜</div>
            </div>
            <div onClick={logout} title="로그아웃" className="hbtn" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A39C8E', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
