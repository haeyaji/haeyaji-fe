// 할 일 상세 (공용) — 칸반 카드·할 일 리스트에서 같은 모달을 연다.
// 키·제목·상태·우선순위·라벨·설명·세부 할일 + 공유(참여자·권한).
import { useState } from 'react'
import { CloseIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { Avatar } from '@/features/meetup/meetupShared'
import { COLUMNS, PRIORITIES, PrioIcon, prioOf, labelStyle, dateBadge, subStatusOf, SUB_STATUS_STYLE } from './taskMeta'
import type { ShareRole, TaskStatus } from '@/types'

export function TaskDetailModal({ dateKey, taskId, onClose }: { dateKey: string; taskId: string; onClose: () => void }) {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { updateTitle, setStatus, removeTask, patchTask, addSubtask, patchSubtask, deleteSubtask } = useTodoStore()
  const friendIds = useFriendStore((s) => s.friendIds)
  const [subText, setSubText] = useState('')
  const [labelText, setLabelText] = useState('')
  const [inviteRole, setInviteRole] = useState<ShareRole>('editor')

  // 스토어 최신 상태 반영 (수정 즉시 리렌더)
  const task = (tasksByDate[dateKey] ?? []).find((t) => t.id === taskId)
  if (!task) return null
  const subs = task.subtasks ?? []
  const subDone = subs.filter((x) => x.done).length
  const badge = dateBadge(dateKey)

  // ── 공유 (역할 먼저 지정 → 초대 → 상대 수락) ──
  const participants = task.participants ?? []
  const sharedIds = new Set(participants.map((p) => p.userId))
  const friends = friendIds.map(userById).filter((u): u is NonNullable<typeof u> => !!u)
  const addable = friends.filter((f) => !sharedIds.has(f.id))
  const acceptedCount = participants.filter((p) => p.status === 'accepted').length
  const setParticipants = (next: typeof participants) => patchTask(dateKey, taskId, { participants: next })
  const invite = (userId: string) => setParticipants([...participants, { userId, role: inviteRole, status: 'pending' }])
  const accept = (userId: string) => setParticipants(participants.map((p) => (p.userId === userId ? { ...p, status: 'accepted' } : p)))
  const unshare = (userId: string) => setParticipants(participants.filter((p) => p.userId !== userId))
  const setRole = (userId: string, role: ShareRole) => setParticipants(participants.map((p) => (p.userId === userId ? { ...p, role } : p)))
  const ROLE_LABEL: Record<ShareRole, string> = { owner: '소유자', editor: '편집', viewer: '보기' }

  const submitSub = () => {
    if (subText.trim()) addSubtask(dateKey, task.id, subText)
    setSubText('')
  }
  const submitLabel = () => {
    const v = labelText.trim()
    if (v && !(task.labels ?? []).includes(v)) patchTask(dateKey, task.id, { labels: [...(task.labels ?? []), v] })
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
          <div onClick={() => { removeTask(dateKey, task.id); onClose() }} className="hbtn" title="삭제" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex' }}>
            <TrashIcon w={17} />
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>

        {/* title */}
        <input
          value={task.title}
          onChange={(e) => updateTitle(dateKey, task.id, e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 21, fontWeight: 800, color: '#17150F', marginTop: 12, padding: 0 }}
        />

        {/* status + priority */}
        <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
          {COLUMNS.map((c) => {
            const on = statusOf(task) === c.key
            return (
              <div key={c.key} onClick={() => setStatus(dateKey, task.id, c.key)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
                {c.label}
              </div>
            )
          })}
          <div style={{ width: 1, background: '#E7EAEF', margin: '4px 3px' }} />
          {PRIORITIES.map((p) => {
            const on = prioOf(task) === p.key
            return (
              <div key={p.key} onClick={() => patchTask(dateKey, task.id, { priority: p.key })} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>
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
                <span onClick={() => patchTask(dateKey, task.id, { labels: (task.labels ?? []).filter((x) => x !== l) })} style={{ cursor: 'pointer', display: 'flex', opacity: 0.65 }}>
                  <CloseIcon w={10} c="currentColor" />
                </span>
              </span>
            ))}
            <input
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitLabel() }}
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
            onChange={(e) => patchTask(dateKey, task.id, { desc: e.target.value })}
            placeholder="설명을 입력하세요…"
            rows={3}
            style={{ width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 11, padding: '11px 13px', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, lineHeight: 1.55, resize: 'vertical', color: '#17150F' }}
          />
        </div>

        {/* 공유 (역할 먼저 지정 → 초대 → 상대 수락) */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8B8579', marginBottom: 8 }}>공유 · {acceptedCount + 1}명{participants.length > acceptedCount && ` · 대기 ${participants.length - acceptedCount}`}</div>
          <div style={{ border: '1px solid #E7EAEF', borderRadius: 12, overflow: 'hidden' }}>
            {/* 소유자(나) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px' }}>
              <Avatar name="나" size={32} font={14} />
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>나</div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0F5A42', background: '#EAF5EF', padding: '5px 10px', borderRadius: 20 }}>소유자</span>
            </div>
            {/* 참여자 */}
            {participants.map((p) => {
              const u = userById(p.userId)
              if (!u) return null
              const pending = p.status === 'pending'
              return (
                <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderTop: '1px solid #EEF0F4', opacity: pending ? 0.72 : 1 }}>
                  <Avatar name={u.nickname} size={32} font={14} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nickname}</div>
                    {pending && <div style={{ fontSize: 11.5, fontWeight: 800, color: '#C2702A', marginTop: 1 }}>대기 중 · {ROLE_LABEL[p.role]}</div>}
                  </div>
                  {pending ? (
                    <div onClick={() => accept(p.userId)} className="lift" title="데모: 상대가 수락한 것으로 처리" style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#15795A', padding: '6px 12px', borderRadius: 20, cursor: 'pointer', flexShrink: 0 }}>수락(데모)</div>
                  ) : (
                    <select
                      value={p.role}
                      onChange={(e) => setRole(p.userId, e.target.value as ShareRole)}
                      style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, borderRadius: 8, padding: '5px 9px', background: '#F0F2F6', color: '#5A554B' }}
                    >
                      <option value="editor">편집</option>
                      <option value="viewer">보기</option>
                    </select>
                  )}
                  <div onClick={() => unshare(p.userId)} className="hbtn" title={pending ? '초대 취소' : '공유 해제'} style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                    <CloseIcon w={14} c="currentColor" />
                  </div>
                </div>
              )
            })}
          </div>
          {/* 초대: 역할 먼저 고르고 친구 선택 */}
          {addable.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E' }}>초대 권한</span>
                {(['editor', 'viewer'] as ShareRole[]).map((r) => {
                  const on = inviteRole === r
                  return (
                    <div key={r} onClick={() => setInviteRole(r)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>{ROLE_LABEL[r]}</div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {addable.map((f) => (
                  <div key={f.id} onClick={() => invite(f.id)} className="lift" title={`${ROLE_LABEL[inviteRole]} 권한으로 초대`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EAF5EF', color: '#0F5A42', fontSize: 13, fontWeight: 800, padding: '7px 12px 7px 8px', borderRadius: 20, cursor: 'pointer' }}>
                    <Avatar name={f.nickname} size={22} font={11} />
                    <PlusIcon c="#0F5A42" w={12} />
                    {f.nickname}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B6BCC7', marginTop: 10, padding: '0 2px' }}>
              {friends.length === 0 ? '마이페이지에서 친구를 추가하면 공유할 수 있어요' : '모든 친구를 초대했어요'}
            </div>
          )}
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
                        onChange={(e) => patchSubtask(dateKey, task.id, x.id, { status: e.target.value as TaskStatus })}
                        style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, borderRadius: 8, padding: '5px 8px', textAlign: 'center', background: sc.bg, color: sc.color }}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={x.due ?? ''}
                        onChange={(e) => patchSubtask(dateKey, task.id, x.id, { due: e.target.value || undefined })}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: x.due ? '#5A554B' : '#B6BCC7', padding: 0, width: '100%', cursor: 'pointer' }}
                      />
                      <div onClick={() => deleteSubtask(dateKey, task.id, x.id)} className="hbtn" style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
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
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitSub() }}
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
