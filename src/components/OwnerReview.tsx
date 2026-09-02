import { useRef, useState } from 'react'
import {
  Accessibility,
  ArrowDown,
  ClipboardList,
  Eye,
  FileText,
  LayoutGrid,
  Moon,
  Rocket,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import { business } from '../lib/business'
import { useReveal } from '../lib/useReveal'
import './OwnerReview.css'

interface OwnerReviewProps {
  onExit: () => void
}

interface Row {
  label: string
  today: string
  concept: string
}

/** Every "today" line was checked against tdautony.com and the Google profile on September 2, 2026. */
const rows: Row[] = [
  {
    label: 'Opening',
    today: 'The headline is the logo image. The page’s H1 has no readable text.',
    concept: 'One line a customer can read on any phone: “One shop for the whole car.”',
  },
  {
    label: 'Proof',
    today: '4.9 from 102 Google reviews is not in the opening screen.',
    concept: 'Rating, review count, years, and hours sit directly under the headline.',
  },
  {
    label: 'Services',
    today: 'Four labels: Mechanical, Bodywork, Electrical, Inspection.',
    concept: 'Each area lists examples and has its own Start a request button.',
  },
  {
    label: 'Requests',
    today: 'Zero forms or inputs. Phone, cell, email, and a map link.',
    concept:
      'A guided request: name, phone, vehicle, kind of work, what’s going on, how to reach you. Simulated here.',
  },
  {
    label: 'After hours',
    today: 'No structured intake when the shop is closed.',
    concept: 'Optional receptionist that captures a callback summary. Demo only.',
  },
]

const deliverables: { icon: LucideIcon; text: string }[] = [
  { icon: Smartphone, text: 'Mobile-first redesign' },
  {
    icon: LayoutGrid,
    text: 'Clearer service architecture: the four areas, with examples and a path to a request',
  },
  { icon: ClipboardList, text: 'Guided estimate and request form' },
  { icon: FileText, text: 'Migration of the current content you approve' },
  { icon: Accessibility, text: 'Performance and accessibility QA' },
  { icon: Rocket, text: 'Launch support' },
]

export default function OwnerReview({ onExit }: OwnerReviewProps) {
  const scope = useRef<HTMLElement>(null)
  const [replied, setReplied] = useState(false)
  useReveal(scope)

  return (
    <section className="review" aria-labelledby="review-title" ref={scope}>
      <div className="container">
        <p className="review__run">
          <span className="tick" aria-hidden="true" />
          Prepared for {business.name} · owner review · September 2026
        </p>
        <h1 id="review-title" className="review__title" tabIndex={-1}>
          You already have the trust. This makes it easier to turn it into the next job.
        </h1>
        <p className="review__lede">
          An independent concept for {business.siteLabel}, built only from what is already public:
          your services, your testimonials, your Google rating, and your storefront. Everything
          below this panel is the site as a customer would see it.
        </p>
        <div className="review__actions">
          <button type="button" className="btn btn--ink btn--lg" onClick={onExit}>
            <Eye size={20} aria-hidden="true" />
            View customer site
          </button>
          <a className="btn btn--ghost btn--lg" href="#main">
            Scroll to the concept
            <ArrowDown size={20} aria-hidden="true" />
          </a>
        </div>

        <div className="review__compare" data-reveal>
          <div className="review__frames" aria-hidden="true">
            <figure className="frame">
              <div className="frame__screen frame__screen--today">
                <span className="frame__logo" />
                <span className="frame__line frame__line--short" />
                <span className="frame__labels">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="frame__pill" />
              </div>
              <figcaption>Today</figcaption>
            </figure>
            <figure className="frame">
              <div className="frame__screen frame__screen--concept">
                <span className="frame__headline" />
                <span className="frame__headline frame__headline--2" />
                <span className="frame__proof">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="frame__bento">
                  <i className="frame__bento--wide" />
                  <i />
                  <i />
                  <i className="frame__bento--wide" />
                </span>
                <span className="frame__cta" />
              </div>
              <figcaption>This concept</figcaption>
            </figure>
          </div>

          <div className="review__table" role="table" aria-label="Today compared with this concept">
            <div className="review__thead" role="row">
              <span role="columnheader">Area</span>
              <span role="columnheader">Today</span>
              <span role="columnheader">This concept</span>
            </div>
            {rows.map((r) => (
              <div className="review__tr" role="row" key={r.label}>
                <span className="review__td review__td--label" role="rowheader">
                  {r.label}
                </span>
                <span className="review__td" role="cell">
                  <span className="review__cell-key">Today</span>
                  {r.today}
                </span>
                <span className="review__td review__td--concept" role="cell">
                  <span className="review__cell-key">This concept</span>
                  {r.concept}
                </span>
              </div>
            ))}
          </div>
          <p className="review__foot">
            Checked against {business.siteLabel} and the Google Business Profile on{' '}
            {business.google.checked}.
          </p>
        </div>

        <div className="review__cols">
          <section className="review__block" aria-labelledby="review-kept" data-reveal>
            <h2 id="review-kept" className="review__h2">
              What’s kept
            </h2>
            <ul className="review__list">
              <li>The four service areas: mechanical, bodywork, electrical, inspection.</li>
              <li>Your customer testimonials, quoted exactly as written on the current site.</li>
              <li>Shop phone, cell, and email exactly as published.</li>
              <li>The charcoal-and-white storefront, carried into the palette.</li>
              <li>Foreign and domestic; gas, diesel, hybrid, electric: your published range.</li>
              <li>
                T&amp;D says its staff includes ASE Certified Technicians. The concept keeps that as
                your statement and does not recreate certification marks.
              </li>
              <li>Your past-work photos can replace the concept renders once you approve them.</li>
            </ul>
          </section>

          <section
            className="review__block review__block--price"
            aria-labelledby="review-scope"
            data-reveal
          >
            <h2 id="review-scope" className="review__h2">
              Deliverables
            </h2>
            <p className="review__price">
              <span className="review__price-num">$1,000</span>
              <span className="review__price-word">flat</span>
            </p>
            <ul className="review__deliverables">
              {deliverables.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="review__addon">
              <Moon size={18} aria-hidden="true" />
              <span>
                <strong>Optional add-on:</strong> an AI phone receptionist that answers after hours,
                collects job details, and hands off a callback summary. Final scope is discussed
                separately.
              </span>
            </p>
          </section>
        </div>

        <div className="review__close" data-reveal>
          <div className="review__yours">
            <h2 className="review__h2">What stays yours</h2>
            <p>
              Your phone numbers, reviews, wording, and business identity remain yours. This is an
              independent speculative redesign by Design For Anyone, not affiliated with or endorsed
              by {business.name}. Nothing on this page is live and nothing is sent.
            </p>
          </div>
          <div className="review__reply">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => setReplied(true)}
              aria-describedby="review-reply-note"
            >
              Reply to this email
            </button>
            <p id="review-reply-note" className="review__reply-note" aria-live="polite">
              {replied
                ? 'This preview can’t open your mail app. Reply directly to the email that brought you here. Nothing was sent from this page.'
                : 'Simulated in this preview: replying happens in your email thread, not on this page.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
