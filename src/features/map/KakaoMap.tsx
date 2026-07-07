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
  type?: string
  dist?: string
}

interface Props {
  center: { lat: number; lng: number }
  origin?: { lat: number; lng: number; label: string }
  points: MapPoint[] // 추천 핀 (강조, 클러스터 O)
  browsePoints?: MapPoint[] // 탐색 마커 (연한 점, 클러스터 X)
  onIdle?: (map: any) => void // 팬/줌 멈춤 콜백 ("다시 검색" 버튼 노출 판단용)
}

const CAT_SVG: Record<PlaceCat, string> = {
  cafe: '<path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 9h2.2a2 2 0 0 1 0 4H17"/><path d="M7 2.5v2M11 2.5v2"/>',
  park: '<path d="M12 3l5 7h-3l3 5h-4v6h-2v-6H7l3-5H7z"/>',
  food: '<path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9"/>',
  culture: '<path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6"/>',
}
const catSvg = (cat: PlaceCat, c: string, w = 13) =>
  `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CAT_SVG[cat]}</svg>`

const CLUSTER_PX = 52

// 선택된 핀 = 이름 표시 pill, 그 외 = 아이콘만(겹침 최소화) + hover
function pinEl(p: MapPoint, hover: { in: (p: MapPoint) => void; out: () => void }): HTMLElement {
  const el = document.createElement('div')
  if (p.selected) {
    el.style.cssText = `display:flex;align-items:center;gap:7px;padding:7px 13px 7px 8px;border-radius:22px;cursor:pointer;white-space:nowrap;transform:translateY(-6px);font-family:'Pretendard',sans-serif;background:#17150F;box-shadow:0 6px 16px rgba(24,21,15,.28)`
    el.innerHTML = `<div style="width:25px;height:25px;border-radius:50%;background:#15795A;display:flex;align-items:center;justify-content:center">${catSvg(p.cat, '#fff')}</div><div style="font-size:12.5px;font-weight:800;color:#fff">${p.name}</div>`
  } else {
    el.style.cssText = `width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid #15795A;display:flex;align-items:center;justify-content:center;cursor:pointer;transform:translateY(-4px);box-shadow:0 4px 12px rgba(24,21,15,.2)`
    el.innerHTML = catSvg(p.cat, '#15795A', 16)
    el.addEventListener('mouseenter', () => hover.in(p))
    el.addEventListener('mouseleave', () => hover.out())
  }
  el.addEventListener('click', p.onClick)
  return el
}

function hoverCardEl(p: MapPoint): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `background:#fff;border-radius:12px;box-shadow:0 8px 22px rgba(24,21,15,.2);padding:9px 13px;white-space:nowrap;transform:translateY(-12px);font-family:'Pretendard',sans-serif;pointer-events:none`
  const meta = [p.type, p.dist].filter(Boolean).join(' · ')
  el.innerHTML = `<div style="font-size:13px;font-weight:800;color:#17150F">${p.name}</div>${meta ? `<div style="font-size:11.5px;font-weight:600;color:#A39C8E;margin-top:2px">${meta}</div>` : ''}`
  return el
}

// 탐색 마커: 그린 원 + 흰 카테고리 아이콘 (추천 핀보다 작게, 밝은 지도 위 가시성 확보)
function dotEl(p: MapPoint, hover: { in: (p: MapPoint) => void; out: () => void }): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `width:26px;height:26px;border-radius:50%;background:#15795A;border:2px solid #fff;box-shadow:0 3px 9px rgba(24,21,15,.3);cursor:pointer;display:flex;align-items:center;justify-content:center`
  el.innerHTML = catSvg(p.cat, '#fff', 13)
  el.addEventListener('mouseenter', () => hover.in(p))
  el.addEventListener('mouseleave', () => hover.out())
  el.addEventListener('click', (e) => { e.stopPropagation(); p.onClick() })
  return el
}

function clusterEl(members: MapPoint[], onOpen: () => void): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `display:flex;align-items:center;gap:7px;padding:6px 13px 6px 6px;border-radius:22px;cursor:pointer;transform:translateY(-6px);font-family:'Pretendard',sans-serif;background:#17150F;box-shadow:0 6px 16px rgba(24,21,15,.3)`
  el.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:#15795A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800">${members.length}</div><div style="font-size:12.5px;font-weight:800;color:#fff">장소 ${members.length}곳</div>`
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onOpen()
  })
  return el
}

function originEl(label: string): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `display:flex;align-items:center;gap:7px;padding:6px 13px 6px 6px;border-radius:22px;white-space:nowrap;font-family:'Pretendard',sans-serif;background:#15795A;box-shadow:0 6px 16px rgba(24,21,15,.24)`
  el.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.24);display:flex;align-items:center;justify-content:center"><svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.4A2.4 2.4 0 1 1 12 6.6a2.4 2.4 0 0 1 0 4.8z"/></svg></div><div style="font-size:12px;font-weight:800;color:#fff">${label}</div>`
  return el
}

function popupEl(members: MapPoint[], onPick: (p: MapPoint) => void): HTMLElement {
  const box = document.createElement('div')
  box.style.cssText = `background:#fff;border-radius:14px;box-shadow:0 10px 30px rgba(24,21,15,.22);padding:6px;width:216px;max-height:230px;overflow-y:auto;transform:translateY(-14px);font-family:'Pretendard',sans-serif`
  members.forEach((m) => {
    const row = document.createElement('div')
    row.style.cssText = `display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;cursor:pointer`
    row.addEventListener('mouseenter', () => (row.style.background = '#F0F2F6'))
    row.addEventListener('mouseleave', () => (row.style.background = 'transparent'))
    const meta = [m.type, m.dist].filter(Boolean).join(' · ')
    row.innerHTML = `<div style="width:26px;height:26px;border-radius:8px;background:#E4F2EC;display:flex;align-items:center;justify-content:center;flex-shrink:0">${catSvg(m.cat, '#15795A', 14)}</div><div style="min-width:0"><div style="font-size:13px;font-weight:700;color:#17150F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}</div>${meta ? `<div style="font-size:11px;font-weight:600;color:#A39C8E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${meta}</div>` : ''}</div>`
    row.addEventListener('click', (e) => {
      e.stopPropagation()
      onPick(m)
    })
    box.appendChild(row)
  })
  return box
}

