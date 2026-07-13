// 약속잡기 (mock) — 3스텝: 친구 선택 → 날짜(날씨 표시) → 시간대(겹침).
// 확정 시 캘린더·할일에 등록. be 약속 테이블 생기면 가용성·저장 교체.
import { useState } from 'react'
import { CloseIcon, WeatherIcon } from '@/lib/icons'
import { next7Days, dowLabel, dayNum, todayKey } from '@/lib/dates'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import type { AppUser, WeatherCond } from '@/types'

const SLOTS = [
  { key: '아침', label: '아침', sub: '09–12시' },
  { key: '점심', label: '점심', sub: '12–15시' },
  { key: '오후', label: '오후', sub: '15–18시' },
  { key: '저녁', label: '저녁', sub: '18–21시' },
]

// 결정론 가용성 mock (Date.now/random 금지 — 같은 입력이면 항상 같은 결과)
function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}
const availOn = (friendId: string, dateKey: string): boolean => hash(friendId + dateKey) % 3 !== 0
const availAt = (friendId: string, dateKey: string, slot: string): boolean => hash(friendId + dateKey + slot) % 5 !== 0

export function MeetupModal({ initialFriend, onClose }: { initialFriend: AppUser; onClose: () => void }) {
  const friendIds = useFriendStore((s) => s.friendIds)
  const byDate = useWeatherStore((s) => s.byDate)
  const addTaskAt = useTodoStore((s) => s.addTaskAt)
  const openMap = useAppStore((s) => s.openMap)

  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string[]>([initialFriend.id])
  const [date, setDate] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const days = next7Days()

  const names = picked.map((id) => userById(id)?.nickname).filter(Boolean)
  const namesLabel = names.length <= 2 ? names.join(', ') : `${names[0]} 외 ${names.length - 1}명`

  const confirm = () => {
    if (!date || !slot) return
    addTaskAt(date, `${namesLabel}님과 약속 (${slot})`, 'todo')
    setDone(true)
  }
  const goPlaces = () => { onClose(); openMap() }

  // 완료 화면
  if (done) {
    return (
      <Shell onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#EAF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 16 }}>약속이 잡혔어요!</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>{namesLabel}님과 {date && dowLabel(date)}요일 {slot}<br />캘린더에 등록했어요</div>
          <div onClick={goPlaces} className="lift" style={{ marginTop: 22, height: 52, borderRadius: 15, background: '#17150F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
            갈 만한 곳 찾아보기
          </div>
          <div onClick={onClose} className="hbtn" style={{ marginTop: 8, padding: 12, fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>닫기</div>
        </div>
      </Shell>
    )
  }

  const canNext = step === 0 ? picked.length > 0 : step === 1 ? !!date : !!slot

  return (
    <Shell onClose={onClose}>
      {/* 카운터 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#B3ADA0' }}><span style={{ color: '#15795A', fontWeight: 800 }}>{step + 1}</span> / 3</div>
      </div>

      {/* STEP 1: 친구 */}
      {step === 0 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.4px', marginTop: 8 }}>누구랑 만날까요?</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>여러 명 골라도 돼요</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, maxHeight: 320, overflowY: 'auto' }}>
            {friends.map((u) => {
              const on = picked.includes(u.id)
              return (
                <div key={u.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: on ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${on ? '#15795A' : 'transparent'}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>{u.nickname.slice(0, 1)}</div>
                  <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: on ? '#0F5A42' : '#17150F' }}>{u.nickname}</div>
                  {on && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 2: 날짜 (날씨) */}
      {step === 1 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.4px', marginTop: 8 }}>언제가 좋을까요?</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>날씨와 가능한 친구 수를 참고하세요</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9, marginTop: 18 }}>
            {days.map((k) => {
              const on = date === k
              const raw = byDate[k]
              const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
              const avail = picked.filter((id) => availOn(id, k)).length
              return (
                <div key={k} onClick={() => setDate(k)} className="lift" style={{ padding: '12px 6px 11px', borderRadius: 15, cursor: 'pointer', textAlign: 'center', background: on ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${on ? '#15795A' : 'transparent'}` }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: k === todayKey() ? '#15795A' : '#A39C8E' }}>{dowLabel(k)}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, marginTop: 2, color: on ? '#0F5A42' : '#17150F' }}>{dayNum(k)}</div>
                  <div style={{ width: 20, height: 20, margin: '7px auto 0' }}>{cond ? <WeatherIcon cond={cond} c={cond === 'sunny' ? '#E6A52E' : '#9AA0A8'} /> : <span style={{ color: '#D5D0C6', fontSize: 12 }}>–</span>}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: avail === picked.length ? '#15795A' : '#B6BCC7', marginTop: 6 }}>{avail}/{picked.length}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 3: 시간대 (겹침) */}
      {step === 2 && date && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.4px', marginTop: 8 }}>몇 시에 만날까요?</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>가장 많이 겹치는 시간을 추천해요</div>
          {(() => {
            const counts = SLOTS.map((s) => picked.filter((id) => availAt(id, date, s.key)).length)
            const best = Math.max(...counts)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
                {SLOTS.map((s, i) => {
                  const on = slot === s.key
                  const cnt = counts[i]
                  const isBest = cnt === best && best > 0
                  return (
                    <div key={s.key} onClick={() => setSlot(s.key)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', background: on ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${on ? '#15795A' : 'transparent'}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16.5, fontWeight: 800, color: on ? '#0F5A42' : '#17150F' }}>{s.label} <span style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E' }}>{s.sub}</span></div>
                      </div>
                      {isBest && <span style={{ fontSize: 11.5, fontWeight: 800, color: '#15795A', background: '#DCF0E7', padding: '4px 9px', borderRadius: 20 }}>추천</span>}
                      <div style={{ fontSize: 14, fontWeight: 800, color: cnt === picked.length ? '#15795A' : '#B6BCC7' }}>{cnt}/{picked.length}명</div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
        {step > 0 ? (
          <div onClick={() => setStep(step - 1)} className="hbtn" style={{ fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: '10px 6px' }}>이전</div>
        ) : <div />}
        <div style={{ flex: 1 }} />
        <div
          onClick={() => { if (!canNext) return; step === 2 ? confirm() : setStep(step + 1) }}
          className="lift"
          style={{ background: canNext ? '#17150F' : '#D5D0C6', color: '#fff', fontSize: 15.5, fontWeight: 800, borderRadius: 14, padding: '13px 30px', cursor: canNext ? 'pointer' : 'default' }}
        >
          {step === 2 ? '약속 잡기' : '다음'}
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 61, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '20px 24px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
