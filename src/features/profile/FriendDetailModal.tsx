// 친구 상세 — 프로필·취향·약속잡기 진입·친구 삭제.
import { CloseIcon, TrashIcon } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore } from '@/store/useFriendStore'
import { PrefIcon } from './prefIcons'
import type { AppUser } from '@/types'

export function FriendDetailModal({ user, onClose, onMeetup }: { user: AppUser; onClose: () => void; onMeetup: () => void }) {
  const removeFriend = useFriendStore((s) => s.removeFriend)
  const toast = useAppStore((s) => s.toast)
  const chips = [user.vibe, ...user.cats]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ flex: 1 }} />
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>

        {/* 프로필 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, boxShadow: '0 6px 16px rgba(21,121,90,.3)' }}>
            {user.nickname.slice(0, 1)}
          </div>
          <div style={{ fontSize: 23, fontWeight: 800, marginTop: 14 }}>{user.nickname}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8B8579', marginTop: 4 }}>{user.intro}</div>
        </div>

        {/* 취향 칩 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18 }}>
          {chips.map((c) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EAF5EF', color: '#0F5A42', fontSize: 13.5, fontWeight: 800, padding: '7px 12px', borderRadius: 20 }}>
              <PrefIcon name={c} color="#15795A" w={15} />
              {c}
            </span>
          ))}
        </div>

        {/* 액션 */}
        <div onClick={onMeetup} className="lift" style={{ marginTop: 22, height: 52, borderRadius: 15, background: '#15795A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(21,121,90,.28)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
          약속 잡기
        </div>
        <div onClick={() => { removeFriend(user.id); toast(`${user.nickname}님을 친구에서 삭제했어요`); onClose() }} className="hbtn" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', fontSize: 14, fontWeight: 700, color: '#C0645C', cursor: 'pointer' }}>
          <TrashIcon w={15} c="#C0645C" /> 친구 삭제
        </div>
      </div>
    </div>
  )
}