export function KakaoMap({ center, origin, points, browsePoints = [], onIdle }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const popupRef = useRef<any>(null)
  const hoverRef = useRef<any>(null)
  const pointsRef = useRef<MapPoint[]>(points)
  const browseRef = useRef<MapPoint[]>(browsePoints)
  const onIdleRef = useRef(onIdle)
  const originRef = useRef(origin)
  const [failed, setFailed] = useState(false)

  pointsRef.current = points
  browseRef.current = browsePoints
  onIdleRef.current = onIdle
  originRef.current = origin

  useEffect(() => {
    let cancelled = false
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !boxRef.current) return
        const map = new maps.Map(boxRef.current, { center: new maps.LatLng(center.lat, center.lng), level: 3 })
        mapRef.current = map
        requestAnimationFrame(() => map.relayout())
        maps.event.addListener(map, 'idle', () => {
          recluster()
          onIdleRef.current?.(map)
        })
        maps.event.addListener(map, 'click', closePopup)
        recluster()
        onIdleRef.current?.(map) // 생성 직후엔 idle이 안 오므로 1회 수동 호출
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const maps = window.kakao?.maps
    if (maps && mapRef.current) mapRef.current.setCenter(new maps.LatLng(center.lat, center.lng))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng])

  useEffect(() => {
    recluster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, browsePoints, origin?.lat, origin?.lng])

  function closePopup() {
    if (popupRef.current) {
      popupRef.current.setMap(null)
      popupRef.current = null
    }
  }
  function closeHover() {
    if (hoverRef.current) {
      hoverRef.current.setMap(null)
      hoverRef.current = null
    }
  }
  function openHover(p: MapPoint) {
    const maps = window.kakao?.maps
    const map = mapRef.current
    if (!maps || !map) return
    closeHover()
    const ov = new maps.CustomOverlay({ position: new maps.LatLng(p.lat, p.lng), content: hoverCardEl(p), yAnchor: 1.7, zIndex: 30, clickable: false })
    ov.setMap(map)
    hoverRef.current = ov
  }

  function recluster() {
    const maps = window.kakao?.maps
    const map = mapRef.current
    if (!maps || !map) return
    closePopup()
    closeHover()
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    const pts = pointsRef.current
    const org = originRef.current
    const hover = { in: openHover, out: closeHover }
    const add = (lat: number, lng: number, content: HTMLElement, yAnchor: number, zIndex = 1, clickable = true) => {
      const ov = new maps.CustomOverlay({ position: new maps.LatLng(lat, lng), content, yAnchor, zIndex, clickable })
      ov.setMap(map)
      overlaysRef.current.push(ov)
    }

    if (org) add(org.lat, org.lng, originEl(org.label), 0.5, 2, false)

    const selected = pts.filter((p) => p.selected)
    const rest = pts.filter((p) => !p.selected)
    const proj = map.getProjection()
    const screen = rest.map((p) => proj.containerPointFromCoords(new maps.LatLng(p.lat, p.lng)))
    const used = new Array(rest.length).fill(false)

    for (let i = 0; i < rest.length; i++) {
      if (used[i]) continue
      used[i] = true
      const group = [i]
      for (let j = i + 1; j < rest.length; j++) {
        if (used[j]) continue
        if (Math.hypot(screen[i].x - screen[j].x, screen[i].y - screen[j].y) < CLUSTER_PX) {
          used[j] = true
          group.push(j)
        }
      }
      if (group.length === 1) {
        const p = rest[group[0]]
        add(p.lat, p.lng, pinEl(p, hover), 1)
      } else {
        const members = group.map((g) => rest[g])
        const cx = members.reduce((s, m) => s + m.lat, 0) / members.length
        const cy = members.reduce((s, m) => s + m.lng, 0) / members.length
        add(cx, cy, clusterEl(members, () => openPopup(cx, cy, members)), 1, 3)
      }
    }
    selected.forEach((p) => add(p.lat, p.lng, pinEl(p, hover), 1, 4))

    // 탐색 마커(연한 점): 클러스터 없이 그대로, 추천 핀 아래 레이어
    browseRef.current.forEach((p) => add(p.lat, p.lng, dotEl(p, hover), 0.5, 0))
  }

  function openPopup(lat: number, lng: number, members: MapPoint[]) {
    const maps = window.kakao?.maps
    const map = mapRef.current
    if (!maps || !map) return
    closePopup()
    const ov = new maps.CustomOverlay({
      position: new maps.LatLng(lat, lng),
      content: popupEl(members, (p) => {
        closePopup()
        p.onClick()
      }),
      yAnchor: 1.1,
      zIndex: 20,
      clickable: true,
    })
    ov.setMap(map)
    popupRef.current = ov
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
