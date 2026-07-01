import { useState } from 'react'
import { CloseIcon } from '@/lib/icons'
import { dayMeta } from '@/lib/weather'
import { useAppStore } from '@/store/useAppStore'
import { useTodoStore } from '@/store/useTodoStore'
import type { TaskGroup } from '@/types'

export function AddTaskModal() {
  const { addOpen, closeAdd, selId } = useAppStore()
  const submitTask = useTodoStore((s) => s.submitTask)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [group, setGroup] = useState<TaskGroup>('personal')

  if (!addOpen) return null
  const meta = dayMeta(selId)
  const dateShort = `5월 ${meta.date}일 (${meta.dow})`

  const reset = () => {
    setTitle('')
    setTime('')
    setGroup('personal')
  }
  const submit = () => {
    if (submitTask(title, time, group)) {
      reset()
      closeAdd()
    }
  }
  const close = () => {
    reset()
    closeAdd()
  }

  const groupBtn = (active: boolean) =>
    ({ flex: 1, textAlign: 'center', padding: 11, borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: active ? '#17150F' : '#E9EDF3', color: active ? '#fff' : '#5A554B' }) as const
  const inputStyle = { width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F0F2F6', borderRadius: 13, padding: '13px 16px', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, color: '#17150F' } as const

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 0' }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px' }}>할 일 추가</div>
          <div onClick={close} style={{ width: 30, height: 30, borderRadius: 10, background: '#E9EDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon />
          </div>
        </div>
        <div style={{ padding: '18px 24px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#A39C8E', marginBottom: 12 }}>{dateShort}에 추가</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E', marginBottom: 8 }}>분류</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div onClick={() => setGroup('routine')} className="hbtn" style={groupBtn(group === 'routine')}>루틴</div>
            <div onClick={() => setGroup('personal')} className="hbtn" style={groupBtn(group === 'personal')}>개별 일정</div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E', marginBottom: 8 }}>할 일 *</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter는 무시 (끝 글자 중복 방지)
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="무엇을 해야 하나요?"
            style={inputStyle}
          />
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E', margin: '16px 0 8px' }}>시간 (선택)</div>
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="예: 오후 02:00" style={inputStyle} />
          <div onClick={submit} className="lift" style={{ marginTop: 22, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
            추가하기
          </div>
        </div>
      </div>
    </div>
  )
}
