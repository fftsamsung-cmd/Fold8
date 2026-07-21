import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CountUpSpan } from './CountUpSpan'
import forGalaxyBadge from '../assets/Ultra/for-galaxy-badge.png'

gsap.registerPlugin(ScrollTrigger)

/* Load a frame sequence as sorted URLs — Vite bundles and hashes them.
   Sorted numerically so e.g. ezgif-frame-020.png (0% scroll) through
   ezgif-frame-090.png (100% scroll) play back in order. Frame *numbers* are
   parsed from the glob key (the source path, never hashed) rather than the
   emitted URL, so the "reveal at frame N" lookup below stays correct in a
   production build too. */
function loadFrameSet(modules: Record<string, string>) {
  const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  const urls = entries.map(([, url]) => url)
  const numbers = entries.map(([path]) => {
    const match = path.match(/(\d+)(?=\.\w+$)/)
    return match ? parseInt(match[1], 10) : 0
  })
  return { urls, numbers, total: urls.length }
}

/* Desktop: dark reflective-floor exploded shot, 1920x1080, frames 020-090.
   Mobile: separate white-background 1:1 (1440x1440) sequence, frames
   015-150 — a different asset entirely (not a crop of the desktop one), so
   it gets its own object-fit/background treatment below rather than reusing
   desktop's cover/black-backdrop styling as-is. */
const DESKTOP_FRAMES = loadFrameSet(
  import.meta.glob<string>('../assets/Ultra/performance-frames/*.png', { query: '?url', import: 'default', eager: true })
)
const MOBILE_FRAMES = loadFrameSet(
  import.meta.glob<string>('../assets/Ultra/Mobile/performance-frames/*.png', { query: '?url', import: 'default', eager: true })
)

/* The text card starts fading in once the scrub reaches this frame number
   — chosen per sequence at the same relative point (~79% through), the
   moment the assembled chip badge is fully in frame on both. */
const DESKTOP_CARD_APPEAR_FRAME = 75
const MOBILE_CARD_APPEAR_FRAME = 121

const STATS = [
  { prefix: '×', countValue: 6.9, isDecimal: true, label: 'NPU · עיבוד בינה מלאכותית' },
  { prefix: '×', countValue: 1.6, isDecimal: true, label: 'GPU · גרפיקה ומשחקים' },
  { prefix: '×', countValue: 1.1, isDecimal: true, label: 'CPU · ביצועים כלליים' },
]

/* Full-bleed scroll-scrubbed processor frame sequence — frame 0 (ezgif-frame-020)
   at 0% scroll through the wrapper, last frame (ezgif-frame-090) at 100%; the
   sticky viewport releases naturally once the wrapper's own scroll runway
   ends, handing off to the next section (Battery). Same GSAP ScrollTrigger
   scrub (no `pin`, CSS `position: sticky` handles pinning) as
   CameraFrameSection above.

   A glass text card fades in over the left half of the frame once the scrub
   passes frame 60 — confined to the left half so it never covers the chip
   artwork, which sits on the right side of every frame. */
