import { useEffect, useRef } from 'react'
import SalesTip from './SalesTip'
import { GalaxyAiMobileCard, type GalaxyAiCardData } from './GalaxyAiStackSection'
import bokehVideo from '../assets/Flip/hf_20260720_150923_2bdc1e87-8b2e-4529-a20b-66f63471163e.mp4'
import superSteadyVideo from '../assets/Flip/צילום וידאו.mp4'
import nightographyVideo from '../assets/Flip/hf_20260720_151454_4160d2f8-1e68-45d2-812b-b0d28348c34d.mp4'

/* Mobile-only (<860px) sticky "cinematic" version of the Cameras mega-section
   (AI Bokeh → FlexCam → Nightography) — same sticky-pin + reserved-slot
   mechanism Ultra's CameraFrameSection compact branch uses for its Follow
   Cam/Photo Assist cards (GalaxyAiMobileCard: video+title/desc stay fixed,
   steps show first, then an opaque "examples + tip" sheet physically rises
   to cover them). Previously this section just fell back to CrossfadeStage's
   generic "stack every layer in normal flow" compact behavior, which is why
   it wasn't sticky and rendered steps AND examples both in full one after
   the other — making the FlexCam card enormously tall. Reusing
   GalaxyAiMobileCard directly for FlexCam (steps + examples) fixes that;
   Nightography has no steps to hide, so it renders the plain version of the
   same card without the swap sheet. Desktop (CrossfadeStage) is untouched.
   Content is the same copy as the desktop CAMERA_MAIN / FlexCam / Nightography
   FeatureCards — no subtitle/tags added to FlexCam per instruction. */

const FLEXCAM_DATA: GalaxyAiCardData = {
  video: superSteadyVideo,
  title: 'מצב FlexCam מתקדם ושימושי יותר',
  tags: [],
  desc: 'צילום יציב וללא רעידות גם בזמן תנועה, עם תכונות ייצוב וסגנון אחיזה נוחים ביותר ונעילה אופקית מתקדמת — סרטון ישר ומפולס לחלוטין גם בלי להסתכל על המסך.',
  steps: [
    'פתחו את המכשיר, והחליקו שמאלה מאייקון המצלמה שעל המסך',
    'עברו למצב וידאו, קפלו את המכשיר לחצי, והחזיקו אותו כמו מסרטה (Camcorder) באחיזת יד',
    'לחצו על סמל ה-Super Steady, הפעילו את מייצב הווידאו יחד עם הנעילה האופקית — וצאו לדרך עם ההקלטה',
  ],
  examples: [
    'צלמו בקלות תמונות וסרטונים מגבוה תוך כדי תנועה בזכות ה-FlexCam החכמה',
    'תעדו וידאו חלק ויציב במיוחד — גם כשהסירה מתנדנדת על המים',
  ],
  tip: 'הדגימו סיבוב או הליכה תוך כדי צילום עם Super Steady — הלקוח יראה בעצמו שהסרטון נשאר ישר לחלוטין.',
}

