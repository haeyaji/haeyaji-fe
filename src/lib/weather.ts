// 날씨 → 시각 토큰 + 수치 파생, 날씨별 추천 장소 매핑, 게이지 색상.
// 시안의 결정론적 규칙을 그대로 옮김. (추후 weatherApi/recommendApi가 대체)
import type { DayWeather, PlaceCat, TimeOfDay, WeatherCond, WeekDay } from '@/types'
import { WEEK } from './mockData'

export const condKo: Record<WeatherCond, string> = {
  sunny: '대체로 맑음',
  cloudy: '구름 많음',
  rainy: '비 소식',
}

/** 실제 현재 시각 기준 시간대. be 붙기 전엔 브라우저 시간으로 배경이 살아있게. */
export function timeOfDay(hour = new Date().getHours()): TimeOfDay {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

interface SkyToken {
  sky: string
  glow: string
  ink: string
  iconC: string
}

/** 조건 × 시간대 배경 매트릭스. day는 기존 시안 값 유지, 나머지는 시간대에 맞춰 파생. */
const SKY: Record<WeatherCond, Record<TimeOfDay, SkyToken>> = {
  sunny: {
    dawn: { sky: 'linear-gradient(160deg,#F4CBA2,#DCE4EC)', glow: 'rgba(255,214,170,.6)', ink: '#3A2E28', iconC: '#F79A2B' },
    day: { sky: 'linear-gradient(160deg,#A6C6E6,#DEE9F1)', glow: 'rgba(255,248,225,.7)', ink: '#16263C', iconC: '#F6B23A' },
    dusk: { sky: 'linear-gradient(160deg,#E9A87C,#8E9CC0)', glow: 'rgba(255,190,140,.55)', ink: '#2A2233', iconC: '#F2682C' },
    night: { sky: 'linear-gradient(160deg,#1E2A44,#3A4A66)', glow: 'rgba(120,150,210,.35)', ink: '#EAF0F8', iconC: '#FBD36B' },
  },
  cloudy: {
    dawn: { sky: 'linear-gradient(160deg,#BFC3CC,#DDE1E6)', glow: 'rgba(255,255,255,.45)', ink: '#2A333C', iconC: '#7A8794' },
    day: { sky: 'linear-gradient(160deg,#AEB8C2,#D8DEE4)', glow: 'rgba(255,255,255,.5)', ink: '#2A333C', iconC: '#5E6B78' },
    dusk: { sky: 'linear-gradient(160deg,#9BA0AE,#C2B4B0)', glow: 'rgba(255,230,210,.4)', ink: '#2A2A33', iconC: '#6B6F7A' },
    night: { sky: 'linear-gradient(160deg,#232A36,#3C4552)', glow: 'rgba(150,165,190,.3)', ink: '#E6EAF0', iconC: '#9AA6B4' },
  },
  rainy: {
    dawn: { sky: 'linear-gradient(160deg,#8B98AC,#B9C4D0)', glow: 'rgba(255,255,255,.35)', ink: '#1E2C3A', iconC: '#4E6276' },
    day: { sky: 'linear-gradient(160deg,#8497AC,#BFCCD8)', glow: 'rgba(255,255,255,.4)', ink: '#1E2C3A', iconC: '#4E6276' },
    dusk: { sky: 'linear-gradient(160deg,#6E7A90,#9AA0AE)', glow: 'rgba(255,255,255,.3)', ink: '#1B2430', iconC: '#48566A' },
    night: { sky: 'linear-gradient(160deg,#1B2430,#333E4E)', glow: 'rgba(130,150,180,.28)', ink: '#DFE6EF', iconC: '#8FA0B4' },
  },
}

/** 밤 시간대인지 (오버레이·별 표시 판단용) */
export const isNight = (tod: TimeOfDay): boolean => tod === 'night'

export function dayMeta(id: string): WeekDay {
  return WEEK.find((w) => w.id === id) ?? WEEK[4]
}

export function dayWeather(id: string): DayWeather {
  const w = dayMeta(id)
  const c = w.cond
  const base = {
    sunny: { pop: 5, humid: 45, wind: 11, uvLv: '높음', uvIdx: 7, dustLv: '보통', dustVal: 42, sky: 'linear-gradient(160deg,#A6C6E6,#DEE9F1)', glow: 'rgba(255,248,225,.7)', ink: '#16263C', sub: '#3A4E63', iconC: '#F6B23A' },
    cloudy: { pop: 20, humid: 60, wind: 14, uvLv: '보통', uvIdx: 5, dustLv: '보통', dustVal: 48, sky: 'linear-gradient(160deg,#AEB8C2,#D8DEE4)', glow: 'rgba(255,255,255,.5)', ink: '#2A333C', sub: '#4A555E', iconC: '#5E6B78' },
    rainy: { pop: 80, humid: 82, wind: 19, uvLv: '낮음', uvIdx: 2, dustLv: '좋음', dustVal: 22, sky: 'linear-gradient(160deg,#8497AC,#BFCCD8)', glow: 'rgba(255,255,255,.4)', ink: '#1E2C3A', sub: '#3C4956', iconC: '#4E6276' },
  }[c]
  const temp = w.hi - 1
  const hourly = [
    { label: '지금', temp, pop: base.pop },
    { label: '15시', temp: w.hi, pop: Math.max(0, base.pop - 2) },
    { label: '16시', temp: w.hi - 1, pop: base.pop },
    { label: '17시', temp: temp - 1, pop: base.pop },
    { label: '18시', temp: w.lo + 2, pop: Math.min(95, base.pop + 5) },
  ]
  const tod = timeOfDay()
  return {
    ...base,
    ...SKY[c][tod], // 시간대별 sky/glow/ink/iconC 오버라이드
    tod,
    cond: c,
    temp,
    hi: w.hi,
    lo: w.lo,
    condKo: condKo[c],
    feels: temp + (c === 'sunny' ? 1 : c === 'rainy' ? -1 : 0),
    hourly,
  }
}

/** 날씨별 추천 장소 (id + 적합도). 시안 recsFor 그대로 */
export function recsFor(cond: WeatherCond): { id: string; fit: number }[] {
  if (cond === 'rainy') return [{ id: 'p4', fit: 96 }, { id: 'p3', fit: 90 }, { id: 'p1', fit: 78 }]
  if (cond === 'cloudy') return [{ id: 'p1', fit: 92 }, { id: 'p3', fit: 88 }, { id: 'p2', fit: 80 }]
  return [{ id: 'p2', fit: 94 }, { id: 'p1', fit: 92 }, { id: 'p3', fit: 86 }]
}

export function catGrad(cat: PlaceCat): string {
  return (
    {
      cafe: 'linear-gradient(150deg,#E3D9C6,#CDBE9E)',
      park: 'linear-gradient(150deg,#CFE0BE,#A9C99A)',
      food: 'linear-gradient(150deg,#E8DCC8,#D6C2A0)',
      culture: 'linear-gradient(150deg,#CBC6E0,#A9A2CC)',
    } as Record<PlaceCat, string>
  )[cat]
}

export function uvColor(i: number): string {
  return i <= 2 ? '#3E9B63' : i <= 5 ? '#D89A2A' : i <= 7 ? '#DD7A35' : i <= 10 ? '#C2453B' : '#8E3FB0'
}

export function dustColor(v: number): string {
  return v <= 30 ? '#3E9B63' : v <= 80 ? '#D89A2A' : v <= 150 ? '#DD7A35' : '#C2453B'
}

export function aiHint(cond: WeatherCond): string {
  return cond === 'rainy'
    ? '비 소식이 있어요. 실내 위주로 추천해드릴게요.'
    : cond === 'cloudy'
      ? '선선한 날, 가볍게 걷기 좋은 코스를 찾아볼까요?'
      : '맑은 오후, 테라스 카페에서 일하기 좋아요.'
}

export const dowIndex = (date: number): number => (date + 1) % 7 // 5월 1일=수
