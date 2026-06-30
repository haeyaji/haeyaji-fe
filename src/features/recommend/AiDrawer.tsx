import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { PLACES } from '@/lib/mockData'
import { dayMeta, dayWeather, recsFor } from '@/lib/weather'
import { useAppStore } from '@/store/useAppStore'
import { useChatStore } from '@/store/useChatStore'
import { useMapStore } from '@/store/useMapStore'
import { useTodoStore } from '@/store/useTodoStore'

const QUICK: { qtype: 'general' | 'indoor' | 'walk' | 'cafe' | 'food'; label: string; chip: string }[] = [
  { qtype: 'general', label: '오늘 날씨에 맞는 곳 추천해줘', chip: '오늘 날씨에 맞는 곳' },
  { qtype: 'indoor', label: '비 올 때 갈 만한 실내 추천', chip: '비 올 때 실내' },
  { qtype: 'walk', label: '근처 산책 코스 추천', chip: '산책 코스' },
  { qtype: 'cafe', label: '집중 잘 되는 카페 추천', chip: '카페' },
  { qtype: 'food', label: '근처 맛집 추천', chip: '맛집' },
]

export function AiDrawer() {
  const { aiOpen, closeAi, openMap, selId } = useAppStore()
  const { chat, input, setInput, send, handleQuick } = useChatStore()
  const setMapSel = useMapStore((s) => s.setMapSel)
  const addPlaceTask = useTodoStore((s) => s.addPlaceTask)

  if (!aiOpen) return null

  const meta = dayMeta(selId)
  const w = dayWeather(selId)
  const dateShort = `5월 ${meta.date}일 (${meta.dow})`
  const fitMap: Record<string, number> = {}
  recsFor(w.cond).forEach((r) => (fitMap[r.id] = r.fit))

  const onMap = (pid: string) => {
    setMapSel(pid)
    openMap()
  }

  return (
    <>
      <div onClick={closeAi} style={overlay} />
      <div style={drawer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '20px 22px', background: '#fff', borderBottom: '1px solid #EDEAE2' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.6 4.9 4.9 1.6-4.9 1.6L12 15l-1.6-4.9L5.5 8.5l4.9-1.6z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>추천 도우미</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#A39C8E' }}>{dateShort} 날씨·위치 기반 장소 추천</div>
          </div>
          <div onClick={closeAi} style={closeBtn}><CloseIcon /></div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chat.map((m, i) => {
            const isU = m.role === 'user'
            const places = (m.places ?? []).map((pid) => PLACES.find((p) => p.id === pid)!).filter(Boolean)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isU ? 'flex-end' : 'flex-start', gap: 9, animation: 'rb-pop .2s ease' }}>
                <div
                  style={{
                    maxWidth: '84%',
                    padding: '12px 15px',
                    borderRadius: isU ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.55,
                    background: isU ? '#15795A' : '#fff',
                    color: isU ? '#fff' : '#17150F',
                    border: isU ? 'none' : '1px solid #EAE6DD',
                  }}
                >
                  {m.text}
                </div>
                {places.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    {places.map((p) => (
                      <div key={p.id} style={{ background: '#fff', border: '1px solid #EAE6DD', borderRadius: 16, padding: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 18, height: 18, display: 'inline-flex' }}><CategoryIcon cat={p.cat} c="#15795A" /></span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{p.name}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{p.type} · {p.dist}</div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '4px 9px', borderRadius: 20 }}>적합 {fitMap[p.id] ?? 88}%</div>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#6B665C', lineHeight: 1.5, marginTop: 11 }}>{p.why}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                          <div onClick={() => addPlaceTask(p.name)} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 11, padding: 10, cursor: 'pointer' }}>일정에 추가</div>
                          <div onClick={() => onMap(p.id)} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5A554B', background: '#F1EEE7', borderRadius: 11, padding: '10px 14px', cursor: 'pointer' }}>지도</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '8px 18px 4px' }}>
          {QUICK.map((q) => (
            <div key={q.chip} onClick={() => handleQuick(q.qtype, q.label)} style={{ whiteSpace: 'nowrap', padding: '8px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, color: '#5A554B', background: '#fff', border: '1px solid #EAE6DD', cursor: 'pointer', flexShrink: 0 }}>
              {q.chip}
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 18px 18px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder="추천받고 싶은 걸 물어보세요"
            style={{ flex: 1, border: '1px solid #EAE6DD', outline: 'none', background: '#fff', borderRadius: 13, padding: '12px 15px', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: '#17150F' }}
          />
          <div onClick={send} style={{ width: 42, height: 42, borderRadius: 13, background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </>
  )
}

const overlay = { position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(24,21,15,.3)', animation: 'rb-fade .18s ease' } as const
const drawer = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 41,
  width: 418,
  maxWidth: '100%',
  background: '#EEEBE3',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-26px 0 56px rgba(24,21,15,.2)',
  animation: 'rb-drawer .3s cubic-bezier(.22,1,.36,1)',
} as const
const closeBtn = { width: 30, height: 30, borderRadius: 10, background: '#F1EEE7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as const
