// 마이페이지 — 디자인 핸드오프 반영: 히어로(완료율 링 + 주간 날씨), 통계 벤토(친구·약속·이번주), 내 취향.
import { useState, useEffect } from 'react'
import { WeatherIcon } from '@/lib/icons'
import { last7Days, next7Days, dowLabel, todayKey } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore } from '@/store/usePrefStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { useWeatherStore } from '@/store/useWeatherStore'
import { PrefIcon } from './prefIcons'
import { FriendSearchModal } from './FriendSearchModal'
import { FriendDetailModal } from './FriendDetailModal'
import { MC } from '@/features/meetup/tokens'
import { Avatar, AvatarStack } from '@/features/meetup/meetupShared'
import type { AppUser, WeatherCond } from '@/types'

function Ring({ rate, size = 104, sw = 10 }: { rate: number; size?: number; sw?: number }) {
  const R = (size - sw) / 2
  const c = 2 * Math.PI * R
  const off = c * (1 - rate / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#EEEBE2" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={MC.primary} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 27, fontWeight: 800, color: MC.ink, letterSpacing: '-.5px' }}>{rate}%</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: MC.muted, marginTop: 1 }}>이번 주 완료</div>
      </div>
    </div>
  )
}

export function MyPage() {
  const nickname = usePrefStore((s) => s.nickname)
  const setView = useAppStore((s) => s.setView)
  const searchOpen = useAppStore((s) => s.friendSearchOpen)
  const openFriendSearch = useAppStore((s) => s.openFriendSearch)
  const closeFriendSearch = useAppStore((s) => s.closeFriendSearch)
  const pref = usePrefStore()
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const friendIds = useFriendStore((s) => s.friendIds)
  const meetups = useMeetupStore((s) => s.meetings)
  const loadMeetings = useMeetupStore((s) => s.loadList)
  const byDate = useWeatherStore((s) => s.byDate)
  useEffect(() => { void loadMeetings() }, [loadMeetings])
  // 최근 7일 할 일 로드 (완료율 링이 조각나지 않게 한 번에)
  useEffect(() => { last7Days().forEach((k) => void useTodoStore.getState().loadDate(k)) }, [])

  const [detailUser, setDetailUser] = useState<AppUser | null>(null)

  const week = last7Days()
  const flat = week.flatMap((k) => tasksByDate[k] ?? [])
  const rate = flat.length ? Math.round((flat.filter((t) => t.done).length / flat.length) * 100) : 0
  const weekDays = week.map((k) => {
    const ts = tasksByDate[k] ?? []
    return { dow: dowLabel(k), done: ts.length > 0 && ts.every((t) => t.done), today: k === todayKey() }
  })
  const weekDoneCnt = weekDays.filter((d) => d.done).length

  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const pendingCount = meetups.filter((m) => m.status !== 'CONFIRMED').length
  const confirmedCount = meetups.filter((m) => m.status === 'CONFIRMED').length
  const hasPrefs = pref.preferredCategories.length > 0 || pref.avoid.length > 0 || pref.vibe || pref.intensity

  const heroWeather = next7Days().map((k, i) => {
    const raw = byDate[k]
    const cond = (raw && ['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? raw.cond : 'cloudy') as WeatherCond
    return { k, i, cond, temp: raw?.temp ?? null, label: i === 0 ? '오늘' : dowLabel(k) }
  })
  const condColor = (c: WeatherCond) => (c === 'sunny' ? MC.amber : c === 'rainy' ? '#6E8FB0' : c === 'snowy' ? '#7FA8C9' : '#9AA0A6')

  const statCard: React.CSSProperties = { background: '#fff', borderRadius: 22, boxShadow: '0 1px 2px rgba(30,28,23,.05), 0 8px 22px rgba(30,28,23,.05)', padding: '18px 20px' }
  const badge = (icon: React.ReactNode, value: string, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: MC.tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.6px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: 'var(--canvas)' }}>
      <div className="mp-wrap">
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px' }}>마이페이지</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: MC.muted, marginTop: 5, marginBottom: 22 }}>내 취향과 친구를 관리하고, 함께 약속을 잡아보세요</div>

        {/* 히어로 */}
        <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', background: '#fff', border: '1px solid #ECE9E0', boxShadow: '0 1px 2px rgba(30,28,23,.05), 0 10px 28px rgba(30,28,23,.06)', marginBottom: 16 }}>
          <div style={{ position: 'absolute', top: -40, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(234,243,238,.9), rgba(234,243,238,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <Avatar name={nickname} size={78} font={34} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px' }}>{nickname}</div>
                {pref.vibe && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: MC.tintBg, color: MC.tintText, fontSize: 12.5, fontWeight: 800, padding: '5px 11px', borderRadius: 20 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={MC.primary}><path d="M12 2l1.6 4.9 4.9 1.6-4.9 1.6L12 15l-1.6-4.9L5.5 8.5l4.9-1.6z" /></svg>
                    {pref.vibe}
                  </span>
                )}
              </div>
            </div>
            <Ring rate={rate} />
          </div>
          <div style={{ position: 'relative', borderTop: '1px solid #F0EEE7', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: MC.muted, padding: '0 8px', flexShrink: 0, lineHeight: 1.3 }}>이번 주<br />날씨</div>
            <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
              {heroWeather.map((d) => (
                <div key={d.k} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: d.i === 0 ? MC.tintBg : MC.fieldBg, borderRadius: 12, padding: '9px 2px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: d.i === 0 ? MC.tintText : MC.muted }}>{d.label}</div>
                  <div style={{ width: 22, height: 22 }}><WeatherIcon cond={d.cond} c={condColor(d.cond)} /></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: MC.muted }}>{d.temp != null ? `${d.temp}°` : '–'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 벤토 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20, alignItems: 'start' }}>
          <div onClick={openFriendSearch} className="lift" style={{ ...statCard, cursor: 'pointer' }}>
            {badge(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, `${friends.length}`, '친구')}
            <div style={{ marginTop: 14 }}>{friends.length > 0 ? <AvatarStack names={friends.map((f) => f.nickname)} /> : <div style={{ fontSize: 12.5, fontWeight: 700, color: MC.faint }}>아직 없어요</div>}</div>
          </div>

          <div onClick={() => setView('meetup')} className="lift" style={{ ...statCard, cursor: 'pointer' }}>
            {badge(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4" /></svg>, `${meetups.length}`, '약속')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEEDE7', color: '#6B6759', fontSize: 12, fontWeight: 800, padding: '6px 11px', borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9A9689' }} />조율 중 {pendingCount}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: MC.tintBg, color: MC.tintText, fontSize: 12, fontWeight: 800, padding: '6px 11px', borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: MC.primary }} />확정 {confirmedCount}</span>
            </div>
          </div>

          <div style={statCard}>
            {badge(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MC.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>, `${weekDoneCnt}일`, '7일 중 완료')}
            <div style={{ display: 'flex', gap: 7, marginTop: 16 }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: '100%', maxWidth: 18, height: 18, borderRadius: 6, background: d.done ? MC.primary : '#E7E4DA', boxShadow: d.today ? '0 0 0 2px #fff, 0 0 0 3.5px #9BD3BC' : 'none' }} />
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: d.today ? MC.primary : MC.faint }}>{d.dow}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 내 취향 */}
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 1px 2px rgba(30,28,23,.05), 0 8px 22px rgba(30,28,23,.05)', padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: MC.tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={MC.primary}><path d="M12 2l1.6 4.9 4.9 1.6-4.9 1.6L12 15l-1.6-4.9L5.5 8.5l4.9-1.6z" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>내 취향</div>
            </div>
            <div onClick={pref.reopenSurvey} className="hbtn" style={{ fontSize: 13.5, fontWeight: 800, color: MC.tintText, background: MC.tintBg, padding: '7px 13px', borderRadius: 20, cursor: 'pointer' }}>{hasPrefs ? '다시 설정' : '설정하기'}</div>
          </div>
          {hasPrefs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pref.preferredCategories.length > 0 && <PrefRow label="좋아하는 활동" items={pref.preferredCategories} />}
              {pref.vibe && <PrefRow label="분위기" items={[pref.vibe]} />}
              {pref.intensity && <PrefRow label="강도" items={[pref.intensity]} />}
              {pref.avoid.length > 0 && <PrefRow label="피하고 싶은 것" items={pref.avoid} muted />}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: MC.faint, fontSize: 14.5, fontWeight: 600 }}>취향을 설정하면 추천이 더 정확해져요</div>
          )}
        </div>
      </div>

      {searchOpen && <FriendSearchModal onClose={closeFriendSearch} onOpenDetail={(u) => { closeFriendSearch(); setDetailUser(u) }} />}
      {detailUser && <FriendDetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
    </div>
  )
}

function PrefRow({ label, items, muted }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: MC.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) => (
          <span key={it} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: muted ? MC.chipBg : MC.tintBg, color: muted ? MC.muted : MC.tintText, fontSize: 14, fontWeight: 800, padding: '8px 13px', borderRadius: 20 }}>
            <PrefIcon name={it} color={muted ? MC.muted : MC.primary} w={16} />
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}
