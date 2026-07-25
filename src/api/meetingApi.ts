// be 약속(meeting) API (/meetings). 슬롯 기반 + share-token 모델. ApiResponse<T> → data.data.
// 흐름: 생성(→shareToken·slots) → 링크 공유 → 참여(join) → 가용 제출(slotId+status) → 히트맵/베스트타임 → 확정.
import { be } from './client'

interface Env<T> { data: T }

export type MeetingType = 'CASUAL' | 'TEAM' | 'REGULAR' | 'ETC'
export type MeetingStatus = 'COLLECTING' | 'CONFIRMED' | 'EXPIRED'
export type SlotStatus = 'FREE' | 'BUSY'

export interface TimeSlot { id: string; slotStartAt: string } // LocalDateTime
export interface Participant { id: string; memberId: string; joinedAt: string }
export interface SlotResponseItem { slotId: string; status: SlotStatus }

export interface MeetingDetail {
  id: string
  creatorId: string
  title: string
  type: MeetingType
  status: MeetingStatus
  timeStart: string // LocalTime
  timeEnd: string
  slotUnitMinutes: number
  deadline: string | null
  confirmedStartAt: string | null
  confirmedEndAt: string | null
  shareToken: string
  dates: string[] // LocalDate[]
  slots: TimeSlot[]
  participants: Participant[]
  createdAt: string
}

export interface MeetingSummary {
  id: string
  title: string
  type: MeetingType
  status: MeetingStatus
  shareToken: string
  participantCount: number
  deadline: string | null
  confirmedStartAt: string | null
  confirmedEndAt: string | null
  createdAt: string
}

export interface HeatmapCell { slotId: string; slotStartAt: string; freeCount: number }
export interface Heatmap { participantCount: number; cells: HeatmapCell[] }

export interface TimeWindow { startAt: string; endAt: string; freeCount: number }
export interface BestTimes { maxFreeCount: number; windows: TimeWindow[] }

export interface ParticipantAvailability { memberId: string; joinedAt: string; responded: boolean; responses: SlotResponseItem[] }
export interface MeetingStatusInfo { participantCount: number; respondedCount: number; participants: ParticipantAvailability[] }

export interface CreateMeetingInput {
  title: string
  type: MeetingType
  dates: string[] // "YYYY-MM-DD"
  timeStart: string // "HH:mm:ss"
  timeEnd: string
  slotUnitMinutes: number
  deadline?: string | null // LocalDateTime, @Future
}

// ── MeetingController ──
export async function createMeeting(input: CreateMeetingInput): Promise<MeetingDetail> {
  const res = await be.post<Env<MeetingDetail>>('/meetings', input)
  return res.data.data
}
export async function listMeetings(): Promise<MeetingSummary[]> {
  const res = await be.get<Env<MeetingSummary[]>>('/meetings')
  return res.data.data ?? []
}
export async function getMeeting(shareToken: string): Promise<MeetingDetail> {
  const res = await be.get<Env<MeetingDetail>>(`/meetings/${shareToken}`)
  return res.data.data
}
export async function confirmMeeting(shareToken: string, confirmedStartAt: string, confirmedEndAt: string): Promise<MeetingDetail> {
  const res = await be.patch<Env<MeetingDetail>>(`/meetings/${shareToken}/confirm`, { confirmedStartAt, confirmedEndAt })
  return res.data.data
}

// ── MeetingParticipantController ──
export async function joinMeeting(shareToken: string): Promise<Participant> {
  const res = await be.post<Env<Participant>>(`/meetings/${shareToken}/participants`, {})
  return res.data.data
}

/** 친구를 memberId로 약속에 초대 (MEET-4, 생성자·참여자). 이미 참여 중이면 skipped. */
export async function inviteMembers(shareToken: string, memberIds: string[]): Promise<{ invitedMemberIds: string[]; skippedMemberIds: string[] }> {
  const res = await be.post<Env<{ invitedMemberIds: string[]; skippedMemberIds: string[] }>>(`/meetings/${shareToken}/invitations`, { memberIds })
  return res.data.data
}

// ── MeetingResponseController ──
export async function submitAvailability(shareToken: string, responses: SlotResponseItem[]): Promise<SlotResponseItem[]> {
  const res = await be.put<Env<SlotResponseItem[]>>(`/meetings/${shareToken}/responses`, { responses })
  return res.data.data ?? []
}
export async function getHeatmap(shareToken: string): Promise<Heatmap> {
  const res = await be.get<Env<Heatmap>>(`/meetings/${shareToken}/heatmap`)
  return res.data.data
}
export async function getBestTimes(shareToken: string): Promise<BestTimes> {
  const res = await be.get<Env<BestTimes>>(`/meetings/${shareToken}/best-times`)
  return res.data.data
}
export async function getMeetingStatus(shareToken: string): Promise<MeetingStatusInfo> {
  const res = await be.get<Env<MeetingStatusInfo>>(`/meetings/${shareToken}/status`)
  return res.data.data
}

/** 공유 링크 — 초대 링크로 열면 App이 shareToken을 잡아 참여 화면으로. */
export const meetingInviteUrl = (shareToken: string): string => `${location.origin}/invite/${shareToken}`
