// 약속 — 독립 엔티티로 persist(localStorage). 친구에 종속되지 않고, 만든 뒤에도
// 참여 친구·가용시간을 계속 추가/수정할 수 있는 구조. be 붙으면 약속 테이블로 대체.
// TODO(be): POST /meetups, PATCH /meetups/{id}/participants 등
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MeetCell = 'free' | 'busy'

export interface Meetup {
  id: string
  title: string
  type: string
  friendIds: string[]
  dates: string[] // 후보 날짜 (YYYY-MM-DD)
  myCells: Record<string, MeetCell> // "date|hour" → 내 가용
  confirmed?: { date: string; startH: number; endH: number } // 확정 시간 범위 (endH 배타)
  shareToken?: string // be meeting.share_token — 초대 URL 토큰(생성 시 발급). 조인 화면은 be 대기
  createdAt: number
}

interface MeetupState {
  meetups: Meetup[]
  create: (m: Omit<Meetup, 'id' | 'createdAt'>) => string
  update: (id: string, patch: Partial<Meetup>) => void
  remove: (id: string) => void
  get: (id: string) => Meetup | undefined
}

export const useMeetupStore = create<MeetupState>()(
  persist(
    (set, get) => ({
      meetups: [],
      create: (m) => {
        const id = 'mt' + Date.now()
        set((s) => ({ meetups: [{ ...m, id, createdAt: Date.now() }, ...s.meetups] }))
        return id
      },
      update: (id, patch) => set((s) => ({ meetups: s.meetups.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: (id) => set((s) => ({ meetups: s.meetups.filter((x) => x.id !== id) })),
      get: (id) => get().meetups.find((x) => x.id === id),
    }),
    { name: 'haeyaji-meetups' },
  ),
)
