// 추천 카테고리 선택(choice) 10종 code → 표시 라벨·이모지. (be handoff: docs/handoff-fe-category-choice.md)
import type { RecCategory } from '@/types'

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

export const recCategoryLabel = (code: RecCategory): string => REC_CATEGORY_LABEL[code] ?? code
