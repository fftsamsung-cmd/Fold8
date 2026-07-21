import SalesTip from './SalesTip'
import { Eyebrow } from './SectionKit'
import galaxyAiVideo from '../assets/Ultra/galaxy-ai.mp4'
import followCamVideo from '../assets/Ultra/GalaxyAI/hf_20260716_202436_9f3893e7-a5f8-458f-90f0-cecf295e0f1d.mp4'

export type GalaxyAiCardData = {
  video: string
  title: string
  subtitle?: string
  tags: string[]
  desc: string
  steps: string[]
  examples: string[]
  tip: string
}

/* Shared copy for both the desktop FollowCamCard/PhotoAssistCard below and
   the mobile GalaxyAiMobileCard (CameraFrameSection's compact branch) — one
   source of truth so the two layouts can never drift out of sync. */
export const FOLLOWCAM_DATA: GalaxyAiCardData = {
  video: followCamVideo,
  title: 'Follow Cam',
  subtitle: 'תכונת מעקב אוטומטי ייחודית',
  tags: ['Z Fold8 Ultra', 'Z Fold8', 'Z Flip8'],
  desc: 'מעקב מצלמה אחרי תנועות פנים למרכוז אופטימלי של הפריים — המצלמה זזה איתכם לקבלת תוצאות מושלמות ל-Reels בלחיצת כפתור אחת.',
  steps: [
    'היכנסו לגלריה, בחרו סרטון וידאו והקישו על אייקון ה-Galaxy AI',
    'לחצו על האפשרות למיסגור אוטומטי, סמנו את הדמות הרצויה והקישו על הבא',
    'בחרו את יחס הגובה-רוחב (Aspect Ratio) הרצוי למיסגור מחדש של הסרטון',
  ],
  examples: [
    'התמקדות ברקדן אחד במהלך הופעה',
    'הפיכת הסרטון מוידאו רחב לתוכן ויראלי: התאמה מושלמת של סרטוני הטיולים שלכם לכל פלטפורמה',
  ],
  tip: 'הראו ללקוח איך המצלמה עוקבת אחרי הדמות תוך כדי תנועה — אפקט מרשים שממחיש בדיוק את הערך של Reels מוכנים בלחיצת כפתור אחת.',
}

export const PHOTO_ASSIST_DATA: GalaxyAiCardData = {
  video: galaxyAiVideo,
  title: 'עריכת תמונות חכמה',
  tags: ['Z Fold8 Ultra', 'Z Fold8', 'Z Flip8'],
  desc: 'עריכת תמונות חכמה מתמיד: פשוט הקלידו את הבקשה שלכם וטכנולוגיית Photo Assist תבצע את העריכה עבורכם, למשל: "תלביש כובע על הכלב".',
  steps: [
    "היכנסו לגלריה, בחרו באייקון ה-Galaxy AI ולאחר מכן לחצו על 'יצירה'",
    'הקישו על סמל הוספת התמונה, ולאחר מכן בחרו מתוך הגלריה את התמונה הרצויה.',
    'כיתבו בשורת הטקסט את מה שתרצו לשנות והקישו על כפתור היצירה.',
  ],
  examples: [
    'צילום תמונות אוכל מושלמות שנראות שלמות לחלוטין, גם אם כבר לקחתם ביס',
    'צילום תמונות באתרי טיולים ושינוי סגנון הלבוש בלחיצת כפתור כדי שיתאים בול לאווירה של המקום.',
  ],
  tip: 'הדגימו ללקוח בקשת עריכה חופשית בשפה טבעית על תמונה משלו — התוצאה המיידית תמיד עושה רושם.',
}

/* Shared tags row — device-availability label + the pill list, used by all
   three card variants below (desktop FollowCamCard/PhotoAssistCard, mobile
   GalaxyAiMobileCard) so the label can't drift out of sync between them. */
function TagsRow({ tags }: { tags: string[] }) {
  return (
    <div className="followcam__tags">
      <span className="followcam__tags-label">זמין בדגמי:</span>
      {tags.map((tagLabel) => (
        <span className="followcam__tag" dir="ltr" key={tagLabel}>{tagLabel}</span>
      ))}
    </div>
  )
}

/* Desktop AI-feature card — shared by Follow Cam and Photo Assist (they were
   two near-identical copies of this exact markup, differing only by an
   optional subtitle and sectionName). Rendered by CameraFrameSection/
   FoldCameraFrameSection, which drive the entrance/crossfade timing. */
