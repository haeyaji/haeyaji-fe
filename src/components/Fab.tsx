// AI 추천 말풍선 FAB — 챗 위젯(AiDrawer)의 단일 진입점. 열려 있으면 ×로 전환.
import { useAppStore } from '@/store/useAppStore'

export function Fab() {
  const { authed, aiOpen, openAi, closeAi } = useAppStore()
  if (!authed) return null
  return (
    <div
      onClick={() => (aiOpen ? closeAi() : openAi())}
      className="lift"
      title={aiOpen ? '닫기' : 'AI 추천'}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 42,
        width: 58,
        height: 58,
        borderRadius: '50%',
        background: '#17150F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 14px 30px rgba(24,21,15,.32)',
      }}
    >
      {aiOpen ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      ) : (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
          {/* 말풍선 + 스파클 */}
          <path d="M12 3C7 3 3 6.4 3 10.6c0 2.4 1.3 4.5 3.3 5.9-.2.8-.6 2.1-.7 2.5-.1.4.2.5.4.4.3-.1 2.3-1.5 3.2-2.1.6.1 1.2.2 1.8.2 5 0 9-3.4 9-7.6S17 3 12 3z" />
          <path d="M19.5 2.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" />
        </svg>
      )}
    </div>
  )
}
