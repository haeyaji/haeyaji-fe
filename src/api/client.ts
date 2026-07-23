// 백엔드 통신 공통 클라이언트 (axios).
// - be: Spring 게이트웨이 (날씨·장소·유저·약속·할일 등). context-path /api 포함.
// - gateway: 추천 nlp 게이트웨이. be nlp 게이트웨이 생기면 be로 통합 예정.
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BE_BASE = import.meta.env.VITE_BE_BASE ?? 'http://localhost:8090/api'
const GATEWAY_BASE = import.meta.env.VITE_API_BASE ?? '/api'

// be 인증 = HttpOnly 쿠키(accessToken/refreshToken) 방식.
// - 토큰은 JS가 읽을 수 없으므로 withCredentials로 브라우저가 자동 전송한다.
// - 상태변경(POST/PUT/PATCH/DELETE)은 Spring CSRF가 XSRF-TOKEN 쿠키를 X-XSRF-TOKEN 헤더로 되돌려받길 요구.
//   axios가 쿠키를 읽어 헤더로 실어주도록 xsrf* 옵션을 지정(교차 오리진이라 withXSRFToken도 필요).
/** be(Spring) — 날씨·장소·유저·약속·할일 등 */
export const be = axios.create({
  baseURL: BE_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
})

/** 추천 게이트웨이(nlp 위임) — 인증 불필요 */
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

// ── access 만료(401) 자동 재발급 ────────────────────────────────
// be는 access(짧음)+refresh 구조. 보호 요청이 401이면 refresh 쿠키로 /auth/reissue를 1회 시도해
// 새 쿠키를 받은 뒤 원요청을 재시도한다. reissue까지 실패하면 세션 만료로 보고 앱에 알린다.
let reissuing: Promise<unknown> | null = null

be.interceptors.response.use(
  (r) => r,
  async (err) => {
    const e = err as AxiosError
    const original = e.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    const url = original?.url ?? ''
    const is401 = e.response?.status === 401
    const reissuable = is401 && original && !original._retried && !url.includes('/auth/reissue')

    if (reissuable) {
      original._retried = true
      try {
        // 동시에 여러 요청이 401이어도 재발급은 1번만 (나머지는 같은 프라미스를 기다림)
        reissuing = reissuing ?? be.post('/auth/reissue').finally(() => { reissuing = null })
        await reissuing
        return be(original) // 새 쿠키로 원요청 재시도
      } catch {
        // refresh도 만료/무효 → 세션 종료. 앱이 로그인 화면으로 되돌리도록 알림(순환 import 회피용 이벤트).
        window.dispatchEvent(new Event('haeyaji:auth-expired'))
      }
    }
    return Promise.reject(toAppError(err))
  },
)

gateway.interceptors.response.use((r) => r, (err) => Promise.reject(toAppError(err)))
