/**
 * Regenerates the public renders from the PNG masters in art/masters/.
 * Writes the staged original plus 640, 1024, and 1600 px copies for each
 * render into public/assets/, using the names src/lib/images.ts expects.
 * Requires `cwebp` (libwebp) on PATH. Quality 80 with -sharp_yuv, which keeps
 * the storefront lettering crisp at the smaller widths.
 *
 *   npm run images
 *
 * The masters are generated concept renders, not photographs. They are kept
 * out of git (art/ is ignored) so the deployable repository stays small; the
 * expected pixel sizes below are the contract the components rely on.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readSync, closeSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const masters = join(root, 'art', 'masters')
const out = join(root, 'public', 'assets')
const widths = [640, 1024, 1600]
const quality = '80'

/** Intrinsic size of each master, mirrored in src/lib/images.ts. */
const expected = {
  hero: [2688, 1152],
  mechanical: [2048, 1360],
  electrical: [2048, 1360],
  bodywork: [2048, 1360],
}

const pngSize = (file) => {
  const fd = openSync(file, 'r')
  const head = Buffer.alloc(24)
  readSync(fd, head, 0, 24, 0)
  closeSync(fd)
  if (head.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`)
  return [head.readUInt32BE(16), head.readUInt32BE(20)]
}

const kb = (file) => `${Math.round(statSync(file).size / 1024)} KB`

try {
  execFileSync('cwebp', ['-version'], { stdio: 'ignore' })
} catch {
  console.error('cwebp is not installed or not on PATH (brew install webp).')
  process.exit(1)
}

mkdirSync(out, { recursive: true })
let failed = false

for (const [name, [w, h]] of Object.entries(expected)) {
  const src = join(masters, `${name}.png`)
  if (!existsSync(src)) {
    console.error(`MISSING  ${src}`)
    failed = true
    continue
  }
  const [pw, ph] = pngSize(src)
  if (pw !== w || ph !== h) {
    console.error(`SIZE     ${name}.png is ${pw}x${ph}, expected ${w}x${h}`)
    failed = true
    continue
  }
  const full = join(out, `td-${name}.webp`)
  execFileSync('cwebp', ['-quiet', '-q', quality, '-sharp_yuv', '-m', '6', src, '-o', full])
  console.log(`WROTE    td-${name}.webp  ${w}x${h}  ${kb(full)}`)
  for (const width of widths) {
    const file = join(out, `td-${name}-${width}.webp`)
    execFileSync('cwebp', [
      '-quiet',
      '-q',
      quality,
      '-sharp_yuv',
      '-m',
      '6',
      '-resize',
      String(width),
      '0',
      src,
      '-o',
      file,
    ])
    console.log(`WROTE    td-${name}-${width}.webp  ${width}w  ${kb(file)}`)
  }
}

if (failed) {
  console.error('\nImage regeneration failed; public/assets/ may be incomplete.')
  process.exit(1)
}
console.log('\nAll renders regenerated.')
