/**
 * Programmatic DOM check against the production preview using the
 * agent-browser CLI. Not a substitute for looking at the page; it verifies
 * what can be measured.
 *
 *   npm run build && npm run preview   (serves dist/ on port 4175)
 *   npm run qa:browser                 (in another terminal)
 *
 * At 320 / 390 / 768 / 1440 for both the customer URL and `?review=1`: no
 * horizontal overflow, one readable H1 with the expected text and at most two
 * lines, noindex, no console errors, only same-origin GET requests, every
 * motion target visible after scrolling through, web fonts loaded, and (for
 * the customer page) the storefront sign, address, and phone inside the hero
 * crop. Then: the gapless bento at 1440 (24 of 24 cells, titles horizontal),
 * the request dialog at 390 and 1440 (validation, preview state, Escape,
 * focus return, service pre-selection), the receptionist demo at 390, the
 * carousel (real arrow keys on the focused controls, wrapping both ways, no
 * autoplay), the owner pitch (three proof tiles, four change rows, price,
 * add-on sentence, word budget, in-page anchor) and review-mode exit without
 * a reload, the mobile dock, touch targets, focus visibility, and reduced
 * motion in both modes.
 *
 * Determinism. Every pass starts with `open`, which sets the viewport and
 * media state explicitly and refuses to continue unless the page is visible
 * and producing animation frames; state changes are polled with `until`
 * rather than guessed with fixed sleeps; keyboard checks confirm where focus
 * is before a key is pressed. See `bootstrapTab` for the one agent-browser
 * quirk this works around.
 *
 *   QA_ONLY=request,dock npm run qa:browser   (run a subset of passes: layout,
 *                                              bento, request, carousel, review,
 *                                              targets, motion, receptionist, dock)
 *   QA_TRACE=1 npm run qa:browser             (log every CLI call with its time)
 */
import { execFileSync } from 'node:child_process'

const BASE = process.env.QA_BASE ?? 'http://localhost:4175/t-and-d-auto-repair-concept/'
const SESSION = 'td-qa'
const widths = [320, 390, 768, 1440]
const failures = []

const trace = process.env.QA_TRACE === '1'
const ab = (...args) => {
  const started = Date.now()
  try {
    const out = execFileSync('agent-browser', ['--session', SESSION, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60_000,
    }).trim()
    if (trace) console.error(`  [${Date.now() - started}ms] ${args.join(' ').slice(0, 110)}`)
    return out
  } catch (err) {
    if (trace) console.error(`  [${Date.now() - started}ms] FAILED ${args.join(' ').slice(0, 110)}`)
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim()
    throw new Error(`agent-browser ${args.join(' ')} failed: ${out}`, { cause: err })
  }
}

const evalJs = (js) => {
  const raw = ab('eval', js)
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const check = (label, ok, detail = '') => {
  const line = `${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`
  console.log(line)
  if (!ok) failures.push(line)
}

/**
 * Poll a page expression until `ok(value)` holds or the timeout passes, and
 * return the last value either way, so the check that follows fails with a
 * real detail rather than a stale snapshot.
 */
const until = (js, ok = Boolean, { timeout = 4000, every = 100 } = {}) => {
  const end = Date.now() + timeout
  for (;;) {
    const v = evalJs(js)
    if (ok(v) || Date.now() >= end) return v
    ab('wait', String(every))
  }
}

/**
 * agent-browser 0.27 on macOS: a `press Escape` in the daemon's first tab
 * sends that tab to the background for the rest of the session
 * (document.visibilityState becomes 'hidden' and requestAnimationFrame stops),
 * which silently starves IntersectionObserver callbacks, CSS transitions,
 * GSAP, and Chrome's dialog `close` event, and the state survives every later
 * `open` in that tab. Tabs created with `tab new` are unaffected, so the run
 * moves to a fresh tab first and closes the original.
 */
const bootstrapTab = () => {
  ab('open', 'about:blank')
  ab('tab', 'new', 'about:blank')
  const stale = ab('tab', 'list')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('→'))
    .map((line) => line.match(/\[(t\d+)\]/)?.[1])
    .filter(Boolean)
  for (const id of stale) ab('tab', 'close', id)
}

const renderingProbe = `(async () => {
  const raf = await Promise.race([
    new Promise((r) => requestAnimationFrame(() => r(true))),
    new Promise((r) => setTimeout(() => r(false), 500)),
  ]);
  return { vs: document.visibilityState, raf, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
})()`.replace(/\n/g, ' ')

/**
 * Navigate with explicit viewport and media state, then confirm the page is
 * actually rendering (visible, animation frames running, reduced-motion as
 * requested) before any check reads it. A page that is not rendering is an
 * environment fault, not an app result, so it aborts the run.
 */
const open = (url, w, { height = 900, reducedMotion = false } = {}) => {
  ab('set', 'viewport', String(w), String(height))
  ab('set', 'media', 'light', ...(reducedMotion ? ['reduced-motion'] : []))
  ab('open', url)
  ab('wait', '--load', 'networkidle')
  const live = evalJs(renderingProbe)
  if (live.vs !== 'visible' || live.raf !== true || live.reduced !== reducedMotion) {
    throw new Error(
      `page is not in the requested state after open (visibility ${live.vs}, animation frame ${live.raf}, reduced motion ${live.reduced} wanted ${reducedMotion})`,
    )
  }
  ab('console', '--clear')
  ab('network', 'requests', '--clear')
}

