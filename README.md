# haeyaji-fe

날씨 기반 추천 투두리스트 "해야지" 프론트엔드. `리모델 시안.dc.html`(claude.ai/design)을 확정 스택으로 구현했다.

## 스택

React 18 · Vite · TypeScript · Zustand · Tailwind CSS · 카카오맵 JS SDK(예정) · navigator.geolocation

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

## 구조 (역할별)

```
src/
├── api/        # be(Spring) 게이트웨이 호출. fe는 be만 호출 (nlp 직접 호출 X)
│   ├── client.ts          공통 fetch 래퍼
│   ├── recommendApi.ts    추천 (be → nlp 위임)
│   ├── todoApi.ts         할 일/루틴 CRUD
│   └── weatherApi.ts      날씨 중계
├── store/      # zustand
│   ├── useAppStore.ts      인증·라우팅·드로어·토스트·선택날짜
│   ├── useTodoStore.ts     날짜별 할 일
│   ├── useRoutineStore.ts  루틴
│   ├── useChatStore.ts     AI 추천 대화
│   └── useMapStore.ts      지도 선택/검색/출발지
├── features/   # 기능 단위
│   ├── auth/       로그인 (FR)
│   ├── home/       홈 벤토 대시보드
│   ├── calendar/   캘린더 페이지
│   ├── todo/       할 일 행/추가 모달 (FR-1)
│   ├── weather/    날씨 상세 드로어 (FR-2)
│   ├── recommend/  AI 추천 대화 드로어 (FR-3)
│   ├── map/        추천 장소 지도 모달 (FR-4)
│   └── routine/    루틴 관리 드로어 (FR-5)
├── components/ # 공통 UI (Toast, Fab)
├── hooks/      # useGeolocation
├── lib/        # icons(SVG), weather(추천/게이지 규칙), mockData
└── types/      # be DTO 대응 타입 (MessageResponse, Task ...)
```

## 데이터 흐름 (3-tier)

```
React (haeyaji-fe)  ──위치+입력──▶  be (Spring, 게이트웨이/데이터/인증)  ──추천위임──▶  nlp (haeyaji-nlp)
```

현재는 `lib/`의 mock 데이터로 동작한다. be 연동 시 `api/`의 stub을 실제 호출로 교체하면 된다.
타입 계약: nlp는 snake_case 출력 → **be가 camelCase로 정규화**해 내려주는 것을 전제 (`types/index.ts`).
