/**
 * Owner-facing review mode. Read once from the URL the page loaded with
 * (`?review=1`). Leaving review mode rewrites the address bar client-side so
 * the GitHub Pages path is untouched and nothing reloads.
 */
export const initialReviewMode = new URLSearchParams(window.location.search).get('review') === '1'

export function stripReviewParam() {
  const url = new URL(window.location.href)
  url.searchParams.delete('review')
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}
