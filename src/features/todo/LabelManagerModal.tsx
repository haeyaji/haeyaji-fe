// 분류(사용자 라벨) 관리 — 생성·이름수정·색 변경·삭제. be label 테이블 대응(현재 로컬 persist).
import { useState } from 'react'
import { CloseIcon, TrashIcon } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'
import { useLabelStore, LABEL_COLORS } from '@/store/useLabelStore'

export function LabelManagerModal() {
  const open = useAppStore((s) => s.labelManagerOpen)
  const close = useAppStore((s) => s.closeLabelManager)
  const labels = useLabelStore((s) => s.labels)
  const { addLabel, renameLabel, setColor, removeLabel } = useLabelStore()
  const [name, setName] = useState('')
  const [newColor, setNewColor] = useState(LABEL_COLORS[0])
  const [colorFor, setColorFor] = useState<string | null>(null)

  if (!open) return null

  const create = () => { if (addLabel(name, newColor)) setName('') }

  const Swatches = ({ onPick }: { onPick: (c: string) => void }) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '4px 0' }}>
      {LABEL_COLORS.map((c) => (
        <div key={c} onClick={() => onPick(c)} className="hbtn" style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 0 0 1.5px #E7EAEF' }} />
      ))}
    </div>
  )

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 94vw)', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '26px 30px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>분류 관리</div>
          <div onClick={close} style={{ width: 34, height: 34, borderRadius: 11, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CloseIcon w={14} /></div>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8B8579', marginBottom: 18 }}>내 할 일을 분류할 라벨을 만들고 색을 지정하세요</div>

        {/* 새 분류 만들기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1px solid #EEF0F4', borderRadius: 14, padding: 12, marginBottom: 18 }}>
          <div onClick={() => setColorFor(colorFor === '__new__' ? null : '__new__')} title="색 선택" className="hbtn" style={{ width: 26, height: 26, borderRadius: '50%', background: newColor, cursor: 'pointer', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 0 0 1.5px #E7EAEF' }} />
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) create() }} placeholder="새 분류 이름" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, minWidth: 0 }} />
          <div onClick={create} className="lift" style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', background: '#17150F', borderRadius: 11, padding: '9px 16px', cursor: 'pointer', flexShrink: 0 }}>추가</div>
        </div>
        {colorFor === '__new__' && <div style={{ marginTop: -8, marginBottom: 16 }}><Swatches onPick={(c) => { setNewColor(c); setColorFor(null) }} /></div>}

        {/* 라벨 목록 */}
        {labels.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#B6BCC7', fontSize: 14, fontWeight: 600, padding: '30px 0' }}>아직 분류가 없어요 · 위에서 만들어보세요</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {labels.map((l) => (
              <div key={l.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 4px' }}>
                  <div onClick={() => setColorFor(colorFor === l.id ? null : l.id)} title="색 변경" className="hbtn" style={{ width: 24, height: 24, borderRadius: '50%', background: l.color, cursor: 'pointer', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 0 0 1.5px #E7EAEF' }} />
                  <input defaultValue={l.name} onBlur={(e) => renameLabel(l.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} style={{ flex: 1, border: '1px solid transparent', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, borderRadius: 8, padding: '5px 8px', minWidth: 0 }} onFocus={(e) => (e.target.style.border = '1px solid #E1E5EC')} />
                  <div onClick={() => removeLabel(l.id)} className="hbtn" title="삭제" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}><TrashIcon w={16} /></div>
                </div>
                {colorFor === l.id && <div style={{ paddingLeft: 35 }}><Swatches onPick={(c) => { setColor(l.id, c); setColorFor(null) }} /></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
