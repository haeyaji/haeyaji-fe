// 알림 드로어 (be notification 대응, 현재 로컬). 우측 슬라이드 패널 — 읽음/삭제/모두읽음.
import { CloseIcon } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'
import { useNotificationStore, timeAgo, type AppNotification, type NotiCategory } from '@/store/useNotificationStore'

const CAT_STYLE: Record<NotiCategory, { bg: string; color: string }> = {
  INVITE: { bg: '#EAF2F8', color: '#3F82C2' },
  TODO: { bg: '#E4F2EC', color: '#15795A' },
}

function NotiIcon({ n }: { n: AppNotification }) {
  const c = CAT_STYLE[n.category].color
  // 초대류 = 사람, 투두류 = 체크/종
  if (n.category === 'INVITE')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  if (n.type === 'TODO_WEATHER_ALERT')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" /><path d="M8 19v2M12 19v2M16 19v2" /></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
}

export function NotificationDrawer() {
  const open = useAppStore((s) => s.notiOpen)
  const close = useAppStore((s) => s.closeNoti)
  const { notifications, markRead, markAllRead, remove } = useNotificationStore()
  if (!open) return null
  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <>
      <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 44, background: 'rgba(24,21,15,.3)', animation: 'rb-fade .18s ease' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 45, width: 420, maxWidth: '100%', background: 'var(--canvas)', display: 'flex', flexDirection: 'column', boxShadow: '-26px 0 56px rgba(24,21,15,.2)', animation: 'rb-drawer .3s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', background: '#fff', borderBottom: '1px solid #E4E7EE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.4px' }}>알림</div>
            {unread > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#D9614F', padding: '2px 8px', borderRadius: 20 }}>{unread}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unread > 0 && <div onClick={markAllRead} className="hbtn" style={{ fontSize: 12.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>모두 읽음</div>}
            <div onClick={close} style={{ width: 30, height: 30, borderRadius: 10, background: '#E9EDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CloseIcon /></div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#B6BCC7', gap: 10, padding: 30 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#CAD0DA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <div style={{ fontSize: 15, fontWeight: 600 }}>새 알림이 없어요</div>
            </div>
          ) : (
            notifications.map((n) => {
              const cs = CAT_STYLE[n.category]
              return (
                <div key={n.id} onClick={() => markRead(n.id)} className="hbtn" style={{ display: 'flex', gap: 12, padding: '13px 14px', borderRadius: 14, background: n.isRead ? '#fff' : '#FBFAF6', border: `1px solid ${n.isRead ? '#EDEBE4' : '#E8E1CE'}`, cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NotiIcon n={n} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D9614F', flexShrink: 0 }} />}
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: '#17150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                    </div>
                    {n.body && <div style={{ fontSize: 13, fontWeight: 600, color: '#8B8579', marginTop: 3, lineHeight: 1.45 }}>{n.body}</div>}
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#B6BCC7', marginTop: 5 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); remove(n.id) }} className="hbtn" title="삭제" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}><CloseIcon w={13} c="currentColor" /></div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