export default function PerformanceFrameSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const [ready, setReady] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)
  const cardVisibleRef = useRef(false)
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 860)

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 860)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { urls: frameUrls, numbers: frameNumbers, total: totalFrames } = isCompact ? MOBILE_FRAMES : DESKTOP_FRAMES
    const cardAppearFrame = isCompact ? MOBILE_CARD_APPEAR_FRAME : DESKTOP_CARD_APPEAR_FRAME
    const cardAppearIndex = frameNumbers.findIndex((n) => n >= cardAppearFrame)

    imagesRef.current = Array(totalFrames).fill(null)
    setReady(false)
    cardVisibleRef.current = false
    setCardVisible(false)

    const drawFrame = (index: number) => {
      const img = imagesRef.current[index]
      if (!img?.complete || !img.naturalWidth) return
      if (canvas.width !== img.naturalWidth) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }

    // Pre-load all frames; draw frame 0 as soon as it's ready.
    let firstFrameReady = false
    frameUrls.forEach((url, i) => {
      const img = new Image()
      img.onload = () => {
        imagesRef.current[i] = img
        if (i === 0 && !firstFrameReady) {
          firstFrameReady = true
          drawFrame(0)
          setReady(true)
        }
      }
      img.src = url
    })

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frameState = { frame: 0 }

    // Small hysteresis gap so a tiny scroll wobble right at the reveal point
    // doesn't flicker the card in and out.
    const hideBelow = Math.max(cardAppearIndex - 3, 0)

    const ctxGsap = gsap.context(() => {
      gsap.to(frameState, {
        frame: totalFrames - 1,
        ease: 'none',
        immediateRender: false,
        onUpdate: () => {
          drawFrame(Math.round(frameState.frame))
          if (frameState.frame >= cardAppearIndex && !cardVisibleRef.current) {
            cardVisibleRef.current = true
            setCardVisible(true)
          } else if (frameState.frame < hideBelow && cardVisibleRef.current) {
            cardVisibleRef.current = false
            setCardVisible(false)
          }
        },
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: reduceMotion ? true : 0.4,
        },
      })
    }, wrapper)

    if (reduceMotion) {
      cardVisibleRef.current = true
      setCardVisible(true)
    }

    return () => ctxGsap.revert()
  }, [isCompact])

  // Mobile's sequence is a separate white-background 1:1 asset (not a crop
  // of desktop's 1920x1080 dark one) — 'cover' would zoom into a 1:1 image
  // to fill a narrow tall viewport and crop out most of the exploded parts
  // on one side, so mobile uses 'contain' instead (full composition, small
  // top/bottom letterbox) with a matching light backdrop instead of black.
  // The mobile frames' own background isn't flat white — sampled pixels at
  // the top/bottom edges land around #dddbdc–#f2f2f2 depending on the frame
  // — so a flat white/near-white letterbox reads as a visible seam against
  // it. bgColor is tuned to the middle of that range, and a soft feathered
  // gradient (not a hard color match, since the exact tone drifts frame to
  // frame) blends the canvas edges into it on top.
  const bgColor = isCompact ? '#ececec' : '#000'

  return (
    <div ref={wrapperRef} id="performance" style={{ height: '300vh', position: 'relative', background: bgColor }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', background: bgColor }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: isCompact ? 'contain' : 'cover',
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {isCompact && (
          <>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '10%',
                background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '10%',
                background: `linear-gradient(to top, ${bgColor} 0%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* "For Galaxy" gold plaque — sits on the reflective floor right
            beneath the chip box in the frame artwork (measured off the last
            frame: the box's floor/horizon line sits at ~77% viewport height,
            centered around ~84% viewport width), not attached to the text
            card. Fades in with the same `cardVisible` trigger as the card so
            it arrives at the same moment, with a short delay + pop so it
            reads as landing just after the card rather than in lockstep.
            Desktop-only — the mobile sequence has no reflective floor/
            horizon line for it to sit on (plain white backdrop, chip
            positioned differently in frame), so this position wouldn't line
            up with anything there. */}
        {!isCompact && (
          <img
            src={forGalaxyBadge}
            alt="Snapdragon For Galaxy"
            style={{
              position: 'absolute',
              top: '78%',
              left: '84%',
              width: 'clamp(120px, 13vw, 170px)',
              height: 'auto',
              filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5))',
              opacity: cardVisible ? 1 : 0,
              transform: `translate(-50%, ${cardVisible ? 0 : 10}px) rotate(-2deg) scale(${cardVisible ? 1 : 0.7})`,
              transition: cardVisible
                ? 'opacity 0.5s ease 0.2s, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
                : 'opacity 0.3s ease, transform 0.3s ease',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Text card. Desktop: confined to the left half of the viewport —
            explicit left/right/width (not `inset` shorthand) because the
            page's `dir="rtl"` flips which edge an over-constrained
            left+right+width box resolves against — without this it anchors
            to the right instead. 40px wider than an even split (nothing else
            shares this half — it floats over the full-bleed canvas) so the
            headline's second line fits on one line.
            Mobile: full width, vertically centered over the whole frame
            (including the chip artwork) instead of inheriting that desktop
            half-width math — the glass/blur card reads as a deliberate
            centered overlay covering the chip, not a column beside it. */}
        <div
          style={
            isCompact
              ? {
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 20px',
                  pointerEvents: 'none',
                }
              : {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 'auto',
                  width: 'calc(50% + 40px)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 clamp(20px, 3.5vw, 48px)',
                  pointerEvents: 'none',
                }
          }
        >
          <div
            dir="rtl"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '780px',
              borderRadius: '24px',
              background: 'rgba(20, 20, 26, 0.42)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
              padding: 'clamp(20px, 2.6vw, 36px)',
              opacity: cardVisible ? 1 : 0,
              transform: cardVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 900,
                fontSize: 'clamp(24px, 2.4vw, 38px)',
                lineHeight: 1.1,
                margin: '0 0 10px',
                color: '#fff',
              }}
            >
              ביצועי על!
              <br />
              המעבד שמטיס את הביצועים קדימה
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'clamp(13px, 1vw, 15px)',
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.65)',
                margin: '0 0 6px',
                lineHeight: 1.6,
              }}
            >
              מעבד מותאם אישית בביצועי AI עוצמתיים במיוחד המשנה את חוקי המשחק
            </p>

            <p
              dir="ltr"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--accent-color)',
                margin: '0 0 20px',
                textAlign: 'right',
              }}
            >
              Snapdragon 8 Elite Gen5 For Galaxy
            </p>

            <div style={{ width: 36, height: 2, background: 'var(--accent-color)', marginBottom: 20 }} />

            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
              {STATS.map((stat) => (
                <div key={stat.label} style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontWeight: 800,
                      fontSize: 'clamp(22px, 2vw, 30px)',
                      lineHeight: 1,
                      color: '#fff',
                      textAlign: 'right',
                    }}
                    dir="ltr"
                  >
                    {stat.prefix}
                    <CountUpSpan value={stat.countValue} isDecimal={stat.isDecimal} />
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      fontWeight: 400,
                      color: 'rgba(255, 255, 255, 0.55)',
                      textAlign: 'right',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginTop: '22px',
                borderRadius: '10px',
                background: 'rgba(57,49,93,0.08)',
                border: '1px solid rgba(57,49,93,0.22)',
                borderInlineStart: '3px solid var(--accent-color)',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
              <div>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-color)' }}>
                  טיפ לנציג:{' '}
                </span>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>
                  אם ללקוח יש דגם קודם, הריצו יחד משחק כבד בשני המכשירים והשוו את חלקות התצוגה.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
