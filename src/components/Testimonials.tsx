import { useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import { business, testimonials } from '../lib/business'
import { useReveal } from '../lib/useReveal'
import './Testimonials.css'

/**
 * Controlled testimonial carousel: one excerpt at a time, Previous/Next,
 * arrow keys while the controls are focused, a polite live region, and no
 * autoplay. Non-active slides are removed with `hidden`.
 */
export default function Testimonials() {
  const scope = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const count = testimonials.length
  useReveal(scope)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '.carousel__slide:not([hidden])',
          { autoAlpha: 0, x: 28 * direction },
          { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power2.out' },
        )
      })
    },
    { scope, dependencies: [index] },
  )

  const go = (delta: 1 | -1) => {
    setDirection(delta)
    setIndex((i) => (i + delta + count) % count)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
  }

  return (
    <section id="reviews" className="section reviews" aria-labelledby="reviews-title" ref={scope}>
      <div className="container">
        <header className="chapter">
          <p className="chapter__run">
            <span>Reviews</span>
          </p>
          <h2 id="reviews-title" className="chapter__title">
            What customers keep saying.
          </h2>
          <p className="chapter__lede">
            Excerpts from the customer testimonials T&amp;D publishes on its own website, quoted as
            written. Not Google reviews.
          </p>
        </header>

        <div
          className="carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
          onKeyDown={onKeyDown}
          data-reveal
        >
          <div className="carousel__viewport" aria-live="polite" aria-atomic="true">
            {testimonials.map((t, i) => (
              <figure
                key={t.name}
                className="carousel__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                hidden={i !== index}
              >
                <blockquote className="carousel__quote">
                  <p>“{t.quote}”</p>
                </blockquote>
                <figcaption className="carousel__cite">
                  <span className="tick" aria-hidden="true" />
                  <cite>{t.name}</cite>
                  <span className="carousel__source">testimonial on {business.siteLabel}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="carousel__controls">
            <button
              type="button"
              className="btn btn--ghost btn--icon carousel__btn"
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <span className="carousel__count">
              {index + 1} of {count}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--icon carousel__btn"
              onClick={() => go(1)}
              aria-label="Next testimonial"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
