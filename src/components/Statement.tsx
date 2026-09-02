import { useRef } from 'react'
import { gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import './Statement.css'

const TEXT =
  'Straight answers on what’s wrong, what it costs, and what can wait. Mechanical and collision under one roof, so the same shop sees the job through.'

/** Scrubbing text reveal: each word brightens as the statement moves up the viewport. */
export default function Statement() {
  const scope = useRef<HTMLElement>(null)

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
        <p className="statement__note">
          <span className="tick" aria-hidden="true" />
          The things customers mention most in their reviews: honesty, explanation, communication,
          and a fair price.
        </p>
      </div>
    </section>
  )
}
