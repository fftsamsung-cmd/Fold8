import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CountUpSpan } from './CountUpSpan'
import { useIsCompact } from './SectionKit'
import PerformanceFrameSection from './PerformanceFrameSection'
import CameraFrameSection from './CameraFrameSection'
import BatterySection from './BatterySection'
import DesignSection from './DesignSection'
import SalesTip from './SalesTip'
import displayRevealVideo from '../assets/Ultra/תצוגה/hf_20260715_123831_c9bc1344-273c-455b-a6d7-d961ce7ade49.mp4'
import displayPhoneFrame from '../assets/Ultra/תצוגה/הקרנת סרטון.png'
import './UltraPage.css'

gsap.registerPlugin(ScrollTrigger)

/* Full spec table, broken into per-clause segments instead of one string
   per row — each segment carries its own "differs from Fold7 / Fold6"
   info, hand-set from the real spec (not a runtime string-equality check,
   since this table's copy is phrased more tersely than the comparison
   sheets even when the underlying spec is identical — e.g. this row's
   "ראשית 8.0” QXGA+" and Fold7's "8.0" פנימית Dynamic AMOLED 2X, 2184x1968,
   120Hz, 2600 nit" describe the same screen in different words). Segment
   text is written so simply concatenating every segment in order
   reproduces the exact original row copy (each non-first segment includes
   its own leading ", "), so choosing a comparison model never changes the
   wording — it only colors the clauses that actually changed. `diff[key]`
   is the OLD model's own value for that clause (shown as a small badge
   next to the highlight) — its presence is also what marks the clause as
   differing; omit the key entirely when it's the same as this row. */
type PreviousModelKey = '7' | '6'

// Explicit render order (not Object.keys order) — '7'/'6' are numeric-
// looking string keys, and JS objects always iterate integer-like keys in
// ascending numeric order regardless of source order, so Object.keys on
// PREVIOUS_MODEL_NAMES would silently put '6' before '7' in the dropdown.
const PREVIOUS_MODEL_ORDER: PreviousModelKey[] = ['7', '6']

type SpecSegment = { text: string; diff?: Partial<Record<PreviousModelKey, string>> }
type SpecRow = { label: string; segments: SpecSegment[] }

const PREVIOUS_MODEL_NAMES: Record<PreviousModelKey, string> = {
  '7': 'Fold7',
  '6': 'Fold6',
}

const SPEC_ROWS: SpecRow[] = [
  {
    label: 'תצוגה',
    segments: [
      { text: 'ראשית 8.0” QXGA+', diff: { '6': '7.6", 2160x1856' } },
      { text: ', מסך חיצוני 6.5” FHD+', diff: { '6': '6.3", 2376x968' } },
      { text: ', Dynamic AMOLED 2X, קצב רענון אדפטיבי 1-120Hz' },
    ],
  },
  {
    label: 'מצלמות אחוריות',
    segments: [
      { text: 'מערך צילום בעל 3 עדשות' },
      { text: ', רחבה במיוחד 50MP (F2.2)', diff: { '7': '12MP (F2.2)', '6': '12MP (F2.2)' } },
      { text: ', ראשית 200MP (F1.7)', diff: { '6': '50MP (F1.8)' } },
      { text: ', טלפוטו 10MP (3x, F2.4)' },
    ],
  },
  {
    label: 'מצלמה קדמית',
    segments: [
      { text: 'מסך פנימי 10MP (F2.2)', diff: { '6': '4MP תת-מסך (F2.2)' } },
      { text: ', מסך חיצוני 10MP (F2.2)' },
    ],
  },
  {
    label: 'מעבד',
    segments: [{ text: 'Snapdragon 8 Elite Gen 5 for Galaxy (3 nm)', diff: { '7': 'Snapdragon 8 Elite (3nm)', '6': 'Snapdragon 8 Gen 3 (4nm)' } }],
  },
  {
    label: 'זיכרון ואחסון',
    segments: [{ text: '256/512GB 12GB Ram, 1TB 16GB Ram', diff: { '6': '12GB בלבד, ללא אפשרות 16GB' } }],
  },
  {
    label: 'סוללה וטעינה',
    segments: [
      { text: '5,000 mAh', diff: { '7': '4,400 mAh', '6': '4,400 mAh' } },
      { text: ', טעינה מהירה במיוחד 45W 2.0', diff: { '7': '25W', '6': '25W' } },
      { text: ', טעינה אלחוטית מהירה במיוחד 2.0', diff: { '7': '25W, ללא גרסת 2.0', '6': 'לא צוינה טעינה אלחוטית' } },
    ],
  },
  {
    label: 'מידות ומשקל',
    segments: [
      { text: 'פתוח 4.1 x 158.4 x 143.2 מ"מ', diff: { '6': '5.6 x 132.6 x 153.5 מ"מ' } },
      { text: ', מקופל 8.9 x 158.4 x 72.8 מ"מ', diff: { '6': '12.1 x 68.1 x 153.5 מ"מ' } },
      { text: ', 214 גרם', diff: { '6': '239 גרם' } },
    ],
  },
]

