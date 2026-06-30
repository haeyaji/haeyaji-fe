// be의 추천 게이트웨이. 현재는 stub — UI는 lib/weather + store 로직으로 동작하고,
// be 연동 시 이 함수가 실제 MessageResponse를 반환하도록 교체한다.
import type { MessageResponse } from '@/types'
import { http } from './client'

export interface RecommendRequest {
  text: string
  lat: number
  lng: number
  weather?: string
  mood?: string
}

export function sendMessage(body: RecommendRequest): Promise<MessageResponse> {
  return http<MessageResponse>('/recommend/message', { method: 'POST', body: JSON.stringify(body) })
}
