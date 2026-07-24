// 백엔드 통신 공통 클라이언트 (axios).
// - be: Spring 게이트웨이 (날씨·장소·유저·약속·할일 등). context-path /api 포함.
// - gateway: 추천 nlp 게이트웨이. be nlp 게이트웨이 생기면 be로 통합 예정.
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// be는 dev에서 Vite 프록시(/api → :8090)를 타서 same-origin. (prod도 같은 도메인 /api 전제)
const BE_BASE = import.meta.env.VITE_BE_BASE ?? '/api'
const GATEWAY_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** 쿠키 값 읽기 (XSRF-TOKEN은 httpOnly=false라 JS 접근 가능 — 프록시로 path=/ 리라이트됨) */
function readCookie(name: string): string | undefined {
  return document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1]
}

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

// CSRF: 비-GET 요청에 XSRF-TOKEN 쿠키값을 X-XSRF-TOKEN 헤더로 실어 보낸다(Spring double-submit).
// axios가 withXSRFToken로 자동 처리하기도 하지만, 확실히 하기 위해 명시적으로도 세팅.
be.interceptors.request.use((cfg) => {
  const method = (cfg.method ?? 'get').toLowerCase()
  if (method !== 'get' && method !== 'head') {
    // 로그인 시 be가 직접 심은 XSRF-TOKEN(path=/api)이 남아있으면, 브라우저가 그걸(경로 더 김) 먼저 보내
    // be가 그 값을 읽어 헤더(path=/ 값)와 불일치 → 403. 매 상태변경 요청 전에 path=/api 변종을 제거해
    // 프록시가 준 path=/ 하나만 남긴다. (부팅 clear만으론 타이밍/stale 번들에서 놓칠 수 있어 이중 방어)
    document.cookie = 'XSRF-TOKEN=; path=/api; max-age=0; SameSite=Lax'
    const token = readCookie('XSRF-TOKEN')
    if (token) cfg.headers['X-XSRF-TOKEN'] = decodeURIComponent(token)
  }
  return cfg
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
    const original = e.config as (InternalAxiosRequestConfig & { _retried?: boolean; _csrfRetried?: boolean }) | undefined
    const url = original?.url ?? ''
    const method = (original?.method ?? 'get').toLowerCase()
    const is401 = e.response?.status === 401
    const reissuable = is401 && original && !original._retried && !url.includes('/auth/reissue')

    // CSRF 403: be가 이 403 응답에서 새 XSRF-TOKEN(path=/)을 심어준다 → 그 토큰으로 1회 재시도.
    // (세션 첫 상태변경 요청이 토큰 없이 나가 403 나는 부트스트랩 문제 해결)
    if (e.response?.status === 403 && original && !original._csrfRetried && method !== 'get' && method !== 'head') {
      original._csrfRetried = true
      return be(original) // 요청 인터셉터가 새로 심긴 XSRF를 읽어 헤더로 실어 재전송
    }

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
