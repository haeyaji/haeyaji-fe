// 약속 상세 — 참여 친구(나중에 추가 가능)·겹침 히트맵·확정. 친구에 종속되지 않는 독립 엔티티.
import { useState } from 'react'
import { CloseIcon, TrashIcon, PlusIcon } from '@/lib/icons'
import { longDate } from './meetupShared'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { Avatar, HeatGrid, bestSlot } from './meetupShared'
import { Shell } from './CreateMeetupModal'

export function MeetupDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const meetup = useMeetupStore((s) => s.meetups.find((m) => m.id === id))
  const update = useMeetupStore((s) => s.update)
  const remove = useMeetupStore((s) => s.remove)
  const allFriendIds = useFriendStore((s) => s.friendIds)
  const addTaskAt = useTodoStore((s) => s.addTaskAt)
  const openMap = useAppStore((s) => s.openMap)
  const toast = useAppStore((s) => s.toast)
  const [adding, setAdding] = useState(false)

  if (!meetup) return null
  const participants = meetup.friendIds.map(userById).filter(Boolean)
  const total = meetup.friendIds.length + 1 // 친구 + 나
  const addable = allFriendIds.filter((fid) => !meetup.friendIds.includes(fid)).map(userById).filter(Boolean)
  const best = bestSlot(meetup.dates, meetup.myCells, meetup.friendIds)

  const confirm = (date: string, hour: number) => {
    update(id, { confirmed: { date, hour } })
    addTaskAt(date, `${meetup.title} · ${participants.map((u) => u!.nickname).join(', ') || '나'} (${hour}시)`, 'todo')
    toast('약속을 확정하고 캘린더에 등록했어요')
  }

  return (
    <Shell onClose={onClose} title="약속">
      {/* 헤더 카드 */}
      <div style={{ background: 'linear-gradient(135deg, #15795A, #57B48C)', borderRadius: 18, padding: '18px 20px', color: '#fff', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, letterSpacing: '.3px' }}>{meetup.type}</div>
        <div style={{ fontSize: 23, fontWeight: 800, marginTop: 3 }}>{meetup.title}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.9, marginTop: 6 }}>
          {meetup.dates.length > 0 && `${longDate(meetup.dates[0])}${meetup.dates.length > 1 ? ` 외 ${meetup.dates.length - 1}일` : ''}`}
        </div>
        {meetup.confirmed && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 800 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
            {longDate(meetup.confirmed.date)} {meetup.confirmed.hour}시 확정
          </div>
        )}
      </div>

      {/* 참여자 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579' }}>참여 <span style={{ color: '#15795A' }}>{total}</span></div>
        {addable.length > 0 && (
          <div onClick={() => setAdding((v) => !v)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: '#15795A', background: '#EAF5EF', padding: '7px 12px', borderRadius: 20, cursor: 'pointer' }}>
            <PlusIcon c="#15795A" w={14} /> 친구 추가
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#17150F', color: '#fff', borderRadius: 20, padding: '5px 12px 5px 5px', fontSize: 13.5, fontWeight: 800 }}>
          <Avatar name="나" size={24} font={11} /> 나
        </span>
        {participants.map((u) => (
          <span key={u!.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F0F2F6', color: '#17150F', borderRadius: 20, padding: '5px 10px 5px 5px', fontSize: 13.5, fontWeight: 800 }}>
            <Avatar name={u!.nickname} size={24} font={11} /> {u!.nickname}
            <span onClick={() => update(id, { friendIds: meetup.friendIds.filter((x) => x !== u!.id) })} style={{ cursor: 'pointer', display: 'flex', opacity: 0.5 }}><CloseIcon w={11} c="#17150F" /></span>
          </span>
        ))}
      </div>

      {/* 친구 추가 인라인 */}
      {adding && (
        <div style={{ marginTop: 12, background: '#F6F8FA', borderRadius: 13, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {addable.map((u) => (
            <div key={u!.id} onClick={() => { update(id, { friendIds: [...meetup.friendIds, u!.id] }); if (addable.length === 1) setAdding(false) }} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 10, cursor: 'pointer' }}>
              <Avatar name={u!.nickname} size={34} font={15} />
              <div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{u!.nickname}</div>
              <PlusIcon c="#15795A" w={16} />
            </div>
          ))}
        </div>
      )}

      {/* 히트맵 */}
      {meetup.dates.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', margin: '20px 0 4px' }}>가장 잘 맞는 시간</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', marginBottom: 12 }}>진할수록 많이 겹쳐요 · 칸을 눌러 확정</div>
          <HeatGrid dates={meetup.dates} myCells={meetup.myCells} friendIds={meetup.friendIds} total={total} onPick={confirm} confirmed={meetup.confirmed} />
          {best && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, background: '#EAF5EF', borderRadius: 13, padding: '13px 15px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#15795A', padding: '4px 9px', borderRadius: 20 }}>추천</span>
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: '#0F5A42' }}>{longDate(best.date)} {best.hour}시 · {best.count}/{total}명</div>
              <div onClick={() => confirm(best.date, best.hour)} className="lift" style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', background: '#15795A', padding: '9px 16px', borderRadius: 11, cursor: 'pointer', flexShrink: 0 }}>확정</div>
            </div>
          )}
        </>
      )}

      {/* 하단 액션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
        {meetup.confirmed && (
          <div onClick={() => { onClose(); openMap() }} className="lift" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 48, borderRadius: 14, background: '#17150F', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
            갈 만한 곳 찾기
          </div>
        )}
        <div onClick={() => { remove(id); toast('약속을 삭제했어요'); onClose() }} className="hbtn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, padding: '0 18px', borderRadius: 14, background: '#F6ECEA', color: '#C0645C', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          <TrashIcon w={16} c="#C0645C" /> 삭제
        </div>
      </div>
    </Shell>
  )
}
