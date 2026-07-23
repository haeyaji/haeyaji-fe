// DOM/보안 유틸 — innerHTML 삽입·외부 URL 처리 시 방어용.

/** HTML 특수문자 이스케이프. innerHTML 문자열에 외부 값(장소명 등)을 넣기 전 반드시 통과. */
export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 외부 URL을 http/https만 허용. javascript:·data: 등 위험 스킴 차단.
 * 안전하면 그 URL, 아니면 null 반환. window.open/iframe src 전에 사용.
 */
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw, location.origin)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** 추측 불가 토큰 (crypto 기반). be 발급 전 임시 초대 토큰용. */
export function randomToken(bytes = 24): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}
