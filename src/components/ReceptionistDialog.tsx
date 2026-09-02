import { useId, useState, type FormEvent } from 'react'
import { CircleCheck, Info } from 'lucide-react'
import { business } from '../lib/business'
import { isPhone } from '../lib/validate'
import Dialog from './Dialog'
import './ReceptionistDialog.css'

interface ReceptionistDialogProps {
  open: boolean
  returnFocusTo: HTMLElement | null
  onClose: () => void
}

type Powertrain = 'gas' | 'diesel' | 'hybrid' | 'electric' | 'unsure'
type Job = 'mechanical' | 'electrical' | 'bodywork' | 'inspection' | 'unsure'
type Safe = 'yes' | 'no' | 'unsure'

interface Answers {
  name: string
  phone: string
  vehicle: string
  powertrain: Powertrain | ''
  job: Job | ''
  story: string
  safe: Safe | ''
}

const empty: Answers = {
  name: '',
  phone: '',
  vehicle: '',
  powertrain: '',
  job: '',
  story: '',
  safe: '',
}

const powertrainLabel: Record<Powertrain, string> = {
  gas: 'Gas',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
  unsure: 'Not sure',
}

const jobLabel: Record<Job, string> = {
  mechanical: 'Mechanical',
  electrical: 'Electrical',
  bodywork: 'Bodywork',
  inspection: 'Inspection',
  unsure: 'Not sure',
}

const safeLabel: Record<Safe, string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' }

type Step = 'name' | 'phone' | 'vehicle' | 'job' | 'story' | 'safe' | 'summary'
const order: Step[] = ['name', 'phone', 'vehicle', 'job', 'story', 'safe', 'summary']

export default function ReceptionistDialog({
  open,
  returnFocusTo,
  onClose,
}: ReceptionistDialogProps) {
  const id = useId()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
      labelledBy={`${id}-title`}
      describedBy={`${id}-lede`}
    >
      <p className="dialog__tag">
        <span className="dot" aria-hidden="true" />
        Concept demo—not live
      </p>
      <h2 id={`${id}-title`} className="dialog__title">
        Simulated after-hours call
      </h2>
      <p id={`${id}-lede`} className="dialog__lede">
        A scripted walk-through of what an after-hours receptionist would collect. Nothing here is
        answered by a real system and nothing is sent.
      </p>
      {open && <Flow prefix={id} onClose={onClose} />}
    </Dialog>
  )
}

function prompt(step: Step, a: Answers): string {
  switch (step) {
    case 'name':
      return `Thanks for calling ${business.name}. The shop is closed right now, but I can take down the details so the crew can call you back during shop hours. What’s your name?`
    case 'phone':
      return `Thanks, ${a.name.trim()}. What’s the best number for a callback?`
    case 'vehicle':
      return 'What are you driving? Year, make, and model, and whether it’s gas, diesel, hybrid, or electric.'
    case 'job':
      return 'Is this mechanical, electrical, bodywork, or an inspection?'
    case 'story':
      return 'Tell me what happened, in your own words. I’ll pass it along exactly as you say it.'
    case 'safe':
      return 'Is the car safe to drive right now?'
    case 'summary':
      return 'Here is what the crew will see.'
  }
}

