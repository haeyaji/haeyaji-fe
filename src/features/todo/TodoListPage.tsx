// 할 일 — 사이드바 독립 메뉴. 전체 할 일을 섹션(내 할일·루틴·공유 중)으로 모아 보고,
// 행을 눌러 공용 상세(TaskDetailModal)에서 편집·공유한다. 핀 고정·드래그 수동정렬 지원.
// be todo 계약: pinned(최상단 고정) · sort_order(드래그 순서) · TODO/DONE 2상태.
import { useState, useEffect } from 'react'
import { PlusIcon } from '@/lib/icons'
import { todayKey, addDays, dateFullLabel } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { userById } from '@/store/useFriendStore'
import { useLabelStore } from '@/store/useLabelStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { MC, cardStyle } from '@/features/meetup/tokens'
import { AvatarStack } from '@/features/meetup/meetupShared'
import { TaskDetailModal } from './TaskDetailModal'
import { dateBadge } from './taskMeta'
import { DOW } from '@/lib/mockData'
import type { Task, Routine } from '@/types'

// 반복 요일 요약 (매일/평일/주말/요일목록)
function daysLabel(days: boolean[]): string {
  const n = days.filter(Boolean).length
  if (n === 7) return '매일'
  if (days.slice(0, 5).every(Boolean) && !days[5] && !days[6]) return '평일'
  if (!days.slice(0, 5).some(Boolean) && days[5] && days[6]) return '주말'
  return DOW.filter((_, i) => days[i]).join('·') || '없음'
}

interface Row {
  dateKey: string
  task: Task
}
const keyOf = (r: Row) => `${r.dateKey}-${r.task.id}`

const navBtnStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: 10, background: '#F4F3F0', color: '#8B8579', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }

export function TodoListPage() {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const setStatus = useTodoStore((s) => s.setStatus)
  const togglePin = useTodoStore((s) => s.togglePin)
  const reorderTasks = useTodoStore((s) => s.reorderTasks)
  const openAdd = useAppStore((s) => s.openAdd)
  const openLabelManager = useAppStore((s) => s.openLabelManager)
  const openRoutine = useAppStore((s) => s.openRoutine)
  const selId = useAppStore((s) => s.selId)
  const setSelId = useAppStore((s) => s.setSelId)
  useEffect(() => { void useTodoStore.getState().loadDate(selId) }, [selId]) // 선택 날짜 할일 로드
  const labels = useLabelStore((s) => s.labels)
  const assignments = useLabelStore((s) => s.assignments)
  const routineDefs = useRoutineStore((s) => s.routines)
  const toggleRoutineActive = useRoutineStore((s) => s.toggleActive)
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)

  // 선택 날짜(selId)의 할 일만 관리 — 날짜별로 보고 앞뒤로 이동
  const all: Row[] = (tasksByDate[selId] ?? []).map((task) => ({ dateKey: selId, task }))
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

  // 루틴이 생성한 todo도 일반 할 일로 취급(내 할 일에서 체크). 루틴 "정의"는 별도 섹션.
  const shared = sortRows(visible.filter(({ task }) => (task.participants?.length ?? 0) > 0))
  const mine = sortRows(visible.filter(({ task }) => (task.participants?.length ?? 0) === 0))

  const total = all.length
  const doneCount = all.filter(({ task }) => statusOf(task) === 'done').length
  const isToday = selId === todayKey()

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
    <div className="mp-pad" style={{ height: 'var(--full-vh)', display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', color: MC.ink, background: 'var(--canvas)' }}>
      <div className="mp-wrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ flexShrink: 0 }}>
        {/* 헤더 — 제목 + 추가 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>할 일</div>
          <div onClick={openAdd} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: MC.ink, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 20px', borderRadius: 15, cursor: 'pointer' }}>
            <PlusIcon c="#fff" w={17} /> 할 일 추가
          </div>
        </div>

        {/* 날짜 네비게이션 — 가운데 정렬, 크게 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 18 }}>
          <div onClick={() => setSelId(addDays(selId, -1))} className="hbtn" title="전날" style={navBtnStyle}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          </div>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.4px', minWidth: 190, textAlign: 'center' }}>{dateFullLabel(selId)}</div>
          <div onClick={() => setSelId(addDays(selId, 1))} className="hbtn" title="다음날" style={navBtnStyle}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </div>
          {!isToday && <div onClick={() => setSelId(todayKey())} className="hbtn" style={{ fontSize: 13, fontWeight: 800, color: MC.tintText, background: MC.tintBg, borderRadius: 10, padding: '8px 13px', cursor: 'pointer' }}>오늘</div>}
          <span style={{ fontSize: 13.5, fontWeight: 700, color: MC.muted }}>전체 {total} · 완료 {doneCount}</span>
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
        </div>{/* 헤더/필터 고정 영역 끝 */}

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginRight: -8, paddingRight: 8 }}>
        {total === 0 && routineDefs.length === 0 ? (
          <div style={{ ...cardStyle, padding: '54px 26px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: MC.tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>아직 할 일이 없어요</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: MC.muted, marginTop: 6, marginBottom: 20 }}>할 일을 추가하거나, 루틴을 등록해보세요</div>
            <div onClick={openAdd} className="lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: MC.ink, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 24px', borderRadius: 15, cursor: 'pointer' }}>
              <PlusIcon c="#fff" w={17} /> 할 일 추가
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Section label="내 할 일" dot={MC.muted} rows={mine} empty="할 일이 없어요" {...secProps} />
            {shared.length > 0 && <Section label="공유 중" dot={MC.amber} rows={shared} empty="" {...secProps} />}
            <RoutineDefsCard routines={routineDefs} onToggle={toggleRoutineActive} onManage={openRoutine} />
          </div>
        )}
        </div>{/* 스크롤 영역 끝 */}
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
          {task.group === 'routine' && <span style={{ fontSize: 11, fontWeight: 800, color: '#3F82C2', background: '#E7F0F8', padding: '2.5px 8px', borderRadius: 20 }}>루틴</span>}
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill={task.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5z" /><path d="M12 14v6" /></svg>
      </span>
    </div>
  )
}

// 루틴 "정의" 카드 — 완료 체크가 아니라 활성/비활성 토글. 실제 할 일은 be 스케줄러가 생성해 위 목록에서 체크.
function RoutineDefsCard({ routines, onToggle, onManage }: { routines: Routine[]; onToggle: (id: string) => void; onManage: () => void }) {
  const labelsById = useLabelStore((s) => s.labels)
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: routines.length ? 8 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: MC.primary }} />
        <span style={{ fontSize: 16, fontWeight: 800 }}>루틴</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: MC.faint }}>{routines.length}</span>
        <div style={{ flex: 1 }} />
        <div onClick={onManage} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: MC.tintText, background: MC.tintBg, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}>관리</div>
      </div>
      {routines.length > 0 ? (
        <div>
          {routines.map((r) => {
            const lab = r.labelId ? labelsById.find((l) => l.id === r.labelId) : undefined
            const accent = lab?.color ?? MC.primary
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px', borderTop: '1px solid #F0EEE7', opacity: r.active ? 1 : 0.5 }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: accent + '1F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                    {lab && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: lab.color, background: lab.color + '1F', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: lab.color }} />{lab.name}</span>}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted, marginTop: 2 }}>{r.time || '시간 미정'} · {daysLabel(r.days)}</div>
                </div>
                <div onClick={() => onToggle(r.id)} title={r.active ? '활성' : '비활성'} style={{ width: 44, height: 26, borderRadius: 20, cursor: 'pointer', position: 'relative', background: r.active ? MC.primary : '#CCD2DC', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2.5, left: r.active ? 21 : 2, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, fontWeight: 600, color: MC.faint, padding: '10px 2px 2px' }}>등록된 루틴이 없어요 · 루틴 메뉴에서 추가</div>
      )}
    </div>
  )
}
