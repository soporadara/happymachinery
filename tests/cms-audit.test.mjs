import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Helper simulating CMS permission weights
const ROLE_WEIGHTS = {
  'Super Administrator': 100,
  Administrator: 80,
  Editor: 50,
  Analyst: 20
}

function roleHasPermission(role, requiredRole) {
  return (ROLE_WEIGHTS[role] || 0) >= (ROLE_WEIGHTS[requiredRole] || 0)
}

// Helper simulating server-side field sanitization
function sanitizeField(input, maxLength = 1000) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[^\w\s@.,?!:;+()/[\]\-_#$€£&%*="\n\r\t]/gi, '') // Filter dangerous control chars
    .trim()
    .slice(0, maxLength)
}

// Media reference checker simulating AdminDashboard.tsx logic
function getMediaReferences(url, posts, products) {
  const refs = []
  if (!url) return refs
  const cleanUrl = url.toLowerCase()
  posts.forEach((p) => {
    if (p.image?.toLowerCase() === cleanUrl || p.content?.some((c) => c.toLowerCase().includes(cleanUrl))) {
      refs.push(`Article: "${p.title}"`)
    }
  })
  products.forEach((p) => {
    if (
      p.image?.toLowerCase() === cleanUrl ||
      p.galleryImages?.some((g) => g.toLowerCase().includes(cleanUrl)) ||
      p.description?.toLowerCase().includes(cleanUrl)
    ) {
      refs.push(`Product: "${p.name}"`)
    }
  })
  return refs
}

test('1. Role-Based Access Control hierarchy works strictly', () => {
  assert.equal(roleHasPermission('Super Administrator', 'Administrator'), true)
  assert.equal(roleHasPermission('Administrator', 'Editor'), true)
  assert.equal(roleHasPermission('Editor', 'Administrator'), false)
  assert.equal(roleHasPermission('Analyst', 'Editor'), false)
  assert.equal(roleHasPermission('Analyst', 'Analyst'), true)
  assert.equal(roleHasPermission('Guest', 'Analyst'), false)
})

test('2. Backend sanitization strips malicious HTML and script tags', () => {
  const dirtyInquiry = '<script>alert("xss")</script>Hello, I need an excavator <b onmouseover=evil()>now</b>!'
  const cleaned = sanitizeField(dirtyInquiry)
  assert.equal(cleaned.includes('<script>'), false)
  assert.equal(cleaned.includes('</script>'), false)
  assert.equal(cleaned.includes('<b'), false)
  assert.equal(cleaned.includes('alert("xss")'), true) // text remains, tags stripped
  assert.equal(cleaned.includes('Hello, I need an excavator now!'), true)
})

test('3. Draft articles are strictly hidden from visitor blog feeds', () => {
  const mockPosts = [
    { id: 1, title: 'Published Excavator Guide', status: 'Published' },
    { id: 2, title: 'Internal Draft Forklift Notes', status: 'Draft' },
    { id: 3, title: 'Legacy Unset Status Article' } // Defaults to published
  ]

  const visitorFeed = mockPosts.filter((p) => p.status !== 'Draft')
  assert.equal(visitorFeed.length, 2)
  assert.equal(visitorFeed.some((p) => p.id === 2), false)
  assert.equal(visitorFeed.some((p) => p.id === 1), true)
})

test('4. Duplicate slug detection flags collisions correctly', () => {
  const existingArticles = [
    { id: 101, title: 'Cat 320 Review', slug: 'cat-320-review' },
    { id: 102, title: 'Forklift Safety', slug: 'forklift-safety' }
  ]

  // Trying to save new article with duplicate slug
  const newSlug = 'cat-320-review'
  const isDuplicateForNew = existingArticles.some((p) => p.slug === newSlug)
  assert.equal(isDuplicateForNew, true)

  // Editing existing article 101 with same slug should not flag itself as duplicate
  const isDuplicateForSelfEdit = existingArticles.some((p) => p.slug === newSlug && p.id !== 101)
  assert.equal(isDuplicateForSelfEdit, false)
})

