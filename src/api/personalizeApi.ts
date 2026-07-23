// 개인화 신호 be 전송 (be 담당 요청서: docs/fe-personalization-signal-request.md).
// be 엔드포인트는 아직 미구현 — 계약(형태)만 확정. 실제 착지 전까지 호출은 fire-and-forget로
// 감싸 쓴다(signalOr Ignore). be `/api` 베이스라 경로는 /preferences, /recommend/feedback.
import type { Category } from '@/types'
import { be } from './client'

/** 구멍1 — 설문 4축 저장. 값은 온보딩 선택지 문자열 그대로(변환 X). */
export interface PreferencePayload {
  preferredCategories: Category[]
  avoid: string[]
  vibe: string | null
  intensity: string | null
}

export async function savePreferences(payload: PreferencePayload): Promise<void> {
  await be.post('/preferences', payload)
}

/** 구멍2 — 추천 카드 피드백. category는 그 카드의 RecommendedTodo.category.
 *  IGNORED=무시(부정), SELECTED='일정에 추가'(긍정) → be가 개인화 가중치에 반영. */
export type FeedbackSignal = 'IGNORED' | 'SELECTED'

export async function sendRecommendFeedback(category: Category, signal: FeedbackSignal): Promise<void> {
  await be.post('/recommend/feedback', { category, signal })
}

/**
 * be 미구현 구간용 안전 래퍼 — 신호 전송이 실패해도 UI를 막지 않는다.
 * (be 착지 후에도 개인화 신호는 best-effort라 실패를 조용히 삼키는 게 맞다)
 */
export function fireSignal(p: Promise<unknown>): void {
  p.catch(() => {
    /* be 미구현/오프라인 — 신호는 유실 허용 */
  })
}
