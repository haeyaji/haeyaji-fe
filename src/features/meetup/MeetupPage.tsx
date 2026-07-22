// 약속 — 사이드바 독립 메뉴. 조율 중 / 확정 그룹핑 목록 + 새 약속.
import { useState } from 'react'
import { longDate, hhmm } from './meetupShared'
import { userById } from '@/store/useFriendStore'
import { useAppStore } from '@/store/useAppStore'
import { useMeetupStore, type Meetup } from '@/store/useMeetupStore'
import { AvatarStack, friendEntered } from './meetupShared'
import { MC } from './tokens'
import { CreateMeetupModal } from './CreateMeetupModal'
import { MeetupDetailPage } from './MeetupDetailPage'

export function MeetupPage() {
  const meetups = useMeetupStore((s) => s.meetups)
  const creating = useAppStore((s) => s.meetupCreateOpen)
  const openMeetupCreate = useAppStore((s) => s.openMeetupCreate)
  const closeMeetupCreate = useAppStore((s) => s.closeMeetupCreate)
  const [openId, setOpenId] = useState<string | null>(null)

  if (openId && meetups.some((m) => m.id === openId)) {
    return <MeetupDetailPage id={openId} onBack={() => setOpenId(null)} />
  }

  const pending = meetups.filter((m) => !m.confirmed)
  const confirmed = meetups.filter((m) => m.confirmed)

  const newBtn = (big?: boolean) => (
    <div onClick={openMeetupCreate} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: MC.ink, color: '#fff', fontSize: 15, fontWeight: 700, padding: big ? '13px 24px' : '13px 20px', borderRadius: 15, cursor: 'pointer' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> 새 약속 잡기
    </div>
  )

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: MC.canvas }}>
      <div className="mp-wrap">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>약속</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: MC.muted, marginTop: 5 }}>날짜·시간을 함께 조율하고 날씨까지 확인하세요</div>
          </div>
          {/* 약속이 있을 때만 헤더에 생성 버튼 (빈 상태는 중앙 버튼이 담당) */}
          {meetups.length > 0 && newBtn()}
        </div>

        {meetups.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {pending.length > 0 && <Group label="조율 중" count={pending.length} dot="#9A9689" items={pending} onOpen={setOpenId} />}
            {confirmed.length > 0 && <Group label="확정" count={confirmed.length} dot={MC.primary} items={confirmed} onOpen={setOpenId} />}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 1px 2px rgba(30,28,23,.05), 0 8px 22px rgba(30,28,23,.05)', padding: '54px 26px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: MC.tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4M8 14l2.5 2.5L16 11" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>아직 잡은 약속이 없어요</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: MC.muted, marginTop: 6, marginBottom: 20 }}>친구와 날짜·시간을 조율하고 날씨 좋은 날로 정해보세요</div>
            {newBtn(true)}
          </div>
        )}
      </div>

      {creating && <CreateMeetupModal onClose={closeMeetupCreate} onCreated={(id) => { closeMeetupCreate(); setOpenId(id) }} />}
    </div>
  )
}

function Group({ label, count, dot, items, onOpen }: { label: string; count: number; dot: string; items: Meetup[]; onOpen: (id: string) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: 15.5, fontWeight: 800 }}>{label} <span style={{ color: MC.muted }}>{count}</span></span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {items.map((m) => <Card key={m.id} m={m} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

function Card({ m, onOpen }: { m: Meetup; onOpen: (id: string) => void }) {
  const names = m.friendIds.map((id) => userById(id)?.nickname).filter(Boolean) as string[]
  const total = m.friendIds.length + 1
  const entered = (Object.values(m.myCells).some((v) => v === 'free') ? 1 : 0) + m.friendIds.filter((fid) => friendEntered(fid, m.id)).length
  return (
    <div onClick={() => onOpen(m.id)} className="lift" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 1px 2px rgba(30,28,23,.05), 0 8px 22px rgba(30,28,23,.05)', padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ background: m.confirmed ? MC.confGrad : MC.slateGrad, padding: '16px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, opacity: 0.85, letterSpacing: '.3px' }}>{m.type}</div>
          <div style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,.22)', padding: '3px 9px', borderRadius: 20 }}>{m.confirmed ? '확정' : '조율 중'}</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{m.title}</div>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: m.confirmed ? MC.primary : '#5A554B' }}>
          {m.confirmed ? `${longDate(m.confirmed.date)} ${hhmm(m.confirmed.startH)}~${hhmm(m.confirmed.endH)}` : m.dates.length > 0 ? `${longDate(m.dates[0])}${m.dates.length > 1 ? ` 외 ${m.dates.length - 1}일` : ''} 후보` : '날짜 미정'}
        </div>
        {!m.confirmed && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: MC.muted, margin: '10px 0 6px' }}>{entered}/{total}명 시간 입력</div>
            <div style={{ height: 6, borderRadius: 4, background: '#ECE9E0', overflow: 'hidden' }}>
              <div style={{ width: `${total ? (entered / total) * 100 : 0}%`, height: '100%', background: '#8A958A', borderRadius: 4 }} />
            </div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <AvatarStack names={['나', ...names]} />
          <div style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted }}>{total}명</div>
        </div>
      </div>
    </div>
  )
}
