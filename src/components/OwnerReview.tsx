import { useRef } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ClipboardList,
  Eye,
  LayoutGrid,
  Moon,
  PhoneIncoming,
  Rocket,
  ShieldCheck,
  Smartphone,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { business } from '../lib/business'
import { useReveal } from '../lib/useReveal'
import './OwnerReview.css'

interface OwnerReviewProps {
  onExit: () => void
}

interface Change {
  today: string
  concept: string
}

/** Every "today" entry was checked against tdautony.com and the Google profile on September 2, 2026. */
const changes: Change[] = [
  { today: 'Google reputation', concept: 'Visible immediately' },
  { today: 'Four service labels', concept: 'Examples + a next step' },
  { today: 'Call or email only', concept: 'Guided request form' },
  { today: 'No structured after-hours intake', concept: 'Optional callback summary' },
]

const included: { icon: LucideIcon; text: string }[] = [
  { icon: Smartphone, text: 'Mobile-first site' },
  { icon: ClipboardList, text: 'Service-request flow' },
  { icon: Rocket, text: 'Launch + handoff' },
]

/**
 * Owner-facing decision screen rendered above the customer site for
 * `?review=1`. Opening, three proof tiles, a four-row before/after ledger,
 * the flat price, the optional receptionist, and one disclaimer. Nothing here
 * is interactive beyond leaving review mode and an in-page anchor.
 */
export default function OwnerReview({ onExit }: OwnerReviewProps) {
  const scope = useRef<HTMLElement>(null)
  useReveal(scope)

  return (
    <section className="review" aria-labelledby="review-title" ref={scope}>
      <div className="container review__grid">
        <div className="review__open">
          <p className="review__run">
            <span className="tick" aria-hidden="true" />A website concept for {business.short} Auto
            Repair
          </p>
          <h1 id="review-title" className="review__title" tabIndex={-1}>
            Your reputation, easier to act on.
          </h1>
          <p className="review__lede">
            {business.google.rating} stars. {business.google.reviews} reviews. One mobile-first site
            for calls, service requests, and after-hours leads.
          </p>
          <div className="review__actions">
            <button type="button" className="btn btn--ink btn--lg" onClick={onExit}>
              <Eye size={20} aria-hidden="true" />
              View customer site
            </button>
            <a className="btn btn--ghost btn--lg" href="#review-changes">
              See what changed
              <ArrowDown size={20} aria-hidden="true" />
            </a>
          </div>
        </div>

        <ul className="review__proof" aria-label="What the concept leads with">
          <li className="review-tile" data-reveal>
            <span className="review-tile__icon" aria-hidden="true">
              <ShieldCheck size={20} strokeWidth={1.75} />
            </span>
            <span className="review-tile__big">
              {business.google.rating}
              <Star size={17} aria-hidden="true" className="review-tile__star" />
              <span className="visually-hidden">stars on Google</span>
            </span>
            <span className="review-tile__small">Trust up front</span>
          </li>
          <li className="review-tile" data-reveal data-reveal-delay={0.08}>
            <span className="review-tile__icon" aria-hidden="true">
              <LayoutGrid size={20} strokeWidth={1.75} />
            </span>
            <span className="review-tile__big">4 services</span>
            <span className="review-tile__small">One request flow</span>
          </li>
          <li className="review-tile" data-reveal data-reveal-delay={0.16}>
            <span className="review-tile__icon" aria-hidden="true">
              <Moon size={20} strokeWidth={1.75} />
            </span>
            <span className="review-tile__big">After hours</span>
            <span className="review-tile__small">Optional call capture</span>
          </li>
        </ul>

        <section
          id="review-changes"
          className="review__changes"
          aria-labelledby="review-changes-title"
        >
          <h2 id="review-changes-title" className="review__h2">
            What changed
          </h2>
          <div className="review-flow" role="table" aria-label="Today compared with this concept">
            <div className="review-flow__head" role="row">
              <span role="columnheader">Today</span>
              <span role="columnheader">This concept</span>
            </div>
            {changes.map((c, i) => (
              <div
                className="review-flow__row"
                role="row"
                key={c.today}
                data-reveal="left"
                data-reveal-delay={i * 0.07}
              >
                <span className="review-flow__from" role="cell">
                  {c.today}
                </span>
                <span className="review-flow__to" role="cell">
                  <ArrowRight size={18} aria-hidden="true" className="review-flow__arrow" />
                  {c.concept}
                </span>
              </div>
            ))}
          </div>
          <p className="review__foot">
            Checked against {business.siteLabel} and the Google Business Profile on{' '}
            {business.google.checked}.
          </p>
        </section>

        <div className="review__offer">
          <section className="review-offer surface-dark" aria-labelledby="review-offer-title">
            <h2 id="review-offer-title" className="visually-hidden">
              Price and scope
            </h2>
            <p className="review-offer__price">
              <span className="review-offer__num">$1,000</span>{' '}
              <span className="review-offer__word">flat</span>
            </p>
            <p className="review-offer__lede">Finish the site, connect the domain, hand it over.</p>
            <ul className="review-offer__list" aria-label="Included">
              {included.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="review-offer__next">
              To go ahead, reply to the email that brought you here.
            </p>
          </section>
          <aside className="review-addon" aria-label="Optional add-on">
            <PhoneIncoming size={20} aria-hidden="true" />
            <div>
              <p className="review-addon__title">Optional: AI phone receptionist</p>
              <p className="review-addon__text">
                Answers overflow or after-hours calls, collects the job details, and sends a
                callback summary.
              </p>
            </div>
          </aside>
        </div>

        <p className="review__legal">
          Speculative concept by Design For Anyone, not affiliated with or endorsed by{' '}
          {business.name}. The request and call demos on this page send nothing.
        </p>
      </div>
    </section>
  )
}
