import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { KakaoMap } from './KakaoMap'
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

// 카카오맵 외부 페이지 대신 앱 안 모달로 장소를 지도+정보로 표시
export function PlaceDetailModal({ place, onClose, onAdd }: { place: DetailPlace; onClose: () => void; onAdd: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,21,15,.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 100px rgba(24,21,15,.44)', animation: 'rb-modal .24s ease' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: 19, height: 19, display: 'inline-flex' }}><CategoryIcon cat={place.cat} c="#15795A" /></span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{place.type}{place.dist ? ` · ${place.dist}` : ''}</div>
            </div>
          </div>
          <div onClick={onClose} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: '#F0F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon w={15} />
          </div>
        </div>

        {/* interactive map */}
        <div style={{ position: 'relative', height: 280, borderTop: '1px solid #E6E9F0', borderBottom: '1px solid #E6E9F0' }}>
          <KakaoMap
            center={{ lat: place.lat, lng: place.lng }}
            points={[{ id: place.id, lat: place.lat, lng: place.lng, name: place.name, cat: place.cat, type: place.type, dist: place.dist, selected: true, onClick: () => {} }]}
          />
        </div>

        {/* info + actions */}
        <div style={{ padding: '16px 20px 20px' }}>
          {place.address && <div style={{ fontSize: 13, fontWeight: 500, color: '#6B665C', lineHeight: 1.55 }}>{place.address}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: place.address ? 14 : 0 }}>
            <div onClick={onAdd} className="lift" style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 12, padding: 13, cursor: 'pointer' }}>일정에 추가</div>
            {place.placeUrl && (
              <div onClick={() => window.open(place.placeUrl!, '_blank', 'noopener')} style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#5A554B', background: '#E9EDF3', borderRadius: 12, padding: '13px 16px', cursor: 'pointer' }}>카카오맵</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
