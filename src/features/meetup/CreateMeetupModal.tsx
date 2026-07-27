// 약속 생성 — 제목·타입·후보날짜·시간창·슬롯단위 → be POST /meetings → shareToken.
import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon } from '@/lib/icons'
import { useOverlay } from '@/lib/useOverlay'
import { todayKey, fmtKey } from '@/lib/dates'
import { useMeetupStore } from '@/store/useMeetupStore'
import type { MeetingType } from '@/api/meetingApi'
import { MEET_TYPES } from './meetupShared'
import { MC } from './tokens'

// slotUnit(30|60)에 맞춘 "HH:mm" 옵션 (08:00 ~ 24:00)
function timeOptions(unit: number): string[] {
  const out: string[] = []
  for (let m = 8 * 60; m <= 24 * 60; m += unit) out.push(`${String(Math.floor(m / 60) % 24 || (m === 24 * 60 ? 24 : 0)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  // 24:00은 be가 자정으로 못 받으니 23:xx까지만
  return out.filter((t) => t !== '24:00' && t !== '00:00')
}

export function CreateMeetupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (shareToken: string) => void }) {
  useOverlay(true, onClose)
  const create = useMeetupStore((s) => s.create)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<MeetingType>('CASUAL')
  const [dates, setDates] = useState<string[]>([])
  const [unit, setUnit] = useState<30 | 60>(30)
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('18:00')
  const [busy, setBusy] = useState(false)

  const times = useMemo(() => timeOptions(unit), [unit])
  // 달력(월 그리드) — 드래그로 기간 선택. 월=0 시작.
  const [ym, setYm] = useState(() => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() } })
  const monthCells = useMemo(() => {
    const startDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7
    const n = new Date(ym.y, ym.m + 1, 0).getDate()
    const cells: (string | null)[] = Array.from({ length: startDow }, () => null)
    for (let d = 1; d <= n; d++) cells.push(fmtKey(new Date(ym.y, ym.m, d)))
    while (cells.length % 7) cells.push(null)
    return cells
  }, [ym])
  const today = todayKey()
  const drag = useRef<'add' | 'remove' | null>(null)
  const applyDay = (k: string, mode: 'add' | 'remove') => setDates((p) => (mode === 'add' ? (p.includes(k) ? p : [...p, k].sort()) : p.filter((x) => x !== k)))
  const onDown = (k: string) => { if (k < today) return; const mode = dates.includes(k) ? 'remove' : 'add'; drag.current = mode; applyDay(k, mode) }
  const onEnter = (k: string) => { if (drag.current && k >= today) applyDay(k, drag.current) }
  useEffect(() => { const up = () => { drag.current = null }; window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up) }, [])
  const valid = title.trim().length > 0 && dates.length > 0 && start < end

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    const d = await create({ title: title.trim(), type, dates, timeStart: start, timeEnd: end, slotUnitMinutes: unit })
    setBusy(false)
    if (d) onCreated(d.shareToken)
  }

  const chip = (on: boolean): React.CSSProperties => ({ padding: '9px 14px', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', border: `1.5px solid ${on ? MC.primary : '#E4E7EE'}`, background: on ? MC.tintBg : '#fff', color: on ? MC.tintText : '#5A554B' })

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 95vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '24px 28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 21, fontWeight: 800 }}>새 약속</div>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 11, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CloseIcon w={14} /></div>
        </div>

        <Field label="제목">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder="예: 주말 스터디" style={inputStyle} />
        </Field>

        <Field label="유형">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MEET_TYPES.map((t) => (<div key={t.code} onClick={() => setType(t.code)} style={chip(type === t.code)}>{t.label}</div>))}
          </div>
        </Field>

        <Field label={`후보 날짜 · ${dates.length}개 (드래그로 기간 선택)`}>
          <div style={{ border: '1px solid #ECEAE3', borderRadius: 14, padding: 12, userSelect: 'none', WebkitUserSelect: 'none' }}>
            {/* 월 네비 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div onClick={() => setYm((p) => (p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 }))} className="hbtn" style={{ width: 28, height: 28, borderRadius: 8, background: '#F4F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8579" strokeWidth="2.4" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{ym.y}년 {ym.m + 1}월</div>
              <div onClick={() => setYm((p) => (p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 }))} className="hbtn" style={{ width: 28, height: 28, borderRadius: 8, background: '#F4F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8579" strokeWidth="2.4" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
            {/* 요일 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
              {['월', '화', '수', '목', '금', '토', '일'].map((w, i) => (
                <div key={w} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 800, color: i === 5 ? '#3F82C2' : i === 6 ? '#D9614F' : MC.faint }}>{w}</div>
              ))}
            </div>
            {/* 날짜 셀 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {monthCells.map((k, i) => {
                if (!k) return <div key={`e${i}`} />
                const past = k < today
                const on = dates.includes(k)
                const day = Number(k.slice(8))
                return (
                  <div key={k}
                    onMouseDown={() => onDown(k)}
                    onMouseEnter={() => onEnter(k)}
                    style={{ height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 800, cursor: past ? 'default' : 'pointer', color: past ? '#CBD0D8' : on ? '#fff' : k === today ? MC.primary : '#4A463D', background: on ? MC.primary : past ? 'transparent' : '#F6F8FA', border: k === today && !on ? `1.5px solid ${MC.primary}` : '1.5px solid transparent' }}>
                    {day}
                  </div>
                )
              })}
            </div>
          </div>
        </Field>

        <Field label="슬롯 단위">
          <div style={{ display: 'flex', gap: 8 }}>
            {[30, 60].map((u) => (<div key={u} onClick={() => setUnit(u as 30 | 60)} style={chip(unit === u)}>{u}분</div>))}
          </div>
        </Field>

        <Field label="시간대">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={start} onChange={(e) => setStart(e.target.value)} style={selectStyle}>{times.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <span style={{ color: MC.muted, fontWeight: 800 }}>~</span>
            <select value={end} onChange={(e) => setEnd(e.target.value)} style={selectStyle}>{times.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          {start >= end && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#E5484D', marginTop: 6 }}>종료가 시작보다 늦어야 해요</div>}
        </Field>

        <div onClick={submit} className={valid && !busy ? 'lift' : ''} style={{ marginTop: 8, textAlign: 'center', background: valid && !busy ? MC.ink : '#D6D9DF', color: '#fff', fontSize: 16, fontWeight: 800, borderRadius: 15, padding: 15, cursor: valid && !busy ? 'pointer' : 'default' }}>
          {busy ? '만드는 중…' : '만들고 링크 받기'}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#8B8579', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #E7EAEF', borderRadius: 12, outline: 'none', background: '#F9FAFB', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, padding: '13px 14px' }
const selectStyle: React.CSSProperties = { flex: 1, border: '1.5px solid #E7EAEF', borderRadius: 12, background: '#F9FAFB', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, padding: '12px 12px', cursor: 'pointer' }
