import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GalaxyAiDesktopCard, GalaxyAiMobileCard, FOLLOWCAM_DATA, PHOTO_ASSIST_DATA } from './GalaxyAiStackSection'
import { useIsCompact } from './SectionKit'

gsap.registerPlugin(ScrollTrigger)

/* Load all frames as URLs — Vite bundles and hashes them */
const frameModules = import.meta.glob<string>('../assets/Ultra/camara-frames/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
})

/* Sort numerically by filename (ezgif-frame-015.png … ezgif-frame-150.png) */
const FRAME_URLS: string[] = Object.entries(frameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url)

const TOTAL_FRAMES = FRAME_URLS.length

/* The frame photos are studio renders on a near-white backdrop (with soft
   drop shadows) — keyed out here once per frame (at load time, not per
   scroll tick) so the phone/parts float on transparency instead of that
   backdrop showing through the blurred glass cards. */
function stripBackground(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas')
  off.width = img.naturalWidth
  off.height = img.naturalHeight
  const offCtx = off.getContext('2d', { willReadFrequently: true })
  if (!offCtx) return off
  offCtx.drawImage(img, 0, 0)
  const imageData = offCtx.getImageData(0, 0, off.width, off.height)
  const data = imageData.data
  // Measured empirically across frames: the object cluster (dark purple
  // body, black/metal parts) drops off well below 150 in every frame, while
  // the studio backdrop — even with its vignette darkening the corners —
  // never dips below ~190. There's a clean, near-empty valley in between.
  const HARD_CUT = 192
  const SOFT_START = 150
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness >= HARD_CUT) {
      data[i + 3] = 0
    } else if (brightness > SOFT_START) {
      const t = (brightness - SOFT_START) / (HARD_CUT - SOFT_START)
      data[i + 3] = Math.round(data[i + 3] * (1 - t))
    }
  }
  offCtx.putImageData(imageData, 0, 0)
  return off
}

/* Reveal bands as fractions of the *camera phase's own* local progress
   (0–1) — remapped from overall scroll progress via CAMERA_PHASE_END below,
   so the exploded-parts choreography keeps the exact timing/feel it always
   had, just compressed into its slice of the larger merged timeline. */
const REVEAL_BANDS = {
  title: [0.08, 0.18],
  subtitle: [0.12, 0.22],
  connectors: [0.58, 0.68],
  specs: [0.6, 0.72],
  steps: [0.64, 0.76],
} as const

const SPECS_ROWS = [
  { label: 'רחבה במיוחד', value: '50MP' },
  { label: 'ראשית', value: '200MP' },
  { label: 'טלפוטו (X3)', value: '10MP' },
]

/* Lens target points in the 1672×941 design viewBox — one per spec row, in
   the same order. Approximate/decorative: the exploded frame sequence moves
   the lenses over time, so these just point at the general camera-module
   area rather than tracking a specific frame precisely. */
const LENS_TARGETS: [number, number][] = [
  [812, 278],
  [822, 328],
  [836, 380],
]

/* Bezier control-point ratios lifted from the design handoff's three paths
   (averaged) so regenerated curves keep the same "swoosh" shape regardless
   of where the row actually starts. */
const CURVE_C1 = { x: 0.49, y: 0.09 }
const CURVE_C2 = { x: 0.79, y: 0.55 }

const STEPS_ROWS = [
  'פתיחת המצלמה',
  'הקשה על מצב 0.6x, ואז בחירה באייקון הרזולוציה ומעבר ל-50MP',
  'הקשה על סמל הרזולוציה ובחירת 200MP',
]

/* Merged single-pin timeline — fractions of OVERALL scroll progress (0–1)
   across the whole wrapper. The camera choreography plays out in its own
   slice (0 → CAMERA_PHASE_END), then the camera visual (frame + all
   overlay text) fades out as a single unit while the Photo Assist card
   slides in from the right — a crossfade, not a hard cut — then holds,
   crossfades to Follow Cam, then holds until the wrapper's scroll runway
   ends and the sticky viewport releases into the next section. */
const CAMERA_PHASE_END = 0.46
const CAMERA_EXIT_END = 0.6
const PHOTO_HOLD_END = 0.75
const FOLLOWCAM_ENTER_END = 0.9

