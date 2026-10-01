import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {bakeSDF,bakeBrandMask,initGlassLogo,GLASS_SETTINGS} from '../build/glass-logo.js';

test('glass is integrated only into the three introductions; preview is removed',()=>{
 for(const route of ['about','services','work']){
  const html=readFileSync('site/'+route+'/index.html','utf8');
  assert.match(html,/src="\/glass-loader.js"/);assert.match(html,/href="\/glass-logo.css"/);
  assert.equal((html.match(/data-glass-logo/g)||[]).length,1);
  assert.match(html,/<div class="glass-stage" data-glass-logo aria-hidden="true">/);
  assert.match(html,/class="glass-fallback" src="\/brand\/anza-logo-main.png"/);
 }
 for(const route of ['index.html','contact/index.html','work/prism-jury/index.html']){
  assert.doesNotMatch(readFileSync('site/'+route,'utf8'),/glass-loader|glass-logo.css|data-glass-logo/);
 }
 for(const file of ['site/glass-preview','site/glass-preview.js','site/glass-preview.css','src/glass-preview.ts','src/glass-preview.css'])assert.equal(existsSync(file),false);
 for(const file of ['site/sitemap.xml','site/robots.txt','src/build.ts','README.md'])assert.doesNotMatch(readFileSync(file,'utf8'),/glass-preview/);
 assert.match(readFileSync('site/glass-loader.js','utf8'),/import\(".\/glass-logo.js"\)/);
 assert.doesNotMatch(readFileSync('site/browser.js','utf8'),/glass-logo/);
 assert.deepEqual(GLASS_SETTINGS,{depth:30,size:60,speed:20,direction:'Clockwise',chromatic:10,frost:14});
});
test('brand mask preserves actual red ink separately from the white glass body',()=>{
 const mask=bakeBrandMask(new Uint8ClampedArray([255,255,255,255,201,20,34,255,201,20,34,128,201,20,34,0]));
 assert.equal(mask[0],0);assert.equal(mask[4],255);assert.equal(mask[8],128);assert.equal(mask[12],0);
 const shader=readFileSync('site/glass-logo.js','utf8');
 assert.match(shader,/brandUv = pObj.xy/);assert.match(shader,/mix\(finalColor, redGlass, accent\)/);
});
test('reference alpha SDF preserves the silhouette and an interior cutout',()=>{
 const w=32,h=32,alpha=new Uint8ClampedArray(w*h*4);
 for(let y=5;y<27;y++)for(let x=5;x<27;x++)if(!(x>=13&&x<19&&y>=13&&y<19))alpha[(y*w+x)*4+3]=255;
 const sdf=bakeSDF(alpha,w,h);
 assert.equal(sdf.length,w*h*4);assert.ok(sdf[(8*w+8)*4]>127);
 assert.ok(sdf[(16*w+16)*4]<127);assert.ok(sdf[0]<127);
 for(let i=0;i<w*h;i++)assert.equal(sdf[i*4+3],255);
});

