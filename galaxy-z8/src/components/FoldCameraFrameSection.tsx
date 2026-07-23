import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FeatureCard, useIsCompact } from './SectionKit'
import { GalaxyAiDesktopCard, PHOTO_ASSIST_DATA } from './GalaxyAiStackSection'
import horizontalLockVideo from '../assets/Fold/horizontal lock.mp4'
import galaxyAiVideo from '../assets/Ultra/galaxy-ai.mp4'
import cameraCompactVideo from '../assets/Fold/hf_20260719_054515_b5134926-b356-4ffa-b382-f1c6526ec6ed (1).mp4'

gsap.registerPlugin(ScrollTrigger)

/* Load all frames as URLs — Vite bundles and hashes them */
const frameModules = import.meta.glob<string>('../assets/Fold/camera-frames/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
})

/* Sort numerically by filename (ezgif-frame-050.png … ezgif-frame-150.png) */
const FRAME_URLS: string[] = Object.entries(frameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url)

const TOTAL_FRAMES = FRAME_URLS.length

/* Same exploded-parts studio renders as Ultra's camera frames, but the
   Fold8's lavender body sits much closer in brightness to the white studio
   backdrop (~200 vs 255) than Ultra's dark graphite body — a brightness
   threshold alone would key out half the phone. Keying on distance from
   pure white per-channel instead keeps any body color safe as long as the
   backdrop itself stays true white. */
function stripBackground(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas')
  off.width = img.naturalWidth
  off.height = img.naturalHeight
  const offCtx = off.getContext('2d', { willReadFrequently: true })
  if (!offCtx) return off
  offCtx.drawImage(img, 0, 0)
  const imageData = offCtx.getImageData(0, 0, off.width, off.height)
  const data = imageData.data
  const HARD_CUT = 10
  const SOFT_START = 45
  for (let i = 0; i < data.length; i += 4) {
    const maxDiff = Math.max(255 - data[i], 255 - data[i + 1], 255 - data[i + 2])
    if (maxDiff <= HARD_CUT) {
      data[i + 3] = 0
    } else if (maxDiff < SOFT_START) {
      const t = (maxDiff - HARD_CUT) / (SOFT_START - HARD_CUT)
      data[i + 3] = Math.round(data[i + 3] * t)
    }
  }
  offCtx.putImageData(imageData, 0, 0)
  return off
}

/* Reveal bands as fractions of the *camera phase's own* local progress
   (0–1) — remapped from overall scroll progress via CAMERA_PHASE_END below. */
const REVEAL_BANDS = {
  title: [0.08, 0.18],
  subtitle: [0.12, 0.22],
  connectors: [0.58, 0.68],
  specs: [0.6, 0.72],
  steps: [0.64, 0.76],
} as const

/* Top-to-bottom order (wide lens sits above the main lens on the module) —
   must stay in sync with LENS_TARGETS below: connector lines are drawn
   start-to-target by matching index, so a start row above another start row
   has to point at a target above the other target, or the two dashed lines
   cross each other. */
const SPECS_ROWS = [
  { label: 'רחבה במיוחד', value: '50MP' },
  { label: 'ראשית', value: '50MP' },
]

/* Lens target points in the 1672×941 design viewBox — measured from the
   frame actually on screen when the connectors reveal (~ezgif-frame-110,
   partway through the explode), not the assembled frame 0: by that point in
   the sequence the phone has shifted/resized within the canvas as parts
   separate, so targets measured off frame 0 land noticeably off the module. */
const LENS_TARGETS: [number, number][] = [
  [757, 184],
  [757, 280],
]

const CURVE_C1 = { x: 0.49, y: 0.09 }
const CURVE_C2 = { x: 0.79, y: 0.55 }

const STEPS_ROWS = [
  'פתיחת המצלמה והגדרת יחס צילום של 4:3',
  'פתחו את המכשיר וסובבו אותו למצב אנכי',
  'צילום תמונה ולחיצה על התוצאה',
]

/* Merged single-pin timeline — fractions of OVERALL scroll progress (0–1)
   across the whole wrapper. The camera choreography plays out first (0 →
   CAMERA_PHASE_END), then crossfades into Horizontal Lock (kept as its own
   step — Fold's camera story includes it, unlike Ultra's), holds, then
   crossfades into Photo Assist, then holds until the wrapper's scroll
   runway ends. */
