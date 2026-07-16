// 친구 관계 — persist(localStorage). be 붙으면 서버 관계로 대체.
// TODO(be): GET /users?nickname= (검색) / POST·DELETE /friends/{id} (관계)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_USERS } from '@/lib/mockData'
import type { AppUser } from '@/types'

interface FriendState {
  friendIds: string[]
  addFriend: (id: string) => void
  removeFriend: (id: string) => void
  isFriend: (id: string) => boolean
}

export const useFriendStore = create<FriendState>()(
  persist(
    (set, get) => ({
      friendIds: [], // TODO(be): GET /friends 로 채움 (현재는 빈 상태로 시작)
      addFriend: (id) => set((s) => (s.friendIds.includes(id) ? s : { friendIds: [...s.friendIds, id] })),
      removeFriend: (id) => set((s) => ({ friendIds: s.friendIds.filter((x) => x !== id) })),
      isFriend: (id) => get().friendIds.includes(id),
    }),
    { name: 'haeyaji-friends' },
  ),
)

// 닉네임 부분일치 검색 (be 검색 API 대응)
export function searchUsers(query: string): AppUser[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return MOCK_USERS.filter((u) => u.nickname.toLowerCase().includes(q))
}

export const userById = (id: string): AppUser | undefined => MOCK_USERS.find((u) => u.id === id)
