import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const homeTsxPath = path.resolve('src/pages/Home.tsx');
const homeCssPath = path.resolve('src/pages/Home.css');
const htaccessPath = path.resolve('public/.htaccess');

test('Hero section has full screen ambient video wrapper with mobile autoplay policy handlers', () => {
  const tsx = fs.readFileSync(homeTsxPath, 'utf8');
  assert.ok(tsx.includes('heroVideoRef'), 'Must use heroVideoRef to control video playback');
  assert.ok(tsx.includes('vid.defaultMuted = true'), 'Must enforce defaultMuted for mobile browser policy');
  assert.ok(tsx.includes('vid.muted = true'), 'Must enforce muted for mobile browser policy');
  assert.ok(tsx.includes('vid.playsInline = true'), 'Must enforce playsInline for mobile browser policy');
  assert.ok(tsx.includes('vid.play()'), 'Must trigger programmatic play');
  assert.ok(tsx.includes('className="hero-background-media"'), 'Must have hero-background-media');
  assert.ok(tsx.includes('className="hero-overlay"'), 'Must have hero-overlay');
  assert.ok(!tsx.includes('hero-banner-container'), 'Should not contain separate banner container');
  assert.ok(!tsx.includes('hero-mobile-landscape-frame'), 'Should not contain separate mobile landscape frame');
});

test('Hero CSS configures full portrait screen video background on mobile', () => {
  const css = fs.readFileSync(homeCssPath, 'utf8');
  
  // Hero background wrapper
  assert.ok(css.includes('.hero-background-wrapper'), 'Must style hero-background-wrapper');
  assert.ok(css.includes('.hero-background-media'), 'Must style hero-background-media');
  assert.ok(css.includes('object-fit: cover;'), 'Background video must use object-fit: cover');
  
  // Full portrait device screen on mobile
  assert.ok(css.includes('min-height: 100vh;'), 'Must have min-height: 100vh');
  assert.ok(css.includes('min-height: 100dvh;'), 'Must have min-height: 100dvh for mobile dynamic viewports');
  assert.ok(!css.includes('display: none !important;\n  }'), 'Must not hide background media on mobile');
});

test('Apache .htaccess has video/mp4 MIME types for .mp4 and .m4v streaming', () => {
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');
  assert.ok(htaccess.includes('AddType video/mp4 .mp4 .m4v'), 'Must define MIME type for mp4 and m4v');
});