const consoleErrors = () =>
  ab('console')
    .split('\n')
    .filter((l) => /error/i.test(l) && !/favicon/i.test(l))

const networkOffenders = () => {
  const origin = new URL(BASE).origin
  return ab('network', 'requests')
    .split('\n')
    .filter((l) => l.trim())
    .filter((l) => {
      const m = l.match(/(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s+(\S+)/i)
      if (!m) return false
      return m[1].toUpperCase() !== 'GET' || !m[2].startsWith(origin)
    })
}

const layoutProbe = `(() => {
  const h1s = Array.from(document.querySelectorAll('h1'));
  const h1 = h1s[0];
  const lh = h1 ? parseFloat(getComputedStyle(h1).lineHeight) : 0;
  const skip = (el) => el.closest('.marquee, dialog, .skip-link, .dock:not([data-visible]), .site-nav:not([data-open])');
  const over = Array.from(document.body.querySelectorAll('*')).filter((el) => {
    if (skip(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right > window.innerWidth + 1;
  });
  return {
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    h1: h1s.length,
    h1Text: h1 ? h1.innerText.replace(/\\s+/g, ' ').trim() : '',
    h1Lines: h1 ? Math.round(h1.getBoundingClientRect().height / lh) : 0,
    robots: document.querySelector('meta[name=robots]')?.content ?? '',
    over: over.slice(0, 4).map((el) => (el.className && String(el.className)) || el.tagName),
    overCount: over.length,
    display: document.fonts.check('800 1em "Cabinet Grotesk"'),
    body: getComputedStyle(document.body).fontFamily,
  };
})()`.replace(/\n/g, ' ')

/**
 * Where the hero image actually lands inside its plane, as fractions of the
 * image. object-fit: cover with a percentage object-position is deterministic
 * given the box, the natural size, and the position, so the crop can be
 * checked without pixels.
 */
const heroCropProbe = `(() => {
  const img = document.querySelector('.hero__img');
  const box = img.getBoundingClientRect();
  const nw = img.naturalWidth, nh = img.naturalHeight;
  const pos = getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
  const scale = Math.max(box.width / nw, box.height / nh);
  const rw = nw * scale, rh = nh * scale;
  const ox = (box.width - rw) * (pos[0] / 100), oy = (box.height - rh) * (pos[1] / 100);
  return { left: -ox / rw, right: (box.width - ox) / rw, top: -oy / rh, bottom: (box.height - oy) / rh, w: Math.round(box.width), h: Math.round(box.height), signPx: Math.round(rw * SIGN_W), nw, nh };
})()`.replace(/\n/g, ' ')

/**
 * Where the white fascia sign sits in the storefront render, as fractions of
 * the image: the panel with the T/D mark, AUTO REPAIR, the address, and the
 * phone. Measured from the master; keep in sync if the render changes.
 */
const SIGN = { left: 0.24, right: 0.72, top: 0.07, bottom: 0.32 }
const SIGN_W = SIGN.right - SIGN.left

/**
 * Everything GSAP touches. After a full scroll-through nothing may be left
 * transparent, clipped, or mid-transform, except the deliberately scaled
 * stacked cards (checked for opacity only).
 */
const motionProbe = `(() => {
  const identity = /^(none|matrix\\(1, 0, 0, 1, 0, 0\\))$/;
  const openClip = /^(none|inset\\(0(px|%)?( 0(px|%)?){0,3}\\))$/;
  const sel = '[data-reveal], .statement__word, .hero__word-inner, .hero__lede, .hero__actions, .hero__ledger, .hero__plane, .hero__img, .stack__card';
  const els = Array.from(document.querySelectorAll(sel));
  const bad = els.filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return false;
    if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.99) return true;
    if (el.classList.contains('stack__card')) return false;
    if (!identity.test(cs.transform)) return true;
    if (!openClip.test(cs.clipPath)) return true;
    return false;
  });
  return { checked: els.length, hidden: bad.length, sample: bad.slice(0, 4).map((el) => el.className || el.tagName) };
})()`.replace(/\n/g, ' ')

/**
 * An element's entrance tween has finished: visible, opaque, unmoved. Takes a
 * page expression that yields the element.
 */
const settledExpr = (elementJs) =>
  `(() => { const el = ${elementJs}; const cs = getComputedStyle(el); return cs.visibility === 'visible' && Number(cs.opacity) >= 0.99 && /^(none|matrix\\(1, 0, 0, 1, 0, 0\\))$/.test(cs.transform) })()`
const settledProbe = (selector) =>
  settledExpr(`document.querySelector(${JSON.stringify(selector)})`)

/** The bento cell for a service, found by its visible title. */
const bentoCell = (title) =>
  `Array.from(document.querySelectorAll('.bento__cell')).find((c) => c.querySelector('h3').textContent === ${JSON.stringify(title)})`

function layoutPass(url, w) {
  const review = url.includes('review=1')
  const label = `${w}px ${review ? 'review' : 'customer'}`
  open(url, w)
  const first = evalJs(layoutProbe)
  // Scroll through twice: the pinned work stack adds a spacer on the first
  // pass, so the document is taller the second time.
  evalJs('window.scrollTo(0, document.body.scrollHeight); "ok"')
  ab('wait', '600')
  evalJs('window.scrollTo(0, document.body.scrollHeight); "ok"')
  const motion = until(motionProbe, (m) => m.checked > 0 && m.hidden === 0)
  check(
    `${label}: every motion target visible after scrolling through`,
    motion.checked > 0 && motion.hidden === 0,
    `${motion.hidden} of ${motion.checked} hidden${motion.hidden ? `: ${motion.sample.join(', ')}` : ''}`,
  )
  evalJs('window.scrollTo(0, 0); "ok"')
  until('window.scrollY === 0')
  const after = evalJs(layoutProbe)
  check(
    `${label}: no horizontal overflow`,
    first.sw <= first.cw && after.sw <= after.cw && after.overCount === 0,
    `scrollWidth ${after.sw} vs clientWidth ${after.cw}; ${after.overCount} elements past the edge ${after.over.join(', ')}`,
  )
  check(
    `${label}: exactly one H1 with readable text`,
    after.h1 === 1 && after.h1Text.length > 10,
    `found ${after.h1}: "${after.h1Text}"`,
  )
  check(
    `${label}: H1 text is the expected one`,
    review
      ? after.h1Text === 'What sets T&D apart, up front.'
      : after.h1Text === 'One shop for the whole car.',
    after.h1Text,
  )
  check(`${label}: H1 is at most 2 lines`, after.h1Lines <= 2, `${after.h1Lines} lines`)
  if (!review) {
    const crop = evalJs(heroCropProbe.replace('SIGN_W', String(SIGN_W)))
    check(
      `${label}: storefront sign, address, and phone inside the hero crop`,
      crop.left <= SIGN.left &&
        crop.right >= SIGN.right &&
        crop.top <= SIGN.top &&
        crop.bottom >= SIGN.bottom,
      `plane ${crop.w}x${crop.h}, image x ${crop.left.toFixed(2)}–${crop.right.toFixed(2)}, y ${crop.top.toFixed(2)}–${crop.bottom.toFixed(2)}, sign ${crop.signPx}px wide`,
    )
  }
  check(`${label}: noindex present`, /noindex/.test(after.robots))
  check(
    `${label}: Cabinet Grotesk loaded and Plex Sans is the body face`,
    after.display === true && /IBM Plex Sans/.test(after.body),
    after.body,
  )
  const errs = consoleErrors()
  check(`${label}: no console errors`, errs.length === 0, errs.slice(0, 3).join(' | '))
  const offenders = networkOffenders()
  check(
    `${label}: only same-origin GET requests`,
    offenders.length === 0,
    offenders.slice(0, 3).join(' | '),
  )
}

function bentoPass() {
  open(BASE, 1440)
  evalJs("document.getElementById('service').scrollIntoView(); 'ok'")
  until(settledProbe('.bento'))
  const r = evalJs(
    `(() => {
      const grid = document.querySelector('.bento');
      const cells = Array.from(grid.querySelectorAll(':scope > .bento__cell'));
      const g = grid.getBoundingClientRect();
      const rects = cells.map((c) => c.getBoundingClientRect());
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const rows = new Set(rects.map((r) => Math.round(r.top))).size;
      const area = rects.reduce((s, r) => s + r.width * r.height, 0);
      const fill = area / (g.width * g.height);
      const spans = cells.map((c) => c.className.includes('wide') ? 7 : 5);
      const row1 = Math.abs(rects[0].right - rects[1].left) <= 2 && Math.abs(rects[0].top - rects[1].top) <= 1;
      const row2 = Math.abs(rects[2].right - rects[3].left) <= 2 && Math.abs(rects[2].top - rects[3].top) <= 1;
      const titles = cells.map((c) => c.querySelector('h3'));
      const horizontal = titles.filter((t) => { const cs = getComputedStyle(t); const tr = t.getBoundingClientRect(); return cs.writingMode === 'horizontal-tb' && cs.transform === 'none' && tr.width > tr.height; }).length;
      const ratio = rects[0].width / rects[1].width;
      const ctas = cells.filter((c) => c.querySelector('button')?.textContent.includes('Start a request')).length;
      const examples = cells.map((c) => c.querySelectorAll('.bento__examples li').length);
      return { cols, rows, fill: Number(fill.toFixed(3)), spans, row1, row2, horizontal, ratio: Number(ratio.toFixed(2)), ctas, examples, dense: getComputedStyle(grid).gridAutoFlow };
    })()`.replace(/\n/g, ' '),
  )
  check(
    '1440px bento: 12 columns, 2 rows, dense flow',
    r.cols === 12 && r.rows === 2 && /dense/.test(r.dense),
    `${r.cols} cols, ${r.rows} rows, ${r.dense}`,
  )
  check(
    '1440px bento: spans are 7,5 then 5,7 (24 of 24 cells)',
    r.spans.join(',') === '7,5,5,7' && r.spans.reduce((a, b) => a + b, 0) === 24,
    r.spans.join(','),
  )
  check(
    '1440px bento: rows are gapless and aligned',
    r.row1 && r.row2 && r.fill > 0.98,
    `fill ${r.fill}`,
  )
  check(
    '1440px bento: wide/narrow width ratio is 7:5',
    Math.abs(r.ratio - 1.4) < 0.05,
    `ratio ${r.ratio}`,
  )
  check(
    '1440px bento: all four titles read left to right',
    r.horizontal === 4,
    `${r.horizontal} of 4`,
  )
  check(
    '1440px bento: each cell has a Start a request control and 2–3 examples',
    r.ctas === 4 && r.examples.every((n) => n >= 2 && n <= 3),
    `${r.ctas} ctas, examples ${r.examples.join('/')}`,
  )
}

const setVal = (selector, v) =>
  evalJs(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : (el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype); Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); return 'ok' })()`,
  )
const clickSel = (selector) =>
  evalJs(`document.querySelector(${JSON.stringify(selector)}).click(); 'ok'`)
const submitDialog = () => {
  evalJs("document.querySelector('dialog[open] form').requestSubmit(); 'ok'")
  ab('wait', '150')
}
const dialogOpen = "!!document.querySelector('dialog[open]')"
const dialogClosed = "!document.querySelector('dialog[open]')"
/** The real key: Chrome's close watcher fires `cancel`, the app closes and returns focus. */
const pressEscape = () => {
  ab('press', 'Escape')
  until(dialogClosed)
}
const activeIs = (selector) =>
  evalJs(`document.activeElement === document.querySelector(${JSON.stringify(selector)})`)
const activeDesc = () =>
  evalJs(
    "(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.className ? '.' + String(a.className).split(' ')[0] : ''} \"${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 24)}\"` : 'none' })()",
  )

