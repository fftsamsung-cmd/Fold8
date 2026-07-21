import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LandingPage from './pages/LandingPage'
import Fold8Page from './pages/Fold8Page'
import Flip8Page from './pages/Flip8Page'
import Fold8UltraPage from './pages/Fold8UltraPage'

gsap.registerPlugin(ScrollTrigger)

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
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/fold8" element={<Fold8Page />} />
      <Route path="/flip8" element={<Flip8Page />} />
      <Route path="/fold8-ultra" element={<Fold8UltraPage />} />
    </Routes>
  )
}
