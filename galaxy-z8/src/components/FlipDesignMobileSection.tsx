import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import designVideo from '../assets/Flip/SM-F776_ZFlip8_Pink.mp4'
import comfortVideo from '../assets/Flip/נוח בכיס.mp4'
import colorPinkImg from '../assets/Flip/color-pink-nobg.png'
import colorBlackImg from '../assets/Flip/color-black-nobg.png'
import colorWhiteImg from '../assets/Flip/color-white-nobg.png'

/* Mobile-only (<860px) sticky "cinematic" version of the Design mega-section
   (מבנה → נוחות → גימור) — same full-bleed video-background + overlaid-copy
   treatment as FoldDesignMobileSection (Fold) and DesignSection's compact
   branch (Ultra), extended to 3 stops instead of 2 since Flip's desktop
   CrossfadeStage also carries a middle "Comfort" phase in between Design and
   Colors. One sticky 100dvh screen; all three phases crossfade in place via
   opacity, driven by scroll progress through the tall wrapper below (plain
   rAF/getBoundingClientRect, no GSAP — same lightweight technique the other
   two pages use). Desktop (CrossfadeStage) is untouched; this only ever
   mounts below the 860px breakpoint and never when the OS asks for reduced
   motion (see DesignSection wrapper in FlipPage.tsx). Text content is 1:1
   the same copy as the desktop DESIGN_MAIN / Comfort FeatureCard /
   FlipColorsCard — only the presentation (video-as-background instead of a
   framed media box) changes. */

const FLIP_COLORS = [
  { id: 'pink', name: 'ורוד', hex: '#f472b6', glow: 'rgba(244,114,182,0.28)', image: colorPinkImg },
  { id: 'black', name: 'שחור', hex: 'var(--samsung-black)', glow: 'rgba(0,0,0,0.18)', image: colorBlackImg },
  { id: 'white', name: 'לבן', hex: 'var(--ultra-paper)', glow: 'rgba(240,240,240,0.5)', image: colorWhiteImg },
] as const

const SEGMENT = 1 / 3
const TRANSITION_LEN = 0.16
const CENTER_1 = SEGMENT
const CENTER_2 = SEGMENT * 2

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

function DesignTip({ text, light }: { text: string; light?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 10,
        background: light ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.07)',
        border: light ? '1px solid rgba(236,72,153,0.22)' : '1px solid rgba(255,255,255,0.16)',
        borderInlineStart: '3px solid #ec4899',
        padding: '12px 14px',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
      <div>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, color: '#ec4899' }}>
          טיפ לנציג:{' '}
        </span>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, color: light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.78)' }}>
          {text}
        </span>
      </div>
    </div>
  )
}