function harness({webgl=true,compile=true,desktop=true,reduced=false}={}){
 const classes=new Set(),status={textContent:''},frames=new Map(),observers=[],deleted=[],clears=[],blends=[],contexts=[];
 const gl=new Proxy({clearColor:(...v)=>clears.push(v),blendFunc:(...v)=>blends.push(v),createShader:()=>({}),getShaderParameter:()=>compile,createProgram:()=>({}),getProgramParameter:()=>true,createBuffer:()=>({}),createTexture:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>({}),deleteShader:s=>deleted.push('shader'),deleteProgram:()=>deleted.push('program'),deleteBuffer:()=>deleted.push('buffer'),deleteTexture:()=>deleted.push('texture'),drawArrays:()=>{gl.draws++},draws:0},{get(t,k){return k in t?t[k]:typeof k==='string'&&k===k.toUpperCase()?1:()=>{}}});
 const ctx={fillRect(){},clearRect(){},drawImage(){},beginPath(){},roundRect(){},rect(){},fill(){},createLinearGradient:()=>({addColorStop(){}}),getImageData:(x,y,w,h)=>{const a=new Uint8ClampedArray(w*h*4);for(let yy=24;yy<h-24;yy++)for(let xx=24;xx<w-24;xx++)a[(yy*w+xx)*4+3]=255;return {data:a}}};
 const canvases=[];
 class Canvas extends EventTarget{constructor(){super();this.attrs={};this.width=1;this.height=1}setAttribute(k,v){this.attrs[k]=v}getContext(type,options){if(type==='webgl')contexts.push(options);return type==='webgl'?(webgl?gl:null):ctx}remove(){this.removed=true}setPointerCapture(id){this.capture=id}hasPointerCapture(id){return this.capture===id}releasePointerCapture(){this.capture=null}}
 const doc=new EventTarget();Object.assign(doc,{hidden:false,createElement:()=>{const c=new Canvas();canvases.push(c);return c}});
 const media=new EventTarget(),motion=new EventTarget();media.matches=desktop;motion.matches=reduced;
 globalThis.document=doc;globalThis.window={devicePixelRatio:2};globalThis.matchMedia=q=>q.includes('min-width')?media:motion;
 globalThis.requestAnimationFrame=fn=>{frames.set(frames.size+1,fn);return frames.size};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}};
 globalThis.IntersectionObserver=globalThis.ResizeObserver;
 let image;globalThis.Image=class{constructor(){image=this;this.width=200;this.height=150}};
 const host={querySelector:()=>status,append(){},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},getBoundingClientRect:()=>({width:500,height:500,left:0,top:0})};
 const event=(target,type,data={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,data);target.dispatchEvent(e);return e};
 const run=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(100))};
 const preview=initGlassLogo(host);
 return {preview,gl,frames,observers,deleted,clears,blends,contexts,doc,event,run,status,canvas:canvases[0],image,media,motion,classes};
}
test('WebGL failure preserves real-logo fallback and releases partial resources',()=>{
 for(const opts of [{webgl:false},{compile:false}]){
  const h=harness(opts);assert.equal(h.frames.size,0);assert.ok(h.canvas.removed);
  assert.ok(!h.classes.has('glass-ready'));
  if(opts.compile===false){assert.ok(h.deleted.includes('program'));assert.ok(h.deleted.includes('shader'))}
  h.preview.destroy();
 }
});
test('desktop pauses hidden/offscreen, respects motion changes and releases every resource',()=>{
 const h=harness();h.image.onload();assert.ok(h.frames.size);h.run();assert.ok(h.gl.draws>0);assert.ok(h.classes.has('glass-ready'));
 h.doc.hidden=true;h.event(h.doc,'visibilitychange');assert.equal(h.frames.size,0);
 h.doc.hidden=false;h.event(h.doc,'visibilitychange');assert.ok(h.frames.size);
 h.observers[1].fn([{isIntersecting:false}]);assert.equal(h.frames.size,0);
 h.observers[1].fn([{isIntersecting:true}]);assert.ok(h.frames.size);
 h.event(h.canvas,'pointerdown',{pointerType:'mouse',button:0,pointerId:2,clientX:100,clientY:100});assert.equal(h.canvas.capture,2);
 h.event(h.canvas,'pointercancel');assert.equal(h.canvas.capture,null);
 h.motion.matches=true;h.event(h.motion,'change');assert.equal(h.frames.size,0);
 h.preview.destroy();assert.ok(h.observers.every(o=>o.disconnected));assert.equal(h.deleted.filter(x=>x==='texture').length,4);assert.ok(h.deleted.includes('buffer')&&h.deleted.includes('program'));assert.equal(h.frames.size,0);
 const before=h.gl.draws;h.event(h.doc,'visibilitychange');assert.equal(h.gl.draws,before);
});
test('mobile and reduced motion paint one static pose without continuous RAF',()=>{
 for(const opts of [{desktop:false},{reduced:true}]){
  const h=harness(opts);h.image.onload();assert.equal(h.frames.size,0);assert.equal(h.gl.draws,1);
  h.event(h.canvas,'pointerdown',{pointerType:'touch',button:0,pointerId:1});assert.equal(h.canvas.capture,undefined);
  h.event(h.canvas,'webglcontextlost');assert.ok(h.canvas.removed);assert.ok(!h.classes.has('glass-ready'));
 }
});

test('glass framebuffer and wrappers remain transparent with premultiplied compositing',()=>{
 const h=harness();h.image.onload();h.run();
 assert.equal(h.contexts[0].alpha,true);assert.equal(h.contexts[0].premultipliedAlpha,true);
 assert.deepEqual(h.clears,[[0,0,0,0]]);
 const source=readFileSync('src/glass-logo.ts','utf8');
 assert.match(source,/blendFunc\(gl.ONE, gl.ONE_MINUS_SRC_ALPHA\)/);
 assert.match(source,/gl_FragColor = vec4\(finalColor \* outAlpha, outAlpha\)/);
 assert.match(source,/if \(!hit\) discard/);
 const css=readFileSync('src/glass-logo.css','utf8');
 for(const selector of ['.glass-stage{','.glass-stage canvas{']){
  const rule=css.slice(css.indexOf(selector)).split('}')[0];assert.match(rule,/background:transparent/);
  assert.doesNotMatch(rule,/box-shadow|border:/);
 }
 h.preview.destroy();
});
