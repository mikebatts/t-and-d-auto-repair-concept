# T & D Auto Repair: independent concept preview

**This is not the official T & D Auto Repair website.** It is a speculative,
unsolicited design concept for the shop at 896 4th Ave, Brooklyn, NY 11232,
prepared by Design For Anyone. It has not been commissioned, reviewed, or
endorsed by the business.

- The page is marked `noindex,nofollow` and `robots.txt` disallows crawling.
- **Every interaction is local.** The request form and the after-hours
  receptionist demo validate in the browser and show a preview of what the
  shop would receive. There is no form action, no fetch, no storage, no
  analytics, no third-party form provider. Nothing leaves the visitor's device.
- **The receptionist is a concept demonstration, not a live system**, and the
  page says so wherever it appears.

If the business would like this preview taken down, it will be removed promptly.

## URLs

| Mode                           | URL                                                                 |
| ------------------------------ | ------------------------------------------------------------------- |
| Customer site                  | `https://mikebatts.github.io/t-and-d-auto-repair-concept/`          |
| Owner review, then the concept | `https://mikebatts.github.io/t-and-d-auto-repair-concept/?review=1` |

`?review=1` renders an owner-facing panel first: the pitch, a compact
today-versus-concept comparison, what is kept from the current site, the
deliverables at `$1,000 flat`, a one-paragraph note on the optional AI phone
receptionist, and "What stays yours". **View customer site** removes the query
parameter with `history.replaceState` (no reload, GitHub Pages path untouched)
and moves focus to the hero heading. In review mode the review owns the H1 and
the hero heading becomes an H2, so each rendered mode has exactly one H1. The
phone Call / Request dock is not rendered while the review panel is up, so it
cannot cover the comparison or the deliverables; it returns with its normal
behavior once you view the customer site.

The review CTA "Reply to this email" is a simulated, no-network action and says
so. No studio email address is linked because none is used in the sibling
concepts.

## Content provenance

Every fact on the customer site was verified on September 2, 2026 against the
shop's own website (`tdautony.com`) and its Google Business Profile.