function requestPass(w) {
  const label = `${w}px request`
  open(BASE, w)
  const trigger = '.hero__actions button'
  clickSel(trigger)
  until(dialogOpen)
  check(
    `${label}: dialog opens as a modal`,
    evalJs("!!document.querySelector('dialog[open][aria-modal=true]')"),
  )
  check(
    `${label}: focus moved into the dialog`,
    evalJs("document.querySelector('dialog[open]').contains(document.activeElement)"),
  )
  check(
    `${label}: page scroll is locked`,
    evalJs(
      "document.documentElement.classList.contains('has-dialog') && getComputedStyle(document.documentElement).overflow === 'hidden'",
    ),
  )
  submitDialog()
  const errCount = evalJs("document.querySelectorAll('dialog[open] .field__error').length")
  check(`${label}: empty submit rejected with inline errors`, errCount >= 6, `${errCount} errors`)
  check(
    `${label}: error summary has role=alert and focus`,
    evalJs(
      "(() => { const a = document.querySelector('dialog[open] [role=alert]'); return !!a && document.activeElement === a })()",
    ),
  )
  setVal('dialog[open] input[name=name]', 'Ana Test')
  setVal('dialog[open] input[name=phone]', '(718) 555-0100')
  setVal('dialog[open] input[name=vehicle]', '2016 Honda CR-V')
  setVal('dialog[open] select[name=service]', 'bodywork')
  setVal(
    'dialog[open] textarea[name=issue]',
    'Rear bumper got clipped in a parking lot, paint is scraped and the corner is pushed in.',
  )
  clickSel('dialog[open] input[name=contact][value=text]')
  submitDialog()
  check(
    `${label}: preview state rendered`,
    evalJs("!!document.querySelector('[data-testid=request-done]')"),
  )
  const done = evalJs("document.querySelector('[data-testid=request-done]')?.textContent ?? ''")
  check(`${label}: preview says nothing was sent`, /Concept demo—nothing was sent\./.test(done))
  check(
    `${label}: preview echoes the vehicle and service`,
    /2016 Honda CR-V/.test(done) && /Bodywork/.test(done) && /Text me/.test(done),
  )
  pressEscape()
  check(`${label}: Escape closes the dialog`, evalJs(dialogClosed))
  check(
    `${label}: scroll lock released`,
    !evalJs("document.documentElement.classList.contains('has-dialog')"),
  )
  check(`${label}: focus returned to the trigger`, activeIs(trigger), `focus on ${activeDesc()}`)
  // Reopen: values must be gone.
  clickSel(trigger)
  until(dialogOpen)
  check(
    `${label}: reopened form is empty`,
    evalJs(
      "document.querySelector('dialog[open] input[name=name]').value === '' && document.querySelector('dialog[open] select[name=service]').value === ''",
    ),
  )
  pressEscape()
  // Bento pre-selection, from the Electrical cell as a visitor reaches it:
  // scrolled into view and revealed. On phones the cells stack, so the cell
  // is what has to be on screen, not just the grid.
  evalJs(`${bentoCell('Electrical')}.scrollIntoView({ block: 'center' }); 'ok'`)
  check(
    `${label}: Electrical cell revealed once scrolled into view`,
    until(settledExpr(bentoCell('Electrical'))) === true,
  )
  evalJs(`${bentoCell('Electrical')}.querySelector('button').click(); 'ok'`)
  until(dialogOpen)
  check(
    `${label}: Start a request pre-selects the service`,
    evalJs("document.querySelector('dialog[open] select[name=service]')?.value") === 'electrical',
  )
  pressEscape()
  check(
    `${label}: focus returned to the bento control that opened it`,
    evalJs(
      "(() => { const a = document.activeElement; return !!a && a.tagName === 'BUTTON' && !!a.closest('.bento__cell') && a.closest('.bento__cell').querySelector('h3').textContent === 'Electrical' })()",
    ),
    `focus on ${activeDesc()}`,
  )
  const offenders = networkOffenders()
  check(
    `${label}: zero POST or cross-origin requests`,
    offenders.length === 0,
    offenders.slice(0, 3).join(' | '),
  )
  const errs = consoleErrors()
  check(`${label}: no console errors`, errs.length === 0, errs.slice(0, 3).join(' | '))
}

