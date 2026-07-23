// 추천 카테고리 선택(choice) 10종 code → 표시 라벨·이모지·지도아이콘·검색키워드.
// (be handoff: docs/handoff-fe-category-choice.md · nlp가 todo.category도 10종 code로 내려줌)
import type { RecCategory, PlaceCat } from '@/types'

export const REC_CATEGORY_LABEL: Record<RecCategory, string> = {
  CAFE_DESSERT: '카페·디저트',
  RESTAURANT: '맛집',
  NATURE_WALK: '산책·자연',
  SPORTS_ACTIVITY: '운동·액티비티',
  CULTURE_EXHIBIT: '문화·전시',
  INDOOR_PLAY: '실내놀이',
  REST_HEALING: '휴식·힐링',
  STUDY_WORK: '공부·작업',
  SOCIAL: '사람만남',
  SHOPPING: '쇼핑',
}

export const REC_CATEGORY_EMOJI: Record<RecCategory, string> = {
  CAFE_DESSERT: '☕',
  RESTAURANT: '🍽️',
  NATURE_WALK: '🌳',
  SPORTS_ACTIVITY: '🏃',
  CULTURE_EXHIBIT: '🎨',
  INDOOR_PLAY: '🎮',
  REST_HEALING: '🧖',
  STUDY_WORK: '📚',
  SOCIAL: '🧑‍🤝‍🧑',
  SHOPPING: '🛍️',
}

// 지도 마커 아이콘 (PlaceCat 4종으로 축약)
export const REC_CATEGORY_ICON: Record<RecCategory, PlaceCat> = {
  CAFE_DESSERT: 'cafe',
  RESTAURANT: 'food',
  NATURE_WALK: 'park',
  SPORTS_ACTIVITY: 'park',
  CULTURE_EXHIBIT: 'culture',
  INDOOR_PLAY: 'culture',
  REST_HEALING: 'cafe',
  STUDY_WORK: 'cafe',
  SOCIAL: 'food',
  SHOPPING: 'culture',
}

// 지도 자동 재검색 키워드 (kakao 장소검색용)
export const REC_CATEGORY_KEYWORD: Record<RecCategory, string> = {
  CAFE_DESSERT: '카페',
  RESTAURANT: '맛집',
  NATURE_WALK: '공원',
  SPORTS_ACTIVITY: '운동',
  CULTURE_EXHIBIT: '전시',
  INDOOR_PLAY: '방탈출',
  REST_HEALING: '카페',
  STUDY_WORK: '스터디카페',
  SOCIAL: '맛집',
  SHOPPING: '쇼핑몰',
}

export const recCategoryLabel = (code: RecCategory): string => REC_CATEGORY_LABEL[code] ?? code
