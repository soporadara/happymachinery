import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

test('1. BlogVideoPlayer renders complete cinema video player chrome with play button, scrubber and badges', () => {
  const blogPath = path.join(rootDir, 'src/pages/Blog.tsx')
  const content = fs.readFileSync(blogPath, 'utf8')

  assert.ok(content.includes('blog-video-player-card'), 'Card has blog-video-player-card class')
  assert.ok(content.includes('blog-video-poster'), 'Card has blog-video-poster for high-res thumbnail')
  assert.ok(content.includes('blog-video-gradient-overlay'), 'Card has cinematic gradient overlay')
  assert.ok(content.includes('blog-video-brand-pill'), 'Card has header brand pill with YouTube icon')
  assert.ok(content.includes('blog-video-play-box'), 'Card has iconic red YouTube play box')
  assert.ok(content.includes('blog-video-pulse-ring'), 'Card has pulsing radar wave rings')
  assert.ok(content.includes('blog-video-duration-badge'), 'Card has YouTube duration badge')
  assert.ok(content.includes('blog-video-bottom-chrome'), 'Card has video player bottom chrome')
  assert.ok(content.includes('blog-video-scrubber-track'), 'Card has realistic video scrubber track')
  assert.ok(content.includes('blog-video-timecode'), 'Card displays timecode (0:00 / 3:45)')
  assert.ok(content.includes('blog-video-active-iframe'), 'Active state renders full-width iframe with autoplay')
})

test('2. Blog.css defines rich cinema styling and animations for video player', () => {
  const cssPath = path.join(rootDir, 'src/pages/Blog.css')
  const css = fs.readFileSync(cssPath, 'utf8')

  assert.ok(css.includes('.blog-video-player-card'), 'Defines .blog-video-player-card')
  assert.ok(css.includes('.blog-video-play-box'), 'Defines red .blog-video-play-box')
  assert.ok(css.includes('hm-video-radar'), 'Defines pulsing radar wave keyframes')
  assert.ok(css.includes('.blog-video-scrubber-track'), 'Defines video scrubber track')
  assert.ok(css.includes('.blog-video-active-iframe'), 'Defines active iframe player styles')
  assert.ok(css.includes('aspect-ratio: 16 / 9'), 'Enforces 16:9 widescreen video ratio')
})

test('3. Article YouTube embeds seamlessly convert to BlogVideoPlayer', () => {
  const blogPath = path.join(rootDir, 'src/pages/Blog.tsx')
  const content = fs.readFileSync(blogPath, 'utf8')

  assert.ok(content.includes('getYoutubeVideoId(line)'), 'Extracts YouTube video ID from any line or embed')
  assert.ok(content.includes('<BlogVideoPlayer'), 'Renders BlogVideoPlayer component for video blocks')
})
