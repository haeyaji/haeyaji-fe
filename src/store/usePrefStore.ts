// 온보딩 설문 4축 (be user_preference 계약: JSON 2 + str 2, 전부 스킵 가능).
// be 저장 API가 아직 없어 localStorage(persist)에 보관한다.
// TODO: be user_preference API 생기면 finishSurvey에서 POST 추가.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category } from '@/types'

// 선택지 문자열은 be/nlp 계약과 완전 일치 — 임의 변경 금지
export const CATEGORY_OPTIONS: Category[] = ['야외', '실내', '휴식', '생산성', '사람만나기', '맛집/카페']
export const AVOID_OPTIONS = ['시끄러운 곳', '사람 많은 곳', '많이 걷기', '비싼 곳', '멀리 가기', '오래 걸리는 것']
export const VIBE_OPTIONS = ['조용한', '활기찬', '감성적인', '트렌디한', '편안한']
export const INTENSITY_OPTIONS = ['가볍게', '적당히', '적극적으로']

interface PrefState {
  preferredCategories: Category[]
  avoid: string[]
  vibe: string | null
  intensity: string | null
  surveyDone: boolean
  intro: string // 마이페이지 한줄소개
  toggleCategory: (c: Category) => void
  toggleAvoid: (a: string) => void
  setVibe: (v: string | null) => void
  setIntensity: (v: string | null) => void
  finishSurvey: () => void
  reopenSurvey: () => void // 마이페이지 "다시 설정" → 온보딩 위저드 재진입
  setIntro: (v: string) => void
}

const toggle = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export const usePrefStore = create<PrefState>()(
  persist(
    (set) => ({
      preferredCategories: [],
      avoid: [],
      vibe: null,
      intensity: null,
      surveyDone: false,
      intro: '',
      toggleCategory: (c) => set((s) => ({ preferredCategories: toggle(s.preferredCategories, c) })),
      toggleAvoid: (a) => set((s) => ({ avoid: toggle(s.avoid, a) })),
      setVibe: (vibe) => set({ vibe }),
      setIntensity: (intensity) => set({ intensity }),
      finishSurvey: () => set({ surveyDone: true }),
      reopenSurvey: () => set({ surveyDone: false }),
      setIntro: (intro) => set({ intro }),
    }),
    { name: 'haeyaji-pref' },
  ),
)
