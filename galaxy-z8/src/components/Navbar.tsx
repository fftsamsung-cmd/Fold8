import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link001 } from './ui/skiper-ui/skiper40'
import samsungLogo from '../assets/Samsung black.png'
import './Navbar.css'

gsap.registerPlugin(ScrollTrigger)

export interface SectionLink {
  id: string
  label: string
  /** "0N" + English label — shown in the fixed top-left section badge when present (Ultra page only). */
  number?: string
  enLabel?: string
}

const DEVICE_LINKS = [
  { href: '/fold8', label: 'Galaxy Z Fold8' },
  { href: '/fold8-ultra', label: 'Galaxy Z Fold8 Ultra' },
  { href: '/flip8', label: 'Galaxy Z Flip8' },
]

export default function Navbar({ sections }: { sections?: SectionLink[] }) {
  const location = useLocation()
  const hasSections = Boolean(sections && sections.length)
  const deviceMode = hasSections

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Starts empty (not sections[0]) so the fixed section badge doesn't
  // claim "section 1 active" while still over the hero — it only gets a
  // value once the scrollspy below confirms a section actually crossed
  // the reference line.
  const [activeId, setActiveId] = useState('')
  // The fixed section badge is a separate element from <nav> (see below) and
  // wasn't gated by anything — it could show a section number as soon as the
  // scrollspy crossed the reference line, even while the hero was still the
  // dominant thing on screen. Ties it to the same "top 45%" point where the
  // bar's own fade-in animation finishes, so the badge never appears before
  // the bar itself has actually arrived.
  const [barVisible, setBarVisible] = useState(false)

  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the device-switcher menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Close the menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [location.pathname])

  // The bar stays invisible over the hero, then fades in, scroll-linked,
  // as the first content section arrives.
  useEffect(() => {
    if (!hasSections || !navRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.set(navRef.current, { autoAlpha: 0 })
      gsap.to(navRef.current, {
        autoAlpha: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: `#${sections![0].id}`,
          start: 'top 85%',
          end: 'top 45%',
          scrub: true,
        },
      })
    })
    return () => ctx.revert()
  }, [hasSections, sections])

  // Scrollspy — which section has crossed the reference line under the bar.
  useEffect(() => {
    if (!hasSections || !sections) return

    const REFERENCE_LINE = 120
    let ticking = false
    // Re-queries getElementById on every tick rather than caching each
    // section's element once at mount — several sections (design/display/
    // cameras/reading/battery on the Fold page) swap their entire DOM
    // subtree when isCompact flips (mobile ⇄ desktop layout, e.g. on
    // resize or a foldable unfolding). A cached reference to the old,
    // now-detached node would report getBoundingClientRect().top as a
    // permanent 0 (detached nodes always do), which always satisfies
    // "<= REFERENCE_LINE" and made the scrollspy latch onto whichever
    // stale section came last, regardless of actual scroll position.
    const update = () => {
      ticking = false
      let currentId = ''
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= REFERENCE_LINE) currentId = section.id
        else break
      }
      setActiveId(currentId)
      // Same threshold as the bar's own fade-in ScrollTrigger end ('top 45%').
      const firstEl = document.getElementById(sections[0].id)
      setBarVisible(Boolean(firstEl && firstEl.getBoundingClientRect().top <= window.innerHeight * 0.45))
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [hasSections, sections])

  // Slide the active-pill indicator under the current link.
  useEffect(() => {
    if (!hasSections) return
    const track = trackRef.current
    const indicator = indicatorRef.current
    if (!track || !indicator) return
    const place = () => {
      const btn = track.querySelector<HTMLElement>(`[data-id="${activeId}"]`)
      if (!btn) return
      indicator.style.width = `${btn.offsetWidth}px`
      indicator.style.transform = `translateX(${btn.offsetLeft}px)`
      btn.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
    place()
    document.fonts?.ready?.then(place)
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [hasSections, activeId])

  const handlePillClick = (id: string, closeMenu = false) => (e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    if (closeMenu) setMenuOpen(false)
  }

  // The current section's "0N · LABEL" badge — same fixed screen position
  // for every section, driven by the same scrollspy state as the nav pills.
  const activeSection = sections?.find((s) => s.id === activeId)

  return (
    <>
      {hasSections && barVisible && activeSection?.number && activeSection.enLabel && (
        <div className="navbar__section-badge" dir="ltr" aria-hidden="true">
          {activeSection.number} · {activeSection.enLabel}
        </div>
      )}
      <nav
        ref={navRef}
        className={`navbar${scrolled ? ' navbar--scrolled' : ''}${deviceMode ? ' navbar--device' : ''}`}
        role="navigation"
        aria-label="ניווט ראשי"
      >
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="Samsung Galaxy Z - דף בית">
          <img src={samsungLogo} alt="Samsung" className="navbar__logo-img" />
        </Link>

        {deviceMode ? (
          <div className="navbar__section-track" ref={trackRef}>
            {hasSections && <div className="navbar__section-indicator" ref={indicatorRef} aria-hidden="true" />}
            {sections?.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                data-id={s.id}
                className={`navbar__section-link${activeId === s.id ? ' navbar__section-link--active' : ''}`}
                onClick={handlePillClick(s.id)}
              >
                {s.label}
              </a>
            ))}
          </div>
        ) : (
          <ul className="navbar__links" role="list">
            {DEVICE_LINKS.map((d) => (
              <li key={d.href}>
                <Link001 href={d.href} className="navbar__link">{d.label}</Link001>
              </li>
            ))}
          </ul>
        )}

        {deviceMode && (
          <div className="navbar__menu" ref={menuRef}>
            <button
              type="button"
              className={`navbar__menu-btn${menuOpen ? ' navbar__menu-btn--open' : ''}`}
              aria-expanded={menuOpen}
              aria-label="פתיחת תפריט ניווט"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className={`navbar__menu-panel${menuOpen ? ' navbar__menu-panel--open' : ''}`} role="menu">
              {hasSections && (
                <>
                  <div className="navbar__menu-group navbar__menu-group--sections">
                    {sections!.map((s) => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className={`navbar__menu-link${activeId === s.id ? ' navbar__menu-link--current' : ''}`}
                        role="menuitem"
                        tabIndex={menuOpen ? 0 : -1}
                        onClick={handlePillClick(s.id, true)}
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                  <div className="navbar__menu-divider" role="separator" />
                </>
              )}
              <div className="navbar__menu-group">
                {DEVICE_LINKS.map((d) => (
                  <Link
                    key={d.href}
                    to={d.href}
                    // "/" is the site root and renders the same page as "/fold8" —
                    // treat them as the same device for the "current" highlight.
                    className={`navbar__menu-link${(location.pathname === d.href || (d.href === '/fold8' && location.pathname === '/')) ? ' navbar__menu-link--current' : ''}`}
                    role="menuitem"
                    tabIndex={menuOpen ? 0 : -1}
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </nav>
    </>
  )
}