const MAIN_EXIT_START = 0.14
const MAIN_EXIT_END = 0.22
const SHEET_RISE_START = 0.4
const SHEET_RISE_END = 0.5
const FLEX_EXIT_START = 0.7
const FLEX_EXIT_END = 0.78

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export default function FlipCamerasMobileSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)

  const mainLayerRef = useRef<HTMLDivElement>(null)
  const flexLayerRef = useRef<HTMLDivElement>(null)
  const nightLayerRef = useRef<HTMLDivElement>(null)
  const flexScrimRef = useRef<HTMLDivElement>(null)
  const flexSheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const setLayer = (el: HTMLDivElement | null, opacity: number) => {
      if (!el) return
      el.style.opacity = String(opacity)
      el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
    }
    const setSheet = (sheetEl: HTMLDivElement | null, scrimEl: HTMLDivElement | null, t: number) => {
      if (sheetEl) {
        sheetEl.style.opacity = String(t)
        sheetEl.style.transform = reduceMotion ? 'none' : `translateY(${(1 - t) * 100}%)`
        sheetEl.style.pointerEvents = t > 0.5 ? 'auto' : 'none'
      }
      if (scrimEl) scrimEl.style.opacity = String(t * 0.6)
    }

    const applyFrame = (p: number) => {
      const mainExitT = clamp01((p - MAIN_EXIT_START) / (MAIN_EXIT_END - MAIN_EXIT_START))
      const flexExitT = clamp01((p - FLEX_EXIT_START) / (FLEX_EXIT_END - FLEX_EXIT_START))
      const sheetT = clamp01((p - SHEET_RISE_START) / (SHEET_RISE_END - SHEET_RISE_START))

      setLayer(mainLayerRef.current, 1 - mainExitT)
      setLayer(flexLayerRef.current, mainExitT * (1 - flexExitT))
      setLayer(nightLayerRef.current, flexExitT)
      setSheet(flexSheetRef.current, flexScrimRef.current, sheetT)
    }

    if (reduceMotion) {
      applyFrame(1)
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
      applyFrame(progressRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div id="cameras" ref={wrapperRef} aria-label="מצלמות" style={{ height: '480vh', position: 'relative', background: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden' }}>

        {/* Phase 1 — AI Bokeh: framed video card + copy, same
            .ultra-galaxyai-mobile visual language as the other two phases */}
        <div
          ref={mainLayerRef}
          dir="rtl"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box' }}
        >
          <div className="ultra-galaxyai-mobile">
            <div className="ultra-galaxyai-mobile__media">
              <video src={bokehVideo} autoPlay loop muted playsInline style={{ aspectRatio: '6 / 5' }} />
            </div>
            <div className="ultra-galaxyai-mobile__body">
              <div className="ultra-galaxyai-mobile__header">
                <div dir="ltr" style={{ display: 'inline-block', fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, color: 'var(--samsung-blue)', border: '1px solid var(--samsung-blue)', borderRadius: 999, padding: '4px 12px', marginBottom: 8 }}>
                  AI Bokeh · 50MP+
                </div>
                <h2 className="followcam__title" dir="ltr">תמונות פורטרט מרהיבות ואיכותיות</h2>
                <p className="followcam__desc">
                  ה-Z Flip8 מספק אפקט טשטוש רקע (AI Bokeh) מתקדם, המעניק לתמונות הפורטרט שלכם מראה מרהיב של מצלמת DSLR מקצועית.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                {['תפסו את הרגעים הכי טבעיים שלכם עם חדות ופרטי פנים מדויקים', 'הפיקו תמונות ממוקדות בזכות אפקט AI Bokeh גם במקומות עמוסים'].map((attr) => (
                  <div key={attr} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '3px 0' }}>
                    <span style={{ color: 'var(--flip-pink)', flexShrink: 0 }}>—</span>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: 13, lineHeight: 1.4, color: '#2b2b2b' }}>{attr}</span>
                  </div>
                ))}
              </div>
              <SalesTip text="צלמו יחד עם הלקוח תמונת פורטרט באותו הרגע והראו לו את טשטוש הרקע בזום — האפקט הדומה למצלמת DSLR משכנע מיד." />
            </div>
          </div>
        </div>

        {/* Phase 2 — FlexCam: same reserved-slot steps↔examples swap card as
            Ultra's Follow Cam/Photo Assist mobile cards */}
        <div
          ref={flexLayerRef}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', opacity: 0, pointerEvents: 'none' }}
        >
          <GalaxyAiMobileCard data={FLEXCAM_DATA} scrimRef={flexScrimRef} sheetRef={flexSheetRef} />
        </div>

        {/* Phase 3 — Nightography: same card language, no steps to hide so
            examples + tip show directly (no swap needed) */}
        <div
          ref={nightLayerRef}
          dir="rtl"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', opacity: 0, pointerEvents: 'none' }}
        >
          <div className="ultra-galaxyai-mobile">
            <div className="ultra-galaxyai-mobile__media">
              <video src={nightographyVideo} autoPlay loop muted playsInline style={{ aspectRatio: '16 / 9' }} />
            </div>
            <div className="ultra-galaxyai-mobile__body">
              <div className="ultra-galaxyai-mobile__header">
                <h2 className="followcam__title" dir="ltr">Nightography</h2>
                <p className="followcam__desc">
                  עם ה-Z Flip8 ניתן לצלם סרטוני וידאו חדים, מפורטים ובהירים יותר, עם מינימום רעשים לקבלת תוצאות מדהימות בכל תנאי התאורה, בזכות טכנולוגיה מתקדמת לניקוי רעשי תמונה.
                </p>
              </div>
              <div className="followcam__block followcam__block--examples">
                <div className="followcam__label">דוגמאות לשימוש</div>
                <div className="followcam__examples">
                  {[
                    'יוצרים ולוג לילי? צלמו סרטונים חדים ובהירים תוך כדי תנועה ברחובות החשוכים',
                    'לתפוס את הרגעים הקסומים: תעדו תהלוכות לילה צבעוניות בפארק השעשועים ברמת פירוט מדהימה',
                  ].map((example) => (
                    <div className="followcam__example" key={example}>{example}</div>
                  ))}
                </div>
              </div>
              <SalesTip text="אם יש פינה מוצלת בחנות, צלמו שם סרטון קצר עם הלקוח והשוו לתוצאה בלי Nightography — ההבדל ברעש ובבהירות בולט." />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
