const base = import.meta.env.BASE_URL

export interface ImageSet {
  src: string
  srcSet: string
  width: number
  height: number
  alt: string
}

const file = (name: string, width?: number) =>
  `${base}assets/td-${name}${width ? `-${width}` : ''}.webp`

/**
 * All four are generated concept renders made for this preview, not
 * photographs. The storefront render was produced from a reference photo of
 * the building at 896 4th Ave, so its sign and facade are the real ones; the
 * three workshop scenes are staged and the people in them are not T&D's
 * staff or customers. The unsuffixed file is the staged original; the
 * suffixed files are resized copies of it (see scripts/images.mjs).
 */
const set = (
  name: string,
  widths: number[],
  width: number,
  height: number,
  alt: string,
): ImageSet => ({
  src: file(name, 1600),
  srcSet: [...widths.map((w) => `${file(name, w)} ${w}w`), `${file(name)} ${width}w`].join(', '),
  width,
  height,
  alt,
})

export const images = {
  hero: set(
    'hero',
    [640, 1024, 1600],
    2688,
    1152,
    'Concept render of the T & D Auto Repair storefront on 4th Avenue: a narrow charcoal brick building under a white sign that reads AUTO REPAIR with the address and phone number, a black roll-up door above a glass front, and a bright blue shopfront next door.',
  ),
  mechanical: set(
    'mechanical',
    [640, 1024, 1600],
    2048,
    1360,
    'Concept render of a removed engine and subframe on a steel rolling cart in a compact bay, with blue lift posts and a car with its hood up behind it.',
  ),
  electrical: set(
    'electrical',
    [640, 1024, 1600],
    2048,
    1360,
    'Concept render of a technician in a dark hoodie holding a rugged scan tablet over an open engine bay, with red and black test leads clipped to the battery.',
  ),
  bodywork: set(
    'bodywork',
    [640, 1024, 1600],
    2048,
    1360,
    'Concept render of a technician running a handheld line light along the rear quarter panel of a freshly finished white coupe.',
  ),
} as const
