/**
 * Programmatic DOM check against the production preview using the
 * agent-browser CLI. Not a substitute for looking at the page; it verifies
 * what can be measured.
 *
 *   npm run build && npm run preview   (serves dist/ on port 4175)
 *   npm run qa:browser                 (in another terminal)
 *
 * At 320 / 390 / 768 / 1440 for both the customer URL and `?review=1`: no
 * horizontal overflow, one readable H1 with the expected text and line count,
 * noindex, no console errors, only same-origin GET requests, every motion
 * target visible after scrolling through, web fonts loaded. Then: the gapless
 * bento at 1440 (24 of 24 cells, titles horizontal), the request dialog at
 * 390 and 1440 (validation, preview state, Escape, focus return, service
 * pre-selection), the receptionist demo at 390, the carousel, review-mode
 * exit without a reload, the mobile dock, touch targets, focus visibility,
 * and reduced motion in both modes.
 */
import { execFileSync } from 'node:child_process'

const BASE = process.env.QA_BASE ?? 'http://localhost:4175/t-and-d-auto-repair-concept/'
const SESSION = 'td-qa'
const widths = [320, 390, 768, 1440]
const failures = []

const ab = (...args) => {
  try {
    return execFileSync('agent-browser', ['--session', SESSION, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60_000,
    }).trim()
  } catch (err) {
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

const open = (url, w, h = 900) => {
  ab('set', 'viewport', String(w), String(h))
  ab('open', url)
  ab('wait', '--load', 'networkidle')
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

function layoutPass(url, w) {
  const review = url.includes('review=1')
  const label = `${w}px ${review ? 'review' : 'customer'}`
  open(url, w)
  const first = evalJs(layoutProbe)
  evalJs('window.scrollTo(0, document.body.scrollHeight); "ok"')
  ab('wait', '1200')
  evalJs('window.scrollTo(0, document.body.scrollHeight); "ok"')
  ab('wait', '1500')
  const motion = evalJs(motionProbe)
  check(
    `${label}: every motion target visible after scrolling through`,
    motion.checked > 0 && motion.hidden === 0,
    `${motion.hidden} of ${motion.checked} hidden${motion.hidden ? `: ${motion.sample.join(', ')}` : ''}`,
  )
  evalJs('window.scrollTo(0, 0); "ok"')
  ab('wait', '300')
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
      ? after.h1Text ===
          'You already have the trust. This makes it easier to turn it into the next job.'
      : after.h1Text === 'One shop for the whole car.',
    after.h1Text,
  )
  if (!review) {
    const max = w >= 1024 ? 2 : 3
    check(
      `${label}: hero H1 is at most ${max} lines`,
      after.h1Lines <= max,
      `${after.h1Lines} lines`,
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
  ab('wait', '1500')
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
  ab('wait', '200')
}

function requestPass(w) {
  const label = `${w}px request`
  open(BASE, w)
  const trigger = '.hero__actions button'
  clickSel(trigger)
  ab('wait', '400')
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
  ab('press', 'Escape')
  ab('wait', '250')
  check(`${label}: Escape closes the dialog`, !evalJs("!!document.querySelector('dialog[open]')"))
  check(
    `${label}: scroll lock released`,
    !evalJs("document.documentElement.classList.contains('has-dialog')"),
  )
  check(
    `${label}: focus returned to the trigger`,
    evalJs(`document.activeElement === document.querySelector(${JSON.stringify(trigger)})`),
  )
  // Reopen: values must be gone.
  clickSel(trigger)
  ab('wait', '300')
  check(
    `${label}: reopened form is empty`,
    evalJs(
      "document.querySelector('dialog[open] input[name=name]').value === '' && document.querySelector('dialog[open] select[name=service]').value === ''",
    ),
  )
  ab('press', 'Escape')
  ab('wait', '200')
  // Bento pre-selection.
  evalJs("document.getElementById('service').scrollIntoView(); 'ok'")
  ab('wait', '800')
  evalJs(
    "Array.from(document.querySelectorAll('.bento__cell')).find((c) => c.querySelector('h3').textContent === 'Electrical').querySelector('button').click(); 'ok'",
  )
  ab('wait', '300')
  check(
    `${label}: Start a request pre-selects the service`,
    evalJs("document.querySelector('dialog[open] select[name=service]')?.value") === 'electrical',
  )
  ab('press', 'Escape')
  ab('wait', '200')
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
  ab('wait', '600')
  clickSel(trigger)
  ab('wait', '400')
  check(`${label}: dialog opens`, evalJs("!!document.querySelector('dialog[open]')"))
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
  ab('press', 'Escape')
  ab('wait', '250')
  check(
    `${label}: Escape closes and focus returns`,
    !evalJs("!!document.querySelector('dialog[open]')") &&
      evalJs(`document.activeElement === document.querySelector(${JSON.stringify(trigger)})`),
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
  ab('wait', '1200')
  const state = () =>
    evalJs(
      "(() => { const shown = Array.from(document.querySelectorAll('.carousel__slide')).filter((s) => !s.hidden); return { shown: shown.length, label: shown[0]?.getAttribute('aria-label'), cite: shown[0]?.querySelector('cite')?.textContent, count: document.querySelector('.carousel__count').textContent, live: document.querySelector('.carousel__viewport').getAttribute('aria-live') } })()",
    )
  const s0 = state()
  check(
    `${label}: one slide shown, polite live region, no autoplay attributes`,
    s0.shown === 1 && s0.live === 'polite' && s0.label === '1 of 5',
    JSON.stringify(s0),
  )
  clickSel('[aria-label="Next testimonial"]')
  ab('wait', '600')
  const s1 = state()
  check(
    `${label}: Next advances to 2 of 5`,
    s1.label === '2 of 5' && s1.count === '2 of 5' && s1.cite !== s0.cite,
    JSON.stringify(s1),
  )
  evalJs("document.querySelector('[aria-label=\"Previous testimonial\"]').focus(); 'ok'")
  ab('press', 'ArrowLeft')
  ab('wait', '600')
  const s2 = state()
  check(
    `${label}: ArrowLeft goes back to 1 of 5`,
    s2.label === '1 of 5' && s2.cite === s0.cite,
    JSON.stringify(s2),
  )
  clickSel('[aria-label="Previous testimonial"]')
  ab('wait', '600')
  check(`${label}: Previous wraps to 5 of 5`, state().label === '5 of 5')
  ab('wait', '2500')
  check(`${label}: no autoplay after waiting`, state().label === '5 of 5')
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
  check(
    `${label}: price and add-on note present`,
    /\$1,000/.test(evalJs("document.querySelector('.review').textContent")) &&
      /Final scope is discussed separately/.test(
        evalJs("document.querySelector('.review').textContent"),
      ),
  )
  clickSel('.review .btn--ink')
  ab('wait', '500')
  check(
    `${label}: query parameter removed without reload`,
    evalJs('location.search') === '' && evalJs('location.pathname') === new URL(BASE).pathname,
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
  )
  // Simulated reply action stays local.
  open(`${BASE}?review=1`, w)
  clickSel('.review__reply button')
  ab('wait', '200')
  check(
    `${label}: reply action is simulated and says so`,
    /Nothing was sent from this page/.test(
      evalJs("document.getElementById('review-reply-note').textContent"),
    ),
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
  open(BASE, w, 740)
  const top = evalJs(
    "(() => { const d = document.querySelector('.dock'); return { vis: getComputedStyle(d).visibility, hero: !!document.querySelector('[data-hero-actions]') } })()",
  )
  check(
    `${label}: dock hidden while hero buttons are on screen`,
    top.vis === 'hidden' || top.hero === false,
    top.vis,
  )
  evalJs("window.scrollTo(0, document.body.scrollHeight); 'ok'")
  ab('wait', '900')
  const r = evalJs(
    "(() => { const d = document.querySelector('.dock'); const dr = d.getBoundingClientRect(); const links = Array.from(document.querySelectorAll('.site-footer a')); const last = links[links.length - 1].getBoundingClientRect(); const btns = Array.from(d.querySelectorAll('a, button')).map((b) => b.getBoundingClientRect().height); return { vis: getComputedStyle(d).visibility, bottom: dr.bottom, inner: window.innerHeight, lastBottom: last.bottom, dockTop: dr.top, pad: parseFloat(getComputedStyle(document.body).paddingBottom), h: dr.height, btns, focusable: Array.from(d.querySelectorAll('a, button')).length } })()",
  )
  check(
    `${label}: dock visible after the hero and pinned to the bottom`,
    r.vis === 'visible' && Math.abs(r.bottom - r.inner) <= 1,
    `bottom ${r.bottom} vs ${r.inner}`,
  )
  check(
    `${label}: dock does not cover the last footer link`,
    r.lastBottom <= r.dockTop + 0.5,
    `link bottom ${r.lastBottom}, dock top ${r.dockTop}`,
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
  ab('set', 'viewport', String(w), '900')
  ab('set', 'media', 'light', 'reduced-motion')
  ab('open', url)
  ab('wait', '--load', 'networkidle')
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
  ab('set', 'media', 'light')
}

try {
  for (const w of widths) {
    layoutPass(BASE, w)
    layoutPass(`${BASE}?review=1`, w)
  }
  bentoPass()
  for (const w of [390, 1440]) {
    requestPass(w)
    carouselPass(w)
    reviewPass(w)
    targetsAndFocusPass(w)
    reducedMotionPass(w, BASE)
    reducedMotionPass(w, `${BASE}?review=1`)
  }
  receptionistPass(390)
  dockPass(390)
  dockPass(320)
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
