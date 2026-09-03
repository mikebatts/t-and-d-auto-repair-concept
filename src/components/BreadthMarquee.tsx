import { BatteryCharging, Fuel, Globe } from 'lucide-react'
import { breadth } from '../lib/business'
import './BreadthMarquee.css'

/**
 * Infinite marquee of the shop's own published service range. CSS-only,
 * paused on hover and focus, and rendered as a static wrapped row for
 * reduced-motion visitors. The second copy exists only for the loop.
 */
export default function BreadthMarquee() {
  return (
    <section className="breadth surface-dark" aria-labelledby="breadth-title">
      <div className="container breadth__head">
        <h2 id="breadth-title" className="breadth__title">
          Old and new, foreign and domestic. Gas, diesel, hybrid, and electric.
        </h2>
        <p className="breadth__note">
          <Globe size={16} aria-hidden="true" />
          <Fuel size={16} aria-hidden="true" />
          <BatteryCharging size={16} aria-hidden="true" />
          <span>T&amp;D’s published service range.</span>
        </p>
      </div>
      <div className="marquee">
        <ul className="marquee__track" aria-label="Service range">
          {breadth.map((b) => (
            <li key={b} className="marquee__item">
              {b}
            </li>
          ))}
        </ul>
        <ul className="marquee__track marquee__track--copy" aria-hidden="true">
          {breadth.map((b) => (
            <li key={b} className="marquee__item">
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
