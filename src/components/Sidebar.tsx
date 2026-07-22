// 앱 셸 좌측 사이드바 (핸드오프 §4) — 프로토타입과 달리 전부 실동작:
// 홈/캘린더=view 전환, 루틴=드로어, 지도=모달, CTA=할일 추가. (AI 추천은 우하단 말풍선 FAB 전담)
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
function RoutineIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 13l2.5 2.5L16 11" /></svg>
}
function MeetIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4" /></svg>
}
function TodoIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...NAV_ICON}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6l.9.9 1.6-1.8M4.5 12l.9.9 1.6-1.8M4.5 18l.9.9 1.6-1.8" /></svg>
}

export function Sidebar() {
  const { view, setView, openMap, openRoutine, openAdd, openMeetupCreate, openFriendSearch, sidebarCollapsed: c, toggleSidebar, nickname, logout } = useAppStore()
  // 펼침이 기본 상태 — 화면 폭 대응은 #root zoom 분기가 하므로 자동 접힘 없음

  const items = [
    { key: 'home', label: '홈', icon: <HomeIcon />, active: view === 'home', onClick: () => setView('home') },
    { key: 'todo', label: '할 일', icon: <TodoIcon />, active: view === 'todo', onClick: () => setView('todo') },
    { key: 'calendar', label: '캘린더', icon: <CalIcon />, active: view === 'calendar', onClick: () => setView('calendar') },
    { key: 'meetup', label: '약속', icon: <MeetIcon />, active: view === 'meetup', onClick: () => setView('meetup') },
    { key: 'map', label: '지도', icon: <MapIcon />, active: false, onClick: openMap },
    { key: 'routine', label: '루틴', icon: <RoutineIcon />, active: false, onClick: openRoutine },
  ]

  // 현재 화면에 맞는 추가 버튼 (약속=약속 만들기, 마이페이지=친구 추가, 그 외=일정 추가)
  const cta =
    view === 'meetup'
      ? { label: '새 약속 만들기', onClick: openMeetupCreate }
      : view === 'mypage'
        ? { label: '친구 추가', onClick: openFriendSearch }
        : { label: '새 일정 추가', onClick: openAdd }

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

      {/* CTA — 현재 화면 맥락에 맞게 동작 (일정/약속/친구 추가) */}
      <div
        onClick={cta.onClick}
        className="lift"
        title={cta.label}
        style={{ marginTop: 26, height: 50, borderRadius: 15, background: '#17150F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
      >
        <PlusIcon w={17} />
        {!c && <div style={{ fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>{cta.label}</div>}
      </div>

      {/* 내비게이션 */}
      {!c && <div style={{ marginTop: 30, marginBottom: 10, paddingLeft: 8, fontSize: 13, fontWeight: 800, color: '#C0BAAD', letterSpacing: '1.2px' }}>메뉴</div>}
      <nav style={{ marginTop: c ? 28 : 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((it) => (
          <div
            key={it.key}
            onClick={it.onClick}
            className={it.active ? 'nav-item-active' : 'nav-item'}
            style={{
              height: 50,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: c ? 'center' : 'flex-start',
              gap: 12,
              padding: c ? 0 : '0 14px',
              cursor: 'pointer',
              color: it.active ? '#fff' : '#6B665B',
              background: it.active ? '#15795A' : 'transparent',
              boxShadow: it.active ? '0 8px 18px rgba(21,121,90,.28)' : 'none',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {it.icon}
            {!c && <span style={{ whiteSpace: 'nowrap' }}>{it.label}</span>}
            {!c && it.active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.85)' }} />}
          </div>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* 프로필 카드 → 마이페이지 */}
      <div onClick={() => setView('mypage')} className="hbtn" style={{ display: 'flex', alignItems: 'center', justifyContent: c ? 'center' : 'flex-start', gap: 12, background: view === 'mypage' ? '#EAF5EF' : c ? 'transparent' : '#F7F6F2', borderRadius: 16, padding: c ? 0 : '11px 12px', cursor: 'pointer', boxShadow: view === 'mypage' ? 'inset 0 0 0 2px #15795A' : 'none' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(21,121,90,.25)' }}>
          {nickname.slice(0, 1)}
        </div>
        {!c && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nickname}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#A39C8E' }}>무료 플랜</div>
            </div>
            <div onClick={(e) => { e.stopPropagation(); logout() }} title="로그아웃" className="hbtn" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A39C8E', cursor: 'pointer', background: '#fff' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
