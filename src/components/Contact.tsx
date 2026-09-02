import { useRef } from 'react'
import { ArrowRight, Clock, Mail, MapPin, Navigation, Phone, Smartphone } from 'lucide-react'
import { business } from '../lib/business'
import { useRequest } from '../lib/request'
import { useReveal } from '../lib/useReveal'
import './Contact.css'

export default function Contact() {
  const scope = useRef<HTMLElement>(null)
  const { openRequest } = useRequest()
  useReveal(scope)

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title" ref={scope}>
      <div className="container">
        <header className="chapter">
          <p className="chapter__run">
            <span>Contact</span>
          </p>
          <h2 id="contact-title" className="chapter__title">
            Come by, call, or send the details.
          </h2>
          <p className="chapter__lede">
            The shop picks up during business hours. Outside them, a request leaves the crew with
            everything they need to call you back.
          </p>
        </header>

        <div className="contact__grid">
          <div className="contact__ledger" data-reveal>
            <dl className="ledger">
              <div className="ledger__row">
                <dt className="ledger__key">
                  <MapPin size={16} aria-hidden="true" />
                  Address
                </dt>
                <dd className="ledger__val">
                  {business.street}
                  <br />
                  {business.cityLine}
                  <br />
                  <a
                    className="contact__link"
                    href={business.directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Directions
                    <Navigation size={14} aria-hidden="true" />
                    <span className="visually-hidden">(opens Google Maps in a new tab)</span>
                  </a>
                </dd>
              </div>
              <div className="ledger__row">
                <dt className="ledger__key">
                  <Phone size={16} aria-hidden="true" />
                  Shop
                </dt>
                <dd className="ledger__val">
                  <a className="contact__link" href={business.shopPhone.href}>
                    {business.shopPhone.display}
                  </a>
                </dd>
              </div>
              <div className="ledger__row">
                <dt className="ledger__key">
                  <Smartphone size={16} aria-hidden="true" />
                  Cell
                </dt>
                <dd className="ledger__val">
                  <a className="contact__link" href={business.cellPhone.href}>
                    {business.cellPhone.display}
                  </a>
                </dd>
              </div>
              <div className="ledger__row">
                <dt className="ledger__key">
                  <Mail size={16} aria-hidden="true" />
                  Email
                </dt>
                <dd className="ledger__val">
                  <a className="contact__link" href={business.emailHref}>
                    {business.email}
                  </a>
                </dd>
              </div>
              <div className="ledger__row">
                <dt className="ledger__key">
                  <Clock size={16} aria-hidden="true" />
                  Hours
                </dt>
                <dd className="ledger__val">
                  <ul className="contact__hours">
                    {business.hours.map((h) => (
                      <li key={h.days}>
                        <span>{h.days}</span>
                        <span>{h.time}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="contact__hours-note">Holiday hours may differ.</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="contact__cta surface-dark" data-reveal>
            <p className="contact__cta-kicker">
              <span className="tick" aria-hidden="true" />
              Start here
            </p>
            <p className="contact__cta-title">Tell the shop what’s going on.</p>
            <p className="contact__cta-text">
              Name, phone, vehicle, the kind of work, and a sentence about the problem. The crew
              calls or texts you back during shop hours.
            </p>
            <div className="contact__cta-actions">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={(e) => openRequest(undefined, e.currentTarget)}
              >
                Request service
                <ArrowRight size={20} aria-hidden="true" />
              </button>
              <a className="btn btn--ghost btn--lg" href={business.shopPhone.href}>
                <Phone size={20} aria-hidden="true" />
                Call the shop
              </a>
            </div>
            <p className="contact__cta-note">Concept demo—requests on this page are not sent.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
