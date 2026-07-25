// 약속(meeting) — be /meetings 슬롯·share-token 모델 연동. (구 친구+시간칸 mock 폐기)
// 흐름: create(→shareToken) → 링크 공유 → join → 가용 제출(slotId+FREE/BUSY) → heatmap/best-times → confirm.
import { create } from 'zustand'
import { useAppStore } from './useAppStore'
import {
  listMeetings, createMeeting, getMeeting, confirmMeeting, joinMeeting, inviteMembers,
  submitAvailability, getHeatmap, getBestTimes, getMeetingStatus,
  type MeetingSummary, type MeetingDetail, type Heatmap, type BestTimes, type MeetingStatusInfo,
  type SlotResponseItem, type CreateMeetingInput,
} from '@/api/meetingApi'

const myMemberId = (): string | null => localStorage.getItem('haeyaji-account')
const toast = (m: string) => useAppStore.getState().toast(m)
const errMsg = (e: unknown) => (e as Error)?.message || '요청에 실패했어요'

interface MeetupState {
  meetings: MeetingSummary[]
  detail: MeetingDetail | null
  heatmap: Heatmap | null
  bestTimes: BestTimes | null
  status: MeetingStatusInfo | null
  myResponses: SlotResponseItem[] // 현재 회원의 슬롯 응답(가용 그리드 초기값)
  loading: boolean
  loadList: () => Promise<void>
  create: (input: CreateMeetingInput) => Promise<MeetingDetail | null>
  loadDetail: (shareToken: string) => Promise<void>
  join: (shareToken: string) => Promise<boolean>
  invite: (shareToken: string, memberIds: string[]) => Promise<void>
  submit: (shareToken: string, responses: SlotResponseItem[]) => Promise<void>
  confirm: (shareToken: string, startAt: string, endAt: string) => Promise<void>
  clearDetail: () => void
}

export const useMeetupStore = create<MeetupState>((set, get) => ({
  meetings: [],
  detail: null,
  heatmap: null,
  bestTimes: null,
  status: null,
  myResponses: [],
  loading: false,

  loadList: async () => {
    try {
      set({ meetings: await listMeetings() })
    } catch { /* be 미가동 무시 */ }
  },

  create: async (input) => {
    try {
      const d = await createMeeting(input)
      set((s) => ({ meetings: [toSummary(d), ...s.meetings] }))
      return d
    } catch (e) {
      toast(errMsg(e))
      return null
    }
  },

  loadDetail: async (shareToken) => {
    set({ loading: true })
    try {
      const [detail, heatmap, bestTimes, status] = await Promise.all([
        getMeeting(shareToken), getHeatmap(shareToken).catch(() => null), getBestTimes(shareToken).catch(() => null), getMeetingStatus(shareToken).catch(() => null),
      ])
      const mine = status?.participants.find((p) => p.memberId === myMemberId())
      set({ detail, heatmap, bestTimes, status, myResponses: mine?.responses ?? [], loading: false })
    } catch (e) {
      set({ loading: false })
      toast(errMsg(e))
    }
  },

  join: async (shareToken) => {
    try {
      await joinMeeting(shareToken)
      await get().loadDetail(shareToken)
      return true
    } catch (e) {
      toast(errMsg(e))
      return false
    }
  },

  invite: async (shareToken, memberIds) => {
    if (memberIds.length === 0) return
    try {
      const r = await inviteMembers(shareToken, memberIds)
      await get().loadDetail(shareToken)
      const skipped = r.skippedMemberIds.length
      toast(`${r.invitedMemberIds.length}명 초대했어요${skipped ? ` (이미 참여 ${skipped}명 제외)` : ''}`)
    } catch (e) {
      toast(errMsg(e))
    }
  },

  submit: async (shareToken, responses) => {
    try {
      await submitAvailability(shareToken, responses)
      set({ myResponses: responses })
      // 히트맵/상태 갱신
      const [heatmap, status] = await Promise.all([getHeatmap(shareToken).catch(() => get().heatmap), getMeetingStatus(shareToken).catch(() => get().status)])
      set({ heatmap, status })
      toast('가능한 시간을 저장했어요')
    } catch (e) {
      toast(errMsg(e))
    }
  },

  confirm: async (shareToken, startAt, endAt) => {
    try {
      const detail = await confirmMeeting(shareToken, startAt, endAt)
      set((s) => ({ detail, meetings: s.meetings.map((m) => (m.shareToken === shareToken ? toSummary(detail) : m)) }))
      toast('약속을 확정했어요')
    } catch (e) {
      toast(errMsg(e))
    }
  },

  clearDetail: () => set({ detail: null, heatmap: null, bestTimes: null, status: null, myResponses: [] }),
}))

const toSummary = (d: MeetingDetail): MeetingSummary => ({
  id: d.id, title: d.title, type: d.type, status: d.status, shareToken: d.shareToken,
  participantCount: d.participants.length, deadline: d.deadline,
  confirmedStartAt: d.confirmedStartAt, confirmedEndAt: d.confirmedEndAt, createdAt: d.createdAt,
})
