import Navbar from '../components/Navbar'
import UltraHero from '../components/UltraHero'
import UltraPage from '../components/UltraPage'
import ContinueNav from '../components/ContinueNav'
import Footer from '../components/Footer'

const ULTRA_SECTIONS = [
  { id: 'multitasking', label: 'מולטיטסקינג', number: '01', enLabel: 'MULTITASKING' },
  { id: 'display', label: 'תצוגה', number: '02', enLabel: 'DISPLAY' },
  { id: 'cameras', label: 'מצלמה', number: '03', enLabel: 'CAMERAS' },
  { id: 'performance', label: 'ביצועים', number: '04', enLabel: 'PERFORMANCE' },
  { id: 'battery', label: 'סוללה', number: '05', enLabel: 'BATTERY' },
  { id: 'design', label: 'עיצוב', number: '06', enLabel: 'DESIGN' },
  { id: 'spec', label: 'מפרט', number: '07', enLabel: 'SPECS' },
]

export default function Fold8UltraPage() {
  return (
    <main lang="he" dir="rtl" className="page--ultra">
      <Navbar sections={ULTRA_SECTIONS} />
      <UltraHero />
      <UltraPage />
      <ContinueNav />
      <Footer />
    </main>
  )
}
