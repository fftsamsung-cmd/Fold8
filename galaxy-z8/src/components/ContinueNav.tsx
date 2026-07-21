import { useEffect, useState } from 'react'
import './ContinueNav.css'

const DEFAULT_SECTION_IDS = [
  'highlights',
  'multitasking',
  'display',
  'cameras',
  'horizontal-lock',
  'reading',
  'photo-assist',
  'performance',
  'battery',
  'design',
  'colors',
  'spec',
]

export default function ContinueNav({ sectionIds = DEFAULT_SECTION_IDS }: { sectionIds?: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    )
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionIds.indexOf(entry.target.id)
            if (index !== -1) setActiveIndex(index)
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )
    sections.forEach((sec) => observer.observe(sec))
    return () => observer.disconnect()
  }, [sectionIds])

  const goTo = (index: number) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(sectionIds[index])?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  const isFirst = activeIndex === 0
  const isLast = activeIndex === sectionIds.length - 1

  return (
    <>
      {!isLast && (
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="ultra-continue-btn ultra-continue-btn--next"
        >
          המשך ←
        </button>
      )}
      {!isFirst && (
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="ultra-continue-btn ultra-continue-btn--back"
        >
          → חזור
        </button>
      )}
    </>
  )
}
