// 알림 (be notification 테이블 대응). 휘발성은 be에서 Redis Pub/Sub+SSE, 영속은 DB.
// be 미구현이라 로컬 persist. TODO(be): GET /notifications + SSE 구독으로 대체.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotiCategory = 'INVITE' | 'TODO'
export type NotiType = 'MEETING_INVITE' | 'SHARE_INVITE' | 'MEETING_CONFIRMED' | 'TODO_REMINDER' | 'TODO_WEATHER_ALERT' | 'TODO_SHARED_UPDATED'

export interface AppNotification {
  id: string
  category: NotiCategory
  type: NotiType
  title: string
  body?: string
  refId?: string | null // 연관 대상(meeting/todo)
  linkToken?: string | null // 초대류면 meeting.share_token
  isRead: boolean
  createdAt: string // ISO
}

// 처음 화면이 비지 않도록 샘플 알림 (be 붙으면 서버 데이터로 대체)
const SEED: AppNotification[] = [
  { id: 'nt1', category: 'TODO', type: 'TODO_WEATHER_ALERT', title: '오후에 비 소식이 있어요', body: '야외 일정은 오전으로 옮기는 게 좋아요', isRead: false, createdAt: '2026-07-23T08:10:00Z' },
  { id: 'nt2', category: 'INVITE', type: 'SHARE_INVITE', title: "'도윤'님이 할 일을 공유했어요", body: '배포 준비 · 편집 권한', isRead: false, createdAt: '2026-07-23T07:30:00Z' },
  { id: 'nt3', category: 'TODO', type: 'TODO_REMINDER', title: '오늘 할 일 3개가 남았어요', body: '완료하고 하루를 마무리해보세요', isRead: true, createdAt: '2026-07-22T21:00:00Z' },
]

interface NotiState {
  notifications: AppNotification[]
  add: (n: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotiState>()(
  persist(
    (set) => ({
      notifications: SEED,
      add: (n) =>
        set((s) => ({ notifications: [{ ...n, id: 'nt' + Date.now(), isRead: false, createdAt: new Date().toISOString() }, ...s.notifications] })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((x) => (x.id === id ? { ...x, isRead: true } : x)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((x) => ({ ...x, isRead: true })) })),
      remove: (id) => set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'haeyaji-notis' },
  ),
)

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
