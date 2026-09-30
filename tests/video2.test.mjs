import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initVideo2Slider,video2Geometry} from '../build/video2-slider.js';
import {harness} from './helpers/slider-dom.mjs';

test('Video-2 route is unlisted, local, image driven and independent',()=>{
 const html=readFileSync('site/slider-video2/index.html','utf8');
 assert.match(html,/name="robots" content="noindex"/);
 assert.equal((html.match(/class="video2-slide"/g)||[]).length,7);
 const slugs=[...html.matchAll(/<article class="video2-slide"[^>]*><a href="\/work\/([^/]+)\//g)].map(m=>m[1]);
 assert.deepEqual(slugs,['hotel-bonavista','source-seal','proof-halt','prism-jury','archive-relay','brief-bond','dispute-dock']);
 assert.doesNotMatch(html,/unsplash|video2-slide-caption|View Live/);
 assert.match(html,/Previous Slider Test/);
 assert.doesNotMatch(readFileSync('site/sitemap.xml','utf8'),/slider-video2/);
 assert.match(readFileSync('site/robots.txt','utf8'),/Disallow: \/slider-video2\//);
 assert.match(readFileSync('site/browser.js','utf8'),/import\("\.\/video2-slider.js"\)/);
 assert.doesNotMatch(readFileSync('site/index.html','utf8'),/data-video2-slider/);
 assert.doesNotMatch(readFileSync('site/slider-preview/index.html','utf8'),/data-video2-slider/);
 const css=readFileSync('site/style.css','utf8');
 assert.match(css,/\.video2-slide\{[^}]*aspect-ratio:4\/5/);
 assert.match(css,/\.video2-enhanced \.video2-slider-viewport\{[^}]*height:78dvh;[^}]*overflow:hidden/);
});
test('signed source geometry grows right, dims left, adds right push and permits clipping',()=>{
 const w=400,W=1440;
 const left=video2Geometry(0,w,W),center=video2Geometry(520,w,W),right=video2Geometry(1040,w,W);
 assert.ok(left.scale<center.scale&&center.scale<right.scale);
 assert.equal(center.scale,1);assert.equal(center.brightness,1);
 assert.ok(left.brightness>=.35&&left.brightness<1);
 assert.ok(right.left>1040&&right.left+w*right.scale>W);
 assert.equal(video2Geometry(-99999,w,W).scale,.35);
 assert.equal(video2Geometry(99999,w,W).scale,2.2);
 // Four input viewport widths preserve finite geometry, with no fixed huge canvas.
 for(const width of [1440,1024,390,320])assert.ok(Number.isFinite(video2Geometry(0,Math.min(400,width*.28),width).left));
});
test('wheel interpolates, whole cycles match, drag restores cursor, RAF settles and cleans up',()=>{
 const h=harness({count:7,init:initVideo2Slider});
 assert.equal(h.track.children.length,7);
 const before=h.track.children.map(c=>c.style.transform);
 assert.ok(h.event(h.viewport,'wheel',{deltaX:0,deltaY:120,deltaMode:0}).defaultPrevented);
 assert.deepEqual(h.track.children.map(c=>c.style.transform),before,'input changes target before easing');
 h.flush();assert.notDeepEqual(h.track.children.map(c=>c.style.transform),before);
 const one=h.track.children.map(c=>c.style.transform);
 for(let i=0;i<7;i++){h.event(h.next,'click');h.flush()}
 const values=s=>[...s.matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));
 one.forEach((s,i)=>values(s).forEach((v,j)=>assert.ok(Math.abs(v-values(h.track.children[i].style.transform)[j])<.00001)));
 h.event(h.viewport,'pointerdown',{pointerType:'mouse',button:0,pointerId:1,clientX:500});
 h.event(h.viewport,'pointermove',{pointerId:1,clientX:300});
 assert.equal(h.viewport.attrs['data-cursor'],'hide');
 h.event(h.viewport,'pointerup');assert.equal(h.viewport.attrs['data-cursor'],undefined);
 assert.ok(h.event(h.viewport,'click').defaultPrevented);h.flush();
 h.event(h.viewport,'wheel',{deltaY:100,deltaX:0,deltaMode:0,ctrlKey:true});assert.equal(h.frames.size,0);
 h.slider.destroy();assert.equal(h.frames.size,0);assert.ok(h.observers.every(o=>o.disconnected));
 assert.equal(h.track.children[0].style.transform,'');
});
test('mobile/reduced use native swipe and hidden/offscreen modes cancel drag and RAF',()=>{
 for(const opts of [{desktop:false},{reduced:true}]){
 const h=harness({...opts,count:7,init:initVideo2Slider});
 assert.equal(h.frames.size,0);assert.equal(h.event(h.viewport,'wheel',{deltaY:200,deltaX:0}).defaultPrevented,false);
 h.event(h.next,'click');assert.ok(h.viewport.scrollLeft>0);assert.equal(h.frames.size,0);
 h.width.matches=true;h.motion.matches=false;h.event(h.width,'change');
 h.event(h.next,'click');assert.ok(h.frames.size);
 h.observers[1].fn([{isIntersecting:false}]);assert.equal(h.frames.size,0);
 assert.equal(h.event(h.viewport,'wheel',{deltaY:200,deltaX:0}).defaultPrevented,false);
 h.observers[1].fn([{isIntersecting:true}]);h.event(h.next,'click');
 h.doc.hidden=true;h.event(h.doc,'visibilitychange');assert.equal(h.frames.size,0);
 h.slider.destroy();const before=h.viewport.scrollLeft;h.event(h.next,'click');assert.equal(h.viewport.scrollLeft,before);
 }
});
