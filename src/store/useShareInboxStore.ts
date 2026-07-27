// 받은 초대함 (알림 벨) — 할 일 공유(be-59) + 약속(be-61). 알림 유실 대비 직접 조회 경로.
// todo: GET /todos/invitations → accept/reject. meeting: GET /meetings/invitations → join(수락)/reject.
import { create } from 'zustand'
import { listPendingInvitations, acceptTodoInvite, rejectTodoInvite } from '@/api/todoShareApi'
import { listMeetingInvitations, rejectMeetingInvitation, type MeetingInvitation } from '@/api/meetingApi'
import type { TodoResponse } from '@/api/todoApi'
import { useAppStore } from './useAppStore'
import { useTodoStore } from './useTodoStore'

const toast = (m: string) => useAppStore.getState().toast(m)

interface ShareInboxState {
  pending: TodoResponse[] // 받은 할 일 공유 초대
  meetingInvites: MeetingInvitation[] // 받은 약속 초대
  loading: boolean
  load: () => Promise<void>
  accept: (todoId: string) => Promise<void>
  reject: (todoId: string) => Promise<void>
  rejectMeeting: (shareToken: string) => Promise<void>
}

export const useShareInboxStore = create<ShareInboxState>((set, get) => ({
  pending: [],
  meetingInvites: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [pending, meetingInvites] = await Promise.all([
        listPendingInvitations().catch(() => []),
        listMeetingInvitations().catch(() => []),
      ])
      set({ pending, meetingInvites, loading: false })
    } catch {
      set({ loading: false }) // be 미가동/미배포 무시
    }
  },

  accept: async (todoId) => {
    try {
      await acceptTodoInvite(todoId)
      await get().load()
      await useTodoStore.getState().loadShared() // 수락 → 캘린더/할일 목록에 병합
      toast('공유 일정을 수락했어요')
    } catch (e) { toast((e as Error)?.message || '수락에 실패했어요') }
  },
  reject: async (todoId) => {
    try { await rejectTodoInvite(todoId); await get().load() } catch (e) { toast((e as Error)?.message || '거절에 실패했어요') }
  },
  rejectMeeting: async (shareToken) => {
    try { await rejectMeetingInvitation(shareToken); await get().load() } catch (e) { toast((e as Error)?.message || '거절에 실패했어요') }
  },
}))
