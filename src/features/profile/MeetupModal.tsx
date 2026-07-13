// 약속잡기 — modutime(모두의 시간) 레퍼런스.
// 플로우: ① 약속 정보(종류·이름·친구) → ② 월 달력 날짜 다중선택(기간/하나씩) + 날씨
//        → ③ 시간대 → ④ 우선순위 결과(겹침 랭킹) → 확정 시 캘린더 등록.
// 링크공유/실시간 다인 방은 be 필요 — mock 가용성으로 대체(결정론 hash).
import { useMemo, useState } from 'react'
import { CloseIcon, WeatherIcon } from '@/lib/icons'
import { todayKey, dowLabel, dayNum, parseKey, fmtKey, addDays } from '@/lib/dates'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import type { AppUser, WeatherCond } from '@/types'

const TYPES = ['가벼운 모임', '팀 회의', '정기 모임', '기타']
const SLOTS = [
  { key: '아침', sub: '09–12시' },
  { key: '점심', sub: '12–15시' },
  { key: '오후', sub: '15–18시' },
  { key: '저녁', sub: '18–21시' },
]
const STEP_TITLES = ['약속 정보', '날짜 선택', '시간대 선택', '우선순위']

// 결정론 가용성 mock (Date.now/random 금지 — 같은 입력이면 항상 같은 결과)
function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}
const availAt = (friendId: string, dateKey: string, slot: string): boolean => hash(friendId + dateKey + slot) % 4 !== 0