| Fact                                                                             | Source                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Name, address, shop phone, hours                                                 | Google Business Profile and official site                    |
| Cell `(917) 295-1205`, `thetdauto@gmail.com`                                     | Official site                                                |
| 4.9 rating from 102 Google reviews                                               | Google Business Profile, checked 2026-09-02                  |
| Since 1992; management and ownership refreshed in 2018                           | Official site About section (T&D's claim)                    |
| Services: Mechanical, Bodywork, Electrical, Inspection                           | Official site                                                |
| Foreign and domestic; gas, diesel, hybrid, electric                              | Official site (T&D's claim)                                  |
| Five testimonials (David Schrager, Mellica Askari, Angela Lee, Elina Street, TM) | Official site testimonial carousel, quoted as exact excerpts |
| Review themes: honesty, explanation, communication, price, fast/reliable         | Google review topic summary                                  |

Service examples inside the bento are limited to the shop's published claims
and jobs its customers describe (inspection, oil change, check engine light,
engine and drivetrain work, dent and collision repair, insurance-related
repairs, scanner diagnostics, hybrid and electric vehicles).

Not claimed anywhere: owner or legal-ownership names, prices, turnaround or
response times, warranties, guarantees, appointment availability, live
receptionist status, or any service beyond the four published areas. ASE is
mentioned only in review mode, as "T&D says its staff includes ASE Certified
Technicians", with no certification mark recreated.

No Google review is quoted. No listing, Google, or reference photograph is used.

## Generated-media disclosure

The four images in `public/assets/` are original AI-generated concept renders
made for this preview: a charcoal brick garage at dusk, an engine and
transmission on a cart, a technician with a diagnostic tablet, and a technician
checking a white sedan's panel. None is a photograph of T & D Auto Repair, its
staff, signage, or a customer vehicle. Each staged original (`td-*.webp`) was
resized with `cwebp` (quality 80, `-sharp_yuv`) from the source render into
640, 1024, and 1600 px copies for `srcset`.

## Design notes

"A technical Brooklyn service ledger." The palette follows the shop's current
storefront: graphite and near-black, workshop white, cobalt lift-blue used
structurally (rules, ticks, focus rings, the one primary button), and a single
tail-light red reserved for a small signal dot and error text. Ruled dividers,
hairline ledgers, tabular numerals, and a faint measurement grid carry the
"ledger" idea; there is no glass, no gradient wash, no rounded-card soup.

Type: Cabinet Grotesk (500/700/800) for display, self-hosted in
`public/fonts/` from Fontshare under the Indian Type Foundry Free Font License,
paired with IBM Plex Sans Variable (Open Font License, via Fontsource) for UI
and body with tabular figures. Fallbacks: Avenir Next / Helvetica Neue.

Structure (AIDA): sticky header with brand, Service / Work / Reviews / Contact
anchors and Call now; an asymmetric hero with a 72rem-measure headline plane and
the storefront render as a separate right/bottom plane that never enters the
headline; a Google proof ledger immediately after the hero; a gapless 12x2
capability bento (Mechanical 7, Electrical 5, Bodywork 5, NYS Inspection 7,
`grid-auto-flow: dense`, 2x2 on tablets, one column on phones); a scrubbed
statement; three stacked work cards; the testimonial carousel; the breadth
marquee; the after-hours concept; contact, hours, and a request panel; the
footer disclosure. Phones get a fixed Call / Request dock with safe-area
padding that stays hidden while the hero's own buttons are on screen.

Motion is GSAP with ScrollTrigger through `@gsap/react`'s `useGSAP`, registered
once in `src/lib/gsap.ts`. Hero word masks and the photo clip reveal run once on
load; `[data-reveal]` entrances, the statement scrub, and the card-stack scale
are ScrollTriggers created inside `gsap.matchMedia()` contexts keyed to
`(prefers-reduced-motion: no-preference)` (and `(min-width: 1024px)` for the
stack), so reduced-motion visitors never get a hidden initial state and
breakpoint changes rebuild cleanly. Only transform, opacity, and clip-path are
animated. The marquee is CSS-only, pauses on hover and focus, and becomes a
static wrapped row under reduced motion. Nothing pins or hijacks scroll.

Dialogs use the native `<dialog>` element: `showModal()` supplies the top layer,
inert background, Tab containment, Escape via `cancel`, and focus return.

## Local development

```bash
npm install
npm run dev            # http://localhost:5173/t-and-d-auto-repair-concept/
```

Quality gates:

```bash
npm run check          # prettier --check, eslint, tsc -b
npm run build          # tsc -b && vite build
npm run smoke          # build, then static checks on dist/ (no browser, no network)
```

Browser check (requires the `agent-browser` CLI and a running preview):

```bash
npm run build && npm run preview   # serves dist/ at http://localhost:4175/t-and-d-auto-repair-concept/
npm run qa:browser                 # in another terminal
```

The browser script checks 320, 390, 768, and 1440 px in both modes for
horizontal overflow, one readable H1 with the expected text and line count,
noindex, console errors, network requests that are not same-origin GETs, motion
targets left hidden after a scroll-through, and font loading. It then measures
the bento at 1440 (12 columns, 24 of 24 cells, 7:5 widths, horizontal titles),
drives the request dialog at 390 and 1440 (validation, preview state, Escape,
focus return, empty on reopen, service pre-selection), the receptionist demo,
the carousel, review-mode exit, the mobile dock, touch targets and focus
visibility, and reduced motion in both modes.

## Deployment

The repository is set up for GitHub Pages under `/t-and-d-auto-repair-concept/`
using the `gh-pages` package. `npm run deploy` builds and pushes `dist/` to the
`gh-pages` branch. Deployment is a separate, manual step and has not been run
as part of building this concept.
