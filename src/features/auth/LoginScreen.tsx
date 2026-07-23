import { BrandLogo } from '@/lib/icons'
import { oauthLoginUrl, Provider } from '@/api/authApi'

// 소셜 로그인 시작 — be authorization URL로 풀 이동(성공 시 be가 쿠키 세팅 후 /oauth/callback로 복귀)
const startLogin = (provider: Provider) => { window.location.href = oauthLoginUrl(provider) }

export function LoginScreen() {
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

        <div className="tile" style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            onClick={() => startLogin('kakao')}
            className="lift"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#FEE500', borderRadius: 14, padding: 15, cursor: 'pointer' }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3.4C6.8 3.4 2.6 6.7 2.6 10.8c0 2.6 1.8 4.9 4.5 6.2-.2.7-.7 2.5-.8 2.9-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.4 0 .8.1 1.2.1 5.2 0 9.4-3.3 9.4-7.4S17.2 3.4 12 3.4z" /></svg>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3C1E1E' }}>카카오로 시작하기</div>
          </div>
          <div
            onClick={() => startLogin('naver')}
            className="lift"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#03C75A', borderRadius: 14, padding: 15, cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M16.3 12.6L7.4 0H0v24h7.7V11.4L16.6 24H24V0h-7.7z" /></svg>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>네이버로 시작하기</div>
          </div>
          <div
            onClick={() => startLogin('google')}
            className="lift"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#fff', border: '1px solid #E1E5EC', borderRadius: 14, padding: 15, cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3C4043' }}>Google로 시작하기</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12.5, fontWeight: 600, color: '#A39C8E' }}>소셜 계정으로 간편하게 시작하세요</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 500, color: '#A39C8E', marginTop: 18, lineHeight: 1.7 }}>
          계속 진행하면 <span style={{ fontWeight: 700, color: '#8B8579' }}>이용약관</span> 및 <span style={{ fontWeight: 700, color: '#8B8579' }}>개인정보 처리방침</span>에<br />
          동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  )
}
