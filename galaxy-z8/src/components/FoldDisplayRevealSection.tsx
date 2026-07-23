import { useEffect, useRef, useState } from 'react'
import { CountUpSpan } from './CountUpSpan'
import { FeatureCard, useIsCompact } from './SectionKit'
import FoldDisplayMobileSection from './FoldDisplayMobileSection'
import foldDisplayImg from '../assets/Fold/ChatGPT Image Jul 22, 2026, 02_10_56 AM.png'

/* Ported 1:1 (mechanism/layout/type) from Ultra's DisplayRevealSection —
   a fixed 1920x1080 "stage" scaled uniformly to fit the viewport, with a
   background video that stays on screen throughout, and a right-anchored
   RTL text column that crossfades between two content phases (Display
   Ratio, then Brightness) as the user keeps scrolling. Unlike the card-by-
   card CrossfadeStage used elsewhere on this page, the visual here never
   changes while the text swaps — that's the whole point of this variant
   (see the Fold Display section request: "same video for both, just the
   content should swap").

   Extended past Ultra's original with a third phase: once the Brightness
   slide has held for a moment, the whole video+text layer fades out while
   the Video Experience card slides in from the right and takes over the
   same pinned viewport — the same merged-single-pin handoff pattern
   FoldCameraFrameSection uses for Camera → Horizontal Lock → Photo Assist,
   so this card arrives the same way every other card on the page does
   instead of behaving like a separate scrolled-into-view section.

   No Fold "תצוגה" video has been supplied yet (Ultra's version has one
   under assets/Ultra/תצוגה) — the background is a placeholder box in the
   same slot until one is provided; swap the placeholder for a <video> once
   the asset exists, no other changes needed. */
type FoldDisplaySlideContent = {
  headlineLine1: string
  headlineLine2: string
  body: string
  steps?: string[]
  stat?: { value: number; unit: string; label: string; caption?: string }
}

export const SLIDES: FoldDisplaySlideContent[] = [
  {
    headlineLine1: 'מבנה ויחס תצוגה',
    headlineLine2: 'מותאם לתוכן',
    body: 'מסך כפול ענק עם יחס תצוגה מותאם במיוחד לצפייה בתוכן. מחוויית צפייה סוחפת ללא הפרעות.',
    steps: [
      'מסך חיצוני ביחס 16:10, המותאם אופטימלית לתוכן קצר',
      'מסך ראשי 4:3 לחוויית צפייה סוחפת במסך מלא',
    ],
  },
  {
    headlineLine1: 'המסך הגדול והבהיר',
    headlineLine2: 'ביותר אי פעם',
    body: 'תצוגה חדה וצבעים חיים אפילו תחת אור שמש ישיר, ומסך שטוח לחלוטין עם נראות קיפול מינימלית באמצע.',
    stat: { value: 3000, unit: 'nits', label: 'בהירות מקסימלית', caption: 'Vision Booster' },
    steps: [
      'נראות מושלמת גם תחת אור שמש ישיר',
      'מסך שטוח לחלוטין וצבעים מלאי חיים',
    ],
  },
]

export const VIDEO_EXPERIENCE_CARD = (
  <FeatureCard
    sectionName="תצוגה"
    title="חוויית וידאו סוחפת מקצה לקצה"
    tags={['תכונה מרכזית']}
    desc="התצוגה הכפולה של ה-Z Fold8 מעניקה חוויית צפייה עשירה וסוחפת יותר, עם התאמה מושלמת למגוון סוגי תוכן."
    note='תצוגת מסך מלא עבור סרטונים קצרים — 5.5" | 10:16. חוויית צפייה סוחפת במסך רחב (לרוחב) עבור סרטונים ותוכן ארוך — 7.6" | 4:3.'
    steps={[
      'פתחו את YouTube והפעילו סרטוני Shorts במסך החיצוני',
      'פתחו את ה-Z Fold8 ותיהנו מסרטוני YouTube במסך המלא',
    ]}
    examples={[
      'צפייה בסרטונים קצרים וטרנדיים במסך החיצוני, עם תצוגה מלאה וסוחפת',
      'חוויית צפייה קולנועית במסך הראשי בעת צפייה בסרטים וסדרות בסטרימינג',
    ]}
    media={<img src={foldDisplayImg} alt="" style={{ display: 'block', width: '100%', borderRadius: 18, objectFit: 'cover' }} />}
    tip="הראו ללקוח את אותו הסרטון פעם במסך החיצוני ופעם במסך הפתוח — ההבדל בחוויה מדבר בעד עצמו."
  />
)

/* Fractions of overall scroll progress `p` (0–1) across the whole wrapper.
   Each hold/transition band below is sized to give roughly two extra
   viewport-heights of scroll room over Ultra's original pacing (which felt
   rushed at 480vh total) — the wrapper is 1080vh now specifically so these
   fractions translate to generous absolute scroll distances:
     0 → RATIO_ENTER        (~270vh) video/phone rise, ratio slide fades in
     → BRIGHTNESS_ENTER     (~335vh hold on ratio, was ~144vh)
     → CARD_ENTER_START     (~227vh hold on brightness, was ~24vh)
     → CARD_ENTER_END       (~237vh crossfade into the card, was ~38vh)
   CARD_ENTER_START → CARD_ENTER_END crossfades the entire video+text layer
   out while the Video Experience card slides in from the right, then holds
   to the end. */
