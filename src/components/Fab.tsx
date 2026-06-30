import { useAppStore } from '@/store/useAppStore'

export function Fab() {
  const { authed, openAi } = useAppStore()
  if (!authed) return null
  return (
    <div
      onClick={openAi}
      className="lift"
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 30,
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 2l1.7 5.1 5.1 1.7-5.1 1.7L12 15.6l-1.7-5.1L5.2 8.8l5.1-1.7z" />
        <circle cx="18.5" cy="5.5" r="1.6" />
      </svg>
    </div>
  )
}
