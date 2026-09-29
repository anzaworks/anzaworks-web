import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
  for (const name of ['favicon.svg', 'robots.txt', 'sitemap.xml', '404.html', 'error.html', 'style.css', 'browser.js', 'assets/hero-desktop.webp', 'assets/hero-mobile.webp']) {
    assert.ok(existsSync(join(root, name)), name);
  }
  assert.match(readFileSync(join(root, 'contact/index.html'), 'utf8'), /mailto:hello@anzaworks.lk/);
  assert.match(readFileSync(join(root, '404.html'), 'utf8'), /name="robots" content="noindex"/);
  assert.ok(readdirSync(join(root)).every(name => name !== 'admin'));
});
