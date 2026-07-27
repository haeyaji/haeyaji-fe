// 알림 (be-56 실 피드). 로컬 샘플 폐기 → GET /notifications + unread-count + read/read-all/delete.
// 전송은 DB 저장만(SSE 없음)이라 열 때/부팅 시 fetch. 낙관적 읽음/삭제 후 서버 반영.
import { create } from 'zustand'
import {
  listNotifications, unreadCount, markNotiRead, markAllNotiRead, deleteNoti,
  type NotiItem, type NotiCategory, type NotiType,
} from '@/api/notificationApi'

export type { NotiItem, NotiCategory, NotiType }

interface NotiState {
  notifications: NotiItem[]
  unread: number
  category: NotiCategory | null // 탭 필터 (null=전체). be category 파라미터로 조회
  nextCursor: string | null
  hasNext: boolean
  loading: boolean
  load: () => Promise<void> // 첫 페이지(현재 category) + 미읽음 수(전체)
  loadMore: () => Promise<void> // 다음 커서
  setCategory: (c: NotiCategory | null) => Promise<void> // 탭 전환 → 재조회
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useNotificationStore = create<NotiState>((set, get) => ({
  notifications: [],
  unread: 0,
  category: null,
  nextCursor: null,
  hasNext: false,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [page, unread] = await Promise.all([listNotifications({ size: 20, category: get().category ?? undefined }), unreadCount().catch(() => 0)])
      set({ notifications: page.content, nextCursor: page.nextCursor, hasNext: page.hasNext, unread, loading: false })
    } catch {
      set({ loading: false }) // be 미가동/미배포 무시
    }
  },

  loadMore: async () => {
    const { hasNext, nextCursor, loading, category } = get()
    if (!hasNext || loading) return
    set({ loading: true })
    try {
      const page = await listNotifications({ cursor: nextCursor, size: 20, category: category ?? undefined })
      set((s) => ({ notifications: [...s.notifications, ...page.content], nextCursor: page.nextCursor, hasNext: page.hasNext, loading: false }))
    } catch {
      set({ loading: false })
    }
  },

  setCategory: async (c) => { set({ category: c }); await get().load() },

  markRead: async (id) => {
    const cur = get().notifications.find((n) => n.id === id)
    if (!cur || cur.read) return
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)), unread: Math.max(0, s.unread - 1) }))
    try { await markNotiRead(id) } catch { /* 롤백 생략(다음 load에서 정정) */ }
  },
  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), unread: 0 }))
    try { await markAllNotiRead() } catch { /* 무시 */ }
  },
  remove: async (id) => {
    const cur = get().notifications.find((n) => n.id === id)
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id), unread: cur && !cur.read ? Math.max(0, s.unread - 1) : s.unread }))
    try { await deleteNoti(id) } catch { /* 무시 */ }
  },
}))

/** 상대 시간 표기 ("방금", "3시간 전", "어제") */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day === 1) return '어제'
  return `${day}일 전`
}
