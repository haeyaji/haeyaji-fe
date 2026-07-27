// 상단 우측 알림 벨 — be-56 실 피드(GET /notifications) + 받은 공유 초대(be-59 /todos/invitations).
// 타입별 액션: 미팅=참여/보기(linkToken), 친구요청=수락/거절(refId), 공유초대=아래 전용 섹션, 그 외=읽음.
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useOverlay } from '@/lib/useOverlay'
import { useNotificationStore, timeAgo, type NotiItem, type NotiCategory } from '@/store/useNotificationStore'
import { useShareInboxStore } from '@/store/useShareInboxStore'
import { useFriendStore } from '@/store/useFriendStore'
import { dateFullLabel } from '@/lib/dates'

const CAT_STYLE: Record<NotiCategory, { bg: string; color: string }> = {
  INVITE: { bg: '#EAF2F8', color: '#3F82C2' },
  TODO: { bg: '#E4F2EC', color: '#15795A' },
  FRIEND: { bg: '#F0ECF8', color: '#7B5EC2' },
}

function NotiIcon({ n }: { n: NotiItem }) {
  const c = CAT_STYLE[n.category].color
  if (n.category === 'FRIEND' || n.type === 'MEETING_INVITE' || n.type === 'SHARE_INVITE')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  if (n.type === 'MEETING_CONFIRMED')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M8 2.5v4M16 2.5v4M9 14l2 2 4-4" /></svg>
  if (n.type === 'TODO_WEATHER_ALERT')
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" /><path d="M8 19v2M12 19v2M16 19v2" /></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
}

