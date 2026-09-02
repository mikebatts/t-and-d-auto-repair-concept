import { useEffect, useState } from 'react'
import { ArrowRight, Phone } from 'lucide-react'
import { business } from '../lib/business'
import { useRequest } from '../lib/request'
import './MobileDock.css'

interface MobileDockProps {
  /**
   * Owner-review mode (`?review=1`). App owns this state and passes it down so
   * the dock never reads the URL itself. While the review panel is up the dock
   * is not rendered at all: on phones it sat over the comparison and the
   * deliverables before the customer concept began. "View customer site"
   * brings it back with its normal behavior.
   */
  review: boolean
}

/**
 * Sticky quick actions for phones. Hidden while the hero's own buttons are on
 * screen so the first viewport is not doubled up, then shown for the rest of
 * the page. Uses `visibility` so a hidden dock is also out of the tab order.
 */
export default function MobileDock({ review }: MobileDockProps) {
  const [visible, setVisible] = useState(false)
  const { openRequest } = useRequest()

  useEffect(() => {
    if (review) return
    const target = document.querySelector('[data-hero-actions]')
    if (!target) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0.2 },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [review])

  if (review) return null

  return (
    <div
      className="dock"
      data-visible={visible || undefined}
      role="group"
      aria-label="Quick actions"
    >
      <a className="btn btn--ghost dock__btn" href={business.shopPhone.href}>
        <Phone size={20} aria-hidden="true" />
        Call
      </a>
      <button
        type="button"
        className="btn btn--primary dock__btn"
        onClick={(e) => openRequest(undefined, e.currentTarget)}
      >
        Request
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
