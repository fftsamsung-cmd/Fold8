import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_URL =
  'https://videos.pexels.com/video-files/2278095/2278095-uhd_2560_1440_30fps.mp4'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([eyebrowRef.current, headlineRef.current, subRef.current, ctasRef.current], {
        opacity: 0,
        y: 48,
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.8,
        },
      })

      // Phase 1 (0–40%): overlay darkens, scroll indicator fades
      tl.to(overlayRef.current, { opacity: 0.82, duration: 0.4, ease: 'none' }, 0)
      tl.to(scrollIndicatorRef.current, { opacity: 0, duration: 0.2 }, 0)

      // Phase 2 (40–100%): text appears in stagger
      tl.to(eyebrowRef.current,  { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.42)
      tl.to(headlineRef.current, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.56)
      tl.to(subRef.current,      { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.72)
      tl.to(ctasRef.current,     { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.84)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="hero" ref={sectionRef} aria-label="קטע גיבור - סדרת Galaxy Z 2026">
      <div className="hero__sticky">
        {/* Video background */}
        <video className="hero__video" autoPlay muted loop playsInline>
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {/* Dark overlay — animated by GSAP */}
        <div className="hero__overlay" ref={overlayRef} />

        {/* Text content */}
        <div className="hero__inner">
          <div className="hero__content">
            <span className="hero__eyebrow" ref={eyebrowRef}>סדרת 2026</span>

            <h1 className="hero__headline" ref={headlineRef}>
              <span className="hero__headline-sub">Galaxy Z</span>
              <span className="hero__headline-main">מקפלים<br />את הגבולות</span>
            </h1>

            <p className="hero__sub" ref={subRef}>
              שלושה מכשירים. אינטליגנציה אחת. העתיד מגיע מקופל.
            </p>

            <div className="hero__ctas" ref={ctasRef}>
              <Link to="/fold8-ultra" className="btn-primary">
                גלה את Fold8 Ultra
              </Link>
              <Link to="/#devices" className="btn-secondary">
                כל הסדרה
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero__scroll-indicator" ref={scrollIndicatorRef} aria-hidden="true">
          <span className="hero__scroll-label">SCROLL</span>
          <div className="hero__scroll-line">
            <div className="hero__scroll-dot" />
          </div>
        </div>
      </div>
    </section>
  )
}
