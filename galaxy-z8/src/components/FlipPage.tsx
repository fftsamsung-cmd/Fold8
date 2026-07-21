import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SalesTip from './SalesTip'
import { Section, Eyebrow, Attrs, MediaPlaceholder, MainLayer, CrossfadeStage, FeatureCard } from './SectionKit'
import FlipDesignMobileSection from './FlipDesignMobileSection'
import FlipCamerasMobileSection from './FlipCamerasMobileSection'
import FlipFlexWindowMobileSection from './FlipFlexWindowMobileSection'
import thicknessCompare from '../assets/Flip/Untitled design (23).png'
import colorPink from '../assets/Flip/color-pink-nobg.png'
import colorBlack from '../assets/Flip/color-black-nobg.png'
import colorWhite from '../assets/Flip/color-white-nobg.png'
import superSteadyVideo from '../assets/Flip/צילום וידאו.mp4'
import bokehVideo from '../assets/Flip/hf_20260720_150923_2bdc1e87-8b2e-4529-a20b-66f63471163e.mp4'
import nightographyVideo from '../assets/Flip/hf_20260720_151454_4160d2f8-1e68-45d2-812b-b0d28348c34d.mp4'
import galaxyAi1 from '../assets/Flip/galaxyai1-nobg.png'
import coverScreen1 from '../assets/Flip/ChatGPT Image Jul 20, 2026, 05_21_40 PM.png'
import coverScreen2 from '../assets/Flip/ChatGPT Image Jul 20, 2026, 05_22_52 PM.png'
import './FlipPage.css'

/* No processor/battery section for Flip8 — confirmed with the user that no
   dedicated content exists for either (only a one-line spec-table mention),
   and she explicitly asked to skip them rather than invent numbers. */

/* ---------- Colors — same auto-advancing (every 2s), click-to-switch
   mechanism as Fold8's FoldColorsCard, all 3 swatches using real product
   photography (no placeholders needed here). */
const FLIP_COLORS = [
  { id: 'pink', name: 'ורוד', hex: '#f472b6', glow: 'rgba(244,114,182,0.28)', image: colorPink },
  { id: 'black', name: 'שחור', hex: 'var(--samsung-black)', glow: 'rgba(0,0,0,0.18)', image: colorBlack },
  { id: 'white', name: 'לבן', hex: 'var(--ultra-paper)', glow: 'rgba(240,240,240,0.5)', image: colorWhite },
] as const

