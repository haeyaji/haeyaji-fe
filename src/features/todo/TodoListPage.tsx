// 할 일 — 사이드바 독립 메뉴. 전체 할 일을 섹션(내 할일·루틴·공유 중)으로 모아 보고,
// 행을 눌러 공용 상세(TaskDetailModal)에서 편집·공유한다. 핀 고정·드래그 수동정렬 지원.
// be todo 계약: pinned(최상단 고정) · sort_order(드래그 순서) · TODO/DONE 2상태.
import { useState } from 'react'
import { PlusIcon } from '@/lib/icons'
import { todayKey } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { userById } from '@/store/useFriendStore'
import { useLabelStore } from '@/store/useLabelStore'
import { MC, cardStyle } from '@/features/meetup/tokens'
import { AvatarStack } from '@/features/meetup/meetupShared'
import { TaskDetailModal } from './TaskDetailModal'
import { dateBadge } from './taskMeta'
import type { Task } from '@/types'

interface Row {
  dateKey: string
  task: Task
}
const keyOf = (r: Row) => `${r.dateKey}-${r.task.id}`

export function TodoListPage() {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const setStatus = useTodoStore((s) => s.setStatus)
  const togglePin = useTodoStore((s) => s.togglePin)
  const reorderTasks = useTodoStore((s) => s.reorderTasks)
  const openAdd = useAppStore((s) => s.openAdd)
  const openLabelManager = useAppStore((s) => s.openLabelManager)
  const labels = useLabelStore((s) => s.labels)
  const assignments = useLabelStore((s) => s.assignments)
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)

  const all: Row[] = Object.keys(tasksByDate).flatMap((dateKey) => (tasksByDate[dateKey] ?? []).map((task) => ({ dateKey, task })))
  const q = query.trim().toLowerCase()
  const visible = all
    .filter(({ task }) => !q || task.title.toLowerCase().includes(q))
    .filter(({ task }) => !hideDone || statusOf(task) !== 'done')
    .filter(({ task }) => !filterLabel || assignments[task.id] === filterLabel)

  // 완료는 아래로 → 핀 먼저 → 수동정렬(sort_order) → 날짜
  const rank = (t: Task) => (statusOf(t) === 'done' ? 1 : 0)
  const pin = (t: Task) => (t.pinned ? 0 : 1)
  const sortRows = (rows: Row[]) =>
    [...rows].sort((a, b) => rank(a.task) - rank(b.task) || pin(a.task) - pin(b.task) || (a.task.sortOrder ?? 0) - (b.task.sortOrder ?? 0) || a.dateKey.localeCompare(b.dateKey))

  const routines = sortRows(visible.filter(({ task }) => task.group === 'routine'))
  const shared = sortRows(visible.filter(({ task }) => task.group !== 'routine' && (task.participants?.length ?? 0) > 0))
  const mine = sortRows(visible.filter(({ task }) => task.group !== 'routine' && (task.participants?.length ?? 0) === 0))

  const total = all.length
  const todayCount = all.filter(({ dateKey }) => dateKey === todayKey()).length
  const doneCount = all.filter(({ task }) => statusOf(task) === 'done').length

  // 드래그: 같은 섹션 안에서 dragKey를 targetKey 앞으로 이동 → sort_order 재부여
  const reorderWithin = (rows: Row[], targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return
    const from = rows.findIndex((r) => keyOf(r) === dragKey)
    const to = rows.findIndex((r) => keyOf(r) === targetKey)
    if (from < 0 || to < 0) return
    const next = [...rows]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    reorderTasks(next.map((r) => ({ dateKey: r.dateKey, id: r.task.id })))
  }

  const secProps = { onOpen: setDetail, onToggle: setStatus, onPin: togglePin, dragKey, setDragKey, reorderWithin }

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: 'var(--canvas)' }}>
      <div className="mp-wrap">
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>할 일</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: MC.muted, marginTop: 5 }}>
              오늘 {todayCount} · 전체 {total} · 완료 {doneCount}
            </div>
          </div>
          <div onClick={openAdd} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: MC.ink, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 20px', borderRadius: 15, cursor: 'pointer' }}>
            <PlusIcon c="#fff" w={17} /> 할 일 추가
          </div>
        </div>

        {/* 툴바 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1.5px solid ${MC.border}`, borderRadius: 12, padding: '9px 13px', flex: 1, minWidth: 200, maxWidth: 340 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MC.faint} strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목 검색" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, minWidth: 0 }} />
          </div>
          <div onClick={() => setHideDone((v) => !v)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: hideDone ? MC.ink : '#fff', color: hideDone ? '#fff' : MC.muted, border: `1.5px solid ${hideDone ? MC.ink : MC.border}`, borderRadius: 12, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
            완료 숨기기
          </div>
        </div>

        {/* 분류(라벨) 필터 + 관리 — 할일 관리 안에서 라벨 운영 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          <div onClick={() => setFilterLabel(null)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, padding: '6px 13px', borderRadius: 20, cursor: 'pointer', background: filterLabel === null ? MC.ink : '#fff', color: filterLabel === null ? '#fff' : MC.muted, border: `1.5px solid ${filterLabel === null ? MC.ink : MC.border}` }}>전체</div>
          {labels.map((l) => {
            const on = filterLabel === l.id
            const cnt = all.filter(({ task }) => assignments[task.id] === l.id).length
            return (
              <div key={l.id} onClick={() => setFilterLabel(on ? null : l.id)} className="hbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, padding: '6px 13px', borderRadius: 20, cursor: 'pointer', background: on ? l.color : l.color + '1F', color: on ? '#fff' : l.color, border: `1.5px solid ${on ? l.color : 'transparent'}` }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? '#fff' : l.color }} />
                {l.name}
                {cnt > 0 && <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.75 }}>{cnt}</span>}
              </div>
            )
          })}
          <div onClick={openLabelManager} className="hbtn" title="분류 관리" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', color: MC.muted, border: `1.5px dashed ${MC.border}` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            분류 관리
          </div>
        </div>

        {total === 0 ? (
          <div style={{ ...cardStyle, padding: '54px 26px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: MC.tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>아직 할 일이 없어요</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: MC.muted, marginTop: 6, marginBottom: 20 }}>할 일을 추가하거나, 루틴을 등록해 이번 달에 일괄 적용해보세요</div>
            <div onClick={openAdd} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: MC.ink, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 24px', borderRadius: 15, cursor: 'pointer' }}>
              <PlusIcon c="#fff" w={17} /> 할 일 추가
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section label="내 할 일" dot={MC.muted} rows={mine} empty="할 일이 없어요" {...secProps} />
            <Section label="루틴" dot={MC.primary} rows={routines} empty="등록된 루틴 일정이 없어요 · 루틴 메뉴에서 추가" {...secProps} />
            {shared.length > 0 && <Section label="공유 중" dot={MC.amber} rows={shared} empty="" {...secProps} />}
          </div>
        )}
      </div>

      {detail && <TaskDetailModal dateKey={detail.dateKey} taskId={detail.task.id} onClose={() => setDetail(null)} />}
    </div>
  )
}

interface SecProps {
  onOpen: (r: Row) => void
  onToggle: (dateKey: string, id: string, s: 'todo' | 'done') => void
  onPin: (dateKey: string, id: string) => void
  dragKey: string | null
  setDragKey: (k: string | null) => void
  reorderWithin: (rows: Row[], targetKey: string) => void
}

function Section({ label, dot, rows, empty, ...p }: { label: string; dot: string; rows: Row[]; empty: string } & SecProps) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: rows.length ? 8 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: 16, fontWeight: 800 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: MC.faint }}>{rows.length}</span>
      </div>
      {rows.length > 0 ? (
        <div>
          {rows.map((r) => (
            <TaskItem key={keyOf(r)} row={r} rows={rows} {...p} />
          ))}
        </div>
      ) : (
        empty && <div style={{ fontSize: 13.5, fontWeight: 600, color: MC.faint, padding: '10px 2px 2px' }}>{empty}</div>
      )}
    </div>
  )
}

function TaskItem({ row, rows, onOpen, onToggle, onPin, dragKey, setDragKey, reorderWithin }: { row: Row; rows: Row[] } & SecProps) {
  const { dateKey, task } = row
  const done = statusOf(task) === 'done'
  const badge = dateBadge(dateKey)
  const label = useLabelStore((s) => { const lid = s.assignments[task.id]; return lid ? s.labels.find((l) => l.id === lid) : undefined })
  const parts = (task.participants ?? []).filter((p) => p.status === 'accepted').map((p) => userById(p.userId)?.nickname).filter(Boolean) as string[]
  const pendingCount = (task.participants ?? []).filter((p) => p.status === 'pending').length
  const k = keyOf(row)
  const dragging = dragKey === k

  return (
    <div
      draggable
      onDragStart={() => setDragKey(k)}
      onDragEnd={() => setDragKey(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); reorderWithin(rows, k); setDragKey(null) }}
      onClick={() => onOpen(row)}
      className="hbtn"
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 6px', borderTop: '1px solid #F0EEE7', cursor: 'pointer', opacity: dragging ? 0.4 : 1, background: task.pinned ? 'linear-gradient(90deg, #FEFBF6, transparent 60%)' : 'transparent' }}
    >
      {/* 드래그 핸들 */}
      <span onClick={(e) => e.stopPropagation()} title="드래그로 순서 변경" style={{ cursor: 'grab', color: '#CBD0D8', display: 'flex', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
      </span>
      {/* 완료 토글 */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggle(dateKey, task.id, done ? 'todo' : 'done') }}
        style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: done ? 'none' : `2px solid ${MC.faint}`, background: done ? MC.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
      </div>
      {/* 본문 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15.5, fontWeight: 700, color: done ? MC.faint : MC.ink, textDecoration: done ? 'line-through' : 'none' }}>{task.title}</span>
          {label && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: label.color, background: label.color + '1F', padding: '2.5px 9px', borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: label.color }} />{label.name}</span>}
          {task.ai && <span style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '2.5px 8px', borderRadius: 20 }}>AI</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: badge.color, background: badge.bg, padding: '3px 9px', borderRadius: 20 }}>{badge.label}</span>
          {task.time && <span style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted }}>{task.time}</span>}
        </div>
      </div>
      {/* 공유 참여자(수락) + 대기 */}
      {parts.length > 0 && <AvatarStack names={parts} />}
      {pendingCount > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#C2702A', background: '#FBF0E1', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>대기 {pendingCount}</span>}
      {/* 핀 토글 */}
      <span
        onClick={(e) => { e.stopPropagation(); onPin(dateKey, task.id) }}
        title={task.pinned ? '고정 해제' : '최상단 고정'}
        className="hbtn"
        style={{ display: 'flex', flexShrink: 0, cursor: 'pointer', color: task.pinned ? '#C2702A' : '#CBD0D8' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={task.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5z" /><path d="M12 14v6" /></svg>
      </span>
    </div>
  )
}
