import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { PLACES } from '@/lib/mockData'
import { useDayWeather, recsFor } from '@/lib/weather'
import { dowLabel } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useMapStore } from '@/store/useMapStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useChatStore } from '@/store/useChatStore'
import { searchPlaces } from '@/api/placeApi'
import { KakaoMap } from './KakaoMap'
import { PlaceDetailModal } from './PlaceDetailModal'
import type { Category, PlaceCat } from '@/types'

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

// 두 좌표 간 거리(m) — 화면 반경 계산용 (하버사인)
function distM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const t = Math.PI / 180
  const dLat = (lat2 - lat1) * t
  const dLng = (lng2 - lng1) * t
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const km = (s: string) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0
const kmUnit = (s: string) => /km/i.test(s)
const driveOf = (s: string) => `${Math.max(3, Math.round((kmUnit(s) ? km(s) : km(s) / 1000) * 3.4))}분`
const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`)

// nlp category → 지도 아이콘/검색 키워드
const NLP_CAT_ICON: Record<Category, PlaceCat> = {
  '맛집/카페': 'cafe', 야외: 'park', 실내: 'culture', 휴식: 'cafe', 생산성: 'culture', 사람만나기: 'food',
}
const NLP_CAT_KEYWORD: Record<Category, string> = {
  '맛집/카페': '맛집', 야외: '공원', 실내: '전시', 휴식: '카페', 생산성: '카페', 사람만나기: '맛집',
}

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
  const [zoomNotice, setZoomNotice] = useState(false)
  const [needsResearch, setNeedsResearch] = useState(false) // 지도가 검색 시점과 달라짐 → "다시 검색" 버튼
  const mapObj = useRef<any>(null)
  const lastSearch = useRef<{ lat: number; lng: number; kw: string; span: number } | null>(null)
  const chat = useChatStore((s) => s.chat)

  // nlp 최신 추천(좌표 보유) → 추천 핀
  const nlpPins: MapPlace[] = useMemo(() => {
    for (let i = chat.length - 1; i >= 0; i--) {
      const m = chat[i]
      if (m.role === 'assistant' && m.todos?.some((t) => t.x != null && t.y != null && t.placeName)) {
        return m.todos
          .filter((t) => t.x != null && t.y != null && t.placeName)
          .map((t, j) => ({
            id: t.placeUrl?.split('/').pop() ?? `nlp-${j}`,
            name: t.placeName!,
            type: t.category,
            dist: t.distanceM != null ? fmtDist(t.distanceM) : '',
            cat: NLP_CAT_ICON[t.category] ?? 'culture',
            lat: t.y!,
            lng: t.x!,
            placeUrl: t.placeUrl ?? undefined,
          }))
      }
    }
    return []
  }, [chat])

  // 자동 재검색 키워드: 사용자 검색어 > nlp 추천 카테고리
  const nlpKeyword = nlpPins.length > 0 ? (NLP_CAT_KEYWORD[nlpPins[0].type as Category] ?? '') : ''
  const activeKeyword = mapSearch.trim() || nlpKeyword
  const [mapDetail, setMapDetail] = useState<MapPlace | null>(null) // 장소 상세 iframe 모달

  // 출발지 = 사용자 지정 우선, 없으면 현위치(폴백 강남)
  const effOrigin = origin ?? { lat: loc.lat, lng: loc.lng, label: '현위치' }

  // 지도 열 때마다 현재 위치 재요청
  useEffect(() => {
    if (mapOpen) useLocationStore.getState().locate()
  }, [mapOpen])

  // ── "이 지역에서 다시 검색" (수동) ────────────────────────────
  // 현재 화면 중심+반경으로 be 카카오 로컬 프록시(/places/search) 호출.
  // 카카오 REST 의존은 be가 보유 — fe는 지도 이동만으론 호출하지 않고(쿼터 절약),
  // 키워드 입력·"다시 검색" 버튼 클릭에서만 부른다.
  const runBrowse = async (map: any) => {
    if (!map || !activeKeyword) return
    setNeedsResearch(false)
    // 과한 줌아웃이면 생략
    if (map.getLevel() >= 8) {
      setZoomNotice(true)
      setResults([])
      return
    }
    setZoomNotice(false)
    const c = map.getCenter()
    const b = map.getBounds()
    const ne = b.getNorthEast()
    const spanLng = Math.abs(ne.getLng() - b.getSouthWest().getLng())
    lastSearch.current = { lat: c.getLat(), lng: c.getLng(), kw: activeKeyword, span: spanLng }
    // 반경 = 중심~화면 모서리 거리 (viewport 외접원, 카카오 radius 상한 20km)
    const radiusM = Math.min(20000, Math.max(200, distM(c.getLat(), c.getLng(), ne.getLat(), ne.getLng())))
    setSearching(true)
    try {
      const places = await searchPlaces(activeKeyword, c.getLat(), c.getLng(), radiusM, 15)
      const pinIds = new Set(nlpPins.map((p) => p.id))
      setResults(
        places
          .map((d) => ({
            id: d.url?.split('/').pop() ?? `${d.x},${d.y}`, // 추천 핀 id와 같은 규칙(placeUrl 끝 id)
            name: d.name,
            type: d.category || '장소',
            dist: d.distanceM != null ? fmtDist(d.distanceM) : '',
            cat: catOf(d.category || ''),
            lat: d.y,
            lng: d.x,
            placeUrl: d.url ?? undefined,
            address: d.address,
          }))
          .filter((p) => !pinIds.has(p.id)), // 추천 핀과 겹치면 추천 우선
      )
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  // 지도 멈춤: 검색 시점보다 화면이 충분히 달라졌으면 "다시 검색" 버튼만 노출 (API 호출 X)
  const onMapIdle = (map: any) => {
    mapObj.current = map
    if (!activeKeyword) return
    if (map.getLevel() < 8) setZoomNotice(false)
    const last = lastSearch.current
    if (!last || last.kw !== activeKeyword) {
      runBrowse(map) // 이 키워드로는 첫 검색 → 자동 1회
      return
    }
    const c = map.getCenter()
    const b = map.getBounds()
    const spanLng = Math.abs(b.getNorthEast().getLng() - b.getSouthWest().getLng())
    const moved = Math.hypot(c.getLng() - last.lng, c.getLat() - last.lat)
    const zoomed = Math.abs(spanLng - last.span) / last.span > 0.2
    setNeedsResearch(moved >= spanLng * 0.15 || zoomed)
  }

  // 키워드 변경(입력/추천 갱신) 시 현재 화면에서 즉시 재검색
  useEffect(() => {
    if (!activeKeyword) {
      setResults([])
      setZoomNotice(false)
      setNeedsResearch(false)
      return
    }
    const t = setTimeout(() => mapObj.current && runBrowse(mapObj.current), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKeyword])

  // 훅은 early return보다 항상 먼저 (훅 순서 위반 방지)
  const w = useDayWeather(selId)

  if (!mapOpen) return null

  const mapHint = `${dowLabel(selId)}요일 · ${w.condKo} 기준 · 내 주변`
  const recIds = recsFor(w.cond)

  const mockRec: MapPlace[] = recIds
    .map((r) => PLACES.find((x) => x.id === r.id))
    .filter((p): p is (typeof PLACES)[number] => !!p)
    .map((p) => ({ id: p.id, name: p.name, type: p.type, dist: p.dist, cat: p.cat, lat: p.lat, lng: p.lng }))
  // 추천 핀: nlp 추천(좌표) 우선, 없으면 mock 폴백
  const recPins: MapPlace[] = nlpPins.length > 0 ? nlpPins : mockRec

  // 목록: 탐색 중이면 탐색 결과, 아니면 추천
  const shown: MapPlace[] = activeKeyword ? results : recPins
  const selP = [...recPins, ...results].find((p) => p.id === mapSelId) ?? null
  const listTitle = activeKeyword ? (searching ? '검색 중…' : `'${activeKeyword}' · 이 지역 결과`) : '오늘 추천 장소'
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
      <div onClick={closeMap} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--canvas)', display: 'flex', animation: 'rb-fade .16s ease' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'rb-modal .24s ease' }}>
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
                  <div style={{ padding: 26, textAlign: 'center', color: '#B6BCC7', fontSize: 13, fontWeight: 600 }}>{activeKeyword ? (zoomNotice ? '지도를 확대한 뒤 다시 검색해주세요' : '이 지역엔 없어요') : '추천 장소가 없어요'}</div>
                )}
              </div>
            </div>

            {/* RIGHT: 실제 카카오맵 */}
            <div className="map-canvas">
              <KakaoMap
              center={selP ? { lat: selP.lat, lng: selP.lng } : { lat: effOrigin.lat, lng: effOrigin.lng }}
              origin={{ lat: effOrigin.lat, lng: effOrigin.lng, label: `출발 · ${effOrigin.label}` }}
              points={recPins.map((p) => ({
                id: p.id, lat: p.lat, lng: p.lng, name: p.name, cat: p.cat, type: p.type, dist: p.dist,
                selected: mapSelId === p.id,
                onClick: () => setMapDetail(p),
              }))}
              browsePoints={results.map((p) => ({
                id: p.id, lat: p.lat, lng: p.lng, name: p.name, cat: p.cat, type: p.type, dist: p.dist,
                selected: false,
                onClick: () => setMapDetail(p),
              }))}
              onIdle={onMapIdle}
            />
            {/* 검색 상태 표시 */}
            {(searching || (zoomNotice && activeKeyword)) && (
              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 6, background: 'rgba(23,21,15,.82)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 20, animation: 'rb-fade .15s ease' }}>
                {searching ? `'${activeKeyword}' 검색 중…` : '지도를 확대한 뒤 다시 검색해주세요'}
              </div>
            )}
            {/* 이 지역에서 다시 검색 (지도를 옮겼을 때만, 클릭 시에만 호출) */}
            {needsResearch && !searching && !zoomNotice && (
              <div
                onClick={() => mapObj.current && runBrowse(mapObj.current)}
                className="lift"
                style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', alignItems: 'center', gap: 7, background: '#fff', color: '#15795A', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 20, boxShadow: '0 4px 14px rgba(24,21,15,.2)', cursor: 'pointer', animation: 'rb-pop .18s ease' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15795A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <path d="M21 3v6h-6" />
                </svg>
                이 지역에서 다시 검색
              </div>
            )}
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
