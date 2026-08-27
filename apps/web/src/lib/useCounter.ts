import { useState, useEffect, useRef } from 'react'

export function useCounter(target: number, duration = 1600, run = false) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!run || started.current) return
    started.current = true
    let startTime: number | null = null
    let raf = 0

    const step = (ts: number) => {
      if (startTime === null) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [run, target, duration])

  return value
}