export function MeetupModal({ initialFriend, onClose }: { initialFriend: AppUser; onClose: () => void }) {
  const friendIds = useFriendStore((s) => s.friendIds)
  const byDate = useWeatherStore((s) => s.byDate)
  const addTaskAt = useTodoStore((s) => s.addTaskAt)
  const openMap = useAppStore((s) => s.openMap)

  const [step, setStep] = useState(0)
  const [type, setType] = useState('가벼운 모임')
  const [title, setTitle] = useState('')
  const [picked, setPicked] = useState<string[]>([initialFriend.id])
  const [dates, setDates] = useState<string[]>([])
  const [rangeMode, setRangeMode] = useState(true) // 기간 / 하나씩
  const [ym, setYm] = useState(() => { const d = parseKey(todayKey()); return { y: d.getFullYear(), m: d.getMonth() } })
  const [slots, setSlots] = useState<string[]>([])
  const [confirmed, setConfirmed] = useState<{ date: string; slot: string } | null>(null)

  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const names = picked.map((id) => userById(id)?.nickname).filter(Boolean)
  const namesLabel = names.length <= 2 ? names.join(', ') : `${names[0]} 외 ${names.length - 1}명`
  const meetLabel = title.trim() || type

  // 우선순위: 선택 날짜 × 시간대 조합을 겹침 인원 내림차순
  const ranking = useMemo(() => {
    const rows = dates.flatMap((d) =>
      slots.map((s) => ({ date: d, slot: s, count: picked.filter((id) => availAt(id, d, s)).length })),
    )
    return rows.sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
  }, [dates, slots, picked])

  // 달력 셀
  const cells = useMemo(() => {
    const firstDow = new Date(ym.y, ym.m, 1).getDay()
    const lastDay = new Date(ym.y, ym.m + 1, 0).getDate()
    const arr: (string | null)[] = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= lastDay; d++) arr.push(fmtKey(new Date(ym.y, ym.m, d)))
    return arr
  }, [ym])

  const toggleDate = (k: string) => {
    if (k < todayKey()) return // 과거 불가
    if (!rangeMode) {
      setDates((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))
      return
    }
    // 기간: 비었으면 시작, 하나 있으면 범위 채움, 둘 이상이면 리셋
    setDates((p) => {
      if (p.length !== 1) return [k]
      const [a, b] = [p[0], k].sort()
      const out: string[] = []
      for (let d = a; d <= b; d = addDays(d, 1)) out.push(d)
      return out
    })
  }
  const moveMonth = (n: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }))

  const confirm = (date: string, slot: string) => {
    addTaskAt(date, `${meetLabel} · ${namesLabel} (${slot})`, 'todo')
    setConfirmed({ date, slot })
  }
  const goPlaces = () => { onClose(); openMap() }

  // ── 확정 완료 화면 ──
  if (confirmed) {
    return (
      <Shell onClose={onClose} title={meetLabel}>
        <div style={{ textAlign: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#EAF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 16 }}>약속이 확정됐어요!</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>{namesLabel}님과 {dowLabel(confirmed.date)}요일 {confirmed.slot}<br />캘린더에 등록했어요</div>
          <div onClick={goPlaces} className="lift" style={{ marginTop: 22, height: 52, borderRadius: 15, background: '#17150F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
            갈 만한 곳 찾아보기
          </div>
          <div onClick={onClose} className="hbtn" style={{ marginTop: 8, padding: 12, fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>닫기</div>
        </div>
      </Shell>
    )
  }

  const canNext = step === 0 ? picked.length > 0 : step === 1 ? dates.length > 0 : step === 2 ? slots.length > 0 : true

  return (
    <Shell onClose={onClose} title={STEP_TITLES[step]}>
      {/* 진행바 */}
      <div style={{ height: 4, borderRadius: 3, background: '#EEF0F4', overflow: 'hidden', margin: '4px 0 18px' }}>
        <div style={{ width: `${((step + 1) / 4) * 100}%`, height: '100%', background: '#15795A', borderRadius: 3, transition: 'width .3s ease' }} />
      </div>

      {/* STEP 1: 약속 정보 */}
      {step === 0 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>어떤 약속인가요?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {TYPES.map((t) => {
              const on = type === t
              return (
                <div key={t} onClick={() => setType(t)} className="hbtn" style={{ padding: '9px 15px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>{t}</div>
              )
            })}
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', margin: '20px 0 8px' }}>약속 이름</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 15))}
            placeholder="예: 주말 브런치 (최대 15자)"
            style={{ width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 12, padding: '13px 15px', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 600, color: '#17150F' }}
          />

          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', margin: '20px 0 8px' }}>누구랑 <span style={{ color: '#15795A' }}>{picked.length}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {friends.map((u) => {
              const on = picked.includes(u.id)
              return (
                <div key={u.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13, cursor: 'pointer', background: on ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${on ? '#15795A' : 'transparent'}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 }}>{u.nickname.slice(0, 1)}</div>
                  <div style={{ flex: 1, fontSize: 15.5, fontWeight: 800, color: on ? '#0F5A42' : '#17150F' }}>{u.nickname}</div>
                  {on && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 2: 월 달력 다중선택 */}
      {step === 1 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div onClick={() => moveMonth(-1)} className="hbtn" style={{ width: 28, height: 28, borderRadius: 8, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{ym.y}년 {ym.m + 1}월</div>
              <div onClick={() => moveMonth(1)} className="hbtn" style={{ width: 28, height: 28, borderRadius: 8, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
            {/* 기간 / 하나씩 토글 */}
            <div style={{ display: 'flex', background: '#F0F2F6', borderRadius: 20, padding: 3 }}>
              {[{ k: true, l: '기간' }, { k: false, l: '하나씩' }].map((o) => (
                <div key={o.l} onClick={() => { setRangeMode(o.k); setDates([]) }} style={{ padding: '6px 14px', borderRadius: 18, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: rangeMode === o.k ? '#fff' : 'transparent', color: rangeMode === o.k ? '#15795A' : '#A39C8E', boxShadow: rangeMode === o.k ? '0 1px 3px rgba(24,21,15,.1)' : 'none' }}>{o.l}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginTop: 16, marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: i === 0 ? '#C2453B' : i === 6 ? '#3F82C2' : '#A39C8E' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {cells.map((k, i) => {
              if (!k) return <div key={'b' + i} />
              const on = dates.includes(k)
              const past = k < todayKey()
              const raw = byDate[k]
              const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
              return (
                <div key={k} onClick={() => toggleDate(k)} style={{ aspectRatio: '1 / 1.15', borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: past ? 'default' : 'pointer', background: on ? '#15795A' : 'transparent', color: past ? '#D5D0C6' : on ? '#fff' : '#17150F' }}>
                  <div style={{ fontSize: 15, fontWeight: on ? 800 : 700 }}>{dayNum(k)}</div>
                  <div style={{ width: 15, height: 15 }}>{cond && !on && <WeatherIcon cond={cond} c={cond === 'sunny' ? '#E6A52E' : '#B6BCC7'} />}</div>
                </div>
              )
            })}
          </div>
          {dates.length > 0 && <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 700, color: '#8B8579', textAlign: 'center' }}>{dates.length}일 선택됨</div>}
        </div>
      )}

      {/* STEP 3: 시간대 (복수) */}
      {step === 2 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>가능한 시간대는?</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>여러 개 골라도 돼요</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 18 }}>
            {SLOTS.map((s) => {
              const on = slots.includes(s.key)
              return (
                <div key={s.key} onClick={() => setSlots((p) => (on ? p.filter((x) => x !== s.key) : [...p, s.key]))} className="lift" style={{ padding: '16px 14px', borderRadius: 15, cursor: 'pointer', textAlign: 'center', background: on ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${on ? '#15795A' : 'transparent'}` }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: on ? '#0F5A42' : '#17150F' }}>{s.key}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', marginTop: 2 }}>{s.sub}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 4: 우선순위 결과 */}
      {step === 3 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>가장 잘 맞는 시간</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>겹치는 인원이 많은 순 · 눌러서 확정하세요</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18, maxHeight: 360, overflowY: 'auto' }}>
            {ranking.map((r, i) => {
              const raw = byDate[r.date]
              const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
              const best = i === 0 && r.count > 0
              const full = r.count === picked.length
              return (
                <div key={r.date + r.slot} onClick={() => confirm(r.date, r.slot)} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 15, cursor: 'pointer', background: best ? '#EAF5EF' : '#F6F8FA', border: `2px solid ${best ? '#15795A' : 'transparent'}` }}>
                  <div style={{ width: 30, height: 30, flexShrink: 0 }}>{cond && <WeatherIcon cond={cond} c={cond === 'sunny' ? '#E6A52E' : '#9AA0A8'} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{parseKey(r.date).getMonth() + 1}월 {dayNum(r.date)}일 ({dowLabel(r.date)}) · {r.slot}</div>
                    <div style={{ height: 6, borderRadius: 4, background: '#E4E7EE', overflow: 'hidden', marginTop: 7 }}>
                      <div style={{ width: `${picked.length ? (r.count / picked.length) * 100 : 0}%`, height: '100%', background: full ? '#15795A' : '#57B48C', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {best && <div style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#DCF0E7', padding: '3px 8px', borderRadius: 20, marginBottom: 4 }}>추천</div>}
                    <div style={{ fontSize: 14, fontWeight: 800, color: full ? '#15795A' : '#8B8579' }}>{r.count}/{picked.length}명</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* footer */}
      {step < 3 && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
          {step > 0 ? (
            <div onClick={() => setStep(step - 1)} className="hbtn" style={{ fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: '10px 6px' }}>이전</div>
          ) : <div />}
          <div style={{ flex: 1 }} />
          <div onClick={() => canNext && setStep(step + 1)} className="lift" style={{ background: canNext ? '#17150F' : '#D5D0C6', color: '#fff', fontSize: 15.5, fontWeight: 800, borderRadius: 14, padding: '13px 30px', cursor: canNext ? 'pointer' : 'default' }}>다음</div>
        </div>
      )}
      {step === 3 && (
        <div onClick={() => setStep(2)} className="hbtn" style={{ marginTop: 14, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: 10 }}>시간대 다시 고르기</div>
      )}
    </Shell>
  )
}

function Shell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 61, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '18px 24px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#17150F' }}>{title}</div>
          <div style={{ flex: 1 }} />
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
