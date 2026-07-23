import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { useOverlay } from '@/lib/useOverlay'
import { KakaoMap } from './KakaoMap'
import { safeUrl } from '@/lib/dom'
import type { PlaceCat } from '@/types'

export interface DetailPlace {
  id: string
  name: string
  type: string
  dist: string
  cat: PlaceCat
  lat: number
  lng: number
  address?: string
  placeUrl?: string
}

// 카카오맵 외부 이동 대신 앱 안 모달로 표시.
// placeUrl 있으면 카카오 place 페이지를 iframe으로 임베드(사진·후기·메뉴 포함), 없으면 지도로.
export function PlaceDetailModal({
  place,
  isDest,
  onClose,
  onAdd,
  onSetOrigin,
  onSetDest,
}: {
  place: DetailPlace
  isDest: boolean
  onClose: () => void
  onAdd: () => void
  onSetOrigin: () => void
  onSetDest: () => void
}) {
  useOverlay(true, onClose)
  const embedUrl = safeUrl(place.placeUrl ? place.placeUrl.replace(/^http:/, 'https:') : null)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', height: 680, maxHeight: '92vh', background: '#fff', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(24,21,15,.44)', animation: 'rb-modal .24s ease' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', borderBottom: '1px solid #E6E9F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 18, height: 18, display: 'inline-flex' }}><CategoryIcon cat={place.cat} c="#15795A" /></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{place.type}{place.dist ? ` · ${place.dist}` : ''}</div>
            </div>
          </div>
          <div onClick={onClose} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={15} />
          </div>
        </div>

        {/* body: 카카오 place 페이지 임베드 or 지도 */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#EEF0F3' }}>
          {embedUrl ? (
            <iframe
              title={place.name}
              src={embedUrl}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <KakaoMap center={{ lat: place.lat, lng: place.lng }} points={[{ id: place.id, lat: place.lat, lng: place.lng, name: place.name, cat: place.cat, type: place.type, dist: place.dist, selected: true, onClick: () => {} }]} />
          )}
        </div>

        {/* footer: 출발지/도착지 지정 + 일정 추가 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 18px 16px', borderTop: '1px solid #E6E9F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={onSetOrigin} className="hbtn" style={{ flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#15795A', background: '#E4F2EC', borderRadius: 12, padding: 12, cursor: 'pointer' }}>출발지로 지정</div>
            <div onClick={onSetDest} className="hbtn" style={{ flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: isDest ? '#fff' : '#17150F', background: isDest ? '#17150F' : '#EBEDF0', borderRadius: 12, padding: 12, cursor: 'pointer' }}>{isDest ? '도착지 지정됨' : '도착지로 지정'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={onAdd} className="lift" style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 12, padding: 13, cursor: 'pointer' }}>일정에 추가</div>
            {embedUrl && (
              <div onClick={() => embedUrl && window.open(embedUrl, '_blank', 'noopener')} style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#5A554B', background: '#E9EDF3', borderRadius: 12, padding: '13px 16px', cursor: 'pointer' }}>새 탭</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
