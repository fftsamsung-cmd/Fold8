import videoUrl from '../assets/Ultra/3D.mp4'
import './UltraReveal.css'

export default function UltraReveal() {
  return (
    <section className="ultra-reveal" aria-label="Galaxy Z Fold8 Ultra">
      <h1 className="ultra-reveal__kicker" dir="ltr">GALAXY Z · FOLD8 ULTRA</h1>
      <div className="ultra-reveal__canvas">
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="ultra-reveal__video"
        />
      </div>
    </section>
  )
}
