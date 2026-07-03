// 추천 게이트웨이. be 완성 전까지는 nlp(:8000/api/message) 직결로 테스트.
// (원래 흐름은 fe→be→nlp. be 붙으면 VITE_API_BASE만 be 주소로 바꾸면 됨)
import type { ChatTurn, MessageResponse, RecommendedTodo } from '@/types'
import { http } from './client'

export interface RecommendRequest {
  text: string
  lat: number
  lng: number
  weather?: string
  mood?: string
  timeOfDay?: string // 예: "오후 2시"
  weekday?: string // 예: "토요일"
  history?: ChatTurn[] // 최근 대화 턴 (멀티턴 좁히기 맥락)
}

// nlp 응답이 camelCase(CamelModel) 또는 snake_case 어느 쪽이어도 안전하게 매핑
function normalizeTodo(t: Record<string, unknown>): RecommendedTodo {
  const pick = <T>(camel: string, snake: string): T | undefined => (t[camel] ?? t[snake]) as T | undefined
  return {
    title: (t.title as string) ?? '',
    reason: (t.reason as string) ?? '',
    category: t.category as RecommendedTodo['category'],
    estimatedMinutes: pick<number>('estimatedMinutes', 'estimated_minutes') ?? 0,
    placeName: pick<string>('placeName', 'place_name') ?? null,
    placeUrl: pick<string>('placeUrl', 'place_url') ?? null,
    x: (t.x as number) ?? null,
    y: (t.y as number) ?? null,
    distanceM: pick<number>('distanceM', 'distance_m') ?? null,
  }
}

export async function sendMessage(body: RecommendRequest): Promise<MessageResponse> {
  const res = await http<Record<string, unknown>>('/message', { method: 'POST', body: JSON.stringify(body) })
  const todos = Array.isArray(res.todos) ? (res.todos as Record<string, unknown>[]).map(normalizeTodo) : []
  return {
    intent: res.intent as MessageResponse['intent'],
    reply: (res.reply as string) ?? '',
    todos,
    options: Array.isArray(res.options) ? (res.options as string[]) : [],
  }
}
