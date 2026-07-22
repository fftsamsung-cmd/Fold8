import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Each device page pulls in its own large tree of videos/frame-sequence
// assets (see Task C's performance pass) — lazy-loading per route means
// visiting one device page no longer downloads the other two pages' JS
// (GSAP timelines, section components, etc.) upfront.
const Fold8Page = lazy(() => import('./pages/Fold8Page'))
const Flip8Page = lazy(() => import('./pages/Flip8Page'))
const Fold8UltraPage = lazy(() => import('./pages/Fold8UltraPage'))

gsap.registerPlugin(ScrollTrigger)

// Plain <BrowserRouter>/<Routes> (not a data router), so <ScrollRestoration>
// isn't available here — this is its manual equivalent. Without it,
// switching device pages via the navbar's device-switcher <Link> (client-side
// SPA navigation, no full page load) leaves the new page at whatever scroll
// offset the previous page was at, instead of landing on its hero. Every
// ScrollTrigger on these pages uses element-relative start/end strings (not
// window.scrollY read at mount), so resetting scroll here is safe and won't
// desync any pin's calculated position.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    ScrollTrigger.refresh()
  }, [pathname])
  return null
}

export default function App() {
  // Drives GSAP's ScrollTrigger off Lenis's eased scroll position instead of
  // the raw native scroll event, so scrub-linked animations (e.g. the
  // Highlights stacking cards) track the smoothed scroll exactly.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // By default Lenis only smooths wheel scrolling — touch scrolling is
    // left to the browser's native momentum untouched (syncTouch: false),
    // which is why a few quick swipes in a row could fling straight past
    // every pinned/scrubbed section instead of settling into them. Only
    // switch touch handling over to Lenis on actual touch/coarse-pointer
    // devices. First pass (0.85 / 1.2 / 0.1) tested too slow; the halfway
    // point toward Lenis's own syncTouch defaults (1 / 1.7 / 0.075, the
    // closest quantifiable stand-in for "untouched native feel") still
    // tested too slow. Nudged again, 3/4 of the way toward native this
    // time — still slightly damped so a rapid-fire swipe run doesn't fully
    // regress to the original complaint, but close enough to native that
    // normal scrolling shouldn't read as sluggish. A proper fix (capping
    // reveal speed per pinned section instead of blanket touch damping) is
    // still the real follow-up once there's time to test it properly.
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    const lenis = new Lenis(
      isTouchDevice
        ? { syncTouch: true, touchMultiplier: 0.9625, touchInertiaExponent: 1.575, syncTouchLerp: 0.08125 }
        : undefined,
    )
    lenis.on('scroll', ScrollTrigger.update)
    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Fold8Page />} />
          <Route path="/fold8" element={<Fold8Page />} />
          <Route path="/flip8" element={<Flip8Page />} />
          <Route path="/fold8-ultra" element={<Fold8UltraPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
