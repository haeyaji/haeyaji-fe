import { useState } from 'react'
import { useOverlay } from '@/lib/useOverlay'
import { CloseIcon, TrashIcon } from '@/lib/icons'
import { DOW } from '@/lib/mockData'
import { useAppStore } from '@/store/useAppStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useLabelStore } from '@/store/useLabelStore'
import { RoutineFormModal } from './RoutineFormModal'
import type { Routine } from '@/types'

function daysLabel(days: boolean[]): string {
  const sel = days.filter(Boolean).length
  if (sel === 7) return '매일'
  const isWeek = days.slice(0, 5).every(Boolean) && !days[5] && !days[6]
  if (isWeek) return '평일'
  const isWeekend = !days.slice(0, 5).some(Boolean) && days[5] && days[6]
  if (isWeekend) return '주말'
  return DOW.filter((_, i) => days[i]).join(', ') || '없음'
}

export function RoutineDrawer() {
  const { routineOpen, closeRoutine } = useAppStore()
  const { routines, toggleActive, deleteRoutine } = useRoutineStore()
  const [form, setForm] = useState<Routine | 'new' | null>(null)
  useOverlay(routineOpen, closeRoutine)
  if (!routineOpen) return null

  return (
    <>
      <div onClick={closeRoutine} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(24,21,15,.3)', animation: 'rb-fade .18s ease' }} />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 41,
          width: 448,
          maxWidth: '100%',
          background: 'var(--canvas)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-26px 0 56px rgba(24,21,15,.2)',
          animation: 'rb-drawer .3s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', background: '#fff', borderBottom: '1px solid #E4E7EE' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.4px' }}>루틴 관리</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 2 }}>반복할 일정을 알람처럼 등록해두세요</div>
          </div>
          <div onClick={closeRoutine} style={{ width: 30, height: 30, borderRadius: 10, background: '#E9EDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {routines.map((r) => (
            <RoutineCard key={r.id} r={r} onToggleActive={toggleActive} onDelete={deleteRoutine} onEdit={() => setForm(r)} />
          ))}
          <div onClick={() => setForm('new')} className="hbtn" style={{ border: '1.5px dashed #CCD2DC', borderRadius: 18, padding: 14, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#A39C8E', cursor: 'pointer' }}>
            + 새 루틴 추가
          </div>
        </div>

        <div style={{ padding: '14px 24px', background: '#fff', borderTop: '1px solid #E4E7EE', display: 'flex', alignItems: 'center', gap: 8, color: '#A39C8E' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>활성 루틴은 매일 자정에 오늘 할 일로 자동 등록돼요</div>
        </div>
      </div>

      {form && <RoutineFormModal routine={form === 'new' ? null : form} onClose={() => setForm(null)} />}
    </>
  )
}

function RoutineCard({ r, onToggleActive, onDelete, onEdit }: { r: Routine; onToggleActive: (id: string) => void; onDelete: (id: string) => void; onEdit: () => void }) {
  const lab = useLabelStore((s) => (r.labelId ? s.labels.find((l) => l.id === r.labelId) : undefined))
  const accent = lab?.color ?? '#15795A'

  // 목록: 루틴이름(+라벨) / 시간 · 반복요일 — 한 줄 리스트. 수정(요일 등)은 이름 클릭 → 모달
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid #E1E5EC', borderRadius: 16, padding: '14px 16px', opacity: r.active ? 1 : 0.55 }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: accent + '1F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
      </div>
      <div onClick={onEdit} className="hbtn" title="루틴 수정" style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
          {lab && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: lab.color, background: lab.color + '1F', padding: '2.5px 8px', borderRadius: 20, flexShrink: 0 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: lab.color }} />{lab.name}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#A39C8E', marginTop: 3 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {r.time || '시간 미정'}
          <span style={{ color: '#D5D0C4' }}>·</span>
          {daysLabel(r.days)}
        </div>
      </div>
      <div onClick={() => onToggleActive(r.id)} title={r.active ? '켜짐' : '꺼짐'} style={{ width: 46, height: 27, borderRadius: 20, cursor: 'pointer', position: 'relative', background: r.active ? '#15795A' : '#CCD2DC', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2.5, left: r.active ? 22 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
      </div>
      <div onClick={() => onDelete(r.id)} className="hbtn" title="삭제" style={{ display: 'flex', cursor: 'pointer', color: '#CFC9BC', flexShrink: 0 }}>
        <TrashIcon c="currentColor" w={16} />
      </div>
    </div>
  )
}
