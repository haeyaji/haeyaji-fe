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

/** be 저장 설문 조회 (ApiResponse 래핑 → data.data 언랩). 미저장 유저는 빈 목록/null. */
export interface PreferenceData {
  preferredCategories: string[]
  avoid: string[]
  vibe: string | null
  intensity: string | null
}
export async function getPreferences(): Promise<PreferenceData> {
  const res = await be.get<{ data: PreferenceData }>('/preferences')
  return res.data.data
}

/** 구멍2 — 추천 카드 피드백. category는 그 카드의 RecommendedTodo.category 그대로.
 *  SELECTED='일정에 추가'(강한 긍정 +2) / ADD=장소 약한 긍정(+1) / IGNORED=무시(−0.5).
 *  todo.category는 ERD에서 제거됨(label_id 대체) → 긍정 신호는 todo 저장과 분리해 이 엔드포인트로 명시 전송. */
export type FeedbackSignal = 'SELECTED' | 'ADD' | 'IGNORED'

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
