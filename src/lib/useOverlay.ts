// 모달/드로어 공용 — 열려 있을 때 ESC로 닫기 + 배경 스크롤 락(중첩 안전 카운트).
import { useEffect, useRef } from 'react'

let lockCount = 0

/** active일 때만 ESC 닫기 + body 스크롤 락 활성화. onClose는 ref로 잡아 리스너 재등록 방지. */
export function useOverlay(active: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    lockCount++
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      if (--lockCount === 0) document.body.style.overflow = ''
    }
  }, [active])
}
