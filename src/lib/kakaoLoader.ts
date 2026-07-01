// 카카오맵 JS SDK 동적 로더 (한 번만 주입, 이후 캐시된 Promise 반환).
let promise: Promise<KakaoMaps> | null = null

// SDK 타입은 미제공 → 최소 별칭
type KakaoMaps = typeof window.kakao.maps

export function loadKakaoMaps(): Promise<KakaoMaps> {
  if (promise) return promise
  promise = new Promise<KakaoMaps>((resolve, reject) => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!key) {
      reject(new Error('VITE_KAKAO_MAP_KEY 미설정'))
      return
    }
    if (window.kakao?.maps) {
      resolve(window.kakao.maps)
      return
    }
    const script = document.createElement('script')
    // https 고정 (http 페이지에서 //로 두면 http로 로드돼 실패)
    // services = 키워드 장소검색 / 주소↔좌표 변환 라이브러리
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao.maps))
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패 (도메인 등록 확인)'))
    document.head.appendChild(script)
  })
  return promise
}
