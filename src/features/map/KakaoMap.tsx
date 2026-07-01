import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '@/lib/kakaoLoader'
import type { PlaceCat } from '@/types'

export interface MapPoint {
  id: string
  lat: number
  lng: number
  name: string
  cat: PlaceCat
  selected: boolean
  onClick: () => void
}

interface Props {
  center: { lat: number; lng: number }
  origin?: { lat: number; lng: number; label: string }
  points: MapPoint[]
}

const CAT_SVG: Record<PlaceCat, string> = {
  cafe: '<path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 9h2.2a2 2 0 0 1 0 4H17"/><path d="M7 2.5v2M11 2.5v2"/>',
  park: '<path d="M12 3l5 7h-3l3 5h-4v6h-2v-6H7l3-5H7z"/>',
  food: '<path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9"/>',
  culture: '<path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6"/>',
}

function pinEl(p: MapPoint): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `display:flex;align-items:center;gap:7px;padding:7px 13px 7px 8px;border-radius:22px;cursor:pointer;white-space:nowrap;transform:translateY(-6px);font-family:'Pretendard',sans-serif;background:${p.selected ? '#17150F' : '#fff'};box-shadow:0 6px 16px rgba(24,21,15,.22)`
  el.innerHTML = `<div style="width:25px;height:25px;border-radius:50%;background:#15795A;display:flex;align-items:center;justify-content:center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CAT_SVG[p.cat]}</svg></div><div style="font-size:12.5px;font-weight:800;color:${p.selected ? '#fff' : '#17150F'}">${p.name}</div>`
  el.addEventListener('click', p.onClick)
  return el
}

function originEl(label: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `display:flex;align-items:center;gap:7px;padding:6px 13px 6px 7px;border-radius:22px;white-space:nowrap;font-family:'Pretendard',sans-serif;background:#15795A;box-shadow:0 6px 16px rgba(24,21,15,.24)`
  el.innerHTML = `<div style="width:23px;height:23px;border-radius:50%;background:rgba(255,255,255,.24);display:flex;align-items:center;justify-content:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="5"/></svg></div><div style="font-size:12px;font-weight:800;color:#fff">${label}</div>`
  return el
}

export function KakaoMap({ center, origin, points }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const [failed, setFailed] = useState(false)

  // 초기화 (1회)
  useEffect(() => {
    let cancelled = false
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !boxRef.current) return
        mapRef.current = new maps.Map(boxRef.current, { center: new maps.LatLng(center.lat, center.lng), level: 5 })
        requestAnimationFrame(() => mapRef.current?.relayout())
        draw()
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 마커/좌표 변경 시 다시 그림
  useEffect(() => {
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, center.lat, center.lng, origin?.lat, origin?.lng])

  function draw() {
    const maps = window.kakao?.maps
    const map = mapRef.current
    if (!maps || !map) return
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []
    const add = (lat: number, lng: number, content: HTMLElement, yAnchor: number) => {
      const ov = new maps.CustomOverlay({ position: new maps.LatLng(lat, lng), content, yAnchor })
      ov.setMap(map)
      overlaysRef.current.push(ov)
    }
    if (origin) add(origin.lat, origin.lng, originEl(origin.label), 0.5)
    points.forEach((p) => add(p.lat, p.lng, pinEl(p), 1))

    const all = [...(origin ? [origin] : []), ...points]
    if (all.length > 1) {
      const bounds = new maps.LatLngBounds()
      all.forEach((p) => bounds.extend(new maps.LatLng(p.lat, p.lng)))
      map.setBounds(bounds, 70, 70, 70, 70)
    } else {
      map.setCenter(new maps.LatLng(center.lat, center.lng))
    }
  }

  if (failed) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#EEF0F3', color: '#8B8579', padding: 24, textAlign: 'center' }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C1C7D2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>지도를 불러오지 못했어요</div>
        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>카카오 앱키·도메인(localhost:5173) 등록을<br />확인해주세요.</div>
      </div>
    )
  }

  return <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} />
}
