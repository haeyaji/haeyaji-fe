// 날씨 → 시각 토큰 + 수치 파생, 날씨별 추천 장소 매핑, 게이지 색상.
// 시안의 결정론적 규칙을 그대로 옮김. (추후 weatherApi/recommendApi가 대체)
import type { DayWeather, PlaceCat, WeatherCond, WeekDay } from '@/types'
import { WEEK } from './mockData'

export const condKo: Record<WeatherCond, string> = {
  sunny: '대체로 맑음',
  cloudy: '구름 많음',
  rainy: '비 소식',
}

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
  return {
    ...base,
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
