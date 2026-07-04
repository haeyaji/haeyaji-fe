// 날씨 → 시각 토큰 + 수치 파생, 날씨별 추천 장소 매핑, 게이지 색상.
// 시안의 결정론적 규칙을 그대로 옮김. (추후 weatherApi/recommendApi가 대체)
import type { DayWeather, PlaceCat, TimeOfDay, WeatherCond } from '@/types'
import type { WeatherRaw } from '@/api/weatherApi'
import { useWeatherStore } from '@/store/useWeatherStore'
import { dayNum, dayState, parseKey } from './dates'

export const condKo: Record<WeatherCond, string> = {
  sunny: '대체로 맑음',
  cloudy: '구름 많음',
  rainy: '비 소식',
  snowy: '눈 소식',
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

/** 조건 × 시간대 배경 매트릭스. 멀티레이어(광원 radial + 3단 linear)로 하늘 깊이감. */
const SKY: Record<WeatherCond, Record<TimeOfDay, SkyToken>> = {
  sunny: {
    dawn: {
      sky: 'radial-gradient(900px 460px at 78% 106%, rgba(255,176,116,.8), transparent 62%), linear-gradient(168deg, #8FA6CC 0%, #D9B99C 62%, #F4CBA2 100%)',
      glow: 'rgba(255,206,150,.65)', ink: '#33291F', iconC: '#F2812B',
    },
    day: {
      sky: 'radial-gradient(1100px 520px at 84% -8%, rgba(255,240,190,.9), transparent 56%), linear-gradient(165deg, #5FA8E4 0%, #9CC8EC 48%, #E2EFF7 100%)',
      glow: 'rgba(255,246,214,.8)', ink: '#122A45', iconC: '#F6A81C',
    },
    dusk: {
      sky: 'radial-gradient(900px 500px at 80% 102%, rgba(255,132,72,.8), transparent 62%), linear-gradient(168deg, #43436E 0%, #96628E 46%, #E58A55 100%)',
      glow: 'rgba(255,168,110,.6)', ink: '#FBF2EC', iconC: '#FFB25E',
    },
    night: {
      sky: 'radial-gradient(760px 420px at 78% -6%, rgba(96,132,205,.5), transparent 60%), linear-gradient(170deg, #0C1428 0%, #1A2A4A 55%, #34497A 100%)',
      glow: 'rgba(130,160,225,.4)', ink: '#EDF2FB', iconC: '#FBD36B',
    },
  },
  cloudy: {
    dawn: {
      sky: 'radial-gradient(800px 400px at 78% 104%, rgba(240,200,170,.5), transparent 60%), linear-gradient(166deg, #96A2B2 0%, #BEC7D1 55%, #E2E7EC 100%)',
      glow: 'rgba(255,240,225,.5)', ink: '#26303B', iconC: '#7A8794',
    },
    day: {
      sky: 'radial-gradient(950px 430px at 82% -10%, rgba(255,255,255,.75), transparent 56%), linear-gradient(165deg, #8695A8 0%, #B4C0CC 52%, #E0E6EC 100%)',
      glow: 'rgba(255,255,255,.6)', ink: '#26303B', iconC: '#5E6B78',
    },
    dusk: {
      sky: 'radial-gradient(820px 420px at 80% 104%, rgba(230,160,120,.45), transparent 60%), linear-gradient(168deg, #6E7386 0%, #9B96A2 52%, #C9B9B2 100%)',
      glow: 'rgba(255,220,195,.45)', ink: '#F5F1EE', iconC: '#B9AFB4',
    },
    night: {
      sky: 'radial-gradient(700px 380px at 76% -8%, rgba(120,140,175,.4), transparent 58%), linear-gradient(170deg, #141B26 0%, #29343F 58%, #47525F 100%)',
      glow: 'rgba(150,170,200,.32)', ink: '#E9EDF3', iconC: '#9AA6B4',
    },
  },
  snowy: {
    dawn: {
      sky: 'radial-gradient(820px 400px at 78% 104%, rgba(250,215,190,.4), transparent 58%), linear-gradient(166deg, #A9B6C6 0%, #CBD5DF 55%, #EAF0F5 100%)',
      glow: 'rgba(255,245,235,.5)', ink: '#26313D', iconC: '#8FA6BC',
    },
    day: {
      sky: 'radial-gradient(950px 430px at 82% -10%, rgba(255,255,255,.85), transparent 56%), linear-gradient(165deg, #9FB2C4 0%, #C6D3DE 52%, #EDF2F6 100%)',
      glow: 'rgba(255,255,255,.7)', ink: '#26313D', iconC: '#8FA6BC',
    },
    dusk: {
      sky: 'radial-gradient(820px 420px at 80% 104%, rgba(235,180,150,.4), transparent 58%), linear-gradient(168deg, #6E7A8E 0%, #9AA6B6 52%, #C9D2DC 100%)',
      glow: 'rgba(255,230,210,.4)', ink: '#F4F6F9', iconC: '#C6D3DF',
    },
    night: {
      sky: 'radial-gradient(700px 380px at 76% -8%, rgba(140,165,205,.4), transparent 58%), linear-gradient(170deg, #1A2331 0%, #303C4D 58%, #4E5B6D 100%)',
      glow: 'rgba(170,190,220,.32)', ink: '#ECF1F8', iconC: '#B9C8DA',
    },
  },
  rainy: {
    dawn: {
      sky: 'radial-gradient(780px 380px at 76% -8%, rgba(255,255,255,.3), transparent 56%), linear-gradient(168deg, #6E7E93 0%, #93A3B4 55%, #BCC8D4 100%)',
      glow: 'rgba(255,255,255,.35)', ink: '#1B2833', iconC: '#4E6276',
    },
    day: {
      sky: 'radial-gradient(820px 400px at 78% -10%, rgba(255,255,255,.4), transparent 56%), linear-gradient(168deg, #5C7089 0%, #8A9CB0 54%, #BCC9D5 100%)',
      glow: 'rgba(255,255,255,.42)', ink: '#F2F5F9', iconC: '#DCE5EE',
    },
    dusk: {
      sky: 'radial-gradient(780px 400px at 78% 104%, rgba(210,150,120,.35), transparent 58%), linear-gradient(168deg, #4E5870 0%, #78808F 54%, #A3A5AC 100%)',
      glow: 'rgba(235,210,190,.32)', ink: '#F2EFEE', iconC: '#C6CBD6',
    },
    night: {
      sky: 'radial-gradient(680px 360px at 74% -8%, rgba(110,135,175,.38), transparent 56%), linear-gradient(170deg, #0F1622 0%, #202C3C 58%, #3A4757 100%)',
      glow: 'rgba(130,155,190,.3)', ink: '#E6ECF4', iconC: '#9FB2C8',
    },
  },
}

/** 밤 시간대인지 (오버레이·별 표시 판단용) */
export const isNight = (tod: TimeOfDay): boolean => tod === 'night'

// 자외선/미세먼지 수치 → 등급 문자열
export const uvLevel = (i: number): string => (i <= 2 ? '낮음' : i <= 5 ? '보통' : i <= 7 ? '높음' : i <= 10 ? '매우높음' : '위험')
export const dustLevel = (v: number): string => (v <= 30 ? '좋음' : v <= 80 ? '보통' : v <= 150 ? '나쁨' : '매우나쁨')

/** be 원시 날씨(WeatherRaw) → DayWeather. 시각 토큰/등급은 fe가 파생. */
export function deriveWeather(raw: WeatherRaw, tod: TimeOfDay, isToday = true): DayWeather {
  const cond: WeatherCond = (['sunny', 'cloudy', 'rainy', 'snowy'].includes(raw.cond) ? raw.cond : 'cloudy') as WeatherCond
  const uvIdx = raw.uvIndex ?? 0
  const dustVal = raw.pm10 ?? 0
  // 개수 고정: 전체 시간대에서 균등 샘플링으로 항상 5개 (다음날도 동일)
  const src = raw.hourly
  const N = Math.min(5, src.length)
  const picked = N > 0 ? Array.from({ length: N }, (_, i) => src[Math.round((i * (src.length - 1)) / Math.max(N - 1, 1))]) : []
  const hourly = picked.map((h, i) => ({ label: isToday && i === 0 ? '지금' : `${parseInt(h.time, 10)}시`, temp: h.temp, pop: h.pop }))
  return {
    ...SKY[cond][tod], // sky, glow, ink, iconC
    sub: '',
    tod,
    cond,
    temp: raw.temp,
    hi: raw.hi,
    lo: raw.lo,
    condKo: raw.condKo || condKo[cond],
    pop: raw.pop,
    humid: raw.humidity ?? 0,
    wind: raw.windMs != null ? Math.round(raw.windMs * 3.6) : 0, // m/s → km/h
    feels: raw.feels ?? raw.temp,
    uvLv: uvLevel(uvIdx),
    uvIdx,
    dustLv: dustLevel(dustVal),
    dustVal,
    hourly,
  }
}

/** 선택 날짜 날씨. 실날씨(be) 로드됐으면 그걸, 아니면 폴백. (컴포넌트 외부용 — 비반응형) */
export function dayWeather(id: string): DayWeather {
  const raw = useWeatherStore.getState().byDate[id]
  if (raw) return deriveWeather(raw, timeOfDay(), dayState(id) === 'today')
  return fallbackDayWeather(id)
}

/** 컴포넌트용 반응형 훅 — 실날씨 로드 시 자동 리렌더 */
export function useDayWeather(id: string): DayWeather {
  const raw = useWeatherStore((s) => s.byDate[id])
  return raw ? deriveWeather(raw, timeOfDay(), dayState(id) === 'today') : fallbackDayWeather(id)
}

/** 밝은 글자색(=어두운 배경)인지 — 칩/스크림 적응용 */
export function isLightInk(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return false
  const n = parseInt(m[1], 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150
}

/** 날짜 기반 의사 날씨 조건 (be 미로드/과거 폴백용, 결정적) */
export function pseudoCond(id: string): WeatherCond {
  const n = dayNum(id) + parseKey(id).getMonth()
  return (['sunny', 'cloudy', 'rainy'] as WeatherCond[])[n % 3]
}

function fallbackDayWeather(id: string): DayWeather {
  const c = pseudoCond(id)
  const month = parseKey(id).getMonth() + 1
  const base_hi = [8, 10, 15, 20, 24, 27, 30, 31, 27, 21, 14, 9][month - 1]
  const w = { hi: base_hi, lo: base_hi - 8 }
  const base = {
    sunny: { pop: 5, humid: 45, wind: 11, uvLv: '높음', uvIdx: 7, dustLv: '보통', dustVal: 42, sky: 'linear-gradient(160deg,#A6C6E6,#DEE9F1)', glow: 'rgba(255,248,225,.7)', ink: '#16263C', sub: '#3A4E63', iconC: '#F6B23A' },
    cloudy: { pop: 20, humid: 60, wind: 14, uvLv: '보통', uvIdx: 5, dustLv: '보통', dustVal: 48, sky: 'linear-gradient(160deg,#AEB8C2,#D8DEE4)', glow: 'rgba(255,255,255,.5)', ink: '#2A333C', sub: '#4A555E', iconC: '#5E6B78' },
    rainy: { pop: 80, humid: 82, wind: 19, uvLv: '낮음', uvIdx: 2, dustLv: '좋음', dustVal: 22, sky: 'linear-gradient(160deg,#8497AC,#BFCCD8)', glow: 'rgba(255,255,255,.4)', ink: '#1E2C3A', sub: '#3C4956', iconC: '#4E6276' },
    snowy: { pop: 70, humid: 75, wind: 12, uvLv: '낮음', uvIdx: 1, dustLv: '좋음', dustVal: 18, sky: 'linear-gradient(160deg,#B6C4D2,#E8EEF3)', glow: 'rgba(255,255,255,.6)', ink: '#26313D', sub: '#46525E', iconC: '#8FA6BC' },
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
  if (cond === 'rainy' || cond === 'snowy') return [{ id: 'p4', fit: 96 }, { id: 'p3', fit: 90 }, { id: 'p1', fit: 78 }]
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
  if (cond === 'rainy') return '비 소식이 있어요. 실내 위주로 추천해드릴게요.'
  if (cond === 'snowy') return '눈 소식이 있어요. 따뜻한 실내 위주로 추천해드릴게요.'
  if (cond === 'cloudy') return '선선한 날, 가볍게 걷기 좋은 코스를 찾아볼까요?'
  return '맑은 오후, 테라스 카페에서 일하기 좋아요.'
}

/** Date → 월요일 시작 요일 인덱스(월=0…일=6) — 루틴 요일 매칭용 */
export const dowIndexOf = (d: Date): number => (d.getDay() + 6) % 7
