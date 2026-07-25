// 상단 우측 알림 벨 + 드롭다운 패널. 로컬 알림 + 실제 공유 초대(be #59 GET /todos/invitations) 수락/거절.
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useOverlay } from '@/lib/useOverlay'
import { useNotificationStore, timeAgo, type AppNotification, type NotiCategory } from '@/store/useNotificationStore'
import { useShareInboxStore } from '@/store/useShareInboxStore'
import { dateFullLabel } from '@/lib/dates'

const CAT_STYLE: Record<NotiCategory, { bg: string; color: string }> = {
  INVITE: { bg: '#EAF2F8', color: '#3F82C2' },
  TODO: { bg: '#E4F2EC', color: '#15795A' },
}

function NotiIcon({ n }: { n: AppNotification }) {
  const c = CAT_STYLE[n.category].color
  if (n.category === 'INVITE')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  if (n.type === 'TODO_WEATHER_ALERT')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" /><path d="M8 19v2M12 19v2M16 19v2" /></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
}

export function NotificationBell() {
  const { authed, notiOpen, openNoti, closeNoti } = useAppStore()
  useOverlay(notiOpen, closeNoti)
  const { notifications, markRead, markAllRead, remove } = useNotificationStore()
  const { pending, load, accept, reject } = useShareInboxStore()
  useEffect(() => { if (authed) void load() }, [authed, load])
  useEffect(() => { if (notiOpen) void load() }, [notiOpen, load]) // 열 때마다 최신 초대 재조회
  if (!authed) return null
  const unread = notifications.filter((n) => !n.isRead).length
  const badgeCount = unread + pending.length

  return (
    <>
      {/* 상단 바 안의 벨 (인라인) */}
      <div
        onClick={() => (notiOpen ? closeNoti() : openNoti())}
        className="lift"
        title="알림"
        style={{ position: 'relative', width: 46, height: 46, borderRadius: 14, background: '#fff', border: '1px solid rgba(24,21,15,.08)', boxShadow: '0 1px 2px rgba(24,21,15,.05), 0 6px 18px rgba(24,21,15,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#3B372E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        {badgeCount > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, padding: '0 5px', borderRadius: 20, background: '#D9614F', color: '#fff', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--canvas)' }}>{badgeCount}</span>
        )}
      </div>

      {notiOpen && (
        <>
          {/* 바깥 클릭 닫기 */}
          <div onClick={closeNoti} style={{ position: 'fixed', inset: 0, zIndex: 47 }} />
          {/* 드롭다운 패널 */}
          <div style={{ position: 'fixed', top: 74, right: 28, zIndex: 48, width: 'min(400px, calc(100vw - 40px))', maxHeight: '72vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(24,21,15,.28), 0 4px 14px rgba(24,21,15,.12)', border: '1px solid rgba(24,21,15,.06)', overflow: 'hidden', animation: 'rb-pop .18s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #EFEDE6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>알림</div>
                {unread > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#D9614F', padding: '2px 8px', borderRadius: 20 }}>{unread}</span>}
              </div>
              {unread > 0 && <div onClick={markAllRead} className="hbtn" style={{ fontSize: 12.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>모두 읽음</div>}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {/* 실제 공유 초대 (be #59) — 수락/거절 액션 */}
              {pending.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: 11, padding: '12px', borderRadius: 13, background: '#F4F8FB', border: '1px solid #D7E4EF' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3F82C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#17150F' }}>할 일 공유 초대</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3B372E', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B8579', marginTop: 2 }}>{t.date ? dateFullLabel(t.date) : ''}{t.time ? ` · ${t.time.slice(0, 5)}` : ''}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                      <div onClick={() => accept(t.id)} className="lift" style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: '#15795A', padding: '7px 15px', borderRadius: 10, cursor: 'pointer' }}>수락</div>
                      <div onClick={() => reject(t.id)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', background: '#EAE7DF', padding: '7px 15px', borderRadius: 10, cursor: 'pointer' }}>거절</div>
                    </div>
                  </div>
                </div>
              ))}

              {pending.length === 0 && notifications.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#B6BCC7', gap: 10, padding: '40px 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CAD0DA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>새 알림이 없어요</div>
                </div>
              ) : (
                notifications.map((n) => {
                  const cs = CAT_STYLE[n.category]
                  return (
                    <div key={n.id} onClick={() => markRead(n.id)} className="hbtn" style={{ display: 'flex', gap: 11, padding: '12px 12px', borderRadius: 13, background: n.isRead ? '#fff' : '#FBFAF6', border: `1px solid ${n.isRead ? '#EDEBE4' : '#E8E1CE'}`, cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NotiIcon n={n} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D9614F', flexShrink: 0 }} />}
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#17150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                        </div>
                        {n.body && <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8B8579', marginTop: 3, lineHeight: 1.45 }}>{n.body}</div>}
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#B6BCC7', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); remove(n.id) }} className="hbtn" title="삭제" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
