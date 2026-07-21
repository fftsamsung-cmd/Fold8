import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Image as ImageIcon, Video } from 'lucide-react'
import { SwipeStack } from './ui/swipe-stack'
import { CountUpSpan } from './CountUpSpan'
import SalesTip from './SalesTip'

gsap.registerPlugin(ScrollTrigger)

/* ---------- Shared page-section kit — built for Fold8, reused as-is by
   Flip8 (and any future device page). Everything here reuses the exact
   same global classes Ultra's design system is built from (ultra__*,
   ultra-*, followcam__*, all unscoped in UltraPage.css), so the visual
   language stays identical across every device page — each page just needs
   to give its own wrapper class (.fold, .flip, ...) the same
   custom-property contract .ultra has (--ultra-ink, --ultra-line,
   --ultra-mono, --samsung-blue, etc.) with its own --accent-color. */

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 44,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true },
      })
    })
    return () => ctx.revert()
  }, [])
  return ref
}

export function Section({
  id,
  ariaLabel,
  children,
}: {
  id?: string
  ariaLabel: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>()
  return (
    <section id={id} ref={ref} aria-label={ariaLabel} className="ultra__section">
      {children}
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="ultra__eyebrow">{children}</div>
}

export function Attrs({ items, margin = '20px 0' }: { items: string[]; margin?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin }}>
      {items.map((attr) => (
        <div key={attr} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ color: 'var(--samsung-blue)', flexShrink: 0 }}>—</span>
          <span style={{ fontSize: 'clamp(15px, 1.6vw, 17px)', color: '#2b2b2b' }}>{attr}</span>
        </div>
      ))}
    </div>
  )
}

/* Two labeled compare panes, draggable via the same swipe-card physics used
   throughout the site — for whenever there's no compare photography yet
   for either side, so the physics drive the existing label panes instead
   (identical to Ultra's own DeviceMock). */
export function DeviceMock({ left, right }: { left: string; right: string }) {
  return (
    <div className="ultra-mock-wrap" aria-hidden="true">
      <SwipeStack
        cardWidth={320}
        cardHeight={266}
        className="ultra-mock-swipe"
        cards={[
          <div className="ultra-mock">
            <div className="ultra-mock__pane"><span className="ultra-mock__tag">{left}</span></div>
            <div className="ultra-mock__seam" />
            <div className="ultra-mock__pane"><span className="ultra-mock__tag">{right}</span></div>
          </div>,
          <div className="ultra-mock ultra-mock--flip">
            <div className="ultra-mock__pane"><span className="ultra-mock__tag">{right}</span></div>
            <div className="ultra-mock__seam" />
            <div className="ultra-mock__pane"><span className="ultra-mock__tag">{left}</span></div>
          </div>,
        ]}
      />
    </div>
  )
}

/* Reserves the exact spot a still image or clip will occupy once supplied. */
export function MediaPlaceholder({ label, kind = 'video', ratio = '16 / 9' }: { label: string; kind?: 'image' | 'video'; ratio?: string }) {
  const Icon = kind === 'video' ? Video : ImageIcon
  return (
    <div className="fold-media-slot" style={{ aspectRatio: ratio }} aria-hidden="true">
      <Icon size={26} strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  )
}

/* Main-layer content wrapper — bounds width/height so it fits comfortably
   inside a CrossfadeStage's pinned 100vh viewport, with the same
   overflow-safety the card layers get from .ultra-galaxyai-stack__inner. */
export function MainLayer({
  children,
  mobileCard,
  pinned,
}: {
  children: ReactNode
  /** Opt-in white-card shell (background/radius/shadow/padding) that only
   * activates at the mobile/tablet breakpoint — see .ultra-mobile-card-shell
   * (UltraPage.css, shared by every page). Undefined leaves callers that
   * don't pass it pixel-identical. */
  mobileCard?: boolean
  /** Opt-in overflow safety (max-height + internal scroll, mobile/tablet
   * only) — see .ultra-mobile-pinned-safe. Needed when this layer sits
   * inside a CrossfadeStage that's pinned at every width
   * (compactBreakpoint={0}): unlike the row layout desktop gets, mobile's
   * stacked column can run taller than the pinned 100vh viewport, which
   * would otherwise clip content with no way to reach it. */
  pinned?: boolean
}) {
  const className = [mobileCard && 'ultra-mobile-card-shell', pinned && 'ultra-mobile-pinned-safe'].filter(Boolean).join(' ') || undefined
  return (
    <div className={className} style={{ maxWidth: 1180, width: '100%' }}>
      {children}
    </div>
  )
}

