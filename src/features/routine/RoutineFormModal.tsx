// 루틴 생성·수정 모달 — 이름·시간·카테고리·반복 요일 지정. (RoutineDrawer의 + 새 루틴 / 카드 편집)
import { useState } from 'react'
import { CloseIcon } from '@/lib/icons'
import { normalizeTime } from '@/lib/dates'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAppStore } from '@/store/useAppStore'
import { DayPicker } from './DayPicker'
import { LabelPicker } from '@/features/todo/LabelPicker'
import type { Routine } from '@/types'

const label = { fontSize: 12.5, fontWeight: 800, color: '#8B8579', marginBottom: 9 } as const
const input = { width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 13, padding: '14px 16px', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 600, color: '#17150F' } as const

export function RoutineFormModal({ routine, onClose }: { routine: Routine | null; onClose: () => void }) {
  const { createRoutine, updateRoutine } = useRoutineStore()
  const toast = useAppStore((s) => s.toast)
  const editing = !!routine
  const [title, setTitle] = useState(routine?.title ?? '')
  const [time, setTime] = useState(routine?.time ?? '오전 09:00')
  const [timeErr, setTimeErr] = useState(false)
  const [labelId, setLabelId] = useState<string | null>(routine?.labelId ?? null)
  const [days, setDays] = useState<boolean[]>(routine?.days ?? [true, true, true, true, true, false, false])

  const normTime = () => {
    const n = normalizeTime(time)
    if (n === null) { setTimeErr(true); return null }
    setTimeErr(false)
    if (n && n !== time) setTime(n)
    return n
  }
  const save = () => {
    if (!title.trim()) { toast('루틴 이름을 입력해주세요'); return }
    const n = normTime()
    if (n === null) return
    if (editing && routine) {
      updateRoutine(routine.id, { title: title.trim(), time: n || '', labelId, days })
      toast('루틴을 수정했어요')
    } else {
      createRoutine({ title, time: n || '', labelId, days })
      toast('루틴을 추가했어요')
    }
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(500px, 94vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '26px 30px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>{editing ? '루틴 수정' : '새 루틴'}</div>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 11, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CloseIcon w={14} /></div>
        </div>

        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) save() }} placeholder="루틴 이름 (예: 아침 스트레칭)" style={{ ...input, fontSize: 18, fontWeight: 700 }} />

        <div style={{ marginTop: 18 }}>
          <div style={label}>시간</div>
          <input value={time} onChange={(e) => { setTime(e.target.value); if (timeErr) setTimeErr(false) }} onBlur={normTime} placeholder="예: 오전 09:00 · 7시" style={{ ...input, border: `1px solid ${timeErr ? '#D9614F' : '#E1E5EC'}` }} />
          {timeErr && <div style={{ fontSize: 12, fontWeight: 700, color: '#D9614F', marginTop: 7 }}>시간 형식을 알아볼 수 없어요. 예: 오전 9시, 09:00</div>}
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={label}>분류 (선택)</div>
          <LabelPicker value={labelId} onChange={setLabelId} />
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 8 }}>이 루틴으로 생성되는 할 일에 라벨이 자동 적용돼요</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={label}>반복 요일</div>
          <DayPicker days={days} onChange={setDays} />
        </div>

        <div onClick={save} className="lift" style={{ marginTop: 26, textAlign: 'center', fontSize: 16.5, fontWeight: 800, color: '#fff', background: '#17150F', borderRadius: 15, padding: 16, cursor: 'pointer' }}>
          {editing ? '수정하기' : '루틴 추가'}
        </div>
      </div>
    </div>
  )
}
