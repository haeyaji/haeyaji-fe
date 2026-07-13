// 회원가입(로그인) 직후 개인화 설문 — 4스텝 위저드 (전부 스킵 가능, 행동 > 선언).
// 축·선택지는 be user_preference 설계 확정안 (usePrefStore 상수).
// UI 레퍼런스: 배민/당근류 온보딩 — 카운터 + 큰 질문 + 정사각 이모지 타일(라벨 하단).
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore, CATEGORY_OPTIONS, AVOID_OPTIONS, VIBE_OPTIONS, INTENSITY_OPTIONS } from '@/store/usePrefStore'
import type { Category } from '@/types'

// 선택지별 스트로크 아이콘 (Lucide 계열 패스, 표시 전용 — 저장 문자열은 be 계약 그대로)
const ICONS: Record<string, string> = {
  야외: '<circle cx="6" cy="6" r="2.4"/><path d="m9.5 8.5 4.5 12.5"/><path d="M13 21H2l5-9 3 5.4"/><path d="M22 21h-9l4.5-8z"/>',
  실내: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  휴식: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/><path d="M5 18v2M19 18v2"/>',
  생산성: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
  사람만나기: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  '맛집/카페': '<path d="M5 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M20 15V2a5 5 0 0 0-4 4.9V13a2 2 0 0 0 2 2h2Z"/><path d="M20 15v7"/>',
  '시끄러운 곳': '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  '사람 많은 곳': '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
  '많이 걷기': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4M4 13h4"/>',
  '비싼 곳': '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  '멀리 가기': '<path d="M5 11l1.4-4.2A2 2 0 0 1 8.3 5.4h7.4a2 2 0 0 1 1.9 1.4L19 11M5 11h14v5H5zM7 16v1.6M17 16v1.6"/><circle cx="8" cy="13.4" r=".6"/><circle cx="16" cy="13.4" r=".6"/>',
  '오래 걸리는 것': '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  조용한: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  활기찬: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  감성적인: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  트렌디한: '<path d="M12 3l1.9 5.6a2 2 0 0 0 1.3 1.3L20.8 12l-5.6 1.9a2 2 0 0 0-1.3 1.3L12 20.8l-1.9-5.6a2 2 0 0 0-1.3-1.3L3.2 12l5.6-1.9a2 2 0 0 0 1.3-1.3z"/><path d="M19 3v4M21 5h-4"/>',
  편안한: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  가볍게: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
  적당히: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  적극적으로: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
}

function OptIcon({ name, on }: { name: string; on: boolean }) {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 24 24"
      fill="none"
      stroke={on ? '#15795A' : '#8B8579'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '<circle cx="12" cy="12" r="9"/>' }}
    />
  )
}

export function OnboardingSurvey() {
  const [step, setStep] = useState(0)
  const toast = useAppStore((s) => s.toast)
  const nickname = useAppStore((s) => s.nickname)
  const pref = usePrefStore()

  const steps = [
    {
      q: `반가워요 ${nickname}님,\n어떤 활동을 좋아하세요?`,
      sub: '여러 개 골라도 돼요',
      options: CATEGORY_OPTIONS as string[],
      isOn: (o: string) => pref.preferredCategories.includes(o as Category),
      pick: (o: string) => pref.toggleCategory(o as Category),
    },
    {
      q: '피하고 싶은 건\n뭐예요?',
      sub: '이런 건 추천에서 빼드릴게요',
      options: AVOID_OPTIONS,
      isOn: (o: string) => pref.avoid.includes(o),
      pick: (o: string) => pref.toggleAvoid(o),
    },
    {
      q: '어떤 분위기가\n좋으세요?',
      sub: '딱 하나만 골라주세요',
      options: VIBE_OPTIONS,
      isOn: (o: string) => pref.vibe === o,
      pick: (o: string) => pref.setVibe(pref.vibe === o ? null : o), // 단일 선택 (재클릭 = 해제)
    },
    {
      q: '하루를 얼마나\n채우고 싶으세요?',
      sub: '추천 개수와 강도에 반영돼요',
      options: INTENSITY_OPTIONS,
      isOn: (o: string) => pref.intensity === o,
      pick: (o: string) => pref.setIntensity(pref.intensity === o ? null : o),
    },
  ]
  const cur = steps[step]
  const last = step === steps.length - 1

  const next = () => {
    if (!last) {
      setStep(step + 1)
      return
    }
    pref.finishSurvey()
    toast('취향을 기억해둘게요')
  }
  const skipAll = () => {
    pref.finishSurvey()
    toast('언제든 다시 설정할 수 있어요')
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: '#17150F', background: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -90, left: -60, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,#BBD3EC,transparent 70%)', filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', bottom: -110, right: -70, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,#CFE0BE,transparent 70%)', filter: 'blur(20px)' }} />

      <div style={{ width: '100%', maxWidth: 620, position: 'relative' }}>
        <div className="tile" style={{ padding: '38px 44px 36px', borderRadius: 28 }}>
          {/* counter + 전체 스킵 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#8B8579' }}>
              <span style={{ color: '#15795A', fontWeight: 800 }}>{step + 1}</span> / {steps.length}
            </div>
            <div style={{ flex: 1 }} />
            <div onClick={skipAll} className="hbtn" style={{ fontSize: 15, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: '4px 2px' }}>
              나중에 할게요
            </div>
          </div>

          {/* question — step 바뀔 때마다 살짝 팝 */}
          <div key={step} style={{ animation: 'rb-pop .22s ease' }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.8px', lineHeight: 1.32, marginTop: 14, whiteSpace: 'pre-line' }}>{cur.q}</div>
            <div style={{ fontSize: 16.5, fontWeight: 600, color: '#5A554B', marginTop: 10 }}>{cur.sub}</div>

            {/* options: 정사각 이모지 타일 + 하단 라벨 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 14px', marginTop: 34 }}>
              {cur.options.map((o) => {
                const on = cur.isOn(o)
                return (
                  <div key={o} onClick={() => cur.pick(o)} className="lift" style={{ cursor: 'pointer' }}>
                    <div
                      style={{
                        position: 'relative',
                        height: 104,
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: on ? '#EAF5EF' : '#F4F6F8',
                        boxShadow: on ? 'inset 0 0 0 2px #15795A, 0 8px 20px rgba(21,121,90,.14)' : 'none',
                      }}
                    >
                      <OptIcon name={o} on={on} />
                      {on && (
                        <span style={{ position: 'absolute', top: 9, right: 9, width: 22, height: 22, borderRadius: '50%', background: '#15795A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7" /></svg>
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 10, fontSize: 16.5, fontWeight: on ? 800 : 700, color: on ? '#0F5A42' : '#17150F', letterSpacing: '-.2px' }}>{o}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* footer */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 36 }}>
            {step > 0 ? (
              <div onClick={() => setStep(step - 1)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15.5, fontWeight: 700, color: '#5A554B', cursor: 'pointer', padding: '12px 8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                이전
              </div>
            ) : (
              <div />
            )}
            <div style={{ flex: 1 }} />
            <div onClick={next} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#17150F', color: '#fff', fontSize: 16, fontWeight: 800, borderRadius: 16, padding: '16px 38px', cursor: 'pointer', boxShadow: '0 10px 24px rgba(24,21,15,.24)' }}>
              {last ? '시작하기' : '다음'}
              {!last && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: '#8B8579', marginTop: 16, lineHeight: 1.7 }}>
          응답은 추천 정확도에만 쓰여요 · 쓸수록 취향을 더 잘 알아가요
        </div>
      </div>
    </div>
  )
}
