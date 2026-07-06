// 칸반보드 (지라식) — 전체 날짜의 할 일을 상태(할 일/진행 중/완료) 컬럼으로.
// 드래그로 컬럼 이동 = 상태 변경(완료↔체크 동기화), 카드 클릭 = 상세(세부 할일).
import { useMemo, useState } from 'react'
import { CloseIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import { addDays, dateShortLabel, todayKey } from '@/lib/dates'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import type { Task, TaskStatus } from '@/types'

interface Card {
  dateKey: string
  task: Task
}

const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'todo', label: '할 일', dot: '#8B8579' },
  { key: 'doing', label: '진행 중', dot: '#E0883A' },
  { key: 'done', label: '완료', dot: '#15795A' },
]

function dateBadge(dateKey: string): { label: string; color: string; bg: string } {
  const T = todayKey()
  if (dateKey === T) return { label: '오늘', color: '#15795A', bg: '#E4F2EC' }
  if (dateKey === addDays(T, 1)) return { label: '내일', color: '#3F82C2', bg: '#E7F0F8' }
  const label = dateShortLabel(dateKey).replace(/ \(.\)$/, '')
  if (dateKey < T) return { label, color: '#A39C8E', bg: '#F0F2F6' }
  return { label, color: '#5A554B', bg: '#F0F2F6' }
}

