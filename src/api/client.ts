// be(Spring) 게이트웨이 호출용 공통 클라이언트.
// fe는 nlp를 직접 부르지 않고 be만 호출한다. (be가 user_profile/history 채워 nlp 위임)
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}
