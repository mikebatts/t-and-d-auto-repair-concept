import { useRef } from 'react'
import { ArrowRight, ClipboardCheck, SprayCan, Wrench, Zap, type LucideIcon } from 'lucide-react'
import { services, type ServiceKey } from '../lib/business'
import { useRequest } from '../lib/request'
import { useReveal } from '../lib/useReveal'
import './ServiceBento.css'

const icons: Record<ServiceKey, LucideIcon> = {
  mechanical: Wrench,
  electrical: Zap,
  bodywork: SprayCan,
  inspection: ClipboardCheck,
}

export default function ServiceBento() {
  const scope = useRef<HTMLElement>(null)
  const { openRequest } = useRequest()
  useReveal(scope)

  return (
    <section
      id="service"
      className="section bento-section"
      aria-labelledby="service-title"
      ref={scope}
    >
      <div className="container">
        <header className="chapter">
          <p className="chapter__run">
            <span>Service</span>
          </p>
          <h2 id="service-title" className="chapter__title">
            Four kinds of work. One conversation.
          </h2>
          <p className="chapter__lede">
            Mechanical, electrical, bodywork, and the state inspection are all handled at one
            address, so the car stays in one place and you talk to one shop.
          </p>
        </header>

        <ul className="bento">
          {services.map((s, i) => {
            const Icon = icons[s.key]
            return (
              <li
                key={s.key}
                className={`bento__cell bento__cell--${s.span === 7 ? 'wide' : 'narrow'}`}
                data-reveal
                data-reveal-delay={i * 0.08}
              >
                <div className="bento__main">
                  <div className="bento__head">
                    <span className="bento__icon" aria-hidden="true">
                      <Icon size={22} strokeWidth={1.75} />
                    </span>
                    <h3 className="bento__title">{s.title}</h3>
                  </div>
                  <p className="bento__lede">{s.lede}</p>
                  <button
                    type="button"
                    className="btn btn--text bento__cta"
                    onClick={(e) => openRequest(s.key, e.currentTarget)}
                  >
                    Start a request
                    <ArrowRight size={18} aria-hidden="true" />
                    <span className="visually-hidden">, {s.title}</span>
                  </button>
                </div>
                <ul className="bento__examples" aria-label={`${s.title} examples`}>
                  {s.examples.map((ex) => (
                    <li key={ex}>{ex}</li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
