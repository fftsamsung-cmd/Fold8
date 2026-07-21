import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface CountUpSpanProps {
  value: number
  isDecimal?: boolean
  className?: string
}

export function CountUpSpan({ value, isDecimal = false, className }: CountUpSpanProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: value,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true,
        },
        onUpdate() {
          el.textContent = isDecimal ? obj.val.toFixed(1) : Math.round(obj.val).toLocaleString('en-US')
        },
      })
    })
    return () => ctx.revert()
  }, [value, isDecimal])

  return (
    <span ref={ref} className={className}>
      {isDecimal ? value.toFixed(1) : value.toLocaleString('en-US')}
    </span>
  )
}