/* ---------- Crossfade stage — the real "main section that crossfades into
   its cards" mechanism, same as Ultra's DesignSection (2 layers) and
   CameraFrameSection (3 layers): one pinned viewport, one continuous scroll
   range, each layer fading/sliding in from the right as the previous one
   fades out. Generalized to N layers with evenly-spaced transition bands
   (Ultra hand-tunes its bands per section since they're built around a
   scrubbed frame sequence; nothing here needs that, so even spacing reads
   identically without the extra bookkeeping). Falls back to a plain stacked
   layout — same as Ultra's own compact/reduced-motion fallbacks — below the
   860px breakpoint and when the OS asks for reduced motion. */
export function CrossfadeStage({
  id,
  ariaLabel,
  wrapperHeight = '480vh',
  background = '#fff',
  layers,
  /** Below this width the pinned scroll-jack crossfade falls back to a
   * plain stacked layout (same fallback used for prefers-reduced-motion).
   * Default 860 matches the rest of the site's tablet/mobile breakpoint.
   * Pass 0 to disable the fallback entirely and keep the pinned animation
   * at every width — the caller is then responsible for making sure every
   * layer fits a 100vh viewport (or has its own internal scroll, e.g.
   * MainLayer's `pinned` prop / FeatureCard's `pinned` prop). */
  compactBreakpoint = 860,
}: {
  id: string
  ariaLabel: string
  wrapperHeight?: string
  background?: string
  layers: ReactNode[]
  compactBreakpoint?: number
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < compactBreakpoint)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const onResize = () => setIsCompact(window.innerWidth < compactBreakpoint)
    onResize()
    // Some environments report a transiently narrow innerWidth on the very
    // first layout pass (e.g. an embedded viewport still settling to its
    // final size) — a delayed re-check catches that without waiting for an
    // actual user resize.
    const settleTimer = setTimeout(onResize, 150)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    if (isCompact || reduceMotion) return
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const n = layers.length
    const segment = 1 / n
    const transitionLen = segment * 0.3

    const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

    const applyFrame = (overall: number) => {
      for (let i = 0; i < n; i++) {
        const el = layerRefs.current[i]
        if (!el) continue
        const segStart = i * segment
        const segEnd = (i + 1) * segment

        let opacity: number
        let x: number

        if (i === 0) {
          const exitT = clamp01((overall - (segEnd - transitionLen)) / transitionLen)
          opacity = 1 - exitT
          x = 0
        } else if (i === n - 1) {
          const enterT = clamp01((overall - (segStart - transitionLen)) / transitionLen)
          opacity = enterT
          x = (1 - enterT) * 100
        } else {
          const enterT = clamp01((overall - (segStart - transitionLen)) / transitionLen)
          const exitT = clamp01((overall - (segEnd - transitionLen)) / transitionLen)
          opacity = enterT * (1 - exitT)
          x = (1 - enterT) * 100 + -exitT * 40
        }

        el.style.opacity = String(opacity)
        el.style.transform = `translateX(${x}%)`
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompact, reduceMotion])

  if (isCompact || reduceMotion) {
    return (
      <div id={id} aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', gap: 48, background, padding: '56px 20px' }}>
        {layers.map((layer, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>{layer}</div>
        ))}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} id={id} aria-label={ariaLabel} style={{ height: wrapperHeight, position: 'relative', background }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', background }}>
        {layers.map((layer, i) => (
          <div
            key={i}
            ref={(el) => { layerRefs.current[i] = el }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: i + 1,
              opacity: i === 0 ? 1 : 0,
              // Same asymmetry as Ultra's own CameraFrameSection: the first
              // ("main") layer needs clearance from the fixed navbar above
              // it; card layers (.ultra-galaxyai-stack__inner) are
              // full-bleed and handle their own sizing/padding internally —
              // stacking this padding on top of that budget is what made
              // cards taller than the pinned viewport had room for.
              padding: i === 0 ? '96px 20px 24px' : 0,
              boxSizing: 'border-box',
            }}
          >
            {layer}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Generic feature card — same followcam__* markup PhotoAssistCard (Ultra)
   uses, just with configurable slots so it can carry any device's copy. */
export function FeatureCard({
  title,
  titleDir,
  tags,
  tagsLabel,
  desc,
  note,
  steps,
  examples,
  media,
  tip,
  constrainHeight = true,
  tipInColumn = false,
  sectionName,
  pinned,
}: {
  title: string
  titleDir?: 'ltr' | 'rtl'
  tags?: string[]
  /** Small muted label rendered before the tag pills — opt-in, for callers
   * where `tags` is a device-compatibility list (e.g. "זמין בדגמי:") rather
   * than a generic chip list (FlexWindow's app names, "תכונה מרכזית"), which
   * would read oddly with this label attached. */
  tagsLabel?: string
  desc: string
  note?: string
  steps?: string[]
  examples?: string[]
  media: ReactNode
  tip?: string
  /** .ultra-galaxyai-stack__inner caps height + scrolls internally, which
   * only makes sense inside a CrossfadeStage's fixed 100vh pinned layer.
   * Standalone cards (normal document flow, e.g. FlexWindow) should just
   * grow to fit their content — pass false to drop the cap. */
  constrainHeight?: boolean
  /** Default renders the tip as a full-width bar below the whole card.
   * Pass true to nest it at the end of the text column instead — useful
   * when the media column is short enough that a full-width tip below
   * would just add unused height. */
  tipInColumn?: boolean
  /** Small kicker label (matching <Eyebrow>) rendered above the title —
   * opt-in, mobile/tablet-only (.ultra-mobile-only), for FeatureCard
   * instances that otherwise show no section name at all. */
  sectionName?: string
  /** Re-applies the mobile/tablet overflow-safety cap (max-height +
   * internal scroll) that a page-scoped site rule otherwise strips from
   * every card at that breakpoint (see .ultra-mobile-pinned-safe). Needed
   * when this specific card sits inside a CrossfadeStage pinned at every
   * width (compactBreakpoint={0}) — unlike the other cards in the same
   * stage that stay in normal stacked flow, a pinned one can't just grow. */
  pinned?: boolean
}) {
  const cardClassName = ['ultra-galaxyai-stack__inner', pinned && 'ultra-mobile-pinned-safe'].filter(Boolean).join(' ')
  return (
    <div className={cardClassName} style={constrainHeight ? undefined : { maxHeight: 'none', overflowY: 'visible' }}>
      <div className="followcam__header">
        <div className="followcam__intro">
          {sectionName && (
            <div className="ultra-mobile-only">
              <Eyebrow>{sectionName}</Eyebrow>
            </div>
          )}
          <h3 className="followcam__title" dir={titleDir}>{title}</h3>
          {tags && (
            <div className="followcam__tags">
              {tagsLabel && <span className="followcam__tags-label">{tagsLabel}</span>}
              {tags.map((t) => (
                <span className="followcam__tag" dir="ltr" key={t}>{t}</span>
              ))}
            </div>
          )}
          <p className="followcam__desc">{desc}</p>
          {note && (
            <p className="followcam__note" style={{ fontFamily: 'var(--font-primary)', fontSize: 13, fontWeight: 400, color: 'rgba(23,23,28,0.55)', lineHeight: 1.6, marginTop: 14 }}>
              {note}
            </p>
          )}
          {steps && (
            <div className="followcam__block">
              <div className="followcam__label">שלבי ההדגמה במכשיר</div>
              <div className="followcam__steps">
                {steps.map((step, i) => (
                  <div className="followcam__step" key={step}>
                    <span className="followcam__step-index" dir="ltr">{i + 1}</span>
                    <span className="followcam__step-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tip && tipInColumn && <SalesTip text={tip} />}
        </div>
        <div className="followcam__media-col">
          <div className="followcam__media">{media}</div>
          {examples && (
            <div className="followcam__block followcam__block--examples">
              <div className="followcam__label">דוגמאות לשימוש</div>
              <div className="followcam__examples">
                {examples.map((ex) => (
                  <div className="followcam__example" key={ex}>{ex}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {tip && !tipInColumn && <SalesTip text={tip} />}
    </div>
  )
}

/* Simple centered stat card (no steps/examples) — used where the feature is
   a single headline number rather than a step-by-step demo. Reuses the same
   card chrome + typography classes as FeatureCard for visual consistency. */
export function StatCard({
  headline,
  body,
  statValue,
  statUnit,
  statLabel,
  statCaption,
  attrs,
  tip,
}: {
  headline: string
  body: string
  statValue: number
  statUnit: string
  statLabel: string
  statCaption?: string
  attrs: string[]
  tip?: string
}) {
  return (
    <div className="ultra-galaxyai-stack__inner" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <h3 className="followcam__title" style={{ textAlign: 'center' }}>{headline}</h3>
      <p className="followcam__desc" style={{ textAlign: 'center', margin: '0 auto 32px' }}>{body}</p>
      <div style={{ marginBottom: 28 }}>
        <div dir="ltr" style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: 'clamp(48px, 6vw, 72px)', lineHeight: 1, color: '#141414' }}>
          <CountUpSpan value={statValue} />
          <span style={{ fontSize: '0.32em', fontWeight: 700, marginInlineStart: 8, color: 'rgba(0,0,0,0.5)' }}>{statUnit}</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ultra-ink)', marginTop: 6 }}>{statLabel}</div>
        {statCaption && (
          <div dir="ltr" style={{ fontSize: 12, fontWeight: 700, color: 'var(--samsung-blue)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {statCaption}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <Attrs items={attrs} />
      </div>
      {tip && <SalesTip text={tip} />}
    </div>
  )
}
