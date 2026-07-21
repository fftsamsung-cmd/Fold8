import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export interface StackingCardSlide {
  name: string
  designation: string
  quote: string
  media: string
  isVideo?: boolean
}

const SHRINK_SCALE = 0.78
const SHRINK_BRIGHTNESS = 0.25
const ENTER_SCALE = 0.7
const ENTER_BRIGHTNESS = 0.25

/* GSAP ScrollTrigger stacking cards, sliding in from the right (RTL forward
   direction) instead of rising from below. Unlike the earlier per-card-pin
   version, every card here is absolutely stacked in the exact same spot —
   only one viewport-height element (`.stack-cards__viewport`) is ever
   pinned, for the whole `slides.length * 100dvh` scroll run, so cards never
   naturally drift with document flow. Reveal is a plain `translateX` (via
   GSAP's xPercent) driven off pixel sub-ranges of that single scroll run —
   card i's entrance spans the SAME sub-range as card (i-1)'s shrink-out, so
   the two stay locked in step (one arrives exactly as fast as the other is
   covered). Only `transform`/`filter` are animated — no layout properties
   are touched per frame. */
export function StackingCards({ slides }: { slides: StackingCardSlide[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const innerRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const compactCardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [activeIndex, setActiveIndex] = useState(0)
  // Lets the resize handler tear GSAP's pin down *before* flipping isCompact
  // — React's own reconciliation removes this subtree as part of that same
  // state update, and it only knows how to remove nodes matching what it
  // originally rendered. GSAP's pin had restructured the DOM by then
  // (wrapping the pinned viewport in a `.pin-spacer` it inserted), so if
  // that's still in place when React tries to remove the old branch, it
  // crashes with "node to be removed is not a child of this node." Reverting
  // first restores the original structure so React's removal succeeds.
  const revertRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const onResize = () => {
      const nowCompact = window.innerWidth < 768
      if (nowCompact) revertRef.current?.()
      setIsCompact(nowCompact)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isCompact) return
    const wrapper = wrapperRef.current
    const viewport = viewportRef.current
    if (!wrapper || !viewport) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const n = slides.length
    // Read live on every ScrollTrigger refresh (window resize etc.) rather
    // than once at mount, so each card's sub-range stays correct.
    const slot = () => window.innerHeight

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        pin: viewport,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(n - 1, Math.max(0, Math.round(self.progress * (n - 1))))
          setActiveIndex((prev) => (prev === idx ? prev : idx))
        },
      })

      innerRefs.current.forEach((inner, i) => {
        if (!inner) return

        // Entrance: every card but the first slides in from the right
        // (fully clear of the viewport, not just its own — narrower —
        // width) while growing to full scale/brightness, in lockstep with
        // its own approach to center.
        if (i > 0) {
          gsap.fromTo(
            inner,
            { x: window.innerWidth, scale: ENTER_SCALE, filter: `brightness(${ENTER_BRIGHTNESS})` },
            {
              x: 0,
              scale: 1,
              filter: 'brightness(1)',
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: () => `top+=${(i - 1) * slot()} top`,
                end: () => `top+=${i * slot()} top`,
                scrub: true,
              },
            }
          )
        }

        // Shrink-out: darkens/shrinks in place (no horizontal motion of its
        // own) as the next card slides in from the right and covers it.
        if (i < n - 1) {
          gsap.fromTo(
            inner,
            { scale: 1, filter: 'brightness(1)' },
            {
              scale: SHRINK_SCALE,
              filter: `brightness(${SHRINK_BRIGHTNESS})`,
              ease: 'none',
              scrollTrigger: {
                trigger: wrapper,
                start: () => `top+=${i * slot()} top`,
                end: () => `top+=${(i + 1) * slot()} top`,
                scrub: true,
              },
            }
          )
        }
      })
    }, wrapper)

    revertRef.current = () => ctx.revert()
    return () => {
      ctx.revert()
      revertRef.current = null
    }
  }, [isCompact, slides.length])

  // Only the currently-active slide's video plays in the desktop stack.
  useEffect(() => {
    if (isCompact) return
    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (i === activeIndex) video.play().catch(() => {})
      else video.pause()
    })
  }, [activeIndex, isCompact])

  // Compact fallback stacks every slide in normal flow, so play each card's
  // video only while it's actually visible on screen.
  useEffect(() => {
    if (!isCompact) return
    const cards = compactCardRefs.current.filter((el): el is HTMLDivElement => el !== null)
    if (!cards.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index)
          const video = videoRefs.current[idx]
          if (!video) return
          if (entry.isIntersecting) video.play().catch(() => {})
          else video.pause()
        })
      },
      { threshold: 0.35 }
    )
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [isCompact, slides])

  const renderMedia = (slide: StackingCardSlide, i: number) =>
    slide.isVideo ? (
      <video
        ref={(el) => {
          videoRefs.current[i] = el
        }}
        src={slide.media}
        muted
        loop
        playsInline
        className="stack-card__media"
      />
    ) : (
      <img src={slide.media} alt={slide.name} className="stack-card__media" />
    )

  const renderCaption = (slide: StackingCardSlide) => (
    <div className="stack-card__caption">
      <span className="stack-card__sub" dir="ltr">{slide.designation}</span>
      <h3 className="stack-card__name">{slide.name}</h3>
      <p className="stack-card__quote">{slide.quote}</p>
    </div>
  )

  if (isCompact) {
    return (
      <div className="stack-cards-compact">
        {slides.map((slide, i) => (
          <div
            key={slide.name}
            className="stack-cards-compact__card"
            data-index={i}
            ref={(el) => {
              compactCardRefs.current[i] = el
            }}
          >
            {renderMedia(slide, i)}
            <div className="stack-card__scrim" aria-hidden="true" />
            {renderCaption(slide)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="stack-cards" ref={wrapperRef} style={{ height: `${slides.length * 100}dvh` }}>
      <div className="stack-cards__viewport" ref={viewportRef}>
        {slides.map((slide, i) => (
          <div className="stack-card" style={{ zIndex: i + 1 }} key={slide.name}>
            <div
              className="stack-card__inner"
              ref={(el) => {
                innerRefs.current[i] = el
              }}
            >
              {renderMedia(slide, i)}
              <div className="stack-card__scrim" aria-hidden="true" />
              {renderCaption(slide)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
