import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import foldDesignVideo from '../assets/Fold/SM-F971_ZFold8 Wide_Lavender.mp4'
import colorPurpleImg from '../assets/Fold/צבעים/צבע_סגול-removebg-preview.png'
import colorBlackImg from '../assets/Fold/צבעים/צבע_שחור-removebg-preview.png'
import colorWhiteImg from '../assets/Fold/צבעים/צבע_לבן-removebg-preview.png'

/* Mobile-only (<860px) sticky "cinematic" version of the Design section —
   built specifically for mobile instead of scaling down CrossfadeStage's
   pinned desktop stage (which breaks in portrait, see CrossfadeStage's own
   comment). One sticky 100dvh screen; unlike CrossfadeStage's horizontal
   slide-between-cards, here the SAME screen crossfades in place — both the
   background media (design video → active color photo) and the overlaid
   text block swap via opacity as the user scrolls, driven by scroll
   progress through the tall wrapper below (plain rAF/getBoundingClientRect,
   no GSAP — same lightweight technique FoldDisplayRevealSection's pinned
   stage already uses on this page). The desktop path (CrossfadeStage) is
   untouched; this only ever mounts below the 860px breakpoint, and never
   when the OS asks for reduced motion (see DesignSection in FoldPage.tsx). */

const FOLD_COLORS = [
  { id: 'purple', name: 'סגול', hex: 'var(--accent-color)', glow: 'rgba(139,92,246,0.25)', image: colorPurpleImg },
  { id: 'black', name: 'שחור', hex: 'var(--samsung-black)', glow: 'rgba(0,0,0,0.14)', image: colorBlackImg },
  { id: 'white', name: 'לבן', hex: 'var(--ultra-paper)', glow: 'rgba(0,0,0,0.07)', image: colorWhiteImg },
] as const

const TRANSITION_CENTER = 0.42
const TRANSITION_LEN = 0.24

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

function DesignTip({ text, light }: { text: string; light?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 10,
        background: light ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.07)',
        border: light ? '1px solid rgba(139,92,246,0.22)' : '1px solid rgba(255,255,255,0.16)',
        borderInlineStart: '3px solid var(--accent-color)',
        padding: '12px 14px',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
      <div>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, color: 'var(--accent-color)' }}>
          טיפ לנציג:{' '}
        </span>
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, color: light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.78)' }}>
          {text}
        </span>
      </div>
    </div>
  )
}

export default function FoldDesignMobileSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [t, setT] = useState(0)
  const [activeId, setActiveId] = useState<string>(FOLD_COLORS[0].id)
  const active = FOLD_COLORS.find((c) => c.id === activeId) ?? FOLD_COLORS[0]
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const restartAutoAdvance = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => {
      setActiveId((current) => {
        const idx = FOLD_COLORS.findIndex((c) => c.id === current)
        return FOLD_COLORS[(idx + 1) % FOLD_COLORS.length].id
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
      const bandStart = TRANSITION_CENTER - TRANSITION_LEN / 2
      setT(clamp01((p - bandStart) / TRANSITION_LEN))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div id="design" ref={wrapperRef} aria-label="עיצוב וצבעים" style={{ height: '240vh', position: 'relative', background: '#050506' }}>
      <div style={{ position: 'sticky', top: 0, height: '100dvh', width: '100%', overflow: 'hidden' }}>
        {/* Media layer — design video crossfades into a plain white ground
            for the colors phase (see FoldDesignMobileSection request: white
            background, colors phase only — design/video phase stays dark). */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#fff', opacity: t }} />
          <video
            src={foldDesignVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 1 - t,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 1 - t,
              background:
                'linear-gradient(to top, rgba(5,5,8,0.96) 0%, rgba(5,5,8,0.66) 34%, rgba(5,5,8,0.14) 60%, rgba(5,5,8,0) 74%)',
            }}
          />
        </div>

        {/* Text layer — design copy crossfades into colors copy, same spot */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              padding: '0 20px calc(40px + env(safe-area-inset-bottom, 0px))',
              opacity: 1 - t,
              transform: `translateY(${t * 14}px)`,
              pointerEvents: t <= 0.5 ? 'auto' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 24, height: 2, background: 'var(--accent-color)' }} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-color)' }}>
                מבנה
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(26px, 7vw, 34px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#f7f6fb', margin: '0 0 12px' }}>
              ה-Z Fold בעיצוב<br />הקל ביותר שלנו
            </h2>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: '#b7b6c2', margin: '0 0 18px' }}>
              ה-Galaxy Z Fold8 דק וקל ביותר, עם אחיזה נוחה במיוחד לצפייה בתוכן — קומפקטי ודק במיוחד, בעיצוב מותאם לכיס.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {['קומפקטי ודק במיוחד', 'עיצוב אינטואיטיבי וקל לפתיחה'].map((attr) => (
                <div key={attr} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: 'var(--accent-color)', flexShrink: 0 }}>—</span>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: '#e4e3ea' }}>{attr}</span>
                </div>
              ))}
            </div>
            <DesignTip text="שימו את המכשיר ביד הלקוח מקופל — הדקות והמשקל מורגשים תוך שנייה, בלי צורך להסביר." />
          </div>

          <div
            dir="rtl"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '76px 20px 20px',
              opacity: t,
              transform: `translateY(${(1 - t) * 14}px)`,
              pointerEvents: t > 0.5 ? 'auto' : 'none',
            }}
          >
            {/* Color photo — sits directly above the copy (tight margin, not
                a separately-pinned top layer) so there's no dead gap between
                the image and "גימור" below it. */}
            <div
              aria-hidden="true"
              style={{
                position: 'relative',
                width: '60%',
                maxWidth: 270,
                aspectRatio: '3 / 2',
                margin: '0 auto 18px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-18%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)`,
                }}
              />
              {FOLD_COLORS.map((c) => (
                <img
                  key={c.id}
                  src={c.image}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.22))',
                    opacity: c.id === activeId ? 1 : 0,
                    transition: 'opacity 0.35s ease',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 24, height: 2, background: 'var(--accent-color)' }} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-color)' }}>
                גימור
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(26px, 7vw, 34px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: '#141414', margin: '0 0 12px' }}>
              מגוון צבעים טרנדיים<br />שמושכים את העין
            </h2>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: 'rgba(0,0,0,0.6)', margin: '0 0 20px' }}>
              ה-Z Fold8 מגיע ב-3 גוונים אופנתיים וטרנדיים, התואמים את העיצוב המרהיב.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              {FOLD_COLORS.map((c) => (
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
  )
}