const RATIO_ENTER = 0.25
const RATIO_ENTER_BACK = 0.2
const BRIGHTNESS_ENTER = 0.56
const BRIGHTNESS_ENTER_BACK = 0.51
const CARD_ENTER_START = 0.77
const CARD_ENTER_END = 0.99

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export default function FoldDisplayRevealSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const displayLayerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [phase, setPhase] = useState(0)
  const phaseRef = useRef(0)
  // Explicitly pinned at 1180 (not the site-wide 768 default) — this
  // stage's fitScale has no legibility floor (see the ~1920x1080 stage
  // sizing below, confirmed illegible ~0.4-0.65 scale across 768-1180), so
  // it must keep its stacked fallback through the entire tablet width
  // range, not just phones.
  const isCompact = useIsCompact(1180)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (isCompact) return
    const wrapper = wrapperRef.current
    const stage = stageRef.current
    const phone = phoneRef.current
    const scrim = scrimRef.current
    const displayLayer = displayLayerRef.current
    const card = cardRef.current
    if (!wrapper || !stage || !phone || !scrim || !displayLayer || !card) return

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
      if (next === 0 && p >= RATIO_ENTER) next = 1
      else if (next === 1 && p < RATIO_ENTER_BACK) next = 0
      else if (SLIDES.length > 1 && next === 1 && p >= BRIGHTNESS_ENTER) next = 2
      else if (SLIDES.length > 1 && next === 2 && p < BRIGHTNESS_ENTER_BACK) next = 1

      if (next !== phaseRef.current) {
        phaseRef.current = next
        setPhase(next)
      }

      const cardEnterT = clamp01((p - CARD_ENTER_START) / (CARD_ENTER_END - CARD_ENTER_START))
      displayLayer.style.opacity = String(1 - cardEnterT)
      card.style.opacity = String(cardEnterT)
      card.style.transform = `translateX(${(1 - cardEnterT) * 100}%)`

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isCompact])

  const fadeIn = (visible: boolean, delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
  })

  if (isCompact && !reduceMotion) {
    return <FoldDisplayMobileSection />
  }

  if (isCompact) {
    return (
      <>
        <div
          id="display"
          style={{
            background: '#050506',
            padding: '56px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '630px' }}>
            <img
              src={foldDisplayImg}
              alt=""
              aria-hidden="true"
              style={{
                display: 'block',
                width: '100%',
                aspectRatio: '3 / 2',
                borderRadius: '18px',
                objectFit: 'cover',
                filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.5))',
              }}
            />
          </div>

          {SLIDES.map((slide, i) => (
            <div
              key={i}
              dir="rtl"
              style={{
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                textAlign: 'right',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '24px', height: '2px', background: 'var(--accent-color)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--accent-color)',
                  }}
                >
                  תצוגה
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

              {slide.steps && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {slide.steps.map((step) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ color: 'var(--accent-color)', flexShrink: 0 }}>—</span>
                      <div
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '15px',
                          fontWeight: 500,
                          lineHeight: 1.5,
                          color: '#e4e3ea',
                        }}
                      >
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ultra-galaxyai-stack-compact" aria-label="חוויית תצוגה">
          {VIDEO_EXPERIENCE_CARD}
        </div>
      </>
    )
  }

  return (
    <div id="display" ref={wrapperRef} style={{ height: '1080vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#050506' }}>
        <div ref={displayLayerRef} style={{ position: 'absolute', inset: 0 }}>
          <div
            ref={stageRef}
            style={{ position: 'absolute', top: '50%', left: '50%', width: '1920px', height: '1080px' }}
          >
            {/* Right-darkening scrim (text side) */}
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

            {/* Placeholder for the fixed background video (no Fold display
                asset yet) — swap for a <video> in this exact slot once one is
                supplied; sizing/position match Ultra's phone mockup slot. */}
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
              <img
                src={foldDisplayImg}
                alt=""
                aria-hidden="true"
                style={{
                  display: 'block',
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '28px',
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.55))',
                }}
              />
            </div>

            {/* Text column — two slides stacked in the same spot, crossfading
                as `phase` advances from 1 (ratio) to 2 (brightness). */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: '56px',
                width: '400px',
              }}
            >
              {SLIDES.map((slide, i) => {
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
                      <div style={{ width: '28px', height: '2px', background: 'var(--accent-color)' }} />
                      <span
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '17px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          color: 'var(--accent-color)',
                        }}
                      >
                        תצוגה
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...fadeIn(visible, slide.stat ? 0.4 : 0.3) }}>
                        {slide.steps.map((step) => (
                          <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <span style={{ fontFamily: 'var(--font-primary)', color: 'var(--accent-color)', flexShrink: 0 }}>—</span>
                            <div
                              style={{
                                fontFamily: 'var(--font-primary)',
                                fontSize: '19px',
                                fontWeight: 500,
                                lineHeight: 1.5,
                                color: '#e4e3ea',
                              }}
                            >
                              {step}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Video Experience card — slides in from the right over the display
            layer as it fades out (see CARD_ENTER_START/END above). */}
        <div
          ref={cardRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transform: 'translateX(100%)',
          }}
        >
          {VIDEO_EXPERIENCE_CARD}
        </div>
      </div>
    </div>
  )
}
