import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { PLACES } from '@/lib/mockData'
import { dayMeta, dayWeather, recsFor } from '@/lib/weather'
import { useAppStore } from '@/store/useAppStore'
import { useMapStore } from '@/store/useMapStore'
import { useTodoStore } from '@/store/useTodoStore'
import type { Place } from '@/types'

const km = (s: string) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0
const driveOf = (s: string) => `${Math.max(3, Math.round(km(s) * 3.4))}분`
const parsePct = (s: string) => parseFloat(s) || 50

export function MapModal() {
  const { mapOpen, closeMap, selId } = useAppStore()
  const { mapSelId, mapSearch, mapOrigin, setMapSel, setMapSearch, setMapOrigin } = useMapStore()
  const addPlaceTask = useTodoStore((s) => s.addPlaceTask)

  if (!mapOpen) return null

  const meta = dayMeta(selId)
  const w = dayWeather(selId)
  const mapHint = `${meta.dow}요일 · ${w.condKo} 기준 추천 장소`
  const recIds = recsFor(w.cond)
  const mq = mapSearch.trim()
  const shown: Place[] = mq
    ? PLACES.filter((p) => (p.name + p.type).toLowerCase().includes(mq.toLowerCase()))
    : recIds.map((r) => PLACES.find((x) => x.id === r.id)!).filter(Boolean)
  const selP = mapSelId ? PLACES.find((x) => x.id === mapSelId) ?? null : null
  const listTitle = mq ? '검색 결과' : '오늘 추천 장소'

  return (
    <div onClick={closeMap} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(24,21,15,.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 1040, maxWidth: '100%', height: 660, maxHeight: '92vh', background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(24,21,15,.42)', animation: 'rb-modal .24s ease' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', borderBottom: '1px solid #EFEBE3' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.4px' }}>추천 장소 지도</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#A39C8E', marginTop: 2 }}>{mapHint}</div>
          </div>
          <div onClick={closeMap} style={{ width: 34, height: 34, borderRadius: 11, background: '#F1EEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={16} />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {/* LEFT */}
          <div style={{ width: 322, flexShrink: 0, borderRight: '1px solid #EFEBE3', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 18px 12px' }}>
              <div style={{ position: 'relative' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A6A095" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" strokeLinecap="round" />
                </svg>
                <input value={mapSearch} onChange={(e) => setMapSearch(e.target.value)} placeholder="장소·주소 검색" style={{ width: '100%', border: '1px solid #EAE6DD', outline: 'none', background: '#F6F4EE', borderRadius: 13, padding: '11px 14px 11px 40px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#17150F' }} />
              </div>

              <div style={{ marginTop: 12, background: '#F6F4EE', borderRadius: 14, padding: '13px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#15795A', flexShrink: 0 }} />
                  <input value={mapOrigin} onChange={(e) => setMapOrigin(e.target.value)} placeholder="출발지" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#17150F' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 14 }}>
                  <div style={{ width: 10, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 2, height: 14, background: '#D8D3C8' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#17150F', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: selP ? '#17150F' : '#BFB9AC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selP ? selP.name : '도착지를 선택하세요'}
                  </div>
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
                    <div style={{ fontSize: 16.5, fontWeight: 800, color: '#0F5A42' }}>자동차 {driveOf(selP.dist)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#3E8C6E', marginTop: 1 }}>{selP.dist} · 가장 빠른 경로</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#A39C8E', padding: '6px 20px 8px' }}>{listTitle}</div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shown.map((p) => {
                const active = mapSelId === p.id
                return (
                  <div key={p.id} onClick={() => setMapSel(p.id)} className="hbtn" style={{ border: `1px solid ${active ? '#17150F' : '#EAE6DD'}`, background: active ? '#FBFAF7' : '#fff', borderRadius: 14, padding: '12px 13px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ width: 18, height: 18, display: 'inline-flex' }}><CategoryIcon cat={p.cat} c="#15795A" /></span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{p.type} · {p.dist}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: '#8B8579' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{driveOf(p.dist)}</div>
                      </div>
                    </div>
                    {active && (
                      <div onClick={(e) => { e.stopPropagation(); addPlaceTask(p.name) }} className="lift" style={{ marginTop: 11, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 11, padding: 10, cursor: 'pointer' }}>
                        이 장소를 일정에 추가
                      </div>
                    )}
                  </div>
                )
              })}
              {shown.length === 0 && <div style={{ padding: 26, textAlign: 'center', color: '#BFB9AC', fontSize: 13, fontWeight: 600 }}>검색 결과가 없어요</div>}
            </div>
          </div>

          {/* RIGHT: stylized map */}
          <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#E7E3D8' }} />
            <div style={{ position: 'absolute', left: '-10%', top: '46%', width: '130%', height: '32%', transform: 'rotate(-9deg)', background: '#C7D6E2' }} />
            <div style={{ position: 'absolute', left: '9%', top: '13%', width: '30%', height: '26%', borderRadius: '46%', background: '#CFDDBE' }} />
            <div style={{ position: 'absolute', right: '13%', top: '54%', width: '24%', height: '22%', borderRadius: '50%', background: '#CFDDBE' }} />
            <div style={{ position: 'absolute', left: 0, top: '32%', width: '100%', height: 3, background: 'rgba(255,255,255,.7)', transform: 'rotate(5deg)' }} />
            <div style={{ position: 'absolute', left: '38%', top: 0, width: 3, height: '100%', background: 'rgba(255,255,255,.65)', transform: 'rotate(3deg)' }} />

            {selP && (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <line x1={18} y1={80} x2={parsePct(selP.left)} y2={parsePct(selP.top)} stroke="#17150F" strokeWidth="0.6" strokeDasharray="2 2" strokeLinecap="round" opacity="0.5" />
              </svg>
            )}

            <div style={{ position: 'absolute', left: '18%', top: '80%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 13px 6px 7px', borderRadius: 22, background: '#15795A', boxShadow: '0 6px 16px rgba(24,21,15,.24)' }}>
              <div style={{ width: 23, height: 23, borderRadius: '50%', background: 'rgba(255,255,255,.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="5" /></svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>출발 · 현재 위치</div>
            </div>

            {shown.map((p) => {
              const active = mapSelId === p.id
              return (
                <div key={p.id} onClick={() => setMapSel(p.id)} style={{ position: 'absolute', left: p.left, top: p.top, transform: 'translate(-50%,-100%)', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px 7px 8px', borderRadius: 22, cursor: 'pointer', background: active ? '#17150F' : '#fff', boxShadow: '0 6px 16px rgba(24,21,15,.22)' }}>
                  <div style={{ width: 25, height: 25, borderRadius: '50%', background: '#15795A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 13, height: 13, display: 'inline-flex' }}><CategoryIcon cat={p.cat} c="#fff" /></span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: active ? '#fff' : '#17150F' }}>{p.name.replace(' (페리 빌딩)', '')}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
