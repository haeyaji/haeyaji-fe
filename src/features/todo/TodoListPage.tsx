// 할 일 — 사이드바 독립 메뉴. 전체 할 일을 섹션(내 할 일·루틴·공유 중)으로 모아 보고,
// 행을 눌러 공용 상세(TaskDetailModal)에서 편집·공유한다. 칸반·캘린더·홈과 같은 스토어의 리스트 뷰.
import { useState } from 'react'
import { PlusIcon } from '@/lib/icons'
import { todayKey } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { userById } from '@/store/useFriendStore'
import { MC, cardStyle } from '@/features/meetup/tokens'
import { AvatarStack } from '@/features/meetup/meetupShared'
import { TaskDetailModal } from './TaskDetailModal'
import { dateBadge, PrioIcon, prioOf, PRIO_RANK, labelStyle } from './taskMeta'
import type { Task } from '@/types'

interface Row {
  dateKey: string
  task: Task
}

export function TodoListPage() {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const setStatus = useTodoStore((s) => s.setStatus)
  const openAdd = useAppStore((s) => s.openAdd)
  const [detail, setDetail] = useState<Row | null>(null)
  const [query, setQuery] = useState('')
  const [hideDone, setHideDone] = useState(false)

  const all: Row[] = Object.keys(tasksByDate).flatMap((dateKey) => (tasksByDate[dateKey] ?? []).map((task) => ({ dateKey, task })))
  const q = query.trim().toLowerCase()
  const visible = all
    .filter(({ task }) => !q || task.title.toLowerCase().includes(q) || (task.labels ?? []).some((l) => l.toLowerCase().includes(q)))
    .filter(({ task }) => !hideDone || statusOf(task) !== 'done')

  // done 아래로, 그다음 날짜·우선순위 순
  const rank = (t: Task) => (statusOf(t) === 'done' ? 1 : 0)
  const sortRows = (rows: Row[]) => [...rows].sort((a, b) => rank(a.task) - rank(b.task) || a.dateKey.localeCompare(b.dateKey) || PRIO_RANK[prioOf(a.task)] - PRIO_RANK[prioOf(b.task)])

  const routines = sortRows(visible.filter(({ task }) => task.group === 'routine'))
  const shared = sortRows(visible.filter(({ task }) => task.group !== 'routine' && (task.participants?.length ?? 0) > 0))
  const mine = sortRows(visible.filter(({ task }) => task.group !== 'routine' && (task.participants?.length ?? 0) === 0))

  const total = all.length
  const todayCount = all.filter(({ dateKey }) => dateKey === todayKey()).length
  const doneCount = all.filter(({ task }) => statusOf(task) === 'done').length

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: MC.canvas }}>
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목·라벨 검색" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, minWidth: 0 }} />
          </div>
          <div onClick={() => setHideDone((v) => !v)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: hideDone ? MC.ink : '#fff', color: hideDone ? '#fff' : MC.muted, border: `1.5px solid ${hideDone ? MC.ink : MC.border}`, borderRadius: 12, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
            완료 숨기기
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
            <Section label="내 할 일" dot={MC.muted} rows={mine} onOpen={setDetail} onToggle={setStatus} empty="할 일이 없어요" />
            <Section label="루틴" dot={MC.primary} rows={routines} onOpen={setDetail} onToggle={setStatus} empty="등록된 루틴 일정이 없어요 · 루틴 메뉴에서 추가" />
            {shared.length > 0 && <Section label="공유 중" dot={MC.amber} rows={shared} onOpen={setDetail} onToggle={setStatus} empty="" />}
          </div>
        )}
      </div>

      {detail && <TaskDetailModal dateKey={detail.dateKey} taskId={detail.task.id} onClose={() => setDetail(null)} />}
    </div>
  )
}

function Section({ label, dot, rows, onOpen, onToggle, empty }: { label: string; dot: string; rows: Row[]; onOpen: (r: Row) => void; onToggle: (dateKey: string, id: string, s: 'todo' | 'done') => void; empty: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: rows.length ? 8 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: 16, fontWeight: 800 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: MC.faint }}>{rows.length}</span>
      </div>
      {rows.length > 0 ? (
        <div>
          {rows.map((r) => <TaskItem key={`${r.dateKey}-${r.task.id}`} row={r} onOpen={onOpen} onToggle={onToggle} />)}
        </div>
      ) : (
        empty && <div style={{ fontSize: 13.5, fontWeight: 600, color: MC.faint, padding: '10px 2px 2px' }}>{empty}</div>
      )}
    </div>
  )
}

function TaskItem({ row, onOpen, onToggle }: { row: Row; onOpen: (r: Row) => void; onToggle: (dateKey: string, id: string, s: 'todo' | 'done') => void }) {
  const { dateKey, task } = row
  const done = statusOf(task) === 'done'
  const badge = dateBadge(dateKey)
  const parts = (task.participants ?? []).map((p) => userById(p.userId)?.nickname).filter(Boolean) as string[]
  return (
    <div onClick={() => onOpen(row)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px', borderTop: '1px solid #F0EEE7', cursor: 'pointer' }}>
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
          {(task.labels ?? []).map((l) => (
            <span key={l} style={{ fontSize: 11, fontWeight: 800, padding: '2.5px 8px', borderRadius: 20, ...labelStyle(l) }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: badge.color, background: badge.bg, padding: '3px 9px', borderRadius: 20 }}>{badge.label}</span>
          {task.time && <span style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted }}>{task.time}</span>}
          <PrioIcon p={prioOf(task)} w={13} />
        </div>
      </div>
      {/* 공유 참여자 */}
      {parts.length > 0 && <AvatarStack names={parts} />}
    </div>
  )
}
