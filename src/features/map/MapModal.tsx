import { useEffect, useState } from 'react'
import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { PLACES } from '@/lib/mockData'
import { useDayWeather, recsFor } from '@/lib/weather'
import { dowLabel } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useMapStore } from '@/store/useMapStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useLocationStore } from '@/store/useLocationStore'
import { KakaoMap } from './KakaoMap'
import { PlaceDetailModal } from './PlaceDetailModal'
import type { PlaceCat } from '@/types'

// 지도/리스트 공통 장소 모델 (추천 mock + 카카오 검색결과 정규화)
interface MapPlace {
  id: string
  name: string
  type: string
  dist: string
  cat: PlaceCat
  lat: number
  lng: number
  placeUrl?: string
  address?: string
}

const km = (s: string) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0
const kmUnit = (s: string) => /km/i.test(s)
const driveOf = (s: string) => `${Math.max(3, Math.round((kmUnit(s) ? km(s) : km(s) / 1000) * 3.4))}분`
const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`)

function catOf(categoryName: string): PlaceCat {
  if (/카페|커피|디저트|베이커리|제과/.test(categoryName)) return 'cafe'
  if (/음식|맛집|식당|레스토랑|술집|주점|고기|분식/.test(categoryName)) return 'food'
  if (/공원|산|하천|산책|캠핑|자연|해수욕/.test(categoryName)) return 'park'
  return 'culture'
}

export function MapModal() {
  const { mapOpen, closeMap, weatherSelId: selId } = useAppStore()
  const { mapSelId, mapSearch, origin, setMapSel, setMapSearch, setOrigin, resetOrigin } = useMapStore()
  const addPlaceTask = useTodoStore((s) => s.addPlaceTask)
  const loc = useLocationStore()

  const [results, setResults] = useState<MapPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [mapDetail, setMapDetail] = useState<MapPlace | null>(null) // 장소 상세 iframe 모달

  // 출발지 = 사용자 지정 우선, 없으면 현위치(폴백 강남)
  const effOrigin = origin ?? { lat: loc.lat, lng: loc.lng, label: '현위치' }

  // 지도 열 때마다 현재 위치 재요청
  useEffect(() => {
    if (mapOpen) useLocationStore.getState().locate()
  }, [mapOpen])

  // 키워드 검색 (디바운스). 출발지 기준 관련성순.
  useEffect(() => {
    const q = mapSearch.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      const maps = window.kakao?.maps
      if (!maps?.services) {
        setSearching(false)
        return
      }
      const ps = new maps.services.Places()
      ps.keywordSearch(
        q,
        (data: Record<string, string>[], status: string) => {
          setSearching(false)
          if (status === maps.services.Status.OK) {
            setResults(
              data.slice(0, 15).map((d) => ({
                id: d.id,
                name: d.place_name,
                type: (d.category_name || '').split('>').pop()?.trim() || '장소',
                dist: d.distance ? fmtDist(Number(d.distance)) : '',
                cat: catOf(d.category_name || ''),
                lat: Number(d.y),
                lng: Number(d.x),
                placeUrl: d.place_url,
                address: d.road_address_name || d.address_name || '',
              })),
            )
          } else {
            setResults([])
          }
        },
        { location: new maps.LatLng(effOrigin.lat, effOrigin.lng), sort: 'accuracy' },
      )
    }, 400)
    return () => clearTimeout(t)
  }, [mapSearch, effOrigin.lat, effOrigin.lng])

  // 훅은 early return보다 항상 먼저 (훅 순서 위반 방지)
  const w = useDayWeather(selId)

  if (!mapOpen) return null

  const mapHint = `${dowLabel(selId)}요일 · ${w.condKo} 기준 · 내 주변`
  const recIds = recsFor(w.cond)
  const mq = mapSearch.trim()

  const recPlaces: MapPlace[] = recIds
    .map((r) => PLACES.find((x) => x.id === r.id))
    .filter((p): p is (typeof PLACES)[number] => !!p)
    .map((p) => ({ id: p.id, name: p.name, type: p.type, dist: p.dist, cat: p.cat, lat: p.lat, lng: p.lng }))

  const shown: MapPlace[] = mq ? results : recPlaces
  const selP = shown.find((p) => p.id === mapSelId) ?? null
  const listTitle = mq ? (searching ? '검색 중…' : '검색 결과') : '오늘 추천 장소'
  const isCustomOrigin = !!origin

  // 출발지로 지정 / 도착지로 지정 (상세 모달에서 호출)
  const setAsOrigin = (p: MapPlace) => {
    setOrigin({ lat: p.lat, lng: p.lng, label: p.name })
    setMapDetail(null)
  }
  const setAsDest = (p: MapPlace) => {
    setMapSel(p.id)
    setMapDetail(null)
  }
  const useMyLocation = () => {
    resetOrigin()
    useLocationStore.getState().locate()
  }

  return (
    <>
      <div onClick={closeMap} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, animation: 'rb-fade .16s ease' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 1040, maxWidth: '100%', height: 660, maxHeight: '92vh', background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(24,21,15,.42)', animation: 'rb-modal .24s ease' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: '1px solid #E6E9F0' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.4px' }}>추천 장소 지도</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#A39C8E', marginTop: 2 }}>{mapHint}</div>
            </div>
            <div onClick={closeMap} style={{ width: 34, height: 34, borderRadius: 11, background: '#E9EDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <CloseIcon w={16} />
            </div>
          </div>

          <div className="map-body">
            {/* LEFT */}
            <div className="map-aside">
              <div style={{ padding: '16px 18px 12px' }}>
                <div style={{ position: 'relative' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A6A095" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4-4" strokeLinecap="round" />
                  </svg>
                  <input
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    placeholder="장소·주소 검색 (예: 스타벅스, 한강공원)"
                    style={{ width: '100%', border: '1px solid #E1E5EC', outline: 'none', background: '#F0F2F6', borderRadius: 13, padding: '11px 14px 11px 40px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#17150F' }}
                  />
                </div>

                {/* 출발지 → 도착지 */}
                <div style={{ marginTop: 12, background: '#F0F2F6', borderRadius: 14, padding: '13px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#15795A', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: '#17150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{effOrigin.label}</div>
                    {isCustomOrigin && (
                      <div onClick={useMyLocation} className="hbtn" style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: '#15795A', background: '#E4F2EC', borderRadius: 8, padding: '4px 9px', cursor: 'pointer' }}>현위치</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 14 }}>
                    <div style={{ width: 10, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 2, height: 14, background: '#CCD2DC' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#17150F', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: selP ? '#17150F' : '#B6BCC7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selP ? selP.name : '도착지를 선택하세요'}
                    </div>
                    {selP && (
                      <div onClick={() => setMapSel(null)} className="hbtn" style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: '#A39C8E', cursor: 'pointer' }}>해제</div>
                    )}
                  </div>
                </div>

                {selP && (
                  <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 13, background: '#E4F2EC', borderRadius: 14, padding: '13px 15px' }}>
                    <div style={{ width: 24, height: 24, flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#15795A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 11l1.4-4.2A2 2 0 0 1 8.3 5.4h7.4a2 2 0 0 1 1.9 1.4L19 11M5 11h14v5H5zM7 16v1.6M17 16v1.6" />
                        <circle cx="8" cy="13.4" r="1" />
                        <circle cx="16" cy="13.4" r="1" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16.5, fontWeight: 800, color: '#0F5A42' }}>자동차 {driveOf(selP.dist || '1km')}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#3E8C6E', marginTop: 1 }}>{selP.dist || '거리 정보 없음'} · 가장 빠른 경로</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#A39C8E', padding: '6px 20px 8px' }}>{listTitle}</div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shown.map((p) => {
                  const active = mapSelId === p.id
                  return (
                    <div key={p.id} onClick={() => setMapDetail(p)} className="hbtn" style={{ border: `1px solid ${active ? '#17150F' : '#E1E5EC'}`, background: active ? '#F7F8FB' : '#fff', borderRadius: 14, padding: '12px 13px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ width: 18, height: 18, display: 'inline-flex' }}><CategoryIcon cat={p.cat} c="#15795A" /></span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{p.type}{p.dist ? ` · ${p.dist}` : ''}</div>
                        </div>
                        {p.dist && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: '#8B8579' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{driveOf(p.dist)}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                        <div onClick={(e) => { e.stopPropagation(); addPlaceTask(p.name) }} className="lift" style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 11, padding: 10, cursor: 'pointer' }}>
                          일정에 추가
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); setMapDetail(p) }} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5A554B', background: '#E9EDF3', borderRadius: 11, padding: '10px 14px', cursor: 'pointer' }}>
                          상세
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!searching && shown.length === 0 && (
                  <div style={{ padding: 26, textAlign: 'center', color: '#B6BCC7', fontSize: 13, fontWeight: 600 }}>{mq ? '검색 결과가 없어요' : '추천 장소가 없어요'}</div>
                )}
              </div>
            </div>

            {/* RIGHT: 실제 카카오맵 */}
            <div className="map-canvas">
              <KakaoMap
                center={selP ? { lat: selP.lat, lng: selP.lng } : { lat: effOrigin.lat, lng: effOrigin.lng }}
                origin={{ lat: effOrigin.lat, lng: effOrigin.lng, label: `출발 · ${effOrigin.label}` }}
                points={shown.map((p) => ({
                  id: p.id,
                  lat: p.lat,
                  lng: p.lng,
                  name: p.name,
                  cat: p.cat,
                  type: p.type,
                  dist: p.dist,
                  selected: mapSelId === p.id,
                  onClick: () => setMapDetail(p),
                }))}
              />
              {/* 내 위치 버튼 */}
              <div
                onClick={useMyLocation}
                title="현재 위치로"
                style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 5, width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #E1E5EC', boxShadow: '0 4px 14px rgba(24,21,15,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill={loc.locating ? '#A39C8E' : '#15795A'}>
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.4A2.4 2.4 0 1 1 12 6.6a2.4 2.4 0 0 1 0 4.8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mapDetail && (
        <PlaceDetailModal
          place={mapDetail}
          isDest={mapSelId === mapDetail.id}
          onClose={() => setMapDetail(null)}
          onAdd={() => {
            addPlaceTask(mapDetail.name)
            setMapDetail(null)
          }}
          onSetOrigin={() => setAsOrigin(mapDetail)}
          onSetDest={() => setAsDest(mapDetail)}
        />
      )}
    </>
  )
}
