import { CheckMark, TrashIcon } from '@/lib/icons'
import { useTodoStore } from '@/store/useTodoStore'
import type { Task } from '@/types'

const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const

/** variant 'home' = 우측 meta / 'aside' = 제목 아래 meta. onOpen 지정 시 행 클릭으로 상세 열림 */
export function TaskRow({ task, variant, onOpen }: { task: Task; variant: 'home' | 'aside'; onOpen?: (task: Task) => void }) {
  const toggleTask = useTodoStore((s) => s.toggleTask)
  const deleteTask = useTodoStore((s) => s.deleteTask)
  const meta = task.meta || task.time || ''
  const titleColor = task.done ? '#AEA89B' : '#17150F'
  const metaColor = task.ai ? '#15795A' : '#A39C8E'
  const home = variant === 'home'

  return (
    <div onClick={() => onOpen?.(task)} className={onOpen ? 'hbtn' : undefined} style={{ display: 'flex', alignItems: 'center', gap: home ? 13 : 12, padding: '12px 0', cursor: onOpen ? 'pointer' : 'default' }}>
      <div
        onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          flexShrink: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${task.done ? '#15795A' : '#CCD2DC'}`,
          background: task.done ? '#15795A' : '#fff',
        }}
      >
        {task.done && (
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>
            <CheckMark />
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ fontSize: home ? 19 : 17, fontWeight: 700, color: titleColor, textDecoration: task.done ? 'line-through' : 'none', ...ellipsis }}>
            {task.title}
          </div>
          {task.ai && (
            <div style={{ flexShrink: 0, fontSize: home ? 12 : 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: home ? '3px 8px' : '3px 7px', borderRadius: 20 }}>
              {home ? 'AI 추천' : 'AI'}
            </div>
          )}
        </div>
        {!home && <div style={{ fontSize: 16, fontWeight: 600, color: metaColor, marginTop: 1 }}>{meta}</div>}
      </div>

      {home && <div style={{ fontSize: 18, fontWeight: 600, color: metaColor, flexShrink: 0 }}>{meta}</div>}

      <div onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }} className="hbtn" style={{ display: 'flex', cursor: 'pointer', color: '#CAD0DA', flexShrink: 0 }}>
        <TrashIcon />
      </div>
    </div>
  )
}

export function EmptyTasks() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#B6BCC7', gap: 8, padding: 20 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CAD0DA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="16" rx="3" />
        <path d="M8 11h8M8 15h5" />
      </svg>
      <div style={{ fontSize: 17, fontWeight: 600 }}>이 날 할 일이 없어요</div>
    </div>
  )
}
