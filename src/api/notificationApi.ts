// 알림 (be-56). 커서 페이지네이션 피드 + 미읽음 수 + 읽음/전체읽음/삭제.
// 전송은 DB 저장만(SSE 없음) → FE는 열 때/주기적으로 fetch. linkToken=이동용 shareToken, refId=대상 엔티티.
import { be } from './client'

export type NotiCategory = 'INVITE' | 'TODO' | 'FRIEND'
export type NotiType =
  | 'MEETING_INVITE' | 'MEETING_INVITE_RESPONSE' | 'MEETING_CONFIRMED' | 'MEETING_REMINDER'
  | 'SHARE_INVITE' | 'SHARE_INVITE_RESPONSE'
  | 'TODO_REMINDER' | 'TODO_WEATHER_ALERT' | 'TODO_SHARED_UPDATED'
  | 'FRIEND_REQUEST' | 'FRIEND_RESPONSE'

export interface NotiItem {
  id: string
  category: NotiCategory
  type: NotiType
  title: string
  body: string | null
  refId: string | null // 대상 엔티티(todoId·meetingId·friendRequestId 등)
  linkToken: string | null // 이동용(약속 shareToken)
  read: boolean
  createdAt: string
  readAt: string | null
}

interface Env<T> { data: T }
interface CursorPage<T> { content: T[]; nextCursor: string | null; hasNext: boolean }

/** 목록 (커서 페이지네이션, type 필터). */
export async function listNotifications(params?: { cursor?: string | null; size?: number; type?: NotiType }): Promise<CursorPage<NotiItem>> {
  const res = await be.get<Env<CursorPage<NotiItem>>>('/notifications', {
    params: { cursor: params?.cursor ?? undefined, size: params?.size ?? 20, type: params?.type },
  })
  return res.data.data ?? { content: [], nextCursor: null, hasNext: false }
}

export async function unreadCount(): Promise<number> {
  const res = await be.get<Env<number>>('/notifications/unread-count')
  return res.data.data ?? 0
}

export async function markNotiRead(id: string): Promise<void> {
  await be.post(`/notifications/${id}/read`, {})
}
export async function markAllNotiRead(): Promise<void> {
  await be.post('/notifications/read-all', {})
}
export async function deleteNoti(id: string): Promise<void> {
  await be.delete(`/notifications/${id}`)
}