const CAMERA_PHASE_END = 0.34
const CAMERA_EXIT_END = 0.46
const HLOCK_HOLD_END = 0.62
const HLOCK_EXIT_END = 0.74

/* Compact's own merged-pin handoff — same "one sticky screen, crossfade in
   place" technique as Design/Display's mobile sections, now carried all the
   way through the camera story instead of releasing into normal-flow cards:
   the camera video plays on its own (not scroll-scrubbed, see
   COMPACT_FRAME_END comment below) across 0 → COMPACT_FRAME_END, crossfades
   into the title/specs/steps content, hold, crossfade into Horizontal Lock,
   hold, crossfade into Photo Assist, hold until the wrapper's scroll runway
   ends and releases into normal flow (nothing follows below anymore — Photo
   Assist is the last card). Each *_ENTER constant is where the incoming
   layer reaches full opacity; the outgoing layer's exit band is implicitly
   [prev *_ENTER, this phase's own enter-start] — see the enterT/exitT pairs
   in the onUpdate below, same enterT*(1-exitT) shape CrossfadeStage uses for
   N-layer crossfades, just written out per named phase instead of a generic
   loop (matches this file's existing CAMERA_PHASE_END-style constants). */
// Was 0.32 of a 440vh wrapper (~141vh) back when this phase scrubbed through
// still frames one-by-one via scroll — needed that much runway to give each
// frame room to appear. Now that the visual is a real video playing on its
// own timeline, scroll only needs to hold it on screen briefly before
// handing off; shrunk to 0.14 of the now-350vh wrapper (~49vh) and every
// later phase's *_ENTER shifted down to keep the same hold durations
// (content/Horizontal Lock/Photo Assist pacing is unchanged, just packed
// into a shorter total scroll distance).
const COMPACT_FRAME_END = 0.14
const COMPACT_CONTENT_ENTER = 0.34
const COMPACT_CONTENT_EXIT_START = 0.5
const COMPACT_HLOCK_ENTER = 0.6
const COMPACT_HLOCK_EXIT_START = 0.8
const COMPACT_PHOTO_ENTER = 0.9

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const HORIZONTAL_LOCK_CARD = (
  <FeatureCard
    sectionName="מצלמה"
    title="Horizontal Lock"
    titleDir="ltr"
    tags={['Z Fold8 Ultra', 'Z Fold8', 'Z Flip8']}
    tagsLabel="זמין בדגמי:"
    desc="סרטונים יציבים וחלקים ללא רעידות, בזכות נעילה אופקית של Super Steady ליציבות מושלמת."
    note="לאחר צילום הסרטון, ניתן להשתמש במיסגור אוטומטי (Auto Framing) הממוקד באובייקט ולבחור את יחס התצוגה הרצוי לשמירה."
    examples={[
      'צילום וידאו חלק במהלך טיולים או רכיבה על אופניים בחוץ',
      'צילום סצנות דינמיות הכוללות סיבובים או היפוכים, תוך שמירה על קו אופקי מאוזן בכל מצב',
    ]}
    media={<video src={horizontalLockVideo} autoPlay loop muted playsInline />}
    tip="הדגימו סיבוב מהיר של המכשיר תוך כדי צילום — הלקוח יראה בעצמו שהתמונה נשארת ישרה."
  />
)

/* Compact (<860px) bespoke copies of Horizontal Lock / Photo Assist — same
   "own crossfading layer in the merged pin" treatment as the camera content
   layer above, tightened to mobile spacing like the Display section's
   Video Experience card. Unlike that card, these keep their video (a real
   asset already exists for both, unlike the Video Experience card which had
   none coming) — everything else around it is compacted to make room. */
function CompactTag({ label }: { label: string }) {
  return (
    <span dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 600, color: '#3a3a42', background: 'rgba(0,0,0,0.05)', borderRadius: 999, padding: '3px 10px' }}>
      {label}
    </span>
  )
}

function CompactTip({ text }: { text: string }) {
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

function CompactCardShell({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div dir="rtl" className="ultra-galaxyai-stack__inner" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 20, height: 2, background: 'var(--accent-color)' }} />
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-color)' }}>
          {eyebrow}
        </span>
      </div>
      {children}
    </div>
  )
}