function receptionistPass(w) {
  const label = `${w}px receptionist`
  open(BASE, w)
  const trigger = '#after-hours .after__cta'
  evalJs(`document.querySelector(${JSON.stringify(trigger)}).scrollIntoView(); 'ok'`)
  until(settledProbe('#after-hours .after__sample'))
  clickSel(trigger)
  until(dialogOpen)
  check(`${label}: dialog opens`, evalJs(dialogOpen))
  check(
    `${label}: labelled as a demo`,
    /Concept demo—not live/.test(evalJs("document.querySelector('dialog[open]').textContent")),
  )
  submitDialog()
  check(
    `${label}: empty name rejected`,
    evalJs("!!document.querySelector('dialog[open] [role=alert]')"),
  )
  setVal('dialog[open] input[name=name]', 'Sam Test')
  submitDialog()
  setVal('dialog[open] input[name=phone]', '917-555-0100')
  submitDialog()
  setVal('dialog[open] input[name=vehicle]', '2019 Toyota RAV4')
  clickSel('dialog[open] input[name=powertrain][value=hybrid]')
  submitDialog()
  clickSel('dialog[open] input[name=job][value=electrical]')
  submitDialog()
  setVal(
    'dialog[open] textarea[name=story]',
    'Dashboard warning light came on this evening and the car hesitated twice on the way home.',
  )
  submitDialog()
  clickSel('dialog[open] input[name=safe][value=no]')
  submitDialog()
  check(
    `${label}: summary state rendered`,
    evalJs("!!document.querySelector('[data-testid=receptionist-done]')"),
  )
  const text = evalJs(
    "document.querySelector('[data-testid=receptionist-done]')?.textContent ?? ''",
  )
  check(
    `${label}: summary carries the answers and flags unsafe`,
    /2019 Toyota RAV4 · Hybrid/.test(text) &&
      /Electrical/.test(text) &&
      /flagged for the crew/.test(text),
  )
  check(
    `${label}: summary says nothing was sent and promises nothing`,
    /Concept demo—nothing was sent\./.test(text) && /No diagnosis, no quote, no booking/.test(text),
  )
  const log = evalJs(
    "document.querySelector('dialog[open] [role=log][aria-live=polite]')?.textContent ?? ''",
  )
  check(`${label}: transcript is a live log`, /Receptionist/.test(log) && /Sam Test/.test(log))
  pressEscape()
  check(
    `${label}: Escape closes and focus returns`,
    evalJs(dialogClosed) && activeIs(trigger),
    `dialog open ${evalJs(dialogOpen)}, focus on ${activeDesc()}`,
  )
  const offenders = networkOffenders()
  check(
    `${label}: zero POST or cross-origin requests`,
    offenders.length === 0,
    offenders.slice(0, 3).join(' | '),
  )
}

