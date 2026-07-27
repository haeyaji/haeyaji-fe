// 백엔드(be) DTO 대응 타입. nlp는 snake_case로 내보내지만 be가 camelCase로
// 정규화해 내려주는 것을 전제로 한다. (be 구현 시 확정)

export type Intent = 'recommend' | 'recommend_category' | 'info' | 'chat'

export type Category = '야외' | '실내' | '휴식' | '생산성' | '사람만나기' | '맛집/카페'

/** 추천 카테고리 선택(choice) 10종 코드 — 설문 6종 Category와 별개 taxonomy. */
export type RecCategory =
  | 'CAFE_DESSERT' | 'RESTAURANT' | 'NATURE_WALK' | 'SPORTS_ACTIVITY' | 'CULTURE_EXHIBIT'
  | 'INDOOR_PLAY' | 'REST_HEALING' | 'STUDY_WORK' | 'SOCIAL' | 'SHOPPING'

/** nlp 1단계 응답의 카테고리 후보. code + 표시용 label/reason. (keywords는 2단계 장소에서 나옴 → 보통 미포함) */
export interface RecCategoryOption {
  code: RecCategory
  label?: string // nlp가 준 표시 라벨(없으면 FE 10종 테이블 폴백)
  reason?: string // 왜 이 카테고리인지(예: "비 오는 날 감성"), 없을 수 있음
  keywords?: string[] // 선택 시 be choice로 넘길 세부 키워드(1단계엔 보통 없음)
}

/** nlp TodoItem (be 경유). 지도 마커용 좌표/거리 포함. */
export interface RecommendedTodo {
  title: string
  reason: string
  category: RecCategory // nlp가 10종 code로 태깅 (구 6종 한글 아님)
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
  categories: RecCategoryOption[] // 1단계 카테고리 후보 (intent recommend_category일 때, 없으면 [])
}

/** nlp history 턴 (멀티턴 좁히기 맥락) */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

// ── 클라이언트 도메인 모델 (be todo 계약 대응) ───────────────────────────

export type TaskGroup = 'routine' | 'personal'

/** 할 일 상태 — be todo_status(TODO/DONE) 2상태. done=true ↔ 'done' */
export type TaskStatus = 'todo' | 'done'

/** 사용자 커스텀 분류 라벨 (be label 테이블 대응 — 지금은 로컬 persist). category(6종·AI)와 별개 */
export interface Label {
  id: string
  name: string
  color: string
}

/** 공유 권한 (PRD SHARE/PERM: owner ⊃ editor ⊃ viewer) */
export type ShareRole = 'owner' | 'editor' | 'viewer'
/** 초대 수락 상태 (be todo_participant.invite_status: PENDING/ACCEPTED/REJECTED) */
export type ShareStatus = 'pending' | 'accepted' | 'rejected'
/** 할 일 공유 참여자 (be todo_participant 대응 — 지금은 friend userId 로컬) */
export interface TaskParticipant {
  userId: string
  role: ShareRole // 초대 전에 미리 지정
  status: ShareStatus // pending=대기 중(수락 전), accepted=활성 참여자
}

export interface Task {
  id: string
  title: string
  time?: string // 시작 시각 (be todo.start_time)
  meta?: string // 표시용 보조 텍스트 (레거시, 미설정 시 time 폴백)
  group: TaskGroup // routine/personal → be todo_source(ROUTINE/MANUAL), ai=AI
  done: boolean
  status?: TaskStatus // todo/done (미지정 시 done 값으로 유추)
  placeName?: string | null // be todo.place_name (추천 장소명)
  placeUrl?: string | null // be todo.place_url (지도 딥링크)
  lat?: number | null // be todo.lat (지도 마커)
  lng?: number | null // be todo.lng
  pinned?: boolean // be todo.pinned — 최상단 고정(우선순위 대체)
  sortOrder?: number // be todo.sort_order — 드래그 수동 순서
  labelId?: string | null // be todo.label_id (사용자 라벨) — 생성흐름 캐리어. 표시는 useLabelStore로 해석
  ai?: boolean
  participants?: TaskParticipant[] // be todo_participant (공유). 비어있으면 개인 할 일
  shared?: boolean // 남이 나에게 공유한 할 일 — 내 소유 아님(참여자)
  myRole?: 'EDITOR' | 'VIEWER' // 공유 시 내 권한. EDITOR=완료·수정 가능, VIEWER=읽기전용. 소유면 undefined
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

export interface Routine {
  id: string
  title: string
  time: string
  days: boolean[] // 월~일 (7) → be routine_day.day_of_week
  active: boolean // be routine.is_active
  labelId?: string | null // be routine.label_id — 기본 라벨(생성 todo에 상속)
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  todos?: RecommendedTodo[] // nlp 추천 결과 (assistant 메시지)
  options?: string[] // 좁히기 칩 (assistant 메시지)
  categories?: RecCategoryOption[] // 1단계 카테고리 선택 칩 (assistant 메시지)
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
