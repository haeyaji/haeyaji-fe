// 할 일 상세 (공용) — 할 일 리스트에서 연다. be todo 계약에 맞춰 제목·상태(TODO/DONE)·시간·
// 분류(라벨)·장소·핀·반복(루틴) + 공유(todo_participant: 역할·초대수락)를 다룬다. (칸반/지라 필드는 제거됨)
import { useEffect, useState } from 'react'
import { CloseIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import { safeUrl } from '@/lib/dom'
import { useOverlay } from '@/lib/useOverlay'
import { useTodoStore, statusOf } from '@/store/useTodoStore'
import { useFriendStore } from '@/store/useFriendStore'
import { shareTodo, listParticipants, changeParticipantRole, removeParticipant, type TodoParticipant } from '@/api/todoShareApi'
import { useLabelStore } from '@/store/useLabelStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/features/meetup/meetupShared'
import { LabelPicker } from './LabelPicker'
import { DayPicker } from '@/features/routine/DayPicker'
import { COLUMNS, dateBadge } from './taskMeta'
import { normalizeTime, todayKey, dateFullLabel } from '@/lib/dates'
import { searchPlaces, type PlaceRaw } from '@/api/placeApi'
import { useLocationStore } from '@/store/useLocationStore'
import type { ShareRole } from '@/types'

const ROLE_LABEL: Record<ShareRole, string> = { owner: '소유자', editor: '편집', viewer: '보기' }
const label = { fontSize: 14, fontWeight: 800, color: '#8B8579', marginBottom: 11 } as const

// 핀 아이콘 (채워짐/윤곽)
function PinIcon({ filled, c }: { filled: boolean; c: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5z" /><path d="M12 14v6" />
    </svg>
  )
}

export function TaskDetailModal({ dateKey, taskId, onClose }: { dateKey: string; taskId: string; onClose: () => void }) {
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const { updateTitle, setStatus, removeTask, patchTask, togglePin, leaveShared, moveTask } = useTodoStore()
  const loc = useLocationStore()
  const friendItems = useFriendStore((s) => s.friends)
  const nameOf = useFriendStore((s) => s.nameOf)
  const assignments = useLabelStore((s) => s.assignments) // 라벨 변경 리렌더용
  const setTodoLabel = useLabelStore((s) => s.setTodoLabel)
  const createRoutine = useRoutineStore((s) => s.createRoutine)
  const toast = useAppStore((s) => s.toast)
  const [inviteRole, setInviteRole] = useState<ShareRole>('editor')
  const [expand, setExpand] = useState(false)
  const [days, setDays] = useState<boolean[]>([true, true, true, true, true, false, false])
  const [timeInput, setTimeInput] = useState(() => (useTodoStore.getState().tasksByDate[dateKey] ?? []).find((t) => t.id === taskId)?.time || '')
  const [timeErr, setTimeErr] = useState(false)
  const [placeOpen, setPlaceOpen] = useState(false) // 장소 검색 열림
  const [placeQ, setPlaceQ] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceRaw[]>([])
  const [placeSearching, setPlaceSearching] = useState(false)
  useOverlay(true, onClose)

  // 장소 검색 (카카오, 현위치 기준 5km, 디바운스 350ms)
  useEffect(() => {
    if (!placeOpen) return
    const q = placeQ.trim()
    if (!q) { setPlaceResults([]); setPlaceSearching(false); return }
    setPlaceSearching(true)
    const t = setTimeout(async () => {
      try { setPlaceResults(await searchPlaces(q, loc.lat, loc.lng, 5000, 8)) } catch { setPlaceResults([]) }
      setPlaceSearching(false)
    }, 350)
    return () => clearTimeout(t)
  }, [placeQ, placeOpen, loc.lat, loc.lng])

  // 스토어 최신 상태 반영 (수정 즉시 리렌더)
  const task = (tasksByDate[dateKey] ?? []).find((t) => t.id === taskId)
  if (!task) return null
  const badge = dateBadge(dateKey)
  const done = statusOf(task) === 'done'
  const canEdit = !task.shared || task.myRole === 'EDITOR' // 공유 VIEWER는 읽기전용
  const guardEdit = () => { if (!canEdit) toast('보기 권한이라 수정할 수 없어요'); return canEdit }
  // 시간 편집: 자유입력 → "오전/오후 HH:MM" 정규화 후 저장(be PATCH). 형식 못 알아보면 힌트.
  const commitTime = () => {
    const n = normalizeTime(timeInput)
    if (n === null) { setTimeErr(true); return }
    setTimeErr(false)
    if (n !== timeInput) setTimeInput(n)
    if (n !== (task.time || '')) patchTask(dateKey, taskId, { time: n })
  }

  // ── 공유 (be /todos/{id}/share) — 이 모달의 할 일은 내 소유이므로 나는 owner ──
  // be는 participants에 OWNER 행을 두지 않음 → 초대받은 사람만. 수락/거절은 초대받은 본인만 가능(여기선 상태 표시만).
  const [parts, setParts] = useState<TodoParticipant[]>([])
  const isServerTodo = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(taskId) // be UUID일 때만 공유 가능
  useEffect(() => {
    if (!isServerTodo) return
    let alive = true
    listParticipants(taskId).then((p) => { if (alive) setParts(p) }).catch(() => { /* 미공유/권한없음 무시 */ })
    return () => { alive = false }
  }, [taskId, isServerTodo])
  const refetch = () => listParticipants(taskId).then(setParts).catch(() => {})
  const sharedIds = new Set(parts.map((p) => p.memberId))
  const friends = friendItems.map((f) => ({ id: f.memberId, nickname: nameOf(f.memberId) }))
  const addable = friends.filter((f) => !sharedIds.has(f.id))
  const acceptedCount = parts.filter((p) => p.inviteStatus === 'ACCEPTED').length
  const pendingCount = parts.filter((p) => p.inviteStatus === 'PENDING').length
  const beRole = (r: ShareRole) => (r === 'viewer' ? 'VIEWER' : 'EDITOR') as 'EDITOR' | 'VIEWER'
  const invite = async (memberId: string) => {
    try { await shareTodo(taskId, [{ memberId, role: beRole(inviteRole) }]); await refetch(); toast('공유했어요') }
    catch (e) { toast((e as Error)?.message || '공유에 실패했어요') }
  }
  const unshare = async (memberId: string) => {
    try { await removeParticipant(taskId, memberId); await refetch() } catch (e) { toast((e as Error)?.message || '해제에 실패했어요') }
  }
  const setRole = async (memberId: string, role: ShareRole) => {
    try { await changeParticipantRole(taskId, memberId, beRole(role)); await refetch() } catch (e) { toast((e as Error)?.message || '변경에 실패했어요') }
  }

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
          {canEdit && (
            <div onClick={() => togglePin(dateKey, task.id)} className="hbtn" title={task.pinned ? '고정 해제' : '최상단 고정'} style={{ width: 32, height: 32, borderRadius: 10, background: task.pinned ? '#FDF0E3' : '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <PinIcon filled={!!task.pinned} c={task.pinned ? '#C2702A' : '#A39C8E'} />
            </div>
          )}
          <div onClick={() => { task.shared ? void leaveShared(task.id) : removeTask(dateKey, task.id); onClose() }} className="hbtn" title={task.shared ? '공유 나가기' : '삭제'} style={{ width: 32, height: 32, borderRadius: 10, background: '#F0F2F6', color: '#C77', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <TrashIcon w={16} />
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={14} />
          </div>
        </div>

        {/* title + 완료 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <div
            onClick={() => { if (guardEdit()) setStatus(dateKey, task.id, done ? 'todo' : 'done') }}
            title={done ? '완료 취소' : '완료'}
            style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: done ? 'none' : '2px solid #CCD2DC', background: done ? '#15795A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canEdit ? 'pointer' : 'not-allowed' }}
          >
            {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
          </div>
          <input
            value={task.title}
            readOnly={!canEdit}
            onChange={(e) => updateTitle(dateKey, task.id, e.target.value)}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 24, fontWeight: 800, color: done ? '#AEA89B' : '#17150F', textDecoration: done ? 'line-through' : 'none', padding: 0 }}
          />
        </div>

        {/* 상태 토글 */}
        <div style={{ display: 'flex', gap: 7, marginTop: 16 }}>
          {COLUMNS.map((c) => {
            const on = statusOf(task) === c.key
            return (
              <div key={c.key} onClick={() => { if (guardEdit()) setStatus(dateKey, task.id, c.key) }} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, cursor: canEdit ? 'pointer' : 'not-allowed', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#8B8579' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
                {c.label}
              </div>
            )
          })}
        </div>

        {/* 시간 (편집) */}
        <div style={{ marginTop: 20 }}>
          <div style={label}>시간</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F8FA', border: `1px solid ${timeErr ? '#E5A79C' : '#EAECEF'}`, borderRadius: 13, padding: '11px 14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8579" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <input
              value={timeInput}
              readOnly={!canEdit}
              onChange={(e) => { setTimeInput(e.target.value); setTimeErr(false) }}
              onBlur={() => { if (canEdit) commitTime() }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              placeholder="예: 오후 2시 · 시간 없으면 비워두기"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#17150F' }}
            />
          </div>
          {timeErr && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#C0645C', marginTop: 6, paddingLeft: 2 }}>시간을 알아보지 못했어요. "오후 2시", "14:30"처럼 입력해주세요.</div>}
        </div>

        {/* 날짜 (소유·비루틴만 다른 날로 이동 — be는 삭제+재생성) */}
        <div style={{ marginTop: 20 }}>
          <div style={label}>날짜</div>
          {canEdit && !task.shared && task.group !== 'routine' ? (
            <input
              type="date"
              value={dateKey}
              min={todayKey()}
              onChange={(e) => { const nd = e.target.value; if (nd && nd !== dateKey) { void moveTask(dateKey, taskId, nd); onClose() } }}
              style={{ width: '100%', border: '1px solid #EAECEF', outline: 'none', background: '#F6F8FA', borderRadius: 13, padding: '11px 14px', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#17150F' }}
            />
          ) : (
            <div style={{ background: '#F6F8FA', border: '1px solid #EAECEF', borderRadius: 13, padding: '11px 14px', fontSize: 14.5, fontWeight: 700, color: '#8B8579' }}>{dateFullLabel(dateKey)}</div>
          )}
        </div>

        {/* 분류 (사용자 라벨, be todo.label_id) */}
        <div style={{ marginTop: 20 }}>
          <div style={label}>분류</div>
          <LabelPicker value={labelId} onChange={(lid) => setTodoLabel(taskId, lid)} />
        </div>

        {/* 장소 (지도 검색으로 추가·변경) */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={label}>장소</div>
            {canEdit && task.placeName && (
              <div onClick={() => setPlaceOpen((v) => !v)} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', cursor: 'pointer' }}>{placeOpen ? '닫기' : '변경'}</div>
            )}
          </div>
          {task.placeName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#F6F8FA', border: '1px solid #EAECEF', borderRadius: 13, padding: '12px 14px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.placeName}</div>
              {task.placeUrl && (
                <div onClick={() => { const u = safeUrl(task.placeUrl); if (u) window.open(u, '_blank', 'noopener') }} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '7px 12px', borderRadius: 20, cursor: 'pointer', flexShrink: 0 }}>지도</div>
              )}
            </div>
          ) : canEdit ? (
            <div onClick={() => setPlaceOpen(true)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F8FA', border: '1px dashed #D6D9DE', borderRadius: 13, padding: '12px 14px', cursor: 'pointer', color: '#8B8579' }}>
              <PlusIcon c="#8B8579" w={15} /> <span style={{ fontSize: 14, fontWeight: 700 }}>장소 추가</span>
            </div>
          ) : (
            <div style={{ background: '#F6F8FA', border: '1px solid #EAECEF', borderRadius: 13, padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#B6BCC7' }}>장소 없음</div>
          )}

          {/* 지도 검색 (카카오) */}
          {placeOpen && canEdit && (
            <div style={{ marginTop: 8, background: '#F9FAFB', border: '1px solid #EEF0F4', borderRadius: 13, padding: 12 }}>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A6A296" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
                <input autoFocus value={placeQ} onChange={(e) => setPlaceQ(e.target.value)} placeholder="장소 검색 (예: 스타벅스 강남)" style={{ width: '100%', border: '1px solid #E7EAEF', outline: 'none', background: '#fff', borderRadius: 11, padding: '10px 12px 10px 34px', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }} />
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: placeQ.trim() ? 8 : 0 }}>
                {placeSearching ? (
                  <div style={{ padding: 14, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#B6BCC7' }}>검색 중…</div>
                ) : placeQ.trim() && placeResults.length === 0 ? (
                  <div style={{ padding: 14, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#B6BCC7' }}>결과가 없어요</div>
                ) : (
                  placeResults.map((p, i) => (
                    <div key={i} onClick={() => { patchTask(dateKey, taskId, { placeName: p.name, placeUrl: p.url, lat: p.y, lng: p.x }); setPlaceOpen(false); setPlaceQ(''); setPlaceResults([]) }} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, cursor: 'pointer' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[p.category, p.address].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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

        {/* 공유받은 일정이면 참여자 안내만, 내 소유면 공유 관리 UI */}
        {task.shared ? (
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10, background: '#EAF2F8', border: '1px solid #D7E4EF', borderRadius: 14, padding: '13px 15px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#3F82C2', background: '#fff', padding: '3px 9px', borderRadius: 20 }}>공유</span>
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: '#3B6EA0' }}>다른 사람이 공유한 일정이에요</div>
            <div onClick={() => { void leaveShared(task.id); onClose() }} className="hbtn" style={{ fontSize: 12.5, fontWeight: 800, color: '#8B8579', cursor: 'pointer' }}>나가기</div>
          </div>
        ) : (
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
            {/* 참여자 (초대받은 사람만; 수락/거절은 상대 본인이 알림에서) */}
            {parts.map((p) => {
              const roleKey = p.role.toLowerCase() as ShareRole
              const pending = p.inviteStatus === 'PENDING'
              const rejected = p.inviteStatus === 'REJECTED'
              const dot = pending ? '#E0883A' : rejected ? '#D9614F' : null
              const nick = nameOf(p.memberId)
              return (
                <div key={p.memberId} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderTop: '1px solid #EEF0F4', background: pending ? '#FEFBF6' : rejected ? '#FCF3F1' : '#fff' }}>
                  <div style={{ position: 'relative', flexShrink: 0, opacity: pending || rejected ? 0.8 : 1 }}>
                    <Avatar name={nick} size={34} font={15} />
                    {dot && <span style={{ position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%', background: dot, border: '2px solid #fff' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: pending || rejected ? '#8B8579' : '#17150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: rejected ? 'line-through' : 'none' }}>{nick}</div>
                    {pending && <div style={{ fontSize: 11.5, fontWeight: 800, color: '#C2702A', marginTop: 1 }}>수락 대기 · {ROLE_LABEL[roleKey]}</div>}
                    {rejected && <div style={{ fontSize: 11.5, fontWeight: 800, color: '#C24A3A', marginTop: 1 }}>초대 거절됨</div>}
                  </div>
                  {!pending && !rejected && (
                    <select
                      value={roleKey}
                      onChange={(e) => setRole(p.memberId, e.target.value as ShareRole)}
                      style={{ appearance: 'none', WebkitAppearance: 'none', border: '1px solid #E7EAEF', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, borderRadius: 9, padding: '6px 10px', background: '#fff', color: '#5A554B', flexShrink: 0 }}
                    >
                      <option value="editor">편집</option>
                      <option value="viewer">보기</option>
                    </select>
                  )}
                  <div onClick={() => unshare(p.memberId)} className="hbtn" title={pending ? '초대 취소' : rejected ? '목록에서 제거' : '공유 해제'} style={{ color: '#CAD0DA', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                    <CloseIcon w={14} c="currentColor" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 초대: 역할 먼저 고르고 친구 선택 */}
          {!isServerTodo ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B6BCC7', marginTop: 11, padding: '0 2px' }}>저장된 할 일만 공유할 수 있어요</div>
          ) : addable.length > 0 ? (
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
        )}
      </div>
    </div>
  )
}
