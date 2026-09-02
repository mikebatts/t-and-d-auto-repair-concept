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
 * All four are original generated concept renders. None is a photograph of
 * the real shop, its staff, its signage, or a customer's car. The unsuffixed
 * file is the staged original; the suffixed files are resized copies of it.
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
    'Concept render of a charcoal brick garage at dusk with the bay door open, two blue lifts lit inside, and a dark sedan pulling in from the street.',
  ),
  mechanical: set(
    'mechanical',
    [640, 1024, 1600],
    2048,
    1360,
    'Concept render of a complete engine and transmission on a black rolling cart in a white brick shop beside a blue lift post.',
  ),
  electrical: set(
    'electrical',
    [640, 1024, 1600],
    2048,
    1360,
    'Concept render of a technician holding a diagnostic tablet over an open engine bay with red test leads clipped in.',
  ),
  bodywork: set(
    'bodywork',
    [640, 1024, 1600],
    2688,
    1520,
    'Concept render of a technician checking the rear quarter panel of a white sedan with a handheld inspection light.',
  ),
} as const
