// 시안의 하드코딩 데이터. 추후 api/ 레이어가 be 응답으로 대체한다.
import type { Place, Routine, TasksByDate } from '@/types'
import { addDays, todayKey } from './dates'

// 좌표는 강남권 실좌표 (기본 위치 강남역 기준 주변). 실지도 마커용.
export const PLACES: Place[] = [
  { id: 'p1', name: '블루보틀 커피 (역삼)', type: '카페 · 테라스', dist: '1.1km', cat: 'cafe', why: '통창과 테라스가 있어 집중 업무에 좋아요. 맑은 날 1순위.', lat: 37.5006, lng: 127.0366 },
  { id: 'p2', name: '양재천 산책로', type: '공원 · 산책', dist: '2.3km', cat: 'park', why: '물길 따라 걷기 좋은 산책로. 산책·피크닉 추천.', lat: 37.4844, lng: 127.0398 },
  { id: 'p3', name: '강남역 맛집거리', type: '맛집 · 거리', dist: '1.4km', cat: 'food', why: '실내 먹거리가 몰려 있어 날씨와 무관하게 즐기기 좋아요.', lat: 37.4959, lng: 127.0281 },
  { id: 'p4', name: '코엑스 아쿠아리움', type: '문화 · 실내', dist: '0.8km', cat: 'culture', why: '비 오는 날 실내에서 시간 보내기 딱 좋은 코스.', lat: 37.5126, lng: 127.0589 },
]

export const DOW = ['월', '화', '수', '목', '금', '토', '일']

const T = todayKey()
export const INITIAL_TASKS: TasksByDate = {
  [addDays(T, -4)]: [
    { id: 'a1', title: '아침 명상', time: '오전 07:00', group: 'routine', done: true },
    { id: 'a2', title: '주간 계획 정리', time: '오전 09:00', group: 'personal', done: false },
  ],
  [addDays(T, -3)]: [
    { id: 'b1', title: '아침 명상', time: '오전 07:00', group: 'routine', done: true },
    { id: 'b2', title: '디자인 리뷰', time: '오후 02:00', group: 'personal', done: false },
  ],
  [addDays(T, -2)]: [
    { id: 'c1', title: '아침 명상', time: '오전 07:00', group: 'routine', done: false },
    { id: 'c2', title: '실내 클라이밍', time: '오후 07:00', group: 'personal', done: false, ai: true },
  ],
  [addDays(T, -1)]: [
    { id: 'd1', title: '아침 요가', time: '오전 07:00', group: 'routine', done: true },
    { id: 'd2', title: '팀 회식', time: '오후 06:30', group: 'personal', done: false },
  ],
  [addDays(T, 0)]: [
    { id: 't1', title: '아침 명상', time: '오전 07:00', group: 'routine', done: true },
    { id: 't2', title: '헬스장 운동', time: '오전 08:30', group: 'routine', done: true },
    { id: 't3', title: '이메일 답장', time: '오전 09:30', group: 'personal', done: true },
    { id: 't4', title: '스탠드업 미팅', time: '오전 10:00', group: 'personal', done: true },
    { id: 't5', title: '프로젝트 미팅', time: '오전 11:00', group: 'personal', done: false },
    { id: 't6', title: '집중 업무 카페', meta: '날씨 적합도 우수', group: 'personal', done: false, ai: true },
    { id: 't7', title: '장보기', time: '오후 06:00', group: 'personal', done: false },
  ],
  [addDays(T, 1)]: [
    { id: 'f1', title: '아침 명상', time: '오전 07:00', group: 'routine', done: false },
    { id: 'f2', title: '우산 챙기기', time: '오전 08:00', group: 'personal', done: false },
    { id: 'f3', title: '전시 관람', time: '오후 02:00', group: 'personal', done: false, ai: true },
  ],
  [addDays(T, 2)]: [
    { id: 'g1', title: '아침 요가', time: '오전 07:00', group: 'routine', done: false },
    { id: 'g2', title: '브런치 약속', time: '오전 11:00', group: 'personal', done: false },
  ],
}

export const INITIAL_ROUTINES: Routine[] = [
  { id: 'r1', title: '아침 요가', cat: 'yoga', time: '오전 07:00', days: [true, true, true, true, true, true, true], active: true },
  { id: 'r2', title: '장보기', cat: 'shop', time: '오후 05:30', days: [true, false, false, true, false, false, false], active: true },
  { id: 'r3', title: '코딩 학습', cat: 'code', time: '오후 08:00', days: [true, true, true, true, true, false, false], active: true },
]

export const GREETING_PLACES = PLACES
