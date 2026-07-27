// 반복 요일 선택기 (월~일 토글 + 매일/평일/주말 프리셋) — 루틴 모달·할일 추가 아코디언 공용.
import { DOW } from '@/lib/dates'

const PRESETS: { kind: string; label: string; days: boolean[] }[] = [
  { kind: 'every', label: '매일', days: [true, true, true, true, true, true, true] },
  { kind: 'week', label: '평일', days: [true, true, true, true, true, false, false] },
  { kind: 'weekend', label: '주말', days: [false, false, false, false, false, true, true] },
]
const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i])

export function DayPicker({ days, onChange }: { days: boolean[]; onChange: (days: boolean[]) => void }) {
  const toggle = (i: number) => { const d = days.slice(); d[i] = !d[i]; onChange(d) }
  return (
    <div>
      <div style={{ display: 'flex', gap: 5 }}>
        {DOW.map((d, i) => (
          <div key={i} onClick={() => toggle(i)} className="hbtn" style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: days[i] ? '#15795A' : '#F0F2F6', color: days[i] ? '#fff' : '#A39C8E' }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
        {PRESETS.map((p) => {
          const on = same(days, p.days)
          return (
            <div key={p.kind} onClick={() => onChange(p.days.slice())} className="hbtn" style={{ padding: '6px 13px', borderRadius: 18, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', background: on ? '#E4F2EC' : '#F0F2F6', color: on ? '#15795A' : '#A39C8E' }}>
              {p.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
