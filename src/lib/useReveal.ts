import type { RefObject } from 'react'
import { gsap, MOTION_OK, useGSAP } from './gsap'

/**
 * One-shot entrance for every `[data-reveal]` element inside `scope`. The
 * default rises into place; `data-reveal="left"` slides in along the reading
 * direction instead. Built inside a reduced-motion matchMedia context, so
 * visitors who prefer reduced motion never receive a hidden initial state.
 * Reverted on unmount.
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          const fromLeft = el.dataset.reveal === 'left'
          gsap.from(el, {
            autoAlpha: 0,
            x: fromLeft ? -24 : 0,
            y: fromLeft ? 0 : 28,
            duration: 0.9,
            delay: Number(el.dataset.revealDelay ?? 0),
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          })
        })
      })
    },
    { scope },
  )
}
