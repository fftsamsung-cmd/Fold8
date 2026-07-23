import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CountUpSpan } from './CountUpSpan'
import PerformanceFrameSection from './PerformanceFrameSection'
import FoldCameraFrameSection from './FoldCameraFrameSection'
import FoldDisplayRevealSection from './FoldDisplayRevealSection'
import SalesTip from './SalesTip'
import { Section, Eyebrow, Attrs, MainLayer, CrossfadeStage, FeatureCard, useIsCompact, useAutoAdvanceColors, ColorSwatchPicker } from './SectionKit'
import FoldDesignMobileSection from './FoldDesignMobileSection'
import FoldReadingMobileSection from './FoldReadingMobileSection'
import foldDesignVideo from '../assets/Fold/SM-F971_ZFold8 Wide_Lavender.mp4'
import foldReadingVideo from '../assets/Fold/hf_20260721_220118_f9826d6a-ce69-41d3-aaa2-c55cbac701e2.mp4'
import colorPurpleImg from '../assets/Fold/צבעים/צבע_סגול-removebg-preview.png'
import colorBlackImg from '../assets/Fold/צבעים/צבע_שחור-removebg-preview.png'
import colorWhiteImg from '../assets/Fold/צבעים/צבע_לבן-removebg-preview.png'
import './FoldPage.css'

gsap.registerPlugin(ScrollTrigger)

/* ---------- Colors — same auto-advancing (every 2s), click-to-switch
   mechanism/markup as Ultra's ColorsCard, real per-color product photos for
   all three. Unlike Ultra's square (2000×2000) shots, these are wide
   open-book renders (~3:2) — sized by column width instead of Ultra's fixed
   viewport-height, or they'd render far wider than the visual column and
   overflow into the text. */
const FOLD_COLORS = [
  { id: 'purple', name: 'לוונדר', hex: '#B497D6', glow: 'rgba(180,151,214,0.28)', image: colorPurpleImg },
  { id: 'black', name: 'שחור', hex: 'var(--samsung-black)', glow: 'rgba(0,0,0,0.18)', image: colorBlackImg },
  { id: 'white', name: 'לבן', hex: 'var(--ultra-paper)', glow: 'rgba(240,240,240,0.5)', image: colorWhiteImg },
] as const

