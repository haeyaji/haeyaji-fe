// 받은 공유 초대(PENDING) — 알림 벨에서 수락/거절. (수락한 공유 일정은 useTodoStore가 캘린더/할일에 병합)
// be #59: GET /todos/invitations(대기) + POST /todos/{id}/accept|reject.
import { create } from 'zustand'
import { listPendingInvitations, acceptTodoInvite, rejectTodoInvite } from '@/api/todoShareApi'
import type { TodoResponse } from '@/api/todoApi'
import { useAppStore } from './useAppStore'
import { useTodoStore } from './useTodoStore'

const toast = (m: string) => useAppStore.getState().toast(m)

interface ShareInboxState {
  pending: TodoResponse[] // 받은 대기 초대
  loading: boolean
  load: () => Promise<void>
  accept: (todoId: string) => Promise<void>
  reject: (todoId: string) => Promise<void>
}

export const useShareInboxStore = create<ShareInboxState>((set, get) => ({
  pending: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      set({ pending: await listPendingInvitations(), loading: false })
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
}))
