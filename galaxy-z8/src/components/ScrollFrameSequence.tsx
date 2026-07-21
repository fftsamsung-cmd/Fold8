import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ScrollFrameSequence.css'

gsap.registerPlugin(ScrollTrigger)

/* Apple-style scroll-jacked image sequence: while the canvas is docked in
   view, wheel/touch input steps through frames instead of scrolling the
   page — the page only continues past this section once the user has
   scrolled all the way through the sequence (and back to frame 1 going up).

   variant="card" renders a bounded, aspect-ratio'd visual (the default).
   variant="background" fills the full viewport width as a section
   background, with `children` overlaid on top and revealed via GSAP once
   the section docks into view. */
export default function ScrollFrameSequence({
  frames,
  aspectRatio = '3 / 2',
  scrollHeightVh = 170,
  variant = 'card',
  children,
}: {
  frames: string[]
  aspectRatio?: string
  scrollHeightVh?: number
  variant?: 'card' | 'background'
  children?: ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const frameIndexRef = useRef(0)
  const touchYRef = useRef(0)
  const [loadedCount, setLoadedCount] = useState(0)

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current
    const img = imagesRef.current[index]
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    const canvasRatio = w / h
    const imgRatio = img.naturalWidth / img.naturalHeight
    let dw = w
    let dh = h
    let dx = 0
    let dy = 0
    if (imgRatio > canvasRatio) {
      dh = h
      dw = h * imgRatio
      dx = (w - dw) / 2
    } else {
      dw = w
      dh = w / imgRatio
      dy = (h - dh) / 2
    }
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, dx, dy, dw, dh)
  }

  useEffect(() => {
    let cancelled = false
    const imgs = frames.map((src, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      img.onload = () => {
        if (cancelled) return
        setLoadedCount((c) => c + 1)
        if (i === frameIndexRef.current) drawFrame(i)
      }
      return img
    })
    imagesRef.current = imgs
    frameIndexRef.current = 0
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames])

  useEffect(() => {
    const wrap = wrapRef.current
    const sticky = stickyRef.current
    if (!wrap || !sticky || frames.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(0)
      return
    }

    const lastIndex = frames.length - 1

    // "Docked" = the sticky canvas is currently pinned against its offset,
    // i.e. we're mid-way through the wrapper's scroll range.
    const isDocked = () => {
      const dockTop = parseFloat(getComputedStyle(sticky).top) || 0
      const rect = wrap.getBoundingClientRect()
      return rect.top <= dockTop + 1 && rect.bottom > window.innerHeight
    }

    const step = (delta: number) => {
      const dir = delta > 0 ? 1 : -1
      const magnitude = Math.max(1, Math.round(Math.abs(delta) / 10))
      const next = Math.min(lastIndex, Math.max(0, frameIndexRef.current + dir * magnitude))
      if (next !== frameIndexRef.current) {
        frameIndexRef.current = next
        drawFrame(next)
      }
    }

    const shouldRelease = (goingDown: boolean) =>
      (goingDown && frameIndexRef.current >= lastIndex) || (!goingDown && frameIndexRef.current <= 0)

    const onWheel = (e: WheelEvent) => {
      if (!isDocked() || shouldRelease(e.deltaY > 0)) return
      e.preventDefault()
      step(e.deltaY)
    }

    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      const delta = touchYRef.current - y // finger moving up = scrolling down
      if (!isDocked() || shouldRelease(delta > 0)) return
      e.preventDefault()
      step(delta * 1.6)
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
  }, [frames])

  useEffect(() => {
    const onResize = () => drawFrame(frameIndexRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reveal the overlaid content with GSAP once it scrolls into view.
  useEffect(() => {
    if (!children || !overlayRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0, y: 56 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: overlayRef.current, start: 'top 75%', once: true },
        }
      )
    }, overlayRef)
    return () => ctx.revert()
  }, [children])

  const progress = frames.length ? Math.round((loadedCount / frames.length) * 100) : 100
  const isBackground = variant === 'background'

  return (
    <div
      className={`scroll-frames${isBackground ? ' scroll-frames--background' : ''}`}
      ref={wrapRef}
      style={{ height: `${scrollHeightVh}vh` }}
    >
      <div className="scroll-frames__sticky" ref={stickyRef}>
        <canvas
          ref={canvasRef}
          className="scroll-frames__canvas"
          style={isBackground ? undefined : { aspectRatio }}
        />
        {isBackground && children && (
          <div className="scroll-frames__overlay" ref={overlayRef}>
            {children}
          </div>
        )}
        {progress < 100 && (
          <div className="scroll-frames__loader" aria-hidden="true">
            <span className="scroll-frames__loader-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
