// 약속 생성 — 제목·타입·후보날짜·시간창·슬롯단위 → be POST /meetings → shareToken.
import { useMemo, useState } from 'react'
import { CloseIcon } from '@/lib/icons'
import { useOverlay } from '@/lib/useOverlay'
import { todayKey, addDays } from '@/lib/dates'
import { useMeetupStore } from '@/store/useMeetupStore'
import type { MeetingType } from '@/api/meetingApi'
import { MEET_TYPES, dateLabel } from './meetupShared'
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

  const dayOpts = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(todayKey(), i)), [])
  const times = useMemo(() => timeOptions(unit), [unit])
  const toggleDate = (d: string) => setDates((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()))
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

        <Field label={`후보 날짜 · ${dates.length}개`}>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }}>
            {dayOpts.map((d) => (<div key={d} onClick={() => toggleDate(d)} style={{ ...chip(dates.includes(d)), whiteSpace: 'nowrap', flexShrink: 0, padding: '9px 12px', fontSize: 13 }}>{dateLabel(d)}</div>))}
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
