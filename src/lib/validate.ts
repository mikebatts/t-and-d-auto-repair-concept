import type { ServiceKey } from './business'

export type ContactPref = 'call' | 'text'

export interface RequestValues {
  name: string
  phone: string
  vehicle: string
  service: ServiceKey | 'unsure' | ''
  issue: string
  contact: ContactPref | ''
}

export type RequestErrors = Partial<Record<keyof RequestValues, string>>

export const emptyRequest: RequestValues = {
  name: '',
  phone: '',
  vehicle: '',
  service: '',
  issue: '',
  contact: '',
}

/** Accepts US numbers with or without the leading 1, in any common punctuation. */
export function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

export function validateRequest(v: RequestValues): RequestErrors {
  const errors: RequestErrors = {}
  if (v.name.trim().length < 2) errors.name = 'Enter your name.'
  if (!isPhone(v.phone)) errors.phone = 'Enter a phone number with 10 digits.'
  if (v.vehicle.trim().length < 3) errors.vehicle = 'Enter the year, make, and model.'
  if (!v.service) errors.service = 'Pick the kind of work, or choose “Not sure”.'
  if (v.issue.trim().length < 10) errors.issue = 'Describe what is going on in a sentence or two.'
  if (!v.contact) errors.contact = 'Choose how the shop should reach you.'
  return errors
}
