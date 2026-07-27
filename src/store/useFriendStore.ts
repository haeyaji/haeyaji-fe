// 친구 관계 — be /friends + /members/search 연동.
// ⚠️ be가 상대 닉네임을 안 줘서(memberId만) 검색으로 배운 이름을 로컬 캐시(names)로 보관.
//    검색으로 추가한 친구는 이름이 뜨고, 상대가 먼저 요청한 경우는 '친구'로 폴백(be에 nickname 추가 요청 필요).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { listFriends, listRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, deleteFriend, type MemberLite } from '@/api/friendApi'
import { useAppStore } from './useAppStore'

const toast = (m: string) => useAppStore.getState().toast(m)

export interface FriendItem { rowId: string; memberId: string } // rowId=Friend 행 UUID, memberId=상대

interface FriendState {
  friends: FriendItem[] // ACCEPTED
  incoming: FriendItem[] // 나에게 온 요청(PENDING)
  outgoing: FriendItem[] // 내가 보낸 요청(PENDING)
  names: Record<string, string> // memberId → nickname 캐시
  load: () => Promise<void>
  cacheName: (id: string, nickname: string) => void
  request: (member: MemberLite) => Promise<void>
  accept: (rowId: string, name?: string) => Promise<void>
  reject: (rowId: string) => Promise<void>
  remove: (rowId: string) => Promise<void> // 친구 삭제 / 보낸요청 취소 (같은 DELETE)
  nameOf: (memberId: string) => string
  isFriend: (memberId: string) => boolean
  isOutgoing: (memberId: string) => boolean
}

export const useFriendStore = create<FriendState>()(
  persist(
    (set, get) => {
      return {
        friends: [],
        incoming: [],
        outgoing: [],
        names: {},

        load: async () => {
          try {
            const [fr, inc, out] = await Promise.all([listFriends(), listRequests('received'), listRequests('sent')])
            // be가 counterpartId/Nickname을 직접 줌 → 이름 캐시(names)도 그걸로 채워 nameOf가 실이름 반환
            const names: Record<string, string> = { ...get().names }
            for (const r of [...fr, ...inc, ...out]) if (r.counterpartId) names[r.counterpartId] = r.counterpartNickname
            set({
              names,
              friends: fr.map((r) => ({ rowId: r.id, memberId: r.counterpartId })),
              incoming: inc.map((r) => ({ rowId: r.id, memberId: r.counterpartId })),
              outgoing: out.map((r) => ({ rowId: r.id, memberId: r.counterpartId })),
            })
          } catch {
            /* be 미가동 시 무시 */
          }
        },

        cacheName: (id, nickname) => set((s) => ({ names: { ...s.names, [id]: nickname } })),

        request: async (member) => {
          get().cacheName(member.id, member.nickname)
          try {
            await sendFriendRequest(member.id)
            toast(`${member.nickname}님에게 친구 요청을 보냈어요`)
            await get().load()
          } catch (e) {
            toast((e as Error)?.message || '요청에 실패했어요')
          }
        },

        accept: async (rowId, name) => {
          try {
            await acceptFriendRequest(rowId)
            await get().load()
            toast(name ? `${name}님과 친구가 됐어요` : '친구가 됐어요')
          } catch (e) {
            toast((e as Error)?.message || '수락에 실패했어요')
          }
        },
        reject: async (rowId) => {
          try { await rejectFriendRequest(rowId); await get().load() } catch (e) { toast((e as Error)?.message || '거절에 실패했어요') }
        },
        remove: async (rowId) => {
          try { await deleteFriend(rowId); await get().load() } catch (e) { toast((e as Error)?.message || '삭제에 실패했어요') }
        },

        nameOf: (memberId) => get().names[memberId] || '친구',
        isFriend: (memberId) => get().friends.some((f) => f.memberId === memberId),
        isOutgoing: (memberId) => get().outgoing.some((f) => f.memberId === memberId),
      }
    },
    { name: 'haeyaji-friends', partialize: (s) => ({ names: s.names }) }, // 이름 캐시만 persist
  ),
)

/** 할일 참여자 등 memberId만 아는 곳에서 닉네임 표시용 (이름 캐시 기반, 없으면 '친구'). */
export const userById = (memberId: string): { id: string; nickname: string } | undefined =>
  memberId ? { id: memberId, nickname: useFriendStore.getState().nameOf(memberId) } : undefined
