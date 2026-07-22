import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import videoUrl from '../assets/Ultra/hf_20260718_122507_9e21e272-e2d2-4422-8958-4a2f5c681646.mp4'
import heroMobileVideoUrl from '../assets/Ultra/hf_20260718_121315_80b2c3ec-0ba6-4405-a4c8-ded171b172d1.mp4'
import { useIsCompact } from './SectionKit'
import './UltraHero.css'

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/* Hero reveal bands, as fractions of the hero phase's own local progress
   (0–1) — identical timing to the original standalone hero, just remapped
   onto its slice of the larger merged timeline below. */
const HERO_BANDS = {
  scrollIndicator: [0, 0.2],
  overlay: [0, 0.4],
  eyebrow: [0.42, 0.64],
} as const

/* Merged timeline — fractions of OVERALL scroll progress (0–1). The hero
   plays out exactly as before through HERO_PHASE_END (dark fade + title,
   held), then a crossfade: the hero video shrinks into the right half while
   the dark overlay and title fade back out and the Multitasking copy fades
   in on the left, then holds as a static state until the wrapper's scroll
   runway ends and the page continues normally into Display. */
const HERO_PHASE_END = 0.5
const TRANSITION_END = 0.7

const MULTITASKING_STEPS = [
  'פתחו את הדפדפן, היכנסו לכתבת מטיילים והעתיקו את הקישור שלה.',
  'גררו ושחררו את אפליקציית ההודעות מתוך סרגל המשימות.',
  'הדביקו את הקישור והתחילו להתכתב באופן מיידי.',
]

const MULTITASKING_ATTRS = [
  'לחפש ברשת תוך כדי צפייה בסרטונים בלי לעצור את הסטרימינג אפילו לרגע.',
  'לצפות בסרטונים ותוך כדי לשתף תוכן עם חברים ברגע הכל מאותו המסך.',
]

/* Multitasking copy — dark-theme styling (bespoke inline styles, not the
   shared light-theme ultra-* classes) since this sits over the hero's dark
   video/overlay rather than a white section background. */
function MultitaskingCopy() {
  return (
    <div dir="rtl">
      <h2
        style={{
          fontFamily: 'var(--font-primary)',
          fontWeight: 900,
          fontSize: 'clamp(26px, 2.8vw, 46px)',
          lineHeight: 1.1,
          margin: '0 0 14px',
          color: '#fff',
        }}
      >
        עבודת מולטיטסקינג מושלמת!
      </h2>

      <p
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 'clamp(14px, 1.1vw, 17px)',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.65)',
          margin: '0 0 22px',
          lineHeight: 1.6,
        }}
      >
        לעבוד, לצפות ולתקשר בו-זמנית – המסך הנפתח מעניק לכם מרחב עבודה של שני טלפונים במכשיר אחד.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
        {MULTITASKING_STEPS.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              dir="ltr"
              style={{
                flexShrink: 0,
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '1px solid rgba(143,168,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgb(57, 49, 93)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'clamp(13px, 1vw, 15px)',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.5,
                paddingTop: '2px',
              }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {MULTITASKING_ATTRS.map((attr) => (
          <div key={attr} style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ color: 'rgb(57, 49, 93)' }}>—</span>
            <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              {attr}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          borderRadius: '10px',
          background: 'rgba(57,49,93,0.08)',
          border: '1px solid rgba(57,49,93,0.22)',
          borderInlineStart: '3px solid rgb(57, 49, 93)',
          padding: '12px 14px',
        }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">💡</span>
        <div>
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: 'rgb(57, 49, 93)' }}>
            טיפ לנציג:{' '}
          </span>
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>
            הראו ללקוח איך גוררים אפליקציה מסרגל המשימות תוך כדי שיחה — הדגמה של 10 שניות שממחישה למה זה שווה את המחיר.
          </span>
        </div>
      </div>
    </div>
  )
}

