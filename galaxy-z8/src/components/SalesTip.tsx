export default function SalesTip({ text }: { text: string }) {
  return (
    <div className="ultra-sales-tip" dir="rtl">
      <span className="ultra-sales-tip__icon" aria-hidden="true">💡</span>
      <div>
        <span className="ultra-sales-tip__label">טיפ לנציג: </span>
        <span className="ultra-sales-tip__text">{text}</span>
      </div>
    </div>
  )
}
