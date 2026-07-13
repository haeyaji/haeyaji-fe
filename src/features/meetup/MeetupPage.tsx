// 약속 — 사이드바 독립 메뉴. 만든 약속 목록 + 새 약속. 각 약속은 친구에 종속되지 않는 엔티티.
import { useState } from 'react'
import { PlusIcon } from '@/lib/icons'
import { longDate } from './meetupShared'
import { userById } from '@/store/useFriendStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { AvatarStack } from './meetupShared'
import { CreateMeetupModal } from './CreateMeetupModal'
import { MeetupDetailModal } from './MeetupDetailModal'

export function MeetupPage() {
  const meetups = useMeetupStore((s) => s.meetups)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="page-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div className="home-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>약속</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#8B8579', marginTop: 3 }}>날짜·시간을 함께 조율하고 날씨까지 확인하세요</div>
          </div>
          <div onClick={() => setCreating(true)} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#17150F', color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 20px', borderRadius: 15, cursor: 'pointer' }}>
            <PlusIcon w={17} /> 새 약속 잡기
          </div>
        </div>

        {meetups.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {meetups.map((m) => {
              const names = m.friendIds.map((id) => userById(id)?.nickname).filter(Boolean) as string[]
              return (
                <div key={m.id} onClick={() => setOpenId(m.id)} className="tile lift" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ background: m.confirmed ? 'linear-gradient(135deg, #15795A, #57B48C)' : 'linear-gradient(135deg, #3A4A5C, #5A6E82)', padding: '16px 18px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, opacity: 0.85, letterSpacing: '.3px' }}>{m.type}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,.22)', padding: '3px 9px', borderRadius: 20 }}>{m.confirmed ? '확정' : '조율 중'}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{m.title}</div>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#5A554B' }}>
                      {m.confirmed ? `${longDate(m.confirmed.date)} ${m.confirmed.hour}시` : m.dates.length > 0 ? `${longDate(m.dates[0])}${m.dates.length > 1 ? ` 외 ${m.dates.length - 1}일` : ''} 후보` : '날짜 미정'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <AvatarStack names={['나', ...names]} />
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E' }}>{names.length + 1}명</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="tile" style={{ padding: '54px 26px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: '#EAF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4M8 14l2.5 2.5L16 11" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>아직 잡은 약속이 없어요</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>친구와 날짜·시간을 조율하고 날씨 좋은 날로 정해보세요</div>
            <div onClick={() => setCreating(true)} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: '#17150F', color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 24px', borderRadius: 15, cursor: 'pointer' }}>
              <PlusIcon w={17} /> 새 약속 잡기
            </div>
          </div>
        )}
      </div>

      {creating && <CreateMeetupModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id) }} />}
      {openId && <MeetupDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}