function carouselPass(w) {
  const label = `${w}px carousel`
  open(BASE, w)
  evalJs("document.getElementById('reviews').scrollIntoView(); 'ok'")
  // The whole carousel is a reveal target; its controls cannot take focus
  // until the entrance tween has finished.
  check(
    `${label}: carousel revealed after scrolling to it`,
    until(settledProbe('.carousel')) === true,
  )
  const stateProbe =
    "(() => { const shown = Array.from(document.querySelectorAll('.carousel__slide')).filter((s) => !s.hidden); return { shown: shown.length, label: shown[0]?.getAttribute('aria-label'), cite: shown[0]?.querySelector('cite')?.textContent, count: document.querySelector('.carousel__count').textContent, live: document.querySelector('.carousel__viewport').getAttribute('aria-live'), focus: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName } })()"
  const state = () => evalJs(stateProbe)
  const settle = (expected) => until(stateProbe, (s) => s.label === expected)
  const s0 = state()
  check(
    `${label}: one slide shown, polite live region, no autoplay attributes`,
    s0.shown === 1 && s0.live === 'polite' && s0.label === '1 of 5',
    JSON.stringify(s0),
  )
  clickSel('[aria-label="Next testimonial"]')
  const s1 = settle('2 of 5')
  check(
    `${label}: Next advances to 2 of 5`,
    s1.label === '2 of 5' && s1.count === '2 of 5' && s1.cite !== s0.cite,
    JSON.stringify(s1),
  )
  // Real key events on the focused control. Focus is confirmed before each
  // press so a lost keystroke cannot be mistaken for app behaviour.
  ab('focus', '[aria-label="Previous testimonial"]')
  const f1 = state().focus
  ab('press', 'ArrowLeft')
  const s2 = settle('1 of 5')
  check(
    `${label}: ArrowLeft on the focused Previous control goes back to 1 of 5`,
    f1 === 'Previous testimonial' && s2.label === '1 of 5' && s2.cite === s0.cite,
    `focus on ${f1}; ${JSON.stringify(s2)}`,
  )
  ab('press', 'ArrowLeft')
  const s3 = settle('5 of 5')
  check(
    `${label}: ArrowLeft again wraps to 5 of 5`,
    s3.label === '5 of 5' && s3.count === '5 of 5',
    JSON.stringify(s3),
  )
  ab('focus', '[aria-label="Next testimonial"]')
  const f2 = state().focus
  ab('press', 'ArrowRight')
  const s4 = settle('1 of 5')
  check(
    `${label}: ArrowRight on the focused Next control wraps to 1 of 5`,
    f2 === 'Next testimonial' && s4.label === '1 of 5' && s4.cite === s0.cite,
    `focus on ${f2}; ${JSON.stringify(s4)}`,
  )
  clickSel('[aria-label="Previous testimonial"]')
  const s5 = settle('5 of 5')
  check(`${label}: Previous wraps to 5 of 5`, s5.label === '5 of 5', JSON.stringify(s5))
  ab('wait', '2500')
  const s6 = state()
  check(`${label}: no autoplay after waiting`, s6.label === '5 of 5', JSON.stringify(s6))
  const btn = evalJs(
    '(() => { const r = document.querySelector(\'[aria-label="Next testimonial"]\').getBoundingClientRect(); return Math.min(r.width, r.height) })()',
  )
  check(`${label}: carousel buttons are at least 44px`, btn >= 44, `${btn}px`)
}

