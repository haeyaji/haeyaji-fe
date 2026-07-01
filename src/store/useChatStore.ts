import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import { sendMessage } from '@/api/recommendApi'

/** 추천 요청에 실을 맥락 (위치 필수, 날씨는 힌트) */
export interface SendCtx {
  lat: number
  lng: number
  weather?: string
}

interface ChatState {
  chat: ChatMessage[]
  input: string
  loading: boolean
  setInput: (v: string) => void
  send: (ctx: SendCtx) => Promise<void>
  ask: (text: string, ctx: SendCtx) => Promise<void>
}

type SetFn = (partial: (s: ChatState) => Partial<ChatState>) => void

async function run(set: SetFn, text: string, ctx: SendCtx) {
  set((s) => ({ chat: [...s.chat, { role: 'user', text }], loading: true }))
  try {
    const res = await sendMessage({ text, lat: ctx.lat, lng: ctx.lng, weather: ctx.weather })
    set((s) => ({ chat: [...s.chat, { role: 'assistant', text: res.reply, todos: res.todos }], loading: false }))
  } catch {
    set((s) => ({
      chat: [...s.chat, { role: 'assistant', text: '추천 서버에 연결하지 못했어요. nlp 서버(:8000)가 켜져 있는지 확인해주세요.' }],
      loading: false,
    }))
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  chat: [{ role: 'assistant', text: '안녕하세요! 선택한 날짜의 날씨와 위치를 기준으로 갈 만한 곳을 추천해드려요. 무엇을 찾으세요?' }],
  input: '',
  loading: false,
  setInput: (input) => set({ input }),
  send: async (ctx) => {
    const t = get().input.trim()
    if (!t || get().loading) return
    set({ input: '' })
    await run(set, t, ctx)
  },
  ask: async (text, ctx) => {
    if (get().loading) return
    await run(set, text, ctx)
  },
}))
