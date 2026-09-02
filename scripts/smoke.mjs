/**
 * Static smoke test against the production build in dist/. No browser, no
 * network. Verifies the base path, robots/meta expectations, that every
 * referenced asset exists, that the bundle carries the required copy and
 * disclosures, and that nothing in src/ or the bundle can send or store data.
 * Also pins two mobile QA regressions: inactive carousel slides carry an
 * explicit display:none rule, and the mobile dock is handed the review state
 * and renders nothing in owner-review mode.
 *
 *   npm run smoke   (builds first, then runs this)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const dist = join(root, 'dist')
const BASE = '/t-and-d-auto-repair-concept/'
const failures = []

const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures.push(label)
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

check('dist/index.html exists', existsSync(join(dist, 'index.html')))
if (!existsSync(join(dist, 'index.html'))) {
  console.log('\nBuild output missing; run `npm run build` first.')
  process.exit(1)
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')
const files = walk(dist)
const rel = (p) => p.slice(dist.length).split('\\').join('/')
const js = files
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')
const css = files
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

// Head expectations
check(
  'robots meta is noindex,nofollow',
  /<meta name="robots" content="noindex,\s?nofollow"/.test(html),
)
check(
  'title names the business and says it is a concept',
  /<title>\s*T &amp; D Auto Repair.*?concept preview.*?<\/title>/s.test(html),
)
check(
  'meta description present',
  /<meta\s+name="description"\s+content="Independent speculative website concept/.test(html),
)
check(
  'canonical points at the customer URL without a query',
  /<link rel="canonical" href="https:\/\/mikebatts\.github\.io\/t-and-d-auto-repair-concept\/"/.test(
    html,
  ),
)
check('theme-color present', /<meta name="theme-color" content="#151719"/.test(html))
check(
  'Open Graph title/description/image/url present',
  ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].every((p) =>
    html.includes(`property="${p}"`),
  ),
)
check('favicon links through the base path', html.includes(`href="${BASE}favicon.svg"`))
check(
  'hero preload uses the base path and the same srcset as the img',
  html.includes(
    `imagesrcset="${BASE}assets/td-hero-640.webp 640w, ${BASE}assets/td-hero-1024.webp 1024w, ${BASE}assets/td-hero-1600.webp 1600w, ${BASE}assets/td-hero.webp 2688w"`,
  ),
)
check(
  'display font preloads use the base path',
  html.includes(`href="${BASE}fonts/cabinet-grotesk-800.woff2"`) &&
    html.includes(`href="${BASE}fonts/cabinet-grotesk-700.woff2"`),
)
check(
  'no JSON-LD structured data (nothing to feed crawlers)',
  !html.includes('application/ld+json'),
)

// Base path: every src/href in the HTML that is site-relative must start with BASE and exist.
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => u.startsWith('/'))
check(
  'all HTML asset references use the base path',
  refs.every((u) => u.startsWith(BASE)),
  refs.filter((u) => !u.startsWith(BASE)).join(', '),
)
const missing = refs.filter((u) => !existsSync(join(dist, u.slice(BASE.length).split('?')[0])))
check('every referenced HTML asset exists in dist', missing.length === 0, missing.join(', '))

// CSS font URLs must be rewritten to the base path and exist.
const cssUrls = [...css.matchAll(/url\(([^)]+)\)/g)]
  .map((m) => m[1].replace(/["']/g, ''))
  .filter((u) => !u.startsWith('data:'))
const fontUrls = cssUrls.filter((u) => u.endsWith('.woff2'))
check(
  'CSS references Cabinet Grotesk through the base path',
  fontUrls.some((u) => u.startsWith(`${BASE}fonts/cabinet-grotesk-800`)),
  fontUrls.slice(0, 3).join(', '),
)
const cssMissing = cssUrls.filter(
  (u) => u.startsWith('/') && !existsSync(join(dist, u.slice(BASE.length))),
)
check('every CSS url() asset exists in dist', cssMissing.length === 0, cssMissing.join(', '))

// Image assets: only the four generated renders (and their resized copies) plus SVG.
const assetFiles = files
  .filter((f) => rel(f).startsWith('/assets/') && /\.(webp|png|jpe?g|gif|avif|svg)$/i.test(f))
  .map(rel)
const allowed = /^\/assets\/td-(hero|mechanical|electrical|bodywork)(-640|-1024|-1600)?\.webp$/
check(
  'public assets are only the four generated renders and their sizes',
  assetFiles.length === 16 && assetFiles.every((f) => allowed.test(f)),
  assetFiles.filter((f) => !allowed.test(f)).join(', '),
)
check(
  'no private reference photos shipped',
  !files.some((f) => /google-0\d\.jpg|site-.*\.webp|\.png$/.test(rel(f))),
)
// The image helper builds `${base}assets/td-${name}-${width}.webp` at runtime, so the
// static check looks for the template pieces and the inlined base path.
check(
  'bundle builds image URLs from assets/td- and .webp',
  /assets\/td-/.test(js) && /\.webp/.test(js),
)
for (const name of ['hero', 'mechanical', 'electrical', 'bodywork']) {
  check(`bundle names the ${name} render`, new RegExp(`["'\`]${name}["'\`]`).test(js))
}
check('bundle inlines the GitHub Pages base path', js.includes(BASE))

// robots.txt
const robots = existsSync(join(dist, 'robots.txt'))
  ? readFileSync(join(dist, 'robots.txt'), 'utf8')
  : ''
check('robots.txt disallows everything', /User-agent: \*\s+Disallow: \//.test(robots))

// Required copy in the bundle
const required = [
  'One shop for the whole car.',
  'Mechanical, collision, electrical, and New York State inspections',
  'Request service',
  'Call now',
  '(718) 972-6620',
  '(917) 295-1205',
  'thetdauto@gmail.com',
  '896 4th Ave',
  'Brooklyn, NY 11232',
  'on Google',
  'reviews',
  'September 2, 2026',
  'Since ',
  'Mon–Sat',
  'Start a request',
  'Independent speculative redesign by Design For Anyone. Not affiliated with or endorsed by T & D Auto Repair.',
  'Concept demo—nothing was sent.',
  'Concept demo—not live',
  'After-hours calls, captured.',
  'You already have the trust. This makes it easier to turn it into the next job.',
  'View customer site',
  '$1,000',
  'What stays yours',
  'T&D says its staff includes ASE Certified Technicians',
  'David Schrager',
  'Mellica Askari',
  'Angela Lee',
  'Elina Street',
  'google.com/maps/dir/?api=1&destination=896+4th+Ave',
  'tel:+17189726620',
  'tel:+19172951205',
  'mailto:thetdauto@gmail.com',
]
for (const text of required) {
  check(`bundle contains “${text}”`, js.includes(text))
}
check(
  'bundle contains 4.9 rating and 102 reviews',
  /rating:["'`]4\.9["'`]/.test(js) && /reviews:["'`]102["'`]/.test(js),
)

// Things that must not exist anywhere in our source or bundle.
const srcFiles = walk(join(root, 'src')).filter((f) => /\.(ts|tsx|css)$/.test(f))
const src = srcFiles.map((f) => readFileSync(f, 'utf8')).join('\n')
for (const bad of [
  'fetch(',
  'XMLHttpRequest',
  'sendBeacon',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'document.cookie',
  'action=',
]) {
  check(`src contains no ${bad}`, !src.includes(bad))
}
for (const bad of [
  'XMLHttpRequest',
  'sendBeacon',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'googletagmanager',
  'google-analytics',
  'plausible',
  'hotjar',
]) {
  check(`bundle contains no ${bad}`, !js.includes(bad))
}
check(
  'bundle contains no cross-origin script or image hosts',
  !/https?:\/\/(?!mikebatts\.github\.io|www\.google\.com\/maps|www\.tdautony\.com|lucide\.dev|gsap\.com|github\.com|reactjs\.org|react\.dev)[a-z0-9.-]+\.[a-z]{2,}\//i.test(
    js.replace(/https?:\/\/[^"'`\s]*(w3\.org|xmlns)[^"'`\s]*/g, ''),
  ),
)
check('no emoji glyphs in the bundle', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(js))
check(
  'no mailto to the studio (address is not used in sibling concepts)',
  !js.includes('designforanyone.com'),
)
check('no invented meta labels', !/SECTION 0\d|QUESTION 0\d|Welcome to/.test(js))
check('no sideways text (vertical writing-mode) in CSS', !/writing-mode:\s*vertical/.test(css))
check(
  'bento is a 12-column dense grid',
  /grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/.test(css.replace(/\s+/g, '')) &&
    /grid-auto-flow:dense/.test(css.replace(/\s+/g, '')),
)
check('safe-area inset handled for the dock', /env\(safe-area-inset-bottom/.test(css))
check(
  'reduced-motion media queries present',
  (css.match(/prefers-reduced-motion/g) ?? []).length >= 3,
)
check(
  'build output is a single JS chunk under 420 KB',
  files.filter((f) => f.endsWith('.js')).length >= 1 &&
    files.filter((f) => f.endsWith('.js')).every((f) => statSync(f).size < 420 * 1024),
  files
    .filter((f) => f.endsWith('.js'))
    .map((f) => `${rel(f)} ${Math.round(statSync(f).size / 1024)}KB`)
    .join(', '),
)

// Mobile QA regressions found in the browser pass at 390px (2026-09-02). Static
// stand-ins anchored to contracts (selector, attribute, prop), not to layout.
const readSrc = (p) => readFileSync(join(root, p), 'utf8')
const testimonialsSrc = readSrc('src/components/Testimonials.tsx')
const appSrc = readSrc('src/App.tsx')
const dockSrc = readSrc('src/components/MobileDock.tsx')

// 1. Testimonials: the component toggles `hidden` on inactive slides, but the
//    slide's own `display: grid` would beat the browser's `[hidden]` rule, so
//    the built CSS must say `display: none` for hidden slides explicitly.
const slideTag =
  testimonialsSrc.match(/<figure\b[^>]*\bclassName="carousel__slide"[^>]*>/)?.[0] ?? ''
check('carousel slides toggle the hidden attribute', /\bhidden=\{/.test(slideTag))
check(
  'built CSS forces [hidden] carousel slides to display:none !important',
  /\.carousel__slide\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(css),
)

// 2. Owner-review mode has no sticky dock: App owns the review state and passes
//    it down; the dock never reads the URL and renders nothing while it is set.
check(
  'App passes its review state to MobileDock',
  /<MobileDock\b[^>]*\breview=\{review\}/.test(appSrc),
)
check(
  'MobileDock declares a review prop and does not read the URL itself',
  /\breview\??:\s*boolean\b/.test(dockSrc) &&
    !/\blocation\b|URLSearchParams|lib\/review/.test(dockSrc),
)
check(
  'MobileDock renders nothing while review is set',
  /if \(review\)\s*return null\b/.test(dockSrc),
)

console.log('')
if (failures.length) {
  console.log(`${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('All smoke checks passed')
