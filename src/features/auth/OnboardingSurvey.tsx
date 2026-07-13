// 회원가입(로그인) 직후 개인화 설문 — 4스텝 위저드 (전부 스킵 가능, 행동 > 선언).
// 축·선택지는 be user_preference 설계 확정안 (usePrefStore 상수).
import { useState } from 'react'
import { BrandLogo } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'
import { usePrefStore, CATEGORY_OPTIONS, AVOID_OPTIONS, VIBE_OPTIONS, INTENSITY_OPTIONS } from '@/store/usePrefStore'
import type { Category } from '@/types'

export function OnboardingSurvey() {
  const [step, setStep] = useState(0)
  const toast = useAppStore((s) => s.toast)
  const pref = usePrefStore()

  const steps = [
    {
      q: '어떤 활동을 좋아하세요?',
      sub: '여러 개 골라도 돼요',
      options: CATEGORY_OPTIONS as string[],
      isOn: (o: string) => pref.preferredCategories.includes(o as Category),
      pick: (o: string) => pref.toggleCategory(o as Category),
    },
    {
      q: '피하고 싶은 건 뭐예요?',
      sub: '이런 건 추천에서 빼드릴게요',
      options: AVOID_OPTIONS,
      isOn: (o: string) => pref.avoid.includes(o),
      pick: (o: string) => pref.toggleAvoid(o),
    },
    {
      q: '어떤 분위기가 좋으세요?',
      sub: '딱 하나만요',
      options: VIBE_OPTIONS,
      isOn: (o: string) => pref.vibe === o,
      pick: (o: string) => pref.setVibe(pref.vibe === o ? null : o), // 단일 선택 (재클릭 = 해제)
    },
    {
      q: '하루를 얼마나 채우고 싶으세요?',
      sub: '추천 개수·강도에 반영돼요',
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

      <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
        <div className="tile" style={{ padding: '26px 26px 24px', animation: 'rb-pop .22s ease' }}>
          {/* header: 로고 + 스텝 도트 + 전체 스킵 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrandLogo size={30} id="surveylg" />
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i <= step ? '#15795A' : '#E1E5EC', transition: 'all .2s ease' }} />
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div onClick={skipAll} className="hbtn" style={{ fontSize: 12.5, fontWeight: 700, color: '#A39C8E', cursor: 'pointer' }}>
              나중에 할게요
            </div>
          </div>

          {/* question */}
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.4px', marginTop: 22 }}>{cur.q}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8B8579', marginTop: 5 }}>{cur.sub}</div>

          {/* options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            {cur.options.map((o) => {
              const on = cur.isOn(o)
              return (
                <div
                  key={o}
                  onClick={() => cur.pick(o)}
                  className="hbtn"
                  style={{ padding: '13px 14px', borderRadius: 13, fontSize: 14.5, fontWeight: 700, textAlign: 'center', cursor: 'pointer', background: on ? '#17150F' : '#F0F2F6', color: on ? '#fff' : '#5A554B', border: `1.5px solid ${on ? '#17150F' : 'transparent'}` }}
                >
                  {o}
                </div>
              )
            })}
          </div>

          {/* footer */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
            {step > 0 ? (
              <div onClick={() => setStep(step - 1)} className="hbtn" style={{ fontSize: 13.5, fontWeight: 700, color: '#8B8579', cursor: 'pointer', padding: '10px 6px' }}>
                이전
              </div>
            ) : (
              <div />
            )}
            <div style={{ flex: 1 }} />
            <div onClick={next} className="lift" style={{ background: '#17150F', color: '#fff', fontSize: 14.5, fontWeight: 800, borderRadius: 14, padding: '13px 30px', cursor: 'pointer' }}>
              {last ? '시작하기' : '다음'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 500, color: '#A39C8E', marginTop: 16, lineHeight: 1.7 }}>
          응답은 추천 정확도에만 쓰여요 · 쓸수록 취향을 더 잘 알아가요
        </div>
      </div>
    </div>
  )
}
