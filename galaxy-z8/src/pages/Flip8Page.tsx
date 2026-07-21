import Navbar from '../components/Navbar'
import FlipHero from '../components/FlipHero'
import FlipPage from '../components/FlipPage'
import ContinueNav from '../components/ContinueNav'

const FLIP_SECTIONS = [
  { id: 'design', label: 'עיצוב', number: '01', enLabel: 'DESIGN' },
  { id: 'display', label: 'תצוגה', number: '02', enLabel: 'DISPLAY' },
  { id: 'cameras', label: 'מצלמה', number: '03', enLabel: 'CAMERAS' },
  { id: 'flexwindow', label: 'FLEX-WINDOW', number: '04', enLabel: 'FLEXWINDOW' },
  { id: 'spec', label: 'מפרט טכני', number: '05', enLabel: 'SPECS' },
]

export default function Flip8Page() {
  return (
    <main lang="he" dir="rtl" className="page--flip">
      <Navbar sections={FLIP_SECTIONS} />
      <FlipHero />
      <FlipPage />
      <ContinueNav sectionIds={FLIP_SECTIONS.map((s) => s.id)} />
    </main>
  )
}
