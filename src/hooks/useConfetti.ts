import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti(active: boolean) {
  useEffect(() => {
    if (!active) return
    const duration = 1800
    const endTime = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#6ee786', '#9ad7ff', '#f4f1de', '#f87171'],
      })
      if (Date.now() < endTime) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [active])
}
