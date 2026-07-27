// be 친구 API (/friends) + 회원 검색(/members/search). ApiResponse<T> → data.data.
// be가 counterpartId/counterpartNickname(상대 정보)를 직접 준다 → FE는 그걸 그대로 씀.
import { be } from './client'

interface Env<T> { data: T }

export type FriendStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface FriendRow {
  id: string // Friend 행 UUID (요청/친구관계 id — memberId 아님)
  requesterId: string
  receiverId: string
  counterpartId: string // 상대 memberId (be가 나 기준으로 계산해 줌)
  counterpartNickname: string // 상대 닉네임
  status: FriendStatus
  createdAt: string
  acceptedAt: string | null
}

export interface MemberLite { id: string; nickname: string }

/** 닉네임으로 회원 1명 검색. 없으면 null(404). */
export async function searchMember(nickname: string): Promise<MemberLite | null> {
  try {
    const res = await be.get<Env<MemberLite>>(`/members/search/${encodeURIComponent(nickname.trim())}`)
    return res.data.data
  } catch {
    return null
  }
}

export async function listFriends(): Promise<FriendRow[]> {
  const res = await be.get<Env<FriendRow[]>>('/friends')
  return res.data.data ?? []
}

/** 대기 중 요청 — received=나에게 온 것 / sent=내가 보낸 것 */
export async function listRequests(type: 'received' | 'sent'): Promise<FriendRow[]> {
  const res = await be.get<Env<FriendRow[]>>('/friends/requests', { params: { type } })
  return res.data.data ?? []
}

export async function sendFriendRequest(receiverId: string): Promise<FriendRow> {
  const res = await be.post<Env<FriendRow>>('/friends/requests', { receiverId })
  return res.data.data
}

export async function acceptFriendRequest(id: string): Promise<FriendRow> {
  const res = await be.post<Env<FriendRow>>(`/friends/requests/${id}/accept`, {})
  return res.data.data
}

export async function rejectFriendRequest(id: string): Promise<FriendRow> {
  const res = await be.post<Env<FriendRow>>(`/friends/requests/${id}/reject`, {})
  return res.data.data
}

export async function deleteFriend(id: string): Promise<void> {
  await be.delete(`/friends/${id}`)
}
