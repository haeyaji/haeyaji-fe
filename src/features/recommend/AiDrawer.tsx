import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { dayMeta, dayWeather } from '@/lib/weather'
import { useAppStore } from '@/store/useAppStore'
import { useChatStore, type SendCtx } from '@/store/useChatStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Category, PlaceCat, RecommendedTodo } from '@/types'

// Kakao는 한국 좌표만 유효 → geolocation 없으면 기본값(강남)
const DEFAULT_LOC = { lat: 37.4979, lng: 127.0276 }

const QUICK: { chip: string; text: string }[] = [
  { chip: '오늘 날씨에 맞는 곳', text: '오늘 날씨에 맞는 곳 추천해줘' },
  { chip: '비 올 때 실내', text: '비 올 때 갈 만한 실내 추천' },
  { chip: '산책 코스', text: '근처 산책 코스 추천' },
  { chip: '카페', text: '집중 잘 되는 카페 추천' },
  { chip: '맛집', text: '근처 맛집 추천' },
]

const CAT_ICON: Record<Category, PlaceCat> = {
  '맛집/카페': 'cafe',
  야외: 'park',
  실내: 'culture',
  휴식: 'cafe',
  생산성: 'culture',
  사람만나기: 'food',
}

function fmtDist(m: number | null): string | null {
  if (m == null) return null
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`
}

export function AiDrawer() {
  const { aiOpen, closeAi, selId } = useAppStore()
  const { chat, input, loading, setInput, send, ask } = useChatStore()
  const addPlaceTask = useTodoStore((s) => s.addPlaceTask)
  const geo = useGeolocation()

  if (!aiOpen) return null

  const meta = dayMeta(selId)
  const w = dayWeather(selId)
  const dateShort = `5월 ${meta.date}일 (${meta.dow})`
  const ctx: SendCtx = {
    lat: geo.lat ?? DEFAULT_LOC.lat,
    lng: geo.lng ?? DEFAULT_LOC.lng,
    weather: `${w.condKo}, ${w.temp}도`,
  }

  return (
    <>
      <div onClick={closeAi} style={overlay} />
      <div style={drawer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '20px 22px', background: '#fff', borderBottom: '1px solid #E4E7EE' }}>
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
            const todos = m.todos ?? []
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
                    border: isU ? 'none' : '1px solid #E1E5EC',
                  }}
                >
                  {m.text}
                </div>
                {todos.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    {todos.map((t, j) => (
                      <TodoCard key={j} todo={t} onAdd={() => addPlaceTask(t.placeName || t.title)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {loading && <TypingBubble />}
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '8px 18px 4px' }}>
          {QUICK.map((q) => (
            <div key={q.chip} onClick={() => !loading && ask(q.text, ctx)} style={{ whiteSpace: 'nowrap', padding: '8px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, color: '#5A554B', background: '#fff', border: '1px solid #E1E5EC', cursor: loading ? 'default' : 'pointer', flexShrink: 0, opacity: loading ? 0.5 : 1 }}>
              {q.chip}
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 18px 18px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter는 무시 (끝 글자 중복 방지)
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(ctx)
              }
            }}
            placeholder="추천받고 싶은 걸 물어보세요"
            style={{ flex: 1, border: '1px solid #E1E5EC', outline: 'none', background: '#fff', borderRadius: 13, padding: '12px 15px', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: '#17150F' }}
          />
          <div onClick={() => send(ctx)} style={{ width: 42, height: 42, borderRadius: 13, background: loading ? '#8B8579' : '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'default' : 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </>
  )
}

function TodoCard({ todo, onAdd }: { todo: RecommendedTodo; onAdd: () => void }) {
  const headline = todo.placeName || todo.title
  const cat = CAT_ICON[todo.category] ?? 'culture'
  const dist = fmtDist(todo.distanceM)
  const metaParts = [todo.category, dist].filter(Boolean).join(' · ')
  return (
    <div style={{ background: '#fff', border: '1px solid #E1E5EC', borderRadius: 16, padding: 15 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 18, height: 18, display: 'inline-flex' }}><CategoryIcon cat={cat} c="#15795A" /></span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{headline}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{metaParts}</div>
        </div>
        {todo.estimatedMinutes > 0 && (
          <div style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '4px 9px', borderRadius: 20, flexShrink: 0 }}>{todo.estimatedMinutes}분</div>
        )}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: '#6B665C', lineHeight: 1.5, marginTop: 11 }}>{todo.reason}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
        <div onClick={onAdd} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 11, padding: 10, cursor: 'pointer' }}>일정에 추가</div>
        {todo.placeUrl && (
          <div onClick={() => window.open(todo.placeUrl!, '_blank', 'noopener')} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5A554B', background: '#E9EDF3', borderRadius: 11, padding: '10px 14px', cursor: 'pointer' }}>지도</div>
        )}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', padding: '13px 16px', borderRadius: '15px 15px 15px 5px', background: '#fff', border: '1px solid #E1E5EC', animation: 'rb-pop .2s ease' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#A39C8E', animation: `rb-twinkle 1s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
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
  background: 'var(--canvas)',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-26px 0 56px rgba(24,21,15,.2)',
  animation: 'rb-drawer .3s cubic-bezier(.22,1,.36,1)',
} as const
const closeBtn = { width: 30, height: 30, borderRadius: 10, background: '#E9EDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as const