const HLOCK_COMPACT_CARD = (
  <CompactCardShell eyebrow="מצלמה">
    <h3 dir="rtl" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(18px, 5vw, 22px)', lineHeight: 1.15, color: '#17171c', margin: 0 }}>
      Horizontal Lock
    </h3>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 600, color: 'rgba(23,23,28,0.55)' }}>זמין בדגמי:</span>
      {['Z Fold8 Ultra', 'Z Fold8', 'Z Flip8'].map((t) => <CompactTag key={t} label={t} />)}
    </div>
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
      <video src={horizontalLockVideo} autoPlay loop muted playsInline style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
    </div>
    <p style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: 'rgba(23,23,28,0.65)', margin: 0 }}>
      סרטונים יציבים וחלקים ללא רעידות, בזכות נעילה אופקית של Super Steady ליציבות מושלמת.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[
        'צילום וידאו חלק במהלך טיולים או רכיבה על אופניים בחוץ',
        'צילום סצנות דינמיות הכוללות סיבובים או היפוכים, תוך שמירה על קו אופקי מאוזן בכל מצב',
      ].map((ex) => (
        <div key={ex} style={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 400, lineHeight: 1.4, color: 'rgba(23,23,28,0.75)' }}>
          {ex}
        </div>
      ))}
    </div>
    <CompactTip text="הדגימו סיבוב מהיר של המכשיר תוך כדי צילום — הלקוח יראה בעצמו שהתמונה נשארת ישרה." />
  </CompactCardShell>
)

const PHOTO_ASSIST_COMPACT_CARD = (
  <CompactCardShell eyebrow="מצלמה">
    <h3 dir="rtl" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(18px, 5vw, 22px)', lineHeight: 1.15, color: '#17171c', margin: 0 }}>
      עריכת תמונות חכמה
    </h3>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-primary)', fontSize: 11, fontWeight: 600, color: 'rgba(23,23,28,0.55)' }}>זמין בדגמי:</span>
      {['Z Fold8 Ultra', 'Z Fold8', 'Z Flip8'].map((t) => <CompactTag key={t} label={t} />)}
    </div>
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
      <video src={galaxyAiVideo} autoPlay loop muted playsInline style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
    </div>
    <p style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: 'rgba(23,23,28,0.65)', margin: 0 }}>
      עריכת תמונות חכמה מתמיד: פשוט הקלידו את הבקשה שלכם וטכנולוגיית Photo Assist תבצע את העריכה עבורכם, למשל: "תלביש כובע על הכלב".
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[
        "היכנסו לגלריה, בחרו באייקון ה-Galaxy AI ולאחר מכן לחצו על 'יצירה'",
        'הקישו על סמל הוספת התמונה, ולאחר מכן בחרו מתוך הגלריה  את התמונה הרצויה.',
        "כיתבו בשורת הטקסט את מה שתרצו לשנות והקישו על כפתור היצירה.",
      ].map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 11, color: '#8b5cf6' }}>
            {i + 1}
          </span>
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: '#26262d' }}>{step}</span>
        </div>
      ))}
    </div>
    <CompactTip text="הדגימו ללקוח בקשת עריכה חופשית בשפה טבעית על תמונה משלו — התוצאה המיידית תמיד עושה רושם." />
  </CompactCardShell>
)

/* Camera-module exploded-parts frame sequence for Fold8, ported 1:1
   (mechanism, overlay language, timing feel) from Ultra's CameraFrameSection
   — scrubbed by scroll via GSAP ScrollTrigger, specs/steps overlay cascading
   in as the parts finish separating. Desktop continues the same pinned
   viewport straight into Horizontal Lock, then Photo Assist, both
   crossfading through in place — one continuous camera story, not three
   separate sections. Below the compact breakpoint the camera runs its own
   merged pin with the same crossfade-in-place handoff, just using bespoke
   compact card content instead of desktop's wide-layout ones. */
