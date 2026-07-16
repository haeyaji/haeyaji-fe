// 칸반보드 (지라식) — 이슈 키(HAE-N)·우선순위·라벨·설명·검색/필터.
// 드래그로 컬럼 이동 = 상태 변경(완료↔체크 동기화), 카드 클릭 = 상세.
import { useMemo, useRef, useState } from 'react'
import { CloseIcon, PlusIcon } from '@/lib/icons'
import { todayKey } from '@/lib/dates'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { COLUMNS, PRIORITIES, PrioIcon, prioOf, PRIO_RANK, labelStyle, dateBadge } from '@/features/todo/taskMeta'
import { TaskDetailModal } from '@/features/todo/TaskDetailModal'
import type { Task, TaskPriority, TaskStatus } from '@/types'

interface Card {
  dateKey: string
  task: Task
}

export function KanbanPage() {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { setStatus, addTaskAt } = useTodoStore()
  const [detail, setDetail] = useState<Card | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [addingCol, setAddingCol] = useState<TaskStatus | null>(null)
  const [addText, setAddText] = useState('')
  const [query, setQuery] = useState('')
  const [prioFilter, setPrioFilter] = useState<TaskPriority | null>(null)

  // 전체 날짜의 카드 수집 → 검색/필터 → 우선순위·날짜 정렬
  // 루틴(매일 반복 잡일)은 제외 — 보드엔 굵직한 task만
  const cards: Card[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.keys(tasksByDate)
      .sort()
      .flatMap((dateKey) => tasksByDate[dateKey].map((task) => ({ dateKey, task })))
      .filter(({ task }) => {
        if (task.group === 'routine') return false
        if (prioFilter && prioOf(task) !== prioFilter) return false
        if (!q) return true
        return (
          task.title.toLowerCase().includes(q) ||
          (task.key ?? '').toLowerCase().includes(q) ||
          (task.labels ?? []).some((l) => l.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => PRIO_RANK[prioOf(a.task)] - PRIO_RANK[prioOf(b.task)] || a.dateKey.localeCompare(b.dateKey))
  }, [tasksByDate, query, prioFilter])
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

  // ESC 취소 시 입력창 언마운트로 onBlur가 뒤늦게 submit하는 걸 차단하는 가드
  const escRef = useRef(false)
  const submitAdd = (col: TaskStatus) => {
    if (escRef.current) {
      escRef.current = false
      setAddText('')
      setAddingCol(null)
      return
    }
    if (addText.trim()) addTaskAt(todayKey(), addText, col)
    setAddText('')
    setAddingCol(null)
  }

  return (
    <div className="page-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div className="home-wrap">
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.7px' }}>칸반보드</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#8B8579', marginTop: 2 }}>
              드래그로 상태를 옮기고, 카드를 눌러 세부 할 일을 관리하세요
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {/* 검색 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #E1E5EC', borderRadius: 12, padding: '9px 13px', width: 250 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A39C8E" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목·키·라벨 검색"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, minWidth: 0 }}
            />
            {query && <div onClick={() => setQuery('')} style={{ cursor: 'pointer', display: 'flex', color: '#A39C8E' }}><CloseIcon w={12} /></div>}
          </div>
          {/* 우선순위 필터 */}
          <div style={{ display: 'flex', gap: 6 }}>
            {PRIORITIES.map((p) => {
              const on = prioFilter === p.key
              return (
                <div
                  key={p.key}
                  onClick={() => setPrioFilter(on ? null : p.key)}
                  className="hbtn"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: on ? '#17150F' : '#fff', color: on ? '#fff' : '#5A554B', border: on ? '1.5px solid #17150F' : '1.5px solid #E1E5EC' }}
                >
                  <PrioIcon p={p.key} w={13} />
                  {p.label}
                </div>
              )
            })}
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
                  const done = statusOf(c.task) === 'done'
                  return (
                    <div
                      key={`${c.dateKey}-${c.task.id}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ dateKey: c.dateKey, id: c.task.id }))}
                      onClick={() => setDetail(c)}
                      className="tile lift"
                      style={{ padding: '13px 15px 12px', cursor: 'grab', borderRadius: 14 }}
                    >
                      {/* labels */}
                      {(c.task.labels ?? []).length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
                          {c.task.labels!.map((l) => (
                            <span key={l} style={{ fontSize: 11, fontWeight: 800, padding: '2.5px 8px', borderRadius: 20, ...labelStyle(l) }}>{l}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45, textDecoration: done ? 'line-through' : 'none', color: done ? '#AEA89B' : '#17150F' }}>
                        {c.task.title}
                      </div>
                      {/* 세부 할일 진행률 바 */}
                      {subs.length > 0 && (
                        <div style={{ height: 4, borderRadius: 3, background: '#EEF0F4', marginTop: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((subDone / subs.length) * 100)}%`, height: '100%', borderRadius: 3, background: subDone === subs.length ? '#15795A' : '#57B48C', transition: 'width .25s ease' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: subs.length > 0 ? 8 : 10, flexWrap: 'wrap' }}>
                        <PrioIcon p={prioOf(c.task)} w={14} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#8B8579', letterSpacing: '.2px' }}>{c.task.key ?? ''}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: badge.color, background: badge.bg, padding: '3px 9px', borderRadius: 20 }}>{badge.label}</span>
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
                        escRef.current = true
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
                      escRef.current = false
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

      {detail && <TaskDetailModal dateKey={detail.dateKey} taskId={detail.task.id} onClose={() => setDetail(null)} />}
    </div>
  )
}
