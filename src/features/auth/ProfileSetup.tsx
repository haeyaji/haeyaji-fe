// 신규(또는 닉네임 미설정) 회원 프로필 입력 — 표시 이름(닉네임).
// be member.nickname(2~10자·unique) 대응 → PATCH /members/me/nickname 저장 후 로컬 반영.
import { useState } from 'react'
import { BrandLogo } from '@/lib/icons'
import { usePrefStore } from '@/store/usePrefStore'
import { useAppStore } from '@/store/useAppStore'
import { updateNickname } from '@/api/authApi'

const MIN = 2
const MAX = 10

export function ProfileSetup() {
  const setNickname = usePrefStore((s) => s.setNickname)
  const toast = useAppStore((s) => s.toast)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const name = value.trim()
  const valid = name.length >= MIN && name.length <= MAX

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setErr('')
    try {
      await updateNickname(name) // be 저장(unique 검증). 실패 시 중복/검증 메시지 표시
      setNickname(name) // 성공 → 로컬 반영 (게이트 통과로 언마운트)
      toast(`반가워요, ${name}님`)
    } catch (e) {
      setErr((e as Error).message || '닉네임 설정에 실패했어요')
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: 'var(--full-vh)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: '#17150F', background: 'var(--canvas)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -90, left: -60, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,#BBD3EC,transparent 70%)', filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', bottom: -110, right: -70, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,#CFE0BE,transparent 70%)', filter: 'blur(20px)' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ width: 76, height: 76, borderRadius: 24, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 34px rgba(24,21,15,.12)', border: '1px solid rgba(24,21,15,.04)' }}>
            <BrandLogo size={48} id="setuplg" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.7px', marginTop: 16 }}>어떻게 불러드릴까요?</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: '#8B8579', marginTop: 8 }}>앱에서 사용할 이름을 알려주세요</div>
        </div>

        <div className="tile" style={{ padding: '26px 24px 24px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#8B8579', marginBottom: 9 }}>닉네임</div>
          <input
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value.slice(0, MAX)); setErr('') }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit() }}
            placeholder="2~10자"
            style={{ width: '100%', border: `1.5px solid ${err ? '#E5484D' : '#E7EAEF'}`, borderRadius: 14, outline: 'none', background: '#F9FAFB', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '15px 16px' }}
            onFocus={(e) => (e.target.style.border = '1.5px solid #15795A')}
            onBlur={(e) => (e.target.style.border = `1.5px solid ${err ? '#E5484D' : '#E7EAEF'}`)}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, minHeight: 18 }}>
            <div style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: '#E5484D' }}>{err}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#B6BCC7' }}>{name.length}/{MAX}</div>
          </div>
          <div
            onClick={submit}
            className={valid && !busy ? 'lift' : ''}
            style={{ marginTop: 8, textAlign: 'center', background: valid && !busy ? '#17150F' : '#D6D9DF', color: '#fff', fontSize: 16, fontWeight: 800, borderRadius: 15, padding: 16, cursor: valid && !busy ? 'pointer' : 'default', boxShadow: valid && !busy ? '0 10px 24px rgba(24,21,15,.22)' : 'none' }}
          >
            {busy ? '설정 중…' : '시작하기'}
          </div>
        </div>
      </div>
    </div>
  )
}
