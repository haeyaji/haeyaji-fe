// 온보딩 설문 4축 (be user_preference 계약: JSON 2 + str 2, 전부 스킵 가능).
// be 저장 API가 아직 없어 localStorage(persist)에 보관하되, 완료 시 be로도 POST(구멍1).
// be 미구현 구간에는 fireSignal이 실패를 삼켜 UI를 막지 않는다.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category } from '@/types'
import { savePreferences, fireSignal } from '@/api/personalizeApi'

// 선택지 문자열은 be/nlp 계약과 완전 일치 — 임의 변경 금지
export const CATEGORY_OPTIONS: Category[] = ['야외', '실내', '휴식', '생산성', '사람만나기', '맛집/카페']
export const AVOID_OPTIONS = ['시끄러운 곳', '사람 많은 곳', '많이 걷기', '비싼 곳', '멀리 가기', '오래 걸리는 것']
export const VIBE_OPTIONS = ['조용한', '활기찬', '감성적인', '트렌디한', '편안한']
export const INTENSITY_OPTIONS = ['가볍게', '적당히', '적극적으로']

interface PrefState {
  nickname: string // 회원 표시 이름. ERD member.nickname(NOT NULL) 대응. be가 /me로 주면 그 값으로 덮음.
  preferredCategories: Category[]
  avoid: string[]
  vibe: string | null
  intensity: string | null
  surveyDone: boolean
  setNickname: (v: string) => void
  toggleCategory: (c: Category) => void
  toggleAvoid: (a: string) => void
  setVibe: (v: string | null) => void
  setIntensity: (v: string | null) => void
  finishSurvey: () => void
  reopenSurvey: () => void // 마이페이지 "다시 설정" → 온보딩 위저드 재진입
}

const toggle = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export const usePrefStore = create<PrefState>()(
  persist(
    (set, get) => ({
      nickname: '',
      preferredCategories: [],
      avoid: [],
      vibe: null,
      intensity: null,
      surveyDone: false,
      setNickname: (nickname) => set({ nickname: nickname.trim() }),
      toggleCategory: (c) => set((s) => ({ preferredCategories: toggle(s.preferredCategories, c) })),
      toggleAvoid: (a) => set((s) => ({ avoid: toggle(s.avoid, a) })),
      setVibe: (vibe) => set({ vibe }),
      setIntensity: (intensity) => set({ intensity }),
      finishSurvey: () => {
        set({ surveyDone: true })
        // 구멍1 — 설문 4축을 be로 저장(온보딩 완료·마이페이지 재설정 공통 종착점). 값은 선택지 문자열 그대로.
        const { preferredCategories, avoid, vibe, intensity } = get()
        fireSignal(savePreferences({ preferredCategories, avoid, vibe, intensity }))
      },
      reopenSurvey: () => set({ surveyDone: false }),
    }),
    { name: 'haeyaji-pref' },
  ),
)
