// 할 일 분류(사용자 라벨) 선택기 — add·상세 모달 공용. 라벨 칩 선택/해제 + 인라인 새 분류 + 관리 진입.
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useLabelStore } from '@/store/useLabelStore'

// 색을 옅은 배경으로 (hex + 알파)
const tint = (hex: string) => hex + '1F'

export function LabelPicker({ value, onChange }: { value: string | null; onChange: (labelId: string | null) => void }) {
  const labels = useLabelStore((s) => s.labels)
  const addLabel = useLabelStore((s) => s.addLabel)
  const openManager = useAppStore((s) => s.openLabelManager)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    const l = addLabel(name)
    if (l) onChange(l.id)
    setName('')
    setCreating(false)
  }

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
      {labels.map((l) => {
        const on = value === l.id
        return (
          <div
            key={l.id}
            onClick={() => onChange(on ? null : l.id)}
            className="hbtn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, padding: '7px 13px', borderRadius: 20, cursor: 'pointer', background: on ? l.color : tint(l.color), color: on ? '#fff' : l.color, border: `1.5px solid ${on ? l.color : 'transparent'}` }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#fff' : l.color }} />
            {l.name}
          </div>
        )
      })}

      {creating ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          onBlur={() => (name.trim() ? submit() : setCreating(false))}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit(); if (e.key === 'Escape') { setName(''); setCreating(false) } }}
          placeholder="새 분류 이름"
          style={{ border: '1.5px solid #D8DCE3', outline: 'none', background: '#fff', borderRadius: 20, padding: '6px 13px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, width: 120 }}
        />
      ) : (
        <div onClick={() => setCreating(true)} className="hbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, padding: '7px 12px', borderRadius: 20, cursor: 'pointer', background: '#F0F2F6', color: '#8B8579', border: '1.5px dashed #D8DCE3' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          새 분류
        </div>
      )}

      <div onClick={openManager} className="hbtn" title="분류 관리" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, padding: '7px 10px', borderRadius: 20, cursor: 'pointer', color: '#A39C8E' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        관리
      </div>
    </div>
  )
}
