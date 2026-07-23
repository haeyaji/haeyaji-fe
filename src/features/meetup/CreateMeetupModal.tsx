// 약속 만들기 — 정보(종류·이름·친구 선택) → 날짜 → 내 되는시간. 친구는 선택사항(나중에 추가 가능).
import { useMemo, useState } from 'react'
import { useOverlay } from '@/lib/useOverlay'
import { CloseIcon, WeatherIcon } from '@/lib/icons'
import { todayKey, dayNum, parseKey, fmtKey, addDays } from '@/lib/dates'
import { useWeatherStore } from '@/store/useWeatherStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore, type MeetCell } from '@/store/useMeetupStore'
import { useTodoStore } from '@/store/useTodoStore'
import { MEET_TYPES, meetTypeLabel, Avatar, TimeGrid, taskTick } from './meetupShared'
import type { WeatherCond } from '@/types'

export function CreateMeetupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const friendIds = useFriendStore((s) => s.friendIds)
  const byDate = useWeatherStore((s) => s.byDate)
  const createMeetup = useMeetupStore((s) => s.create)

  const [step, setStep] = useState(0)
  const [type, setType] = useState<import('@/store/useMeetupStore').MeetingType>('CASUAL')
  const [title, setTitle] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [rangeMode, setRangeMode] = useState(true)
  const [ym, setYm] = useState(() => { const d = parseKey(todayKey()); return { y: d.getFullYear(), m: d.getMonth() } })
  const [cells, setCells] = useState<Record<string, MeetCell>>({})
  const [paintMode, setPaintMode] = useState<MeetCell>('free')

  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const friends = friendIds.map(userById).filter(Boolean)
  const sortedDates = useMemo(() => [...dates].sort(), [dates])
  const marks = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const d of sortedDates) for (const t of tasksByDate[d] ?? []) { const tk = taskTick(t.time); if (tk != null) (out[`${d}|${tk}`] ??= []).push(t.title) }
    return out
  }, [sortedDates, tasksByDate])

  // 선택 가능 범위: 오늘 ~ 오늘+2개월. 기간 선택 최대 폭: 31일(한 달).
  const MAX_RANGE_DAYS = 31
  const maxKey = useMemo(() => { const d = parseKey(todayKey()); return fmtKey(new Date(d.getFullYear(), d.getMonth() + 2, d.getDate())) }, [])
  const outOfRange = (k: string) => k < todayKey() || k > maxKey

  const calCells = useMemo(() => {
    const firstDow = new Date(ym.y, ym.m, 1).getDay()
    const lastDay = new Date(ym.y, ym.m + 1, 0).getDate()
    const arr: (string | null)[] = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= lastDay; d++) arr.push(fmtKey(new Date(ym.y, ym.m, d)))
    return arr
  }, [ym])

  const toggleDate = (k: string) => {
    if (outOfRange(k)) return
    if (!rangeMode) { setDates((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k])); return }
    setDates((p) => {
      if (p.length !== 1) return [k]
      let [a, b] = [p[0], k].sort()
      // 최대 31일로 제한 (시작 기준). 넘으면 끝을 잘라냄.
      const cap = addDays(a, MAX_RANGE_DAYS - 1)
      if (b > cap) b = cap
      const out: string[] = []
      for (let d = a; d <= b; d = addDays(d, 1)) out.push(d)
      return out
    })
  }
  const moveMonth = (n: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }))

  const finish = () => {
    const id = createMeetup({ title: title.trim() || meetTypeLabel(type), type, friendIds: picked, dates: sortedDates, myCells: cells })
    onCreated(id)
  }

  const canNext = step === 0 ? title.trim().length > 0 : step === 1 ? dates.length > 0 : true
  const titles = ['새 약속', '날짜 선택', '내 되는 시간']

  return (
    <Shell onClose={onClose} title={titles[step]} width={step === 2 ? 'min(1600px, 95vw)' : 720} fill={step === 2}>
      <div style={{ height: 4, borderRadius: 3, background: '#EEF0F4', overflow: 'hidden', margin: '4px 0 20px', flexShrink: 0 }}>
        <div style={{ width: `${((step + 1) / 3) * 100}%`, height: '100%', background: '#1F7A5C', borderRadius: 3, transition: 'width .3s ease' }} />
      </div>

      {step === 0 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>어떤 약속인가요?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {MEET_TYPES.map((t) => {
              const on = type === t.code
              return <div key={t.code} onClick={() => setType(t.code)} className="hbtn" style={{ padding: '9px 15px', borderRadius: 20, fontSize: 14, fontWeight: 800, cursor: 'pointer', background: on ? '#1E1C17' : '#F0EEE7', color: on ? '#fff' : '#8C8779' }}>{t.label}</div>
            })}
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, color: '#8C8779', margin: '20px 0 8px' }}>약속 이름</div>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value.slice(0, 15))} placeholder="예: 주말 브런치" style={{ width: '100%', border: '1px solid #E8E5DC', outline: 'none', background: '#F6F5F0', borderRadius: 12, padding: '13px 15px', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 600, color: '#1E1C17' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '20px 0 8px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8C8779' }}>누구랑 {picked.length > 0 && <span style={{ color: '#1F7A5C' }}>{picked.length}</span>}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#B7B3A6' }}>· 나중에 추가해도 돼요</div>
          </div>
          {friends.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {friends.map((u) => {
                const on = picked.includes(u!.id)
                return (
                  <div key={u!.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== u!.id) : [...p, u!.id]))} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px', borderRadius: 13, cursor: 'pointer', background: on ? '#EAF3EE' : '#F6F5F0', border: `2px solid ${on ? '#1F7A5C' : 'transparent'}` }}>
                    <Avatar name={u!.nickname} size={36} font={16} />
                    <div style={{ flex: 1, fontSize: 15.5, fontWeight: 800, color: on ? '#1B6B4F' : '#1E1C17' }}>{u!.nickname}</div>
                    {on && <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1F7A5C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: 18, textAlign: 'center', background: '#F6F5F0', borderRadius: 13, color: '#B7B3A6', fontSize: 13.5, fontWeight: 600 }}>친구를 추가하면 함께 조율할 수 있어요</div>
          )}
        </div>
      )}

      {step === 1 && (
        <div style={{ animation: 'rb-pop .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div onClick={() => moveMonth(-1)} className="hbtn" style={{ width: 28, height: 28, borderRadius: 8, background: '#F0EEE7', color: '#8C8779', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{ym.y}년 {ym.m + 1}월</div>
              <div onClick={() => moveMonth(1)} className="hbtn" style={{ width: 28, height: 28, borderRadius: 8, background: '#F0EEE7', color: '#8C8779', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
            <div style={{ display: 'flex', background: '#F0EEE7', borderRadius: 20, padding: 3 }}>
              {[{ k: true, l: '기간' }, { k: false, l: '하나씩' }].map((o) => (
                <div key={o.l} onClick={() => { setRangeMode(o.k); setDates([]) }} style={{ padding: '6px 14px', borderRadius: 18, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: rangeMode === o.k ? '#fff' : 'transparent', color: rangeMode === o.k ? '#1F7A5C' : '#8C8779', boxShadow: rangeMode === o.k ? '0 1px 3px rgba(24,21,15,.1)' : 'none' }}>{o.l}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginTop: 16, marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: i === 0 ? '#C2453B' : i === 6 ? '#3F82C2' : '#8C8779' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {calCells.map((k, i) => {
              if (!k) return <div key={'b' + i} />
              const on = dates.includes(k)
              const disabled = outOfRange(k)
              const raw = byDate[k]
              const cond = raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? (raw.cond as WeatherCond) : undefined
              return (
                <div key={k} onClick={() => toggleDate(k)} style={{ aspectRatio: '1 / 1.15', borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1, background: on ? '#1F7A5C' : 'transparent', color: disabled ? '#CFCBBE' : on ? '#fff' : '#1E1C17' }}>
                  <div style={{ fontSize: 15, fontWeight: on ? 800 : 700 }}>{dayNum(k)}</div>
                  <div style={{ width: 15, height: 15 }}>{cond && !on && !disabled && <WeatherIcon cond={cond} c={cond === 'sunny' ? '#E6A52E' : '#B7B3A6'} />}</div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 600, color: '#B7B3A6', textAlign: 'center' }}>
            {dates.length > 0 ? <span style={{ color: '#8C8779', fontWeight: 700 }}>{dates.length}일 선택됨 · </span> : null}오늘~2개월 이내 · 기간은 최대 31일
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: 'rb-pop .2s ease', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.2px', flexShrink: 0 }}>
            내 일정을{' '}
            <span style={{ display: 'inline-flex', background: '#F0EEE7', borderRadius: 16, padding: 2, verticalAlign: 'middle', margin: '0 2px' }}>
              {([['free', '되는'], ['busy', '안되는']] as const).map(([m, l]) => (
                <span key={m} onClick={() => setPaintMode(m)} style={{ padding: '4px 10px', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', background: paintMode === m ? (m === 'free' ? '#1F7A5C' : '#EA8850') : 'transparent', color: paintMode === m ? '#fff' : '#8C8779' }}>{l}</span>
              ))}
            </span>{' '}
            시간으로 칠해주세요
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8C8779', marginTop: 6, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <span>드래그해서 여러 칸을 한 번에 · 나중에 수정할 수 있어요</span>
            {Object.keys(marks).length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#9A7A3A' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C08A3A' }} />내 할 일 표시</span>}
          </div>
          <TimeGrid dates={sortedDates} cells={cells} onChange={setCells} paintMode={paintMode} marks={marks} fill />
          <div onClick={() => setCells({})} className="hbtn" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#8C8779', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            초기화
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, flexShrink: 0 }}>
        {step > 0 ? (
          <div onClick={() => setStep(step - 1)} className="hbtn" style={{ fontSize: 14.5, fontWeight: 700, color: '#8C8779', cursor: 'pointer', padding: '10px 6px' }}>이전</div>
        ) : <div />}
        <div style={{ flex: 1 }} />
        <div onClick={() => { if (!canNext) return; step === 2 ? finish() : setStep(step + 1) }} className="lift" style={{ background: canNext ? '#1E1C17' : '#CFCBBE', color: '#fff', fontSize: 15.5, fontWeight: 800, borderRadius: 14, padding: '13px 32px', cursor: canNext ? 'pointer' : 'default' }}>{step === 2 ? '약속 만들기' : '다음'}</div>
      </div>
    </Shell>
  )
}

// fill=true: 세로를 뷰포트 기준(92vh)으로 꽉 채우는 flex 컬럼. 자식 중 flex:1 요소가 남는 높이를 차지.
// fill=false: 내용 높이만큼(최대 90vh) 자라는 기본 모달.
export function Shell({ children, onClose, title, width = 640, fill = false }: { children: React.ReactNode; onClose: () => void; title: string; width?: number | string; fill?: boolean }) {
  useOverlay(true, onClose)
  // fill 높이는 #root zoom을 보정한 실제 화면 기준(--full-vh)으로 잡아야 진짜 90%가 됨.
  const box: React.CSSProperties = fill
    ? { width, maxWidth: '100%', height: 'calc(var(--full-vh, 100vh) * 0.92)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { width, maxWidth: '100%', maxHeight: 'calc(var(--full-vh, 100vh) * 0.9)', overflowY: 'auto' }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 61, background: 'rgba(30,28,23,.44)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...box, background: '#fff', borderRadius: 24, boxShadow: '0 40px 90px rgba(30,28,23,.4)', animation: 'rb-modal .22s ease', padding: '22px 28px 28px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1E1C17' }}>{title}</div>
          <div style={{ flex: 1 }} />
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 11, background: '#F0EEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={15} />
          </div>
        </div>
        {fill ? <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div> : children}
      </div>
    </div>
  )
}
