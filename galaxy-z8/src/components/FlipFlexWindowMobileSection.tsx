import { useEffect, useRef } from 'react'
import SalesTip from './SalesTip'
import galaxyAi1 from '../assets/Flip/galaxyai1-nobg.png'

/* Mobile-only (<860px) sticky version of the FlexWindow section — same
   reserved-slot steps↔examples swap mechanism as FlipCamerasMobileSection/
   Ultra's GalaxyAiMobileCard (image + title/desc stay fixed, steps show
   first, then an opaque "examples + tip" sheet rises to cover them), just
   the single-phase case of that same pattern (FlexWindow has only one
   card, not three) so the wrapper is much shorter. Previously this was a
   plain <Section><FeatureCard/></Section> stacking title → tags → desc →
   note → 3 steps → image → 3 examples → tip all in normal flow, which is
   why it ran so long. Desktop is untouched — this only ever mounts below
   860px. Content is the same copy as the desktop FeatureCard. */

const STEPS = [
  'החליקו מכל מקום על גבי המסך החיצוני כדי לפתוח את הנעילה',
  'החליקו למעלה מהקצה התחתון כדי לפתוח את חלון היישומים',
  'הפעילו את האפליקציה הרצויה',
]

const EXAMPLES = [
  'לצפות במהירות בלוח השנה ולבדוק את הלו״ז מבלי לפתוח את המכשיר',
  'לבצע שיחות דחופות ישירות מה-FlexWindow תוך כדי תנועה',
  'לקבל תובנות ומידע על פגישות חשובות במבט מהיר',
]

const SHEET_RISE_START = 0.35
const SHEET_RISE_END = 0.48

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export default function FlipFlexWindowMobileSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const scrimRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const setSheet = (t: number) => {
      const sheetEl = sheetRef.current
      const scrimEl = scrimRef.current
      if (sheetEl) {
        sheetEl.style.opacity = String(t)
        sheetEl.style.transform = reduceMotion ? 'none' : `translateY(${(1 - t) * 100}%)`
        sheetEl.style.pointerEvents = t > 0.5 ? 'auto' : 'none'
      }
      if (scrimEl) scrimEl.style.opacity = String(t * 0.6)
    }

    if (reduceMotion) {
      setSheet(1)
      return
    }

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
      setSheet(clamp01((p - SHEET_RISE_START) / (SHEET_RISE_END - SHEET_RISE_START)))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div id="flexwindow" ref={wrapperRef} aria-label="אפליקציות במסך החיצוני" style={{ height: '220vh', position: 'relative', background: '#fff' }}>
      <div dir="rtl" style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box' }}>
        <div className="ultra-galaxyai-mobile">
          <div className="ultra-galaxyai-mobile__media" style={{ background: 'none', border: 'none', boxShadow: 'none', display: 'flex', justifyContent: 'center' }}>
            <img src={galaxyAi1} alt="Now Brief על ה-FlexWindow" style={{ display: 'block', height: 'clamp(200px, 42vw, 280px)', width: 'auto', maxWidth: '100%' }} />
          </div>
          <div className="ultra-galaxyai-mobile__body">
            <div className="ultra-galaxyai-mobile__header">
              <h2 className="followcam__title" dir="ltr">חוויית שימוש חכמה ואינטואיטיבית עם FlexWindow</h2>
              <p className="followcam__desc">
                גישה למגוון אפליקציות באופן מיידי על גבי ה-FlexWindow, בדיוק כמו במסך הראשי — תמיכה ב-16 אפליקציות, ניהול התראות וגישה מהירה להגדרות.
              </p>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.5, marginTop: 8 }}>
                * התמיכה באפליקציות צד שלישי צפויה להתרחב. תמיכה בעד 5 אפליקציות נוספות מתוכננת להשתחרר לאחר ההשקה.
              </p>
            </div>

            {/* FlexWindow has 3 examples (vs. FlexCam/FollowCam's 2), needing
                more room than the shared .ultra-galaxyai-mobile__swap's
                280px min-height — bumped here only, scoped to this instance
                via inline style, so FlexCam/Ultra's own cards keep their
                existing height. */}
            <div className="ultra-galaxyai-mobile__swap" style={{ minHeight: 330 }}>
              <div className="followcam__label">שלבי ההדגמה במכשיר</div>
              <div className="followcam__steps">
                {STEPS.map((step, i) => (
                  <div className="followcam__step" key={step}>
                    <span className="followcam__step-index" dir="ltr">{i + 1}</span>
                    <span className="followcam__step-text">{step}</span>
                  </div>
                ))}
              </div>

              <div ref={scrimRef} className="ultra-galaxyai-mobile__scrim" />

              <div ref={sheetRef} className="ultra-galaxyai-mobile__sheet">
                <div className="followcam__label">דוגמאות לשימוש</div>
                <div className="followcam__examples">
                  {EXAMPLES.map((example) => (
                    <div className="followcam__example" key={example}>{example}</div>
                  ))}
                </div>
                <SalesTip text="תנו ללקוח לגלוש בעצמו באפליקציות על ה-FlexWindow סגור — זו החוויה שהכי קשה להעביר במילים." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
