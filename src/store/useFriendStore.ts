// 친구 관계 — persist(localStorage). be 붙으면 서버 관계로 대체.
// be friend 테이블: PENDING/ACCEPTED/REJECTED. 단일 사용자 데모라 수락은 demo 버튼으로 시뮬레이션.
// TODO(be): GET /users?nickname=|code= (검색) / POST /friends(요청) / PATCH accept·reject / DELETE
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_USERS } from '@/lib/mockData'
import type { AppUser } from '@/types'

interface FriendState {
  friendIds: string[] // ACCEPTED 친구 (기존 소비자 호환 유지)
  pending: string[] // 내가 보낸 요청(수락 대기)
  requestFriend: (id: string) => void
  acceptFriend: (id: string) => void // demo: 상대가 수락
  rejectFriend: (id: string) => void // 요청 취소/거절
  removeFriend: (id: string) => void
  isFriend: (id: string) => boolean
  isPending: (id: string) => boolean
}

export const useFriendStore = create<FriendState>()(
  persist(
    (set, get) => ({
      friendIds: [],
      pending: [],
      requestFriend: (id) =>
        set((s) => (s.friendIds.includes(id) || s.pending.includes(id) ? s : { pending: [...s.pending, id] })),
      acceptFriend: (id) =>
        set((s) => ({ pending: s.pending.filter((x) => x !== id), friendIds: s.friendIds.includes(id) ? s.friendIds : [...s.friendIds, id] })),
      rejectFriend: (id) => set((s) => ({ pending: s.pending.filter((x) => x !== id) })),
      removeFriend: (id) => set((s) => ({ friendIds: s.friendIds.filter((x) => x !== id) })),
      isFriend: (id) => get().friendIds.includes(id),
      isPending: (id) => get().pending.includes(id),
    }),
    { name: 'haeyaji-friends' },
  ),
)

// 닉네임 부분일치 또는 friend_code 정확일치 검색 (be 검색 API 대응)
export function searchUsers(query: string): AppUser[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return MOCK_USERS.filter((u) => u.nickname.toLowerCase().includes(q) || u.friendCode.toLowerCase() === q)
}

export const userById = (id: string): AppUser | undefined => MOCK_USERS.find((u) => u.id === id)
