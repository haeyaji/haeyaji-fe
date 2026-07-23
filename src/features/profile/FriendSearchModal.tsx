// 친구 관리 — 닉네임 검색 → 친구 요청 → (데모)수락. 보낸 요청·내 친구 목록.
// TODO(be): searchUsers→GET /users?q=, request/accept/reject→POST·PATCH /friends
import { useState } from 'react'
import { CloseIcon, TrashIcon } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, searchUsers, userById } from '@/store/useFriendStore'
import { MC } from '@/features/meetup/tokens'
import { Avatar } from '@/features/meetup/meetupShared'
import type { AppUser } from '@/types'

export function FriendSearchModal({ onClose, onOpenDetail }: { onClose: () => void; onOpenDetail?: (u: AppUser) => void }) {
  const [query, setQuery] = useState('')
  const { friendIds, pending, requestFriend, acceptFriend, rejectFriend, removeFriend, isFriend, isPending } = useFriendStore()
  const toast = useAppStore((s) => s.toast)
  const q = query.trim()
  const results = searchUsers(q)
  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const pendingUsers = pending.map(userById).filter((u): u is AppUser => !!u)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(30,28,23,.44)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: '100%', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 22, boxShadow: '0 40px 90px rgba(30,28,23,.4)', animation: 'rb-modal .22s ease', padding: '22px 26px 24px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>친구</div>
          <div style={{ flex: 1 }} />
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 11, background: MC.chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CloseIcon w={15} /></div>
        </div>

        <div style={{ position: 'relative' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A6A296" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="닉네임으로 친구 검색 (예: 민지)" style={{ width: '100%', border: `1px solid ${MC.border}`, outline: 'none', background: MC.fieldBg, borderRadius: 13, padding: '12px 14px 12px 40px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: MC.ink }} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 16 }}>
          {q ? (
            <>
              <SectionLabel>검색 결과</SectionLabel>
              {results.length > 0 ? results.map((u) => (
                <Row key={u.id} user={u} action={
                  isFriend(u.id)
                    ? <span style={{ fontSize: 13, fontWeight: 800, color: MC.primary, padding: '9px 12px' }}>친구</span>
                    : isPending(u.id)
                      ? <div style={{ display: 'flex', gap: 6 }}>
                          <div onClick={() => { acceptFriend(u.id); toast(`${u.nickname}님과 친구가 됐어요`) }} className="lift" title="데모: 상대가 수락" style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: MC.primary, padding: '8px 13px', borderRadius: 11, cursor: 'pointer' }}>수락</div>
                          <div onClick={() => rejectFriend(u.id)} className="hbtn" title="요청 취소" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', background: MC.chipBg, padding: '8px 12px', borderRadius: 11, cursor: 'pointer' }}>취소</div>
                        </div>
                      : <div onClick={() => { requestFriend(u.id); toast(`${u.nickname}님에게 친구 요청을 보냈어요`) }} className="lift" style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: MC.ink, padding: '9px 15px', borderRadius: 11, cursor: 'pointer', flexShrink: 0 }}>친구 요청</div>
                } />
              )) : (
                <div style={{ padding: 30, textAlign: 'center', color: MC.faint, fontSize: 14.5, fontWeight: 600 }}>'{q}' 님을 찾을 수 없어요</div>
              )}
            </>
          ) : (
            <>
              {pendingUsers.length > 0 && (
                <>
                  <SectionLabel>보낸 요청 <span style={{ color: '#C2702A' }}>{pendingUsers.length}</span></SectionLabel>
                  {pendingUsers.map((u) => (
                    <Row key={u.id} user={u} subtitle="수락 대기 중" action={
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div onClick={() => { acceptFriend(u.id); toast(`${u.nickname}님과 친구가 됐어요`) }} className="lift" title="데모: 상대가 수락" style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: MC.primary, padding: '8px 13px', borderRadius: 11, cursor: 'pointer' }}>수락</div>
                        <div onClick={() => rejectFriend(u.id)} className="hbtn" title="요청 취소" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', background: MC.chipBg, padding: '8px 12px', borderRadius: 11, cursor: 'pointer' }}>취소</div>
                      </div>
                    } />
                  ))}
                  <div style={{ height: 10 }} />
                </>
              )}
              <SectionLabel>내 친구 {friends.length > 0 && <span style={{ color: MC.primary }}>{friends.length}</span>}</SectionLabel>
              {friends.length > 0 ? friends.map((u) => (
                <Row key={u.id} user={u} onClick={onOpenDetail ? () => onOpenDetail(u) : undefined} action={
                  <div onClick={(e) => { e.stopPropagation(); removeFriend(u.id); toast(`${u.nickname}님을 친구에서 삭제했어요`) }} className="hbtn" title="삭제" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CAD0DA', cursor: 'pointer', flexShrink: 0 }}><TrashIcon w={16} c="currentColor" /></div>
                } />
              )) : (
                <div style={{ padding: 30, textAlign: 'center', color: MC.faint, fontSize: 14, fontWeight: 600 }}>아직 친구가 없어요. 닉네임·코드로 검색해 요청해보세요.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 800, color: MC.muted, margin: '2px 4px 8px' }}>{children}</div>
}

function Row({ user, action, onClick, subtitle }: { user: AppUser; action: React.ReactNode; onClick?: () => void; subtitle?: string }) {
  return (
    <div onClick={onClick} className={onClick ? 'hbtn' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '9px 6px', borderRadius: 12, cursor: onClick ? 'pointer' : 'default' }}>
      <Avatar name={user.nickname} size={44} font={19} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{user.nickname}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: subtitle ? '#C2702A' : MC.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle ?? user.vibe}</div>
      </div>
      {action}
    </div>
  )
}
