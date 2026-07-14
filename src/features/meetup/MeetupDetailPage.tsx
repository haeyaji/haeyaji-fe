// 약속 상세 — 한 페이지 결과 중심. 참여 현황(위) → 겹치는 시간 결과 테이블(메인).
// 가능한 시간대 리스트는 버튼→모달. 내 되는/안되는 시간은 "내 시간 수정" 모달에서 편집.
import { useMemo, useState } from 'react'
import { WeatherIcon } from '@/lib/icons'
import { longDate, mdLabel, hhmm, dur, candidateSlots, friendFree, friendEntered, taskTick, type Slot } from './meetupShared'
import { MC, cardStyle } from './tokens'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore, type MeetCell } from '@/store/useMeetupStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { Avatar, HeatGrid, TimeGrid } from './meetupShared'
import { Shell } from './CreateMeetupModal'
import type { WeatherCond } from '@/types'

type Sel = { slot: Slot; startH: number; endH: number }

export function MeetupDetailPage({ id, onBack }: { id: string; onBack: () => void }) {
  const meetup = useMeetupStore((s) => s.meetups.find((m) => m.id === id))
  const update = useMeetupStore((s) => s.update)
  const remove = useMeetupStore((s) => s.remove)
  const allFriendIds = useFriendStore((s) => s.friendIds)
  const openMap = useAppStore((s) => s.openMap)
  const toast = useAppStore((s) => s.toast)
  const [adding, setAdding] = useState(false)
  const [slotOpen, setSlotOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [initialSel, setInitialSel] = useState<Slot | null>(null)

  const enteredIds = useMemo(() => (meetup ? meetup.friendIds.filter((fid) => friendEntered(fid, meetup.id)) : []), [meetup])

  if (!meetup) return null
  const participants = meetup.friendIds.map(userById).filter(Boolean)
  const total = meetup.friendIds.length + 1
  const myEntered = Object.values(meetup.myCells).some((v) => v === 'free')
  const enteredCount = (myEntered ? 1 : 0) + enteredIds.length
  const addable = allFriendIds.filter((fid) => !meetup.friendIds.includes(fid)).map(userById).filter(Boolean)
  const slotCount = candidateSlots(meetup.dates, meetup.myCells, enteredIds).length

  const heroBg = meetup.confirmed ? MC.confGrad : MC.slateGrad
  const openSlots = (preselect?: Slot) => { setInitialSel(preselect ?? null); setSlotOpen(true) }
  const pickByTick = (date: string, tick: number) => {
    const s = candidateSlots(meetup.dates, meetup.myCells, enteredIds).find((x) => x.date === date && tick >= x.startH && tick < x.endH)
    openSlots(s)
  }

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: MC.canvas }}>
      <div className="mp-wrap">
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

        {/* 참여 현황 (결과 테이블 위) */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>참여 현황 <span style={{ fontSize: 15, color: MC.primary }}>{enteredCount}</span><span style={{ fontSize: 15, color: MC.faint }}>/{total}</span></div>
            {addable.length > 0 && (
              <div onClick={() => setAdding((v) => !v)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 800, color: MC.primary, background: MC.tintBg, padding: '7px 12px', borderRadius: 20, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> 친구 추가
              </div>
            )}
          </div>
          <div style={{ height: 6, borderRadius: 4, background: '#ECE9E0', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ width: `${total ? (enteredCount / total) * 100 : 0}%`, height: '100%', background: MC.primary, borderRadius: 4, transition: 'width .3s ease' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <StatChip name="나" entered={myEntered} />
            {participants.map((u) => <StatChip key={u!.id} name={u!.nickname} entered={friendEntered(u!.id, meetup.id)} onRemove={() => update(id, { friendIds: meetup.friendIds.filter((x) => x !== u!.id) })} />)}
          </div>
          {adding && (
            <div style={{ marginTop: 12, background: MC.fieldBg, borderRadius: 13, padding: 8, display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
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

        {/* 결과 테이블 (메인) */}
        {meetup.dates.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>겹치는 시간</div>
              <div onClick={() => setEditOpen(true)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: MC.ink, background: MC.fieldBg, border: `1px solid ${MC.border}`, padding: '8px 13px', borderRadius: 11, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MC.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                내 시간 수정
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: MC.muted, marginBottom: 14 }}>입력한 사람들 기준 · 진할수록 많이 겹쳐요 · 30분 단위</div>
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

        {/* 하단 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          {meetup.dates.length > 0 && (
            <div onClick={() => openSlots()} className="lift" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 15, background: MC.primary, color: '#fff', fontSize: 15.5, fontWeight: 800, cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
              가능한 시간대 <span style={{ background: 'rgba(255,255,255,.28)', padding: '1px 8px', borderRadius: 20, fontSize: 13 }}>{slotCount}</span>
            </div>
          )}
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

      {slotOpen && <SlotListModal id={id} initial={initialSel} onClose={() => setSlotOpen(false)} />}
      {editOpen && <EditMyTimeModal id={id} onClose={() => setEditOpen(false)} />}
    </div>
  )
}

// ── 가능한 시간대 모달 ──
function SlotListModal({ id, initial, onClose }: { id: string; initial: Slot | null; onClose: () => void }) {
  const meetup = useMeetupStore((s) => s.meetups.find((m) => m.id === id))!
  const update = useMeetupStore((s) => s.update)
  const addTaskAt = useTodoStore((s) => s.addTaskAt)
  const toast = useAppStore((s) => s.toast)
  const byDate = useWeatherStore((s) => s.byDate)
  const [filter, setFilter] = useState<'all' | 'majority' | 'full'>('all')
  const [sel, setSel] = useState<Sel | null>(initial ? { slot: initial, startH: initial.startH, endH: initial.endH } : null)

  const enteredIds = meetup.friendIds.filter((fid) => friendEntered(fid, meetup.id))
  const total = meetup.friendIds.length + 1
  const allSlots = candidateSlots(meetup.dates, meetup.myCells, enteredIds)
  const majCut = Math.floor(total / 2) + 1
  const counts = { all: allSlots.length, majority: allSlots.filter((x) => x.count >= majCut).length, full: allSlots.filter((x) => x.count === total).length }
  const slots = allSlots.filter((x) => (filter === 'full' ? x.count === total : filter === 'majority' ? x.count >= majCut : true))
  const participants = meetup.friendIds.map(userById).filter(Boolean)

  const confirm = () => {
    if (!sel) return
    update(id, { confirmed: { date: sel.slot.date, startH: sel.startH, endH: sel.endH } })
    addTaskAt(sel.slot.date, `${meetup.title} · ${participants.map((u) => u!.nickname).join(', ') || '나'} (${hhmm(sel.startH)}~${hhmm(sel.endH)})`, 'todo')
    toast('약속을 확정하고 캘린더에 등록했어요')
    onClose()
  }

  return (
    <Shell onClose={onClose} title={`가능한 시간대 ${allSlots.length}개`} width={700}>
      <div style={{ display: 'flex', gap: 6, marginTop: 4, marginBottom: 12 }}>
        {([['all', '모두'], ['majority', '과반수'], ['full', '전원']] as const).map(([k, l]) => {
          const active = filter === k
          return <div key={k} onClick={() => setFilter(k)} className="hbtn" style={{ flex: 1, textAlign: 'center', padding: '9px 4px', borderRadius: 11, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: active ? MC.ink : MC.fieldBg, color: active ? '#fff' : MC.muted }}>{l} {counts[k]}</div>
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '58vh', overflowY: 'auto', paddingRight: 4 }}>
        {slots.length > 0 ? slots.slice(0, 20).map((slot) => {
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
              <div onClick={() => (on ? setSel(null) : setSel({ slot, startH: slot.startH, endH: slot.endH }))} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 13, cursor: 'pointer', background: on ? MC.tintBg : '#fff', border: `1px solid ${on ? MC.primary : MC.border}` }}>
                <div style={{ width: 24, height: 24, flexShrink: 0 }}>{cond && <WeatherIcon cond={cond} c={cond === 'sunny' ? MC.amber : '#A6A296'} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: MC.muted }}>{mdLabel(slot.date)}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: on ? MC.tintText : MC.ink }}>{hhmm(slot.startH)}~{hhmm(slot.endH)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: MC.muted }}>{dur(slot.startH, slot.endH)}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: full ? '#fff' : MC.tintText, background: full ? MC.primary : MC.tintBg, padding: '4px 10px', borderRadius: 20, flexShrink: 0 }}>{full ? `전원 ${total}` : `${slot.count}/${total}`}</span>
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
                  <div onClick={confirm} className="lift" style={{ marginTop: 14, height: 46, borderRadius: 12, background: MC.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 14px rgba(31,122,92,.26)' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
                    {hhmm(sel.startH)}~{hhmm(sel.endH)} 확정
                  </div>
                </div>
              )}
            </div>
          )
        }) : (
          <div style={{ padding: '30px 0', textAlign: 'center', color: MC.faint, fontSize: 14.5, fontWeight: 600 }}>이 조건에 맞는 시간대가 없어요.</div>
        )}
      </div>
    </Shell>
  )
}

// ── 내 되는/안되는 시간 수정 모달 ──
function EditMyTimeModal({ id, onClose }: { id: string; onClose: () => void }) {
  const meetup = useMeetupStore((s) => s.meetups.find((m) => m.id === id))!
  const update = useMeetupStore((s) => s.update)
  const toast = useAppStore((s) => s.toast)
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const [paintMode, setPaintMode] = useState<MeetCell>('free')

  // 내 할 일을 그리드 셀에 표시 (표시 전용, 선택은 그대로)
  const marks = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const d of meetup.dates) {
      for (const t of tasksByDate[d] ?? []) {
        const tk = taskTick(t.time)
        if (tk == null) continue
        const key = `${d}|${tk}`
        ;(out[key] ??= []).push(t.title)
      }
    }
    return out
  }, [meetup.dates, tasksByDate])
  const hasMarks = Object.keys(marks).length > 0

  return (
    <Shell onClose={onClose} title="내 되는 시간" width={960}>
      <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
        내 일정을{' '}
        <span style={{ display: 'inline-flex', background: MC.chipBg, borderRadius: 16, padding: 2, verticalAlign: 'middle', margin: '0 2px' }}>
          {([['free', '되는'], ['busy', '안되는']] as const).map(([m, l]) => (
            <span key={m} onClick={() => setPaintMode(m)} style={{ padding: '4px 10px', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', background: paintMode === m ? (m === 'free' ? MC.primary : '#EA8850') : 'transparent', color: paintMode === m ? '#fff' : MC.faint }}>{l}</span>
          ))}
        </span>{' '}
        시간으로 칠해주세요
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: MC.muted, marginTop: 6, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span>드래그해서 여러 칸을 한 번에 · 바로 저장돼요</span>
        {hasMarks && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#9A7A3A' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C08A3A' }} />내 할 일 표시</span>}
      </div>
      <TimeGrid dates={meetup.dates} cells={meetup.myCells} onChange={(next) => update(id, { myCells: next })} paintMode={paintMode} marks={marks} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div onClick={() => update(id, { myCells: {} })} className="hbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: MC.muted, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          초기화
        </div>
        <div onClick={() => { toast('내 시간을 저장했어요'); onClose() }} className="lift" style={{ background: MC.ink, color: '#fff', fontSize: 14.5, fontWeight: 800, borderRadius: 13, padding: '12px 26px', cursor: 'pointer' }}>완료</div>
      </div>
    </Shell>
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