export default function UltraHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLHeadingElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const compactContentRef = useRef<HTMLDivElement>(null)
  // The mini "recap" video below plays the same footage as the full-bleed
  // background video above — both decoding continuously from mount would
  // double the decode/battery cost for content that's invisible most of the
  // time (compactContentRef sits at opacity:0 until contentEnterT rises).
  // Paused until its own layer is about to become visible, then playing
  // only while it's actually shown.
  const miniVideoRef = useRef<HTMLVideoElement>(null)
  const isCompact = useIsCompact(860)

  useEffect(() => {
    if (isCompact) {
      // Merged single pin, same "crossfade in place" technique as the rest
      // of the mobile work: hero title reveals first, then crossfades out
      // while the Multitasking copy fades + rises in over it — instead of
      // the old behavior where the Multitasking copy sat in separate normal
      // flow right below the hero's own pin (a plain instant reveal, no
      // relationship to the hero's scroll-driven entrance).
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const state = { p: 0 }
      const applyFrame = (p: number) => {
        const scrollIndT = clamp01(p / 0.15)
        if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = String(1 - scrollIndT)

        const overlayT = clamp01(p / 0.3)
        if (overlayRef.current) overlayRef.current.style.opacity = String(overlayT * 0.94)

        const eyebrowT = clamp01((p - 0.15) / 0.2)
        if (eyebrowRef.current) {
          eyebrowRef.current.style.opacity = String(eyebrowT)
          eyebrowRef.current.style.transform = reduceMotion ? 'none' : `translateY(${(1 - eyebrowT) * 48}px)`
        }

        const contentEnterT = clamp01((p - 0.42) / 0.16)
        if (eyebrowRef.current) eyebrowRef.current.style.opacity = String(eyebrowT * (1 - contentEnterT))
        if (compactContentRef.current) {
          compactContentRef.current.style.opacity = String(contentEnterT)
          compactContentRef.current.style.transform = reduceMotion ? 'none' : `translateY(${(1 - contentEnterT) * 20}px)`
          compactContentRef.current.style.pointerEvents = contentEnterT > 0.5 ? 'auto' : 'none'
        }
        const mini = miniVideoRef.current
        if (mini) {
          if (contentEnterT > 0 && mini.paused) mini.play().catch(() => {})
          else if (contentEnterT === 0 && !mini.paused) mini.pause()
        }
      }

      if (reduceMotion) {
        applyFrame(1)
        return
      }

      const ctx = gsap.context(() => {
        gsap.to(state, {
          p: 1,
          ease: 'none',
          immediateRender: false,
          onUpdate: () => applyFrame(state.p),
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        })
      }, sectionRef)
      return () => ctx.revert()
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gsap.set(eyebrowRef.current, { opacity: 0, y: 48 })

    const applyHeroReveal = (local: number) => {
      const [siStart, siEnd] = HERO_BANDS.scrollIndicator
      const scrollIndT = clamp01((local - siStart) / (siEnd - siStart))
      if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = String(1 - scrollIndT)

      const [ovStart, ovEnd] = HERO_BANDS.overlay
      const overlayT = clamp01((local - ovStart) / (ovEnd - ovStart))
      if (overlayRef.current) overlayRef.current.style.opacity = String(overlayT * 0.94)

      const [eyStart, eyEnd] = HERO_BANDS.eyebrow
      const eyebrowT = clamp01((local - eyStart) / (eyEnd - eyStart))
      if (eyebrowRef.current) {
        eyebrowRef.current.style.opacity = String(eyebrowT)
        eyebrowRef.current.style.transform = `translateY(${(1 - eyebrowT) * 48}px)`
      }
    }

    const state = { p: 0 }
    const ctx = gsap.context(() => {
      gsap.to(state, {
        p: 1,
        ease: 'none',
        immediateRender: false,
        onUpdate: () => {
          const overall = state.p
          const heroLocal = clamp01(overall / HERO_PHASE_END)
          applyHeroReveal(heroLocal)

          const transitionT = clamp01((overall - HERO_PHASE_END) / (TRANSITION_END - HERO_PHASE_END))

          if (videoWrapRef.current) {
            const x = reduceMotion ? (overall > HERO_PHASE_END ? 1 : 0) : transitionT
            videoWrapRef.current.style.left = `${x * 50}%`
            videoWrapRef.current.style.top = `${x * 25}%`
            videoWrapRef.current.style.width = `${100 - x * 50}%`
            videoWrapRef.current.style.height = `${100 - x * 50}%`
            videoWrapRef.current.style.borderRadius = `${x * 24}px`
          }

          if (overall > HERO_PHASE_END) {
            if (overlayRef.current) overlayRef.current.style.opacity = String(0.94 * (1 - transitionT))
            if (eyebrowRef.current) eyebrowRef.current.style.opacity = String(1 - transitionT)
          }

          if (textRef.current) {
            textRef.current.style.opacity = String(transitionT)
            textRef.current.style.transform = reduceMotion ? 'none' : `translateY(${(1 - transitionT) * 16}px)`
          }
        },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: reduceMotion ? true : 0.6,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [isCompact])

  if (isCompact) {
    return (
      <section className="ultra-hero-fx" ref={sectionRef} aria-label="Galaxy Z Fold8 Ultra" id="multitasking">
        <div className="ultra-hero-fx__sticky">
          <video className="ultra-hero-fx__video" autoPlay muted loop playsInline src={heroMobileVideoUrl} />
          <div className="ultra-hero-fx__overlay" ref={overlayRef} />
          <div className="ultra-hero-fx__inner">
            <div className="ultra-hero-fx__content">
              <h1 className="ultra-hero-fx__eyebrow" ref={eyebrowRef}>Galaxy Z Fold8 Ultra</h1>
            </div>
          </div>
          <div className="ultra-hero-fx__scroll-indicator" ref={scrollIndicatorRef} aria-hidden="true">
            <span className="ultra-hero-fx__scroll-label">SCROLL</span>
            <div className="ultra-hero-fx__scroll-line">
              <div className="ultra-hero-fx__scroll-dot" />
            </div>
          </div>

          {/* Multitasking copy — crossfades + rises in over the hero title
              in the same pinned screen (see applyFrame's contentEnterT)
              instead of sitting in separate normal flow right below. */}
          <div
            ref={compactContentRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              padding: '96px 20px 24px',
              boxSizing: 'border-box',
              opacity: 0,
              pointerEvents: 'none',
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px', borderRadius: '18px', overflow: 'hidden' }}>
              {/* This box gets shrunk by the flex column above it to fit
                  alongside the copy below — the video's own intrinsic
                  aspect ratio then renders much taller than that shrunk
                  window, so without a shift it's cropped to its own top
                  (empty background in this footage, hands+phone further
                  down get clipped off). Shifting the video up within the
                  window (not resizing the window itself) brings the
                  hands+phone into view instead. */}
              <video
                ref={miniVideoRef}
                src={heroMobileVideoUrl}
                muted
                loop
                playsInline
                style={{ width: '100%', display: 'block', transform: 'translateY(-27.5%)' }}
              />
            </div>
            <div style={{ width: '100%', maxWidth: '420px' }}>
              <MultitaskingCopy />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="ultra-hero-fx"
      ref={sectionRef}
      aria-label="Galaxy Z Fold8 Ultra"
      id="multitasking"
      style={{ height: '500vh' }}
    >
      <div className="ultra-hero-fx__sticky">
        <div
          ref={videoWrapRef}
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'hidden' }}
        >
          <video
            className="ultra-hero-fx__video"
            autoPlay
            muted
            loop
            playsInline
            src={videoUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div className="ultra-hero-fx__overlay" ref={overlayRef} />

        <div className="ultra-hero-fx__inner">
          <div className="ultra-hero-fx__content">
            <h1 className="ultra-hero-fx__eyebrow" ref={eyebrowRef}>Galaxy Z Fold8 Ultra</h1>
          </div>
        </div>

        <div className="ultra-hero-fx__scroll-indicator" ref={scrollIndicatorRef} aria-hidden="true">
          <span className="ultra-hero-fx__scroll-label">SCROLL</span>
          <div className="ultra-hero-fx__scroll-line">
            <div className="ultra-hero-fx__scroll-dot" />
          </div>
        </div>

        <div
          ref={textRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '6%',
            width: '38%',
            display: 'flex',
            alignItems: 'center',
            opacity: 0,
            zIndex: 3,
          }}
        >
          <MultitaskingCopy />
        </div>
      </div>
    </section>
  )
}
