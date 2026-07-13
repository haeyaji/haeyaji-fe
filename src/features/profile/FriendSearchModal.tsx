// 친구 검색·추가 — 닉네임 입력 → mock 유저 부분일치 → 추가.
// be 붙으면 searchUsers를 GET /users?nickname= 로 교체.
import { useState } from 'react'
import { CloseIcon } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, searchUsers } from '@/store/useFriendStore'

function Avatar({ name }: { name: string }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, flexShrink: 0 }}>
      {name.slice(0, 1)}
    </div>
  )
}

export function FriendSearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const { friendIds, addFriend } = useFriendStore()
  const toast = useAppStore((s) => s.toast)
  const results = searchUsers(query)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '22px 24px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>친구 추가</div>
          <div style={{ flex: 1 }} />
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A6A095" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="닉네임으로 검색 (예: 민지)"
            style={{ width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F0F2F6', borderRadius: 13, padding: '12px 14px 12px 40px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: '#17150F' }}
          />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((u) => {
            const already = friendIds.includes(u.id)
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '10px 6px' }}>
                <Avatar name={u.nickname} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{u.nickname}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.intro}</div>
                </div>
                {already ? (
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#B6BCC7', padding: '9px 15px' }}>추가됨</div>
                ) : (
                  <div onClick={() => { addFriend(u.id); toast(`${u.nickname}님을 친구로 추가했어요`) }} className="lift" style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', background: '#17150F', padding: '9px 16px', borderRadius: 11, cursor: 'pointer', flexShrink: 0 }}>추가</div>
                )}
              </div>
            )
          })}
          {query.trim() && results.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: '#B6BCC7', fontSize: 14.5, fontWeight: 600 }}>'{query}' 님을 찾을 수 없어요</div>
          )}
          {!query.trim() && (
            <div style={{ padding: 30, textAlign: 'center', color: '#C0BAAD', fontSize: 14, fontWeight: 600 }}>닉네임을 입력하면 친구를 찾아드려요</div>
          )}
        </div>
      </div>
    </div>
  )
}
