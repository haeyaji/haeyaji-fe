// 백엔드(be) DTO 대응 타입. nlp는 snake_case로 내보내지만 be가 camelCase로
// 정규화해 내려주는 것을 전제로 한다. (be 구현 시 확정)

export type Intent = 'recommend' | 'info' | 'chat'

export type Category = '야외' | '실내' | '휴식' | '생산성' | '사람만나기' | '맛집/카페'

/** nlp TodoItem (be 경유). 지도 마커용 좌표/거리 포함. */
export interface RecommendedTodo {
  title: string
  reason: string
  category: Category
  estimatedMinutes: number
  placeName: string | null
  placeUrl: string | null
  x: number | null // 경도(lng)
  y: number | null // 위도(lat)
  distanceM: number | null
}

export interface MessageResponse {
  intent: Intent
  reply: string
  todos: RecommendedTodo[]
  options: string[] // 좁히기 칩 후보 (막연한 요청일 때 nlp가 내려줌, 기본 [])
}

/** nlp history 턴 (멀티턴 좁히기 맥락) */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

// ── 클라이언트 도메인 모델 (프로토타입 상태) ───────────────────────────

export type TaskGroup = 'routine' | 'personal'

/** 칸반 상태 (기존 done과 매핑: done=true ↔ 'done') */
export type TaskStatus = 'todo' | 'doing' | 'done'

/** 칸반 우선순위 (지라식). 미지정은 '보통' 취급 */
export type TaskPriority = 'high' | 'mid' | 'low'

export interface Subtask {
  id: string
  title: string
  done: boolean // status와 동기 유지 (status==='done')
  status?: TaskStatus // 진행현황 (미지정 시 done으로 유추)
  due?: string // 일정 (YYYY-MM-DD)
}

/** 공유 권한 (PRD SHARE/PERM: owner ⊃ editor ⊃ viewer) */
export type ShareRole = 'owner' | 'editor' | 'viewer'
/** 초대 수락 상태 (GitHub/Jira식: 초대→pending→상대 수락→accepted) */
export type ShareStatus = 'pending' | 'accepted'
/** 할 일 공유 참여자 (be todo_participant 대응 — 지금은 friend userId 로컬) */
export interface TaskParticipant {
  userId: string
  role: ShareRole // 초대 전에 미리 지정
  status: ShareStatus // pending=대기 중(수락 전), accepted=활성 참여자
}

export interface Task {
  id: string
  title: string
  time?: string
  meta?: string
  group: TaskGroup
  done: boolean
  status?: TaskStatus // 미지정 시 done 값으로 유추
  subtasks?: Subtask[]
  key?: string // 지라식 이슈 키 (HAE-N)
  priority?: TaskPriority
  desc?: string
  labels?: string[]
  ai?: boolean
  category?: Category | null // 추천(RecommendedTodo)에서 실어온 6종 카테고리 — 행동학습(DONE→가중치)용. 수동 생성은 null 허용
  participants?: TaskParticipant[] // 공유 대상(친구). 비어있으면 개인 할 일
}

/** 날짜 id('20'~'26') → 할 일 목록 */
export type TasksByDate = Record<string, Task[]>

export type WeatherCond = 'sunny' | 'cloudy' | 'rainy' | 'snowy'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export interface WeekDay {
  id: string
  dow: string
  date: number
  cond: WeatherCond
  hi: number
  lo: number
}

/** 유저 (친구 검색·약속). be users 계약 대응 — mock에서 시작. */
export interface AppUser {
  id: string
  nickname: string
  intro: string
  vibe: string // 대표 분위기 (usePrefStore vibe와 같은 값 집합)
  cats: Category[] // 선호 카테고리
}

export type PlaceCat = 'cafe' | 'park' | 'food' | 'culture'

export interface Place {
  id: string
  name: string
  type: string
  dist: string
  cat: PlaceCat
  why: string
  lat: number
  lng: number
}

export type RoutineCat = 'yoga' | 'shop' | 'code'

export interface Routine {
  id: string
  title: string
  cat: RoutineCat
  time: string
  days: boolean[] // 월~일 (7)
  active: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  todos?: RecommendedTodo[] // nlp 추천 결과 (assistant 메시지)
  options?: string[] // 좁히기 칩 (assistant 메시지)
}

export interface HourlyForecast {
  label: string
  temp: number
  pop: number
}

/** 날씨 시각 토큰 + 수치 (dayWeather 결과) */
export interface DayWeather {
  cond: WeatherCond
  tod: TimeOfDay
  temp: number
  hi: number
  lo: number
  condKo: string
  pop: number
  humid: number
  wind: number
  feels: number
  uvLv: string
  uvIdx: number
  dustLv: string
  dustVal: number
  sky: string
  glow: string
  ink: string
  sub: string
  iconC: string
  hourly: HourlyForecast[]
}
