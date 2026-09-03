import { useRef } from 'react'
import { gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import { business, standards } from '../lib/business'
import { useReveal } from '../lib/useReveal'
import './Statement.css'

/** The shop's own philosophy in one line: accurate diagnosis, the right parts, clear pricing, and a customer kept for years. */
const TEXT =
  'Find the real problem, fix it with the right parts, say what it costs, and earn the next visit.'

/**
 * Scrubbing text reveal: each word brightens as the statement moves up the
 * viewport. Under it, T&D's four published standards as a hairline ledger,
 * and the Google review topics that corroborate them.
 */
export default function Statement() {
  const scope = useRef<HTMLElement>(null)
  useReveal(scope)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '.statement__word',
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.08,
            scrollTrigger: {
              trigger: '.statement__text',
              start: 'top 78%',
              end: 'bottom 42%',
              scrub: 0.4,
            },
          },
        )
      })
    },
    { scope },
  )

  const words = TEXT.split(' ')

  return (
    <section className="statement surface-dark" aria-label="How the shop works" ref={scope}>
      <div className="container">
        <p className="statement__text">
          {words.map((w, i) => (
            <span key={i}>
              <span className="statement__word">{w}</span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </p>
        <ul className="statement__standards" aria-label="T&amp;D’s published standards">
          {standards.map((s, i) => (
            <li
              key={s.title}
              className="statement__standard"
              data-reveal
              data-reveal-delay={i * 0.08}
            >
              <strong className="statement__standard-title">{s.title}</strong>
              <span className="statement__standard-text">{s.text}</span>
            </li>
          ))}
        </ul>
        <p className="statement__note">
          <span className="tick" aria-hidden="true" />
          T&amp;D’s own standards. On Google, reviewers most often mention {business.google.topics}.
        </p>
      </div>
    </section>
  )
}
