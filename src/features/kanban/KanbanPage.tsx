// 칸반보드 (지라식) — 이슈 키(HAE-N)·우선순위·라벨·설명·검색/필터.
// 드래그로 컬럼 이동 = 상태 변경(완료↔체크 동기화), 카드 클릭 = 상세.
import { useMemo, useState } from 'react'
import { CloseIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import { addDays, dateShortLabel, todayKey } from '@/lib/dates'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import type { Subtask, Task, TaskPriority, TaskStatus } from '@/types'

interface Card {
  dateKey: string
  task: Task
}

const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'todo', label: '할 일', dot: '#8B8579' },
  { key: 'doing', label: '진행 중', dot: '#E0883A' },
  { key: 'done', label: '완료', dot: '#15795A' },
]

/* 우선순위 (지라식 화살표). 미지정 = 보통 */
const PRIORITIES: { key: TaskPriority; label: string; color: string; d: string }[] = [
  { key: 'high', label: '높음', color: '#D6544A', d: 'M6 15l6-6 6 6' },
  { key: 'mid', label: '보통', color: '#E0883A', d: 'M5 9h14M5 15h14' },
  { key: 'low', label: '낮음', color: '#3F82C2', d: 'M6 9l6 6 6-6' },
]
const prioOf = (t: Task): TaskPriority => t.priority ?? 'mid'
const PRIO_RANK: Record<TaskPriority, number> = { high: 0, mid: 1, low: 2 }

function PrioIcon({ p, w = 15 }: { p: TaskPriority; w?: number }) {
  const m = PRIORITIES.find((x) => x.key === p)!
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={m.d} />
    </svg>
  )
}

/* 라벨 색: 텍스트 해시 → 고정 팔레트 */
const LABEL_PALETTE = [
  { bg: '#E7F0F8', color: '#3F82C2' },
  { bg: '#F3EAF6', color: '#8A5AA8' },
  { bg: '#FDF0E3', color: '#C2702A' },
  { bg: '#E4F2EC', color: '#15795A' },
  { bg: '#F6ECEA', color: '#B05B52' },
]
const labelStyle = (name: string) => {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return LABEL_PALETTE[h % LABEL_PALETTE.length]
}

/* 세부 할 일 진행현황 (지라 하위 이슈 테이블) */
const subStatusOf = (x: Subtask): TaskStatus => x.status ?? (x.done ? 'done' : 'todo')
const SUB_STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  todo: { bg: '#F0F2F6', color: '#5A554B' },
  doing: { bg: '#FBF1E4', color: '#B26A14' },
  done: { bg: '#E4F2EC', color: '#15795A' },
}

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

  const submitAdd = (col: TaskStatus) => {
    if (addText.trim()) addTaskAt(todayKey(), addText, col)
    setAddText('')
    setAddingCol(null)
  }

  return (
    <div className="page-pad" style={{ minHeight: '100vh', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
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

/* ── 카드 상세: 키 · 제목 · 상태 · 우선순위 · 라벨 · 설명 · 세부 할일 ──── */
function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { updateTitle, setStatus, removeTask, patchTask, addSubtask, patchSubtask, deleteSubtask } = useTodoStore()
  const [subText, setSubText] = useState('')
  const [labelText, setLabelText] = useState('')

  // 스토어 최신 상태 반영 (수정 즉시 리렌더)
  const task = (tasksByDate[card.dateKey] ?? []).find((t) => t.id === card.task.id)
  if (!task) return null
  const subs = task.subtasks ?? []
  const subDone = subs.filter((x) => x.done).length
  const badge = dateBadge(card.dateKey)

  const submitSub = () => {
    if (subText.trim()) addSubtask(card.dateKey, task.id, subText)
    setSubText('')
  }
  const submitLabel = () => {
    const v = labelText.trim()
    if (v && !(task.labels ?? []).includes(v)) patchTask(card.dateKey, task.id, { labels: [...(task.labels ?? []), v] })
    setLabelText('')
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', maxHeight: '86vh', overflowY: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '22px 24px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#8B8579', letterSpacing: '.3px' }}>{task.key ?? ''}</span>
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
          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 21, fontWeight: 800, color: '#17150F', marginTop: 12, padding: 0 }}
        />

        {/* status + priority */}
        <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
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
          <div style={{ width: 1, background: '#E7EAEF', margin: '4px 3px' }} />
          {PRIORITIES.map((p) => {
            const on = prioOf(task) === p.key
            return (
              <div
                key={p.key}
                onClick={() => patchTask(card.dateKey, task.id, { priority: p.key })}
                className="hbtn"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}
              >
                <PrioIcon p={p.key} w={13} />
                {p.label}
              </div>
            )
          })}
        </div>

        {/* labels */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', marginBottom: 8 }}>라벨</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {(task.labels ?? []).map((l) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, padding: '5px 8px 5px 11px', borderRadius: 20, ...labelStyle(l) }}>
                {l}
                <span
                  onClick={() => patchTask(card.dateKey, task.id, { labels: (task.labels ?? []).filter((x) => x !== l) })}
                  style={{ cursor: 'pointer', display: 'flex', opacity: 0.65 }}
                >
                  <CloseIcon w={10} c="currentColor" />
                </span>
              </span>
            ))}
            <input
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitLabel()
              }}
              placeholder="+ 라벨 추가"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#5A554B', width: 90 }}
            />
          </div>
        </div>

        {/* description */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', marginBottom: 8 }}>설명</div>
          <textarea
            value={task.desc ?? ''}
            onChange={(e) => patchTask(card.dateKey, task.id, { desc: e.target.value })}
            placeholder="설명을 입력하세요…"
            rows={3}
            style={{ width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 11, padding: '11px 13px', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, lineHeight: 1.55, resize: 'vertical', color: '#17150F' }}
          />
        </div>

        {/* subtasks */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579' }}>
              세부 할 일 {subs.length > 0 && `· ${subDone}/${subs.length}`}
            </div>
            {subs.length > 0 && (
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#EEF0F4', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((subDone / subs.length) * 100)}%`, height: '100%', borderRadius: 3, background: subDone === subs.length ? '#15795A' : '#57B48C', transition: 'width .25s ease' }} />
              </div>
            )}
          </div>
          {subs.length > 0 && (
            <div style={{ border: '1px solid #E7EAEF', borderRadius: 12, overflow: 'hidden' }}>
              {/* 헤더 행 (지라 하위 이슈 테이블) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 96px 124px 30px', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F6F8FA', fontSize: 12, fontWeight: 800, color: '#A39C8E' }}>
                <div>할 일</div>
                <div>상태</div>
                <div>일정</div>
                <div />
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {subs.map((x) => {
                  const st = subStatusOf(x)
                  const sc = SUB_STATUS_STYLE[st]
                  return (
                    <div key={x.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 96px 124px 30px', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid #EEF0F4' }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: st === 'done' ? '#AEA89B' : '#17150F', textDecoration: st === 'done' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.title}</div>
                      <select
                        value={st}
                        onChange={(e) => patchSubtask(card.dateKey, task.id, x.id, { status: e.target.value as TaskStatus })}
                        style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, borderRadius: 8, padding: '5px 8px', textAlign: 'center', background: sc.bg, color: sc.color }}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={x.due ?? ''}
                        onChange={(e) => patchSubtask(card.dateKey, task.id, x.id, { due: e.target.value || undefined })}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: x.due ? '#5A554B' : '#B6BCC7', padding: 0, width: '100%', cursor: 'pointer' }}
                      />
                      <div onClick={() => deleteSubtask(card.dateKey, task.id, x.id)} className="hbtn" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        <TrashIcon w={14} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
