/**
 * Every fact here was verified on September 2, 2026 against the shop's own
 * website (tdautony.com) and its Google Business Profile. Nothing else is
 * claimed anywhere in the concept.
 */
export const business = {
  name: 'T & D Auto Repair',
  short: 'T&D',
  street: '896 4th Ave',
  cityLine: 'Brooklyn, NY 11232',
  addressLine: '896 4th Ave, Brooklyn, NY 11232',
  shopPhone: { display: '(718) 972-6620', href: 'tel:+17189726620' },
  cellPhone: { display: '(917) 295-1205', href: 'tel:+19172951205' },
  email: 'thetdauto@gmail.com',
  emailHref: 'mailto:thetdauto@gmail.com',
  directionsHref:
    'https://www.google.com/maps/dir/?api=1&destination=896+4th+Ave%2C+Brooklyn%2C+NY+11232',
  site: 'https://www.tdautony.com/',
  siteLabel: 'tdautony.com',
  hours: [
    { days: 'Monday to Saturday', time: '8 AM to 5 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],
  hoursShort: 'Mon–Sat · 8–5',
  google: { rating: '4.9', reviews: '102', checked: 'September 2, 2026' },
  since: '1992',
} as const

export type ServiceKey = 'mechanical' | 'electrical' | 'bodywork' | 'inspection'

export interface Service {
  key: ServiceKey
  title: string
  /** Desktop bento span on a 12-column grid. 7 + 5 per row = 24 of 24 cells. */
  span: 7 | 5
  lede: string
  /** Concrete examples drawn from the shop's published claims and its customers' reviews. */
  examples: string[]
}

export const services: Service[] = [
  {
    key: 'mechanical',
    title: 'Mechanical',
    span: 7,
    lede: 'Engines, drivetrains, and the everyday service that keeps a car on the road.',
    examples: [
      'Check engine lights',
      'Oil changes and routine service',
      'Engine and drivetrain work',
    ],
  },
  {
    key: 'electrical',
    title: 'Electrical',
    span: 5,
    lede: 'Warning lights read with a scanner, then explained in plain language.',
    examples: [
      'Warning lights read with a scanner',
      'Faults that only show up sometimes',
      'Hybrid and electric vehicles included',
    ],
  },
  {
    key: 'bodywork',
    title: 'Bodywork',
    span: 5,
    lede: 'Collision and dent repair in the same building as the mechanical work.',
    examples: ['Collision repair', 'Dent repair', 'Repairs that go through insurance'],
  },
  {
    key: 'inspection',
    title: 'NYS Inspection',
    span: 7,
    lede: 'The annual New York State inspection, done on 4th Avenue.',
    examples: [
      'Annual New York State inspection',
      'Inspection and oil change in one visit',
      'Safety and emissions in the same stop',
    ],
  },
]

export const serviceLabel: Record<ServiceKey, string> = {
  mechanical: 'Mechanical',
  electrical: 'Electrical',
  bodywork: 'Bodywork',
  inspection: 'NYS Inspection',
}

export interface Testimonial {
  quote: string
  name: string
}

/**
 * Exact excerpts from the testimonials published on tdautony.com, attributed
 * to the names shown there. These are not Google reviews.
 */
export const testimonials: Testimonial[] = [
  {
    quote:
      'Took care of my inspection and oil change. Accommodating and friendly. Did a very nice job on body work 3 years ago. Terrific service.',
    name: 'David Schrager',
  },
  {
    quote:
      "Norman is super easy to reach, is a great communicator, passionate about what he does, and always makes sure his customers' needs come first.",
    name: 'Mellica Askari',
  },
  {
    quote:
      'They were friendly, showed great customer service and Norman took the time to explain the needed repair and his thought process.',
    name: 'Angela Lee',
  },
  {
    quote:
      'Everyone is so friendly, honest and very communicative. A deer did some serious damage to my car, and Norman walked me through everything with the insurance and made all the repairs, it was a most seamless experience.',
    name: 'Elina Street',
  },
  {
    quote:
      "He's honest and straight up on what needs to be done for the car. He doesn't sell you unnecessary repairs to charge you extra.",
    name: 'TM',
  },
]

/** The shop's own published service range, used in the breadth band. */
export const breadth = [
  'Foreign',
  'Domestic',
  'Gas',
  'Diesel',
  'Hybrid',
  'Electric',
  'Mechanical',
  'Electrical',
  'Bodywork',
  'NYS Inspection',
]
