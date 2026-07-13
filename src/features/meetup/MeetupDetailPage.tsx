// 약속 상세 — 큰 페이지. 참여 현황(누가 시간 입력했는지)·겹치는 시간 히트맵·가능한 시간대 리스트·확정.
// 친구에 종속되지 않는 독립 엔티티. 친구는 나중에 추가 가능.
import { useMemo, useState } from 'react'
import { CloseIcon, TrashIcon, PlusIcon, WeatherIcon } from '@/lib/icons'
import { longDate, mdLabel, hhmm, candidateSlots, friendEntered, type Slot } from './meetupShared'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { Avatar, HeatGrid } from './meetupShared'
import type { WeatherCond } from '@/types'

export function MeetupDetailPage({ id, onBack }: { id: string; onBack: () => void }) {
  const meetup = useMeetupStore((s) => s.meetups.find((m) => m.id === id))
  const update = useMeetupStore((s) => s.update)
  const remove = useMeetupStore((s) => s.remove)
  const allFriendIds = useFriendStore((s) => s.friendIds)
  const addTaskAt = useTodoStore((s) => s.addTaskAt)
  const openMap = useAppStore((s) => s.openMap)
  const toast = useAppStore((s) => s.toast)
  const byDate = useWeatherStore((s) => s.byDate)
  const [adding, setAdding] = useState(false)
  const [sel, setSel] = useState<{ slot: Slot; startH: number; endH: number } | null>(null)

  // 시간을 입력한(참여한) 친구만 겹침 계산에 반영
  const enteredIds = useMemo(() => (meetup ? meetup.friendIds.filter((fid) => friendEntered(fid, meetup.id)) : []), [meetup])
  const slots = useMemo(() => (meetup ? candidateSlots(meetup.dates, meetup.myCells, enteredIds) : []), [meetup, enteredIds])

  if (!meetup) return null
  const participants = meetup.friendIds.map(userById).filter(Boolean)
  const total = meetup.friendIds.length + 1 // 친구 + 나
  const myEntered = Object.values(meetup.myCells).some((v) => v === 'free')
  const enteredCount = (myEntered ? 1 : 0) + enteredIds.length
  const addable = allFriendIds.filter((fid) => !meetup.friendIds.includes(fid)).map(userById).filter(Boolean)

  const pickSlot = (slot: Slot) => setSel({ slot, startH: slot.startH, endH: slot.endH })
  const confirm = () => {
    if (!sel) return
    const { slot, startH, endH } = sel
    update(id, { confirmed: { date: slot.date, startH, endH } })
    addTaskAt(slot.date, `${meetup.title} · ${participants.map((u) => u!.nickname).join(', ') || '나'} (${hhmm(startH)}~${hhmm(endH)})`, 'todo')
    toast('약속을 확정하고 캘린더에 등록했어요')
    setSel(null)
  }
  const pickByHour = (date: string, hour: number) => {
    const s = slots.find((x) => x.date === date && hour >= x.startH && hour < x.endH)
    if (s) pickSlot(s)
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 20, boxShadow: '0 1px 2px rgba(22,26,32,.04), 0 8px 22px rgba(22,26,32,.045)', padding: '22px 24px' }

  return (
    <div className="page-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* 상단 바 */}
        <div onClick={onBack} className="hbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: '#8B8579', cursor: 'pointer', marginBottom: 16, padding: '4px 2px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          약속 목록
        </div>

        {/* 헤더 히어로 */}
        <div style={{ background: meetup.confirmed ? 'linear-gradient(135deg, #15795A 0%, #3E9E76 55%, #57B48C 100%)' : 'linear-gradient(135deg, #3A4A5C 0%, #4C5F73 55%, #5A6E82 100%)', borderRadius: 22, padding: '26px 28px', color: '#fff', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85, letterSpacing: '.3px' }}>{meetup.type}</div>
            <div style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,.22)', padding: '4px 11px', borderRadius: 20 }}>{meetup.confirmed ? '확정' : '조율 중'}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{meetup.title}</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, opacity: 0.92, marginTop: 6 }}>
            {meetup.dates.length > 0 && `${longDate(meetup.dates[0])}${meetup.dates.length > 1 ? ` 외 ${meetup.dates.length - 1}일` : ''} 후보`}
          </div>
          {meetup.confirmed && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '6px 14px', fontSize: 14, fontWeight: 800 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
              {longDate(meetup.confirmed.date)} {hhmm(meetup.confirmed.startH)}~{hhmm(meetup.confirmed.endH)} 확정
            </div>
          )}
        </div>

        {/* 참여 현황 */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>참여 현황</div>
            {addable.length > 0 && (
              <div onClick={() => setAdding((v) => !v)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13.5, fontWeight: 800, color: '#15795A', background: '#EAF5EF', padding: '8px 13px', borderRadius: 20, cursor: 'pointer' }}>
                <PlusIcon c="#15795A" w={14} /> 친구 추가
              </div>
            )}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8B8579' }}>
            <span style={{ color: '#15795A', fontWeight: 800 }}>{enteredCount}</span> / {total}명이 시간을 입력했어요
          </div>
          <div style={{ height: 7, borderRadius: 5, background: '#EEF0F4', overflow: 'hidden', margin: '10px 0 16px' }}>
            <div style={{ width: `${total ? (enteredCount / total) * 100 : 0}%`, height: '100%', background: '#15795A', borderRadius: 5, transition: 'width .3s ease' }} />
          </div>

          {/* 참여자 행 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <PersonRow name="나 (알렉스)" entered={myEntered} me />
            {participants.map((u) => (
              <PersonRow key={u!.id} name={u!.nickname} entered={friendEntered(u!.id, meetup.id)} onRemove={() => update(id, { friendIds: meetup.friendIds.filter((x) => x !== u!.id) })} />
            ))}
          </div>

          {adding && (
            <div style={{ marginTop: 12, background: '#F6F8FA', borderRadius: 13, padding: 10, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {addable.map((u) => (
                <div key={u!.id} onClick={() => { update(id, { friendIds: [...meetup.friendIds, u!.id] }); if (addable.length === 1) setAdding(false) }} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px', borderRadius: 10, cursor: 'pointer' }}>
                  <Avatar name={u!.nickname} size={34} font={15} />
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{u!.nickname}</div>
                  <PlusIcon c="#15795A" w={16} />
                </div>
              ))}
            </div>
          )}
        </div>

        {meetup.dates.length > 0 && (
          <>
            {/* 겹치는 시간 히트맵 */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>겹치는 시간</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#A39C8E', marginBottom: 14 }}>입력한 사람들 기준 · 진할수록 많이 겹쳐요</div>
              <HeatGrid dates={meetup.dates} myCells={meetup.myCells} friendIds={enteredIds} total={total} onPick={pickByHour} confirmed={meetup.confirmed} />
            </div>

            {/* 가능한 시간대 리스트 */}
            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>가능한 시간대</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#A39C8E', marginBottom: 14 }}>겹치는 인원 많은 순 · 눌러서 실제 만날 시간을 정하세요</div>
              {slots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slots.slice(0, 10).map((slot) => {
                    const on = sel?.slot.date === slot.date && sel?.slot.startH === slot.startH
                    const raw = byDate[slot.date]
                    const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
                    const full = slot.count === total
                    return (
                      <div key={slot.date + slot.startH}>
                        <div onClick={() => (on ? setSel(null) : pickSlot(slot))} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', background: on ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${on ? '#15795A' : 'transparent'}` }}>
                          <div style={{ width: 28, height: 28, flexShrink: 0 }}>{cond && <WeatherIcon cond={cond} c={cond === 'sunny' ? '#E6A52E' : '#9AA0A8'} />}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: on ? '#0F5A42' : '#17150F' }}>{mdLabel(slot.date)} {hhmm(slot.startH)}~{hhmm(slot.endH)}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{slot.endH - slot.startH}시간 · {slot.count}/{total}명 가능</div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: full ? '#15795A' : '#8B8579', background: full ? '#DCF0E7' : '#EEF0F4', padding: '5px 11px', borderRadius: 20, flexShrink: 0 }}>{full ? '전원' : `${slot.count}명`}</span>
                        </div>

                        {on && sel && (
                          <div style={{ marginTop: 8, background: '#fff', border: '2px solid #EAF5EF', borderRadius: 14, padding: '16px 18px', animation: 'rb-pop .18s ease' }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#8B8579', marginBottom: 14 }}>실제 만날 시간을 정해주세요 (이 시간대 안에서)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <Stepper label="시작" value={sel.startH} min={slot.startH} max={sel.endH - 1} onChange={(v) => setSel({ ...sel, startH: v })} />
                              <div style={{ color: '#CAD0DA', fontWeight: 800, fontSize: 18 }}>~</div>
                              <Stepper label="종료" value={sel.endH} min={sel.startH + 1} max={slot.endH} onChange={(v) => setSel({ ...sel, endH: v })} />
                              <div style={{ flex: 1 }} />
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#15795A' }}>{sel.endH - sel.startH}시간</div>
                            </div>
                            <div onClick={confirm} className="lift" style={{ marginTop: 16, height: 48, borderRadius: 13, background: '#15795A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 15.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 18px rgba(21,121,90,.26)' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
                              {hhmm(sel.startH)}~{hhmm(sel.endH)}로 확정
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: '26px 0', textAlign: 'center', color: '#B6BCC7', fontSize: 14.5, fontWeight: 600 }}>{myEntered ? '겹치는 시간이 없어요. 친구를 더 추가해보세요.' : '내 시간을 아직 입력하지 않았어요.'}</div>
              )}
            </div>
          </>
        )}

        {/* 하단 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
          {meetup.confirmed && (
            <div onClick={openMap} className="lift" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 15, background: '#17150F', color: '#fff', fontSize: 15.5, fontWeight: 800, cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
              갈 만한 곳 찾기
            </div>
          )}
          <div onClick={() => { remove(id); toast('약속을 삭제했어요'); onBack() }} className="hbtn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 52, padding: '0 22px', borderRadius: 15, background: '#F6ECEA', color: '#C0645C', fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>
            <TrashIcon w={16} c="#C0645C" /> 삭제
          </div>
        </div>
      </div>
    </div>
  )
}

function PersonRow({ name, entered, me, onRemove }: { name: string; entered: boolean; me?: boolean; onRemove?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px' }}>
      <Avatar name={name} size={38} font={16} />
      <div style={{ flex: 1, fontSize: 15.5, fontWeight: 800 }}>{name}{me && <span style={{ fontSize: 12, fontWeight: 700, color: '#A39C8E', marginLeft: 6 }}>나</span>}</div>
      {entered ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: '#15795A', background: '#EAF5EF', padding: '5px 11px', borderRadius: 20 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
          입력 완료
        </span>
      ) : (
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#B08A3A', background: '#FBF1E4', padding: '5px 11px', borderRadius: 20 }}>대기 중</span>
      )}
      {onRemove && (
        <span onClick={onRemove} className="hbtn" style={{ cursor: 'pointer', display: 'flex', opacity: 0.4, marginLeft: 2 }}><CloseIcon w={13} c="#17150F" /></span>
      )}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const btn = (dir: -1 | 1, disabled: boolean) => (
    <div onClick={() => !disabled && onChange(value + dir)} style={{ width: 32, height: 32, borderRadius: 10, background: disabled ? '#F4F3F0' : '#EAF5EF', color: disabled ? '#CAD0DA' : '#15795A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
      {dir === -1 ? '−' : '+'}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#A39C8E' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {btn(-1, value <= min)}
        <div style={{ fontSize: 16, fontWeight: 800, color: '#17150F', width: 48, textAlign: 'center' }}>{hhmm(value)}</div>
        {btn(1, value >= max)}
      </div>
    </div>
  )
}
