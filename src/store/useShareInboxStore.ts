// 공유 초대함 — 받은 PENDING 초대(수락/거절) + 공유받은 ACCEPTED 일정(나가기).
// be #59: GET /todos/invitations(대기) + GET /todos/shared(수락됨) + accept/reject/leave.
import { create } from 'zustand'
import { listPendingInvitations, listSharedTodos, acceptTodoInvite, rejectTodoInvite, leaveTodo } from '@/api/todoShareApi'
import type { TodoResponse } from '@/api/todoApi'
import { useAppStore } from './useAppStore'
import { useTodoStore } from './useTodoStore'

const toast = (m: string) => useAppStore.getState().toast(m)

interface ShareInboxState {
  pending: TodoResponse[] // 받은 대기 초대
  shared: TodoResponse[] // 수락한 공유 일정
  loading: boolean
  load: () => Promise<void>
  accept: (todoId: string) => Promise<void>
  reject: (todoId: string) => Promise<void>
  leave: (todoId: string) => Promise<void>
}

export const useShareInboxStore = create<ShareInboxState>((set, get) => ({
  pending: [],
  shared: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [pending, shared] = await Promise.all([listPendingInvitations(), listSharedTodos()])
      set({ pending, shared, loading: false })
    } catch {
      set({ loading: false }) // be 미가동/미배포 무시
    }
  },

  accept: async (todoId) => {
    try {
      await acceptTodoInvite(todoId)
      await get().load()
      // 수락한 일정이 해당 날짜 목록/캘린더에 바로 보이도록 그 날짜 재로드
      const t = get().shared.find((s) => s.id === todoId)
      if (t?.date) void useTodoStore.getState().loadDate(t.date)
      toast('공유 일정을 수락했어요')
    } catch (e) { toast((e as Error)?.message || '수락에 실패했어요') }
  },
  reject: async (todoId) => {
    try { await rejectTodoInvite(todoId); await get().load() } catch (e) { toast((e as Error)?.message || '거절에 실패했어요') }
  },
  leave: async (todoId) => {
    try {
      const t = get().shared.find((s) => s.id === todoId)
      await leaveTodo(todoId)
      await get().load()
      if (t?.date) void useTodoStore.getState().loadDate(t.date)
      toast('공유에서 나갔어요')
    } catch (e) { toast((e as Error)?.message || '나가기에 실패했어요') }
  },
}))
