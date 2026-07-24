// 추천 게이트웨이. be 완성 전까지는 nlp(:8000/api/message) 직결로 테스트.
// (원래 흐름은 fe→be→nlp. be 붙으면 VITE_API_BASE만 be 주소로 바꾸면 됨)
import type { ChatTurn, MessageResponse, RecCategory, RecCategoryOption, RecommendedTodo } from '@/types'
import { gateway } from './client'

export interface RecommendRequest {
  text: string
  lat: number
  lng: number
  weather?: string
  mood?: string
  timeOfDay?: string // 예: "오후 2시"
  weekday?: string // 예: "토요일"
  history?: ChatTurn[] // 최근 대화 턴 (멀티턴 좁히기 맥락)
  selectedCategory?: RecCategory // 2단계: 1단계에서 고른 카테고리 code (be 계약: selectedCategory)
  radiusM?: number // 추천 장소 검색 반경(m). 미전송 시 서버 기본값
}

// nlp categories[] 정규화 — 문자열("CAFE_DESSERT") 또는 객체({code, label, reason, keywords}) 어느 쪽이어도 안전
function normalizeCategory(c: unknown): RecCategoryOption | null {
  if (typeof c === 'string') return { code: c as RecCategory }
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>
    const code = (o.code ?? o.category) as RecCategory | undefined
    if (!code) return null
    return {
      code,
      label: typeof o.label === 'string' ? o.label : undefined,
      reason: typeof o.reason === 'string' ? o.reason : undefined,
      keywords: Array.isArray(o.keywords) ? (o.keywords as string[]) : undefined,
    }
  }
  return null
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
  const { data: res } = await gateway.post<Record<string, unknown>>('/message', body)
  const todos = Array.isArray(res.todos) ? (res.todos as Record<string, unknown>[]).map(normalizeTodo) : []
  const categories = Array.isArray(res.categories)
    ? (res.categories as unknown[]).map(normalizeCategory).filter((c): c is RecCategoryOption => !!c)
    : []
  return {
    intent: res.intent as MessageResponse['intent'],
    reply: (res.reply as string) ?? '',
    todos,
    options: Array.isArray(res.options) ? (res.options as string[]) : [],
    categories,
  }
}
