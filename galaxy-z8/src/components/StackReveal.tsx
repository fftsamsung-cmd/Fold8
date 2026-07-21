import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './StackReveal.css'

/* Scroll-jacked stacking reveal: the first item waits on screen already;
   each further scroll tick brings the next item up and stacks it below
   the previous ones. The page only continues past this block once every
   item has been revealed (and back to just the first one scrolling up). */
export default function StackReveal({
  items,
  scrollHeightVh = 55,
}: {
  items: { src: string; alt: string }[]
  scrollHeightVh?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const stepRef = useRef(0)
  const lockedRef = useRef(false)
  const touchYRef = useRef(0)
  const lastRevealedRef = useRef(false)

  useEffect(() => {
    itemRefs.current.slice(1).forEach((el) => {
      if (el) gsap.set(el, { opacity: 0, y: 44, maxHeight: 0 })
    })
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    const sticky = stickyRef.current
    if (!wrap || !sticky || items.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      itemRefs.current.forEach((el) => el && gsap.set(el, { opacity: 1, y: 0 }))
      return
    }

    const lastIndex = items.length - 1

    // Docked = the sticky box still has room to stay pinned, i.e. the
    // wrapper hasn't scrolled past it yet. Tied to the sticky content's own
    // height rather than the full viewport — real scroll is frozen for the
    // whole step sequence anyway (every captured wheel/touch event calls
    // preventDefault), so this only needs a small margin, not a full screen.
    const isDocked = () => {
      const dockTop = parseFloat(getComputedStyle(sticky).top) || 0
      const stickyHeight = sticky.getBoundingClientRect().height
      const rect = wrap.getBoundingClientRect()
      return rect.top <= dockTop + 1 && rect.bottom > dockTop + stickyHeight + 1
    }

    const reveal = (index: number) => {
      const el = itemRefs.current[index]
      if (!el) return
      if (index === lastIndex) lastRevealedRef.current = false
      // Measure the item's real (unclipped) content height so the box grows
      // to exactly the right size instead of guessing a fixed value.
      const prevMaxHeight = el.style.maxHeight
      el.style.maxHeight = 'none'
      const target = el.scrollHeight
      el.style.maxHeight = prevMaxHeight
      gsap.to(el, {
        opacity: 1,
        y: 0,
        maxHeight: target,
        duration: 0.6,
        ease: 'power3.out',
        onComplete: () => {
          if (index === lastIndex) lastRevealedRef.current = true
        },
      })
    }
    const hide = (index: number) => {
      const el = itemRefs.current[index]
      if (!el) return
      if (index === lastIndex) lastRevealedRef.current = false
      gsap.to(el, { opacity: 0, y: 44, maxHeight: 0, duration: 0.4, ease: 'power2.in' })
    }

    const go = (dir: 1 | -1) => {
      const next = Math.min(lastIndex, Math.max(0, stepRef.current + dir))
      if (next === stepRef.current) return
      if (dir > 0) reveal(next)
      else hide(stepRef.current)
      stepRef.current = next
      lockedRef.current = true
      setTimeout(() => {
        lockedRef.current = false
      }, 550)
    }

    // Going down is only allowed to release once the last item has fully
    // finished rising into place — not merely once it started animating.
    const shouldRelease = (goingDown: boolean) =>
      (goingDown && stepRef.current >= lastIndex && lastRevealedRef.current) ||
      (!goingDown && stepRef.current <= 0)

    const onWheel = (e: WheelEvent) => {
      if (!isDocked() || shouldRelease(e.deltaY > 0)) return
      e.preventDefault()
      if (lockedRef.current || Math.abs(e.deltaY) < 4) return
      go(e.deltaY > 0 ? 1 : -1)
    }

    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      const delta = touchYRef.current - y
      if (!isDocked() || shouldRelease(delta > 0)) return
      e.preventDefault()
      if (lockedRef.current || Math.abs(delta) < 24) return
      go(delta > 0 ? 1 : -1)
      touchYRef.current = y
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [items])

  return (
    <div className="stack-reveal" ref={wrapRef} style={{ height: `${scrollHeightVh}vh` }}>
      <div className="stack-reveal__sticky" ref={stickyRef}>
        <div className="stack-reveal__stack">
          {items.map((item, i) => (
            <div
              className="stack-reveal__item"
              key={item.src}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
            >
              <img src={item.src} alt={item.alt} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