/* Compact's own merged-pin handoff — same "one sticky screen, crossfade in
   place" technique as Fold's camera section: frames scrub across
   0 → COMPACT_FRAME_END, then the compact content layer (title/subtitle,
   which stay fixed on screen the whole time) fades in. Below that fixed
   headline, one reserved card slot holds the "מצלמות אחוריות" specs card and
   the "שלבי ההדגמה" steps card stacked in the same spot, crossfading between
   them (COMPACT_SPECS_EXIT_START → COMPACT_STEPS_ENTER) instead of swapping
   full screens — reads as one continuous page with updating content rather
   than a flip between two screens, and only ever shows one card's worth of
   height at a time (the two used to share a screen and together ran taller
   than 100dvh, getting silently clipped by the pin's overflow:hidden).
   The whole content layer then fades out (COMPACT_STEPS_EXIT_START →
   COMPACT_CARD1_ENTER) as Follow Cam crossfades in (shown before Photo
   Assist here — order swapped from the desktop, per request), then Photo
   Assist, before releasing into normal flow.

   Each of those two cards is itself a GalaxyAiMobileCard: video + title/
   subtitle/tags/desc stay fixed once the card has risen in, and — same
   reserved-slot idea as the specs/steps card above, but a physical cover
   instead of a crossfade — an opaque "examples + tip" sheet rises up from
   below (COMPACT_CARDn_STEPS_EXIT_START → COMPACT_CARDn_EXAMPLES_ENTER) to
   sit on top of and hide the device-demo steps, while a scrim dims
   everything behind it except the video, so it reads as the same screen the
   whole time rather than a screen change. */
const COMPACT_FRAME_END = 0.188
const COMPACT_SPECS_ENTER = 0.283
const COMPACT_SPECS_EXIT_START = 0.368
const COMPACT_STEPS_ENTER = 0.412
const COMPACT_STEPS_EXIT_START = 0.5
const COMPACT_CARD1_ENTER = 0.548
const COMPACT_CARD1_STEPS_EXIT_START = 0.621
const COMPACT_CARD1_EXAMPLES_ENTER = 0.67
const COMPACT_CARD1_EXIT_START = 0.75
const COMPACT_CARD2_ENTER = 0.797
const COMPACT_CARD2_STEPS_EXIT_START = 0.871
const COMPACT_CARD2_EXAMPLES_ENTER = 0.92

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/* Camera-module exploded-parts frame sequence, scrubbed directly by scroll
   progress via a real GSAP ScrollTrigger (frame count tweened 0 → last,
   scrubbed to scroll position), with a Samsung-style specs/steps overlay
   cascading in on top as the parts finish separating. On desktop this same
   single pinned viewport continues straight on: the camera visual fades out
   while the Photo Assist and Follow Cam cards crossfade through it one
   after another, reinforcing that they belong to this same camera story
   instead of feeling like a separate section. Below the compact breakpoint
   the camera keeps its own (always-on) pinned scrub as before, and the two
   Galaxy AI cards fall back to stacked normal flow beneath it. */
