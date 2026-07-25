// 약속 상세 — be 슬롯 모델. 링크 공유 → 참여 → 가용 입력(슬롯 FREE) → 히트맵/베스트타임 → 확정.
import { useEffect, useMemo, useState } from 'react'
import { useMeetupStore } from '@/store/useMeetupStore'
import { useFriendStore } from '@/store/useFriendStore'
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

  useEffect(() => { void loadDetail(shareToken); return () => clearDetail() }, [shareToken, loadDetail, clearDetail])
  useEffect(() => { void loadFriends() }, [loadFriends])
  useEffect(() => { setMine(new Set(myResponses.filter((r) => r.status === 'FREE').map((r) => r.slotId))) }, [myResponses])

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

  const toggle = (slotId: string) => {
    if (!isParticipant || conf || expired) return
    setMine((p) => { const n = new Set(p); n.has(slotId) ? n.delete(slotId) : n.add(slotId); return n })
  }
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

        {/* 친구 초대 (be /invitations) — 참여 중인 사람만 초대 가능, 이미 참여한 친구는 제외 */}
        {isParticipant && !expired && !conf && invitable.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #ECE9E0', borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: MC.muted, marginBottom: 10 }}>친구 초대</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {invitable.map((f) => (
                <div key={f.rowId} onClick={() => invite(shareToken, [f.memberId])} className="lift" title={`${nameOf(f.memberId)} 초대`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #E7EAEF', color: MC.ink, fontSize: 13, fontWeight: 800, padding: '6px 12px 6px 7px', borderRadius: 20, cursor: 'pointer' }}>
                  <Avatar name={nameOf(f.memberId)} size={22} font={11} />
                  {nameOf(f.memberId)}
                  <span style={{ fontSize: 15, fontWeight: 800, color: MC.primary, lineHeight: 1 }}>+</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 참여 안 했으면 참여 버튼 */}
        {!isParticipant && !expired && (
          <div onClick={() => join(shareToken)} className="lift" style={{ textAlign: 'center', background: MC.primary, color: '#fff', fontSize: 15, fontWeight: 800, borderRadius: 14, padding: 14, cursor: 'pointer', marginBottom: 16 }}>이 약속 참여하기</div>
        )}

        {/* 슬롯 그리드 (히트맵 + 내 가용 입력) */}
        <div style={{ background: '#fff', border: '1px solid #ECE9E0', borderRadius: 18, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{isParticipant && !conf && !expired ? '가능한 시간을 눌러 표시하세요' : '참여자 가능 시간'}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: MC.muted }}>진하게 = 많이 겹침</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'inline-grid', gridTemplateColumns: `48px repeat(${grid.dates.length}, minmax(56px, 1fr))`, gap: 3 }}>
              <div />
              {grid.dates.map((d) => <div key={d} style={{ fontSize: 11.5, fontWeight: 800, textAlign: 'center', color: MC.muted, paddingBottom: 2 }}>{dateLabel(d)}</div>)}
              {grid.times.map((t) => (
                <>
                  <div key={`h${t}`} style={{ fontSize: 11, fontWeight: 700, color: MC.muted, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{t}</div>
                  {grid.dates.map((d) => {
                    const cell = grid.map[`${d} ${t}`]
                    if (!cell) return <div key={`${d}${t}`} style={{ height: 26, background: '#FAFAF7', borderRadius: 5 }} />
                    const free = freeBySlot[cell.id] ?? 0
                    const col = heatColor(free, total)
                    const isMine = mine.has(cell.id)
                    return (
                      <div key={cell.id} onClick={() => toggle(cell.id)} title={`${free}/${total}명`}
                        style={{ height: 26, borderRadius: 5, background: col.bg, cursor: isParticipant && !conf && !expired ? 'pointer' : 'default', boxShadow: isMine ? `inset 0 0 0 2.5px ${MC.primary}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col.txt }}>
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
