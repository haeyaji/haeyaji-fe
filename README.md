# haeyaji-fe

**해야지** — 날씨 기반 추천 투두리스트 + 친구 약속 잡기 웹앱의 프론트엔드.

날씨·취향·위치를 반영한 개인화 장소 추천, 할 일/루틴 관리, 친구와의 약속 시간 조율(when2meet 방식)을 한 곳에서 제공한다.

## 스택

- **React 18** + **TypeScript** + **Vite**
- **Zustand** — 전역 상태 (라우터 없이 `useAppStore.view`로 화면 전환하는 단일 뷰 SPA)
- **axios** — be 통신 (쿠키 인증 + CSRF)
- **Tailwind CSS** (일부) + 인라인 스타일
- **카카오맵 JS SDK** — 지도/장소 마커 (`lib/kakaoLoader`)
- `navigator.geolocation` — 현재 위치

## 실행

```bash
npm install
npm run dev      # http://localhost:5173  (be는 :8090, Vite 프록시 /api → :8090)
npm run build    # tsc -b && vite build
npm run preview
```

> dev 서버는 `/api`를 be(`localhost:8090`)로 프록시하고 쿠키 path를 `/`로 리라이트해 same-origin으로 동작한다. be가 `:8090`에서 떠 있어야 로그인·데이터가 붙는다. 추천은 be가 nlp(`:8000`)로 위임하며, nlp가 꺼져 있으면 날씨 기반 실검색으로 폴백한다.

## 아키텍처 (3-tier)

```
React (haeyaji-fe)  ──위치+입력──▶  be (Spring: 게이트웨이·데이터·인증)  ──추천 위임──▶  nlp (haeyaji-nlp, LLM)
        ▲                                   │
        └──────── HttpOnly 쿠키 + CSRF ──────┘
```

- fe는 **be만 호출**한다 (nlp 직접 호출 X). be가 카카오·날씨·nlp 등 외부 의존을 감싼다.
- be 응답은 `ApiResponse<T>` 봉투(`{success, code, message, data}`) → `data.data` 언랩. camelCase.

## 인증 (OAuth + 쿠키)

- **소셜 로그인** (카카오/네이버/구글): `GET /api/oauth2/authorization/{provider}`로 풀 리다이렉트 → be가 `accessToken`/`refreshToken`(HttpOnly 쿠키) 세팅 후 `/oauth/callback`로 복귀.
- **CSRF**: 상태변경(POST/PATCH/DELETE)에 `XSRF-TOKEN` 쿠키를 `X-XSRF-TOKEN` 헤더로 실어 보냄. 세션 첫 요청 403 시 be가 내려준 새 토큰으로 1회 자동 재시도.
- **세션 유지**: 부팅 시 `GET /me`로 확인, `accessToken` 만료(401)면 `/auth/reissue`로 자동 재발급.
- **초대 딥링크**: `/invite/{token}`·`/meetup/{token}` 진입 시(미로그인이면 로그인 후) 해당 약속을 자동으로 연다.

## 주요 기능

