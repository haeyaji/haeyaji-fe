import { useEffect, useState } from 'react'
import { CloseIcon } from '@/lib/icons'
import { normalizeTime } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { LabelPicker } from './LabelPicker'
import { DayPicker } from '@/features/routine/DayPicker'
import type { TaskGroup } from '@/types'

const fieldLabel = { fontSize: 13.5, fontWeight: 800, color: '#8B8579', marginBottom: 9 } as const
const inputStyle = { width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 13, padding: '15px 17px', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, color: '#17150F' } as const

export function AddTaskModal() {
  const { addOpen, closeAdd, selId } = useAppStore()
  const toast = useAppStore((s) => s.toast)
  const submitTask = useTodoStore((s) => s.submitTask)
  const { createRoutine, applyRoutine } = useRoutineStore()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selId)
  const [time, setTime] = useState('')
  const [timeErr, setTimeErr] = useState(false)
  const [group, setGroup] = useState<TaskGroup>('personal')
  const [labelId, setLabelId] = useState<string | null>(null)
  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, false, false])

  // 열릴 때 선택 날짜로 동기화
  useEffect(() => {
    if (addOpen) setDate(selId)
  }, [addOpen, selId])

  if (!addOpen) return null

  const reset = () => {
    setTitle('')
    setTime('')
    setTimeErr(false)
    setGroup('personal')
    setLabelId(null)
    setDays([true, true, true, true, true, false, false])
  }
  // 자유 입력을 "오전/오후 HH:MM"으로 정규화. 형식 못 알아보면 힌트 후 저장 차단.
  const normTime = () => {
    const n = normalizeTime(time)
    if (n === null) { setTimeErr(true); return null }
    setTimeErr(false)
    if (n && n !== time) setTime(n)
    return n
  }
  const submit = () => {
    const n = normTime()
    if (n === null) return
    if (group === 'routine') {
      // 루틴 생성 + 이번 달 잔여일에 할 일로 적용 (루틴 ↔ 투두 상호)
      if (!title.trim()) { toast('루틴 이름을 입력해주세요'); return }
      if (!days.some(Boolean)) { toast('반복 요일을 하나 이상 선택해주세요'); return }
      const r = createRoutine({ title, time: n || '', days })
      const cnt = applyRoutine(r)
      toast(cnt > 0 ? `루틴 등록 · 이번 달 ${cnt}개 적용됨` : '루틴을 등록했어요')
      reset()
      closeAdd()
      return
    }
    if (submitTask({ dateKey: date, title, time: n, group, labelId })) {
      reset()
      closeAdd()
    }
  }
  const close = () => { reset(); closeAdd() }

  const groupBtn = (active: boolean) =>
    ({ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', background: active ? '#17150F' : '#F0F2F6', color: active ? '#fff' : '#8B8579' }) as const

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(580px, 94vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 34px 0' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.4px' }}>할 일 추가</div>
          <div onClick={close} style={{ width: 36, height: 36, borderRadius: 11, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={15} />
          </div>
        </div>

        <div style={{ padding: '22px 34px 32px' }}>
          {/* 제목 (우선) */}
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
            placeholder="무엇을 해야 하나요?"
            style={{ ...inputStyle, fontSize: 19, fontWeight: 700, padding: '17px 18px' }}
          />

          {/* 유형 (먼저 선택) */}
          <div style={{ marginTop: 20 }}>
            <div style={fieldLabel}>유형</div>
            <div style={{ display: 'flex', gap: 9 }}>
              <div onClick={() => setGroup('personal')} className="hbtn" style={groupBtn(group === 'personal')}>개별 일정</div>
              <div onClick={() => setGroup('routine')} className="hbtn" style={groupBtn(group === 'routine')}>루틴</div>
            </div>
          </div>

          {/* 날짜(개별만) + 시간 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {group !== 'routine' && (
              <div style={{ flex: 1 }}>
                <div style={fieldLabel}>날짜</div>
                <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={fieldLabel}>시간 (선택)</div>
              <input
                value={time}
                onChange={(e) => { setTime(e.target.value); if (timeErr) setTimeErr(false) }}
                onBlur={normTime}
                placeholder="예: 오후 2시 · 14:00"
                style={{ ...inputStyle, border: `1px solid ${timeErr ? '#D9614F' : '#E1E5EC'}` }}
              />
            </div>
          </div>
          {timeErr && <div style={{ fontSize: 12, fontWeight: 700, color: '#D9614F', marginTop: 7 }}>시간 형식을 알아볼 수 없어요. 예: 오후 2시, 14:00, 2:30</div>}

          {/* 루틴: 반복 요일 아코디언 / 개별: 분류(라벨) */}
          {group === 'routine' ? (
            <div style={{ marginTop: 20, background: '#F9FAFB', border: '1px solid #EEF0F4', borderRadius: 14, padding: 15, animation: 'rb-fade .16s ease' }}>
              <div style={fieldLabel}>반복 요일</div>
              <DayPicker days={days} onChange={setDays} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#A39C8E', marginTop: 11 }}>선택한 요일에 맞춰 이번 달 할 일이 자동 생성돼요</div>
            </div>
          ) : (
            <div style={{ marginTop: 22 }}>
              <div style={fieldLabel}>분류 (선택)</div>
              <LabelPicker value={labelId} onChange={setLabelId} />
            </div>
          )}

          <div onClick={submit} className="lift" style={{ marginTop: 28, textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#fff', background: '#17150F', borderRadius: 15, padding: 17, cursor: 'pointer' }}>
            {group === 'routine' ? '루틴 추가' : '추가하기'}
          </div>
        </div>
      </div>
    </div>
  )
}
