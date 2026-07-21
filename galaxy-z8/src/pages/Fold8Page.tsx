import Navbar from '../components/Navbar'
import FoldPage from '../components/FoldPage'
import ContinueNav from '../components/ContinueNav'

const FOLD_SECTIONS = [
  { id: 'design', label: 'עיצוב', number: '01', enLabel: 'DESIGN' },
  { id: 'display', label: 'תצוגה', number: '02', enLabel: 'DISPLAY' },
  { id: 'cameras', label: 'מצלמה', number: '03', enLabel: 'CAMERAS' },
  { id: 'reading', label: 'קריאה וגלישה', number: '04', enLabel: 'BROWSING' },
  { id: 'performance', label: 'מעבד', number: '05', enLabel: 'PERFORMANCE' },
  { id: 'battery', label: 'סוללה', number: '06', enLabel: 'BATTERY' },
  { id: 'spec', label: 'מפרט טכני', number: '07', enLabel: 'SPECS' },
]

export default function Fold8Page() {
  return (
    <main lang="he" dir="rtl" className="page--fold">
      <Navbar sections={FOLD_SECTIONS} />
      <FoldPage />
      <ContinueNav sectionIds={FOLD_SECTIONS.map((s) => s.id)} />
    </main>
  )
}
