import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Registered exactly once for the whole app. Every component imports from here.
gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Media conditions shared by every gsap.matchMedia() context. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const DESKTOP = '(min-width: 1024px)'

export { gsap, ScrollTrigger, useGSAP }
