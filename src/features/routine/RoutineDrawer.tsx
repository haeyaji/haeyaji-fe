import { CloseIcon, RoutineIcon, TrashIcon } from '@/lib/icons'
import { DOW } from '@/lib/mockData'
import { useAppStore } from '@/store/useAppStore'
import { useRoutineStore } from '@/store/useRoutineStore'
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
  const { routines, toggleActive, toggleDay, setPreset, deleteRoutine, addRoutine, batchApply } = useRoutineStore()
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', background: '#fff', borderBottom: '1px solid #EDEAE2' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.4px' }}>루틴 관리</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 2 }}>반복 일정을 등록하고 한 번에 적용하세요</div>
          </div>
          <div onClick={closeRoutine} style={{ width: 30, height: 30, borderRadius: 10, background: '#F1EEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {routines.map((r) => (
            <RoutineCard key={r.id} r={r} onToggleActive={toggleActive} onToggleDay={toggleDay} onSetPreset={setPreset} onDelete={deleteRoutine} />
          ))}
          <div onClick={addRoutine} className="hbtn" style={{ border: '1.5px dashed #D8D3C8', borderRadius: 18, padding: 14, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#A39C8E', cursor: 'pointer' }}>
            + 새 루틴 추가
          </div>
        </div>

        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #EDEAE2' }}>
          <div onClick={batchApply} className="lift" style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff', background: '#15795A', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
            이번 달에 일괄 적용
          </div>
        </div>
      </div>
    </>
  )
}

function RoutineCard({
  r,
  onToggleActive,
  onToggleDay,
  onSetPreset,
  onDelete,
}: {
  r: Routine
  onToggleActive: (id: string) => void
  onToggleDay: (id: string, i: number) => void
  onSetPreset: (id: string, kind: 'every' | 'week' | 'weekend') => void
  onDelete: (id: string) => void
}) {
  const isEvery = r.days.filter(Boolean).length === 7
  const isWeek = r.days.slice(0, 5).every(Boolean) && !r.days[5] && !r.days[6]
  const isWeekend = !r.days.slice(0, 5).some(Boolean) && r.days[5] && r.days[6]
  const presets = [
    { kind: 'every' as const, label: '매일', on: isEvery },
    { kind: 'week' as const, label: '평일', on: isWeek },
    { kind: 'weekend' as const, label: '주말', on: isWeekend },
  ]

  return (
    <div style={{ background: '#fff', border: '1px solid #EAE6DD', borderRadius: 20, padding: 18, opacity: r.active ? 1 : 0.5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 22, height: 22, display: 'inline-flex' }}><RoutineIcon cat={r.cat} c="#15795A" /></span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px' }}>{r.title}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{r.time} · {daysLabel(r.days)}</div>
        </div>
        <div onClick={() => onToggleActive(r.id)} style={{ width: 46, height: 27, borderRadius: 20, cursor: 'pointer', position: 'relative', background: r.active ? '#15795A' : '#D8D3C8', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 2.5, left: r.active ? 22 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
        {DOW.map((d, i) => (
          <div
            key={i}
            onClick={() => onToggleDay(r.id, i)}
            className="hbtn"
            style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', background: r.days[i] ? '#15795A' : '#F1EEE7', color: r.days[i] ? '#fff' : '#A39C8E' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11 }}>
        {presets.map((p) => (
          <div
            key={p.kind}
            onClick={() => onSetPreset(r.id, p.kind)}
            className="hbtn"
            style={{ padding: '6px 12px', borderRadius: 18, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', background: p.on ? '#E4F2EC' : '#F1EEE7', color: p.on ? '#15795A' : '#A39C8E' }}
          >
            {p.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div onClick={() => onDelete(r.id)} style={{ display: 'flex', cursor: 'pointer', color: '#CFC9BC' }}>
          <TrashIcon c="currentColor" w={16} />
        </div>
      </div>
    </div>
  )
}
