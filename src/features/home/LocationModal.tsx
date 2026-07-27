// 위치 검색 — 지명/주소 입력 → be 지오코딩(/places/geocode) → 위치 지정. 날씨·추천이 새 위치로 갱신.
import { useState } from 'react'
import { useOverlay } from '@/lib/useOverlay'
import { CloseIcon } from '@/lib/icons'
import { geocode } from '@/api/placeApi'
import { useLocationStore } from '@/store/useLocationStore'
import { useAppStore } from '@/store/useAppStore'
import { MC } from '@/features/meetup/tokens'

export function LocationModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const setLocation = useLocationStore((s) => s.setLocation)
  const locate = useLocationStore((s) => s.locate)
  const toast = useAppStore((s) => s.toast)
  useOverlay(true, onClose)

  const submit = async () => {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true); setNotFound(false)
    const c = await geocode(query)
    setBusy(false)
    if (!c) { setNotFound(true); return }
    setLocation(c.lat, c.lng, query)
    toast(`위치를 '${query}'(으)로 바꿨어요`)
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(30,28,23,.44)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'rb-fade .16s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 22, boxShadow: '0 40px 90px rgba(30,28,23,.4)', animation: 'rb-modal .22s ease', padding: '22px 26px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>위치 설정</div>
          <div style={{ flex: 1 }} />
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 11, background: MC.chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CloseIcon w={15} /></div>
        </div>

        <div style={{ position: 'relative' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A6A296" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
          <input
            autoFocus value={q}
            onChange={(e) => { setQ(e.target.value); setNotFound(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
            placeholder="동네·역·주소 (예: 강남역, 서울시청)"
            style={{ width: '100%', border: `1px solid ${notFound ? '#E5A79C' : MC.border}`, outline: 'none', background: MC.fieldBg, borderRadius: 13, padding: '12px 14px 12px 40px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: MC.ink }}
          />
        </div>
        {notFound && <div style={{ fontSize: 13, fontWeight: 700, color: '#C0645C', marginTop: 8, paddingLeft: 2 }}>'{q}' 위치를 찾지 못했어요. 다르게 입력해보세요.</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div onClick={() => { locate(); toast('현재 위치로 이동해요'); onClose() }} className="hbtn" style={{ flex: 1, textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: MC.muted, background: MC.chipBg, borderRadius: 13, padding: 13, cursor: 'pointer' }}>현재 위치로</div>
          <div onClick={() => void submit()} className="lift" style={{ flex: 1, textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: '#fff', background: busy ? '#9AA7A0' : MC.primary, borderRadius: 13, padding: 13, cursor: busy ? 'default' : 'pointer' }}>{busy ? '찾는 중…' : '이 위치로 설정'}</div>
        </div>
      </div>
    </div>
  )
}
