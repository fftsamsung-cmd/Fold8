import type { ReactNode } from 'react'
import './DeviceFrame.css'

export default function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-shell">
      <div className="device-frame">
        <span className="device-frame__hinge device-frame__hinge--top" aria-hidden="true" />
        <span className="device-frame__hinge device-frame__hinge--bottom" aria-hidden="true" />
        <span className="device-frame__btn device-frame__btn--vol" aria-hidden="true" />
        <span className="device-frame__btn device-frame__btn--pwr" aria-hidden="true" />
        <div className="device-frame__screen">
          <span className="device-frame__camera" aria-hidden="true" />
          <div className="device-frame__content">{children}</div>
        </div>
      </div>
    </div>
  )
}
