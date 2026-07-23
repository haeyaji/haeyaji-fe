import { useEffect, useRef, useState } from 'react'
import { CategoryIcon, CloseIcon } from '@/lib/icons'
import { safeUrl } from '@/lib/dom'
import { useDayWeather } from '@/lib/weather'
import { dateShortLabel } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { useChatStore, type SendCtx } from '@/store/useChatStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useLocationStore } from '@/store/useLocationStore'
import type { Category, PlaceCat, RecommendedTodo } from '@/types'
import { REC_CATEGORY_LABEL, REC_CATEGORY_EMOJI } from './recCategories'

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
  const { aiOpen, closeAi, weatherSelId: selId } = useAppStore()
  const { chat, input, loading, setInput, send, ask, chooseCategory } = useChatStore()
  const addPlaceTask = useTodoStore((s) => s.addPlaceTask)
  const loc = useLocationStore()
  const w = useDayWeather(selId) // 훅은 early return보다 먼저
  const scrollRef = useRef<HTMLDivElement>(null)
  // 2단계 흐름: 개인화 신호는 1단계 카테고리 선택(chooseCategory)에서만 전송. 장소 카드는 순수 todo 추가.
  const select = (t: RecommendedTodo) => {
    addPlaceTask({ title: t.placeName || t.title, placeName: t.placeName, placeUrl: t.placeUrl, lat: t.y, lng: t.x })
  }

  // 플로팅 위젯 크기 (좌상단 그립 드래그로 조절 — 우하단 앵커 고정)
  const [size, setSize] = useState({ w: 404, h: 640 })
  const onGripDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
    const move = (ev: PointerEvent) => {
      setSize({
        w: Math.min(720, Math.max(340, start.w + (start.x - ev.clientX))),
        h: Math.min(window.innerHeight - 140, Math.max(460, start.h + (start.y - ev.clientY))),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // 새 메시지/로딩 시 맨 아래로 자동 스크롤
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.length, loading, aiOpen])

  if (!aiOpen) return null

  const dateShort = dateShortLabel(selId)
  const ctx: SendCtx = {
    lat: loc.lat,
    lng: loc.lng,
    weather: `${w.condKo}, ${w.temp}도`,
  }

  return (
    <>
      {/* 플로팅 챗 위젯 (채널톡 스타일) — 백드롭 없이 페이지와 공존, FAB 위 앵커 */}
      <div style={{ position: 'fixed', right: 28, bottom: 100, zIndex: 41, width: size.w, height: size.h, background: 'var(--canvas)', borderRadius: 24, boxShadow: '0 24px 70px rgba(24,21,15,.32), 0 4px 16px rgba(24,21,15,.16)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'rb-pop .22s ease' }}>
        {/* 리사이즈 그립 (좌상단 모서리) */}
        <div onPointerDown={onGripDown} title="드래그로 크기 조절" style={{ position: 'absolute', top: 0, left: 0, width: 26, height: 26, cursor: 'nwse-resize', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#B6BCC7" strokeWidth="1.5" strokeLinecap="round"><path d="M1 5V1h4M1 9V1h8" /></svg>
        </div>

        <div style={{ background: '#fff', borderBottom: '1px solid #E4E7EE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px 15px 26px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.6 4.9 4.9 1.6-4.9 1.6L12 15l-1.6-4.9L5.5 8.5l4.9-1.6z" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>추천 도우미</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#A39C8E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateShort} 날씨·위치 기반 장소 추천</div>
          </div>
          <div onClick={closeAi} style={closeBtn}><CloseIcon /></div>
        </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {chat.map((m, i) => {
            const isU = m.role === 'user'
            const todos = m.todos ?? []
            const cats = !isU ? (m.categories ?? []) : [] // 1단계 카테고리 후보
            // 칩: 항상 표시하되, 마지막 어시스턴트 메시지만 활성 (이전 턴은 비활성 — 다단계 흐름 유지)
            const chips = !isU ? (m.options ?? []) : []
            const chipsActive = i === chat.length - 1 && !loading
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isU ? 'flex-end' : 'flex-start', gap: 9, animation: 'rb-pop .2s ease' }}>
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '14px 18px',
                    borderRadius: isU ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                    fontSize: 15.5,
                    fontWeight: 600,
                    lineHeight: 1.65,
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
                      <TodoCard key={`${i}-${j}`} todo={t} onAdd={() => select(t)} />
                    ))}
                  </div>
                )}
                {cats.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: '94%' }}>
                    {cats.map((c) => (
                      <div
                        key={c.code}
                        onClick={() => chipsActive && chooseCategory(c, cats.map((x) => x.code), ctx)}
                        className={chipsActive ? 'lift' : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7, padding: '11px 15px', borderRadius: 14, fontSize: 14.5, fontWeight: 800,
                          color: chipsActive ? '#17150F' : '#B6BCC7',
                          background: chipsActive ? '#fff' : '#F0F2F6',
                          border: `1.5px solid ${chipsActive ? '#CDE8DC' : '#E4E7EE'}`,
                          boxShadow: chipsActive ? '0 2px 8px rgba(21,121,90,.08)' : 'none',
                          cursor: chipsActive ? 'pointer' : 'default',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{REC_CATEGORY_EMOJI[c.code] ?? '·'}</span>
                        {REC_CATEGORY_LABEL[c.code] ?? c.code}
                      </div>
                    ))}
                  </div>
                )}
                {chips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxWidth: '92%' }}>
                    {chips.map((opt) => (
                      <div
                        key={opt}
                        onClick={() => chipsActive && ask(opt, ctx)}
                        className={chipsActive ? 'hbtn' : undefined}
                        style={
                          chipsActive
                            ? { padding: '9px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#15795A', background: '#E4F2EC', border: '1px solid #CDE8DC', cursor: 'pointer' }
                            : { padding: '10px 16px', borderRadius: 22, fontSize: 14.5, fontWeight: 700, color: '#B6BCC7', background: '#F0F2F6', border: '1px solid #E4E7EE', cursor: 'default' }
                        }
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {loading && <TypingBubble />}
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '8px 14px 4px', width: '100%' }}>
          {QUICK.map((q) => (
            <div key={q.chip} onClick={() => !loading && ask(q.text, ctx)} style={{ whiteSpace: 'nowrap', padding: '9px 15px', borderRadius: 20, fontSize: 14, fontWeight: 700, color: '#5A554B', background: '#fff', border: '1px solid #E1E5EC', cursor: loading ? 'default' : 'pointer', flexShrink: 0, opacity: loading ? 0.5 : 1 }}>
              {q.chip}
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 14px 14px', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
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
            style={{ flex: 1, border: '1px solid #E1E5EC', outline: 'none', background: '#fff', borderRadius: 14, padding: '14px 17px', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 500, color: '#17150F' }}
          />
          <div onClick={() => send(ctx)} style={{ width: 48, height: 48, borderRadius: 14, background: loading ? '#8B8579' : '#17150F', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'default' : 'pointer' }}>
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
          <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{headline}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#A39C8E', marginTop: 1 }}>{metaParts}</div>
        </div>
        {todo.estimatedMinutes > 0 && (
          <div style={{ fontSize: 11, fontWeight: 800, color: '#15795A', background: '#E4F2EC', padding: '4px 9px', borderRadius: 20, flexShrink: 0 }}>{todo.estimatedMinutes}분</div>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#6B665C', lineHeight: 1.6, marginTop: 12 }}>{todo.reason}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
        <div onClick={onAdd} style={{ flex: 1, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: '#fff', background: '#17150F', borderRadius: 12, padding: 12, cursor: 'pointer' }}>일정에 추가</div>
        {todo.placeUrl && (
          <div onClick={() => { const u = safeUrl(todo.placeUrl); if (u) window.open(u, '_blank', 'noopener') }} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5A554B', background: '#E9EDF3', borderRadius: 11, padding: '10px 14px', cursor: 'pointer' }}>지도</div>
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

const closeBtn = { width: 30, height: 30, borderRadius: 10, background: '#E9EDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as const
