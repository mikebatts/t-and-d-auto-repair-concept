/**
 * Original CSS/HTML monogram for the concept. Two letters, one cobalt rule.
 * It is deliberately not a reproduction of the shop's sign or logo.
 */
export default function Monogram({ className = '' }: { className?: string }) {
  return (
    <span className={`mono ${className}`.trim()} aria-hidden="true">
      <span className="mono__t">T</span>
      <span className="mono__rule" />
      <span className="mono__d">D</span>
    </span>
  )
}
