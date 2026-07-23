// 회원가입(로그인) 직후 개인화 설문 — 4스텝 위저드 (전부 스킵 가능, 행동 > 선언).
// 축·선택지는 be user_preference 설계 확정안 (usePrefStore 상수).
// UI 레퍼런스: 배민/당근류 온보딩 — 카운터 + 큰 질문 + 정사각 이모지 타일(라벨 하단).
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore, CATEGORY_OPTIONS, AVOID_OPTIONS, VIBE_OPTIONS, INTENSITY_OPTIONS } from '@/store/usePrefStore'
import { PrefIcon } from '@/features/profile/prefIcons'
import type { Category } from '@/types'

function OptIcon({ name, on }: { name: string; on: boolean }) {
  return <PrefIcon name={name} color={on ? '#15795A' : '#8B8579'} w={44} />
}

export function OnboardingSurvey() {
  const [step, setStep] = useState(0)
  const toast = useAppStore((s) => s.toast)
  const pref = usePrefStore()
  const nickname = pref.nickname

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
    <div style={{ minHeight: 'var(--full-vh)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: '#17150F', background: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -90, left: -60, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,#BBD3EC,transparent 70%)', filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', bottom: -110, right: -70, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,#CFE0BE,transparent 70%)', filter: 'blur(20px)' }} />

      <div style={{ width: '100%', maxWidth: 620, position: 'relative' }}>
        <div className="tile" style={{ padding: '38px 44px 36px', borderRadius: 28 }}>
          {/* counter + 전체 스킵 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#8B8579' }}>
              <span style={{ color: '#15795A', fontWeight: 800 }}>{step + 1}</span> / {steps.length}
            </div>
            <div style={{ flex: 1 }} />
            <div onClick={skipAll} className="hbtn" style={{ fontSize: 16, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: '4px 2px' }}>
              나중에 할게요
            </div>
          </div>

          {/* question — step 바뀔 때마다 살짝 팝 */}
          <div key={step} style={{ animation: 'rb-pop .22s ease' }}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.8px', lineHeight: 1.32, marginTop: 14, whiteSpace: 'pre-line' }}>{cur.q}</div>
            <div style={{ fontSize: 17.5, fontWeight: 600, color: '#5A554B', marginTop: 10 }}>{cur.sub}</div>

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
                    <div style={{ textAlign: 'center', marginTop: 11, fontSize: 18, fontWeight: on ? 800 : 700, color: on ? '#0F5A42' : '#17150F', letterSpacing: '-.2px' }}>{o}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* footer */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 36 }}>
            {step > 0 ? (
              <div onClick={() => setStep(step - 1)} className="hbtn" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 16.5, fontWeight: 700, color: '#5A554B', cursor: 'pointer', padding: '12px 8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                이전
              </div>
            ) : (
              <div />
            )}
            <div style={{ flex: 1 }} />
            <div onClick={next} className="lift" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#17150F', color: '#fff', fontSize: 17.5, fontWeight: 800, borderRadius: 17, padding: '17px 40px', cursor: 'pointer', boxShadow: '0 10px 24px rgba(24,21,15,.24)' }}>
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
