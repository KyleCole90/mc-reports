import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const shots = [
  ['heatmap', 'dark', 1400, 1100],
  ['coverage', 'light', 1400, 1500],
  ['card', 'light', 1400, 1500],
  ['items', 'dark', 1400, 900],
  ['card', 'dark', 1400, 1500],
]
for (const [id, scheme, w, h] of shots) {
  const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: 'light', deviceScaleFactor: 2 })
  const errs = []
  p.on('console', m => m.type() === 'error' && errs.push(m.text()))
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
  await p.goto(`http://localhost:5173/mc-reports/#${id}`, { waitUntil: 'networkidle' })
  if (scheme === 'dark') { await p.evaluate(() => document.querySelector('header button')?.click()); await p.waitForTimeout(300) }
  await p.waitForTimeout(400)
  await p.screenshot({ path: `/tmp/v2-${id}-${scheme}.png`, fullPage: true })
  console.log(id, scheme, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'ok')
  await p.close()
}
await b.close()