export function KanbanPage() {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { setStatus, addTaskAt } = useTodoStore()
  const [detail, setDetail] = useState<Card | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [addingCol, setAddingCol] = useState<TaskStatus | null>(null)
  const [addText, setAddText] = useState('')

  // 전체 날짜의 카드 수집 (날짜순)
  const cards: Card[] = useMemo(
    () =>
      Object.keys(tasksByDate)
        .sort()
        .flatMap((dateKey) => tasksByDate[dateKey].map((task) => ({ dateKey, task }))),
    [tasksByDate],
  )
  const byCol = (col: TaskStatus) => cards.filter((c) => statusOf(c.task) === col)

  const onDrop = (col: TaskStatus, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverCol(null)
    try {
      const { dateKey, id } = JSON.parse(e.dataTransfer.getData('text/plain'))
      setStatus(dateKey, id, col)
    } catch {
      /* ignore */
    }
  }

  const submitAdd = (col: TaskStatus) => {
    if (addText.trim()) addTaskAt(todayKey(), addText, col)
    setAddText('')
    setAddingCol(null)
  }

  return (
    <div className="page-pad" style={{ minHeight: '100vh', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div className="home-wrap">
        {/* header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.7px' }}>칸반보드</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#8B8579', marginTop: 2 }}>
            드래그로 상태를 옮기고, 카드를 눌러 세부 할 일을 관리하세요
          </div>
        </div>

        {/* columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
          {COLUMNS.map((col) => {
            const list = byCol(col.key)
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverCol(col.key)
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => onDrop(col.key, e)}
                style={{
                  background: dragOverCol === col.key ? 'rgba(21,121,90,.06)' : 'rgba(24,21,15,.03)',
                  border: dragOverCol === col.key ? '1.5px dashed #15795A' : '1.5px dashed transparent',
                  borderRadius: 18,
                  padding: 12,
                  minHeight: 420,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'background .15s ease',
                }}
              >
                {/* column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.dot }} />
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{col.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#A39C8E' }}>{list.length}</span>
                </div>

                {/* cards */}
                {list.map((c) => {
                  const subs = c.task.subtasks ?? []
                  const subDone = subs.filter((x) => x.done).length
                  const badge = dateBadge(c.dateKey)
                  return (
                    <div
                      key={`${c.dateKey}-${c.task.id}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ dateKey: c.dateKey, id: c.task.id }))}
                      onClick={() => setDetail(c)}
                      className="tile lift"
                      style={{ padding: '14px 15px', cursor: 'grab', borderRadius: 14 }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45, textDecoration: statusOf(c.task) === 'done' ? 'line-through' : 'none', color: statusOf(c.task) === 'done' ? '#AEA89B' : '#17150F' }}>
                        {c.task.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: badge.color, background: badge.bg, padding: '3px 9px', borderRadius: 20 }}>{badge.label}</span>
                        {c.task.time && <span style={{ fontSize: 12.5, fontWeight: 600, color: '#A39C8E' }}>{c.task.time}</span>}
                        {c.task.ai && <span style={{ fontSize: 11.5, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '3px 8px', borderRadius: 20 }}>AI</span>}
                        {subs.length > 0 && (
                          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: subDone === subs.length ? '#15795A' : '#8B8579' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 11l3 3 5-6" /></svg>
                            {subDone}/{subs.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* inline add */}
                {addingCol === col.key ? (
                  <input
                    autoFocus
                    value={addText}
                    onChange={(e) => setAddText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitAdd(col.key)
                      if (e.key === 'Escape') {
                        setAddText('')
                        setAddingCol(null)
                      }
                    }}
                    onBlur={() => submitAdd(col.key)}
                    placeholder="무엇을 해야 하나요?"
                    style={{ border: '1.5px solid #15795A', outline: 'none', background: '#fff', borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600 }}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setAddingCol(col.key)
                      setAddText('')
                    }}
                    className="hbtn"
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 10px', borderRadius: 12, fontSize: 14.5, fontWeight: 700, color: '#A39C8E', cursor: 'pointer' }}
                  >
                    <PlusIcon c="currentColor" w={15} />할 일 추가
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {detail && <CardDetail card={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

/* ── 카드 상세: 제목 수정 · 상태 · 세부 할일 ───────────────────────── */
function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { updateTitle, setStatus, removeTask, addSubtask, toggleSubtask, deleteSubtask } = useTodoStore()
  const [subText, setSubText] = useState('')

  // 스토어 최신 상태 반영 (수정 즉시 리렌더)
  const task = (tasksByDate[card.dateKey] ?? []).find((t) => t.id === card.task.id)
  if (!task) return null
  const subs = task.subtasks ?? []
  const badge = dateBadge(card.dateKey)

  const submitSub = () => {
    if (subText.trim()) addSubtask(card.dateKey, task.id, subText)
    setSubText('')
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '22px 24px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: badge.color, background: badge.bg, padding: '4px 11px', borderRadius: 20, flexShrink: 0 }}>{badge.label}</span>
          <div style={{ flex: 1 }} />
          <div onClick={() => { removeTask(card.dateKey, task.id); onClose() }} className="hbtn" title="삭제" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex' }}>
            <TrashIcon w={17} />
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>

        {/* title */}
        <input
          value={task.title}
          onChange={(e) => updateTitle(card.dateKey, task.id, e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 21, fontWeight: 800, color: '#17150F', marginTop: 14, padding: 0 }}
        />

        {/* status chips */}
        <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
          {COLUMNS.map((c) => {
            const on = statusOf(task) === c.key
            return (
              <div
                key={c.key}
                onClick={() => setStatus(card.dateKey, task.id, c.key)}
                className="hbtn"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
                {c.label}
              </div>
            )
          })}
        </div>

        {/* subtasks */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', marginBottom: 8 }}>
            세부 할 일 {subs.length > 0 && `· ${subs.filter((x) => x.done).length}/${subs.length}`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflowY: 'auto' }}>
            {subs.map((x) => (
              <div key={x.id} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', borderRadius: 10 }}>
                <div
                  onClick={() => toggleSubtask(card.dateKey, task.id, x.id)}
                  style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${x.done ? '#15795A' : '#CCD2DC'}`, background: x.done ? '#15795A' : '#fff' }}
                >
                  {x.done && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
                  )}
                </div>
                <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: x.done ? '#AEA89B' : '#17150F', textDecoration: x.done ? 'line-through' : 'none' }}>{x.title}</div>
                <div onClick={() => deleteSubtask(card.dateKey, task.id, x.id)} className="hbtn" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex' }}>
                  <TrashIcon w={14} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitSub()
              }}
              placeholder="세부 할 일 추가"
              style={{ flex: 1, border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 11, padding: '11px 13px', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600 }}
            />
            <div onClick={submitSub} style={{ width: 42, height: 42, borderRadius: 11, background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PlusIcon w={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
