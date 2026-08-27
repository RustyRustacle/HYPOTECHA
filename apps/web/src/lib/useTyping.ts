import { useState, useEffect } from 'react'

const phrases = [
  'Encumbrance Registry',
  'Collateral Enforcement',
  'Double-Pledge Protection',
  'On-Chain Audit Trail',
]

export function useTyping(active: boolean, speed = 90, pause = 1800) {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!active) return
    const word = phrases[index % phrases.length]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && text.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && text.length === 0) {
      setDeleting(false)
      setIndex((i) => i + 1)
    } else {
      timeout = setTimeout(
        () => {
          setText(word.slice(0, text.length + (deleting ? -1 : 1)))
        },
        deleting ? speed / 2 : speed
      )
    }
    return () => clearTimeout(timeout)
  }, [text, deleting, index, active, speed, pause])

  return `${text}|`
}