function FlipColorsCard({ tip }: { tip?: string }) {
  const [activeId, setActiveId] = useState<string>(FLIP_COLORS[0].id)
  const active = FLIP_COLORS.find((c) => c.id === activeId) ?? FLIP_COLORS[0]
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const restartAutoAdvance = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => {
      setActiveId((current) => {
        const idx = FLIP_COLORS.findIndex((c) => c.id === current)
        return FLIP_COLORS[(idx + 1) % FLIP_COLORS.length].id
      })
    }, 2000)
  }

  useEffect(() => {
    restartAutoAdvance()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (id: string) => {
    setActiveId(id)
    restartAutoAdvance()
  }

  return (
    <MainLayer mobileCard pinned>
      <div className="ultra-split">
        <div className="ultra-split__visual ultra-colors-visual" style={{ minHeight: 380 }}>
          <div
            className="ultra-colors-glow"
            style={{ background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)` }}
          />
          {FLIP_COLORS.map((c) => (
            <div key={c.id} className="ultra-colors-phone-img-wrap" style={{ opacity: c.id === activeId ? 1 : 0 }}>
              <img
                src={c.image}
                alt={`Galaxy Z Flip8 — ${c.name}`}
                className="ultra-colors-phone-img"
                style={{ height: 'min(56vh, 480px)', maxHeight: 'none' }}
              />
            </div>
          ))}
        </div>
        <div className="ultra-split__text">
          <Eyebrow>גימור</Eyebrow>
          <h2 className="ultra-headline flip-headline--match-card">צבעים אייקוניים וייחודיים</h2>
          <p className="ultra-body">
            שלבו את הצבעים האייקוניים והטרנדיים של ה-Galaxy Z Flip8 עם הלוק היומי שלכם, ליצירת
            סגנון ייחודי.
          </p>
          <div className="ultra-colors-swatches">
            {FLIP_COLORS.map((c) => (
              <motion.button
                key={c.id}
                type="button"
                aria-label={c.name}
                aria-pressed={c.id === activeId}
                className="ultra-colors-swatch"
                style={{ background: c.hex, borderColor: c.id === activeId ? '#fff' : 'transparent' }}
                animate={{ scale: c.id === activeId ? 1.15 : 1 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelect(c.id)}
                whileHover={{ scale: c.id === activeId ? 1.15 : 1.2 }}
                whileTap={{ scale: 0.95 }}
              />
            ))}
          </div>
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
        <h2 className="ultra-headline flip-headline--match-card">ה-Flip הדק והקל ביותר אי פעם</h2>
        <p className="ultra-body">
          עיצוב אופנתי, יוקרתי ואלגנטי בעל מבנה דק וקל ביותר.
        </p>
        <div style={{ display: 'flex', gap: 32, margin: '24px 0' }}>
          <div>
            <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
              6.1<span style={{ fontSize: '0.5em' }}>מ״מ</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ultra-ink)' }}>העובי — הדק מאי פעם</div>
          </div>
          <div>
            <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
              180<span style={{ fontSize: '0.5em' }}>גרם</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ultra-ink)' }}>המשקל — הקל מאי פעם</div>
          </div>
        </div>
        <p style={{ fontFamily: 'var(--font-primary)', fontSize: 13, color: 'rgba(0,0,0,0.5)', margin: '0 0 8px' }} dir="rtl">
          השוואת עובי: Z Flip6 — 6.9 מ״מ · Z Flip7 — 6.5 מ״מ · Z Flip8 — 6.1 מ״מ · השוואת משקל: Z
          Flip6 — 187 גרם · Z Flip8 — 180 גרם
        </p>
        <Attrs
          items={[
            'קחו אותו איתכם לכל מקום – קליל ונוח לנשיאה לאורך כל היום',
            'נכנס לכיס ברגע: הפתרון המושלם כשהידיים שלכם מלאות',
          ]}
        />
      </div>
      <div className="ultra-split__visual">
        <img
          src={thicknessCompare}
          alt="השוואת עובי — Z Flip8 מול Z Flip7 ו-Z Flip6"
          style={{ width: '100%', display: 'block', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.14)' }}
        />
      </div>
    </div>
    <SalesTip text="שימו את ה-Flip ביד הלקוח מקופל, ואם יש דגם קודם — קחו אותו לצדו. ההבדל במשקל ובעובי מורגש תוך שנייה." />
  </MainLayer>
)

const CAMERA_MAIN = (
  <MainLayer mobileCard>
    <div className="ultra-split ultra-split--reverse">
      <div className="ultra-split__text">
        <Eyebrow><span dir="ltr">GALAXY AI</span></Eyebrow>
        <h2 className="ultra-headline flip-headline--match-card">תמונות פורטרט מרהיבות ואיכותיות</h2>
        <p className="ultra-body">
          ה-Z Flip8 מספק אפקט טשטוש רקע (AI Bokeh) מתקדם, המעניק לתמונות הפורטרט שלכם מראה מרהיב
          של מצלמת DSLR מקצועית.
        </p>
        <div dir="ltr" style={{ display: 'inline-block', fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 700, color: 'var(--samsung-blue)', border: '1px solid var(--samsung-blue)', borderRadius: 999, padding: '6px 16px', marginBottom: 20 }}>
          AI Bokeh · 50MP+
        </div>
        <Attrs
          items={[
            'תפסו את הרגעים הכי טבעיים שלכם עם חדות ופרטי פנים מדויקים',
            'הפיקו תמונות ממוקדות בזכות אפקט AI Bokeh גם במקומות עמוסים',
          ]}
        />
      </div>
      <div className="ultra-split__visual">
        <video
          src={bokehVideo}
          autoPlay
          loop
          muted
          playsInline
          style={{ display: 'block', width: '100%', aspectRatio: '6 / 5', objectFit: 'cover', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.14)' }}
        />
      </div>
    </div>
    <SalesTip text="צלמו יחד עם הלקוח תמונת פורטרט באותו הרגע והראו לו את טשטוש הרקע בזום — האפקט הדומה למצלמת DSLR משכנע מיד." />
  </MainLayer>
)

/* Below 860px, the Design→Comfort→Colors mega-section swaps CrossfadeStage's
   pinned horizontal crossfade for FlipDesignMobileSection's single sticky
   screen (same 3 phases' copy, cinematic video-background crossfade in
   place — see that file, matches the standard set by Fold's
   FoldDesignMobileSection and Ultra's DesignSection compact branch). Desktop
   keeps CrossfadeStage exactly as before; reduced-motion also keeps
   CrossfadeStage, since it already falls back to a plain stacked layout on
   its own. */
function DesignSection() {
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 860)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const onResize = () => setIsCompact(window.innerWidth < 860)
    onResize()
    const settleTimer = setTimeout(onResize, 150)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (isCompact && !reduceMotion) {
    return <FlipDesignMobileSection />
  }

  return (
    <CrossfadeStage
      id="design"
      ariaLabel="עיצוב"
      wrapperHeight="560vh"
      compactBreakpoint={0}
      layers={[
        DESIGN_MAIN,
        <FeatureCard
          sectionName="עיצוב"
          title="חוויית נוחות מתקדמת"
          desc="עיצוב מסגרת בטכנולוגיה ייחודית לפתיחה קלה ולאחיזה טבעית ונוחה — קצוות מעוגלים לפתיחה חלקה, אחיזה בטוחה ויציבה המעניקה חופש תנועה וניידות מושלמת."
          examples={['לפתוח את המכשיר בנוחות ביד אחת, בדיוק כשהיד השנייה שלכם עסוקה']}
          media={<MediaPlaceholder label="וידאו: פתיחת המכשיר ביד אחת" />}
          tip="בקשו מהלקוח לפתוח את המכשיר ביד אחת בזמן שהיד השנייה 'עסוקה' — זו הדגמה שמדברת בעד עצמה."
          pinned
        />,
        <FlipColorsCard tip="שאלו את הלקוח על הסגנון האישי שלו לפני שמראים את הצבעים — התאמה אישית מגדילה סיכוי לסגירה." />,
      ]}
    />
  )
}

/* Below 860px, the Cameras mega-section swaps CrossfadeStage's pinned
   horizontal crossfade for FlipCamerasMobileSection's single sticky screen
   (same sticky-pin + reserved-slot steps↔examples swap mechanism as Ultra's
   CameraFrameSection compact branch — see that file). Desktop keeps
   CrossfadeStage exactly as before; reduced-motion also keeps CrossfadeStage,
   since it already falls back to a plain stacked layout on its own. */
function CamerasSection() {
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 860)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const onResize = () => setIsCompact(window.innerWidth < 860)
    onResize()
    const settleTimer = setTimeout(onResize, 150)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (isCompact && !reduceMotion) {
    return <FlipCamerasMobileSection />
  }

  return (
    <CrossfadeStage
      id="cameras"
      ariaLabel="מצלמות"
      wrapperHeight="560vh"
      layers={[
        CAMERA_MAIN,
        <FeatureCard
          sectionName="מצלמה"
          title="מצב FlexCam מתקדם ושימושי יותר"
          desc="צילום יציב וללא רעידות גם בזמן תנועה, עם תכונות ייצוב וסגנון אחיזה נוחים ביותר ונעילה אופקית מתקדמת — סרטון ישר ומפולס לחלוטין גם בלי להסתכל על המסך."
          steps={[
            'פתחו את המכשיר, והחליקו שמאלה מאייקון המצלמה שעל המסך',
            'עברו למצב וידאו, קפלו את המכשיר לחצי, והחזיקו אותו כמו מסרטה (Camcorder) באחיזת יד',
            'לחצו על סמל ה-Super Steady, הפעילו את מייצב הווידאו יחד עם הנעילה האופקית — וצאו לדרך עם ההקלטה',
          ]}
          examples={[
            'צלמו בקלות תמונות וסרטונים מגבוה תוך כדי תנועה בזכות ה-FlexCam החכמה',
            'תעדו וידאו חלק ויציב במיוחד — גם כשהסירה מתנדנדת על המים',
          ]}
          media={(
            <video src={superSteadyVideo} autoPlay loop muted playsInline style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
          )}
          tip="הדגימו סיבוב או הליכה תוך כדי צילום עם Super Steady — הלקוח יראה בעצמו שהסרטון נשאר ישר לחלוטין."
        />,
        <FeatureCard
          sectionName="מצלמה"
          title="Nightography"
          titleDir="ltr"
          desc="עם ה-Z Flip8 ניתן לצלם סרטוני וידאו חדים, מפורטים ובהירים יותר, עם מינימום רעשים לקבלת תוצאות מדהימות בכל תנאי התאורה, בזכות טכנולוגיה מתקדמת לניקוי רעשי תמונה."
          examples={[
            'יוצרים ולוג לילי? צלמו סרטונים חדים ובהירים תוך כדי תנועה ברחובות החשוכים',
            'לתפוס את הרגעים הקסומים: תעדו תהלוכות לילה צבעוניות בפארק השעשועים ברמת פירוט מדהימה',
          ]}
          media={(
            <video src={nightographyVideo} autoPlay loop muted playsInline style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
          )}
          tip="אם יש פינה מוצלת בחנות, צלמו שם סרטון קצר עם הלקוח והשוו לתוצאה בלי Nightography — ההבדל ברעש ובבהירות בולט."
        />,
      ]}
    />
  )
}

/* Below 860px, FlexWindow swaps its plain stacked <FeatureCard> for
   FlipFlexWindowMobileSection's single sticky screen (same reserved-slot
   steps↔examples swap mechanism as CamerasSection, just the single-phase
   case — see that file). Desktop keeps the original FeatureCard exactly as
   before; reduced-motion also keeps it, rendered directly in normal flow. */
function FlexWindowSection() {
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 860)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const onResize = () => setIsCompact(window.innerWidth < 860)
    onResize()
    const settleTimer = setTimeout(onResize, 150)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (isCompact && !reduceMotion) {
    return <FlipFlexWindowMobileSection />
  }

  return (
    <Section id="flexwindow" ariaLabel="אפליקציות במסך החיצוני">
      <FeatureCard
        constrainHeight={false}
        sectionName="FLEX-WINDOW"
        title="חוויית שימוש חכמה ואינטואיטיבית עם FlexWindow"
        tags={['Now Brief', 'Home']}
        desc="גישה למגוון אפליקציות באופן מיידי על גבי ה-FlexWindow, בדיוק כמו במסך הראשי — תמיכה ב-16 אפליקציות, ניהול התראות וגישה מהירה להגדרות."
        note="* התמיכה באפליקציות צד שלישי צפויה להתרחב. תמיכה בעד 5 אפליקציות נוספות מתוכננת להשתחרר לאחר ההשקה."
        steps={[
          'החליקו מכל מקום על גבי המסך החיצוני כדי לפתוח את הנעילה',
          'החליקו למעלה מהקצה התחתון כדי לפתוח את חלון היישומים',
          'הפעילו את האפליקציה הרצויה',
        ]}
        examples={[
          'לצפות במהירות בלוח השנה ולבדוק את הלו״ז מבלי לפתוח את המכשיר',
          'לבצע שיחות דחופות ישירות מה-FlexWindow תוך כדי תנועה',
          'לקבל תובנות ומידע על פגישות חשובות במבט מהיר',
        ]}
        media={<img src={galaxyAi1} alt="Now Brief על ה-FlexWindow" style={{ display: 'block', height: 'clamp(320px, 34vw, 460px)', width: 'auto', maxWidth: '100%' }} />}
        tip="תנו ללקוח לגלוש בעצמו באפליקציות על ה-FlexWindow סגור — זו החוויה שהכי קשה להעביר במילים."
        tipInColumn
      />
    </Section>
  )
}

export default function FlipPage() {
  return (
    <div className="flip" dir="rtl" lang="he">
      {/* ---------- 01 · Design → Comfort → Colors (3-layer crossfade;
          sticky cinematic screen below 860px, see DesignSection) ---------- */}
      <DesignSection />

      {/* ---------- 02 · Display (standalone, no cards) ---------- */}
      <Section id="display" ariaLabel="מסך חיצוני">
        <MainLayer mobileCard>
          <div className="ultra-split">
            <div className="ultra-split__text">
              <Eyebrow>תצוגה</Eyebrow>
              <h2 className="ultra-headline flip-headline--match-card">מסך חיצוני מלא בעיצוב אסתטי ומרהיב</h2>
              <p className="ultra-body">
                חוויית צפייה מרהיבה מקצה לקצה עם שוליים צרים ודקים ביותר על גבי המסך החיצוני.
              </p>
              <div style={{ margin: '24px 0' }}>
                <div dir="rtl" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(28px, 2.6vw, 40px)', lineHeight: 1, color: '#141414' }}>
                  1.25<span style={{ fontSize: '0.5em' }}>מ״מ</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ultra-ink)' }}>רוחב מסגרת מינימלי — עיצוב שוליים נקי ושלם</div>
              </div>
              <Attrs items={['ליהנות מחוויית צפייה סוחפת ותצוגת מסך רציפה, הודות לשוליים הדקים ביותר']} />
            </div>
            <div className="ultra-split__visual">
              <div className="flip-display-duo">
                <img src={coverScreen1} alt="מסך חיצוני מלא — זווית ראשונה" className="flip-display-duo__img" />
                <img src={coverScreen2} alt="מסך חיצוני מלא — זווית שנייה" className="flip-display-duo__img" />
              </div>
            </div>
          </div>
          <SalesTip text="תנו ללקוח להחזיק את המכשיר סגור ולהצביע על השוליים הדקים — ההשוואה למסך חיצוני של דגם קודם עושה את העבודה." />
        </MainLayer>
      </Section>

      {/* ---------- 03 · Cameras → FlexCam → Nightography (3-layer crossfade;
          sticky cinematic screen below 860px, see CamerasSection) ---------- */}
      <CamerasSection />

      {/* ---------- 04 · FlexWindow (standalone; sticky swap card below
          860px, see FlexWindowSection) ---------- */}
      <FlexWindowSection />

      {/* ---------- 05 · Full spec ---------- */}
      <Section id="spec" ariaLabel="מפרט טכני מלא">
        <Eyebrow>מפרט מלא</Eyebrow>
        <h2 className="ultra-headline flip-headline--match-card">מפרט טכני</h2>
        <p className="ultra-body ultra-body--wide">
          ה-Flip הדק ביותר אי פעם — הFlip8 מעניק חוויית ניידות חסרת תקדים ומסך חיצוני חכם עם עוצמת ה-AI שנועד להקל על שגרת היום-יום שלכם.
        </p>
        <div className="ultra-table">
          {[
            { label: 'מסך ראשי', value: '6.9" FHD+, Dynamic AMOLED 2X, קצב רענון אדפטיבי 1-120Hz' },
            { label: 'מסך חיצוני', value: '4.1", Super AMOLED, 60/120Hz' },
            { label: 'מצלמה אחורית', value: 'ראשית 50MP AF (F1.8), רחבה במיוחד 12MP (F2.2)' },
            { label: 'מצלמה קדמית', value: '10MP FF, 1.12㎛ (F2.2)' },
            { label: 'מעבד', value: 'Samsung Exynos 2600 (3 nm)' },
            { label: 'זיכרון ואחסון', value: '12GB + 256/512GB' },
            { label: 'סוללה וטעינה', value: '4,300 mAh, טעינה מהירה 2.0 25W, טעינה אלחוטית מהירה' },
            { label: 'מידות ומשקל', value: 'פתוח 6.1 x 75.4 x 166.9 מ"מ, מקופל 13.1 x 75.4 x 85.7 מ"מ, 180 גרם' },
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

      <div className="ultra__footer-mark" dir="ltr">GALAXY Z FLIP8</div>
    </div>
  )
}
