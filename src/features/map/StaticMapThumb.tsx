import { useEffect, useRef } from 'react'
import { loadKakaoMaps } from '@/lib/kakaoLoader'

// 카카오 정적 지도 이미지(비대화형) — 장소 위치 미리보기 썸네일.
// (카카오 장소검색 API는 매장 사진을 제공하지 않아 위치 지도로 대체)
export function StaticMapThumb({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let done = false
    loadKakaoMaps()
      .then((maps) => {
        if (done || !ref.current) return
        ref.current.innerHTML = ''
        new maps.StaticMap(ref.current, {
          center: new maps.LatLng(lat, lng),
          level: 3,
          marker: [{ position: new maps.LatLng(lat, lng) }],
        })
      })
      .catch(() => {})
    return () => {
      done = true
    }
  }, [lat, lng])
  return <div ref={ref} style={{ width: '100%', height: '100%', background: '#EEF0F3' }} />
}
