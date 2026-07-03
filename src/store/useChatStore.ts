import { create } from 'zustand'
import type { ChatMessage, ChatTurn } from '@/types'
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
type GetFn = () => ChatState

const DOW_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

// 현재 시각 → nlp 컨텍스트 ("오후 2시", "토요일")
function timeContext(): { timeOfDay: string; weekday: string } {
  const now = new Date()
  const h = now.getHours()
  const timeOfDay = h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`
  return { timeOfDay, weekday: DOW_KO[now.getDay()] }
}

// 최근 대화 → nlp history (현재 입력 이전의 최근 6턴, 인사 제외 없이 그대로)
function buildHistory(chat: ChatMessage[]): ChatTurn[] {
  return chat.slice(-6).map((m) => ({ role: m.role, content: m.text }))
}

async function run(set: SetFn, get: GetFn, text: string, ctx: SendCtx) {
  const history = buildHistory(get().chat) // 이번 입력 이전까지의 맥락
  set((s) => ({ chat: [...s.chat, { role: 'user', text }], loading: true }))
  try {
    const res = await sendMessage({ text, lat: ctx.lat, lng: ctx.lng, weather: ctx.weather, ...timeContext(), history })
    set((s) => ({
      chat: [...s.chat, { role: 'assistant', text: res.reply, todos: res.todos, options: res.options }],
      loading: false,
    }))
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
    await run(set, get, t, ctx)
  },
  ask: async (text, ctx) => {
    if (get().loading) return
    await run(set, get, text, ctx)
  },
}))