function reviewPass(w) {
  const label = `${w}px review exit`
  open(`${BASE}?review=1`, w)
  check(
    `${label}: review layer precedes the customer site`,
    evalJs(
      "(() => { const r = document.querySelector('.review'); const h = document.querySelector('.site-header'); return !!r && !!h && r.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING })()",
    ) > 0,
  )
  check(
    `${label}: hero heading is an H2 in review mode`,
    evalJs("document.getElementById('hero-title').tagName") === 'H2',
  )
  // Keyboard order: skip link, then the two pitch controls, each visibly outlined.
  ab('press', 'Tab')
  ab('press', 'Tab')
  const exitFocus = evalJs(
    '(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { text: el.textContent.trim(), outline: cs.outlineStyle, width: parseFloat(cs.outlineWidth) } })()',
  )
  ab('press', 'Tab')
  const anchorFocus = evalJs(
    "(() => { const el = document.activeElement; return { text: el.textContent.trim(), href: el.getAttribute('href') } })()",
  )
  check(
    `${label}: Tab reaches View customer site (outlined) then See what changed`,
    exitFocus.text === 'View customer site' &&
      exitFocus.outline === 'solid' &&
      exitFocus.width >= 2 &&
      anchorFocus.text === 'See what changed' &&
      anchorFocus.href === '#review-changes',
    `${JSON.stringify(exitFocus)} then ${JSON.stringify(anchorFocus)}`,
  )
  // textContent, not innerText: the tiles and rows are visibility:hidden until
  // their reveal tween runs, and innerText would skip them.
  const pitch = evalJs(
    "(() => { const r = document.querySelector('.review'); const text = r.textContent.replace(/\\s+/g, ' ').trim(); return { text, words: text.split(' ').length, tiles: r.querySelectorAll('.review-tile').length, rows: r.querySelectorAll('.review-flow__row').length, anchor: r.querySelector('a[href=\"#review-changes\"]')?.textContent.trim() ?? '', target: !!document.getElementById('review-changes'), buttons: r.querySelectorAll('button').length } })()",
  )
  const dollars = pitch.text.match(/\$[\d,]+/g) ?? []
  check(
    `${label}: price and add-on sentence present, no invented add-on price`,
    /\$1,000 flat/.test(pitch.text) &&
      /Answers overflow or after-hours calls, collects the job details, and sends a callback summary\./.test(
        pitch.text,
      ) &&
      dollars.length === 1 &&
      dollars[0] === '$1,000',
    `"${(pitch.text.match(/.{0,16}\$[\d,]+.{0,16}/) ?? ['no dollar amount'])[0]}"; amounts ${dollars.join(', ') || 'none'}`,
  )
  check(
    `${label}: three proof tiles, four change rows, one exit button`,
    pitch.tiles === 3 && pitch.rows === 4 && pitch.buttons === 1,
    `${pitch.tiles} tiles, ${pitch.rows} rows, ${pitch.buttons} buttons`,
  )
  check(
    `${label}: pitch reads in one glance (under 200 words)`,
    pitch.words < 200,
    `${pitch.words} words`,
  )
  check(
    `${label}: "See what changed" is an in-page anchor to the change ledger`,
    pitch.anchor === 'See what changed' && pitch.target,
  )
  clickSel('a[href="#review-changes"]')
  const anchoredProbe =
    "(() => { const r = document.getElementById('review-changes').getBoundingClientRect(); return { hash: location.hash, top: Math.round(r.top), inner: window.innerHeight } })()"
  const anchored = until(
    anchoredProbe,
    (a) => a.hash === '#review-changes' && a.top >= -2 && a.top < a.inner,
  )
  check(
    `${label}: the anchor scrolls the change ledger into view`,
    anchored.hash === '#review-changes' && anchored.top >= -2 && anchored.top < anchored.inner,
    JSON.stringify(anchored),
  )
  evalJs('window.scrollTo(0, 0); "ok"')
  until('window.scrollY === 0')
  clickSel('.review .btn--ink')
  until("!document.querySelector('.review')")
  check(
    `${label}: query parameter removed without reload`,
    evalJs('location.search') === '' &&
      evalJs('location.pathname') === new URL(BASE).pathname &&
      evalJs('location.hash') === '#review-changes',
    `${evalJs('location.pathname')}${evalJs('location.search')}${evalJs('location.hash')}`,
  )
  check(
    `${label}: review layer removed, hero owns the H1`,
    !evalJs("!!document.querySelector('.review')") &&
      evalJs("document.querySelectorAll('h1').length") === 1 &&
      evalJs("document.getElementById('hero-title').tagName") === 'H1',
  )
  check(
    `${label}: focus moved to the hero heading`,
    evalJs("document.activeElement === document.getElementById('hero-title')"),
    `focus on ${activeDesc()}`,
  )
  check(
    `${label}: no sticky dock while the review layer was up`,
    evalJs("!!document.querySelector('.dock')") === true,
    'dock returns only after exiting review',
  )
  const offenders = networkOffenders()
  check(
    `${label}: zero POST or cross-origin requests`,
    offenders.length === 0,
    offenders.slice(0, 3).join(' | '),
  )
}

