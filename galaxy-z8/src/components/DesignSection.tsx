import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useIsCompact, useAutoAdvanceColors, ColorSwatchPicker } from './SectionKit'
import designVideo from '../assets/Ultra/3D.mp4'
import colorPurpleImg from '../assets/Ultra/צבעים/סגול.png'
import colorBlackImg from '../assets/Ultra/צבעים/שחור.png'
import colorWhiteImg from '../assets/Ultra/צבעים/לבן.png'

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/* Merged timeline — fractions of OVERALL scroll progress (0–1). Design
   holds (card faded in, held) through DESIGN_PHASE_END, then crossfades:
   the whole Design layer (video + card) fades out while the Colors card
   slides in from the right, then holds to the end — same crossfade
   mechanism as Camera→Galaxy AI above, kept under this same "06 · DESIGN"
   numbered section rather than getting its own (Colors was previously its
   own standalone section; not anymore). */
const CARD_BAND: [number, number] = [0.05, 0.2]
const DESIGN_PHASE_END = 0.5
const TRANSITION_END = 0.65

const ATTRS = [
  'עיצוב דק ומשקל קל יותר',
  'קל לפתיחה הודות למרווח פתיחה רחב יותר ב-20% וציר משופר',
  'מסך שטוח לחלוטין עם נראות קיפול מינימלית באמצע',
  'עיצוב מצלמה אינטגרלי ואלגנטי',
]

const COLORS = [
  { id: 'purple', name: 'סגול', hex: 'var(--ultra-purple)', glow: 'rgba(107,100,128,0.28)', image: colorPurpleImg },
  { id: 'black', name: 'אפור', hex: 'var(--samsung-black)', glow: 'rgba(0,0,0,0.18)', image: colorBlackImg },
  { id: 'white', name: 'לבן', hex: 'var(--ultra-paper)', glow: 'rgba(240,240,240,0.5)', image: colorWhiteImg },
]

/* Colors — same interactive click-to-switch swatch logic/markup as the old
   standalone Colors section, just housed in a single card now instead of a
   full-width split section. Auto-advances through the swatches every 2s;
   a manual click restarts the timer so the auto-advance doesn't immediately
   undo the visitor's own choice. */
