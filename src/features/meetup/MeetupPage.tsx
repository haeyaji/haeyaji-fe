// 약속 목록 — be /meetings. 조율 중(COLLECTING) / 확정(CONFIRMED) 그룹 + 새 약속.
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { meetTypeLabel, confirmedRange } from './meetupShared'
import { MC } from './tokens'
import { CreateMeetupModal } from './CreateMeetupModal'
import { MeetupDetailPage } from './MeetupDetailPage'

export function MeetupPage() {
  const meetings = useMeetupStore((s) => s.meetings)
  const loadList = useMeetupStore((s) => s.loadList)
  const creating = useAppStore((s) => s.meetupCreateOpen)
  const openMeetupCreate = useAppStore((s) => s.openMeetupCreate)
  const closeMeetupCreate = useAppStore((s) => s.closeMeetupCreate)
  const pendingInvite = useAppStore((s) => s.pendingInvite)
  const [openToken, setOpenToken] = useState<string | null>(null)

  useEffect(() => { void loadList() }, [loadList])
  useEffect(() => { if (pendingInvite) { setOpenToken(pendingInvite); useAppStore.setState({ pendingInvite: null }) } }, [pendingInvite]) // 초대 링크 자동 열기
  // 상세 열면 주소를 공유 가능한 /meetup/{token}으로 동기화(딥링크와 정합). 목록/이탈 시 '/' 복귀.
  useEffect(() => {
    window.history.replaceState(null, '', openToken ? `/meetup/${openToken}` : '/')
    return () => { window.history.replaceState(null, '', '/') }
  }, [openToken])

  if (openToken) return <MeetupDetailPage shareToken={openToken} onBack={() => { setOpenToken(null); void loadList() }} />

  const pending = meetings.filter((m) => m.status !== 'CONFIRMED')
  const confirmed = meetings.filter((m) => m.status === 'CONFIRMED')

  const newBtn = (big?: boolean) => (
    <div onClick={openMeetupCreate} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: MC.ink, color: '#fff', fontSize: 15, fontWeight: 700, padding: big ? '13px 24px' : '13px 20px', borderRadius: 15, cursor: 'pointer' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> 새 약속 잡기
    </div>
  )

  const card = (m: (typeof meetings)[number]) => {
    const conf = m.status === 'CONFIRMED' && m.confirmedStartAt && m.confirmedEndAt
    const expired = m.status === 'EXPIRED'
    return (
      <div key={m.shareToken} onClick={() => setOpenToken(m.shareToken)} className="lift" style={{ background: '#fff', borderRadius: 20, border: '1px solid #ECE9E0', boxShadow: '0 1px 2px rgba(30,28,23,.05), 0 8px 22px rgba(30,28,23,.05)', padding: '18px 20px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
          <span style={{ fontSize: 12, fontWeight: 800, color: MC.tintText, background: MC.tintBg, padding: '4px 10px', borderRadius: 20 }}>{meetTypeLabel(m.type)}</span>
          {conf ? (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: MC.primary, padding: '4px 10px', borderRadius: 20 }}>확정</span>
          ) : expired ? (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#B4544A', background: '#F7E7E4', padding: '4px 10px', borderRadius: 20 }}>만료</span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#6B6759', background: '#EEEDE7', padding: '4px 10px', borderRadius: 20 }}>조율 중</span>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: MC.muted }}>
          {conf ? `⏰ ${confirmedRange(m.confirmedStartAt!, m.confirmedEndAt!)}` : `참여 ${m.participantCount}명`}
        </div>
      </div>
    )
  }

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: 'var(--canvas)' }}>
      <div className="mp-wrap">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>약속</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: MC.muted, marginTop: 5 }}>후보 시간을 만들어 링크로 공유하고, 겹치는 시간을 찾으세요</div>
          </div>
          {meetings.length > 0 && newBtn()}
        </div>

        {meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: MC.muted }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🗓️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>아직 약속이 없어요</div>
            {newBtn(true)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {pending.length > 0 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: MC.muted, marginBottom: 12 }}>조율 중 · {pending.length}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>{pending.map(card)}</div>
              </div>
            )}
            {confirmed.length > 0 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: MC.muted, marginBottom: 12 }}>확정 · {confirmed.length}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>{confirmed.map(card)}</div>
              </div>
            )}
          </div>
        )}
      </div>
      {creating && <CreateMeetupModal onClose={closeMeetupCreate} onCreated={(token) => { closeMeetupCreate(); setOpenToken(token) }} />}
    </div>
  )
}
