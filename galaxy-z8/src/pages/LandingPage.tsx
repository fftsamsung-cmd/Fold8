import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SeriesDNA from '../components/SeriesDNA'
import DeviceCards from '../components/DeviceCards'
export default function LandingPage() {
  return (
    <main lang="he" dir="rtl">
      <Navbar />
      <Hero />
      <SeriesDNA />
      <DeviceCards />
    </main>
  )
}
