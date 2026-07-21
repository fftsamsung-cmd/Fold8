import { useEffect, useRef, useState } from 'react'
import { CountUpSpan } from './CountUpSpan'
import { SLIDES } from './FoldDisplayRevealSection'
import foldDisplayImg from '../assets/Fold/ChatGPT Image Jul 22, 2026, 02_10_56 AM.png'

/* Mobile-only (<860px) sticky version of the Display section — same
   single-sticky-screen-crossfades-in-place technique as
   FoldDesignMobileSection, applied to FoldDisplayRevealSection's existing
   3 phases (Ratio → Brightness → Video Experience card). Unlike Design,
   the media itself never crossfades between phase 1/2 — the same
   placeholder stays fixed while only the text swaps (matches desktop's own
   "same video for both, just the content should swap" intent, see
   FoldDisplayRevealSection's top comment). It only fades out once, when the
   phase-3 card takes over the pinned screen. Wired in by
   FoldDisplayRevealSection's own isCompact branch (only when the OS isn't
   asking for reduced motion — see there); desktop is untouched.

   Phase 3's card is a bespoke compact copy of desktop's VIDEO_EXPERIENCE_CARD
   (same title/desc/steps/examples/tip text) rather than reusing that shared
   element — it drops the video placeholder entirely (no video is coming for
   this card) and uses tighter mobile spacing so the whole card fits one
   screen without internal scrolling, without touching the desktop card. */

const CARD_TITLE = 'חוויית וידאו סוחפת מקצה לקצה'
const CARD_TAG = 'תכונה מרכזית'
const CARD_DESC = 'התצוגה הכפולה של ה-Z Fold8 מעניקה חוויית צפייה עשירה וסוחפת יותר, עם התאמה מושלמת למגוון סוגי תוכן.'
const CARD_STEPS = [
  'פתחו את YouTube והפעילו סרטוני Shorts במסך החיצוני',
  'פתחו את ה-Z Fold8 ותיהנו מסרטוני YouTube במסך המלא',
]
const CARD_EXAMPLES = [
  'צפייה בסרטונים קצרים וטרנדיים במסך החיצוני, עם תצוגה מלאה וסוחפת',
  'חוויית צפייה קולנועית במסך הראשי בעת צפייה בסרטים וסדרות בסטרימינג',
]
const CARD_TIP = 'הראו ללקוח את אותו הסרטון פעם במסך החיצוני ופעם במסך הפתוח — ההבדל בחוויה מדבר בעד עצמו.'

const AB_CENTER = 0.3
const AB_LEN = 0.16
const C_CENTER = 0.72
const C_LEN = 0.22

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export default function FoldDisplayMobileSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [tAB, setTAB] = useState(0)
  const [tC, setTC] = useState(0)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const getTargetProgress = () => {
      const rect = wrapper.getBoundingClientRect()
      const scrollable = wrapper.offsetHeight - window.innerHeight
      if (scrollable <= 0) return 0
      const scrolled = Math.max(0, -rect.top)
      return clamp01(scrolled / scrollable)
    }

    const tick = () => {
      const target = getTargetProgress()
      progressRef.current += (target - progressRef.current) * 0.15
      const p = progressRef.current
      setTAB(clamp01((p - (AB_CENTER - AB_LEN / 2)) / AB_LEN))
      setTC(clamp01((p - (C_CENTER - C_LEN / 2)) / C_LEN))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div id="display" ref={wrapperRef} aria-label="תצוגה" style={{ height: '300vh', position: 'relative', background: '#050506' }}>
      <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden' }}>
        {/* Ratio/Brightness layer — fixed media, crossfading text; fades
            out as the Video Experience card takes over for phase 3. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 1 - tC,
            pointerEvents: tC > 0.5 ? 'none' : 'auto',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '76px 20px 20px' }}>
            <img
              src={foldDisplayImg}
              alt=""
              aria-hidden="true"
              style={{
                display: 'block',
                width: '78%',
                maxWidth: 320,
                aspectRatio: '3 / 2',
                margin: '0 auto 26px',
                borderRadius: 18,
                objectFit: 'cover',
                filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.5))',
              }}
            />

            {/* Both slides occupy the same reserved box — same "two slides
                stacked in the same spot" pattern the desktop stage uses —
                so crossfading between them never jumps layout height. */}
            <div dir="rtl" style={{ position: 'relative', height: 340 }}>
              {SLIDES.map((slide, i) => {
                const opacity = i === 0 ? 1 - tAB : tAB
                const visible = i === 0 ? tAB <= 0.5 : tAB > 0.5
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      gap: 14,
                      opacity,
                      pointerEvents: visible ? 'auto' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 2, background: 'var(--accent-color)' }} />
                      <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-color)' }}>
                        תצוגה
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6.5vw, 32px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#f7f6fb', margin: 0 }}>
                      {slide.headlineLine1}<br />{slide.headlineLine2}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: '#b7b6c2', margin: 0 }}>
                      {slide.body}
                    </p>
                    {slide.stat && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 'clamp(32px, 9vw, 44px)', lineHeight: 1, letterSpacing: '-0.02em', color: '#f7f6fb' }}>
                            <CountUpSpan value={slide.stat.value} />
                          </span>
                          <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{slide.stat.unit}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 600, color: '#e4e3ea' }}>{slide.stat.label}</div>
                      </div>
                    )}
                    {slide.steps && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {slide.steps.map((step) => (
                          <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ color: 'var(--accent-color)', flexShrink: 0 }}>—</span>
                            <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: '#e4e3ea' }}>{step}</span>
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

        {/* Video Experience card — takes over the whole pinned screen for
            phase 3, same slide-in-from-the-right handoff as desktop. No
            media slot (no video is coming for this card) and tight enough
            spacing that everything fits one screen without scrolling. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            opacity: tC,
            transform: `translateX(${(1 - tC) * 100}%)`,
            pointerEvents: tC > 0.5 ? 'auto' : 'none',
          }}
        >
          <div
            dir="rtl"
            className="ultra-galaxyai-stack__inner"
            style={{ padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 2, background: 'var(--accent-color)' }} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-color)' }}>
                תצוגה
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(20px, 5.6vw, 24px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#17171c', margin: 0 }}>
              {CARD_TITLE}
            </h3>
            <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 600, color: '#3a3a42', background: 'rgba(0,0,0,0.05)', borderRadius: 999, padding: '4px 12px' }}>
              {CARD_TAG}
            </span>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: 'rgba(23,23,28,0.65)', margin: 0 }}>
              {CARD_DESC}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CARD_STEPS.map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 11, color: '#8b5cf6' }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: '#26262d' }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CARD_EXAMPLES.map((ex) => (
                <div key={ex} style={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, lineHeight: 1.4, color: 'rgba(23,23,28,0.75)' }}>
                  {ex}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)', borderInlineStart: '3px solid var(--accent-color)', padding: '10px 12px' }}>
              <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
              <div>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 700, color: 'var(--accent-color)' }}>טיפ לנציג:{' '}</span>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 400, color: 'rgba(0,0,0,0.65)' }}>{CARD_TIP}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
