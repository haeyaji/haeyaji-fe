// 약속잡기 — modutime(모두의 시간) 레퍼런스.
// 플로우: ① 약속 정보(종류·이름·친구) → ② 월 달력 날짜 다중선택 → ③ 시간 그리드에
//        "되는/안되는 시간" 드래그 페인트 → ④ 겹침 히트맵(우선순위) → 확정 시 캘린더 등록.
// 링크공유/실시간 다인 방은 be 필요 — 친구 가용성은 결정론 hash mock.
import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, WeatherIcon } from '@/lib/icons'
import { todayKey, dowLabel, dayNum, parseKey, fmtKey, addDays } from '@/lib/dates'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useAppStore } from '@/store/useAppStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import type { AppUser, WeatherCond } from '@/types'

const TYPES = ['가벼운 모임', '팀 회의', '정기 모임', '기타']
const HOURS = Array.from({ length: 13 }, (_, i) => 9 + i) // 09~21
const STEP_TITLES = ['약속 정보', '날짜 선택', '되는 시간', '우선순위']

type Cell = 'free' | 'busy'

// 결정론 가용성 mock — 같은 입력이면 항상 같은 결과 (Date.now/random 금지)
function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}
const friendFree = (friendId: string, date: string, hour: number): boolean => hash(friendId + date + hour) % 4 !== 0
const mdLabel = (k: string) => `${String(parseKey(k).getMonth() + 1).padStart(2, '0')}.${String(dayNum(k)).padStart(2, '0')}(${dowLabel(k)})`

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
  const [rangeMode, setRangeMode] = useState(true)
  const [ym, setYm] = useState(() => { const d = parseKey(todayKey()); return { y: d.getFullYear(), m: d.getMonth() } })
  const [cells, setCells] = useState<Record<string, Cell>>({}) // "date|hour" → free/busy (내 일정)
  const [paintMode, setPaintMode] = useState<Cell>('free')
  const [confirmed, setConfirmed] = useState<{ date: string; hour: number } | null>(null)
  const painting = useRef<Cell | 'clear' | null>(null)

  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const names = picked.map((id) => userById(id)?.nickname).filter(Boolean)
  const namesLabel = names.length <= 2 ? names.join(', ') : `${names[0]} 외 ${names.length - 1}명`
  const meetLabel = title.trim() || type
  const sortedDates = useMemo(() => [...dates].sort(), [dates])
  const total = picked.length + 1 // 친구 + 나

  // 드래그 페인트 종료
  useEffect(() => {
    const up = () => { painting.current = null }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  // 값을 호출 시점에 캡처 (setCells 업데이터가 ref를 비동기로 읽는 레이스 방지)
  const applyCell = (key: string, value: Cell | 'clear') => setCells((prev) => {
    const next = { ...prev }
    if (value === 'clear') delete next[key]
    else next[key] = value
    return next
  })
  const onCellDown = (key: string) => {
    const value = cells[key] === paintMode ? 'clear' : paintMode // 같은 값 다시 누르면 지우기
    painting.current = value
    applyCell(key, value)
  }
  const onCellEnter = (key: string) => { if (painting.current) applyCell(key, painting.current) }

  // 우선순위: 셀별 겹침(나 free + 친구 가용) 내림차순
  const ranking = useMemo(() => {
    const rows = sortedDates.flatMap((d) =>
      HOURS.map((h) => {
        const mine = cells[`${d}|${h}`] === 'free' ? 1 : 0
        const fr = picked.filter((id) => friendFree(id, d, h)).length
        return { date: d, hour: h, count: mine + fr }
      }),
    )
    return rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.hour - b.hour)
  }, [sortedDates, cells, picked])
  const maxCount = ranking[0]?.count ?? 0

  // 달력 셀
  const calCells = useMemo(() => {
    const firstDow = new Date(ym.y, ym.m, 1).getDay()
    const lastDay = new Date(ym.y, ym.m + 1, 0).getDate()
    const arr: (string | null)[] = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= lastDay; d++) arr.push(fmtKey(new Date(ym.y, ym.m, d)))
    return arr
  }, [ym])

  const toggleDate = (k: string) => {
    if (k < todayKey()) return
    if (!rangeMode) { setDates((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k])); return }
    setDates((p) => {
      if (p.length !== 1) return [k]
      const [a, b] = [p[0], k].sort()
      const out: string[] = []
      for (let d = a; d <= b; d = addDays(d, 1)) out.push(d)
      return out
    })
  }
  const moveMonth = (n: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }))

  const confirm = (date: string, hour: number) => {
    addTaskAt(date, `${meetLabel} · ${namesLabel} (${hour}시)`, 'todo')
    setConfirmed({ date, hour })
  }
  const goPlaces = () => { onClose(); openMap() }

  // ── 확정 완료 ──
  if (confirmed) {
    return (
      <Shell onClose={onClose} title={meetLabel}>
        <div style={{ textAlign: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#EAF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 16 }}>약속이 확정됐어요!</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>{namesLabel}님과 {parseKey(confirmed.date).getMonth() + 1}월 {dayNum(confirmed.date)}일 ({dowLabel(confirmed.date)}) {confirmed.hour}시<br />캘린더에 등록했어요</div>
          <div onClick={goPlaces} className="lift" style={{ marginTop: 22, height: 52, borderRadius: 15, background: '#17150F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
            갈 만한 곳 찾아보기
          </div>
          <div onClick={onClose} className="hbtn" style={{ marginTop: 8, padding: 12, fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>닫기</div>
        </div>
      </Shell>
    )
  }

  const canNext = step === 0 ? picked.length > 0 : step === 1 ? dates.length > 0 : step === 2 ? Object.values(cells).some((v) => v === 'free') : true

  return (
    <Shell onClose={onClose} title={STEP_TITLES[step]}>
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
              return <div key={t} onClick={() => setType(t)} className="hbtn" style={{ padding: '9px 15px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>{t}</div>
            })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', margin: '20px 0 8px' }}>약속 이름</div>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 15))} placeholder="예: 주말 브런치 (최대 15자)" style={{ width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 12, padding: '13px 15px', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 600, color: '#17150F' }} />
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
            {calCells.map((k, i) => {
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

      {/* STEP 3: 시간 그리드 페인트 */}
      {step === 2 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.2px' }}>
            내 일정을{' '}
            <span style={{ display: 'inline-flex', background: '#F0F2F6', borderRadius: 16, padding: 2, verticalAlign: 'middle', margin: '0 2px' }}>
              {([['free', '되는'], ['busy', '안되는']] as const).map(([m, l]) => (
                <span key={m} onClick={() => setPaintMode(m)} style={{ padding: '4px 10px', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', background: paintMode === m ? (m === 'free' ? '#15795A' : '#E0883A') : 'transparent', color: paintMode === m ? '#fff' : '#A39C8E' }}>{l}</span>
              ))}
            </span>{' '}
            시간으로 칠해주세요
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', marginTop: 6 }}>드래그해서 여러 칸을 한 번에 칠할 수 있어요</div>

          {/* 그리드 */}
          <div style={{ marginTop: 16, overflowX: 'auto', border: '1px solid #EAECEF', borderRadius: 12, touchAction: 'none' }}>
            <div style={{ display: 'flex', minWidth: 'min-content' }}>
              {/* 시간 라벨 열 */}
              <div style={{ flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                <div style={{ height: 34, borderBottom: '1px solid #EAECEF' }} />
                {HOURS.map((h) => (
                  <div key={h} style={{ width: 34, height: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#A39C8E', transform: 'translateY(-6px)' }}>{h}</div>
                ))}
              </div>
              {/* 날짜 열들 */}
              {sortedDates.map((d) => (
                <div key={d} style={{ flex: 1, minWidth: 72, borderLeft: '1px solid #EAECEF' }}>
                  <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#17150F', borderBottom: '1px solid #EAECEF' }}>{mdLabel(d)}</div>
                  {HOURS.map((h) => {
                    const key = `${d}|${h}`
                    const st = cells[key]
                    return (
                      <div
                        key={h}
                        onPointerDown={(e) => { e.preventDefault(); onCellDown(key) }}
                        onPointerEnter={() => onCellEnter(key)}
                        style={{ height: 30, borderTop: h === HOURS[0] ? 'none' : '1px solid #F0F1F3', cursor: 'pointer', background: st === 'free' ? '#57B48C' : st === 'busy' ? '#E8A05B' : '#fff' }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div onClick={() => setCells({})} className="hbtn" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#8B8579', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            초기화
          </div>
        </div>
      )}

      {/* STEP 4: 겹침 히트맵 */}
      {step === 3 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.3px' }}>가장 잘 맞는 시간</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8B8579', marginTop: 6 }}>진할수록 많이 겹쳐요 · 칸을 눌러 확정하세요</div>

          <div style={{ marginTop: 16, overflowX: 'auto', border: '1px solid #EAECEF', borderRadius: 12 }}>
            <div style={{ display: 'flex', minWidth: 'min-content' }}>
              <div style={{ flexShrink: 0, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                <div style={{ height: 34, borderBottom: '1px solid #EAECEF' }} />
                {HOURS.map((h) => (
                  <div key={h} style={{ width: 34, height: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#A39C8E', transform: 'translateY(-6px)' }}>{h}</div>
                ))}
              </div>
              {sortedDates.map((d) => (
                <div key={d} style={{ flex: 1, minWidth: 72, borderLeft: '1px solid #EAECEF' }}>
                  <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #EAECEF' }}>{mdLabel(d)}</div>
                  {HOURS.map((h) => {
                    const mine = cells[`${d}|${h}`] === 'free' ? 1 : 0
                    const count = mine + picked.filter((id) => friendFree(id, d, h)).length
                    const r = total ? count / total : 0
                    const isBest = count === maxCount && count > 0
                    return (
                      <div key={h} onClick={() => count > 0 && confirm(d, h)} title={`${count}/${total}명`} style={{ height: 30, borderTop: h === HOURS[0] ? 'none' : '1px solid #F0F1F3', cursor: count > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', background: r === 0 ? '#fff' : `rgba(21,121,90,${(0.15 + 0.85 * r).toFixed(2)})`, boxShadow: isBest ? 'inset 0 0 0 2px #17150F' : 'none' }}>
                        {count > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: r > 0.5 ? '#fff' : '#0F5A42' }}>{count}</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {maxCount > 0 && (() => {
            const best = ranking[0]
            return (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, background: '#EAF5EF', borderRadius: 13, padding: '13px 15px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#15795A', padding: '4px 9px', borderRadius: 20 }}>추천</span>
                <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: '#0F5A42' }}>{parseKey(best.date).getMonth() + 1}월 {dayNum(best.date)}일 ({dowLabel(best.date)}) {best.hour}시 · {best.count}/{total}명</div>
                <div onClick={() => confirm(best.date, best.hour)} className="lift" style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', background: '#15795A', padding: '9px 16px', borderRadius: 11, cursor: 'pointer', flexShrink: 0 }}>확정</div>
              </div>
            )
          })()}
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
        <div onClick={() => setStep(2)} className="hbtn" style={{ marginTop: 14, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: 10 }}>시간 다시 칠하기</div>
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
