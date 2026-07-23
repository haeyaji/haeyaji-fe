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
}

/** 세션 확인 + memberId 획득(/me = {memberId, role}). 401이면 client 인터셉터가 reissue 시도. */
export async function fetchMe(): Promise<Me> {
  const { data } = await be.get<Me>('/me')
  return data
}

/** 회원 프로필 (GET /members/me, ApiResponse 언랩). nickname은 미설정 신규회원이면 null. */
export interface MemberProfile {
  nickname: string | null
  email: string | null
  role: unknown
  status: string
  createdAt: string
}
export async function getMemberProfile(): Promise<MemberProfile> {
  const res = await be.get<{ data: MemberProfile }>('/members/me')
  return res.data.data
}

/** 닉네임 설정/변경 (PATCH /members/me/nickname). 2~10자·unique. 중복이면 be가 DUPLICATE_NICKNAME 에러. */
export async function updateNickname(nickname: string): Promise<void> {
  await be.patch('/members/me/nickname', { nickname })
}

/** 로그아웃 — refresh 삭제 + 쿠키 만료. 실패해도 클라 상태는 정리한다(best-effort). */
export async function logoutApi(): Promise<void> {
  await be.post('/auth/logout')
}
