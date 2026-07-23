// be OAuth2 인증 연동 (HttpOnly 쿠키 방식).
// 흐름: 로그인 버튼 → be authorization URL로 브라우저 이동 → be가 쿠키 세팅 후 /oauth/callback 리다이렉트
//       → 앱 부팅 시 GET /me 로 세션 확인.
import { be } from './client'

export type Provider = 'kakao' | 'naver' | 'google'

// VITE_BE_BASE는 context-path(/api) 포함. oauth2 authorization도 /api 아래에 있음.
const BE_BASE = import.meta.env.VITE_BE_BASE ?? 'http://localhost:8090/api'

/** 소셜 로그인 시작 URL — axios가 아니라 window.location으로 풀 이동해야 한다. */
export function oauthLoginUrl(provider: Provider): string {
  return `${BE_BASE}/oauth2/authorization/${provider}`
}

export interface Me {
  memberId: string
  role: unknown // be는 authorities 배열로 반환. 현재는 사용처 없음.
  nickname?: string // be가 /me에 nickname 넣어주면 표시에 사용(현재 미제공 → FE 로컬 닉네임 폴백)
  email?: string
}

/** 현재 세션 확인. accessToken 쿠키 없거나 만료면 401(→ client 인터셉터가 reissue 시도). */
export async function fetchMe(): Promise<Me> {
  const { data } = await be.get<Me>('/me')
  return data
}

/** 로그아웃 — refresh 삭제 + 쿠키 만료. 실패해도 클라 상태는 정리한다(best-effort). */
export async function logoutApi(): Promise<void> {
  await be.post('/auth/logout')
}