export function NotificationBell() {
  const { authed, notiOpen, openNoti, closeNoti } = useAppStore()
  useOverlay(notiOpen, closeNoti)
  const { notifications, unread, hasNext, category, load, loadMore, setCategory, markRead, markAllRead, remove } = useNotificationStore()
  const { pending, meetingInvites, load: loadInvites, accept, reject, rejectMeeting } = useShareInboxStore()
  const friendAccept = useFriendStore((s) => s.accept)
  const friendReject = useFriendStore((s) => s.reject)

  useEffect(() => { if (authed) { void load(); void loadInvites() } }, [authed, load, loadInvites])
  useEffect(() => { if (notiOpen) { void load(); void loadInvites() } }, [notiOpen, load, loadInvites])

  if (!authed) return null
  const badgeCount = unread + pending.length + meetingInvites.length
  // 공유·약속 초대는 아래 전용 섹션(/todos·/meetings invitations)에서 다루므로 피드에선 제외(중복 방지)
  const feed = notifications.filter((n) => n.type !== 'SHARE_INVITE' && n.type !== 'MEETING_INVITE')

  // 미팅 알림 → 약속 화면에서 해당 토큰 자동 열기
  const openMeeting = (token: string | null) => {
    if (!token) return
    useAppStore.setState({ pendingInvite: token, view: 'meetup' })
    closeNoti()
  }

  // 타입별 액션 버튼 (없으면 null)
  function ActionButtons({ n }: { n: NotiItem }) {
    if ((n.type === 'MEETING_INVITE') && n.linkToken)
      return <Pill onClick={() => { void markRead(n.id); openMeeting(n.linkToken) }} primary>참여하기</Pill>
    if ((n.type === 'MEETING_CONFIRMED' || n.type === 'MEETING_REMINDER' || n.type === 'MEETING_INVITE_RESPONSE') && n.linkToken)
      return <Pill onClick={() => { void markRead(n.id); openMeeting(n.linkToken) }}>약속 보기</Pill>
    if (n.type === 'FRIEND_REQUEST' && n.refId)
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          <Pill onClick={() => { void friendAccept(n.refId!); void markRead(n.id) }} primary>수락</Pill>
          <Pill onClick={() => { void friendReject(n.refId!); void markRead(n.id) }}>거절</Pill>
        </div>
      )
    return null
  }

  return (
    <>
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
          <div onClick={closeNoti} style={{ position: 'fixed', inset: 0, zIndex: 47 }} />
          <div style={{ position: 'fixed', top: 74, right: 28, zIndex: 48, width: 'min(400px, calc(100vw - 40px))', maxHeight: '72vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(24,21,15,.28), 0 4px 14px rgba(24,21,15,.12)', border: '1px solid rgba(24,21,15,.06)', overflow: 'hidden', animation: 'rb-pop .18s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #EFEDE6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>알림</div>
                {badgeCount > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#D9614F', padding: '2px 8px', borderRadius: 20 }}>{badgeCount}</span>}
              </div>
              {unread > 0 && <div onClick={() => void markAllRead()} className="hbtn" style={{ fontSize: 12.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>모두 읽음</div>}
            </div>

            {/* 카테고리 탭 — be category 파라미터로 조회(전체/초대/할일/친구) */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px 4px', borderBottom: '1px solid #F3F1EA' }}>
              {([[null, '전체'], ['INVITE', '초대'], ['TODO', '할일'], ['FRIEND', '친구']] as const).map(([c, l]) => (
                <div key={l} onClick={() => void setCategory(c)} className="hbtn" style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 800, padding: '7px 0', borderRadius: 9, cursor: 'pointer', background: category === c ? '#17150F' : '#F4F3F0', color: category === c ? '#fff' : '#8B8579' }}>{l}</div>
              ))}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {/* 받은 공유 초대 (be-59) — 수락/거절. 전체·초대 탭에서만 */}
              {(category === null || category === 'INVITE') && pending.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: 11, padding: '12px', borderRadius: 13, background: '#F4F8FB', border: '1px solid #D7E4EF' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3F82C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#17150F' }}>할 일 공유 초대</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3B372E', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B8579', marginTop: 2 }}>{t.date ? dateFullLabel(t.date) : ''}{t.time ? ` · ${t.time.slice(0, 5)}` : ''}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                      <Pill onClick={() => void accept(t.id)} primary>수락</Pill>
                      <Pill onClick={() => void reject(t.id)}>거절</Pill>
                    </div>
                  </div>
                </div>
              ))}

              {/* 받은 약속 초대 (be-61) — 참여(join)/거절. 전체·초대 탭에서만 */}
              {(category === null || category === 'INVITE') && meetingInvites.map((m) => (
                <div key={m.shareToken} style={{ display: 'flex', gap: 11, padding: '12px', borderRadius: 13, background: '#F4F8FB', border: '1px solid #D7E4EF' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EAF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3F82C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M8 2.5v4M16 2.5v4M3 9h18" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#17150F' }}>약속 초대</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3B372E', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                      <Pill onClick={() => openMeeting(m.shareToken)} primary>참여하기</Pill>
                      <Pill onClick={() => void rejectMeeting(m.shareToken)}>거절</Pill>
                    </div>
                  </div>
                </div>
              ))}

              {(category !== null && category !== 'INVITE' ? true : pending.length === 0 && meetingInvites.length === 0) && feed.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#B6BCC7', gap: 10, padding: '40px 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CAD0DA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>새 알림이 없어요</div>
                </div>
              ) : (
                feed.map((n) => {
                  const cs = CAT_STYLE[n.category]
                  return (
                    <div key={n.id} onClick={() => void markRead(n.id)} className="hbtn" style={{ display: 'flex', gap: 11, padding: '12px 12px', borderRadius: 13, background: n.read ? '#fff' : '#FBFAF6', border: `1px solid ${n.read ? '#EDEBE4' : '#E8E1CE'}`, cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NotiIcon n={n} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D9614F', flexShrink: 0 }} />}
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#17150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                        </div>
                        {n.body && <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8B8579', marginTop: 3, lineHeight: 1.45 }}>{n.body}</div>}
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#B6BCC7', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: n.linkToken || (n.type === 'FRIEND_REQUEST' && n.refId) ? 9 : 0 }}><ActionButtons n={n} /></div>
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); void remove(n.id) }} className="hbtn" title="삭제" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                      </div>
                    </div>
                  )
                })
              )}

              {hasNext && (
                <div onClick={() => void loadMore()} className="hbtn" style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: '#8B8579', padding: '10px', cursor: 'pointer' }}>더 보기</div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Pill({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={primary ? 'lift' : 'hbtn'}
      style={{ fontSize: 12.5, fontWeight: 800, padding: '7px 14px', borderRadius: 10, cursor: 'pointer', color: primary ? '#fff' : '#8B8579', background: primary ? '#15795A' : '#EAE7DF' }}
    >
      {children}
    </div>
  )
}
