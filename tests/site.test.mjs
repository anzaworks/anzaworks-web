import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../site/', import.meta.url).pathname;
const projects = JSON.parse(readFileSync(join(root, 'projects.json'), 'utf8'));
const paths = ['/', '/work/', '/services/', '/about/', '/process/', '/contact/',
  ...projects.map(project => '/work/' + project.slug + '/')];
const htmlPath = path => join(root, path === '/' ? 'index.html' : path.slice(1) + 'index.html');

test('every public route has content, metadata and resolvable local links', () => {
  for (const path of paths) {
    const html = readFileSync(htmlPath(path), 'utf8');
    assert.match(html, /<main id="main">/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, path);
    assert.match(html, new RegExp('<link rel="canonical" href="https://anzaworks.lk' + path.replaceAll('/', '\\/') + '"'));
    assert.match(html, /property="og:image"/);
    assert.doesNotMatch(html, /IndexedDB|\/admin\/|invoice records|customer records/i);
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
      const pathname = new URL(url, 'https://anzaworks.lk').pathname;
      const target = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
      assert.ok(existsSync(join(root, target.slice(1))), path + ' has a broken asset or link: ' + url);
    }
  }
});

test('concepts are clearly labeled and future media fields exist', () => {
  assert.equal(projects.length, 5);
  for (const project of projects) {
    assert.equal(project.status, 'concept');
    assert.equal(project.client, null);
    assert.ok(Array.isArray(project.gallery));
    assert.ok('video' in project && 'liveUrl' in project && 'githubUrl' in project);
    const html = readFileSync(htmlPath('/work/' + project.slug + '/'), 'utf8');
    assert.match(html, /STATUS \/ CONCEPT/);
    assert.match(html, /No client outcomes|not a claim|without invented|No client|not a live store|No client outcomes|not a deployed POS|No client outcomes|not a claim|not a live store|not a claim/);
  }
});

test('public boundary and utility files are present', () => {
  for (const name of ['robots.txt', 'sitemap.xml', '404.html', 'error.html', 'style.css', 'browser.js', 'dot-cursor.js', 'brand/anza-logo-main.png', 'brand/anza-icon.png']) {
    assert.ok(existsSync(join(root, name)), name);
  }
  assert.match(readFileSync(join(root, 'contact/index.html'), 'utf8'), /mailto:hello@anzaworks.lk/);
  assert.match(readFileSync(join(root, '404.html'), 'utf8'), /name="robots" content="noindex"/);
  assert.ok(readdirSync(join(root)).every(name => name !== 'admin'));
  assert.ok(!existsSync(join(root, 'assets')));
  assert.ok(!existsSync(join(root, 'favicon.svg')));
});

test('approved hero media is local and accessible from the homepage', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const css = readFileSync(join(root, 'style.css'), 'utf8');
  const mp4 = join(root, 'media/hero/anza-hero.mp4');
  const poster = join(root, 'media/hero/anza-hero-poster.webp');
  assert.ok(existsSync(mp4));
  assert.ok(existsSync(poster));
  assert.ok(statSync(mp4).size > 0);
  assert.match(html, /<video class="hero-video" autoplay muted playsinline[^>]*poster="\/media\/hero\/anza-hero-poster.webp"/);
  assert.match(html, /<source src="\/media\/hero\/anza-hero.mp4" type="video\/mp4">/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  for (const id of ['featured', 'capabilities', 'about', 'process', 'faq', 'contact']) assert.match(html, new RegExp('id="' + id + '"'));
});

test('public branding uses real transparent logo assets and a compact site icon', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const css = readFileSync(join(root, 'style.css'), 'utf8');
  const main = readFileSync(join(root, 'brand/anza-logo-main.png'));
  const icon = readFileSync(join(root, 'brand/anza-icon.png'));
  for (const asset of [main, icon]) {
    assert.equal(asset.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(asset[25], 6, 'logo PNG should contain alpha');
    assert.ok(asset.length > 10_000, 'logo must be a real rendered asset');
  }
  assert.match(html, /<a class="wordmark" href="\/" aria-label="Anza Works home"><img class="brand-logo brand-logo-header" src="\/brand\/anza-logo-main\.png"/);
  assert.equal((html.match(/src="\/brand\/anza-logo-main\.png"/g) ?? []).length, 2);
  assert.match(html, /<link rel="icon" href="\/brand\/anza-icon\.png" type="image\/png">/);
  assert.doesNotMatch(html, /favicon\.svg|class="mark"/);
  assert.doesNotMatch(html, /anza-app-icon\.png/);
  assert.doesNotMatch(css, /\.brand-logo\{[^}]*filter:/);
});


test('mobile navigation is outside the filtered header and has a viewport overlay', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const css = readFileSync(join(root, 'style.css'), 'utf8');
  assert.match(html, /aria-controls="mobile-nav" aria-expanded="false"/);
  assert.match(html, /<\/header><nav class="mobile-nav" id="mobile-nav"[^>]* inert>/);
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  for (const label of ['Work', 'About', 'Services', 'Contact']) assert.match(nav, new RegExp('>' + label + '<'));
  assert.match(css, /\.mobile-nav\{position:fixed;inset:0;z-index:1000;[^}]*height:100dvh/);
  assert.match(css, /body\.menu-open\{position:fixed/);
});

test('Dot Cursor is a site-wide desktop overlay and old hero effects are removed', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const browser = readFileSync(join(root, 'browser.js'), 'utf8');
  const cursor = readFileSync(join(root, 'dot-cursor.js'), 'utf8');
  const css = readFileSync(join(root, 'style.css'), 'utf8');
  assert.match(html, /<video class="hero-video"[^>]*poster="\/media\/hero\/anza-hero-poster\.webp"/);
  assert.match(browser, /import\("\.\/dot-cursor\.js"\)/);
  assert.match(browser, /initDotCursor\(\)/);
  assert.match(browser, /min-width: 900px/);
  assert.match(cursor, /canvas\.className = "dot-cursor-canvas"/);
  assert.match(cursor, /document\.body\.append\(canvas\)/);
  assert.match(cursor, /event\.pointerType !== "mouse"/);
  assert.match(cursor, /data-cursor="hide"/);
  assert.match(css, /\.dot-cursor-canvas\{position:fixed;inset:0;[^}]*z-index:900;pointer-events:none/);
  assert.match(css, /@media\(max-width:899px\),\(prefers-reduced-motion:reduce\)\{\.dot-cursor-canvas\{display:none\}\}/);
  for (const text of [html, browser, cursor, css]) assert.doesNotMatch(text, /ascii-reveal|hero-ascii-layer|glyph-wall|hero-glyph-layer/i);
  assert.ok(!existsSync(join(root, 'ascii-reveal.js')));
  assert.ok(!existsSync(join(root, 'glyph-wall.js')));
});
