import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CountUpSpan } from './CountUpSpan'
import { useIsCompact } from './SectionKit'

gsap.registerPlugin(ScrollTrigger)

const RING_RADIUS = 100
const RING_STROKE = 12
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/* Timeline — fractions of scroll progress through the wrapper (0–1). The
   charge ring fills 0→100% early so there's time to sit at a full charge;
   the card fades in almost immediately so it can be read throughout, and
   the fast-charge flash appears once the ring is nearly full. */
const RING_FILL_END = 0.7
const CARD_BAND: [number, number] = [0.05, 0.28]
const FLASH_BAND: [number, number] = [0.55, 0.7]

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/* Battery — no source video/photos for this one, so the "hero" is a built
   animation instead: a scroll-scrubbed circular charge ring (SVG stroke
   dashoffset) with a glass stat card, same visual language (dark ground,
   glass card, GSAP ScrollTrigger scrub, no `pin` — CSS `position: sticky`
   handles pinning) as CameraFrameSection/PerformanceFrameSection above. */
export default function BatterySection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const percentRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLSpanElement>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  // This section had no mobile treatment at all before — always rendered
  // the desktop 50/50 split regardless of viewport. isCompact below adds
  // the same sticky-scrub-ring + fitted-card mobile layout the rest of the
  // mobile work uses; the scroll-driven fill/card/flash logic itself is
  // unchanged and untouched (same refs, same fractions, either layout).
  const isCompact = useIsCompact(768)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const applyFrame = (progress: number) => {
      const fillT = clamp01(progress / RING_FILL_END)
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - fillT))
      }
      if (percentRef.current) {
        percentRef.current.textContent = `${Math.round(fillT * 100)}%`
      }

      const [cardStart, cardEnd] = CARD_BAND
      const cardT = clamp01((progress - cardStart) / (cardEnd - cardStart))
      if (cardRef.current) {
        cardRef.current.style.opacity = String(cardT)
        cardRef.current.style.transform = `translateY(${(1 - cardT) * 16}px)`
      }

      const [flashStart, flashEnd] = FLASH_BAND
      const flashT = clamp01((progress - flashStart) / (flashEnd - flashStart))
      if (flashRef.current) flashRef.current.style.opacity = String(flashT)
    }

    if (reduceMotion) {
      applyFrame(1)
      return
    }

    const ctx = gsap.context(() => {
      const state = { p: 0 }
      gsap.to(state, {
        p: 1,
        ease: 'none',
        immediateRender: false,
        onUpdate: () => applyFrame(state.p),
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
        },
      })
    }, wrapper)

    return () => ctx.revert()
  }, [reduceMotion, isCompact])

  if (isCompact) {
    return (
      <div ref={wrapperRef} id="battery" style={{ height: '260vh', position: 'relative', background: '#f2f2f2' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
            background: 'radial-gradient(120% 90% at 50% 30%, #ffffff 0%, #f7f7f7 45%, #f2f2f2 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'relative', width: 'min(50vw, 220px)', aspectRatio: '1 / 1' }}>
            <svg viewBox="0 0 240 240" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="120" cy="120" r={RING_RADIUS} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={RING_STROKE} />
              <circle
                ref={ringRef}
                cx="120"
                cy="120"
                r={RING_RADIUS}
                fill="none"
                stroke="url(#batteryPurpleGradient)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE}
                style={{ filter: 'drop-shadow(0 0 18px rgba(57,49,93,0.55))' }}
              />
              <defs>
                <linearGradient id="batteryPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6b6480" />
                  <stop offset="100%" stopColor="#39315d" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span
                aria-hidden="true"
                ref={flashRef}
                style={{ fontSize: 'clamp(18px, 4.8vw, 26px)', lineHeight: 1, opacity: 0, filter: 'drop-shadow(0 0 8px rgba(107,100,128,0.8))' }}
              >
                ⚡
              </span>
              <div ref={percentRef} dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(34px, 9vw, 48px)', lineHeight: 1, color: '#141414' }}>0%</div>
              <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(0,0,0,0.45)' }}>5000 mAh</div>
            </div>
          </div>

          <div
            ref={cardRef}
            dir="rtl"
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 24,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
              padding: 'clamp(20px, 5vw, 28px)',
              opacity: 0,
              transform: 'translateY(16px)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 900, fontSize: 'clamp(26px, 2.8vw, 42px)', lineHeight: 1.15, margin: '0 0 12px', color: '#141414' }}>
              סוללה עוצמתית וטעינה מהירה במיוחד
            </h2>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(14px, 1.1vw, 17px)', fontWeight: 300, color: 'rgba(0,0,0,0.6)', margin: '0 0 24px', lineHeight: 1.6 }}>
              סוללה המספיקה ליום שלם ותומכת טעינה מהירה במיוחד בפעם הראשונה בדגם ה-Fold!
            </p>
            <div style={{ width: 36, height: 2, background: 'rgb(57, 49, 93)', marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
                  <CountUpSpan value={45} />W
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>טעינה מהירה במיוחד 2.0</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
                  <CountUpSpan value={65} />%
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>טעינה ב-30 דקות</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 22, lineHeight: 1.5 }}>
              ראש מטען 25W או 45W / מטען אלחוטי נמכרים בנפרד.
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 10, background: 'rgba(57,49,93,0.08)', border: '1px solid rgba(57,49,93,0.22)', borderInlineStart: '3px solid rgb(57, 49, 93)', padding: '12px 14px' }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
              <div>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, color: 'rgb(57, 49, 93)' }}>טיפ לנציג:{' '}</span>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.65)' }}>
                  ציינו שסוללה כזו מחזיקה יום מלא של צילום וניווט בטיול — לקוחות שנוסעים הרבה מתחברים לזה מיד.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} id="battery" style={{ height: '300vh', position: 'relative', background: '#f2f2f2' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: 'radial-gradient(120% 100% at 78% 50%, #ffffff 0%, #f7f7f7 45%, #f2f2f2 100%)',
        }}
      >
        {/* Charge ring — right half (60px narrower than an even split so the
            stat card's headline gets the extra width — the ring itself is
            capped at min(48vw, 420px) regardless, so it never notices). */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: 'calc(50% - 150px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', width: 'min(48vw, 420px)', aspectRatio: '1 / 1' }}>
            <svg viewBox="0 0 240 240" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="120" cy="120" r={RING_RADIUS} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={RING_STROKE} />
              <circle
                ref={ringRef}
                cx="120"
                cy="120"
                r={RING_RADIUS}
                fill="none"
                stroke="url(#batteryPurpleGradient)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE}
                style={{ filter: 'drop-shadow(0 0 18px rgba(57,49,93,0.55))' }}
              />
              <defs>
                <linearGradient id="batteryPurpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6b6480" />
                  <stop offset="100%" stopColor="#39315d" />
                </linearGradient>
              </defs>
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span
                aria-hidden="true"
                ref={flashRef}
                style={{ fontSize: 'clamp(20px, 2.4vw, 30px)', lineHeight: 1, opacity: 0, filter: 'drop-shadow(0 0 8px rgba(107,100,128,0.8))' }}
              >
                ⚡
              </span>
              <div
                ref={percentRef}
                dir="ltr"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 800,
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  lineHeight: 1,
                  color: '#141414',
                }}
              >
                0%
              </div>
              <div
                dir="ltr"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'rgba(0,0,0,0.45)',
                }}
              >
                5000 mAh
              </div>
            </div>
          </div>
        </div>

        {/* Stat card — left half, 60px wider than an even split so the
            headline ("סוללה עוצמתית וטעינה מהירה במיוחד") fits on one line. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 'auto',
            width: 'calc(50% + 150px)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 clamp(20px, 3.5vw, 48px)',
          }}
        >
          <div
            ref={cardRef}
            dir="rtl"
            style={{
              width: '100%',
              maxWidth: '820px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
              padding: 'clamp(24px, 3vw, 40px)',
              opacity: 0,
              transform: 'translateY(16px)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 900,
                fontSize: 'clamp(26px, 2.8vw, 42px)',
                lineHeight: 1.15,
                margin: '0 0 12px',
                color: '#141414',
              }}
            >
              סוללה עוצמתית וטעינה מהירה במיוחד
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'clamp(14px, 1.1vw, 17px)',
                fontWeight: 300,
                color: 'rgba(0,0,0,0.6)',
                margin: '0 0 24px',
                lineHeight: 1.6,
              }}
            >
              סוללה המספיקה ליום שלם ותומכת טעינה מהירה במיוחד בפעם הראשונה בדגם ה-Fold!
            </p>

            <div style={{ width: 36, height: 2, background: 'rgb(57, 49, 93)', marginBottom: '24px' }} />

            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div>
                <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
                  <CountUpSpan value={45} />W
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(0,0,0,0.55)' }}>טעינה מהירה במיוחד 2.0</div>
              </div>
              <div>
                <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
                  <CountUpSpan value={65} />%
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(0,0,0,0.55)' }}>טעינה ב-30 דקות</div>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.5)', marginBottom: '22px', lineHeight: 1.5 }}>
              ראש מטען 25W או 45W / מטען אלחוטי נמכרים בנפרד.
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                borderRadius: '10px',
                background: 'rgba(57,49,93,0.08)',
                border: '1px solid rgba(57,49,93,0.22)',
                borderInlineStart: '3px solid rgb(57, 49, 93)',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
              <div>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: 'rgb(57, 49, 93)' }}>
                  טיפ לנציג:{' '}
                </span>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 400, color: 'rgba(0,0,0,0.65)' }}>
                  ציינו שסוללה כזו מחזיקה יום מלא של צילום וניווט בטיול — לקוחות שנוסעים הרבה מתחברים לזה מיד.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
