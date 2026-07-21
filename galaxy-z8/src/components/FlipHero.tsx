import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Video } from 'lucide-react'
import './FlipHero.css'

gsap.registerPlugin(ScrollTrigger)

/* TODO: replace the placeholder panel with the real hero video/image once supplied. */
export default function FlipHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(eyebrowRef.current, { opacity: 0, y: 48 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.8,
        },
      })

      tl.to(overlayRef.current, { opacity: 0.94, duration: 0.4, ease: 'none' }, 0)
      tl.to(scrollIndicatorRef.current, { opacity: 0, duration: 0.2 }, 0)
      tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.42)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="flip-hero-fx" ref={sectionRef} aria-label="Galaxy Z Flip8">
      <div className="flip-hero-fx__sticky">
        <div className="flip-hero-fx__media-slot" aria-hidden="true">
          <Video size={32} strokeWidth={1.5} />
          <span>וידאו הירו — Galaxy Z Flip8</span>
        </div>

        <div className="flip-hero-fx__overlay" ref={overlayRef} />

        <div className="flip-hero-fx__inner">
          <div className="flip-hero-fx__content">
            <h1 className="flip-hero-fx__eyebrow" ref={eyebrowRef}>
              Galaxy Z Flip8
            </h1>
          </div>
        </div>

        <div className="flip-hero-fx__scroll-indicator" ref={scrollIndicatorRef} aria-hidden="true">
          <span className="flip-hero-fx__scroll-label">SCROLL</span>
          <div className="flip-hero-fx__scroll-line">
            <div className="flip-hero-fx__scroll-dot" />
          </div>
        </div>
      </div>
    </section>
  )
}