| 도메인 | 내용 | be |
|---|---|---|
| **날씨** | 현재/주간 예보, 상세 드로어(강수·자외선·미세먼지…), 위치 지명 검색 | `/weather`, `/places/geocode` |
| **할 일** | 날짜별 CRUD, 완료 토글, 핀 고정, 드래그 정렬, 라벨 분류, 시간/장소/날짜 편집 | `/todos`, `/labels` |
| **할 일 공유** | 친구 초대(EDITOR/VIEWER)·수락/거절·참여자 관리, 권한별 편집 잠금 | `/todos/{id}/share` 등 |
| **루틴** | 요일별 반복 정의, 일괄 적용 | `/routines` |
| **AI 추천** | 날씨+취향+위치 개인화 → 카테고리 선택 → 실제 장소 추천 (대화형) | `/message`, `/recommend/feedback/choice` |
| **개인화** | 온보딩 설문(취향/회피/분위기/강도) 저장·복원 | `/preferences` |
| **지도** | 카카오 로컬 검색(반경 내 전부), 추천/검색 마커 구분, 경로·출발지 | `/places/search` |
| **약속** | 후보 날짜(달력 드래그)·슬롯 생성 → 링크/친구 초대 → 가용시간 드래그 입력 → 히트맵·겹치는시간 모달 → 확정 | `/meetings/*` |
| **친구** | 닉네임 검색·요청·수락/거절 | `/friends`, `/members/search` |
| **알림** | 벨 피드(커서 페이지네이션)·미읽음·읽음/삭제, 받은 공유·약속 초대 수락/거절 | `/notifications`, `/todos/invitations`, `/meetings/invitations` |
| **캘린더** | 월간 뷰(할 일·중기예보), 홈과 공유되는 개인화 추천 | — |

## 구조

```
src/
├── api/           # be 호출 레이어 (axios). 도메인별 1파일
│   ├── client.ts          be axios 인스턴스 + CSRF/401 재발급 인터셉터
│   ├── authApi.ts         OAuth URL·세션(/me)·닉네임·이메일
│   ├── todoApi.ts / todoShareApi.ts   할 일 CRUD / 공유(SHARE)
│   ├── routineApi.ts labelApi.ts      루틴 / 라벨
│   ├── recommendApi.ts personalizeApi.ts  추천(/message) / 설문·choice 신호
│   ├── placeApi.ts weatherApi.ts      장소 검색·지오코딩 / 날씨
│   ├── meetingApi.ts      약속(슬롯·share-token·초대·히트맵·확정)
│   ├── friendApi.ts       친구·회원 검색
│   └── notificationApi.ts 알림 피드
├── store/         # zustand 스토어 (도메인별)
│   ├── useAppStore        인증·현재 뷰·드로어/모달·토스트·선택 날짜
│   ├── useTodoStore       날짜별 할 일 + 공유 병합 + 낙관적 갱신
│   ├── useMeetupStore useShareInboxStore  약속 / 받은 초대함
│   ├── useChatStore useHomeRecStore usePrefStore  추천 대화 / 홈 추천 타일 / 취향
│   ├── useFriendStore useNotificationStore  친구 / 알림
│   └── useWeatherStore useLocationStore useMapStore useLabelStore useRoutineStore
├── features/      # 화면/기능 단위 컴포넌트
│   ├── auth/       로그인·프로필 설정·온보딩 설문
│   ├── home/       홈 벤토 대시보드(날씨·할일·추천·캘린더·달성률·위치 모달)
│   ├── calendar/   월간 캘린더
│   ├── todo/       할 일 목록·행·추가/상세 모달(시간·날짜·장소·공유·루틴)
│   ├── weather/    날씨 드로어·씬(움직이는 배경)
│   ├── recommend/  AI 추천 대화 드로어·카테고리
│   ├── map/        추천 장소 지도 모달·카카오맵
│   ├── meetup/     약속 목록·생성(달력)·상세(그리드 드래그·초대·현황·겹치는시간 모달)
│   ├── routine/    루틴 드로어·폼·요일 선택
│   ├── profile/    마이페이지(취향·친구·닉네임 수정)·친구 검색
│   └── notification/  상단 알림 벨 + 드롭다운
├── components/    # Sidebar 등 공통 UI
├── lib/           # icons(SVG)·weather(추천/게이지)·dates·dom·kakaoLoader
└── types/         # be DTO 대응 타입
```

## 커밋/브랜치 규칙

- 브랜치: `feature/fe-<이슈번호>`, 커밋: `[FE] <type> : <설명> #<이슈>` (feat/fix/refactor/style/chore/docs)
- main 직접 커밋 금지 → 브랜치 → PR(Rebase merge). 커밋 메시지에 AI/도구 흔적 넣지 않음.
