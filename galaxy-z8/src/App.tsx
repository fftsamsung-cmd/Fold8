import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Each device page pulls in its own large tree of videos/frame-sequence
// assets (see Task C's performance pass) — lazy-loading per route means
// visiting one device page no longer downloads the other two pages' JS
// (GSAP timelines, section components, etc.) upfront.
const LandingPage = lazy(() => import('./pages/LandingPage'))
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
    const lenis = new Lenis()
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/fold8" element={<Fold8Page />} />
          <Route path="/flip8" element={<Flip8Page />} />
          <Route path="/fold8-ultra" element={<Fold8UltraPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