function Flow({ prefix, onClose }: { prefix: string; onClose: () => void }) {
  const [answers, setAnswers] = useState<Answers>(empty)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState('')
  const step = order[stepIndex]
  const f = (name: string) => `${prefix}-${name}`

  const set = (name: keyof Answers, value: string) => {
    setAnswers((v) => ({ ...v, [name]: value }))
    if (error) setError('')
  }

  const validate = (): string => {
    switch (step) {
      case 'name':
        return answers.name.trim().length < 2 ? 'Please tell me your name.' : ''
      case 'phone':
        return isPhone(answers.phone) ? '' : 'I need a phone number with 10 digits.'
      case 'vehicle':
        if (answers.vehicle.trim().length < 3) return 'Please give me the year, make, and model.'
        return answers.powertrain ? '' : 'Pick gas, diesel, hybrid, electric, or not sure.'
      case 'job':
        return answers.job ? '' : 'Pick one, or choose not sure.'
      case 'story':
        return answers.story.trim().length < 10 ? 'A sentence or two is all I need.' : ''
      case 'safe':
        return answers.safe ? '' : 'Yes, no, or not sure is fine.'
      default:
        return ''
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setStepIndex((i) => Math.min(i + 1, order.length - 1))
  }

  const back = () => {
    setError('')
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const transcript = order.slice(0, stepIndex).map((s) => ({
    step: s,
    ask: prompt(s, answers),
    said: answered(s, answers),
  }))

  return (
    <div className="recep">
      <ol className="recep__log" role="log" aria-live="polite" aria-label="Call transcript">
        {transcript.map((t) => (
          <li key={t.step} className="recep__turn">
            <p className="recep__ask">
              <span className="recep__who">Receptionist</span>
              {t.ask}
            </p>
            <p className="recep__said">
              <span className="recep__who">You</span>
              {t.said}
            </p>
          </li>
        ))}
        <li className="recep__turn" key={step}>
          <p className="recep__ask">
            <span className="recep__who">Receptionist</span>
            {prompt(step, answers)}
          </p>
        </li>
      </ol>

      {step === 'summary' ? (
        <div className="dialog__done" data-testid="receptionist-done">
          <p className="dialog__done-head" tabIndex={-1} data-autofocus>
            <CircleCheck size={26} aria-hidden="true" />
            Callback summary
          </p>
          <dl className="dialog__summary">
            <div>
              <dt>Caller</dt>
              <dd>{answers.name}</dd>
            </div>
            <div>
              <dt>Callback</dt>
              <dd>{answers.phone}</dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>
                {answers.vehicle}
                {answers.powertrain ? ` · ${powertrainLabel[answers.powertrain]}` : ''}
              </dd>
            </div>
            <div>
              <dt>Job type</dt>
              <dd>{answers.job ? jobLabel[answers.job] : ''}</dd>
            </div>
            <div>
              <dt>What happened</dt>
              <dd>{answers.story}</dd>
            </div>
            <div>
              <dt>Safe to drive</dt>
              <dd>
                {answers.safe ? safeLabel[answers.safe] : ''}
                {answers.safe === 'no' ? ' · flagged for the crew' : ''}
              </dd>
            </div>
          </dl>
          <p className="recep__handoff">
            This would go to the crew as a callback request for shop hours ({business.hoursShort}).
            No diagnosis, no quote, no booking.
          </p>
          <p className="dialog__demo">
            <Info size={20} aria-hidden="true" />
            Concept demo—nothing was sent.
          </p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--ink" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn--ghost" onClick={back}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <form className="recep__form" noValidate onSubmit={onSubmit}>
          {error && (
            <p className="field__error" role="alert" id={f('error')}>
              {error}
            </p>
          )}

          {step === 'name' && (
            <div className="field">
              <label className="field__label" htmlFor={f('name')}>
                Your name
              </label>
              <input
                id={f('name')}
                name="name"
                className="field__input"
                type="text"
                autoComplete="name"
                value={answers.name}
                onChange={(e) => set('name', e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? f('error') : undefined}
              />
            </div>
          )}

          {step === 'phone' && (
            <div className="field">
              <label className="field__label" htmlFor={f('phone')}>
                Callback number
              </label>
              <input
                id={f('phone')}
                name="phone"
                className="field__input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={answers.phone}
                onChange={(e) => set('phone', e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? f('error') : undefined}
              />
            </div>
          )}

          {step === 'vehicle' && (
            <>
              <div className="field">
                <label className="field__label" htmlFor={f('vehicle')}>
                  Year, make, and model
                </label>
                <input
                  id={f('vehicle')}
                  name="vehicle"
                  className="field__input"
                  type="text"
                  placeholder="2016 Honda CR-V"
                  value={answers.vehicle}
                  onChange={(e) => set('vehicle', e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? f('error') : undefined}
                />
              </div>
              <Choices
                legend="Powertrain"
                name="powertrain"
                prefix={f('powertrain')}
                options={powertrainLabel}
                value={answers.powertrain}
                onChange={(v) => set('powertrain', v)}
              />
            </>
          )}

          {step === 'job' && (
            <Choices
              legend="Kind of work"
              name="job"
              prefix={f('job')}
              options={jobLabel}
              value={answers.job}
              onChange={(v) => set('job', v)}
            />
          )}

          {step === 'story' && (
            <div className="field">
              <label className="field__label" htmlFor={f('story')}>
                What happened
              </label>
              <textarea
                id={f('story')}
                name="story"
                className="field__input"
                rows={4}
                value={answers.story}
                onChange={(e) => set('story', e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? f('error') : undefined}
              />
            </div>
          )}

          {step === 'safe' && (
            <Choices
              legend="Safe to drive"
              name="safe"
              prefix={f('safe')}
              options={safeLabel}
              value={answers.safe}
              onChange={(v) => set('safe', v)}
            />
          )}

          <div className="dialog__actions">
            <button type="submit" className="btn btn--primary">
              {step === 'safe' ? 'Finish' : 'Next'}
            </button>
            {stepIndex > 0 && (
              <button type="button" className="btn btn--ghost" onClick={back}>
                Back
              </button>
            )}
            <button type="button" className="btn btn--text" onClick={onClose}>
              End call
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function answered(step: Step, a: Answers): string {
  switch (step) {
    case 'name':
      return a.name
    case 'phone':
      return a.phone
    case 'vehicle':
      return `${a.vehicle}${a.powertrain ? `, ${powertrainLabel[a.powertrain].toLowerCase()}` : ''}`
    case 'job':
      return a.job ? jobLabel[a.job] : ''
    case 'story':
      return a.story
    case 'safe':
      return a.safe ? safeLabel[a.safe] : ''
    default:
      return ''
  }
}

interface ChoicesProps<T extends string> {
  legend: string
  name: string
  prefix: string
  options: Record<T, string>
  value: T | ''
  onChange: (value: T) => void
}

function Choices<T extends string>({
  legend,
  name,
  prefix,
  options,
  value,
  onChange,
}: ChoicesProps<T>) {
  return (
    <fieldset className="field">
      <legend className="field__label">{legend}</legend>
      <div className="choice">
        {(Object.keys(options) as T[]).map((key) => (
          <span className="choice__item" key={key}>
            <input
              type="radio"
              id={`${prefix}-${key}`}
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
            />
            <label htmlFor={`${prefix}-${key}`}>{options[key]}</label>
          </span>
        ))}
      </div>
    </fieldset>
  )
}
