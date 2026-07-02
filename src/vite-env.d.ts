/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_BE_BASE?: string
  readonly VITE_KAKAO_MAP_KEY?: string
}

// 카카오맵 SDK 전역 (동적 로드)
interface Window {
  kakao: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
