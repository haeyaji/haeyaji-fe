// 친구 상세 — 프로필·친구 삭제. (be는 상대 취향을 안 줘서 프로필만 표시)
import { CloseIcon, TrashIcon } from '@/lib/icons'
import { useOverlay } from '@/lib/useOverlay'
import { useFriendStore } from '@/store/useFriendStore'

export function FriendDetailModal({ user, onClose }: { user: { id: string; nickname: string }; onClose: () => void }) {
  const remove = useFriendStore((s) => s.remove)
  useOverlay(true, onClose)

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
          <div style={{ fontSize: 14, fontWeight: 600, color: '#8B8579', marginTop: 4 }}>친구</div>
        </div>

        {/* 액션 */}
        <div onClick={() => { void remove(user.id); onClose() }} className="hbtn" style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: 14, background: '#F6ECEA', fontSize: 14.5, fontWeight: 800, color: '#C0645C', cursor: 'pointer' }}>
          <TrashIcon w={15} c="#C0645C" /> 친구 삭제
        </div>
      </div>
    </div>
  )
}
