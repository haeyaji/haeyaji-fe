import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import { dayMeta, recsFor } from '@/lib/weather'
import { useAppStore } from './useAppStore'

type QType = 'general' | 'indoor' | 'cafe' | 'walk' | 'food'

interface ChatState {
  chat: ChatMessage[]
  input: string
  setInput: (v: string) => void
  handleQuick: (qtype: QType, label: string) => void
  send: () => void
}

const REC_RE = /추천|어디|뭐|할|갈|놀|산책|걷|카페|커피|맛집|밥|점심|저녁|먹|실내|비|날씨|코스|구경|나들이|볼|가볼/

function pushBot(set: (fn: (s: ChatState) => Partial<ChatState>) => void, text: string, places?: string[]) {
  setTimeout(() => set((s) => ({ chat: [...s.chat, { role: 'assistant', text, places }] })), 260)
}

function respond(set: (fn: (s: ChatState) => Partial<ChatState>) => void, qtype: QType) {
  const cond = dayMeta(useAppStore.getState().selId).cond
  const recs = recsFor(cond).map((r) => r.id)
  let ids: string[]
  let lead: string
  if (qtype === 'indoor') {
    ids = ['p4', 'p3']
    lead = '실내 위주로 골라봤어요. 이런 곳 어떠세요?'
  } else if (qtype === 'cafe') {
    ids = ['p1', 'p3']
    lead = '집중하기 좋은 카페로 추천해요.'
  } else if (qtype === 'walk') {
    ids = cond === 'rainy' ? ['p4', 'p3'] : ['p2', 'p1']
    lead = cond === 'rainy' ? '비 소식이 있어 걷기보단 실내가 좋아요.' : '걷기 좋은 코스예요. 날씨도 괜찮아요.'
  } else if (qtype === 'food') {
    ids = ['p3', 'p1']
    lead = '근처에서 먹고 둘러보기 좋은 곳이에요.'
  } else {
    ids = recs.slice(0, 3)
    lead = cond === 'rainy' ? '비 예보가 있어 실내 위주로 추천했어요.' : cond === 'cloudy' ? '구름 많은 날 무난하게 즐길 곳이에요.' : '맑은 날이라 야외 위주로 추천했어요.'
  }
  pushBot(set, lead, ids)
}

export const useChatStore = create<ChatState>((set, get) => ({
  chat: [{ role: 'assistant', text: '안녕하세요! 선택한 날짜의 날씨와 위치를 기준으로 갈 만한 곳을 추천해드려요. 무엇을 찾으세요?' }],
  input: '',
  setInput: (input) => set({ input }),
  handleQuick: (qtype, label) => {
    set((s) => ({ chat: [...s.chat, { role: 'user', text: label }] }))
    respond(set, qtype)
  },
  send: () => {
    const t = get().input.trim()
    if (!t) return
    set((s) => ({ chat: [...s.chat, { role: 'user', text: t }], input: '' }))
    if (!REC_RE.test(t)) {
      pushBot(set, '저는 날씨·위치 기반 장소 추천만 도와드려요. 예를 들어 "맑은데 갈 만한 곳 추천해줘"처럼 물어보세요.')
      return
    }
    let q: QType = 'general'
    if (/비|실내|우천/.test(t)) q = 'indoor'
    else if (/카페|커피/.test(t)) q = 'cafe'
    else if (/산책|걷|코스/.test(t)) q = 'walk'
    else if (/맛집|밥|먹/.test(t)) q = 'food'
    respond(set, q)
  },
}))
