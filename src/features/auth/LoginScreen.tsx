import { BrandLogo } from '@/lib/icons'
import { useAppStore } from '@/store/useAppStore'

export function LoginScreen() {
  const login = useAppStore((s) => s.login)

  return (
    <div
      style={{
        minHeight: 'var(--full-vh)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        color: '#17150F',
        background: 'var(--canvas)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -90, left: -60, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,#BBD3EC,transparent 70%)', filter: 'blur(20px)' }} />
      <div style={{ position: 'absolute', bottom: -110, right: -70, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,#CFE0BE,transparent 70%)', filter: 'blur(20px)' }} />
      <div style={{ width: '100%', maxWidth: 404, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 88, height: 88, borderRadius: 26, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 34px rgba(24,21,15,.12)', border: '1px solid rgba(24,21,15,.04)' }}>
            <BrandLogo size={56} id="loginlg" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.8px', marginTop: 16 }}>해야지</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#8B8579', marginTop: 7 }}>날씨에 맞춰 오늘 할 일을 추천해드려요</div>
        </div>

        <div className="tile" style={{ padding: '26px 24px' }}>
          <div
            onClick={() => login('카카오 계정으로 로그인했어요')}
            className="lift"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#FEE500', borderRadius: 14, padding: 16, cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
              <path d="M12 3.4C6.8 3.4 2.6 6.7 2.6 10.8c0 2.6 1.8 4.9 4.5 6.2-.2.7-.7 2.5-.8 2.9-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.4 0 .8.1 1.2.1 5.2 0 9.4-3.3 9.4-7.4S17.2 3.4 12 3.4z" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3C1E1E' }}>카카오로 시작하기</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, fontWeight: 600, color: '#A39C8E' }}>카카오 계정으로 간편하게 시작하세요</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 500, color: '#A39C8E', marginTop: 18, lineHeight: 1.7 }}>
          계속 진행하면 <span style={{ fontWeight: 700, color: '#8B8579' }}>이용약관</span> 및 <span style={{ fontWeight: 700, color: '#8B8579' }}>개인정보 처리방침</span>에<br />
          동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  )
}
