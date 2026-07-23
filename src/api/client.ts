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

// ── 인증 토큰 (JWT) ─────────────────────────────────────────────
// be OAuth 로그인 후 받은 access(+refresh)를 localStorage에 보관하고 be/gateway 요청에 Bearer로 실는다.
// TODO(be): 토큰 전달 방식(응답 바디 vs 쿠키)·refresh 엔드포인트를 be(김현우)와 확정 후 refresh 재발급 배선.
const TOKEN_KEY = 'haeyaji-auth'
interface AuthTokens { access: string; refresh?: string }
let authTokens: AuthTokens | null = (() => {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null') } catch { return null }
})()

/** OAuth 콜백/로그인에서 토큰 저장(null이면 로그아웃). */
export function setAuthTokens(t: AuthTokens | null) {
  authTokens = t
  if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
  else localStorage.removeItem(TOKEN_KEY)
}
export const getAccessToken = () => authTokens?.access ?? null
export const hasAuthToken = () => !!authTokens?.access

// 요청 인터셉터: 토큰 있으면 Authorization: Bearer 주입
for (const inst of [be, gateway]) {
  inst.interceptors.request.use((config) => {
    if (authTokens?.access) config.headers.Authorization = `Bearer ${authTokens.access}`
    return config
  })
}

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
  inst.interceptors.response.use(
    (r) => r,
    (err) => {
      // 401 = 토큰 만료/무효 → 인증 해제. (TODO(be): refresh로 재발급 후 원요청 재시도)
      if ((err as AxiosError)?.response?.status === 401) setAuthTokens(null)
      return Promise.reject(toAppError(err))
    },
  )
}
