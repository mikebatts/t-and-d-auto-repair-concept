import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import type { ServiceKey } from './lib/business'
import { RequestContext } from './lib/request'
import { initialReviewMode, stripReviewParam } from './lib/review'
import SkipLink from './components/SkipLink'
import OwnerReview from './components/OwnerReview'
import Header from './components/Header'
import Hero from './components/Hero'
import ProofBand from './components/ProofBand'
import ServiceBento from './components/ServiceBento'
import Statement from './components/Statement'
import WorkStack from './components/WorkStack'
import Testimonials from './components/Testimonials'
import BreadthMarquee from './components/BreadthMarquee'
import AfterHours from './components/AfterHours'
import Contact from './components/Contact'
import Footer from './components/Footer'
import MobileDock from './components/MobileDock'
import RequestDialog from './components/RequestDialog'

interface RequestState {
  open: boolean
  service: ServiceKey | ''
  /** Bumped on every open so the form remounts with fresh, empty state. */
  seq: number
  /** The control that opened the dialog; focus returns to it on close. */
  trigger: HTMLElement | null
}

export default function App() {
  const [review, setReview] = useState(initialReviewMode)
  const [request, setRequest] = useState<RequestState>({
    open: false,
    service: '',
    seq: 0,
    trigger: null,
  })
  const exiting = useRef(false)

  const openRequest = useCallback((service?: ServiceKey, trigger?: HTMLElement | null) => {
    setRequest((r) => ({
      open: true,
      service: service ?? '',
      seq: r.seq + 1,
      trigger: trigger ?? null,
    }))
  }, [])
  const closeRequest = useCallback(() => {
    setRequest((r) => (r.open ? { ...r, open: false } : r))
  }, [])
  const api = useMemo(() => ({ openRequest }), [openRequest])

  // Web fonts change line wrapping; recompute every ScrollTrigger once they are in.
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Leaving review mode removes a tall block above the site: recompute every
  // ScrollTrigger, return to the top, and hand focus to the customer H1.
  useEffect(() => {
    ScrollTrigger.refresh()
    if (!review && exiting.current) {
      exiting.current = false
      window.scrollTo({ top: 0, behavior: 'auto' })
      document.getElementById('hero-title')?.focus()
    }
  }, [review])

  const exitReview = useCallback(() => {
    stripReviewParam()
    exiting.current = true
    setReview(false)
  }, [])

  return (
    <RequestContext.Provider value={api}>
      <SkipLink />
      {review && <OwnerReview onExit={exitReview} />}
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero headingLevel={review ? 2 : 1} />
        <ProofBand />
        <ServiceBento />
        <Statement />
        <WorkStack />
        <Testimonials />
        <BreadthMarquee />
        <AfterHours />
        <Contact />
      </main>
      <Footer />
      <MobileDock review={review} />
      <RequestDialog
        key={request.seq}
        open={request.open}
        service={request.service}
        returnFocusTo={request.trigger}
        onClose={closeRequest}
      />
    </RequestContext.Provider>
  )
}
