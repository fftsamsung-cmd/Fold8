import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './SeriesDNA.css'

gsap.registerPlugin(ScrollTrigger)

const VALUES = [
  {
    id: 'ai',
    label: 'Galaxy AI',
    headline: 'בינה מלאכותית שחושבת איתך',
    body: 'Galaxy AI מוטמעת בכל מכשיר בסדרה. מתרגמת, מסכמת, מצלמת ומנהלת את חייך - בזמן אמת, על המכשיר.',
    accent: 'var(--galaxy-ai-gradient)',
    number: '01',
  },
  {
    id: 'design',
    label: 'עיצוב',
    headline: 'צורה שמשרתת תפקוד',
    body: 'ציר קיפול מחוזק, זכוכית Gorilla Armor 2 וגוף אלומיניום. כל קיפול מרגיש כמו פעם ראשונה.',
    accent: 'linear-gradient(135deg, #1C1C1C, #3A3A3A)',
    number: '02',
  },
  {
    id: 'performance',
    label: 'ביצועים',
    headline: 'עוצמה ללא פשרות',
    body: 'מעבד Snapdragon 8 Elite Gen 2, 16GB RAM וסוללה חכמה עם טעינה מהירה. מוכן לכל משימה.',
    accent: 'linear-gradient(135deg, #1428A0, #0A1880)',
    number: '03',
  },
]

export default function SeriesDNA() {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.from(headlineRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headlineRef.current,
          start: 'top 80%',
          once: true,
        },
      })

      const cards = cardsRef.current?.querySelectorAll('.dna-card')
      if (cards) {
        gsap.from(cards, {
          opacity: 0,
          y: 60,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 75%',
            once: true,
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="dna" id="series-dna" ref={sectionRef} aria-label="ערכי ליבה של הסדרה">
      <div className="dna__inner">
        <div className="dna__header" ref={headlineRef}>
          <h2 className="dna__headline">DNA של הסדרה</h2>
          <p className="dna__sub">שלושה ערכים. כל מכשיר. ללא יוצא מן הכלל.</p>
        </div>

        <div className="dna__cards" ref={cardsRef}>
          {VALUES.map((v) => (
            <div key={v.id} className="dna-card" role="article">
              <div
                className="dna-card__orb"
                style={{ background: v.accent }}
                aria-hidden="true"
              />
              <div className="dna-card__number" aria-hidden="true">{v.number}</div>
              <div className="dna-card__content">
                <span className="dna-card__label">{v.label}</span>
                <h3 className="dna-card__headline">{v.headline}</h3>
                <p className="dna-card__body">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