function dockPass(w) {
  const label = `${w}px dock`
  open(BASE, w, { height: 740 })
  const top = evalJs(
    "(() => { const d = document.querySelector('.dock'); return { vis: getComputedStyle(d).visibility, hero: !!document.querySelector('[data-hero-actions]') } })()",
  )
  check(
    `${label}: dock hidden while hero buttons are on screen`,
    top.vis === 'hidden' || top.hero === false,
    top.vis,
  )
  // The root has `scroll-behavior: smooth`, so a plain scrollTo animates for
  // over a second while the dock's data-visible attribute is set within the
  // first few hundred pixels; measuring then finds the footer still far below
  // the viewport. Jump instantly to the document end, where body padding is
  // what keeps the last footer link clear of the dock, and wait for scrollY to
  // reach the maximum and hold it across two reads before measuring.
  evalJs(
    "window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); 'ok'",
  )
  // The dock is shown by an IntersectionObserver callback and slides in over
  // 0.3s; measure only once the attribute is set and no transition is running.
  const shown = until(
    "(() => { const d = document.querySelector('.dock'); return d.hasAttribute('data-visible') && d.getAnimations().length === 0 })()",
  )
  check(`${label}: dock shown once the hero buttons leave the viewport`, shown === true)
  const settled = until(
    '(() => { const max = document.documentElement.scrollHeight - window.innerHeight; const y = window.scrollY; const prev = window.__qaScrollY; window.__qaScrollY = y; return { y, max, atEnd: Math.abs(y - max) <= 1, stable: prev === y } })()',
    (s) => s.atEnd && s.stable,
  )
  check(
    `${label}: page scrolled to the document end and holding`,
    settled.atEnd && settled.stable,
    `scrollY ${settled.y} vs max ${settled.max}`,
  )
  const r = evalJs(
    "(() => { const d = document.querySelector('.dock'); const cs = getComputedStyle(d); const dr = d.getBoundingClientRect(); const vv = window.visualViewport; const links = Array.from(document.querySelectorAll('.site-footer a')); const last = links[links.length - 1].getBoundingClientRect(); const btns = Array.from(d.querySelectorAll('a, button')).map((b) => b.getBoundingClientRect().height); const rule = Array.from(document.styleSheets).flatMap((s) => { try { return Array.from(s.cssRules) } catch { return [] } }).flatMap((r) => (r.cssRules ? Array.from(r.cssRules) : [r])).find((r) => r.selectorText === '.dock' && r.style.position === 'fixed'); return { vis: cs.visibility, position: cs.position, bottom: dr.bottom, inner: window.innerHeight, vvBottom: vv ? vv.offsetTop + vv.height : null, lastTop: last.top, lastBottom: last.bottom, dockTop: dr.top, pad: parseFloat(getComputedStyle(document.body).paddingBottom), h: dr.height, btns, safeArea: rule ? rule.style.paddingBottom : 'no fixed .dock rule' } })()",
  )
  check(
    `${label}: dock visible after the hero, fixed, and pinned to the viewport bottom`,
    r.vis === 'visible' &&
      r.position === 'fixed' &&
      Math.abs(r.bottom - r.inner) <= 1 &&
      (r.vvBottom === null || Math.abs(r.bottom - r.vvBottom) <= 1),
    `${r.position}, bottom ${r.bottom} vs innerHeight ${r.inner}, visual viewport ${r.vvBottom}`,
  )
  check(
    `${label}: dock padding reserves the safe-area inset`,
    /env\(safe-area-inset-bottom/.test(r.safeArea),
    r.safeArea,
  )
  check(
    `${label}: dock does not cover the last footer link`,
    r.lastTop >= 0 && r.lastBottom <= r.dockTop + 0.5,
    `link top ${r.lastTop}, bottom ${r.lastBottom}, dock top ${r.dockTop}`,
  )
  check(
    `${label}: body reserves space for the dock`,
    r.pad >= r.h - 1,
    `padding ${r.pad}, dock ${r.h}`,
  )
  check(
    `${label}: dock buttons are at least 44px tall`,
    r.btns.length === 2 && r.btns.every((h) => h >= 44),
    r.btns.join(','),
  )
}

function targetsAndFocusPass(w) {
  const label = `${w}px targets`
  open(BASE, w)
  const small = evalJs(
    "(() => Array.from(document.querySelectorAll('button, .btn, .site-nav__link, .contact__link, .site-footer__nav a, .dialog__close')).filter((el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('dialog')) return false; const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return false; return r.height < 43.5 || r.width < 24; }).map((el) => `${el.tagName}.${el.className}`.slice(0, 40)))()",
  )
  check(
    `${label}: visible controls are at least 44px`,
    small.length === 0,
    small.slice(0, 4).join(', '),
  )
  ab('press', 'Tab')
  ab('press', 'Tab')
  const focus = evalJs(
    '(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { tag: el.tagName, cls: el.className, style: cs.outlineStyle, width: cs.outlineWidth } })()',
  )
  check(
    `${label}: keyboard focus is visibly outlined`,
    focus.style === 'solid' && parseFloat(focus.width) >= 2,
    JSON.stringify(focus),
  )
  const contrast = evalJs(
    "(() => { const b = document.querySelector('.hero .btn--primary'); const cs = getComputedStyle(b); return `${cs.color} on ${cs.backgroundColor}` })()",
  )
  check(
    `${label}: primary button renders white on cobalt`,
    /rgb\(255, 255, 255\) on rgb\(31, 79, 216\)/.test(contrast),
    contrast,
  )
}

function reducedMotionPass(w, url) {
  const label = `${w}px ${url.includes('review=1') ? 'review' : 'customer'} reduced motion`
  open(url, w, { reducedMotion: true })
  const r = evalJs(
    "(() => { const hidden = Array.from(document.querySelectorAll('[data-reveal], .statement__word, .hero__word-inner, .hero__lede, .hero__plane')).filter((el) => { const cs = getComputedStyle(el); return Number(cs.opacity) < 0.99 || cs.visibility === 'hidden' || (cs.transform !== 'none' && cs.transform !== 'matrix(1, 0, 0, 1, 0, 0)') || (cs.clipPath !== 'none' && !/^inset\\(0(px|%)?( 0(px|%)?){0,3}\\)$/.test(cs.clipPath)); }).length; const marquee = getComputedStyle(document.querySelector('.marquee__track')).animationName; const sticky = Array.from(document.querySelectorAll('.stack__card')).filter((c) => getComputedStyle(c).position === 'sticky').length; const pinned = !!document.querySelector('.pin-spacer'); return { hidden, marquee, sticky, pinned } })()",
  )
  check(
    `${label}: nothing hidden, transformed, or clipped on load`,
    r.hidden === 0,
    `${r.hidden} hidden`,
  )
  check(
    `${label}: marquee static, cards in normal flow, nothing pinned`,
    r.marquee === 'none' && r.sticky === 0 && r.pinned === false,
    JSON.stringify(r),
  )
}

const only = new Set(
  (process.env.QA_ONLY ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)
const wants = (name) => only.size === 0 || only.has(name)

try {
  bootstrapTab()
  if (wants('layout')) {
    for (const w of widths) {
      layoutPass(BASE, w)
      layoutPass(`${BASE}?review=1`, w)
    }
  }
  if (wants('bento')) bentoPass()
  for (const w of [390, 1440]) {
    if (wants('request')) requestPass(w)
    if (wants('carousel')) carouselPass(w)
    if (wants('review')) reviewPass(w)
    if (wants('targets')) targetsAndFocusPass(w)
    if (wants('motion')) {
      reducedMotionPass(w, BASE)
      reducedMotionPass(w, `${BASE}?review=1`)
    }
  }
  if (wants('receptionist')) receptionistPass(390)
  if (wants('dock')) {
    dockPass(390)
    dockPass(320)
  }
} finally {
  try {
    ab('close')
  } catch {
    // session may already be gone
  }
}

console.log('')
if (failures.length) {
  console.log(`${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('All browser checks passed')