export default function CameraFrameSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLCanvasElement | null)[]>(Array(TOTAL_FRAMES).fill(null))
  const [ready, setReady] = useState(false)
  const isCompact = useIsCompact(860)
  // This exploded-parts sequence is ~47MB of PNGs — deferring the preload
  // loop below until the section is actually near the viewport means a
  // visitor who never scrolls this far never downloads it.
  const [nearViewport, setNearViewport] = useState(false)

  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const connectorsRef = useRef<SVGSVGElement>(null)
  const specsRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const pathRefs = useRef<(SVGPathElement | null)[]>([null, null, null])

  const cameraLayerRef = useRef<HTMLDivElement>(null)
  // Follow Cam enters first, Photo Assist second — same order as the
  // compact/mobile branch below (named generically since either card can
  // occupy either slot).
  const firstCardRef = useRef<HTMLDivElement>(null)
  const secondCardRef = useRef<HTMLDivElement>(null)
  const compactContentLayerRef = useRef<HTMLDivElement>(null)
  const compactSpecsCardRef = useRef<HTMLDivElement>(null)
  const compactStepsCardRef = useRef<HTMLDivElement>(null)
  // Card 1 = Follow Cam, Card 2 = Photo Assist (order swapped from desktop,
  // per request). Each card gets its own scrim + rising "examples" sheet ref
  // on top of the whole-card layer ref, driving the internal cover-reveal.
  const compactCard1LayerRef = useRef<HTMLDivElement>(null)
  const compactCard1ScrimRef = useRef<HTMLDivElement>(null)
  const compactCard1SheetRef = useRef<HTMLDivElement>(null)
  const compactCard2LayerRef = useRef<HTMLDivElement>(null)
  const compactCard2ScrimRef = useRef<HTMLDivElement>(null)
  const compactCard2SheetRef = useRef<HTMLDivElement>(null)

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
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawFrame = (index: number) => {
      const frame = imagesRef.current[index]
      if (!frame) return
      if (canvas.width !== frame.width) {
        canvas.width = frame.width
        canvas.height = frame.height
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(frame, 0, 0)
    }

    // Redraw the connector lines from each spec row's actual position to its
    // lens target — the rows are laid out responsively (%/clamp), so the
    // fixed design-handoff coordinates alone can't be trusted to start at
    // the right place; measure the real DOM each time instead.
    const svg = connectorsRef.current
    const updatePaths = () => {
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

    // Pre-load all frames; draw frame 0 as soon as it's ready. The canvas
    // (and therefore the whole percentage-based layout below it) only takes
    // on its real size once this first frame arrives, so the connector
    // lines need re-measuring right here too — not just on scroll/resize.
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
      // Merged-pin handoff: frame-scrub, then compact content, then Photo
      // Assist, then Follow Cam — all crossfading in place in the same
      // sticky screen. The desktop overlay's title/subtitle/connectors/
      // specs/steps never reveal here (applyReveal is never called), since
      // their percentage positions only work with a wide desktop margin.
      const setLayer = (el: HTMLDivElement | null, opacity: number) => {
        if (!el) return
        el.style.opacity = String(opacity)
        el.style.transform = reduceMotion ? 'none' : `translateY(${(1 - opacity) * 20}px)`
        el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
      }
      // Plain opacity crossfade for the two cards sharing one reserved slot
      // inside the (already-risen) fixed content layer — no translateY here,
      // that rise is only for the layer's own one-time entrance/exit above.
      const setCard = (el: HTMLDivElement | null, opacity: number) => {
        if (!el) return
        el.style.opacity = String(opacity)
        el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
      }
      // Physical cover-reveal for a GalaxyAiMobileCard's examples sheet: it
      // rises from fully below (100% of its own height, needs no pixel math)
      // to flush-covering the steps above it, opacity fading in alongside;
      // the scrim behind it (over the fixed header, never the video) dims to
      // at most 0.6 in step with the same t so the two read as one motion.
      const setSheet = (sheetEl: HTMLDivElement | null, scrimEl: HTMLDivElement | null, t: number) => {
        if (sheetEl) {
          sheetEl.style.opacity = String(t)
          sheetEl.style.transform = reduceMotion ? 'none' : `translateY(${(1 - t) * 100}%)`
          sheetEl.style.pointerEvents = t > 0.5 ? 'auto' : 'none'
        }
        if (scrimEl) scrimEl.style.opacity = String(t * 0.6)
      }

      const frameState = { p: 0 }
      const ctxGsap = gsap.context(() => {
        gsap.to(frameState, {
          p: 1,
          ease: 'none',
          immediateRender: false,
          onUpdate: () => {
            const overall = frameState.p
            const frameLocal = clamp01(overall / COMPACT_FRAME_END)
            drawFrame(Math.round(frameLocal * (TOTAL_FRAMES - 1)))

            const contentEnterT = clamp01((overall - COMPACT_FRAME_END) / (COMPACT_SPECS_ENTER - COMPACT_FRAME_END))
            const cardCrossfadeT = clamp01((overall - COMPACT_SPECS_EXIT_START) / (COMPACT_STEPS_ENTER - COMPACT_SPECS_EXIT_START))
            const cameraStepsExitT = clamp01((overall - COMPACT_STEPS_EXIT_START) / (COMPACT_CARD1_ENTER - COMPACT_STEPS_EXIT_START))
            const card1EnterT = cameraStepsExitT
            const card1SheetT = clamp01((overall - COMPACT_CARD1_STEPS_EXIT_START) / (COMPACT_CARD1_EXAMPLES_ENTER - COMPACT_CARD1_STEPS_EXIT_START))
            const card1ExitT = clamp01((overall - COMPACT_CARD1_EXIT_START) / (COMPACT_CARD2_ENTER - COMPACT_CARD1_EXIT_START))
            const card2EnterT = card1ExitT
            const card2SheetT = clamp01((overall - COMPACT_CARD2_STEPS_EXIT_START) / (COMPACT_CARD2_EXAMPLES_ENTER - COMPACT_CARD2_STEPS_EXIT_START))

            if (cameraLayerRef.current) cameraLayerRef.current.style.opacity = String(1 - contentEnterT)
            setLayer(compactContentLayerRef.current, contentEnterT * (1 - cameraStepsExitT))
            setCard(compactSpecsCardRef.current, 1 - cardCrossfadeT)
            setCard(compactStepsCardRef.current, cardCrossfadeT)

            setLayer(compactCard1LayerRef.current, card1EnterT * (1 - card1ExitT))
            setSheet(compactCard1SheetRef.current, compactCard1ScrimRef.current, card1SheetT)
            setLayer(compactCard2LayerRef.current, card2EnterT)
            setSheet(compactCard2SheetRef.current, compactCard2ScrimRef.current, card2SheetT)
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

    // Desktop: one continuous pin driving the camera choreography, then a
    // crossfade handoff into Follow Cam, then Photo Assist.
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

          const firstExitT = clamp01((overall - PHOTO_HOLD_END) / (FOLLOWCAM_ENTER_END - PHOTO_HOLD_END))
          if (firstCardRef.current) {
            const x = reduceMotion ? 0 : (1 - cameraExitT) * 100 + -firstExitT * 40
            firstCardRef.current.style.transform = `translateX(${x}%)`
            firstCardRef.current.style.opacity = String(cameraExitT * (1 - firstExitT))
          }

          if (secondCardRef.current) {
            const x = reduceMotion ? 0 : (1 - firstExitT) * 100
            secondCardRef.current.style.transform = `translateX(${x}%)`
            secondCardRef.current.style.opacity = String(firstExitT)
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

      {/* Overlay — positions ported as percentages of the 1672×941 design
          canvas so they track the image box regardless of its rendered size. */}
      <div dir="rtl" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* top legibility scrim */}
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
            right: '-27.2%',
            width: '68%',
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
          מערך צילום עוצמתי ברזולוציית שיא
        </div>

        {/* Subtitle bubble */}
        <div
          ref={subtitleRef}
          style={{
            position: 'absolute',
            top: '2.6%',
            right: '-27.2%',
            maxWidth: '54%',
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
          תמונות חדות, בהירות ומלאות בפרטים, גם כשתנאי התאורה קשים במיוחד
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
          <circle cx="812" cy="278" r="6" fill="rgb(57, 49, 93)" />
          <circle cx="822" cy="328" r="6" fill="rgb(57, 49, 93)" />
          <circle cx="836" cy="380" r="6" fill="rgb(57, 49, 93)" />
        </svg>

        {/* Camera specs card */}
        <div
          ref={specsRef}
          style={{
            position: 'absolute',
            top: '38.8%',
            right: '-28.3%',
            width: 'clamp(195px, 25vw, 430px)',
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
            left: '-17.5%',
            bottom: '-4.2%',
            width: 'clamp(200px, 24vw, 400px)',
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
      <div ref={wrapperRef} id="cameras" style={{ height: '815vh', position: 'relative', background: '#fff' }}>
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
            {cameraVisual}
          </div>

          {/* Fixed content layer — headline never moves once it's risen in;
              the specs card and steps card below it share one reserved slot
              and crossfade in place (see COMPACT_* comment above for why:
              this replaces an earlier two-full-screen version). */}
          <div
            ref={compactContentLayerRef}
            dir="rtl"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              textAlign: 'center',
              padding: '20px',
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
                מערך צילום עוצמתי ברזולוציית שיא
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
                תמונות חדות, בהירות ומלאות בפרטים, גם כשתנאי התאורה קשים במיוחד
              </p>
            </div>

            {/* Reserved card slot — specs and steps cards stack absolutely
                in the same box (sized to the taller of the two, the specs
                card) so the crossfade swaps content without ever reflowing
                the fixed headline above it. */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '320px' }}>
              {/* Camera specs card */}
              <div
                ref={compactSpecsCardRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  textAlign: 'right',
                  borderRadius: '22px',
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 12px 30px rgba(60,30,70,0.1)',
                  padding: '20px 22px',
                  boxSizing: 'border-box',
                  opacity: 1,
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
                ref={compactStepsCardRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  textAlign: 'right',
                  borderRadius: '22px',
                  background: 'linear-gradient(160deg, rgba(255,250,248,0.9) 0%, rgba(238,222,238,0.9) 100%)',
                  boxShadow: '0 12px 30px rgba(60,30,70,0.1)',
                  padding: '20px 22px',
                  boxSizing: 'border-box',
                  opacity: 0,
                  pointerEvents: 'none',
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
          </div>

          {/* Card 1 — Follow Cam, shown first (order swapped from desktop). */}
          <div
            ref={compactCard1LayerRef}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', opacity: 0, pointerEvents: 'none' }}
          >
            <GalaxyAiMobileCard data={FOLLOWCAM_DATA} scrimRef={compactCard1ScrimRef} sheetRef={compactCard1SheetRef} />
          </div>

          {/* Card 2 — Photo Assist. */}
          <div
            ref={compactCard2LayerRef}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', opacity: 0, pointerEvents: 'none' }}
          >
            <GalaxyAiMobileCard data={PHOTO_ASSIST_DATA} scrimRef={compactCard2ScrimRef} sheetRef={compactCard2SheetRef} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} id="cameras" style={{ height: '600vh', position: 'relative', background: '#fff' }}>
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
          ref={firstCardRef}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, opacity: 0 }}
        >
          <GalaxyAiDesktopCard data={FOLLOWCAM_DATA} />
        </div>

        <div
          ref={secondCardRef}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, opacity: 0 }}
        >
          <GalaxyAiDesktopCard data={PHOTO_ASSIST_DATA} />
        </div>

        
      </div>
    </div>
  )
}