function SpecValue({ segments, compareModel }: { segments: SpecSegment[]; compareModel: PreviousModelKey | null }) {
  return (
    <>
      {segments.map((seg, i) => {
        const oldValue = compareModel ? seg.diff?.[compareModel] : undefined
        if (!oldValue) return <span key={i}>{seg.text}</span>
        return (
          <span key={i}>
            <mark className="ultra-table__value-diff">{seg.text}</mark>
            <span className="ultra-table__value-was">{PREVIOUS_MODEL_NAMES[compareModel!]}: {oldValue}</span>
          </span>
        )
      })}
    </>
  )
}

function useReveal<T extends HTMLElement>(disabled = false) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 44,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true },
      })
    })
    return () => ctx.revert()
  }, [disabled])
  return ref
}

function Section({
  id,
  className = '',
  ariaLabel,
  tip,
  customReveal = false,
  children,
}: {
  id?: string
  className?: string
  ariaLabel: string
  tip?: string
  customReveal?: boolean
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>(customReveal)
  return (
    <section id={id} ref={ref} aria-label={ariaLabel} className={`ultra__section ${className}`}>
      {children}
      {tip && <SalesTip text={tip} />}
    </section>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="ultra__eyebrow">{children}</div>
}

/* One scroll-revealed text block within DisplayRevealSection's cinematic
   stage — either a step-by-step callout (Display Ratio) or a headline stat
   (Vision Booster), sharing the exact same video/phone/scrim background. */
type DisplaySlideContent = {
  headlineLine1: string
  headlineLine2: string
  body: string
  steps?: string[]
  stat?: { value: number; unit: string; label: string }
  stats?: { value: number; unit: string; label: string }[]
  tip?: string
}

/* Cinematic scroll-reveal slide, ported 1:1 (layout/type/color) from a
   Claude Design handoff — a fixed 1920x1080 "stage" scaled uniformly to fit
   the viewport (not a reflowing responsive layout, by design intent), with
   a background video, a right-darkening scrim, a left-anchored phone
   mockup, and an RTL text column. The handoff's slide was static with a
   slide-deck nav bar; here the nav bar is dropped (this site scrolls one
   page with anchored sections, not a slide deck) and the "static photo" is
   kept as our looping video, with a scroll-driven fade/settle entrance
   layered on top using the same rAF-lerp + threshold-reveal mechanism as
   PerformanceFrameSection. The stage now carries two content phases (Display
   Ratio, then Vision Booster) that crossfade in place over one continuous
   scroll — same background, same phone, only the text column swaps. */
function DisplayRevealSection({
  videoSrc,
  phoneFrameSrc,
  eyebrow,
  slides,
}: {
  videoSrc: string
  phoneFrameSrc: string
  eyebrow: string
  slides: DisplaySlideContent[]
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const compactWrapperRef = useRef<HTMLDivElement>(null)
  const compactMediaRef = useRef<HTMLDivElement>(null)
  const compactSlideRefs = useRef<(HTMLDivElement | null)[]>([])
  const compactProgressRef = useRef(0)
  const compactRafRef = useRef<number>(0)
  // Phase 0 = nothing revealed yet (phone/video still rising), 1 = first
  // slide, 2 = second slide. Hysteresis on each transition (enter further
  // than exit) keeps it from flickering if the user stops scrolling right
  // on a boundary.
  const [phase, setPhase] = useState(0)
  const phaseRef = useRef(0)
  // The 1920x1080 fixed-aspect "stage" is deliberately non-reflowing by
  // design intent (see comment above), but that breaks down completely on
  // portrait/narrow viewports — scaling to fit width alone shrinks the
  // whole stage to a ~200px-tall sliver with hundreds of px of blank space
  // above and below, and the text becomes unreadably small. Below this
  // width, swap to a normal stacked responsive layout instead.
  const isCompact = useIsCompact(860)

  useEffect(() => {
    if (isCompact) return
    const wrapper = wrapperRef.current
    const stage = stageRef.current
    const phone = phoneRef.current
    const scrim = scrimRef.current
    if (!wrapper || !stage || !phone || !scrim) return

    const getTargetProgress = () => {
      const rect = wrapper.getBoundingClientRect()
      const scrollable = wrapper.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      return Math.min(Math.max(scrolled / scrollable, 0), 1)
    }

    const tick = () => {
      const fitScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
      stage.style.transform = `translate(-50%, -50%) scale(${fitScale})`

      const target = getTargetProgress()
      progressRef.current += (target - progressRef.current) * 0.12

      const p = progressRef.current
      phone.style.transform = `translateY(-52%) scale(${0.92 + p * 0.08})`
      phone.style.opacity = String(Math.min(1, p * 2))
      scrim.style.opacity = String(Math.min(1, p * 1.3))

      let next = phaseRef.current
      if (next === 0 && p >= 0.55) next = 1
      else if (next === 1 && p < 0.45) next = 0
      else if (slides.length > 1 && next === 1 && p >= 0.85) next = 2
      else if (slides.length > 1 && next === 2 && p < 0.75) next = 1

      if (next !== phaseRef.current) {
        phaseRef.current = next
        setPhase(next)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isCompact])

  // Compact — same sticky-single-screen crossfade-in-place technique as the
  // rest of the mobile work, generalized to N slides (only ever called with
  // 1 today) using the same enterT*(1-exitT) shape CrossfadeStage uses, but
  // correctly handling a single slide as "enter once, then hold" instead of
  // CrossfadeStage's "first layer always exits" rule (which would wrongly
  // fade the only slide back out near the end of the scroll). The media
  // (video/phone) never crossfades — it enters once with the first slide
  // and then stays, matching desktop's "same background throughout" intent.
  useEffect(() => {
    if (!isCompact) return
    const wrapper = compactWrapperRef.current
    const media = compactMediaRef.current
    if (!wrapper || !media) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const n = slides.length
    const segment = 1 / n
    const transitionLen = Math.max(segment * 0.35, 0.1)

    const getTargetProgress = () => {
      const rect = wrapper.getBoundingClientRect()
      const scrollable = wrapper.offsetHeight - window.innerHeight
      if (scrollable <= 0) return 0
      const scrolled = Math.max(0, -rect.top)
      return Math.min(Math.max(scrolled / scrollable, 0), 1)
    }

    const applyFrame = (p: number) => {
      const mediaEnterT = Math.min(Math.max(p / transitionLen, 0), 1)
      media.style.opacity = String(mediaEnterT)
      media.style.transform = reduceMotion ? 'none' : `translateY(${(1 - mediaEnterT) * 16}px)`

      for (let i = 0; i < n; i++) {
        const el = compactSlideRefs.current[i]
        if (!el) continue
        const segStart = i * segment
        const segEnd = (i + 1) * segment
        const enterStart = Math.max(segStart - transitionLen, 0)
        const enterT = Math.min(Math.max((p - enterStart) / transitionLen, 0), 1)
        let exitT = 0
        if (i < n - 1) {
          const exitStart = segEnd - transitionLen
          exitT = Math.min(Math.max((p - exitStart) / transitionLen, 0), 1)
        }
        const opacity = enterT * (1 - exitT)
        el.style.opacity = String(opacity)
        el.style.transform = reduceMotion ? 'none' : `translateY(${(1 - enterT) * 16}px)`
        el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
      }
    }

    if (reduceMotion) {
      applyFrame(1)
      return
    }

    const tick = () => {
      const target = getTargetProgress()
      compactProgressRef.current += (target - compactProgressRef.current) * 0.15
      applyFrame(compactProgressRef.current)
      compactRafRef.current = requestAnimationFrame(tick)
    }

    compactRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(compactRafRef.current)
  }, [isCompact, slides])

  const fadeIn = (visible: boolean, delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
  })

  if (isCompact) {
    const compactHeight = `${100 + slides.length * 90}vh`
    return (
      <div ref={compactWrapperRef} style={{ height: compactHeight, position: 'relative', background: '#050506' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100dvh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div ref={compactMediaRef} style={{ position: 'relative', width: 'calc(100% + 40px)', maxWidth: '560px', margin: '0 -20px', opacity: 0 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '18px',
              overflow: 'hidden',
              filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.5))',
              transform: 'scale(1.2)',
            }}
          >
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: 'absolute',
                left: '15%',
                top: '21.85%',
                width: '70.52%',
                height: '56.48%',
                objectFit: 'cover',
              }}
            />
            <img src={phoneFrameSrc} alt="" style={{ position: 'relative', width: '100%', display: 'block' }} />
          </div>
        </div>

        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { compactSlideRefs.current[i] = el }}
            dir="rtl"
            style={{
              width: '100%',
              maxWidth: '420px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              textAlign: 'right',
              opacity: 0,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '2px', background: '#a78bfa' }} />
              <span
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#b8a4ff',
                }}
              >
                {eyebrow}
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 800,
                fontSize: 'clamp(26px, 7vw, 34px)',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                color: '#f7f6fb',
                margin: 0,
              }}
            >
              {slide.headlineLine1} {slide.headlineLine2}
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#b7b6c2',
                margin: 0,
              }}
            >
              {slide.body}
            </p>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.14)' }} />

            {slide.stat && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 700,
                      fontSize: 'clamp(40px, 12vw, 56px)',
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      color: '#f7f6fb',
                    }}
                  >
                    <CountUpSpan value={slide.stat.value} />
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 700,
                      fontSize: '16px',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {slide.stat.unit}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '15px', fontWeight: 600, color: '#e4e3ea' }}>
                  {slide.stat.label}
                </div>
              </div>
            )}

            {slide.stats && (
              <div style={{ display: 'flex', gap: '28px' }}>
                {slide.stats.map((stat, si) => (
                  <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontWeight: 700,
                          fontSize: 'clamp(32px, 9vw, 44px)',
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          color: '#f7f6fb',
                        }}
                      >
                        <CountUpSpan value={stat.value} />
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontWeight: 700,
                          fontSize: '14px',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {stat.unit}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600, color: '#e4e3ea' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {slide.tip && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  borderRadius: '10px',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(184,164,255,0.22)',
                  borderInlineStart: '3px solid #a78bfa',
                  padding: '12px 14px',
                }}
              >
                <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
                <div>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: '#b8a4ff' }}>
                    טיפ לנציג:{' '}
                  </span>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 400, color: '#b7b6c2' }}>
                    {slide.tip}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} style={{ height: slides.length > 1 ? '340vh' : '200vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#050506' }}>
        <div
          ref={stageRef}
          style={{ position: 'absolute', top: '50%', left: '50%', width: '1920px', height: '1080px' }}
        >
          {/* Background video — stands in for the handoff's static bg-scene.png, kept live/looping per request */}
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              filter: 'brightness(0.92)',
            }}
          />
          {/* Right-darkening scrim (text side) — starts clean, fades in with
              scroll progress as the phone rises, driven in the rAF tick below.
              Bleeds a bit past the stage's right edge so its solid-black start
              meets the letterboxed margin with no seam on wide viewports. */}
          <div
            ref={scrimRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: '-48px',
              opacity: 0,
              background:
                'linear-gradient(to left, rgba(5,5,8,1) 0%, rgba(5,5,8,0.97) 6%, rgba(5,5,8,0.90) 26%, rgba(5,5,8,0.45) 47%, rgba(5,5,8,0.05) 63%, rgba(5,5,8,0) 73%)',
            }}
          />

          {/* Phone mockup — left-anchored, vertically centered; our mockup is the
              landscape unfolded Fold rather than the handoff's portrait phone,
              sized by width instead of the handoff's fixed 38% to keep its own
              aspect ratio undistorted. */}
          <div
            ref={phoneRef}
            style={{
              position: 'absolute',
              left: '6%',
              top: '50%',
              width: '69%',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: '28px',
                overflow: 'hidden',
                filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.55))',
              }}
            >
              <video
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  position: 'absolute',
                  left: '15%',
                  top: '21.85%',
                  width: '70.52%',
                  height: '56.48%',
                  objectFit: 'cover',
                }}
              />
              <img src={phoneFrameSrc} alt="" style={{ position: 'relative', width: '100%', display: 'block' }} />
            </div>
          </div>

          {/* Text column — two slides stacked in the same spot, crossfading
              as `phase` advances from 1 (Display Ratio) to 2 (Vision Booster). */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: '56px',
              width: '400px',
            }}
          >
            {slides.map((slide, i) => {
              const visible = phase === i + 1
              return (
                <div
                  key={i}
                  dir="rtl"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '28px',
                    pointerEvents: visible ? 'auto' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', ...fadeIn(visible, 0) }}>
                    <div style={{ width: '28px', height: '2px', background: '#a78bfa' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '17px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: '#b8a4ff',
                      }}
                    >
                      {eyebrow}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 800,
                      fontSize: '68px',
                      lineHeight: 1.12,
                      letterSpacing: '-0.01em',
                      color: '#f7f6fb',
                      margin: 0,
                      ...fadeIn(visible, 0.1),
                    }}
                  >
                    {slide.headlineLine1}
                    <br />
                    {slide.headlineLine2}
                  </h2>

                  <p
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 400,
                      fontSize: '22px',
                      lineHeight: 1.65,
                      color: '#b7b6c2',
                      maxWidth: '560px',
                      margin: 0,
                      ...fadeIn(visible, 0.2),
                    }}
                  >
                    {slide.body}
                  </p>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.14)', ...fadeIn(visible, 0.25) }} />

                  {slide.stat && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...fadeIn(visible, 0.3) }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontWeight: 700,
                            fontSize: '96px',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            color: '#f7f6fb',
                          }}
                        >
                          <CountUpSpan value={slide.stat.value} />
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontWeight: 700,
                            fontSize: '28px',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {slide.stat.unit}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '19px',
                          fontWeight: 600,
                          color: '#e4e3ea',
                        }}
                      >
                        {slide.stat.label}
                      </div>
                    </div>
                  )}

                  {slide.steps && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', ...fadeIn(visible, 0.3) }}>
                      {slide.steps.map((step, si) => (
                        <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              border: '1px solid rgba(184,164,255,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-primary)',
                              fontSize: '15px',
                              fontWeight: 700,
                              color: '#b8a4ff',
                              flexShrink: 0,
                            }}
                          >
                            {String(si + 1).padStart(2, '0')}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-primary)',
                              fontSize: '19px',
                              fontWeight: 500,
                              lineHeight: 1.5,
                              color: '#e4e3ea',
                              paddingTop: '6px',
                            }}
                          >
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {slide.tip && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        borderRadius: '12px',
                        background: 'rgba(167,139,250,0.08)',
                        border: '1px solid rgba(184,164,255,0.22)',
                        borderInlineStart: '3px solid #a78bfa',
                        padding: '14px 18px',
                        maxWidth: '560px',
                        ...fadeIn(visible, 0.4),
                      }}
                    >
                      <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
                      <div>
                        <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: '#b8a4ff' }}>
                          טיפ לנציג:{' '}
                        </span>
                        <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 400, color: '#b7b6c2' }}>
                          {slide.tip}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UltraPage() {
  const [compareModel, setCompareModel] = useState<PreviousModelKey | null>(null)

  return (
    <div className="ultra" dir="rtl" lang="he">
      {/* Multitasking — now merged into UltraHero.tsx: the hero video shrinks
          into the right half and this content fades in on the left as the
          same continuous pin transitions past the hero. Not rendered here. */}

      {/* Display ratio + Vision Booster — one continuous cinematic scroll,
          same video/phone background, content crossfades between the two. */}
      <Section
        id="display"
        ariaLabel="מבנה ויחס תצוגה ובהירות"
      >
        <div className="ultra-breakout">
          <DisplayRevealSection
            videoSrc={displayRevealVideo}
            phoneFrameSrc={displayPhoneFrame}
            eyebrow="תצוגה"
            slides={[
              {
                headlineLine1: 'המסך הגדול והבהיר',
                headlineLine2: 'ביותר אי פעם',
                body: 'תצוגה בהירה במיוחד לחוויית שימוש בכל התנאים ולמולטיטסקינג מושלם!',
                steps: [
                  'עוצמה מקסימלית באור שמש ישיר: 3,000 nits',
                  'חד יותר גם בפרטים הקטנים: 442 ppi',
                ],
                stats: [
                  { value: 3000, unit: 'nits', label: 'עוצמה מקסימלית באור שמש ישיר' },
                  { value: 442, unit: 'ppi', label: 'חד יותר גם בפרטים הקטנים' },
                ],
              },
            ]}
          />
        </div>
      </Section>

      {/* Cameras — exploded-parts scrub, then (desktop) one continuous pin
          carries straight on into the Galaxy AI capabilities built on that
          camera (Photo Assist smart editing, then Follow Cam): the camera
          visual fades out while Photo Assist slides in from the right, then
          crossfades to Follow Cam. See CameraFrameSection for the merged
          timeline. Not its own top-level numbered section/navbar entry;
          conceptually part of the Camera story. */}
      <CameraFrameSection />

      {/* Performance — frame-by-frame canvas scrub, same mechanism as the reference Design section */}
      <PerformanceFrameSection />

      {/* Battery — scroll-scrubbed charge ring + glass stat card, same
          cinematic language as Camera/Performance (no source video/photos
          for this one, so the "hero" is a built animation instead). */}
      <BatterySection />

      {/* Design — full-bleed scroll-scrubbed 3D device render + glass card,
          crossfading into a Colors card (click-to-switch swatches) under
          the same "06 · DESIGN" numbered section — not its own entry. */}
      <DesignSection />

      {/* Full spec */}
      <Section
        id="spec"
        ariaLabel="מפרט טכני מלא"
        tip="השאירו את טבלת המפרט לסוף השיחה — אחרי שהלקוח כבר התרשם בחוויה, המספרים רק מחזקים את ההחלטה."
      >
        <Eyebrow>מפרט מלא</Eyebrow>
        <h2 className="ultra-headline">מפרט טכני</h2>
        <p className="ultra-body ultra-body--wide">
          כשהמסך הגדול פוגש ביצועים ללא תחרות – ה-Galaxy Z Fold8 Ultra לוקח את הפרודוקטיביות וחוויית ה-AI שלכם צעד אחד קדימה.
        </p>

        {/* Compare dropdown — picks Fold7/Fold6; the table below highlights,
            inline, only the clauses whose real spec differs from that
            model (identical clauses stay plain, unlabeled). No separate
            table/panel — same rows, same copy, just colored where relevant. */}
        <div className="ultra-compare-select">
          <label htmlFor="ultra-compare-select" className="ultra-compare-select__label">השוואה לדגם קודם:</label>
          <select
            id="ultra-compare-select"
            className="ultra-compare-select__input"
            value={compareModel ?? ''}
            onChange={(e) => setCompareModel((e.target.value || null) as PreviousModelKey | null)}
          >
            <option value="">ללא השוואה</option>
            {PREVIOUS_MODEL_ORDER.map((key) => (
              <option key={key} value={key}>Galaxy Z {PREVIOUS_MODEL_NAMES[key]}</option>
            ))}
          </select>
        </div>

        <div className="ultra-table">
          {SPEC_ROWS.map((row) => (
            <div className="ultra-table__row" key={row.label}>
              <div className="ultra-table__label">{row.label}</div>
              <div className="ultra-table__value-wrap">
                <div className="ultra-table__value">
                  <SpecValue segments={row.segments} compareModel={compareModel} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="ultra__footer-mark" dir="ltr">GALAXY Z FOLD8 ULTRA</div>
    </div>
  )
}
