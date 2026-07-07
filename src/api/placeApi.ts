// be의 카카오 로컬 프록시 (#9). 카카오 REST 키는 be가 보유하므로
// fe는 장소 검색을 직접 부르지 않고 be(/places/search)만 호출한다.
// GET {VITE_BE_BASE}/places/search?query&lat&lng&radiusM&size → { places: [...] }

export interface PlaceRaw {
  name: string
  category: string // 카카오 category_group_name (없으면 전체 분류 경로 폴백)
  address: string
  url: string | null
  distanceM: number | null // lat/lng 기준 거리(m)
  x: number // 경도
  y: number // 위도
}

const BE_BASE = import.meta.env.VITE_BE_BASE ?? 'http://localhost:8090/api'

export async function searchPlaces(query: string, lat: number, lng: number, radiusM: number, size = 15): Promise<PlaceRaw[]> {
  const qs = new URLSearchParams({
    query,
    lat: String(lat),
    lng: String(lng),
    radiusM: String(Math.round(radiusM)),
    size: String(size),
  })
  const res = await fetch(`${BE_BASE}/places/search?${qs}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = (await res.json()) as { places?: PlaceRaw[] }
  return data.places ?? []
}