export default function FlipDesignMobileSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [t1, setT1] = useState(0)
  const [t2, setT2] = useState(0)
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
      setT1(clamp01((p - (CENTER_1 - TRANSITION_LEN / 2)) / TRANSITION_LEN))
      setT2(clamp01((p - (CENTER_2 - TRANSITION_LEN / 2)) / TRANSITION_LEN))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const designOpacity = 1 - t1
  const comfortOpacity = t1 * (1 - t2)
  const colorsOpacity = t2

  return (
    <div id="design" ref={wrapperRef} aria-label="עיצוב, נוחות וצבעים" style={{ height: '360vh', position: 'relative', background: '#050506' }}>
      <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden' }}>

        {/* Phase 1 — מבנה: full-bleed spin video + gradient scrim + overlaid copy */}
        <div style={{ position: 'absolute', inset: 0, opacity: designOpacity, pointerEvents: t1 <= 0.5 ? 'auto' : 'none' }}>
          <video
            src={designVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(5,5,8,0.96) 0%, rgba(5,5,8,0.66) 34%, rgba(5,5,8,0.14) 60%, rgba(5,5,8,0) 74%)',
            }}
          />
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              padding: '0 20px calc(32px + env(safe-area-inset-bottom, 0px))',
              maxHeight: '88dvh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 2, background: '#ec4899' }} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#f4a9c7' }}>מבנה</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6.5vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#f7f6fb', margin: '0 0 10px' }}>
              ה-Flip הדק והקל ביותר אי פעם
            </h2>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: '#b7b6c2', margin: '0 0 14px' }}>
              עיצוב אופנתי, יוקרתי ואלגנטי בעל מבנה דק וקל ביותר.
            </p>
            <div style={{ display: 'flex', gap: 28, marginBottom: 12 }}>
              <div>
                <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6vw, 30px)', lineHeight: 1, color: '#f7f6fb' }}>
                  6.1<span style={{ fontSize: '0.5em' }}>מ״מ</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#b7b6c2' }}>העובי — הדק מאי פעם</div>
              </div>
              <div>
                <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6vw, 30px)', lineHeight: 1, color: '#f7f6fb' }}>
                  180<span style={{ fontSize: '0.5em' }}>גרם</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#b7b6c2' }}>המשקל — הקל מאי פעם</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {['קחו אותו איתכם לכל מקום – קליל ונוח לנשיאה לאורך כל היום', 'נכנס לכיס ברגע: הפתרון המושלם כשהידיים שלכם מלאות'].map((attr) => (
                <div key={attr} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '4px 0' }}>
                  <span style={{ fontSize: 12, lineHeight: 1.4, color: '#ec4899', flexShrink: 0 }}>—</span>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: '#e4e3ea' }}>{attr}</span>
                </div>
              ))}
            </div>
            <DesignTip text="שימו את ה-Flip ביד הלקוח מקופל, ואם יש דגם קודם — קחו אותו לצדו. ההבדל במשקל ובעובי מורגש תוך שנייה." />
          </div>
        </div>

        {/* Phase 2 — נוחות (עיצוב, per FeatureCard's sectionName): full-bleed
            "comfortable in pocket" clip + gradient scrim + overlaid copy */}
        <div style={{ position: 'absolute', inset: 0, opacity: comfortOpacity, pointerEvents: t1 > 0.5 && t2 <= 0.5 ? 'auto' : 'none' }}>
          <video
            src={comfortVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(5,5,8,0.96) 0%, rgba(5,5,8,0.66) 34%, rgba(5,5,8,0.14) 60%, rgba(5,5,8,0) 74%)',
            }}
          />
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              padding: '0 20px calc(32px + env(safe-area-inset-bottom, 0px))',
              maxHeight: '88dvh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 2, background: '#ec4899' }} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#f4a9c7' }}>עיצוב</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6.5vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#f7f6fb', margin: '0 0 12px' }}>
              חוויית נוחות מתקדמת
            </h2>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: '#b7b6c2', margin: '0 0 16px' }}>
              עיצוב מסגרת בטכנולוגיה ייחודית לפתיחה קלה ולאחיזה טבעית ונוחה — קצוות מעוגלים לפתיחה חלקה, אחיזה בטוחה ויציבה המעניקה חופש תנועה וניידות מושלמת.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>
                דוגמאות לשימוש
              </div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: 13, color: '#e4e3ea', lineHeight: 1.5 }}>
                לפתוח את המכשיר בנוחות ביד אחת, בדיוק כשהיד השנייה שלכם עסוקה
              </div>
            </div>
            <DesignTip text="בקשו מהלקוח לפתוח את המכשיר ביד אחת בזמן שהיד השנייה 'עסוקה' — זו הדגמה שמדברת בעד עצמה." />
          </div>
        </div>

        {/* Phase 3 — גימור: white ground, contained product photo + swatches */}
        <div dir="rtl" style={{ position: 'absolute', inset: 0, opacity: colorsOpacity, pointerEvents: t2 > 0.5 ? 'auto' : 'none' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#fff' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20, boxSizing: 'border-box', maxHeight: '100%', overflowY: 'auto' }}>
            <div
              aria-hidden="true"
              style={{ position: 'relative', width: '54%', maxWidth: 210, aspectRatio: '3 / 2', margin: '0 auto 18px' }}
            >
              <div style={{ position: 'absolute', inset: '-18%', borderRadius: '50%', background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)` }} />
              {FLIP_COLORS.map((c) => (
                <img
                  key={c.id}
                  src={c.image}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.22))', opacity: c.id === activeId ? 1 : 0, transition: 'opacity 0.35s ease' }}
                />
              ))}
            </div>
            <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 24, height: 2, background: '#ec4899' }} />
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#ec4899' }}>גימור</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(24px, 6.5vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#141414', margin: '0 0 12px' }}>
                צבעים אייקוניים וייחודיים
              </h2>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: 'rgba(0,0,0,0.6)', margin: '0 0 18px' }}>
                שלבו את הצבעים האייקוניים והטרנדיים של ה-Galaxy Z Flip8 עם הלוק היומי שלכם, ליצירת סגנון ייחודי.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                {FLIP_COLORS.map((c) => (
                  <motion.button
                    key={c.id}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={c.id === activeId}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: c.hex,
                      border: '2px solid',
                      borderColor: c.id === activeId ? '#141414' : 'rgba(0,0,0,0.16)',
                      boxShadow: c.id === activeId ? '0 0 0 3px rgba(0,0,0,0.08)' : 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    animate={{ scale: c.id === activeId ? 1.15 : 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleSelect(c.id)}
                    whileTap={{ scale: 0.92 }}
                  />
                ))}
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 15, fontWeight: 700, color: '#141414' }}>{active.name}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.45)', lineHeight: 1.5, margin: '0 0 18px' }}>
                * זמינות הצבעים עשויה להשתנות בהתאם לרשת השיווק או המפעילה הסלולרית
              </p>
              <DesignTip light text="שאלו את הלקוח על הסגנון האישי שלו לפני שמראים את הצבעים — התאמה אישית מגדילה סיכוי לסגירה." />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
