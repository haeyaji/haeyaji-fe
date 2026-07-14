// 약속 상세 — 2단 레이아웃(좌: 겹치는 시간 히트맵 / 우: 가능한 시간대 + 참여 현황 sticky).
// 디자인 핸드오프 반영. 30분 단위·슬롯 필터·못와요/미입력 태그·시간 범위 조정.
import { useMemo, useState } from 'react'
import { WeatherIcon } from '@/lib/icons'
import { longDate, mdLabel, hhmm, dur, candidateSlots, friendFree, friendEntered, type Slot } from './meetupShared'
import { MC, cardStyle } from './tokens'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { Avatar, HeatGrid } from './meetupShared'
import type { WeatherCond } from '@/types'

type Sel = { slot: Slot; startH: number; endH: number }

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
  const [sel, setSel] = useState<Sel | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState<'all' | 'majority' | 'full'>('all')

  const enteredIds = useMemo(() => (meetup ? meetup.friendIds.filter((fid) => friendEntered(fid, meetup.id)) : []), [meetup])
  const allSlots = useMemo(() => (meetup ? candidateSlots(meetup.dates, meetup.myCells, enteredIds) : []), [meetup, enteredIds])

  if (!meetup) return null
  const participants = meetup.friendIds.map(userById).filter(Boolean)
  const total = meetup.friendIds.length + 1
  const myEntered = Object.values(meetup.myCells).some((v) => v === 'free')
  const enteredCount = (myEntered ? 1 : 0) + enteredIds.length
  const addable = allFriendIds.filter((fid) => !meetup.friendIds.includes(fid)).map(userById).filter(Boolean)
  const majCut = Math.floor(total / 2) + 1
  const filterCounts = { all: allSlots.length, majority: allSlots.filter((x) => x.count >= majCut).length, full: allSlots.filter((x) => x.count === total).length }
  const slots = allSlots.filter((x) => (filter === 'full' ? x.count === total : filter === 'majority' ? x.count >= majCut : true))

  const pickSlot = (s: Slot) => setSel({ slot: s, startH: s.startH, endH: s.endH })
  const pickByTick = (date: string, tick: number) => { const s = allSlots.find((x) => x.date === date && tick >= x.startH && tick < x.endH); if (s) pickSlot(s) }
  const confirm = () => {
    if (!sel) return
    update(id, { confirmed: { date: sel.slot.date, startH: sel.startH, endH: sel.endH } })
    addTaskAt(sel.slot.date, `${meetup.title} · ${participants.map((u) => u!.nickname).join(', ') || '나'} (${hhmm(sel.startH)}~${hhmm(sel.endH)})`, 'todo')
    toast('약속을 확정하고 캘린더에 등록했어요')
    setSel(null)
  }

  const heroBg = meetup.confirmed ? MC.confGrad : MC.slateGrad

  return (
    <div style={{ padding: '32px 96px 92px 40px', minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: MC.canvas }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div onClick={onBack} className="hbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: MC.muted, cursor: 'pointer', marginBottom: 16, padding: '4px 2px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          약속 목록
        </div>

        {/* 히어로 */}
        <div style={{ background: heroBg, borderRadius: 22, padding: '26px 28px', color: '#fff', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85, letterSpacing: '.3px' }}>{meetup.type}</div>
            <div style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,.22)', padding: '4px 11px', borderRadius: 20 }}>{meetup.confirmed ? '확정' : '조율 중'}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{meetup.title}</div>
          {meetup.dates.length > 0 && <div style={{ fontSize: 14.5, fontWeight: 600, opacity: 0.92, marginTop: 6 }}>{longDate(meetup.dates[0])}{meetup.dates.length > 1 ? ` 외 ${meetup.dates.length - 1}일` : ''} 후보</div>}
          {meetup.confirmed && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '6px 14px', fontSize: 14, fontWeight: 800 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
              {longDate(meetup.confirmed.date)} {hhmm(meetup.confirmed.startH)}~{hhmm(meetup.confirmed.endH)} 확정
            </div>
          )}
        </div>

        {/* 2단 */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* 좌: 히트맵 + 액션 */}
          <div style={{ flex: '1.35 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {meetup.dates.length > 0 && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>겹치는 시간</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted }}>30분 단위</div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: MC.muted, marginBottom: 14 }}>입력한 사람들 기준 · 진할수록 많이 겹쳐요</div>
                {/* 범례 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  {([['#D8ECE1', '적음'], ['#A6D6BF', ''], ['#66B896', '과반'], ['#2F9E73', ''], ['#12664A', `전원 ${total}`]] as const).map(([c, l], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 15, height: 15, borderRadius: 4, background: c }} />
                      {l && <span style={{ fontSize: 12, fontWeight: 700, color: MC.muted }}>{l}</span>}
                    </div>
                  ))}
                </div>
                <HeatGrid dates={meetup.dates} myCells={meetup.myCells} friendIds={enteredIds} total={total} onPick={pickByTick} confirmed={meetup.confirmed} />
              </div>
            )}
            {/* 액션 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {meetup.confirmed && (
                <div onClick={openMap} className="lift" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 15, background: MC.ink, color: '#fff', fontSize: 15.5, fontWeight: 800, cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
                  갈 만한 곳 찾기
                </div>
              )}
              <div onClick={() => { remove(id); toast('약속을 삭제했어요'); onBack() }} className="hbtn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 52, padding: '0 22px', borderRadius: 15, background: MC.dangerBg, color: MC.danger, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MC.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M7 7l1 13h8l1-13" /></svg>
                삭제
              </div>
            </div>
          </div>

          {/* 우: 가능한 시간대(위) + 참여 현황(아래, sticky) */}
          <div style={{ flex: '1 1 0%', minWidth: 0, maxWidth: 380, alignSelf: 'stretch', position: 'sticky', top: 24, height: 'calc(var(--full-vh) - 48px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {meetup.dates.length > 0 && (
              <div style={{ ...cardStyle, padding: '18px 20px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: collapsed ? '0 0 auto' : '1 1 auto' }}>
                <div onClick={() => setCollapsed((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>가능한 시간대</div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: MC.tintText, background: MC.tintBg, padding: '3px 9px', borderRadius: 20 }}>{allSlots.length}개</span>
                  <div style={{ flex: 1 }} />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MC.muted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .2s ease' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {!collapsed && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: MC.muted, margin: '8px 2px 0' }}>겹치는 인원 많은 순 · 눌러서 시간 정하기</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexShrink: 0 }}>
                      {([['all', '모두'], ['majority', '과반수'], ['full', '전원']] as const).map(([k, l]) => {
                        const active = filter === k
                        return <div key={k} onClick={() => setFilter(k)} className="hbtn" style={{ flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', background: active ? MC.ink : MC.fieldBg, color: active ? '#fff' : MC.muted }}>{l} {filterCounts[k]}</div>
                      })}
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingRight: 4 }}>
                      {slots.length > 0 ? slots.slice(0, 10).map((slot) => {
                        const on = sel?.slot.date === slot.date && sel?.slot.startH === slot.startH
                        const raw = byDate[slot.date]
                        const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
                        const full = slot.count === total
                        const unavail: string[] = []
                        if (meetup.myCells[`${slot.date}|${slot.startH}`] !== 'free') unavail.push('나')
                        enteredIds.forEach((uid) => { if (!friendFree(uid, slot.date, slot.startH)) { const u = userById(uid); if (u) unavail.push(u.nickname) } })
                        const pending = meetup.friendIds.filter((fid) => !friendEntered(fid, meetup.id)).map(userById).filter(Boolean).map((u) => u!.nickname)
                        return (
                          <div key={slot.date + slot.startH}>
                            <div onClick={() => (on ? setSel(null) : pickSlot(slot))} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 13, cursor: 'pointer', background: on ? MC.tintBg : '#fff', border: `1px solid ${on ? MC.primary : MC.border}` }}>
                              <div style={{ width: 22, height: 22, flexShrink: 0 }}>{cond && <WeatherIcon cond={cond} c={cond === 'sunny' ? MC.amber : '#A6A296'} />}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: MC.muted }}>{mdLabel(slot.date)}</div>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: full ? '#fff' : MC.tintText, background: full ? MC.primary : MC.tintBg, padding: '3px 9px', borderRadius: 20, flexShrink: 0 }}>{full ? `전원 ${total}` : `${slot.count}/${total}`}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                                  <div style={{ fontSize: 14, fontWeight: 800, color: on ? MC.tintText : MC.ink, whiteSpace: 'nowrap' }}>{hhmm(slot.startH)}~{hhmm(slot.endH)}</div>
                                  <div style={{ fontSize: 11.5, fontWeight: 600, color: MC.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>{dur(slot.startH, slot.endH)}</div>
                                </div>
                              </div>
                            </div>
                            {on && sel && (
                              <div style={{ marginTop: 7, background: '#fff', border: `1px solid ${MC.border}`, borderRadius: 13, padding: '14px 15px', animation: 'rb-pop .18s ease' }}>
                                {(unavail.length > 0 || pending.length > 0) && (
                                  <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {unavail.length > 0 && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 800, color: MC.danger, background: MC.dangerBg, padding: '3px 8px', borderRadius: 7, flexShrink: 0 }}>못 와요</span><div style={{ fontSize: 13, fontWeight: 700, color: '#5B574B', lineHeight: 1.5 }}>{unavail.join(', ')}</div></div>}
                                    {pending.length > 0 && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 800, color: '#B0812E', background: MC.amberBg, padding: '3px 8px', borderRadius: 7, flexShrink: 0 }}>미입력</span><div style={{ fontSize: 13, fontWeight: 700, color: '#5B574B', lineHeight: 1.5 }}>{pending.join(', ')}</div></div>}
                                  </div>
                                )}
                                <div style={{ fontSize: 12, fontWeight: 700, color: MC.muted, marginBottom: 12, textAlign: 'center' }}>실제 만날 시간</div>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8 }}>
                                  <Stepper label="시작" value={sel.startH} min={slot.startH} max={sel.endH - 0.5} onChange={(v) => setSel({ ...sel, startH: v })} />
                                  <div style={{ color: MC.faint, fontWeight: 800, fontSize: 15, paddingBottom: 6 }}>~</div>
                                  <Stepper label="종료" value={sel.endH} min={sel.startH + 0.5} max={slot.endH} onChange={(v) => setSel({ ...sel, endH: v })} />
                                </div>
                                <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: MC.primary, marginTop: 8 }}>{dur(sel.startH, sel.endH)} 동안</div>
                                <div onClick={confirm} className="lift" style={{ marginTop: 14, height: 44, borderRadius: 12, background: MC.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 14px rgba(31,122,92,.26)' }}>
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
                                  {hhmm(sel.startH)}~{hhmm(sel.endH)} 확정
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }) : (
                        <div style={{ padding: '26px 0', textAlign: 'center', color: MC.faint, fontSize: 14.5, fontWeight: 600 }}>{!myEntered ? '내 시간을 아직 입력하지 않았어요.' : allSlots.length > 0 ? '이 조건에 맞는 시간대가 없어요.' : '겹치는 시간이 없어요. 친구를 더 추가해보세요.'}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 참여 현황 */}
            <div style={{ ...cardStyle, padding: '18px 20px', flexShrink: 0, marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800 }}>참여 <span style={{ color: MC.primary }}>{enteredCount}</span><span style={{ color: MC.faint }}>/{total}</span></div>
                {addable.length > 0 && (
                  <div onClick={() => setAdding((v) => !v)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: MC.primary, background: MC.tintBg, padding: '6px 11px', borderRadius: 20, cursor: 'pointer' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> 추가
                  </div>
                )}
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#ECE9E0', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${total ? (enteredCount / total) * 100 : 0}%`, height: '100%', background: MC.primary, borderRadius: 4, transition: 'width .3s ease' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <StatChip name="나" entered={myEntered} />
                {participants.map((u) => <StatChip key={u!.id} name={u!.nickname} entered={friendEntered(u!.id, meetup.id)} onRemove={() => update(id, { friendIds: meetup.friendIds.filter((x) => x !== u!.id) })} />)}
              </div>
              {adding && (
                <div style={{ marginTop: 12, background: MC.fieldBg, borderRadius: 13, padding: 8, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
                  {addable.map((u) => (
                    <div key={u!.id} onClick={() => { update(id, { friendIds: [...meetup.friendIds, u!.id] }); if (addable.length === 1) setAdding(false) }} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 10, cursor: 'pointer' }}>
                      <Avatar name={u!.nickname} size={30} font={13} />
                      <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>{u!.nickname}</div>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({ name, entered, onRemove }: { name: string; entered: boolean; onRemove?: () => void }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 11px 5px 5px', borderRadius: 20, background: entered ? MC.tintBg : MC.fieldBg, border: `1px solid ${entered ? '#CFE6DA' : '#E4E0D6'}` }}>
      <div style={{ position: 'relative', width: 26, height: 26, flexShrink: 0 }}>
        <Avatar name={name} size={26} font={12} />
        <div style={{ position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: '50%', background: entered ? MC.primary : MC.amber, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {entered && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>}
        </div>
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 800, color: entered ? MC.tintText : '#8C8779' }}>{name}</span>
      {onRemove && <span onClick={onRemove} className="hbtn" style={{ cursor: 'pointer', display: 'flex', opacity: 0.35 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MC.ink} strokeWidth="2.4" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg></span>}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const btn = (dir: -1 | 1, disabled: boolean) => (
    <div onClick={() => !disabled && onChange(value + dir * 0.5)} style={{ width: 32, height: 32, borderRadius: 10, background: disabled ? '#F0EEE7' : MC.tintBg, color: disabled ? '#CFCBBE' : MC.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{dir === -1 ? '−' : '+'}</div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: MC.muted }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {btn(-1, value <= min)}
        <div style={{ fontSize: 15, fontWeight: 800, color: MC.ink, width: 44, textAlign: 'center' }}>{hhmm(value)}</div>
        {btn(1, value >= max)}
      </div>
    </div>
  )
}
