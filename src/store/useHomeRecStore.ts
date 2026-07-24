// 메인 대시보드 "추천 장소" 타일 — 개인화 추천(be /message) + 실제 장소 검색(be /places/search).
// 하드코딩(recsFor + mockData.PLACES) 대체. 부팅/위치·날씨 확정 시 1회만 호출(캐시 key로 중복 차단).
//   1) /message (text+weather+mood, 카테고리 없음) → 개인화 top 카테고리 + keywords (WeightService 반영)
//   2) /places/search(keyword, lat, lng, radius) → 실제 주변 장소 → 상위 1건을 타일에 표시
import { create } from 'zustand'
import { sendMessage } from '@/api/recommendApi'
import { searchPlaces } from '@/api/placeApi'
import { REC_CATEGORY_ICON, REC_CATEGORY_LABEL, REC_CATEGORY_KEYWORD } from '@/features/recommend/recCategories'
import { usePrefStore } from './usePrefStore'
import type { PlaceCat, RecCategory } from '@/types'

const RADIUS_M = 2000 // 도보권 2km (useChatStore DEFAULT_RADIUS_M와 동일)
const DOW_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export interface HomeRec {
  code: RecCategory
  catLabel: string // 개인화 카테고리 라벨 (예: 카페·디저트)
  cat: PlaceCat // 타일 그라디언트/아이콘용 4종
  name: string // 실제 장소명
  typeLabel: string // 카카오 분류(없으면 카테고리 라벨)
  dist: string // 거리 문자열 ("1.2km" / "320m" / '')
  placeUrl: string | null
}

interface HomeRecState {
  rec: HomeRec | null
  loading: boolean
  key: string | null // 위치+날씨 캐시 키(중복 호출 차단)
  load: (lat: number, lng: number, weather: string) => Promise<void>
}

function distLabel(m: number | null): string {
  if (m == null) return ''
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
}

function timeContext(): { timeOfDay: string; weekday: string } {
  const now = new Date()
  const h = now.getHours()
  const timeOfDay = h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`
  return { timeOfDay, weekday: DOW_KO[now.getDay()] }
}

export const useHomeRecStore = create<HomeRecState>((set, get) => ({
  rec: null,
  loading: false,
  key: null,

  load: async (lat, lng, weather) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}|${weather}`
    if (get().loading || get().key === key) return // 같은 위치·날씨면 재호출 안 함
    set({ loading: true, key })
    try {
      const mood = usePrefStore.getState().vibe ?? undefined
      // 1단계: 개인화 카테고리 (selectedCategory 없이 호출 → categories[] 후보)
      const res = await sendMessage({ text: `${weather ? weather + ' ' : ''}날씨에 어울리는 근처 장소 추천해줘`, lat, lng, weather, mood, ...timeContext() })
      const topCat = res.categories[0]
      if (!topCat) { set({ loading: false }); return } // 후보 없으면 유지(폴백은 UI에서)
      const code = topCat.code
      const keyword = topCat.keywords?.[0] ?? REC_CATEGORY_KEYWORD[code] ?? REC_CATEGORY_LABEL[code]
      // 2단계: 실제 장소 검색 (카카오 로컬 프록시)
      const places = await searchPlaces(keyword, lat, lng, RADIUS_M, 5)
      const p = places[0]
      if (!p) { set({ loading: false }); return }
      set({
        loading: false,
        rec: {
          code,
          catLabel: REC_CATEGORY_LABEL[code] ?? code,
          cat: REC_CATEGORY_ICON[code] ?? 'cafe',
          name: p.name,
          typeLabel: p.category || REC_CATEGORY_LABEL[code] || '',
          dist: distLabel(p.distanceM),
          placeUrl: p.url,
        },
      })
    } catch {
      set({ loading: false, key: null }) // 실패 시 키 해제 → 다음 시도 허용
    }
  },
}))
