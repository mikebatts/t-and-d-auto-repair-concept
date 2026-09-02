import { business } from '../lib/business'
import Monogram from './Monogram'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer surface-deep">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Monogram />
          <p className="site-footer__name">
            {business.short} <span aria-hidden="true">/</span> Auto Repair
          </p>
          <address className="site-footer__address">
            {business.street}
            <br />
            {business.cityLine}
          </address>
        </div>

        <dl className="site-footer__facts">
          <div>
            <dt>Shop</dt>
            <dd>
              <a href={business.shopPhone.href}>{business.shopPhone.display}</a>
            </dd>
          </div>
          <div>
            <dt>Cell</dt>
            <dd>
              <a href={business.cellPhone.href}>{business.cellPhone.display}</a>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={business.emailHref}>{business.email}</a>
            </dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>Mon–Sat 8 AM–5 PM · Sun closed</dd>
          </div>
        </dl>

        <nav className="site-footer__nav" aria-label="Footer">
          <a href="#service">Service</a>
          <a href="#work">Work</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>

      <div className="container site-footer__legal">
        <p className="site-footer__disclosure">
          Independent speculative redesign by Design For Anyone. Not affiliated with or endorsed by
          T &amp; D Auto Repair.
        </p>
        <p>
          Business details from {business.siteLabel} and the shop’s Google Business Profile, checked{' '}
          {business.google.checked}. Images are original concept renders, not photographs of the
          shop. Forms on this page are demonstrations and send nothing.
        </p>
      </div>
    </footer>
  )
}
