// 백엔드 통신 공통 클라이언트 (axios).
// - be: Spring 게이트웨이 (날씨·장소 프록시·추후 유저/약속 등). context-path /api 포함.
// - gateway: 추천 nlp 게이트웨이. be nlp 게이트웨이 생기면 be로 통합 예정.
import axios, { AxiosError } from 'axios'

const BE_BASE = import.meta.env.VITE_BE_BASE ?? 'http://localhost:8090/api'
const GATEWAY_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** be(Spring) — 날씨·장소·유저·약속 등 */
export const be = axios.create({
  baseURL: BE_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

/** 추천 게이트웨이(nlp 위임) */
export const gateway = axios.create({
  baseURL: GATEWAY_BASE,
  timeout: 20_000, // LLM 추론이라 여유 있게
  headers: { 'Content-Type': 'application/json' },
})

// 에러 메시지 정규화 (호출부에서 err.message로 일관 처리)
function toAppError(err: unknown): Error {
  const e = err as AxiosError<{ message?: string }>
  if (e?.isAxiosError) {
    const status = e.response?.status
    const serverMsg = e.response?.data?.message
    if (e.code === 'ECONNABORTED') return new Error('요청 시간이 초과됐어요')
    if (!e.response) return new Error('서버에 연결하지 못했어요')
    return new Error(serverMsg ?? `요청 실패 (${status})`)
  }
  return err instanceof Error ? err : new Error('알 수 없는 오류')
}
for (const inst of [be, gateway]) {
  inst.interceptors.response.use((r) => r, (err) => Promise.reject(toAppError(err)))
}