export default function FoldCameraFrameSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLCanvasElement | null)[]>(Array(TOTAL_FRAMES).fill(null))
  const [ready, setReady] = useState(false)
  // Explicitly pinned at 1180 (not the site-wide 768 default) — same reason
  // as Ultra's CameraFrameSection: the desktop overlay's negative right/left
  // offsets assume page margin only real desktop widths have.
  const isCompact = useIsCompact(1180)
  // This exploded-parts sequence is ~12MB of PNGs — deferring the preload
  // loop below until the section is actually near the viewport means a
  // visitor who never scrolls this far never downloads it.
  const [nearViewport, setNearViewport] = useState(false)

  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const connectorsRef = useRef<SVGSVGElement>(null)
  const specsRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([null, null])
  const pathRefs = useRef<(SVGPathElement | null)[]>([null, null])

  const cameraLayerRef = useRef<HTMLDivElement>(null)
  const hlockCardRef = useRef<HTMLDivElement>(null)
  const photoCardRef = useRef<HTMLDivElement>(null)
  const compactContentLayerRef = useRef<HTMLDivElement>(null)
  const compactHlockLayerRef = useRef<HTMLDivElement>(null)
  const compactPhotoLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || typeof IntersectionObserver === 'undefined') {
      setNearViewport(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!nearViewport) return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    // Desktop-only: the exploded-parts frame sequence, drawn to a canvas and
    // scrubbed by scroll. Compact no longer uses this at all — its camera
    // visual is a real playing <video> now (see COMPACT_FRAME_END comment) —
    // so none of this canvas/frame-loading work is needed there, and
    // skipping it means mobile visitors never download the ~12MB PNG
    // sequence in the first place.
    let updatePaths = () => {}
    let drawFrame = (_index: number) => {}
    if (!isCompact) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        drawFrame = (index: number) => {
          const frame = imagesRef.current[index]
          if (!frame) return
          if (canvas.width !== frame.width) {
            canvas.width = frame.width
            canvas.height = frame.height
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(frame, 0, 0)
        }

        const svg = connectorsRef.current
        updatePaths = () => {
          if (!svg) return
          const svgRect = svg.getBoundingClientRect()
          if (!svgRect.width || !svgRect.height) return
          rowRefs.current.forEach((row, i) => {
            const path = pathRefs.current[i]
            if (!row || !path) return
            const rowRect = row.getBoundingClientRect()
            const startX = ((rowRect.left - svgRect.left) / svgRect.width) * 1672
            const startY = ((rowRect.top + rowRect.height / 2 - svgRect.top) / svgRect.height) * 941
            const [ex, ey] = LENS_TARGETS[i]
            const c1x = startX + (ex - startX) * CURVE_C1.x
            const c1y = startY + (ey - startY) * CURVE_C1.y
            const c2x = startX + (ex - startX) * CURVE_C2.x
            const c2y = startY + (ey - startY) * CURVE_C2.y
            path.setAttribute('d', `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`)
          })
        }

        let firstFrameReady = false
        FRAME_URLS.forEach((url, i) => {
          const img = new Image()
          img.onload = () => {
            imagesRef.current[i] = stripBackground(img)
            if (i === 0 && !firstFrameReady) {
              firstFrameReady = true
              drawFrame(0)
              setReady(true)
              requestAnimationFrame(updatePaths)
            }
          }
          img.src = url
        })
      }
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const revealEls: [HTMLElement | SVGSVGElement | null, readonly [number, number]][] = [
      [titleRef.current, REVEAL_BANDS.title],
      [subtitleRef.current, REVEAL_BANDS.subtitle],
      [connectorsRef.current, REVEAL_BANDS.connectors],
      [specsRef.current, REVEAL_BANDS.specs],
      [stepsRef.current, REVEAL_BANDS.steps],
    ]

    const applyReveal = (progress: number) => {
      for (const [el, [start, end]] of revealEls) {
        if (!el) continue
        const t = clamp01((progress - start) / (end - start))
        ;(el as HTMLElement | SVGSVGElement).style.opacity = String(t)
        if (!(el instanceof SVGSVGElement)) {
          el.style.transform = `translateY(${(1 - t) * 16}px)`
        }
      }
    }

    updatePaths()
    window.addEventListener('resize', updatePaths)

    if (isCompact) {
      // Compact drops the overlay reveal choreography entirely (title/
      // specs/steps render as their own crossfading layer instead of
      // absolutely-positioned overlays synced to frame exposure) — this pin
      // holds on the camera video (playing on its own, not scroll-driven),
      // then a merged-pin handoff crossfades through content → Horizontal
      // Lock → Photo Assist, each fading + rising in over the previous layer
      // in the same spot. See the COMPACT_* phase constants above.
      const setLayer = (el: HTMLDivElement | null, opacity: number) => {
        if (!el) return
        el.style.opacity = String(opacity)
        el.style.transform = reduceMotion ? 'none' : `translateY(${(1 - opacity) * 20}px)`
      }

      const frameState = { p: 0 }
      const ctxGsap = gsap.context(() => {
        gsap.to(frameState, {
          p: 1,
          ease: 'none',
          immediateRender: false,
          onUpdate: () => {
            const overall = frameState.p

            const contentEnterT = clamp01((overall - COMPACT_FRAME_END) / (COMPACT_CONTENT_ENTER - COMPACT_FRAME_END))
            const contentExitT = clamp01((overall - COMPACT_CONTENT_EXIT_START) / (COMPACT_HLOCK_ENTER - COMPACT_CONTENT_EXIT_START))
            const hlockEnterT = contentExitT
            const hlockExitT = clamp01((overall - COMPACT_HLOCK_EXIT_START) / (COMPACT_PHOTO_ENTER - COMPACT_HLOCK_EXIT_START))
            const photoEnterT = hlockExitT

            if (cameraLayerRef.current) cameraLayerRef.current.style.opacity = String(1 - contentEnterT)
            setLayer(compactContentLayerRef.current, contentEnterT * (1 - contentExitT))
            setLayer(compactHlockLayerRef.current, hlockEnterT * (1 - hlockExitT))
            setLayer(compactPhotoLayerRef.current, photoEnterT)
          },
          scrollTrigger: {
            trigger: wrapper,
            start: 'top top',
            end: 'bottom bottom',
            scrub: reduceMotion ? true : 0.4,
          },
        })
      }, wrapper)

      return () => {
        window.removeEventListener('resize', updatePaths)
        ctxGsap.revert()
      }
    }

    // Desktop: one continuous pin — camera choreography, then a crossfade
    // handoff into Horizontal Lock, then Photo Assist.
    const frameState = { p: 0 }
    const ctxGsap = gsap.context(() => {
      gsap.to(frameState, {
        p: 1,
        ease: 'none',
        immediateRender: false,
        onUpdate: () => {
          const overall = frameState.p
          const cameraLocal = clamp01(overall / CAMERA_PHASE_END)
          drawFrame(Math.round(cameraLocal * (TOTAL_FRAMES - 1)))
          if (!reduceMotion) applyReveal(cameraLocal)
          updatePaths()

          const cameraExitT = clamp01((overall - CAMERA_PHASE_END) / (CAMERA_EXIT_END - CAMERA_PHASE_END))
          if (cameraLayerRef.current) {
            cameraLayerRef.current.style.opacity = String(1 - cameraExitT)
          }

          const hlockExitT = clamp01((overall - HLOCK_HOLD_END) / (HLOCK_EXIT_END - HLOCK_HOLD_END))
          if (hlockCardRef.current) {
            const x = reduceMotion ? 0 : (1 - cameraExitT) * 100 + -hlockExitT * 40
            hlockCardRef.current.style.transform = `translateX(${x}%)`
            hlockCardRef.current.style.opacity = String(cameraExitT * (1 - hlockExitT))
          }

          if (photoCardRef.current) {
            const x = reduceMotion ? 0 : (1 - hlockExitT) * 100
            photoCardRef.current.style.transform = `translateX(${x}%)`
            photoCardRef.current.style.opacity = String(hlockExitT)
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

    return () => {
      window.removeEventListener('resize', updatePaths)
      ctxGsap.revert()
    }
  }, [isCompact, nearViewport])

  const cameraVisual = (
    <div style={{ position: 'relative', maxHeight: '70vh', maxWidth: '76vw' }}>
      <canvas
        ref={canvasRef}
        style={{
          maxHeight: '70vh',
          maxWidth: '76vw',
          width: 'auto',
          height: 'auto',
          display: 'block',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      <div dir="rtl" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '24.4%',
            zIndex: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Title */}
        <div
          ref={titleRef}
          style={{
            position: 'absolute',
            top: '-5.2%',
            /* Desktop hangs this to the right of the visual, inside the
               generous margin a 1920-wide stage has around a centered
               phone. On a phone-width viewport there's no such margin (the
               visual itself is already ~76vw), so compact keeps it flush
               inside the visual's own width instead — it still reads fine
               there since it sits in the white top-gradient scrim already
               built into the visual for exactly this kind of overlay. */
            right: isCompact ? '0%' : '-27.2%',
            width: isCompact ? '94%' : '68%',
            textAlign: 'right',
            fontFamily: 'var(--font-primary)',
            fontSize: 'clamp(16px, 2.3vw, 40px)',
            fontWeight: 800,
            color: '#141414',
            lineHeight: 1.25,
            opacity: 0,
            zIndex: 1,
          }}
        >
          מערכת צילום כפולה ברזולוציה גבוהה
        </div>

        {/* Subtitle bubble */}
        <div
          ref={subtitleRef}
          style={{
            position: 'absolute',
            top: '2.6%',
            right: isCompact ? '0%' : '-27.2%',
            maxWidth: isCompact ? '78%' : '54%',
            padding: 'clamp(8px,1vw,16px) clamp(12px,1.6vw,26px)',
            borderRadius: '16px',
            background: 'linear-gradient(90deg, #ece9f3 0%, #dcd6e9 100%)',
            boxShadow: '0 6px 18px rgba(57,49,93,0.18)',
            textAlign: 'right',
            fontFamily: 'var(--font-primary)',
            fontSize: 'clamp(11px, 1.1vw, 19px)',
            fontWeight: 600,
            color: 'rgb(57, 49, 93)',
            lineHeight: 1.5,
            opacity: 0,
            zIndex: 1,
          }}
        >
          פרטים חדים ומציאותיים בכל תמונה, בניגודיות עשירה ובולטת
        </div>

        {/* Connector lines */}
        <svg
          ref={connectorsRef}
          viewBox="0 0 1672 941"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1 }}
        >
          {LENS_TARGETS.map((_, i) => (
            <path
              key={i}
              ref={(el) => { pathRefs.current[i] = el }}
              stroke="rgb(57, 49, 93)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5 5"
              opacity="0.85"
            />
          ))}
          {LENS_TARGETS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill="rgb(57, 49, 93)" />
          ))}
        </svg>

        {/* Camera specs card */}
        <div
          ref={specsRef}
          style={{
            position: 'absolute',
            top: '38.8%',
            right: isCompact ? '0%' : '-28.3%',
            width: isCompact ? 'clamp(150px, 46vw, 195px)' : 'clamp(195px, 25vw, 430px)',
            borderRadius: '22px',
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 12px 30px rgba(60,30,70,0.16)',
            padding: 'clamp(10px,1.2vw,16px) clamp(12px,1.4vw,18px)',
            opacity: 0,
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'clamp(14px, 1.3vw, 22px)',
              fontWeight: 700,
              color: '#171717',
              textAlign: 'right',
              marginBottom: '8px',
            }}
          >
            מצלמות אחוריות
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SPECS_ROWS.map((row, i) => (
              <div key={row.label}>
                {i > 0 && <div style={{ height: '1px', background: 'rgba(57,49,93,0.18)', margin: '6px 0' }} />}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: 'clamp(11px,1vw,18px)', fontWeight: 600, color: 'var(--ultra-purple)' }}>
                    {row.label}
                  </div>
                  <div
                    ref={(el) => { rowRefs.current[i] = el }}
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-primary)',
                      fontSize: 'clamp(15px,1.6vw,26px)',
                      fontWeight: 800,
                      color: 'rgb(57, 49, 93)',
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps card */}
        <div
          ref={stepsRef}
          style={{
            position: 'absolute',
            left: isCompact ? '0%' : '-17.5%',
            bottom: '-4.2%',
            width: isCompact ? 'clamp(160px, 50vw, 200px)' : 'clamp(200px, 24vw, 400px)',
            borderRadius: '22px',
            background: 'linear-gradient(160deg, rgba(255,250,248,0.85) 0%, rgba(238,222,238,0.85) 100%)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 12px 30px rgba(60,30,70,0.16)',
            padding: 'clamp(14px,1.8vw,24px) clamp(14px,1.8vw,26px)',
            opacity: 0,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, var(--ultra-purple), rgb(57, 49, 93))',
              color: '#fff',
              fontFamily: 'var(--font-primary)',
              fontSize: 'clamp(11px,1vw,16px)',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            שלבי ההדגמה במכשיר
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {STEPS_ROWS.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'right' }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgb(57, 49, 93)',
                    color: '#fff',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: 'clamp(11px,1vw,16px)',
                    fontWeight: 500,
                    color: '#2a1530',
                    lineHeight: 1.5,
                  }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (isCompact) {
    return (
      <>
        {/* Camera video (plays on its own, not scroll-scrubbed — see the
           COMPACT_FRAME_END comment), then a merged-pin handoff through
           content → Horizontal Lock → Photo Assist — each one fades + rises
           in over the previous layer, all in the same sticky screen, no
           separate scrolled-into-view cards afterward. The overlay title/
           subtitle/connector-lines/floating specs and steps cards only make
           sense with the wide surrounding margin a 1920px desktop stage has
           around a small centered phone — on a phone-width viewport they
           collided with each other and with the image itself, so compact
           drops that overlay language entirely and re-renders the same copy
           as a plain stacked content layer instead (see the COMPACT_* phase
           constants above). */}
        <div ref={wrapperRef} id="cameras" style={{ height: '350vh', position: 'relative', background: '#fff' }}>
          <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', background: '#fff' }}>
            <div
              ref={cameraLayerRef}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '96px',
                paddingBottom: '24px',
                boxSizing: 'border-box',
              }}
            >
              <video
                src={cameraCompactVideo}
                autoPlay
                muted
                playsInline
                style={{
                  maxHeight: '70vh',
                  maxWidth: '88vw',
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 18,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.14)',
                }}
              />
            </div>

            <div
              ref={compactContentLayerRef}
              dir="rtl"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '20px',
                textAlign: 'center',
                padding: '128px 20px 24px',
                boxSizing: 'border-box',
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px', textAlign: 'right' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 800,
                    fontSize: 'clamp(24px, 7vw, 32px)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                    color: '#141414',
                    margin: 0,
                  }}
                >
                  מערכת צילום כפולה ברזולוציה גבוהה
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: 1.6,
                    color: 'rgba(0,0,0,0.6)',
                    margin: 0,
                  }}
                >
                  פרטים חדים ומציאותיים בכל תמונה, בניגודיות עשירה ובולטת
                </p>
              </div>

              {/* Camera specs card */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  textAlign: 'right',
                  borderRadius: '22px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 12px 30px rgba(60,30,70,0.1)',
                  padding: '20px 22px',
                }}
              >
                <div style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', fontWeight: 700, color: '#171717', marginBottom: '12px' }}>
                  מצלמות אחוריות
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {SPECS_ROWS.map((row, i) => (
                    <div key={row.label}>
                      {i > 0 && <div style={{ height: '1px', background: 'rgba(57,49,93,0.14)', margin: '10px 0' }} />}
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--ultra-purple)' }}>
                        {row.label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '22px', fontWeight: 800, color: 'rgb(57, 49, 93)' }}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps card */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  textAlign: 'right',
                  borderRadius: '22px',
                  background: 'linear-gradient(160deg, rgba(255,250,248,0.9) 0%, rgba(238,222,238,0.9) 100%)',
                  boxShadow: '0 12px 30px rgba(60,30,70,0.1)',
                  padding: '20px 22px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, var(--ultra-purple), rgb(57, 49, 93))',
                    color: '#fff',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '14px',
                  }}
                >
                  שלבי ההדגמה במכשיר
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {STEPS_ROWS.map((step, i) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div
                        style={{
                          flexShrink: 0,
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgb(57, 49, 93)',
                          color: '#fff',
                          fontFamily: 'var(--font-primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '14px', fontWeight: 500, color: '#2a1530', lineHeight: 1.5 }}>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              ref={compactHlockLayerRef}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box',
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              {HLOCK_COMPACT_CARD}
            </div>

            <div
              ref={compactPhotoLayerRef}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box',
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              {PHOTO_ASSIST_COMPACT_CARD}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div ref={wrapperRef} id="cameras" style={{ height: '640vh', position: 'relative', background: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', background: '#fff' }}>
        <div
          ref={cameraLayerRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '96px',
            paddingBottom: '24px',
            boxSizing: 'border-box',
            zIndex: 1,
          }}
        >
          {cameraVisual}
        </div>

        <div
          ref={hlockCardRef}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, opacity: 0 }}
        >
          {HORIZONTAL_LOCK_CARD}
        </div>

        <div
          ref={photoCardRef}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, opacity: 0 }}
        >
          <GalaxyAiDesktopCard data={PHOTO_ASSIST_DATA} sectionName="מצלמה" />
        </div>
      </div>
    </div>
  )
}
