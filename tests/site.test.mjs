import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

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

test('all seven real public projects have local captures and exact live URLs', () => {
  const urls = ['https://hotel-bonavista.vercel.app/', 'https://archiverelay-haris4587.itzanza2.chatgpt.site/', 'https://briefbond.ansaf1st33.chatgpt.site/', 'https://prismjury.ansaf1st33.chatgpt.site/', 'https://sourceseal.netlify.app/', 'https://disputedock.netlify.app', 'https://proofhalt.netlify.app'];
  assert.equal(projects.length, 7);
  assert.deepEqual(projects.map(p => p.liveUrl), urls);
  for (const project of projects) {
    assert.equal(project.status, 'public');
    assert.ok(project.features.length >= 3);
    assert.ok(project.cover.startsWith('/projects/'));
    const image = readFileSync(join(root, project.cover));
    assert.equal(image.toString('ascii', 8, 12), 'WEBP');
    assert.ok(image.length > 5000);
    const html = readFileSync(htmlPath('/work/' + project.slug + '/'), 'utf8');
    assert.ok(html.includes('href="' + project.liveUrl + '"'));
    assert.match(html, /target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(html, /CONCEPT|NOT COMMISSIONED|Approved screens.*appear|<div class="media-slot"/);
  }
});

test('private systems have honest status and no public access or invented screens', () => {
  const systems = JSON.parse(readFileSync(join(root, 'private-systems.json'), 'utf8'));
  assert.deepEqual(systems.map(s => s.title), ['Mr Apple.lk POS', 'Hotel Bonavista Admin']);
  for (const system of systems) {
    assert.equal(system.liveUrl, null);
    assert.equal(system.status, 'Private System · In Progress');
  }
  const html = readFileSync(htmlPath('/work/'), 'utf8');
  const privateSection = html.match(/<section id="private-systems"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(privateSection, /Mr Apple.lk POS/);
  assert.match(privateSection, /Hotel Bonavista Admin/);
  assert.doesNotMatch(privateSection, /<img\b|<a\b|View Live/i);
});

test('navigation is simplified and process remains available through Services', () => {
  for (const path of paths) {
    const html = readFileSync(htmlPath(path), 'utf8');
    const nav = html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
    assert.deepEqual([...nav.matchAll(/>(Home|Work|Services|About|Contact)<\/a>/g)].map(m => m[1]), ['Home','Work','Services','About','Contact']);
    assert.doesNotMatch(nav, /Process/);
  }
  assert.match(readFileSync(htmlPath('/services/'), 'utf8'), /id="process"/);
  assert.match(readFileSync(htmlPath('/process/'), 'utf8'), /href="\/services\/#process"/);
});

test('Selected Work is immediately after the hero and has native slider enhancement', () => {
  const html = readFileSync(htmlPath('/'), 'utf8');
  assert.match(html, /<\/section><section id="featured"/);
  assert.equal((html.match(/class="work-slide"/g) ?? []).length, 5);
  const titles = [...html.matchAll(/data-slide-index="\d"[^>]*aria-label="[^:]+: ([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(titles, ['Hotel Bonavista','Source Seal','Proof Halt','Prism Jury','Archive Relay']);
  const browser = readFileSync(join(root,'browser.js'),'utf8');
  assert.match(browser, /import\("\.\/smooth-work-slider\.js"\)/);
  assert.match(browser, /initSmoothWorkSlider\(workSliderRoot\)/);
  const slider = readFileSync(join(root,'smooth-work-slider.js'),'utf8');
  for (const event of ['wheel','pointerdown','pointermove','keydown','visibilitychange']) assert.ok(slider.includes('"' + event + '"'));
  assert.match(slider, /prefers-reduced-motion/);
  assert.match(slider, /controller.abort\(\)/);
});

test('public boundary and utility files are present', () => {
  for (const name of ['robots.txt', 'sitemap.xml', '404.html', 'error.html', 'style.css', 'browser.js', 'dot-cursor.js', 'brand/anza-logo-main.png', 'brand/anza-icon.png']) {
    assert.ok(existsSync(join(root, name)), name);
  }
  assert.match(readFileSync(join(root, 'contact/index.html'), 'utf8'), /mailto:Ansafbisthamy@gmail\.com/);
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
  assert.equal(statSync(mp4).size, 3141949);
  assert.equal(createHash('sha256').update(readFileSync(mp4)).digest('hex'), 'e98340394a1b02692debe4d20f600f5eefee61c4e35a3d1f20e170972ac7537f');
  assert.match(html, /<video class="hero-video" autoplay muted playsinline[^>]*poster="\/media\/hero\/anza-hero-poster.webp"/);
  assert.match(html, /<source src="\/media\/hero\/anza-hero.mp4" type="video\/mp4">/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  for (const id of ['featured', 'capabilities', 'about', 'process', 'more-work', 'contact']) assert.match(html, new RegExp('id="' + id + '"'));
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
  for (const label of ['Home', 'Work', 'Services', 'About', 'Contact']) assert.match(nav, new RegExp('>' + label + '<'));
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


test('final output contains no comparison routes, assets or browser initializers', () => {
  for (const name of ['slider-preview', 'slider-video2', 'originkit-slider-preview.js', 'video2-slider.js']) {
    assert.ok(!existsSync(join(root, name)), name + ' must be absent');
  }
  for (const name of ['browser.js', 'style.css', 'sitemap.xml', 'robots.txt']) {
    assert.doesNotMatch(readFileSync(join(root, name), 'utf8'), /slider-preview|slider-video2|originkit-preview|video2-slider|preview-slider|slider-comparison/);
  }
});

test('Work archive keeps readable stacks, responsive columns and cover framing', () => {
  const html = readFileSync(htmlPath('/work/'), 'utf8');
  const cards = [...html.matchAll(/<article class="project-card work-archive-card[^>]*>([\s\S]*?)<\/article>/g)].map(m => m[1]);
  assert.equal(cards.length, 7);
  for (const card of cards) {
    assert.doesNotMatch(card, /project-caption|project-num|project-links/);
    assert.match(card, /<\/a><div class="work-card-body"><div class="work-card-meta">/);
    assert.match(card, /class="work-card-description"/);
    assert.match(card, /class="work-card-actions"/);
    assert.match(card, />View Case Study ↗<\/a>/);
    assert.match(card, />View Live ↗<\/a>/);
  }
  const css = readFileSync(join(root, 'style.css'), 'utf8');
  assert.match(css, /\.real-project-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:1023px\)\{\.real-project-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.work-card-body\{display:flex;flex-direction:column/);
  assert.match(css, /\.work-card-description\{[^}]*width:100%;max-width:50ch;[^}]*line-height:1\.65/);
  assert.match(css, /\.work-card-actions \.case-link\{[^}]*white-space:nowrap/);
  assert.match(css, /\.real-project-cover\{[^}]*aspect-ratio:16\/10/);
  for (const selector of ['real-project-cover', 'work-slide-image']) {
    assert.match(css, new RegExp('\\.' + selector + ' img\\{[^}]*object-fit:cover;object-position:top center'));
  }
  const prism = projects.find(p => p.slug === 'prism-jury');
  const dispute = projects.find(p => p.slug === 'dispute-dock');
  assert.deepEqual([prism.coverWidth, prism.coverHeight], [762, 476]);
  assert.deepEqual([dispute.coverWidth, dispute.coverHeight], [960, 600]);
});