function ColorsCard() {
  const { activeId, active, handleSelect } = useAutoAdvanceColors(COLORS)

  return (
    <div className="ultra-split">
      <div className="ultra-split__visual ultra-colors-visual">
        <div
          className="ultra-colors-glow"
          style={{ background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)` }}
        />
        {COLORS.map((c) => (
          <div key={c.id} className="ultra-colors-phone-img-wrap" style={{ opacity: c.id === activeId ? 1 : 0 }}>
            <img src={c.image} alt={`Galaxy Z Fold8 Ultra — ${c.name}`} className="ultra-colors-phone-img" />
          </div>
        ))}
      </div>
      <div className="ultra-split__text">
        <div className="ultra__eyebrow">משנים את חוקי הצבע</div>
        <h2 className="ultra-headline ultra-headline--colors">מגוון צבעים אייקונים</h2>
        <p className="ultra-body">ה-Z Fold הכי אייקוני אי פעם. מגיע ב-3 גוונים מטורפים.</p>
        <ColorSwatchPicker colors={COLORS} activeId={activeId} onSelect={handleSelect} />
        <div className="ultra-colors-name">{active.name}</div>
        <p className="ultra-colors-note">* זמינות הצבעים עשויה להשתנות בהתאם לרשת השיווק או המפעילה הסלולרית</p>
      </div>
    </div>
  )
}

/* Design — clean light background, a wide glass card on the left, and the
   3D device render simply looping in a framed box on the right. Once held,
   the whole thing crossfades into the Colors card (see timeline above).
   Same GSAP ScrollTrigger + sticky-pin mechanism as Camera/Performance/
   Battery — no `pin`, CSS `position: sticky` handles it. */
export default function DesignSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const designLayerRef = useRef<HTMLDivElement>(null)
  const colorsCardRef = useRef<HTMLDivElement>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  // Same "no mobile treatment at all" gap as Battery — always rendered the
  // desktop split/crossfade regardless of viewport. isCompact adds the same
  // sticky single-screen crossfade-in-place technique the rest of the
  // mobile work uses (see the compact branch below); desktop is untouched.
  const isCompact = useIsCompact(860)
  const compactWrapperRef = useRef<HTMLDivElement>(null)
  const compactVideoLayerRef = useRef<HTMLDivElement>(null)
  const compactColorsLayerRef = useRef<HTMLDivElement>(null)
  const compactProgressRef = useRef(0)
  const compactRafRef = useRef<number>(0)
  const [compactActiveColor, setCompactActiveColor] = useState(COLORS[0].id)
  const compactActive = COLORS.find((c) => c.id === compactActiveColor) ?? COLORS[0]
  const compactColorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const restartCompactColorAdvance = () => {
    if (compactColorTimerRef.current) clearInterval(compactColorTimerRef.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    compactColorTimerRef.current = setInterval(() => {
      setCompactActiveColor((current) => {
        const idx = COLORS.findIndex((c) => c.id === current)
        return COLORS[(idx + 1) % COLORS.length].id
      })
    }, 2000)
  }

  useEffect(() => {
    restartCompactColorAdvance()
    return () => {
      if (compactColorTimerRef.current) clearInterval(compactColorTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isCompact) return
    const wrapper = compactWrapperRef.current
    if (!wrapper) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const getTargetProgress = () => {
      const rect = wrapper.getBoundingClientRect()
      const scrollable = wrapper.offsetHeight - window.innerHeight
      if (scrollable <= 0) return 0
      const scrolled = Math.max(0, -rect.top)
      return clamp01(scrolled / scrollable)
    }

    const applyFrame = (p: number) => {
      const t = clamp01((p - 0.34) / 0.24)
      if (compactVideoLayerRef.current) {
        compactVideoLayerRef.current.style.opacity = String(1 - t)
        compactVideoLayerRef.current.style.pointerEvents = t > 0.5 ? 'none' : 'auto'
      }
      if (compactColorsLayerRef.current) {
        compactColorsLayerRef.current.style.opacity = String(t)
        compactColorsLayerRef.current.style.transform = reduce ? 'none' : `translateY(${(1 - t) * 20}px)`
        compactColorsLayerRef.current.style.pointerEvents = t > 0.5 ? 'auto' : 'none'
      }
    }

    if (reduce) {
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
  }, [isCompact])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const applyFrame = (overall: number) => {
      const designLocal = clamp01(overall / DESIGN_PHASE_END)
      const [cardStart, cardEnd] = CARD_BAND
      const cardT = clamp01((designLocal - cardStart) / (cardEnd - cardStart))
      if (cardRef.current) {
        cardRef.current.style.opacity = String(cardT)
        cardRef.current.style.transform = `translateY(${(1 - cardT) * 16}px)`
      }

      const transitionT = clamp01((overall - DESIGN_PHASE_END) / (TRANSITION_END - DESIGN_PHASE_END))
      if (designLayerRef.current) designLayerRef.current.style.opacity = String(1 - transitionT)
      if (colorsCardRef.current) {
        const x = reduceMotion ? 0 : (1 - transitionT) * 100
        colorsCardRef.current.style.transform = `translateX(${x}%)`
        colorsCardRef.current.style.opacity = String(transitionT)
      }
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
      <div id="design" ref={compactWrapperRef} aria-label="עיצוב וצבעים" style={{ height: '240vh', position: 'relative', background: '#050506' }}>
        <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden' }}>
          {/* Design/video layer — video fills the whole screen as the background
              (same full-bleed + bottom-gradient-scrim technique as
              FoldDesignMobileSection), text overlaid directly on top of it;
              fades out into the white Colors layer */}
          <div ref={compactVideoLayerRef} style={{ position: 'absolute', inset: 0 }}>
            <video
              src={designVideo}
              autoPlay
              loop
              muted
              playsInline
              aria-label="תצוגת עיצוב תלת-ממדית של המכשיר"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(5,5,8,0.96) 0%, rgba(5,5,8,0.66) 34%, rgba(5,5,8,0.14) 60%, rgba(5,5,8,0) 74%)',
              }}
            />
            <div
              dir="rtl"
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                padding: '0 20px calc(40px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 24, height: 2, background: '#a78bfa' }} />
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#b8a4ff' }}>צורה</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6.5vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#f7f6fb', margin: '0 0 12px' }}>
                עיצוב אלגנטי ודק במיוחד
              </h2>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: '#b7b6c2', margin: '0 0 16px' }}>
                ה-Z Fold8 Ultra דק וקליל להפליא, אפילו עם המסך הענק שלו. ועכשיו, חוויית הפתיחה חלקה ופשוטה מאי פעם.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ATTRS.map((attr) => (
                  <div key={attr} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                    <span style={{ color: '#a78bfa', flexShrink: 0 }}>—</span>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: '#e4e3ea' }}>{attr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colors layer — white ground, contained product photo + swatches */}
          <div ref={compactColorsLayerRef} dir="rtl" style={{ position: 'absolute', inset: 0, opacity: 0 }}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#fff' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
              <div
                aria-hidden="true"
                style={{ position: 'relative', width: '54%', maxWidth: 200, aspectRatio: '1 / 1', margin: '0 auto 18px' }}
              >
                <div style={{ position: 'absolute', inset: '-18%', borderRadius: '50%', background: `radial-gradient(circle, ${compactActive.glow} 0%, transparent 70%)` }} />
                {COLORS.map((c) => (
                  <img
                    key={c.id}
                    src={c.image}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.22))', opacity: c.id === compactActiveColor ? 1 : 0, transition: 'opacity 0.35s ease' }}
                  />
                ))}
              </div>
              <div style={{ maxWidth: 420, margin: '0 auto', width: '100%', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 24, height: 2, background: 'rgb(57, 49, 93)' }} />
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'rgb(57, 49, 93)' }}>משנים את חוקי הצבע</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6.5vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#141414', margin: '0 0 12px' }}>
                  מגוון צבעים אייקונים
                </h2>
                <p style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: 'rgba(0,0,0,0.6)', margin: '0 0 20px' }}>
                  ה-Z Fold הכי אייקוני אי פעם. מגיע ב-3 גוונים מטורפים.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  {COLORS.map((c) => (
                    <motion.button
                      key={c.id}
                      type="button"
                      aria-label={c.name}
                      aria-pressed={c.id === compactActiveColor}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: c.hex,
                        border: '2px solid',
                        borderColor: c.id === compactActiveColor ? '#141414' : 'rgba(0,0,0,0.16)',
                        boxShadow: c.id === compactActiveColor ? '0 0 0 3px rgba(0,0,0,0.08)' : 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                      animate={{ scale: c.id === compactActiveColor ? 1.15 : 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => { setCompactActiveColor(c.id); restartCompactColorAdvance() }}
                      whileTap={{ scale: 0.92 }}
                    />
                  ))}
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: 15, fontWeight: 700, color: '#141414' }}>{compactActive.name}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.5, margin: 0 }}>
                  * זמינות הצבעים עשויה להשתנות בהתאם לרשת השיווק או המפעילה הסלולרית
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} id="design" style={{ height: '450vh', position: 'relative', background: '#f2f2f2' }}>
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
        {/* Design layer — video + card, fades out as a unit into Colors */}
        <div ref={designLayerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          {/* 3D render — looping, contained box on the right */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              src={designVideo}
              autoPlay
              loop
              muted
              playsInline
              aria-label="תצוגת עיצוב תלת-ממדית של המכשיר"
              style={{
                height: 'min(78vh, 640px)',
                width: 'auto',
                maxWidth: '90%',
                aspectRatio: '1600 / 1920',
                objectFit: 'cover',
                borderRadius: '24px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.14)',
              }}
            />
          </div>

          {/* Stat card — wide, left half */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 'auto',
              width: '50%',
              display: 'flex',
              alignItems: 'center',
              padding: '0 clamp(20px, 5vw, 64px)',
            }}
          >
            <div
              ref={cardRef}
              dir="rtl"
              style={{
                width: '100%',
                maxWidth: '640px',
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
              <div
                dir="ltr"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgb(57, 49, 93)',
                  marginBottom: '14px',
                }}
              >
                צורה
              </div>

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
                עיצוב אלגנטי ודק במיוחד
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
                ה-Z Fold8 Ultra דק וקליל להפליא, אפילו עם המסך הענק שלו. ועכשיו, חוויית הפתיחה חלקה ופשוטה מאי פעם.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ATTRS.map((attr) => (
                  <div
                    key={attr}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                      padding: '14px 0',
                      borderTop: '1px solid rgba(0,0,0,0.1)',
                      fontSize: 'clamp(13px, 1.1vw, 15px)',
                      fontWeight: 500,
                      color: 'rgba(0,0,0,0.8)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-primary)', color: 'rgb(57, 49, 93)', flexShrink: 0 }}>—</span>
                    <span>{attr}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginTop: '22px',
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
                    שימו את המכשיר ביד הלקוח מקופל — הדקות והמשקל מורגשים תוך שנייה, בלי צורך להסביר.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colors layer — one card, slides in from the right over the Design layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            padding: 'clamp(20px, 4vw, 48px)',
          }}
        >
          <div
            ref={colorsCardRef}
            style={{
              width: '100%',
              maxWidth: '1140px',
              maxHeight: '94vh',
              overflowY: 'auto',
              borderRadius: '24px',
              background: '#fff',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.16)',
              padding: 'clamp(24px, 3vw, 48px)',
              opacity: 0,
              transform: 'translateX(100%)',
            }}
          >
            <ColorsCard />

            <div
              dir="rtl"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginTop: '28px',
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
                  שאלו את הלקוח על הסגנון האישי שלו לפני שמראים את הצבעים — התאמה אישית מגדילה סיכוי לסגירה.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
