// 마이페이지 — 프로필 히어로·내 취향·친구. 사이드바 프로필 카드에서 진입.
import { useState } from 'react'
import { PlusIcon } from '@/lib/icons'
import { last7Days } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore } from '@/store/usePrefStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { useMeetupStore } from '@/store/useMeetupStore'
import { PrefIcon } from './prefIcons'
import { FriendSearchModal } from './FriendSearchModal'
import { FriendDetailModal } from './FriendDetailModal'
import type { AppUser } from '@/types'

function Avatar({ name, size = 44, font = 20, ring }: { name: string; size?: number; font?: number; ring?: boolean }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(21,121,90,.25)', border: ring ? '3px solid rgba(255,255,255,.4)' : 'none' }}>
      {name.slice(0, 1)}
    </div>
  )
}

function Chip({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: muted ? '#F0F2F6' : '#EAF5EF', color: muted ? '#8B8579' : '#0F5A42', fontSize: 14, fontWeight: 800, padding: '8px 13px', borderRadius: 20 }}>
      <PrefIcon name={label} color={muted ? '#8B8579' : '#15795A'} w={16} />
      {label}
    </span>
  )
}

export function MyPage() {
  const nickname = useAppStore((s) => s.nickname)
  const setView = useAppStore((s) => s.setView)
  const pref = usePrefStore()
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const friendIds = useFriendStore((s) => s.friendIds)
  const meetups = useMeetupStore((s) => s.meetups)

  const [editIntro, setEditIntro] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<AppUser | null>(null)

  const flat = last7Days().flatMap((k) => tasksByDate[k] ?? [])
  const doneCnt = flat.filter((t) => t.done).length
  const rate = flat.length ? Math.round((doneCnt / flat.length) * 100) : 0

  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const hasPrefs = pref.preferredCategories.length > 0 || pref.avoid.length > 0 || pref.vibe || pref.intensity

  const stats = [
    { label: '완료율', value: `${rate}%`, onClick: () => setView('home') },
    { label: '친구', value: `${friends.length}`, onClick: () => {} },
    { label: '약속', value: `${meetups.length}`, onClick: () => setView('meetup') },
  ]

  return (
    <div className="page-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div className="home-wrap">
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px', marginBottom: 20 }}>마이페이지</div>

        {/* 프로필 히어로 */}
        <div className="tile" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ background: 'linear-gradient(135deg, #15795A 0%, #3E9E76 55%, #57B48C 100%)', padding: '26px 28px 22px', color: '#fff', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Avatar name={nickname} size={76} font={34} ring />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 25, fontWeight: 800 }}>{nickname}</div>
                {editIntro ? (
                  <input
                    autoFocus
                    value={pref.intro}
                    onChange={(e) => pref.setIntro(e.target.value)}
                    onBlur={() => setEditIntro(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) setEditIntro(false) }}
                    placeholder="한줄소개를 입력하세요"
                    style={{ marginTop: 6, width: '100%', maxWidth: 340, border: 'none', outline: 'none', background: 'rgba(255,255,255,.22)', borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: '#fff' }}
                  />
                ) : (
                  <div onClick={() => setEditIntro(true)} className="hbtn" style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.92)', cursor: 'pointer', display: 'inline-block' }}>
                    {pref.intro || '한줄소개 추가 +'}
                  </div>
                )}
              </div>
            </div>
            {/* 스탯 필 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {stats.map((s) => (
                <div key={s.label} onClick={s.onClick} className="hbtn" style={{ flex: 1, background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.82)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 내 취향 */}
        <div className="tile" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>내 취향</div>
            <div onClick={pref.reopenSurvey} className="hbtn" style={{ fontSize: 13.5, fontWeight: 800, color: '#15795A', background: '#EAF5EF', padding: '7px 13px', borderRadius: 20, cursor: 'pointer' }}>{hasPrefs ? '다시 설정' : '설정하기'}</div>
          </div>
          {hasPrefs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pref.preferredCategories.length > 0 && <PrefRow label="좋아하는 활동" items={pref.preferredCategories} />}
              {pref.vibe && <PrefRow label="분위기" items={[pref.vibe]} />}
              {pref.intensity && <PrefRow label="강도" items={[pref.intensity]} />}
              {pref.avoid.length > 0 && <PrefRow label="피하고 싶은 것" items={pref.avoid} muted />}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#B6BCC7', fontSize: 14.5, fontWeight: 600 }}>취향을 설정하면 추천이 더 정확해져요</div>
          )}
        </div>

        {/* 친구 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>친구 {friends.length > 0 && <span style={{ color: '#15795A' }}>{friends.length}</span>}</div>
            <div onClick={() => setSearchOpen(true)} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#17150F', color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 13, cursor: 'pointer' }}>
              <PlusIcon w={15} /> 친구 추가
            </div>
          </div>
          {friends.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {friends.map((u) => (
                <div key={u.id} onClick={() => setDetailUser(u)} className="tile lift" style={{ padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                  <Avatar name={u.nickname} size={42} font={18} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 800 }}>{u.nickname}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.intro}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CAD0DA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </div>
              ))}
            </div>
          ) : (
            <div className="tile" style={{ padding: '36px 26px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#8B8579' }}>아직 친구가 없어요</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#B6BCC7', marginTop: 5 }}>"친구 추가"로 닉네임을 검색해보세요</div>
            </div>
          )}
        </div>
      </div>

      {searchOpen && <FriendSearchModal onClose={() => setSearchOpen(false)} />}
      {detailUser && <FriendDetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
    </div>
  )
}

function PrefRow({ label, items, muted }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#A39C8E', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) => <Chip key={it} label={it} muted={muted} />)}
      </div>
    </div>
  )
}
