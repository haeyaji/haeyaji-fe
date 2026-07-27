// 약속 상세 — be 슬롯 모델. 링크 공유 → 참여 → 가용 입력(슬롯 FREE) → 히트맵/베스트타임 → 확정.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMeetupStore } from '@/store/useMeetupStore'
import { useFriendStore } from '@/store/useFriendStore'
import { searchMember, type MemberLite } from '@/api/friendApi'
import { meetingInviteUrl } from '@/api/meetingApi'
import { meetTypeLabel, slotDate, slotHM, dateLabel, confirmedRange, heatColor, Avatar } from './meetupShared'
import { MC } from './tokens'

const myMemberId = () => localStorage.getItem('haeyaji-account')

export function MeetupDetailPage({ shareToken, onBack }: { shareToken: string; onBack: () => void }) {
  const { detail, heatmap, bestTimes, myResponses, loading, loadDetail, join, invite, submit, confirm, clearDetail } = useMeetupStore()
  const friendItems = useFriendStore((s) => s.friends)
  const nameOf = useFriendStore((s) => s.nameOf)
  const loadFriends = useFriendStore((s) => s.load)
  const [mine, setMine] = useState<Set<string>>(new Set()) // 내가 FREE로 고른 slotId
  const [copied, setCopied] = useState(false)
  const [inviteQ, setInviteQ] = useState('') // 닉네임 검색 초대
  const [inviteResult, setInviteResult] = useState<MemberLite | null | 'none'>(null)
  const cacheName = useFriendStore((s) => s.cacheName)
  const drag = useRef<'add' | 'remove' | null>(null) // 드래그 칠하기 모드 (hooks는 early return 앞에)

  useEffect(() => { void loadDetail(shareToken); return () => clearDetail() }, [shareToken, loadDetail, clearDetail])
  useEffect(() => { void loadFriends() }, [loadFriends])
  useEffect(() => { setMine(new Set(myResponses.filter((r) => r.status === 'FREE').map((r) => r.slotId))) }, [myResponses])
  useEffect(() => { const up = () => { drag.current = null }; window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up) }, [])
  // 닉네임 검색(디바운스 350ms) → 초대 후보
  useEffect(() => {
    const q = inviteQ.trim()
    if (!q) { setInviteResult(null); return }
    const t = setTimeout(async () => { const m = await searchMember(q); setInviteResult(m ?? 'none') }, 350)
    return () => clearTimeout(t)
  }, [inviteQ])

  const isParticipant = !!detail?.participants.some((p) => p.memberId === myMemberId())
  const isCreator = detail?.creatorId === myMemberId()
  const total = heatmap?.participantCount ?? detail?.participants.length ?? 0
  const freeBySlot = useMemo(() => Object.fromEntries((heatmap?.cells ?? []).map((c) => [c.slotId, c.freeCount])), [heatmap])

  // 슬롯 → 날짜×시간 그리드
  const grid = useMemo(() => {
    const slots = detail?.slots ?? []
    const dates = detail?.dates ?? []
    const times = Array.from(new Set(slots.map((s) => slotHM(s.slotStartAt)))).sort()
    const map: Record<string, { id: string }> = {}
    for (const s of slots) map[`${slotDate(s.slotStartAt)} ${slotHM(s.slotStartAt)}`] = { id: s.id }
    return { dates, times, map }
  }, [detail])

  if (loading && !detail) return <Center>불러오는 중…</Center>
  if (!detail) return <Center>약속을 찾을 수 없어요</Center>

  const conf = detail.status === 'CONFIRMED' && detail.confirmedStartAt && detail.confirmedEndAt
  const expired = detail.status === 'EXPIRED'
  const dirty = JSON.stringify([...mine].sort()) !== JSON.stringify(myResponses.filter((r) => r.status === 'FREE').map((r) => r.slotId).sort())

  // 드래그로 칠하기 — 시작 셀 상태로 add/remove 모드 결정 후 지나는 셀에 일괄 적용 (when2meet식)
  const editable = isParticipant && !conf && !expired
  const applyCell = (id: string, mode: 'add' | 'remove') =>
    setMine((p) => { const n = new Set(p); mode === 'add' ? n.add(id) : n.delete(id); return n })
  const onCellDown = (id: string) => { if (!editable) return; const mode = mine.has(id) ? 'remove' : 'add'; drag.current = mode; applyCell(id, mode) }
  const onCellEnter = (id: string) => { if (editable && drag.current) applyCell(id, drag.current) }
  const save = () => submit(shareToken, [...mine].map((slotId) => ({ slotId, status: 'FREE' as const })))
  const copy = () => { navigator.clipboard?.writeText(meetingInviteUrl(shareToken)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }
  // 친구 초대 — 아직 참여하지 않은 친구만
  const partIds = new Set(detail.participants.map((p) => p.memberId))
  const invitable = friendItems.filter((f) => !partIds.has(f.memberId))

  return (
    <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', width: '100%', color: MC.ink, background: 'var(--canvas)' }}>
      <div className="mp-wrap">
        <div onClick={onBack} className="hbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: MC.muted, cursor: 'pointer', marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg> 약속 목록
        </div>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.5px' }}>{detail.title}</div>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: MC.tintText, background: MC.tintBg, padding: '5px 11px', borderRadius: 20 }}>{meetTypeLabel(detail.type)}</span>
          {conf && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: MC.primary, padding: '5px 11px', borderRadius: 20 }}>확정</span>}
          {expired && <span style={{ fontSize: 12.5, fontWeight: 800, color: '#B4544A', background: '#F7E7E4', padding: '5px 11px', borderRadius: 20 }}>만료</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: MC.muted, marginBottom: 18 }}>
          참여 {detail.participants.length}명 · {detail.timeStart.slice(0, 5)}~{detail.timeEnd.slice(0, 5)} · {detail.slotUnitMinutes}분 단위
          {conf && <> · <b style={{ color: MC.primary }}>⏰ {confirmedRange(detail.confirmedStartAt!, detail.confirmedEndAt!)}</b></>}
        </div>

        {/* 공유 링크 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', border: '1px solid #ECE9E0', borderRadius: 14, padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: MC.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meetingInviteUrl(shareToken)}</div>
          <div onClick={copy} className="lift" style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: MC.ink, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0 }}>{copied ? '복사됨!' : '링크 복사'}</div>
        </div>

        {/* 초대 (be /invitations) — 참여 중이면 누구나 닉네임 검색·친구 클릭으로 초대. 친구 아니어도 가능. */}
        {isParticipant && !expired && !conf && (
          <div style={{ background: '#fff', border: '1px solid #ECE9E0', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: MC.muted, marginBottom: 10 }}>초대하기</div>
            {/* 닉네임 검색 */}
            <div style={{ position: 'relative', marginBottom: invitable.length ? 12 : 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A6A296" strokeWidth="2" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
              <input value={inviteQ} onChange={(e) => setInviteQ(e.target.value)} placeholder="닉네임으로 검색해 초대 (정확히 입력)" style={{ width: '100%', border: `1px solid ${MC.border}`, outline: 'none', background: MC.fieldBg, borderRadius: 12, padding: '11px 14px 11px 38px', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, color: MC.ink }} />
              {inviteQ.trim() && (
                <div style={{ marginTop: 8 }}>
                  {inviteResult === null ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: MC.faint, padding: '6px 2px' }}>검색 중…</div>
                  ) : inviteResult === 'none' ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: MC.faint, padding: '6px 2px' }}>'{inviteQ.trim()}' 님을 찾을 수 없어요</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: MC.fieldBg, borderRadius: 12, padding: '8px 10px' }}>
                      <Avatar name={inviteResult.nickname} size={30} font={14} />
                      <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>{inviteResult.nickname}</div>
                      {inviteResult.id === myMemberId() ? (
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: MC.faint }}>나</span>
                      ) : partIds.has(inviteResult.id) ? (
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: MC.primary }}>참여 중</span>
                      ) : (
                        <div onClick={() => { cacheName(inviteResult.id, inviteResult.nickname); invite(shareToken, [inviteResult.id]); setInviteQ(''); setInviteResult(null) }} className="lift" style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: MC.primary, borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}>초대</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 친구 빠른 초대 */}
            {invitable.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: MC.faint, marginBottom: 8 }}>친구</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {invitable.map((f) => (
                    <div key={f.rowId} onClick={() => invite(shareToken, [f.memberId])} className="lift" title={`${nameOf(f.memberId)} 초대`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #E7EAEF', color: MC.ink, fontSize: 13, fontWeight: 800, padding: '6px 12px 6px 7px', borderRadius: 20, cursor: 'pointer' }}>
                      <Avatar name={nameOf(f.memberId)} size={22} font={11} />
                      {nameOf(f.memberId)}
                      <span style={{ fontSize: 15, fontWeight: 800, color: MC.primary, lineHeight: 1 }}>+</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 참여 안 했으면 참여 버튼 */}
        {!isParticipant && !expired && (
          <div onClick={() => join(shareToken)} className="lift" style={{ textAlign: 'center', background: MC.primary, color: '#fff', fontSize: 15, fontWeight: 800, borderRadius: 14, padding: 14, cursor: 'pointer', marginBottom: 16 }}>이 약속 참여하기</div>
        )}

        {/* 슬롯 그리드 (히트맵 + 내 가용 입력) */}
        <div style={{ background: '#fff', border: '1px solid #ECE9E0', borderRadius: 18, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{editable ? '가능한 시간을 드래그해서 칠하세요' : '참여자 가능 시간'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: MC.muted }}>진하게 = 많이 겹침</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', width: '100%', gridTemplateColumns: `60px repeat(${grid.dates.length}, minmax(0, 1fr))`, gap: 5, userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div />
              {grid.dates.map((d) => <div key={d} style={{ fontSize: 14, fontWeight: 800, textAlign: 'center', color: MC.ink, paddingBottom: 4 }}>{dateLabel(d)}</div>)}
              {grid.times.map((t) => (
                <>
                  <div key={`h${t}`} style={{ fontSize: 13, fontWeight: 700, color: MC.muted, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>{t}</div>
                  {grid.dates.map((d) => {
                    const cell = grid.map[`${d} ${t}`]
                    if (!cell) return <div key={`${d}${t}`} style={{ height: 42, background: '#FAFAF7', borderRadius: 7 }} />
                    const free = freeBySlot[cell.id] ?? 0
                    const col = heatColor(free, total)
                    const isMine = mine.has(cell.id)
                    return (
                      <div key={cell.id}
                        onMouseDown={() => onCellDown(cell.id)}
                        onMouseEnter={() => onCellEnter(cell.id)}
                        title={`${free}/${total}명`}
                        style={{ height: 42, borderRadius: 7, background: col.bg, cursor: editable ? 'pointer' : 'default', boxShadow: isMine ? `inset 0 0 0 3px ${MC.primary}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: col.txt }}>
                        {free > 0 ? free : ''}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
          {isParticipant && !conf && !expired && (
            <div onClick={save} className={dirty ? 'lift' : ''} style={{ marginTop: 12, textAlign: 'center', background: dirty ? MC.ink : '#E6E4DC', color: dirty ? '#fff' : '#A8A498', fontSize: 14.5, fontWeight: 800, borderRadius: 12, padding: 12, cursor: dirty ? 'pointer' : 'default' }}>
              내 가능 시간 저장
            </div>
          )}
        </div>

        {/* 베스트 타임 + 확정 */}
        {!conf && !expired && bestTimes && bestTimes.windows.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #ECE9E0', borderRadius: 18, padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>가장 많이 겹치는 시간 · 최대 {bestTimes.maxFreeCount}명</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bestTimes.windows.slice(0, 5).map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: MC.tintBg, borderRadius: 12, padding: '11px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 800, color: MC.tintText }}>{confirmedRange(w.startAt, w.endAt)}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: MC.primary }}>{w.freeCount}명</div>
                  {isCreator && <div onClick={() => confirm(shareToken, w.startAt, w.endAt)} className="lift" style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: MC.primary, borderRadius: 10, padding: '7px 13px', cursor: 'pointer' }}>확정</div>}
                </div>
              ))}
            </div>
            {!isCreator && <div style={{ fontSize: 12.5, fontWeight: 600, color: MC.muted, marginTop: 10 }}>확정은 약속 생성자만 할 수 있어요</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mp-pad" style={{ minHeight: 'var(--full-vh)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MC.muted, fontSize: 15, fontWeight: 700 }}>{children}</div>
}
