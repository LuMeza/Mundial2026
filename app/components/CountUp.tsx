'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number | string
  duration?: number
  className?: string
  style?: React.CSSProperties
  prefix?: string
  suffix?: string
}

function isNumeric(v: number | string): v is number {
  return typeof v === 'number' && !isNaN(v)
}

export default function CountUp({ value, duration = 1200, className, style, prefix = '', suffix = '' }: Props) {
  const [display, setDisplay] = useState<string>(prefix + '0' + suffix)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    // Si no es número puro (ej. "#3", "72%") hacemos count-up igualmente
    let target = 0
    let isString = false
    let strPrefix = prefix
    let strSuffix = suffix

    if (typeof value === 'string') {
      // Extraer número de strings como "#3" o "72%"
      const match = value.match(/^([^0-9-]*)(-?\d+(?:\.\d+)?)([^0-9]*)$/)
      if (match) {
        strPrefix = prefix + match[1]
        target = parseFloat(match[2])
        strSuffix = match[3] + suffix
        isString = true
      } else {
        // No hay número — mostrar tal cual con una entrada fade
        setDisplay(value)
        return
      }
    } else {
      target = value
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      setDisplay(strPrefix + current + strSuffix)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <span className={className} style={style}>{display}</span>
}
