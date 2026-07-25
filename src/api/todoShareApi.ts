// 할 일 공유 (SHARE-1~8) — be /todos/{id}/share·participants·accept·reject·leave·/todos/shared.
// ⚠️ 소유자(owner)는 todo.member_id로만 판단되고 participants엔 OWNER 행이 없다 → 여기 참여자는 초대받은 사람만.
// ⚠️ be가 참여자 nickname을 안 줌(memberId만) → FE 친구 이름 캐시(useFriendStore.nameOf)로 표시.
// ⚠️ '받은 초대(PENDING)' 목록 엔드포인트가 없음 — accept/reject는 함수만 두고, 대기 초대 노출은 be noti 대기.
import { be } from './client'
import type { TodoResponse } from './todoApi'

interface Env<T> { data: T }

export type ParticipantRole = 'OWNER' | 'EDITOR' | 'VIEWER'
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface TodoParticipant {
  memberId: string
  role: ParticipantRole
  inviteStatus: InviteStatus
  createdAt: string
}

/** SHARE-1 여러 명 한번에 초대 (owner). role은 EDITOR|VIEWER만 허용(be가 OWNER 거부). */
export async function shareTodo(todoId: string, members: { memberId: string; role: Exclude<ParticipantRole, 'OWNER'> }[]): Promise<TodoParticipant[]> {
  const res = await be.post<Env<TodoParticipant[]>>(`/todos/${todoId}/share`, { members })
  return res.data.data ?? []
}

/** SHARE-3 참여자 목록 (owner 또는 ACCEPTED 참여자). */
export async function listParticipants(todoId: string): Promise<TodoParticipant[]> {
  const res = await be.get<Env<TodoParticipant[]>>(`/todos/${todoId}/participants`)
  return res.data.data ?? []
}

/** SHARE-4 역할 변경 (owner). */
export async function changeParticipantRole(todoId: string, memberId: string, role: Exclude<ParticipantRole, 'OWNER'>): Promise<TodoParticipant> {
  const res = await be.patch<Env<TodoParticipant>>(`/todos/${todoId}/participants/${memberId}`, { role })
  return res.data.data
}

/** SHARE-5 참여자 내보내기 (owner). */
export async function removeParticipant(todoId: string, memberId: string): Promise<void> {
  await be.delete(`/todos/${todoId}/participants/${memberId}`)
}

/** SHARE-6 공유 나가기 (참여자 본인). */
export async function leaveTodo(todoId: string): Promise<void> {
  await be.post(`/todos/${todoId}/leave`, {})
}

/** 초대 수락/거절 (초대받은 본인). ⚠️ 대기 초대 조회 엔드포인트 부재 — todoId를 알 때만 호출 가능. */
export async function acceptTodoInvite(todoId: string): Promise<TodoParticipant> {
  const res = await be.post<Env<TodoParticipant>>(`/todos/${todoId}/accept`, {})
  return res.data.data
}
export async function rejectTodoInvite(todoId: string): Promise<TodoParticipant> {
  const res = await be.post<Env<TodoParticipant>>(`/todos/${todoId}/reject`, {})
  return res.data.data
}

/** SHARE-8 나에게 공유된(ACCEPTED) 할 일 목록. */
export async function listSharedTodos(): Promise<TodoResponse[]> {
  const res = await be.get<Env<TodoResponse[]>>('/todos/shared')
  return res.data.data ?? []
}
