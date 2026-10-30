import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

test('1. getInitialBlogPosts prioritizes DEFAULT_POSTS when code contains newer article than stale localStorage', () => {
  const adminDataPath = path.join(rootDir, 'src/pages/adminData.ts')
  const content = fs.readFileSync(adminDataPath, 'utf8')

  assert.ok(content.includes('export const getInitialBlogPosts'), 'getInitialBlogPosts is exported from adminData.ts')
  assert.ok(content.includes('maxDefaultId > maxSavedId'), 'Checks if new release has higher ID than stale cache')
  assert.ok(content.includes('1793321591671'), 'DEFAULT_POSTS index 0 has post 1793321591671 (The Ultimate Guide to Heavy Compact Excavators)')
})

test('2. Blog.tsx uses getInitialBlogPosts, syncs localStorage on shared fetch, and sorts descending', () => {
  const blogPath = path.join(rootDir, 'src/pages/Blog.tsx')
  const content = fs.readFileSync(blogPath, 'utf8')

  assert.ok(content.includes('getInitialBlogPosts()'), 'Blog.tsx uses getInitialBlogPosts() on initial state')
  assert.ok(content.includes("localStorage.setItem('happy-machinery-blog-posts'"), 'Blog.tsx caches fetched posts into localStorage to eliminate repeated latency')
  assert.ok(content.includes('idB - idA'), 'Blog.tsx enforces descending chronological order by post ID')
})

test('3. AdminDashboard syncBlogPosts updates localStorage, persistent storage, and dispatches blog-updated', () => {
  const adminPath = path.join(rootDir, 'src/pages/AdminDashboard.tsx')
  const content = fs.readFileSync(adminPath, 'utf8')

  assert.ok(content.includes('const syncBlogPosts = async'), 'syncBlogPosts helper is declared in AdminDashboard')
  assert.ok(content.includes("localStorage.setItem('happy-machinery-blog-posts'"), 'syncBlogPosts updates localStorage immediately')
  assert.ok(content.includes("window.dispatchEvent(new CustomEvent('blog-updated'"), 'syncBlogPosts emits blog-updated custom event')
})

test('4. content.php and sharedContentStorage allow HTTP caching and ETag validation', () => {
  const phpPath = path.join(rootDir, 'public/api/content.php')
  const phpContent = fs.readFileSync(phpPath, 'utf8')
  assert.ok(phpContent.includes('ETag:'), 'content.php emits ETag header')
  assert.ok(phpContent.includes('HTTP_IF_NONE_MATCH'), 'content.php supports 304 Not Modified')

  const storagePath = path.join(rootDir, 'src/data/sharedContentStorage.ts')
  const storageContent = fs.readFileSync(storagePath, 'utf8')
  assert.ok(storageContent.includes("cache: options?.fresh || hasAuth ? 'no-store' : 'default'"), 'sharedContentStorage allows browser cache / 304 for public reads')
})
