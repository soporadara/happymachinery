import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

test('1. V900Showcase.css contains full dark mode theme coverage for Engine & Track section', () => {
  const cssPath = path.join(projectRoot, 'src/components/V900Showcase.css')
  assert.ok(fs.existsSync(cssPath), 'V900Showcase.css must exist')
  const css = fs.readFileSync(cssPath, 'utf8')

  // Verify section background is dark
  assert.ok(
    css.includes('.app-shell.dark .v900-deep-dive-section') ||
    css.includes('html.dark .v900-deep-dive-section'),
    'Must have dark mode section override'
  )
  assert.ok(css.includes('#070d18') || css.includes('#0a1424'), 'Must use rich midnight dark gradient for section')

  // Verify precision canvas box is dark
  assert.ok(
    css.includes('.app-shell.dark .v900-precision-canvas-box'),
    'Precision stage canvas must have dark mode styling'
  )
  assert.ok(css.includes('#0b1528') || css.includes('#070e1b'), 'Precision canvas box must use dark background in dark mode')

  // Verify text headings are light/white in dark mode
  assert.ok(css.includes('.app-shell.dark .v900-master-title'), 'Master title must have dark mode override')
  assert.ok(css.includes('.app-shell.dark .v900-core-heading'), 'Core heading must have dark mode override')

  // Verify cards and points are dark
  assert.ok(css.includes('.app-shell.dark .spec-badge-box'), 'Spec badges must have dark mode override')
  assert.ok(css.includes('.app-shell.dark .clean-point'), 'Clean points must have dark mode override')
  assert.ok(css.includes('.app-shell.dark .v900-pointer-badge'), 'Pointer badges must have dark mode override')
})

test('2. CmsLogin.tsx has responsive Google SSO button with no click-blocking overlay', () => {
  const loginTsxPath = path.join(projectRoot, 'src/pages/CmsLogin.tsx')
  assert.ok(fs.existsSync(loginTsxPath), 'CmsLogin.tsx must exist')
  const content = fs.readFileSync(loginTsxPath, 'utf8')

  // Verify handleContinueWithGoogle exists and is wired to onClick
  assert.ok(content.includes('handleContinueWithGoogle'), 'Must define handleContinueWithGoogle')
  assert.ok(content.includes('onClick={() => void handleContinueWithGoogle()}'), 'Continue with Google button must invoke handler')

  // Verify the invisible overlay is removed
  assert.ok(!content.includes('id="google-signin-btn-slot"'), 'Must remove click-blocking google-signin-btn-slot')

  // Verify Google SSO fallback modal is present
  assert.ok(content.includes('showGoogleModal'), 'Must have showGoogleModal state')
  assert.ok(content.includes('Google Single Sign-On'), 'Must render Google SSO modal title')
  assert.ok(content.includes('soporadara@kiuq.com'), 'Must support 1-click select for soporadara@kiuq.com')
})

test('3. Default admin user is pre-linked to soporadara@kiuq.com', () => {
  const defaultsPath = path.join(projectRoot, 'src/data/cmsDefaults.ts')
  const content = fs.readFileSync(defaultsPath, 'utf8')

  assert.ok(content.includes("email: 'soporadara@kiuq.com'"), 'Lead admin must have email soporadara@kiuq.com')
  assert.ok(content.includes('googleLinked: true'), 'Lead admin must have googleLinked: true')
  assert.ok(content.includes("googleEmail: 'soporadara@kiuq.com'"), 'Lead admin must have googleEmail: soporadara@kiuq.com')
})

test('4. Google Auth logic auto-links and authorizes registered primary administrator email', () => {
  const authPath = path.join(projectRoot, 'src/data/googleAuth.ts')
  const content = fs.readFileSync(authPath, 'utf8')

  assert.ok(
    content.includes('u.email && u.email.toLowerCase() === googleEmail'),
    'Must match admin by primary registered email'
  )
  assert.ok(
    content.includes('matchingUser.googleLinked = true'),
    'Must auto-link matching admin user on first Google login'
  )
})

test('5. Delivery section explicitly mentions and highlights 48 contiguous U.S. states', () => {
  const homeContentPath = path.join(projectRoot, 'src/data/homeContent.ts')
  const homeTsxPath = path.join(projectRoot, 'src/pages/Home.tsx')
  const homeCssPath = path.join(projectRoot, 'src/pages/Home.css')

  const homeContent = fs.readFileSync(homeContentPath, 'utf8')
  const homeTsx = fs.readFileSync(homeTsxPath, 'utf8')
  const homeCss = fs.readFileSync(homeCssPath, 'utf8')

  // Check homeContent data
  assert.ok(homeContent.includes('48 contiguous U.S. states'), 'homeContent delivery intro must mention 48 contiguous U.S. states')
  assert.ok(homeContent.includes('Shipping available across 48 contiguous U.S. states'), 'homeContent delivery note must mention 48 contiguous U.S. states')

  // Check Home.tsx UI
  assert.ok(homeTsx.includes('delivery-region-pill'), 'Home.tsx must render delivery-region-pill')
  assert.ok(homeTsx.includes('48 Contiguous U.S. States'), 'Home.tsx must render 48 Contiguous U.S. States in badge')

  // Check Home.css styling
  assert.ok(homeCss.includes('.delivery-region-pill'), 'Home.css must style delivery-region-pill')
  assert.ok(homeCss.includes('.app-shell.dark .delivery-region-pill'), 'Home.css must style delivery-region-pill for dark mode')
})

test('6. Redundant inquiry CTA buttons are completely removed from V900 showcase and Home sections', () => {
  const v900Path = path.join(projectRoot, 'src/components/V900Showcase.tsx')
  const homePath = path.join(projectRoot, 'src/pages/Home.tsx')
  const homeContentPath = path.join(projectRoot, 'src/data/homeContent.ts')

  const v900Tsx = fs.readFileSync(v900Path, 'utf8')
  const homeTsx = fs.readFileSync(homePath, 'utf8')
  const homeContent = fs.readFileSync(homeContentPath, 'utf8')

  // Kubota & Track buttons removed
  assert.ok(!v900Tsx.includes('Inquire About Kubota Engine'), 'Must remove Inquire About Kubota Engine button')
  assert.ok(!v900Tsx.includes('Inquire About Track System'), 'Must remove Inquire About Track System button')

  // Package deals & Specs buttons removed from JSX
  assert.ok(!homeTsx.includes('fork-action'), 'Must remove fork-action button container from Home.tsx')
  assert.ok(!homeTsx.includes('performance-cta'), 'Must remove performance-cta button from Home.tsx')
  assert.ok(!homeContent.includes("'Inquire About Package Deals'"), 'Must remove Inquire About Package Deals default text')
})

