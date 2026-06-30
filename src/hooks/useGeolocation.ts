import { useEffect, useState } from 'react'

interface GeoState {
  lat: number | null
  lng: number | null
  error: string | null
  loading: boolean
}

/** navigator.geolocation 래퍼. be 추천 요청에 위치를 실어 보낼 때 사용. */
export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({ lat: null, lng: null, error: null, loading: true })

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState({ lat: null, lng: null, error: '위치 정보를 지원하지 않는 브라우저예요', loading: false })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      (err) => setState({ lat: null, lng: null, error: err.message, loading: false }),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }, [])

  return state
}
