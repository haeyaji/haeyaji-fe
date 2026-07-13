// 마이페이지 — 프로필·내 취향·최근 통계·친구. 사이드바 프로필 카드에서 진입.
import { useState } from 'react'
import { PlusIcon } from '@/lib/icons'
import { last7Days } from '@/lib/dates'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore } from '@/store/usePrefStore'
import { useTodoStore } from '@/store/useTodoStore'
import { useFriendStore, userById } from '@/store/useFriendStore'
import { PrefIcon } from './prefIcons'
import { FriendSearchModal } from './FriendSearchModal'
import { FriendDetailModal } from './FriendDetailModal'
import { MeetupModal } from './MeetupModal'
import type { AppUser } from '@/types'

function Avatar({ name, size = 44, font = 20 }: { name: string; size?: number; font?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #15795A, #57B48C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(21,121,90,.25)' }}>
      {name.slice(0, 1)}
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EAF5EF', color: '#0F5A42', fontSize: 14, fontWeight: 800, padding: '8px 13px', borderRadius: 20 }}>
      <PrefIcon name={label} color="#15795A" w={16} />
      {label}
    </span>
  )
}

export function MyPage() {
  const nickname = useAppStore((s) => s.nickname)
  const pref = usePrefStore()
  const tasksByDate = useTodoStore((s) => s.tasksByDate)
  const friendIds = useFriendStore((s) => s.friendIds)

  const [editIntro, setEditIntro] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<AppUser | null>(null)
  const [meetupUser, setMeetupUser] = useState<AppUser | null>(null)

  // 최근 7일 통계 (기존 util 재사용)
  const week = last7Days()
  const flat = week.flatMap((k) => tasksByDate[k] ?? [])
  const doneCnt = flat.filter((t) => t.done).length
  const rate = flat.length ? Math.round((doneCnt / flat.length) * 100) : 0

  const friends = friendIds.map(userById).filter((u): u is AppUser => !!u)
  const hasPrefs = pref.preferredCategories.length > 0 || pref.avoid.length > 0 || pref.vibe || pref.intensity

  const section: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: '#8B8579', marginBottom: 12 }

  return (
    <div className="page-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: '#17150F', background: 'var(--canvas)' }}>
      <div className="home-wrap">
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.6px', marginBottom: 20 }}>마이페이지</div>

        {/* 프로필 카드 */}
        <div className="tile" style={{ padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <Avatar name={nickname} size={72} font={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{nickname}</div>
            {editIntro ? (
              <input
                autoFocus
                value={pref.intro}
                onChange={(e) => pref.setIntro(e.target.value)}
                onBlur={() => setEditIntro(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) setEditIntro(false) }}
                placeholder="한줄소개를 입력하세요"
                style={{ marginTop: 5, width: '100%', maxWidth: 360, border: '1px solid #E1E5EC', outline: 'none', background: '#F6F8FA', borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: '#17150F' }}
              />
            ) : (
              <div onClick={() => setEditIntro(true)} className="hbtn" style={{ marginTop: 5, fontSize: 15, fontWeight: 600, color: pref.intro ? '#5A554B' : '#B6BCC7', cursor: 'pointer', display: 'inline-block' }}>
                {pref.intro || '한줄소개 추가 +'}
              </div>
            )}
          </div>
        </div>

        <div className="bento" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'auto' }}>
          {/* 내 취향 */}
          <div className="tile" style={{ gridColumn: '1 / 3', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>내 취향</div>
              <div onClick={pref.reopenSurvey} className="hbtn" style={{ fontSize: 13.5, fontWeight: 800, color: '#15795A', background: '#EAF5EF', padding: '7px 13px', borderRadius: 20, cursor: 'pointer' }}>다시 설정</div>
            </div>
            {hasPrefs ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pref.preferredCategories.length > 0 && <PrefRow label="좋아하는 활동" items={pref.preferredCategories} />}
                {pref.vibe && <PrefRow label="분위기" items={[pref.vibe]} />}
                {pref.intensity && <PrefRow label="강도" items={[pref.intensity]} />}
                {pref.avoid.length > 0 && <PrefRow label="피하고 싶은 것" items={pref.avoid} muted />}
              </div>
            ) : (
              <div style={{ padding: '20px 0', color: '#B6BCC7', fontSize: 14.5, fontWeight: 600 }}>아직 취향을 설정하지 않았어요. "다시 설정"에서 추가할 수 있어요.</div>
            )}
          </div>

          {/* 최근 7일 통계 */}
          <div className="tile" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>최근 7일</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#15795A', letterSpacing: '-1px' }}>{rate}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#15795A' }}>%</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8B8579', marginTop: 2 }}>완료율</div>
            <div style={{ height: 8, borderRadius: 6, background: '#EEF0F4', overflow: 'hidden', marginTop: 14 }}>
              <div style={{ width: `${rate}%`, height: '100%', background: '#15795A', borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#A39C8E', marginTop: 12 }}>완료 {doneCnt}개 · 전체 {flat.length}개</div>
          </div>
        </div>

        {/* 친구 */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={section}>친구 {friends.length > 0 && <span style={{ color: '#15795A' }}>{friends.length}</span>}</div>
            <div onClick={() => setSearchOpen(true)} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#17150F', color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 13, cursor: 'pointer' }}>
              <PlusIcon w={15} /> 친구 추가
            </div>
          </div>
          {friends.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {friends.map((u) => (
                <div key={u.id} onClick={() => setDetailUser(u)} className="tile lift" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                  <Avatar name={u.nickname} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 800 }}>{u.nickname}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#A39C8E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.intro}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tile" style={{ padding: 26, textAlign: 'center', color: '#B6BCC7', fontSize: 14.5, fontWeight: 600 }}>아직 친구가 없어요. "친구 추가"로 닉네임을 검색해보세요.</div>
          )}
        </div>
      </div>

      {searchOpen && <FriendSearchModal onClose={() => setSearchOpen(false)} />}
      {detailUser && (
        <FriendDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onMeetup={() => { setMeetupUser(detailUser); setDetailUser(null) }}
        />
      )}
      {meetupUser && <MeetupModal initialFriend={meetupUser} onClose={() => setMeetupUser(null)} />}
    </div>
  )
}

function PrefRow({ label, items, muted }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#A39C8E', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) =>
          muted ? (
            <span key={it} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F0F2F6', color: '#8B8579', fontSize: 14, fontWeight: 800, padding: '8px 13px', borderRadius: 20 }}>
              <PrefIcon name={it} color="#8B8579" w={16} />
              {it}
            </span>
          ) : (
            <Chip key={it} label={it} />
          ),
        )}
      </div>
    </div>
  )
}
