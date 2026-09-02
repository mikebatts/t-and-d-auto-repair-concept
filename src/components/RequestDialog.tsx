import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CircleCheck, Info } from 'lucide-react'
import { serviceLabel, services, type ServiceKey } from '../lib/business'
import {
  emptyRequest,
  validateRequest,
  type ContactPref,
  type RequestErrors,
  type RequestValues,
} from '../lib/validate'
import Dialog from './Dialog'

interface RequestDialogProps {
  open: boolean
  service: ServiceKey | ''
  returnFocusTo: HTMLElement | null
  onClose: () => void
}

const contactLabel: Record<ContactPref, string> = { call: 'Call me', text: 'Text me' }

/**
 * Guided service request. Validates locally, then shows a preview of what the
 * shop would receive. There is no form action, fetch, storage, or analytics;
 * the values live in component state and vanish when the dialog closes.
 */
export default function RequestDialog({
  open,
  service,
  returnFocusTo,
  onClose,
}: RequestDialogProps) {
  const id = useId()
  const titleId = `${id}-title`
  const ledeId = `${id}-lede`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
      labelledBy={titleId}
      describedBy={ledeId}
    >
      <p className="dialog__tag">
        <span className="dot" aria-hidden="true" />
        Concept demo—nothing is sent
      </p>
      <h2 id={titleId} className="dialog__title">
        Tell the shop what’s going on.
      </h2>
      <p id={ledeId} className="dialog__lede">
        A few details so the crew can call or text you back during shop hours. In this preview the
        request stays on your screen.
      </p>
      {open && <RequestForm initialService={service} onClose={onClose} fieldPrefix={id} />}
    </Dialog>
  )
}

interface RequestFormProps {
  initialService: ServiceKey | ''
  onClose: () => void
  fieldPrefix: string
}

function RequestForm({ initialService, onClose, fieldPrefix }: RequestFormProps) {
  const [values, setValues] = useState<RequestValues>({ ...emptyRequest, service: initialService })
  const [errors, setErrors] = useState<RequestErrors>({})
  const [done, setDone] = useState(false)
  const [failedSubmits, setFailedSubmits] = useState(0)
  const alertRef = useRef<HTMLDivElement>(null)

  // After a rejected submit the error summary is in the DOM; move focus to it.
  useEffect(() => {
    if (failedSubmits > 0) alertRef.current?.focus()
  }, [failedSubmits])
  const f = (name: keyof RequestValues) => `${fieldPrefix}-${name}`

  const update = (name: keyof RequestValues, value: string) => {
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = validateRequest(values)
    setErrors(next)
    if (Object.keys(next).length) {
      setFailedSubmits((n) => n + 1)
      return
    }
    setDone(true)
  }

  const errorList = (Object.keys(errors) as (keyof RequestValues)[]).filter((k) => errors[k])

  if (done) {
    return (
      <div className="dialog__done" data-testid="request-done">
        <p className="dialog__done-head" tabIndex={-1} data-autofocus>
          <CircleCheck size={26} aria-hidden="true" />
          Here is what the shop would receive.
        </p>
        <dl className="dialog__summary">
          <div>
            <dt>Name</dt>
            <dd>{values.name}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{values.phone}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>{values.vehicle}</dd>
          </div>
          <div>
            <dt>Work</dt>
            <dd>
              {values.service === 'unsure'
                ? 'Not sure yet'
                : serviceLabel[values.service as ServiceKey]}
            </dd>
          </div>
          <div>
            <dt>What’s going on</dt>
            <dd>{values.issue}</dd>
          </div>
          <div>
            <dt>Reach you by</dt>
            <dd>{values.contact ? contactLabel[values.contact] : ''}</dd>
          </div>
        </dl>
        <p className="dialog__demo">
          <Info size={20} aria-hidden="true" />
          Concept demo—nothing was sent.
        </p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ink" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="dialog__form" noValidate onSubmit={onSubmit}>
      {errorList.length > 0 && (
        <div className="dialog__alert" role="alert" tabIndex={-1} ref={alertRef}>
          <p>Please check {errorList.length === 1 ? 'this field' : 'these fields'}:</p>
          <ul>
            {errorList.map((k) => (
              <li key={k}>
                <a href={`#${f(k)}`}>{errors[k]}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dialog__row">
        <Field id={f('name')} label="Name" error={errors.name}>
          <input
            id={f('name')}
            name="name"
            className="field__input"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${f('name')}-err` : undefined}
          />
        </Field>
        <Field id={f('phone')} label="Phone" error={errors.phone}>
          <input
            id={f('phone')}
            name="phone"
            className="field__input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => update('phone', e.target.value)}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${f('phone')}-err` : undefined}
          />
        </Field>
      </div>

      <div className="dialog__row">
        <Field
          id={f('vehicle')}
          label="Vehicle"
          hint="Year, make, and model"
          error={errors.vehicle}
        >
          <input
            id={f('vehicle')}
            name="vehicle"
            className="field__input"
            type="text"
            autoComplete="off"
            placeholder="2016 Honda CR-V"
            value={values.vehicle}
            onChange={(e) => update('vehicle', e.target.value)}
            aria-invalid={errors.vehicle ? true : undefined}
            aria-describedby={`${f('vehicle')}-hint${errors.vehicle ? ` ${f('vehicle')}-err` : ''}`}
          />
        </Field>
        <Field id={f('service')} label="Kind of work" error={errors.service}>
          <select
            id={f('service')}
            name="service"
            className="field__input"
            value={values.service}
            onChange={(e) => update('service', e.target.value)}
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errors.service ? `${f('service')}-err` : undefined}
          >
            <option value="">Choose one</option>
            {services.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
            <option value="unsure">Not sure yet</option>
          </select>
        </Field>
      </div>

      <Field
        id={f('issue')}
        label="What’s going on"
        hint="A sentence or two is plenty"
        error={errors.issue}
      >
        <textarea
          id={f('issue')}
          name="issue"
          className="field__input"
          rows={4}
          value={values.issue}
          onChange={(e) => update('issue', e.target.value)}
          aria-invalid={errors.issue ? true : undefined}
          aria-describedby={`${f('issue')}-hint${errors.issue ? ` ${f('issue')}-err` : ''}`}
        />
      </Field>

      <fieldset
        className="field"
        aria-describedby={errors.contact ? `${f('contact')}-err` : undefined}
      >
        <legend className="field__label">How should the shop reach you?</legend>
        <div className="choice" id={f('contact')}>
          {(['call', 'text'] as ContactPref[]).map((c) => (
            <span className="choice__item" key={c}>
              <input
                type="radio"
                id={`${f('contact')}-${c}`}
                name="contact"
                value={c}
                checked={values.contact === c}
                onChange={() => update('contact', c)}
              />
              <label htmlFor={`${f('contact')}-${c}`}>{contactLabel[c]}</label>
            </span>
          ))}
        </div>
        {errors.contact && (
          <p className="field__error" id={`${f('contact')}-err`}>
            {errors.contact}
          </p>
        )}
      </fieldset>

      <div className="dialog__actions">
        <button type="submit" className="btn btn--primary btn--lg">
          Preview request
        </button>
        <button type="button" className="btn btn--ghost btn--lg" onClick={onClose}>
          Cancel
        </button>
      </div>
      <p className="field__hint">Concept demo—nothing is sent or stored when you submit.</p>
    </form>
  )
}

interface FieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field__error" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  )
}
