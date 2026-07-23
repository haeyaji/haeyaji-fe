// BE 미구축 기능을 임시로 떠받치는 mock — 이 파일 한 곳에 격리한다.
// BE가 붙으면 아래 TODO(be) 지점만 교체하면 된다.
// (데모 시드였던 할일·루틴·친구 시드·닉네임은 제거됨 → 각 store는 빈 상태로 시작)
import type { AppUser, Place } from '@/types'

// 친구 검색용 mock 유저. TODO(be): GET /users?nickname= 검색 응답으로 대체.
export const MOCK_USERS: AppUser[] = [
  { id: 'u1', nickname: '민지', vibe: '활기찬', cats: ['야외', '맛집/카페'] },
  { id: 'u2', nickname: '지훈', vibe: '조용한', cats: ['생산성', '맛집/카페'] },
  { id: 'u3', nickname: '수연', vibe: '감성적인', cats: ['실내', '사람만나기'] },
  { id: 'u4', nickname: '도윤', vibe: '트렌디한', cats: ['맛집/카페', '사람만나기'] },
  { id: 'u5', nickname: '서영', vibe: '편안한', cats: ['휴식', '실내'] },
  { id: 'u6', nickname: '현우', vibe: '활기찬', cats: ['야외'] },
  { id: 'u7', nickname: '예린', vibe: '조용한', cats: ['맛집/카페', '휴식'] },
  { id: 'u8', nickname: '준서', vibe: '트렌디한', cats: ['맛집/카페', '사람만나기'] },
]

// 날씨→추천 장소 mock (강남권 실좌표). Home·Calendar·Map 상단 추천 배너용.
// TODO(be): 날씨 기반 추천 장소 API로 대체. (지도 실검색은 이미 placeApi.searchPlaces
// = 카카오 프록시를 사용하며, 이 mock은 "이 날씨엔 여기" 배너에만 남아 있다.)
export const PLACES: Place[] = [
  { id: 'p1', name: '블루보틀 커피 (역삼)', type: '카페 · 테라스', dist: '1.1km', cat: 'cafe', why: '통창과 테라스가 있어 집중 업무에 좋아요. 맑은 날 1순위.', lat: 37.5006, lng: 127.0366 },
  { id: 'p2', name: '양재천 산책로', type: '공원 · 산책', dist: '2.3km', cat: 'park', why: '물길 따라 걷기 좋은 산책로. 산책·피크닉 추천.', lat: 37.4844, lng: 127.0398 },
  { id: 'p3', name: '강남역 맛집거리', type: '맛집 · 거리', dist: '1.4km', cat: 'food', why: '실내 먹거리가 몰려 있어 날씨와 무관하게 즐기기 좋아요.', lat: 37.4959, lng: 127.0281 },
  { id: 'p4', name: '코엑스 아쿠아리움', type: '문화 · 실내', dist: '0.8km', cat: 'culture', why: '비 오는 날 실내에서 시간 보내기 딱 좋은 코스.', lat: 37.5126, lng: 127.0589 },
]

// 요일 라벨(월~일 시작) — 루틴 요일 UI 상수. (mock 아님)
export const DOW = ['월', '화', '수', '목', '금', '토', '일']
