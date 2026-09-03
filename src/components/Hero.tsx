import { Fragment, useRef } from 'react'
import { ArrowRight, Phone, Star } from 'lucide-react'
import { gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import { business } from '../lib/business'
import { images } from '../lib/images'
import { useRequest } from '../lib/request'
import './Hero.css'

const TITLE = 'One shop for the whole car.'

interface HeroProps {
  /** Review mode owns the H1, so the hero heading steps down to H2 there. */
  headingLevel: 1 | 2
}

export default function Hero({ headingLevel }: HeroProps) {
  const scope = useRef<HTMLElement>(null)
  const { openRequest } = useRequest()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.hero__word-inner', { yPercent: 110, duration: 0.9, stagger: 0.07 }, 0.1)
          .from(
            '.hero__lede, .hero__actions, .hero__ledger',
            { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.09 },
            '-=0.5',
          )
          .fromTo(
            '.hero__plane',
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power4.inOut' },
            '-=0.8',
          )
          .from('.hero__img', { scale: 1.08, duration: 1.8, ease: 'power2.out' }, '<')
      })
    },
    { scope },
  )

  // The space sits outside the overflow-hidden mask; inside it would be trimmed
  // and the words would run together.
  const words = TITLE.split(' ').map((word, i, all) => (
    <Fragment key={word}>
      <span className="hero__word">
        <span className="hero__word-inner">{word}</span>
      </span>
      {i < all.length - 1 ? ' ' : null}
    </Fragment>
  ))

  return (
    <section className="hero surface-dark" aria-labelledby="hero-title" ref={scope}>
      <div className="hero__grid">
        {headingLevel === 1 ? (
          <h1 id="hero-title" className="hero__title" tabIndex={-1}>
            {words}
          </h1>
        ) : (
          <h2 id="hero-title" className="hero__title" tabIndex={-1}>
            {words}
          </h2>
        )}

        <div className="hero__copy">
          <p className="hero__lede">
            Mechanical, collision, electrical, and New York State inspections, by ASE-certified
            technicians. On 4th Avenue since {business.since}.
          </p>
          <div className="hero__actions" data-hero-actions>
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
              Call {business.shopPhone.display}
            </a>
          </div>
          <p className="hero__ledger">
            <span className="tick" aria-hidden="true" />
            <span className="hero__ledger-rating">
              <Star size={14} aria-hidden="true" />
              {business.google.rating} on Google
            </span>
            <span className="hero__ledger-sep" aria-hidden="true">
              ·
            </span>
            {business.street}, Brooklyn
            <span className="hero__ledger-sep" aria-hidden="true">
              ·
            </span>
            {business.hoursShort}
          </p>
        </div>

        <figure className="hero__plane">
          <img
            className="hero__img"
            src={images.hero.src}
            srcSet={images.hero.srcSet}
            sizes="(min-width: 1024px) 52vw, 100vw"
            width={images.hero.width}
            height={images.hero.height}
            alt={images.hero.alt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <figcaption className="visually-hidden">
            Concept render of the 4th Avenue storefront, generated for this preview. Not a
            photograph.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
