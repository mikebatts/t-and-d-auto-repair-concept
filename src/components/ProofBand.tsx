import { Star } from 'lucide-react'
import { business } from '../lib/business'
import './ProofBand.css'

export default function ProofBand() {
  return (
    <section className="proof" aria-label="Google rating, years in business, and hours">
      <div className="container">
        <ul className="proof__row">
          <li className="proof__cell">
            <span className="proof__big">
              {business.google.rating}
              <Star size={22} aria-hidden="true" className="proof__star" />
            </span>
            <span className="proof__small">on Google</span>
          </li>
          <li className="proof__cell">
            <span className="proof__big">{business.google.reviews}</span>
            <span className="proof__small">reviews</span>
          </li>
          <li className="proof__cell">
            <span className="proof__big">Since {business.since}</span>
            <span className="proof__small">serving the neighborhood</span>
          </li>
          <li className="proof__cell">
            <span className="proof__big">Mon–Sat</span>
            <span className="proof__small">8 AM to 5 PM · Sunday closed</span>
          </li>
        </ul>
        <p className="proof__note">
          Google rating and review count checked {business.google.checked}. Years in business as
          published by T&amp;D.
        </p>
      </div>
    </section>
  )
}
