import { useAppStore } from '@/store/useAppStore'

export function Toast() {
  const { showToast, toastText } = useAppStore()
  if (!showToast) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 30,
        left: '50%',
        zIndex: 90, // 모든 모달/드로어 위 (LabelManager 70 등)
        background: '#17150F',
        color: '#fff',
        padding: '13px 24px',
        borderRadius: 14,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: '0 14px 34px rgba(24,21,15,.34)',
        animation: 'rb-toast .25s ease',
      }}
    >
      {toastText}
    </div>
  )
}
