import { useEffect, useRef } from 'react'
import foldReadingVideo from '../assets/Fold/hf_20260721_220118_f9826d6a-ce69-41d3-aaa2-c55cbac701e2.mp4'

/* Mobile-only (<860px) sticky version of Reading & Browsing — same
   "own screen, scroll-driven reveal" production value as Design/Display/
   Camera's mobile sections, just a single beat instead of a multi-phase
   crossfade (this section only ever had one feature/card to begin with).
   The card fades + rises in as the user scrolls into the pin, holds, then
   releases into normal flow for the next section — replacing the plain
   one-shot useReveal fade this section used to fall back to (SectionKit's
   generic <Section>, no pin at all), which read as a step down in polish
   right after Camera's elaborate sticky handoff. Wired in by FoldPage.tsx's
   own isCompact/reduceMotion check — this only ever mounts when neither
   applies (reduced motion keeps the original plain <Section>, pin and all,
   since holding the screen still while scrolling is itself a motion effect,
   same reasoning DesignSection/CrossfadeStage already apply); desktop is
   untouched. */

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const ENTER_END = 0.35

function ReadingTip({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)', borderInlineStart: '3px solid var(--accent-color)', padding: '10px 12px' }}>
      <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
      <div>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 700, color: 'var(--accent-color)' }}>טיפ לנציג:{' '}</span>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 400, color: 'rgba(0,0,0,0.65)' }}>{text}</span>
      </div>
    </div>
  )
}

export default function FoldReadingMobileSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardLayerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const cardLayer = cardLayerRef.current
    if (!wrapper || !cardLayer) return

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
      const enterT = clamp01(p / ENTER_END)
      cardLayer.style.opacity = String(enterT)
      cardLayer.style.transform = `translateY(${(1 - enterT) * 20}px)`
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div id="reading" ref={wrapperRef} aria-label="קריאה וגלישה" style={{ height: '190vh', position: 'relative', background: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
        <div
          ref={cardLayerRef}
          dir="rtl"
          className="ultra-galaxyai-stack__inner"
          style={{ padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 12, opacity: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 2, background: 'var(--accent-color)' }} />
            <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-color)' }}>
              קריאה וגלישה
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(20px, 5.6vw, 24px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#17171c', margin: 0 }}>
            מותאם במיוחד לקריאה וגלישה באינטרנט
          </h3>
          <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 600, color: '#3a3a42', background: 'rgba(0,0,0,0.05)', borderRadius: 999, padding: '4px 12px' }}>
            תכונה מרכזית
          </span>
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: 'rgba(23,23,28,0.65)', margin: 0 }}>
            חוויה מדהימה של קריאה, גלישה וצפייה — במצב מקופל או פתוח. נוחות קריאה מקסימלית ומעבר מסכים חלק בכל סביבה.
          </p>
          <video
            src={foldReadingVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 12, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              'פתחו את דפדפן Samsung במסך החיצוני',
              'פתחו את ה-Z Fold8 וסובבו אותו למצב אנכי',
            ].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 11, color: '#8b5cf6' }}>
                  {i + 1}
                </span>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: '#26262d' }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'חוויית קריאה רציפה – במסך החיצוני ובראשי',
              'גלישה סוחפת – מעבר מסכים חלק בהתאם לסיטואציה',
            ].map((ex) => (
              <div key={ex} style={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, lineHeight: 1.4, color: 'rgba(23,23,28,0.75)' }}>
                {ex}
              </div>
            ))}
          </div>
          <ReadingTip text="תנו ללקוח לגלול אתר חדשות במצב מקופל ואז לפתוח למסך המלא — ההבדל בנוחות הקריאה מדבר בעד עצמו." />
        </div>
      </div>
    </div>
  )
}
