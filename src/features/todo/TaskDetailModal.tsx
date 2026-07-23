// 할 일 상세 (공용) — 할 일 리스트에서 연다. be todo 계약에 맞춰 제목·상태(TODO/DONE)·시간·
// 카테고리·장소·핀 + 공유(todo_participant: 역할·초대수락)만 다룬다. (칸반/지라 필드는 제거됨)
import { useState } from 'react'
import { CloseIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useLabelStore } from '@/store/useLabelStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/features/meetup/meetupShared'
import { LabelPicker } from './LabelPicker'
import { DayPicker } from '@/features/routine/DayPicker'
import { COLUMNS, dateBadge } from './taskMeta'
import type { ShareRole } from '@/types'

const ROLE_LABEL: Record<ShareRole, string> = { owner: '소유자', editor: '편집', viewer: '보기' }
const label = { fontSize: 14, fontWeight: 800, color: '#8B8579', marginBottom: 11 } as const

// 핀 아이콘 (채워짐/윤곽)
function PinIcon({ filled, c }: { filled: boolean; c: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5z" /><path d="M12 14v6" />
    </svg>
  )
}

export function TaskDetailModal({ dateKey, taskId, onClose }: { dateKey: string; taskId: string; onClose: () => void }) {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { updateTitle, setStatus, removeTask, patchTask, togglePin } = useTodoStore()
  const friendIds = useFriendStore((s) => s.friendIds)
  const assignments = useLabelStore((s) => s.assignments) // 라벨 변경 리렌더용
  const setTodoLabel = useLabelStore((s) => s.setTodoLabel)
  const createRoutine = useRoutineStore((s) => s.createRoutine)
  const toast = useAppStore((s) => s.toast)
  const [inviteRole, setInviteRole] = useState<ShareRole>('editor')
  const [expand, setExpand] = useState(false)
  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, false, false])

  // 스토어 최신 상태 반영 (수정 즉시 리렌더)
  const task = (tasksByDate[dateKey] ?? []).find((t) => t.id === taskId)
  if (!task) return null
  const badge = dateBadge(dateKey)
  const done = statusOf(task) === 'done'

  // ── 공유 (역할 먼저 지정 → 초대 → 상대 수락) ──
  const participants = task.participants ?? []
  const sharedIds = new Set(participants.map((p) => p.userId))
  const friends = friendIds.map(userById).filter((u): u is NonNullable<typeof u> => !!u)
  const addable = friends.filter((f) => !sharedIds.has(f.id))
  const acceptedCount = participants.filter((p) => p.status === 'accepted').length
  const pendingCount = participants.filter((p) => p.status === 'pending').length
  const setParticipants = (next: typeof participants) => patchTask(dateKey, taskId, { participants: next })
  const invite = (userId: string) => setParticipants([...participants, { userId, role: inviteRole, status: 'pending' }])
  const accept = (userId: string) => setParticipants(participants.map((p) => (p.userId === userId ? { ...p, status: 'accepted' } : p)))
  const reject = (userId: string) => setParticipants(participants.map((p) => (p.userId === userId ? { ...p, status: 'rejected' } : p)))
  const unshare = (userId: string) => setParticipants(participants.filter((p) => p.userId !== userId))
  const setRole = (userId: string, role: ShareRole) => setParticipants(participants.map((p) => (p.userId === userId ? { ...p, role } : p)))

  const labelId = assignments[taskId] ?? null

  const isRoutine = task.group === 'routine'
  // 개별 → 루틴: 루틴 정의 생성(알람식, todo는 be 스케줄러가 생성) + 이 할 일을 루틴 소속으로
  const registerRoutine = () => {
    if (!days.some(Boolean)) { toast('반복 요일을 하나 이상 선택해주세요'); return }
    createRoutine({ title: task.title, time: task.time || '', days, labelId })
    patchTask(dateKey, taskId, { group: 'routine' })
    toast('루틴으로 등록했어요 · 매일 자정에 자동 생성돼요')
    setExpand(false)
  }
  // 루틴 → 개별: 이 할 일만 일반 할 일로 전환 (루틴 정의는 그대로)
  const convertToTodo = () => {
    patchTask(dateKey, taskId, { group: 'personal' })
    toast('일반 할 일로 바꿨어요')
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(660px, 94vw)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 24, boxShadow: '0 40px 90px rgba(24,21,15,.4)', animation: 'rb-modal .22s ease', padding: '26px 34px 34px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: badge.color, background: badge.bg, padding: '4px 11px', borderRadius: 20, flexShrink: 0 }}>{badge.label}</span>
          {task.ai && <span style={{ fontSize: 11.5, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '4px 10px', borderRadius: 20 }}>AI 추천</span>}
          <div style={{ flex: 1 }} />
          <div onClick={() => togglePin(dateKey, task.id)} className="hbtn" title={task.pinned ? '고정 해제' : '최상단 고정'} style={{ width: 32, height: 32, borderRadius: 10, background: task.pinned ? '#FDF0E3' : '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <PinIcon filled={!!task.pinned} c={task.pinned ? '#C2702A' : '#A39C8E'} />
          </div>
          <div onClick={() => { removeTask(dateKey, task.id); onClose() }} className="hbtn" title="삭제" style={{ width: 32, height: 32, borderRadius: 10, background: '#F0F2F6', color: '#C77', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <TrashIcon w={16} />
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>

        {/* title + 완료 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <div
            onClick={() => setStatus(dateKey, task.id, done ? 'todo' : 'done')}
            title={done ? '완료 취소' : '완료'}
            style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: done ? 'none' : '2px solid #CCD2DC', background: done ? '#15795A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
          </div>
          <input
            value={task.title}
            onChange={(e) => updateTitle(dateKey, task.id, e.target.value)}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 24, fontWeight: 800, color: done ? '#AEA89B' : '#17150F', textDecoration: done ? 'line-through' : 'none', padding: 0 }}
          />
        </div>

        {/* 상태 토글 */}
        <div style={{ display: 'flex', gap: 7, marginTop: 16 }}>
          {COLUMNS.map((c) => {
            const on = statusOf(task) === c.key
            return (
              <div key={c.key} onClick={() => setStatus(dateKey, task.id, c.key)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
                {c.label}
              </div>
            )
          })}
          {task.time && <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#8B8579', background: '#F6F8FA', padding: '8px 13px', borderRadius: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            {task.time}
          </div>}
        </div>

        {/* 분류 (사용자 라벨, be todo.label_id) */}
        <div style={{ marginTop: 20 }}>
          <div style={label}>분류</div>
          <LabelPicker value={labelId} onChange={(lid) => setTodoLabel(taskId, lid)} />
        </div>

        {/* 장소 (추천에서 온 경우만) */}
        {task.placeName && (
          <div style={{ marginTop: 20 }}>
            <div style={label}>장소</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#F6F8FA', border: '1px solid #EAECEF', borderRadius: 13, padding: '12px 14px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.placeName}</div>
              {task.placeUrl && (
                <div onClick={() => window.open(task.placeUrl!, '_blank', 'noopener')} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '7px 12px', borderRadius: 20, cursor: 'pointer', flexShrink: 0 }}>지도</div>
              )}
            </div>
          </div>
        )}

        {/* 반복 — 루틴 (루틴 todo면 ON·끄면 개별로 / 개별이면 켜서 루틴 등록) */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#8B8579' }}>{isRoutine ? '루틴 할 일' : '루틴으로 반복'}</div>
                {isRoutine && <span style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '2.5px 8px', borderRadius: 20 }}>반복 중</span>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 3 }}>{isRoutine ? '반복 루틴에서 온 할 일이에요 · 끄면 일반 할 일이 돼요' : '반복 요일로 등록하면 매일 자정에 자동 생성돼요'}</div>
            </div>
            <div onClick={() => (isRoutine ? convertToTodo() : setExpand((v) => !v))} title={isRoutine ? '일반 할 일로 바꾸기' : '루틴 설정'} style={{ width: 46, height: 27, borderRadius: 20, cursor: 'pointer', position: 'relative', background: isRoutine || expand ? '#15795A' : '#CCD2DC', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2.5, left: isRoutine || expand ? 22 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
            </div>
          </div>
          {!isRoutine && expand && (
            <div style={{ marginTop: 12, background: '#F9FAFB', border: '1px solid #EEF0F4', borderRadius: 14, padding: 15, animation: 'rb-fade .16s ease' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#8B8579', marginBottom: 9 }}>반복 요일</div>
              <DayPicker days={days} onChange={setDays} />
              <div onClick={registerRoutine} className="lift" style={{ marginTop: 14, textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: '#fff', background: '#17150F', borderRadius: 13, padding: 13, cursor: 'pointer' }}>루틴으로 등록</div>
            </div>
          )}
        </div>

        {/* 공유 (todo_participant: 역할 먼저 지정 → 초대 → 상대 수락) */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#8B8579' }}>공유</div>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F5A42', background: '#EAF5EF', padding: '3px 9px', borderRadius: 20 }}>{acceptedCount + 1}명</span>
            {pendingCount > 0 && <span style={{ fontSize: 11.5, fontWeight: 800, color: '#C2702A', background: '#FBF0E1', padding: '3px 9px', borderRadius: 20 }}>대기 {pendingCount}</span>}
          </div>

          <div style={{ border: '1px solid #EAECEF', borderRadius: 14, overflow: 'hidden' }}>
            {/* 소유자(나) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px' }}>
              <Avatar name="나" size={34} font={15} />
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>나</div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F5A42', background: '#EAF5EF', padding: '5px 11px', borderRadius: 20 }}>소유자</span>
            </div>
            {/* 참여자 */}
            {participants.map((p) => {
              const u = userById(p.userId)
              if (!u) return null
              const pending = p.status === 'pending'
              const rejected = p.status === 'rejected'
              const dot = pending ? '#E0883A' : rejected ? '#D9614F' : null
              return (
                <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderTop: '1px solid #EEF0F4', background: pending ? '#FEFBF6' : rejected ? '#FCF3F1' : '#fff' }}>
                  <div style={{ position: 'relative', flexShrink: 0, opacity: pending || rejected ? 0.8 : 1 }}>
                    <Avatar name={u.nickname} size={34} font={15} />
                    {dot && <span style={{ position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%', background: dot, border: '2px solid #fff' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: pending || rejected ? '#8B8579' : '#17150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: rejected ? 'line-through' : 'none' }}>{u.nickname}</div>
                    {pending && <div style={{ fontSize: 11.5, fontWeight: 800, color: '#C2702A', marginTop: 1 }}>수락 대기 · {ROLE_LABEL[p.role]}</div>}
                    {rejected && <div style={{ fontSize: 11.5, fontWeight: 800, color: '#C24A3A', marginTop: 1 }}>초대 거절됨</div>}
                  </div>
                  {pending ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <div onClick={() => accept(p.userId)} className="lift" title="데모: 상대가 수락" style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#15795A', padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}>수락</div>
                      <div onClick={() => reject(p.userId)} className="hbtn" title="데모: 상대가 거절" style={{ fontSize: 12, fontWeight: 800, color: '#C24A3A', background: '#FBEBE7', padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}>거절</div>
                    </div>
                  ) : rejected ? null : (
                    <select
                      value={p.role}
                      onChange={(e) => setRole(p.userId, e.target.value as ShareRole)}
                      style={{ appearance: 'none', WebkitAppearance: 'none', border: '1px solid #E7EAEF', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, borderRadius: 9, padding: '6px 10px', background: '#fff', color: '#5A554B', flexShrink: 0 }}
                    >
                      <option value="editor">편집</option>
                      <option value="viewer">보기</option>
                    </select>
                  )}
                  <div onClick={() => unshare(p.userId)} className="hbtn" title={pending ? '초대 취소' : rejected ? '목록에서 제거' : '공유 해제'} style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                    <CloseIcon w={14} c="currentColor" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 초대: 역할 먼저 고르고 친구 선택 */}
          {addable.length > 0 ? (
            <div style={{ marginTop: 12, background: '#F9FAFB', border: '1px solid #EEF0F4', borderRadius: 14, padding: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579' }}>초대 권한</span>
                {(['editor', 'viewer'] as ShareRole[]).map((r) => {
                  const on = inviteRole === r
                  return (
                    <div key={r} onClick={() => setInviteRole(r)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, padding: '5px 13px', borderRadius: 20, cursor: 'pointer', background: on ? '#17150F' : '#fff', color: on ? '#fff' : '#8B8579', border: on ? 'none' : '1px solid #E7EAEF' }}>{ROLE_LABEL[r]}</div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {addable.map((f) => (
                  <div key={f.id} onClick={() => invite(f.id)} className="lift" title={`${ROLE_LABEL[inviteRole]} 권한으로 초대`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #E7EAEF', color: '#17150F', fontSize: 13, fontWeight: 800, padding: '6px 12px 6px 7px', borderRadius: 20, cursor: 'pointer' }}>
                    <Avatar name={f.nickname} size={22} font={11} />
                    {f.nickname}
                    <PlusIcon c="#15795A" w={13} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B6BCC7', marginTop: 11, padding: '0 2px' }}>
              {friends.length === 0 ? '마이페이지에서 친구를 추가하면 공유할 수 있어요' : '모든 친구를 초대했어요'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