export function GalaxyAiDesktopCard({ data, sectionName }: { data: GalaxyAiCardData; sectionName?: string }) {
  return (
    <div className="ultra-galaxyai-stack__inner">
      <div className="followcam__header">
        <div className="followcam__intro">
          {sectionName && (
            <div className="ultra-mobile-only">
              <Eyebrow>{sectionName}</Eyebrow>
            </div>
          )}
          <h2 className="followcam__title" dir="ltr">{data.title}</h2>
          {data.subtitle && <p className="followcam__subtitle">{data.subtitle}</p>}
          <TagsRow tags={data.tags} />
          <p className="followcam__desc">{data.desc}</p>
          <div className="followcam__block">
            <div className="followcam__label">שלבי ההדגמה במכשיר</div>
            <div className="followcam__steps">
              {data.steps.map((step, i) => (
                <div className="followcam__step" key={step}>
                  <span className="followcam__step-index" dir="ltr">{i + 1}</span>
                  <span className="followcam__step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="followcam__media-col">
          <div className="followcam__media">
            <video src={data.video} autoPlay loop muted playsInline />
          </div>
          <div className="followcam__block followcam__block--examples">
            <div className="followcam__label">דוגמאות לשימוש</div>
            <div className="followcam__examples">
              {data.examples.map((example) => (
                <div className="followcam__example" key={example}>{example}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SalesTip text={data.tip} />
    </div>
  )
}

/* Mobile-only reveal card for CameraFrameSection's compact branch: video +
   title/subtitle/tags/desc stay fixed on screen the whole time; the device
   demo steps sit in a reserved "swap" box beneath, and — driven externally
   by refs the parent's own scroll-scrubbed tick already writes to (same
   technique as the specs/steps crossfade above it) — an opaque "examples +
   tip" sheet rises up to physically cover the steps, while a scrim dims
   everything behind it except the video, then holds. Requesting component
   (CameraFrameSection) owns all animation via these three refs; this
   component only lays out the DOM and never reads/writes their values. */
export function GalaxyAiMobileCard({
  data,
  scrimRef,
  sheetRef,
}: {
  data: GalaxyAiCardData
  scrimRef: React.RefObject<HTMLDivElement>
  sheetRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <div className="ultra-galaxyai-mobile" dir="rtl">
      <div className="ultra-galaxyai-mobile__media">
        <video src={data.video} autoPlay loop muted playsInline />
      </div>
      <div className="ultra-galaxyai-mobile__body">
        <div className="ultra-galaxyai-mobile__header">
          <h2 className="followcam__title" dir="ltr">{data.title}</h2>
          {data.subtitle && <p className="followcam__subtitle">{data.subtitle}</p>}
          <TagsRow tags={data.tags} />
          <p className="followcam__desc">{data.desc}</p>
        </div>

        <div className="ultra-galaxyai-mobile__swap">
          <div className="followcam__label">שלבי ההדגמה במכשיר</div>
          <div className="followcam__steps">
            {data.steps.map((step, i) => (
              <div className="followcam__step" key={step}>
                <span className="followcam__step-index" dir="ltr">{i + 1}</span>
                <span className="followcam__step-text">{step}</span>
              </div>
            ))}
          </div>

          {/* Scrim — dims only the steps above, never the header/video.
              Un-z-indexed ancestors on both this and the sheet below are
              required for the sheet to actually paint above it (a z-index
              set anywhere on .ultra-galaxyai-mobile__swap itself would trap
              the sheet in a local stacking context capped at that level,
              which is exactly the "examples appear washed out behind the
              dim" bug this replaced). */}
          <div ref={scrimRef} className="ultra-galaxyai-mobile__scrim" />

          {/* Opaque sheet — slides up from below to cover the steps above
              exactly (see COMPACT_CARD* comment in CameraFrameSection). */}
          <div ref={sheetRef} className="ultra-galaxyai-mobile__sheet">
            <div className="followcam__label">דוגמאות לשימוש</div>
            <div className="followcam__examples">
              {data.examples.map((example) => (
                <div className="followcam__example" key={example}>{example}</div>
              ))}
            </div>
            <SalesTip text={data.tip} />
          </div>
        </div>
      </div>
    </div>
  )
}


