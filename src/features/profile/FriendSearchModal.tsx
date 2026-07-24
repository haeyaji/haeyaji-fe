// 친구 관리 — 닉네임 검색(be) → 친구 요청 → 받은 요청 수락/거절, 보낸 요청 취소, 친구 삭제.
import { useEffect, useState } from 'react'
import { useOverlay } from '@/lib/useOverlay'
import { CloseIcon, TrashIcon } from '@/lib/icons'
import { useFriendStore } from '@/store/useFriendStore'
import { searchMember, type MemberLite } from '@/api/friendApi'
import { MC } from '@/features/meetup/tokens'
import { Avatar } from '@/features/meetup/meetupShared'

export function FriendSearchModal({ onClose, onOpenDetail }: { onClose: () => void; onOpenDetail?: (u: { id: string; nickname: string }) => void }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<MemberLite | null | 'none'>(null) // null=대기, 'none'=없음
  const [searching, setSearching] = useState(false)
  const { friends, incoming, outgoing, names, load, request, accept, reject, remove, nameOf, isFriend, isOutgoing } = useFriendStore()
  useOverlay(true, onClose)

  useEffect(() => { void load() }, [load])

  // 닉네임 검색 (디바운스 350ms)
  useEffect(() => {
    const qq = query.trim()
    if (!qq) { setResult(null); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const m = await searchMember(qq)
      setResult(m ?? 'none')
      setSearching(false)
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const q = query.trim()
  const me = localStorage.getItem('haeyaji-account') ?? ''

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
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="닉네임으로 친구 검색 (정확히 입력)" style={{ width: '100%', border: `1px solid ${MC.border}`, outline: 'none', background: MC.fieldBg, borderRadius: 13, padding: '12px 14px 12px 40px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: MC.ink }} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 16 }}>
          {q ? (
            <>
              <SectionLabel>검색 결과</SectionLabel>
              {searching ? (
                <div style={{ padding: 24, textAlign: 'center', color: MC.faint, fontSize: 14, fontWeight: 600 }}>검색 중…</div>
              ) : result === 'none' || result === null ? (
                <div style={{ padding: 30, textAlign: 'center', color: MC.faint, fontSize: 14.5, fontWeight: 600 }}>'{q}' 님을 찾을 수 없어요</div>
              ) : result.id === me ? (
                <Row nickname={result.nickname} action={<span style={{ fontSize: 13, fontWeight: 700, color: MC.faint, padding: '9px 12px' }}>나</span>} />
              ) : (
                <Row nickname={result.nickname} action={
                  isFriend(result.id)
                    ? <span style={{ fontSize: 13, fontWeight: 800, color: MC.primary, padding: '9px 12px' }}>친구</span>
                    : isOutgoing(result.id)
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: '#C2702A', padding: '9px 12px' }}>요청함</span>
                      : <div onClick={() => request(result)} className="lift" style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: MC.ink, padding: '9px 15px', borderRadius: 11, cursor: 'pointer', flexShrink: 0 }}>친구 요청</div>
                } />
              )}
            </>
          ) : (
            <>
              {incoming.length > 0 && (
                <>
                  <SectionLabel>받은 요청 <span style={{ color: '#C2702A' }}>{incoming.length}</span></SectionLabel>
                  {incoming.map((f) => (
                    <Row key={f.rowId} nickname={nameOf(f.memberId)} subtitle="나에게 친구 요청" action={
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div onClick={() => accept(f.rowId, names[f.memberId])} className="lift" style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: MC.primary, padding: '8px 13px', borderRadius: 11, cursor: 'pointer' }}>수락</div>
                        <div onClick={() => reject(f.rowId)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', background: MC.chipBg, padding: '8px 12px', borderRadius: 11, cursor: 'pointer' }}>거절</div>
                      </div>
                    } />
                  ))}
                  <div style={{ height: 10 }} />
                </>
              )}
              {outgoing.length > 0 && (
                <>
                  <SectionLabel>보낸 요청 <span style={{ color: '#C2702A' }}>{outgoing.length}</span></SectionLabel>
                  {outgoing.map((f) => (
                    <Row key={f.rowId} nickname={nameOf(f.memberId)} subtitle="수락 대기 중" action={
                      <div onClick={() => remove(f.rowId)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', background: MC.chipBg, padding: '8px 12px', borderRadius: 11, cursor: 'pointer' }}>취소</div>
                    } />
                  ))}
                  <div style={{ height: 10 }} />
                </>
              )}
              <SectionLabel>내 친구 {friends.length > 0 && <span style={{ color: MC.primary }}>{friends.length}</span>}</SectionLabel>
              {friends.length > 0 ? friends.map((f) => (
                <Row key={f.rowId} nickname={nameOf(f.memberId)} onClick={onOpenDetail ? () => onOpenDetail({ id: f.rowId, nickname: nameOf(f.memberId) }) : undefined} action={
                  <div onClick={(e) => { e.stopPropagation(); remove(f.rowId) }} className="hbtn" title="삭제" style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CAD0DA', cursor: 'pointer', flexShrink: 0 }}><TrashIcon w={16} c="currentColor" /></div>
                } />
              )) : (
                <div style={{ padding: 30, textAlign: 'center', color: MC.faint, fontSize: 14, fontWeight: 600 }}>아직 친구가 없어요. 닉네임으로 검색해 요청해보세요.</div>
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

function Row({ nickname, action, onClick, subtitle }: { nickname: string; action: React.ReactNode; onClick?: () => void; subtitle?: string }) {
  return (
    <div onClick={onClick} className={onClick ? 'hbtn' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '9px 6px', borderRadius: 12, cursor: onClick ? 'pointer' : 'default' }}>
      <Avatar name={nickname} size={44} font={19} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{nickname}</div>
        {subtitle && <div style={{ fontSize: 13, fontWeight: 600, color: '#C2702A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}
