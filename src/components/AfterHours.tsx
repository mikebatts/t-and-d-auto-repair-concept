import { useRef, useState } from 'react'
import { Moon, NotebookPen, PhoneIncoming } from 'lucide-react'
import { business } from '../lib/business'
import { useReveal } from '../lib/useReveal'
import ReceptionistDialog from './ReceptionistDialog'
import './AfterHours.css'

/**
 * Optional, secondary concept. The shop phone stays primary; this shows what
 * an after-hours intake could capture. It is labelled as a demo throughout and
 * never diagnoses, quotes, books, or sends anything.
 */
export default function AfterHours() {
  const scope = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<HTMLElement | null>(null)
  useReveal(scope)

  return (
    <section id="after-hours" className="section after" aria-labelledby="after-title" ref={scope}>
      <div className="container after__grid">
        <div className="after__copy">
          <p className="chapter__run">
            <span>Optional add-on</span>
          </p>
          <h2 id="after-title" className="chapter__title">
            After-hours calls, captured.
          </h2>
          <p className="after__tag">
            <span className="dot" aria-hidden="true" />
            Concept demo—not live
          </p>
          <p className="after__lede">
            The shop phone is the front door, and it stays that way. This is a separate idea for the
            hours the bay is closed: a receptionist that takes down the job and hands the crew a
            callback summary for the morning.
          </p>
          <ul className="after__list">
            <li>
              <PhoneIncoming size={20} aria-hidden="true" />
              <span>Answers when the shop is closed, {business.hoursShort} otherwise.</span>
            </li>
            <li>
              <NotebookPen size={20} aria-hidden="true" />
              <span>Collects name, callback number, vehicle, job type, and what happened.</span>
            </li>
            <li>
              <Moon size={20} aria-hidden="true" />
              <span>Never diagnoses, quotes, or books. The crew makes every call.</span>
            </li>
          </ul>
          <button
            type="button"
            className="btn btn--ink btn--lg after__cta"
            onClick={(e) => {
              setTrigger(e.currentTarget)
              setOpen(true)
            }}
          >
            Try the simulated call
          </button>
        </div>

        <aside
          className="after__sample surface-dark"
          aria-labelledby="after-sample-title"
          data-reveal
        >
          <p id="after-sample-title" className="after__sample-title">
            Example callback summary
          </p>
          <dl className="after__sample-list">
            <div>
              <dt>Caller</dt>
              <dd>Example name</dd>
            </div>
            <div>
              <dt>Callback</dt>
              <dd>Number given by the caller</dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>Year, make, model, and powertrain</dd>
            </div>
            <div>
              <dt>Job type</dt>
              <dd>Mechanical, electrical, bodywork, inspection, or not sure</dd>
            </div>
            <div>
              <dt>What happened</dt>
              <dd>The caller’s own words, unedited</dd>
            </div>
            <div>
              <dt>Safe to drive</dt>
              <dd>Caller’s answer, flagged if no</dd>
            </div>
          </dl>
          <p className="after__sample-note">Illustrative fields only. No real calls are taken.</p>
        </aside>
      </div>

      <ReceptionistDialog open={open} returnFocusTo={trigger} onClose={() => setOpen(false)} />
    </section>
  )
}
