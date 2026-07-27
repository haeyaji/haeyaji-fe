// be의 카카오 로컬 프록시 (#9). 카카오 REST 키는 be가 보유하므로
// fe는 장소 검색을 직접 부르지 않고 be(/places/search)만 호출한다.
// GET {VITE_BE_BASE}/places/search?query&lat&lng&radiusM&size → { places: [...] }
import { be } from './client'

export interface PlaceRaw {
  name: string
  category: string // 카카오 category_group_name (없으면 전체 분류 경로 폴백)
  address: string
  url: string | null
  distanceM: number | null // lat/lng 기준 거리(m)
  x: number // 경도
  y: number // 위도
}

export async function searchPlaces(query: string, lat: number, lng: number, radiusM: number, size = 15): Promise<PlaceRaw[]> {
  const res = await be.get<{ places?: PlaceRaw[] }>('/places/search', {
    params: { query, lat, lng, radiusM: Math.round(radiusM), size },
  })
  return res.data.places ?? []
}

/** 주소/지명 → 좌표 (be 카카오 지오코딩). 못 찾으면 null. */
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await be.get<{ lat: number; lng: number }>('/places/geocode', { params: { query: query.trim() } })
    return res.data
  } catch {
    return null
  }
}
