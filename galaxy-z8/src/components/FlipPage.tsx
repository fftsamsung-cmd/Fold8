import { useEffect, useState } from 'react'
import SalesTip from './SalesTip'
import { Section, Eyebrow, Attrs, MainLayer, CrossfadeStage, FeatureCard, useIsCompact, useAutoAdvanceColors, ColorSwatchPicker } from './SectionKit'
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
import oneHandOpenVideo from '../assets/Flip/SM-F776_ZFlip8_Pink.mp4'
import galaxyAi1 from '../assets/Flip/galaxyai1-nobg.png'
import coverScreen1 from '../assets/Flip/ChatGPT Image Jul 20, 2026, 05_21_40 PM.png'
import coverScreen2 from '../assets/Flip/ChatGPT Image Jul 20, 2026, 05_22_52 PM.png'
import './FlipPage.css'

/* Full spec table, broken into per-clause segments instead of one string
   per row — each segment carries its own "differs from Flip7 / Flip6"
   info, hand-set from the real spec (not a runtime string-equality check,
   since this table's copy is phrased more tersely than the comparison
   sheets even when the underlying spec is identical). Segment text is
   written so simply concatenating every segment in order reproduces the
   exact original row copy (each non-first segment includes its own
   leading ", "), so choosing a comparison model never changes the
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
  '7': 'Flip7',
  '6': 'Flip6',
}

const SPEC_ROWS: SpecRow[] = [
  {
    label: 'מסך ראשי',
    segments: [
      { text: '6.9" FHD+, Dynamic AMOLED 2X, קצב רענון אדפטיבי 1-120Hz', diff: { '6': '6.7", 2640x1080' } },
    ],
  },
  {
    label: 'מסך חיצוני',
    segments: [
      { text: '4.1", Super AMOLED, 60/120Hz', diff: { '6': '3.4", 720x748' } },
    ],
  },
  {
    label: 'מצלמה אחורית',
    segments: [
      { text: 'ראשית 50MP AF (F1.8)' },
      { text: ', רחבה במיוחד 12MP (F2.2)', diff: { '7': '12MP, זום אופטי 2x' } },
    ],
  },
  {
    label: 'מצלמה קדמית',
    segments: [{ text: '10MP FF, 1.12㎛ (F2.2)' }],
  },
  {
    label: 'מעבד',
    segments: [{ text: 'Samsung Exynos 2600 (3 nm)', diff: { '7': 'Exynos 2500 (3nm)', '6': 'Snapdragon 8 Gen 3 (4nm)' } }],
  },
  {
    label: 'זיכרון ואחסון',
    segments: [{ text: '12GB + 256/512GB', diff: { '6': '8/12GB + 256/512GB' } }],
  },
  {
    label: 'סוללה וטעינה',
    segments: [
      { text: '4,300 mAh', diff: { '6': '4,000 mAh' } },
      { text: ', טעינה מהירה 2.0 25W', diff: { '7': '25W, ללא גרסת 2.0', '6': '25W, ללא גרסת 2.0' } },
      { text: ', טעינה אלחוטית מהירה' },
    ],
  },
  {
    label: 'מידות ומשקל',
    segments: [
      { text: 'פתוח 6.1 x 75.4 x 166.9 מ"מ', diff: { '6': '6.9 x 71.9 x 165.1 מ"מ' } },
      { text: ', מקופל 13.1 x 75.4 x 85.7 מ"מ', diff: { '6': '14.9 x 71.9 x 85.1 מ"מ' } },
      { text: ', 180 גרם', diff: { '7': '188 גרם', '6': '187 גרם' } },
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
  const { activeId, active, handleSelect } = useAutoAdvanceColors(FLIP_COLORS)

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
          <ColorSwatchPicker colors={FLIP_COLORS} activeId={activeId} onSelect={handleSelect} />
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
  <MainLayer mobileCard pinned>
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
  const isCompact = useIsCompact(768, { settle: true })
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
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
          media={(
            <video src={oneHandOpenVideo} autoPlay loop muted playsInline style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
          )}
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
  const isCompact = useIsCompact(768, { settle: true })
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
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
  const isCompact = useIsCompact(768, { settle: true })
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
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
  const [compareModel, setCompareModel] = useState<PreviousModelKey | null>(null)

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

        {/* Compare dropdown — picks Flip7/Flip6; the table below highlights,
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
        <SalesTip text="השאירו את טבלת המפרט לסוף השיחה — אחרי שהלקוח כבר התרשם בחוויה, המספרים רק מחזקים את ההחלטה." />
      </Section>

      <div className="ultra__footer-mark" dir="ltr">GALAXY Z FLIP8</div>
    </div>
  )
}
