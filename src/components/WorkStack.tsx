import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { DESKTOP, gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import { serviceLabel, type ServiceKey } from '../lib/business'
import { images, type ImageSet } from '../lib/images'
import { useRequest } from '../lib/request'
import { useReveal } from '../lib/useReveal'
import './WorkStack.css'

interface Card {
  key: ServiceKey
  title: string
  body: string
  image: ImageSet
}

const cards: Card[] = [
  {
    key: 'mechanical',
    title: 'Engines, drivetrains, and the everyday work.',
    body: 'From an oil change to an engine out of the car. Customers keep saying the same thing: told what the car needs, and what it doesn’t.',
    image: images.mechanical,
  },
  {
    key: 'electrical',
    title: 'Warning lights, read properly.',
    body: 'Current scanners and computers on the bench, then a walk through the reading instead of a shrug. Hybrids and EVs included.',
    image: images.electrical,
  },
  {
    key: 'bodywork',
    title: 'Collision work, seen through.',
    body: 'Dents, panels, and accident repair in the same building as the mechanical work, so the car doesn’t bounce between shops. Customers mention the insurance side being explained, not just handled.',
    image: images.bodywork,
  },
]

/**
 * Card stacking. Cards are sticky on desktop when motion is allowed; GSAP
 * scrubs the card underneath down to 94% as the next one slides over it.
 * Below 1024px, and for reduced-motion visitors, the cards are plain flow.
 */
export default function WorkStack() {
  const scope = useRef<HTMLElement>(null)
  const { openRequest } = useRequest()
  useReveal(scope)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const els = gsap.utils.toArray<HTMLElement>('.stack__card')
        els.forEach((card, i) => {
          const next = els[i + 1]
          if (!next) return
          gsap.to(card, {
            scale: 0.94,
            transformOrigin: 'center top',
            ease: 'none',
            scrollTrigger: {
              trigger: next,
              start: 'top bottom',
              end: 'top top+=120',
              scrub: true,
            },
          })
        })
      })
    },
    { scope },
  )

  return (
    <section id="work" className="section work" aria-labelledby="work-title" ref={scope}>
      <div className="container">
        <header className="chapter">
          <p className="chapter__run">
            <span>Work</span>
          </p>
          <h2 id="work-title" className="chapter__title">
            What comes through the door.
          </h2>
          <p className="chapter__lede">
            Three kinds of jobs, and how customers describe them. The images are concept renders,
            not photographs of the shop.
          </p>
        </header>

        <div className="stack">
          {cards.map((c) => (
            <article className="stack__card" key={c.key} data-reveal>
              <div className="stack__media">
                <img
                  src={c.image.src}
                  srcSet={c.image.srcSet}
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  width={c.image.width}
                  height={c.image.height}
                  alt={c.image.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="stack__body">
                <p className="stack__kicker">
                  <span className="tick" aria-hidden="true" />
                  {serviceLabel[c.key]}
                </p>
                <h3 className="stack__title">{c.title}</h3>
                <p className="stack__text">{c.body}</p>
                <button
                  type="button"
                  className="btn btn--ghost stack__cta"
                  onClick={(e) => openRequest(c.key, e.currentTarget)}
                >
                  Start a request
                  <ArrowRight size={18} aria-hidden="true" />
                  <span className="visually-hidden">, {serviceLabel[c.key]}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
