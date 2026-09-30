import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initOriginkitSliderPreview, previewGeometry, PREVIEW_MIN_SCALE, PREVIEW_MAX_SCALE } from '../build/originkit-slider-preview.js';
import { harness } from './helpers/slider-dom.mjs';

test('comparison route is isolated, unlisted and uses all real project captures',()=>{
  const html=readFileSync('site/slider-preview/index.html','utf8');
  assert.match(html,/name="robots" content="noindex"/);
  assert.equal((html.match(/class="preview-slide"/g)??[]).length,7);
  assert.doesNotMatch(readFileSync('site/sitemap.xml','utf8'),/slider-preview/);
  assert.match(readFileSync('site/robots.txt','utf8'),/Disallow: \/slider-preview\//);
  assert.doesNotMatch(readFileSync('site/index.html','utf8'),/data-originkit-preview/);
  assert.match(readFileSync('site/index.html','utf8'),/data-work-slider/);
  const nav=html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(nav,/slider-preview/);
  assert.match(html,/href="\/">← Current Home/);
  assert.match(html,/href="\/work\/">View Work/);
});

test('preview geometry has stronger asymmetric scale and continuous positions',()=>{
  assert.equal(PREVIEW_MIN_SCALE,.35);assert.equal(PREVIEW_MAX_SCALE,1.85);
  assert.ok(previewGeometry(-1,700,1320).scale>previewGeometry(0,700,1320).scale);
  assert.ok(previewGeometry(0,700,1320).scale>previewGeometry(1,700,1320).scale);
  let previous=-Infinity;
  for(let phase=-5;phase<=5;phase+=.01){
    const g=previewGeometry(phase,700,1320);
    assert.ok(g.scale>=.35&&g.scale<=1.85);
    assert.ok(Number.isFinite(g.x)&&g.x>previous);previous=g.x;
    assert.ok(g.opacity>=.26&&g.opacity<=.98);
  }
});

test('preview wheel eases, loops and stops; dragging hides cursor only during drag',()=>{
  const h=harness({count:7,init:initOriginkitSliderPreview});
  assert.equal(h.track.children.length,21);
  assert.equal(h.event(h.viewport,'wheel',{deltaX:0,deltaY:600,deltaMode:0,ctrlKey:false}).defaultPrevented,true);
  assert.ok(h.frames.size);h.flush();assert.match(h.status.textContent,/2 \/ 7/);
  for(let i=0;i<7;i++){h.event(h.next,'click');h.flush()}
  assert.match(h.status.textContent,/2 \/ 7/,'whole cycle returns to the same project');
  h.event(h.viewport,'pointerdown',{pointerType:'mouse',button:0,pointerId:3,clientX:500});
  h.event(h.viewport,'pointermove',{pointerId:3,clientX:300});
  assert.equal(h.viewport.attrs['data-cursor'],'hide');
  h.event(h.viewport,'pointerup');assert.equal(h.viewport.attrs['data-cursor'],undefined);
  assert.equal(h.event(h.viewport,'click').defaultPrevented,true);h.flush();
  h.slider.destroy();assert.equal(h.track.children.length,7);assert.equal(h.frames.size,0);
  assert.ok(h.observers.every(o=>o.disconnected));
});

test('preview mobile/reduced-motion modes use native scroll and release all listeners',()=>{
  for(const options of [{desktop:false},{reduced:true}]){
    const h=harness({...options,count:7,init:initOriginkitSliderPreview});
    assert.equal(h.track.children.length,7);
    assert.equal(h.event(h.viewport,'wheel',{deltaX:0,deltaY:500,deltaMode:0}).defaultPrevented,false);
    h.event(h.next,'click');assert.equal(h.viewport.scrollLeft,816);assert.equal(h.frames.size,0);
    h.width.matches=true;h.motion.matches=false;h.event(h.width,'change');assert.equal(h.track.children.length,21);
    h.event(h.next,'click');assert.ok(h.frames.size);
    h.doc.hidden=true;h.event(h.doc,'visibilitychange');assert.equal(h.frames.size,0);
    h.motion.matches=true;h.event(h.motion,'change');assert.equal(h.track.children.length,7);
    h.slider.destroy();const before=h.viewport.scrollLeft;h.event(h.next,'click');assert.equal(h.viewport.scrollLeft,before);
  }
});

test('archive cards have one full-width information stack and no legacy caption grid',()=>{
  const html=readFileSync('site/work/index.html','utf8');
  const cards=[...html.matchAll(/<article class="project-card work-archive-card[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
  assert.equal(cards.length,7);
  for(const card of cards){
    assert.doesNotMatch(card,/project-caption|project-num|project-links/);
    assert.match(card,/<\/a><div class="work-card-body"><div class="work-card-meta">/);
    assert.match(card,/class="work-card-description"/);assert.match(card,/class="work-card-actions"/);
  }
  const css=readFileSync('site/style.css','utf8');
  assert.match(css,/\.originkit-preview\{[^}]*isolation:isolate/);
  assert.match(css,/\.work-card-body\{display:flex;flex-direction:column/);
  assert.match(css,/\.work-card-description\{[^}]*width:100%;max-width:50ch;[^}]*line-height:1\.65/);
  assert.match(css,/\.work-card-actions \.case-link\{[^}]*white-space:nowrap/);
  assert.match(css,/@media\(max-width:1023px\)\{\.real-project-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.work-slide-image img\{[^}]*object-fit:cover;object-position:top center/);
  const projects=JSON.parse(readFileSync('site/projects.json','utf8'));
  for(const p of projects)assert.ok(p.coverWidth/p.coverHeight<1.75,'no shallow capture needing giant contain bars: '+p.title);
});