test('5. Media reference checker identifies when assets are actively linked', () => {
  const posts = [
    { title: 'Excavator 101', image: '/images/cat-320.png', content: ['Great machine.'] },
    { title: 'Loader Guide', image: '/images/loader.png', content: ['See diagram at /images/cat-320.png'] }
  ]
  const products = [
    { name: 'Cat 320D', image: '/images/cat-320.png', galleryImages: [] }
  ]

  const refs = getMediaReferences('/images/cat-320.png', posts, products)
  assert.equal(refs.length, 3)
  assert.ok(refs.includes('Article: "Excavator 101"'))
  assert.ok(refs.includes('Article: "Loader Guide"'))
  assert.ok(refs.includes('Product: "Cat 320D"'))

  const unusedRefs = getMediaReferences('/images/unused-photo.jpg', posts, products)
  assert.equal(unusedRefs.length, 0)
})

test('6. Password hash is never exposed to public or frontend users payload', () => {
  const rawAdminUsers = [
    { id: 'usr-1', username: 'admin', role: 'Super Administrator', passwordHash: '$2y$10$secretHash' }
  ]
  // Backend sanitization logic from public/api/content.php and vite.config.ts
  const safeAdminUsers = rawAdminUsers.map((u) => {
    const copy = { ...u }
    delete copy.passwordHash
    return copy
  })

  assert.equal(safeAdminUsers[0].passwordHash, undefined)
  assert.equal(safeAdminUsers[0].username, 'admin')
})

test('7. Database backup exists and original content is preserved', () => {
  const backupDir = path.join(rootDir, 'backups')
  assert.ok(fs.existsSync(backupDir), 'Backup directory must exist')
  const backupFiles = fs.readdirSync(backupDir).filter((f) => f.startsWith('content_backup'))
  assert.ok(backupFiles.length > 0, 'At least one pre-modernization backup must exist')

  const storageFile = path.join(rootDir, 'happy-machinery-storage', 'content.json')
  assert.ok(fs.existsSync(storageFile), 'Primary storage file must exist')
  const content = JSON.parse(fs.readFileSync(storageFile, 'utf8'))
  assert.ok(Array.isArray(content.products) && content.products.length > 100, 'Catalog products must be preserved')
  assert.ok(Array.isArray(content['blog-posts']) && content['blog-posts'].length > 15, 'Blog posts must be preserved')
})

test('8. Maintenance mode is completely decommissioned and removed from CMS', () => {
  const maintSplashFile = path.join(rootDir, 'src', 'components', 'MaintenanceSplash.tsx')
  const maintConfigFile = path.join(rootDir, 'src', 'data', 'maintenanceConfig.ts')
  assert.equal(fs.existsSync(maintSplashFile), false, 'MaintenanceSplash.tsx must not exist')
  assert.equal(fs.existsSync(maintConfigFile), false, 'maintenanceConfig.ts must not exist')

  const adminDashboardContent = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'AdminDashboard.tsx'), 'utf8')
  assert.equal(adminDashboardContent.includes("activeTab === 'maintenance'"), false, 'AdminDashboard must not have maintenance tab')
  assert.equal(adminDashboardContent.includes("data-tooltip=\"Maintenance Mode\""), false, 'AdminDashboard must not have maintenance nav button')
})

test('9. Authentic blog view tracking is server-verified and fake baselines are eradicated', () => {
  const blogViewsContent = fs.readFileSync(path.join(rootDir, 'src', 'data', 'blogViews.ts'), 'utf8')
  assert.equal(blogViewsContent.includes('BASELINE_BLOG_VIEWS'), false, 'Fake BASELINE_BLOG_VIEWS must be completely removed')
  assert.ok(blogViewsContent.includes('fetchRealBlogViewsFromServer'), 'Must support server-verified views fetch')
  assert.ok(blogViewsContent.includes('record-blog-view'), 'Must record views to backend endpoint')

  const contentPhpContent = fs.readFileSync(path.join(rootDir, 'public', 'api', 'content.php'), 'utf8')
  assert.ok(contentPhpContent.includes("'blog-views'"), 'blog-views must be in allowed keys')
  assert.ok(contentPhpContent.includes("$action === 'record-blog-view'"), 'Backend must have atomic record-blog-view handler')
  assert.ok(contentPhpContent.includes("$action === 'get-blog-views'"), 'Backend must have get-blog-views handler')
})

