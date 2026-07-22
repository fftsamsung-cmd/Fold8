import './Footer.css'

const APP_STORE_URL = 'https://apps.apple.com/us/app/s-mobile/id6758027564'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.samsung.plus.mobile'

export default function Footer() {
  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-footer__inner">
        <div className="site-footer__text">
          <div className="site-footer__eyebrow-line" aria-hidden="true" />
          <h3 className="site-footer__title">הורידו את האפליקציה שלנו לעוד מידע</h3>
        </div>
        <div className="site-footer__badges">
          <a
            className="store-badge"
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            aria-label="הורידו מ-App Store"
          >
            <AppleIcon />
            <span className="store-badge__text">
              <span className="store-badge__small">Download on the</span>
              <span className="store-badge__big">App Store</span>
            </span>
          </a>
          <a
            className="store-badge"
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            aria-label="הורידו מ-Google Play"
          >
            <PlayIcon />
            <span className="store-badge__text">
              <span className="store-badge__small">GET IT ON</span>
              <span className="store-badge__big">Google Play</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.417 2.213-1.16 3.03-.83.91-2.183 1.62-3.29 1.53-.14-1.1.42-2.25 1.16-3.03.83-.88 2.24-1.55 3.29-1.53zM20.6 17.14c-.5 1.12-.73 1.62-1.37 2.6-.9 1.36-2.16 3.05-3.72 3.06-1.39.02-1.75-.9-3.63-.89-1.88.01-2.28.91-3.67.89-1.56-.02-2.75-1.54-3.65-2.9-2.5-3.79-2.77-8.23-1.22-10.6.9-1.38 2.5-2.34 4.09-2.34 1.63 0 2.65.9 4.02.9 1.31 0 2.11-.9 4.02-.9 1.4 0 2.9.76 3.97 2.07-3.49 1.91-2.92 6.86.16 8.11z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M3.6 2.4c-.35.35-.6.87-.6 1.47v16.26c0 .6.25 1.12.6 1.47l.1.08L13 12l-9.3-9.68-.1.08z" fill="#00d9ff" />
      <path d="M16.1 15.1 13 12l3.1-3.1 3.68 2.12c1.05.6 1.05 1.58 0 2.18L16.1 15.1z" fill="#ffbc00" />
      <path d="M16.1 15.1 13 12 3.6 21.6c.36.38 1 .43 1.7.05l10.8-6.55z" fill="#ff3d57" />
      <path d="M16.1 8.9 5.3 2.35c-.7-.38-1.34-.33-1.7.05L13 12l3.1-3.1z" fill="#00e177" />
    </svg>
  )
}
