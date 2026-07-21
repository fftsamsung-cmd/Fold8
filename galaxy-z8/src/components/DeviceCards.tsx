import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import flip2Sizes from '../assets/Flip/flip-hero.png'
import foldImage from '../assets/Fold/fold-hero.png'
import ultraImage from '../assets/Ultra/ultra-hero.png'
import './DeviceCards.css'

gsap.registerPlugin(ScrollTrigger)

const DEVICES = [
  {
    id: 'fold8',
    path: '/fold8',
    name: 'Galaxy Z Fold8',
    tagline: 'המסך שמכפיל את עצמו',
    desc: 'מסך פנימי 8 אינץ - מחשב בכיס.',
    badge: 'חדש',
    badgeStyle: 'blue',
    visual: 'fold',
    featured: false,
    glowColor: 'hsla(270, 100%, 78%, 1)',
    glowColorMid: 'hsla(270, 90%, 62%, 0.85)',
  },
  {
    id: 'flip8',
    path: '/flip8',
    name: 'Galaxy Z Flip8',
    tagline: 'סגנון שלא עושה פשרות',
    desc: 'FlexWindow חכם. עיצוב קומפקטי. Galaxy AI מלא.',
    badge: 'פופולרי',
    badgeStyle: 'light',
    visual: 'flip',
    featured: false,
    glowColor: 'hsla(330, 100%, 75%, 1)',
    glowColorMid: 'hsla(330, 90%, 60%, 0.85)',
  },
  {
    id: 'fold8-ultra',
    path: '/fold8-ultra',
    name: 'Galaxy Z Fold8 Ultra',
    tagline: 'האולטימטיבי',
    desc: 'S Pen משולב. Titanium Frame. Galaxy AI Pro.',
    badge: 'Ultra',
    badgeStyle: 'dark',
    visual: 'ultra',
    featured: true,
    glowColor: 'rgba(0, 0, 0, 1)',
    glowColorMid: 'rgba(0, 0, 0, 0.7)',
  },
]

function SpotlightCard({
  children,
  className,
  glowColor,
  glowColorMid,
}: {
  children: React.ReactNode
  className?: string
  glowColor: string
  glowColorMid: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: -999, y: -999, active: false })

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 18, stiffness: 160 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)
  const rotateX = useTransform(springY, [-0.5, 0.5], ['16deg', '-16deg'])
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-16deg', '16deg'])
  const shadowX = useTransform(springX, [-0.5, 0.5], [16, -16])
  const shadowY = useTransform(springY, [-0.5, 0.5], [16, -16])
  const boxShadow = useTransform(
    [shadowX, shadowY],
    ([x, y]: number[]) =>
      `${x}px ${y}px 48px rgba(0,0,0,0.28), 0 8px 32px rgba(0,0,0,0.12)`
  )

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPos({ x, y, active: true })
    mouseX.set(x / rect.width - 0.5)
    mouseY.set(y / rect.height - 0.5)
  }

  const handleLeave = () => {
    setPos((p) => ({ ...p, active: false }))
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div style={{ perspective: '1000px' }}>
      <motion.div
        ref={ref}
        className={`spotlight-card ${className ?? ''}`}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          boxShadow,
        }}
      >
        <div
          className="spotlight-border"
          style={{
            background: pos.active
              ? `radial-gradient(400px circle at ${pos.x}px ${pos.y}px,
                  ${glowColor} 0%,
                  ${glowColorMid} 40%,
                  transparent 70%)`
              : 'transparent',
          }}
        />
        {children}
      </motion.div>
    </div>
  )
}

export default function DeviceCards() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.from(headlineRef.current, {
        opacity: 0,
        y: 36,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headlineRef.current,
          start: 'top 82%',
          once: true,
        },
      })

      const cards = cardsRef.current?.querySelectorAll('.spotlight-card')
      if (cards) {
        gsap.from(cards, {
          opacity: 0,
          y: 50,
          duration: 0.75,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
            once: true,
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      className="devices"
      ref={sectionRef}
      id="devices"
      aria-label="מכשירי סדרת Galaxy Z"
    >
      <div className="devices__inner">
        <div className="devices__header" ref={headlineRef}>
          <h2 className="devices__headline">בחר את ה-Z שלך</h2>
          <p className="devices__sub">שלושה מכשירים. אישיות אחרת לכל אחד.</p>
        </div>

        <div className="devices__grid" ref={cardsRef}>
          {DEVICES.map((d) => (
            <Link
              key={d.id}
              to={d.path}
              className="device-card-link"
              aria-label={`${d.name} - ${d.tagline}`}
            >
              <SpotlightCard glowColor={d.glowColor} glowColorMid={d.glowColorMid} className={`device-card${d.id === 'fold8-ultra' ? ' device-card--ultra' : ''}`}>
                <div className="device-card__header">
                  <span className={`device-card__badge device-card__badge--${d.badgeStyle}`}>
                    {d.badge}
                  </span>
                </div>

                <p className="device-card__name">{d.name}</p>

                <div className="device-card__visual" aria-hidden="true">
                  <DeviceVisual type={d.visual} featured={d.featured} />
                </div>

                <div className="device-card__info">
                  <h3 className="device-card__tagline">{d.tagline}</h3>
                  <p className="device-card__desc">{d.desc}</p>
                  <span className="device-card__cta">
                    גלה עוד
                    <span className="device-card__arrow" aria-hidden="true">&#x2190;</span>
                  </span>
                </div>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function DeviceVisual({ type }: { type: string; featured: boolean }) {
  if (type === 'flip') return <img src={flip2Sizes} alt="Galaxy Z Flip8" className="device-img" />
  if (type === 'fold') return <img src={foldImage} alt="Galaxy Z Fold8" className="device-img" />
  if (type === 'ultra') return <img src={ultraImage} alt="Galaxy Z Fold8 Ultra" className="device-img" />
  return null
}