function FoldColorsCard({ tip }: { tip?: string }) {
  const { activeId, active, handleSelect } = useAutoAdvanceColors(FOLD_COLORS)

  return (
    <MainLayer mobileCard pinned>
    <div className="ultra-split">
      <div className="ultra-split__visual ultra-colors-visual" style={{ minHeight: 340 }}>
        <div
          className="ultra-colors-glow"
          style={{ background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)` }}
        />
        {FOLD_COLORS.map((c) => (
          <div key={c.id} className="ultra-colors-phone-img-wrap" style={{ opacity: c.id === activeId ? 1 : 0, width: '100%' }}>
            <img
              src={c.image}
              alt={`Galaxy Z Fold8 — ${c.name}`}
              className="ultra-colors-phone-img"
              style={{ width: '100%', height: 'auto', maxHeight: 'none' }}
            />
          </div>
        ))}
      </div>
      <div className="ultra-split__text">
        <Eyebrow>גימור</Eyebrow>
        <h2 className="ultra-headline">מגוון צבעים טרנדיים שמושכים את העין</h2>
        <p className="ultra-body">ה-Z Fold8 מגיע ב-3 גוונים אופנתיים וטרנדיים, התואמים את העיצוב המרהיב.</p>
        <ColorSwatchPicker colors={FOLD_COLORS} activeId={activeId} onSelect={handleSelect} />
        <div className="ultra-colors-name">{active.name}</div>
        <p className="ultra-colors-note">* זמינות הצבעים עשויה להשתנות בהתאם לרשת השיווק או המפעילה הסלולרית</p>
      </div>
    </div>
    {tip && <SalesTip text={tip} />}
    </MainLayer>
  )
}

const DESIGN_MAIN = (
  <MainLayer mobileCard pinned>
    <div className="ultra-split">
      <div className="ultra-split__text">
        <Eyebrow>מבנה</Eyebrow>
        <h2 className="ultra-headline">ה-Z Fold בעיצוב הקל ביותר שלנו</h2>
        <p className="ultra-body">
          ה-Galaxy Z Fold8 דק וקל ביותר, עם אחיזה נוחה במיוחד לצפייה בתוכן — קומפקטי ודק
          במיוחד, בעיצוב מותאם לכיס.
        </p>
        <Attrs items={['קומפקטי ודק במיוחד', 'עיצוב אינטואיטיבי וקל לפתיחה']} />
      </div>
      <div className="ultra-split__visual">
        <video
          src={foldDesignVideo}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            display: 'block',
            borderRadius: 18,
            aspectRatio: '6 / 5',
            objectFit: 'cover',
            boxShadow: '0 24px 60px rgba(0,0,0,0.14)',
          }}
        />
      </div>
    </div>
    <SalesTip text="שימו את המכשיר ביד הלקוח מקופל — הדקות והמשקל מורגשים תוך שנייה, בלי צורך להסביר." />
  </MainLayer>
)

/* Below 860px, the Design section swaps CrossfadeStage's pinned horizontal
   crossfade for FoldDesignMobileSection's single sticky screen (same media
   + copy, cinematic crossfade in place — see that file for why). Desktop
   keeps CrossfadeStage exactly as before; reduced-motion also keeps
   CrossfadeStage, since it already falls back to a plain stacked layout on
   its own (isCompact || reduceMotion) and a second sticky-pin implementation
   isn't worth building for that case. */
function DesignSection() {
  const isCompact = useIsCompact(768, { settle: true })
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  if (isCompact && !reduceMotion) {
    return <FoldDesignMobileSection />
  }

  return (
    <CrossfadeStage
      id="design"
      ariaLabel="עיצוב"
      wrapperHeight="420vh"
      layers={[
        DESIGN_MAIN,
        <FoldColorsCard tip="שאלו את הלקוח על הסגנון האישי שלו לפני שמראים את הצבעים — התאמה אישית מגדילה סיכוי לסגירה." />,
      ]}
    />
  )
}

/* Same isCompact/reduceMotion switch as DesignSection — mobile gets the
   sticky single-beat reveal (FoldReadingMobileSection), everyone else keeps
   the original plain <Section> (also the reduced-motion fallback, since a
   held pin is itself a motion effect). */
function ReadingSection() {
  const isCompact = useIsCompact(768, { settle: true })
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  if (isCompact && !reduceMotion) {
    return <FoldReadingMobileSection />
  }

  return (
    <Section id="reading" ariaLabel="קריאה וגלישה">
      <FeatureCard
        sectionName="קריאה וגלישה"
        title="מותאם במיוחד לקריאה וגלישה באינטרנט"
        tags={['תכונה מרכזית']}
        desc="חוויה מדהימה של קריאה, גלישה וצפייה — במצב מקופל או פתוח. נוחות קריאה מקסימלית ומעבר מסכים חלק בכל סביבה."
        steps={[
          'פתחו את דפדפן Samsung במסך החיצוני',
          'פתחו את ה-Z Fold8 וסובבו אותו למצב אנכי',
        ]}
        examples={[
          'חוויית קריאה רציפה – במסך החיצוני ובראשי',
          'גלישה סוחפת – מעבר מסכים חלק בהתאם לסיטואציה',
        ]}
        media={<video src={foldReadingVideo} autoPlay loop muted playsInline />}
      />
      <SalesTip text="תנו ללקוח לגלול אתר חדשות במצב מקופל ואז לפתוח למסך המלא — ההבדל בנוחות הקריאה מדבר בעד עצמו." />
    </Section>
  )
}

export default function FoldPage() {
  return (
    <div className="fold" dir="rtl" lang="he">
      {/* ---------- 01 · Design → Colors (2-layer crossfade; sticky
          cinematic screen below 860px, see DesignSection) ---------- */}
      <DesignSection />

      {/* ---------- 02 · Display — fixed-stage content swap (structure/ratio
          then brightness), same background throughout, then a merged third
          phase where the Video Experience card slides in from the right
          over the same pinned viewport — ported from Ultra's
          DisplayRevealSection mechanism instead of the crossfade-card
          pattern used elsewhere on this page. ---------- */}
      <FoldDisplayRevealSection />

      {/* ---------- 03 · Cameras → Horizontal Lock → Photo Assist (exploded-parts
          frame scrub, ported 1:1 from Ultra's CameraFrameSection) ---------- */}
      <FoldCameraFrameSection />

      {/* ---------- 04 · Reading & Browsing (sticky single-beat reveal on
          mobile, see ReadingSection) ---------- */}
      <ReadingSection />

      {/* ---------- 05 · Performance — verbatim reuse, identical chip/numbers to Ultra ---------- */}
      <PerformanceFrameSection />

      {/* ---------- 06 · Battery ---------- */}
      <FoldBatterySection />

      {/* ---------- 07 · Full spec ---------- */}
      <Section id="spec" ariaLabel="מפרט טכני מלא">
        <Eyebrow>מפרט מלא</Eyebrow>
        <h2 className="ultra-headline">מפרט טכני</h2>
        <p className="ultra-body ultra-body--wide">
          ה-Galaxy Z Fold8 הוא המתקפל הקל ביותר עם חוויית צפייה קולנועית איכותית.
        </p>
        <div className="ultra-table">
          {[
            { label: 'תצוגה', value: 'ראשית 7.6" QHD+, מסך חיצוני 5.5" QHD+, Dynamic AMOLED 2X, קצב רענון אדפטיבי 1-120Hz' },
            { label: 'מצלמות אחוריות', value: 'מערך צילום בעל 2 עדשות, ראשית 50MP (F1.8), רחבה במיוחד 50MP (F1.9)' },
            { label: 'מצלמה קדמית', value: 'מסך פנימי 10MP (F2.2), מסך חיצוני 10MP (F2.2)' },
            { label: 'מעבד', value: 'Snapdragon 8 Elite Gen 5 for Galaxy (3 nm)' },
            { label: 'זיכרון ואחסון', value: '256/512GB 12GB Ram, 1TB 16GB Ram' },
            { label: 'סוללה וטעינה', value: '4,800 mAh, טעינה מהירה במיוחד 45W 2.0, טעינה אלחוטית מהירה במיוחד 2.0' },
            { label: 'מידות ומשקל', value: 'פתוח 9.7 x 123.9 x 161.4 מ"מ, מקופל 4.5 x 123.9 x 81.9 מ"מ, 201 גרם' },
          ].map((row) => (
            <div className="ultra-table__row" key={row.label}>
              <div className="ultra-table__label">{row.label}</div>
              <div className="ultra-table__value-wrap">
                <div className="ultra-table__value">{row.value}</div>
              </div>
            </div>
          ))}
        </div>
        <SalesTip text="השאירו את טבלת המפרט לסוף השיחה — אחרי שהלקוח כבר התרשם בחוויה, המספרים רק מחזקים את ההחלטה." />
      </Section>

      <div className="ultra__footer-mark" dir="ltr">GALAXY Z FOLD8</div>
    </div>
  )
}

/* ---------- Battery — same ring + glass-card mechanism as Ultra's
   BatterySection, numbers swapped to Fold8's (4,800 mAh / 26h video / 45W /
   65% in 30 min). Kept local rather than adding props to the shared
   component, since the ring SVG/geometry needs to stay 1:1 identical to
   Ultra's and isn't worth risking behind a prop surface for one reuse. */
const BATTERY_RING_RADIUS = 100
const BATTERY_RING_STROKE = 12
const BATTERY_CIRCUMFERENCE = 2 * Math.PI * BATTERY_RING_RADIUS

/* Shared body content for the compact glass card (mobile/tablet) — same
   headline/stats/note/tip as the desktop version's cardRef contents, just
   without the scroll-jack opacity/transform (it's simply visible in normal
   flow, same pattern every other compact fallback on this page uses). */
function FoldBatteryCardBody() {
  return (
    <>
      <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 900, fontSize: 'clamp(26px, 2.8vw, 42px)', lineHeight: 1.15, margin: '0 0 12px', color: '#141414' }}>
        חוויית צפייה ושימוש למשך יום שלם
      </h2>
      <p style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(14px, 1.1vw, 17px)', fontWeight: 300, color: 'rgba(0,0,0,0.6)', margin: '0 0 24px', lineHeight: 1.6 }}>
        עם סוללה גדולה ומהירות טעינה גבוהה, ה-Z Fold8 מאפשר לכם ליהנות מהתוכן האהוב עליכם לאורך כל היום.
      </p>
      <div style={{ width: 36, height: 2, background: 'var(--accent-color)', marginBottom: 24 }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(10px, 3.5vw, 32px)', marginBottom: 24, flexWrap: 'nowrap' }}>
        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(22px, 6vw, 40px)', lineHeight: 1, color: '#141414' }}>
            <CountUpSpan value={26} />
          </div>
          <div style={{ marginTop: 6, fontSize: 'clamp(10px, 2.6vw, 12px)', color: 'rgba(0,0,0,0.55)' }}>שעות ניגון וידאו</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 0, maxWidth: 90 }}>
          <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(22px, 6vw, 40px)', lineHeight: 1, color: '#141414' }}>
            <CountUpSpan value={45} />W
          </div>
          <div style={{ marginTop: 6, fontSize: 'clamp(10px, 2.6vw, 12px)', color: 'rgba(0,0,0,0.55)' }}>טעינה מהירה במיוחד 2.0</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 0, maxWidth: 80 }}>
          <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(22px, 6vw, 40px)', lineHeight: 1, color: '#141414' }}>
            <CountUpSpan value={65} />%
          </div>
          <div style={{ marginTop: 6, fontSize: 'clamp(10px, 2.6vw, 12px)', color: 'rgba(0,0,0,0.55)' }}>טעינה ב-30 דקות</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 22, lineHeight: 1.5 }}>
        ראש מטען ומטען אלחוטי נמכרים בנפרד.
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)', borderInlineStart: '3px solid var(--accent-color)', padding: '12px 14px' }}>
        <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
        <div>
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, color: 'var(--accent-color)' }}>טיפ לנציג:{' '}</span>
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.65)' }}>
            ציינו שסוללה כזו מחזיקה יום מלא של צילום וניווט בטיול — לקוחות שנוסעים הרבה מתחברים לזה מיד.
          </span>
        </div>
      </div>
    </>
  )
}

function FoldBatterySection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const percentRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const isCompact = useIsCompact(768)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const applyFrame = (progress: number) => {
      const fillT = Math.min(Math.max(progress / 0.7, 0), 1)
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(BATTERY_CIRCUMFERENCE * (1 - fillT))
      }
      if (percentRef.current) {
        percentRef.current.textContent = `${Math.round(fillT * 100)}%`
      }
      const cardT = Math.min(Math.max((progress - 0.05) / 0.23, 0), 1)
      if (cardRef.current) {
        cardRef.current.style.opacity = String(cardT)
        cardRef.current.style.transform = `translateY(${(1 - cardT) * 16}px)`
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
        scrollTrigger: { trigger: wrapper, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
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
              <circle cx="120" cy="120" r={BATTERY_RING_RADIUS} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={BATTERY_RING_STROKE} />
              <circle
                ref={ringRef}
                cx="120"
                cy="120"
                r={BATTERY_RING_RADIUS}
                fill="none"
                stroke="url(#foldBatteryGradient)"
                strokeWidth={BATTERY_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={BATTERY_CIRCUMFERENCE}
                strokeDashoffset={BATTERY_CIRCUMFERENCE}
                style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.5))' }}
              />
              <defs>
                <linearGradient id="foldBatteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div ref={percentRef} dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(34px, 9vw, 48px)', lineHeight: 1, color: '#141414' }}>0%</div>
              <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(0,0,0,0.45)' }}>4,800 mAh</div>
            </div>
          </div>

          <div
            ref={cardRef}
            dir="rtl"
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
              padding: 'clamp(20px, 5vw, 28px)',
              opacity: 0,
              transform: 'translateY(16px)',
            }}
          >
            <FoldBatteryCardBody />
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
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 'calc(50% - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 'min(48vw, 420px)', aspectRatio: '1 / 1' }}>
            <svg viewBox="0 0 240 240" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="120" cy="120" r={BATTERY_RING_RADIUS} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={BATTERY_RING_STROKE} />
              <circle
                ref={ringRef}
                cx="120"
                cy="120"
                r={BATTERY_RING_RADIUS}
                fill="none"
                stroke="url(#foldBatteryGradient)"
                strokeWidth={BATTERY_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={BATTERY_CIRCUMFERENCE}
                strokeDashoffset={BATTERY_CIRCUMFERENCE}
                style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.5))' }}
              />
              <defs>
                <linearGradient id="foldBatteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div ref={percentRef} dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, color: '#141414' }}>0%</div>
              <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(0,0,0,0.45)' }}>4,800 mAh</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 'auto', width: 'calc(50% + 90px)', display: 'flex', alignItems: 'center', padding: '0 clamp(20px, 3.5vw, 48px)' }}>
          <div ref={cardRef} dir="rtl" style={{ width: '100%', maxWidth: 720, borderRadius: 24, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.12)', padding: 'clamp(24px, 3vw, 40px)', opacity: 0, transform: 'translateY(16px)' }}>
            <FoldBatteryCardBody />
          </div>
        </div>
      </div>
    </div>
  )
}
