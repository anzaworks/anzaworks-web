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
 for(const file of ['site/glass-preview','site/glass-preview.js','site/glass-preview.css'])assert.equal(existsSync(file),false);
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

function harness({webgl=true,compile=true,desktop=true,reduced=false,coarse=false,width=500,height=500,dpr=2}={}){
 let nextFrame=0;const rotations=[];
 const classes=new Set(),status={textContent:''},frames=new Map(),observers=[],deleted=[],clears=[],blends=[],contexts=[];
 const gl=new Proxy({clearColor:(...v)=>clears.push(v),blendFunc:(...v)=>blends.push(v),createShader:()=>({}),getShaderParameter:()=>compile,createProgram:()=>({}),getProgramParameter:()=>true,createBuffer:()=>({}),createTexture:()=>({}),getAttribLocation:()=>0,getUniformLocation:(program,name)=>name,uniformMatrix3fv:(name,transpose,matrix)=>{if(name==='uRot')rotations.push([...matrix])},deleteShader:s=>deleted.push('shader'),deleteProgram:()=>deleted.push('program'),deleteBuffer:()=>deleted.push('buffer'),deleteTexture:()=>deleted.push('texture'),drawArrays:()=>{gl.draws++},draws:0},{get(t,k){return k in t?t[k]:typeof k==='string'&&k===k.toUpperCase()?1:()=>{}}});
 const ctx={fillRect(){},clearRect(){},drawImage(){},beginPath(){},roundRect(){},rect(){},fill(){},createLinearGradient:()=>({addColorStop(){}}),getImageData:(x,y,w,h)=>{const a=new Uint8ClampedArray(w*h*4);for(let yy=24;yy<h-24;yy++)for(let xx=24;xx<w-24;xx++)a[(yy*w+xx)*4+3]=255;return {data:a}}};
 const canvases=[];
 class Canvas extends EventTarget{constructor(){super();this.attrs={};this.width=1;this.height=1}setAttribute(k,v){this.attrs[k]=v}getContext(type,options){if(type==='webgl')contexts.push(options);return type==='webgl'?(webgl?gl:null):ctx}remove(){this.removed=true}setPointerCapture(id){this.capture=id}hasPointerCapture(id){return this.capture===id}releasePointerCapture(){this.capture=null}}
 const doc=new EventTarget();Object.assign(doc,{hidden:false,createElement:()=>{const c=new Canvas();canvases.push(c);return c}});
 const media=new EventTarget(),motion=new EventTarget(),touch=new EventTarget();media.matches=desktop;motion.matches=reduced;touch.matches=coarse;
 globalThis.document=doc;globalThis.window=Object.assign(new EventTarget(),{devicePixelRatio:dpr});globalThis.matchMedia=q=>q.includes('min-width')?media:q.includes('pointer: coarse')?touch:motion;
 globalThis.requestAnimationFrame=fn=>{const id=++nextFrame;frames.set(id,fn);return id};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;observers.push(this)}observe(){}unobserve(){}disconnect(){this.disconnected=true}};
 globalThis.IntersectionObserver=globalThis.ResizeObserver;
 let image;globalThis.Image=class{constructor(){image=this;this.width=200;this.height=150}};
 const host={querySelector:()=>status,append(){},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},getBoundingClientRect:()=>({width,height,left:0,top:0})};
 const event=(target,type,data={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,data);target.dispatchEvent(e);return e};
 const run=(time=100)=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time))};
 const preview=initGlassLogo(host);
 return {preview,host,gl,frames,observers,deleted,clears,blends,contexts,rotations,doc,event,run,status,get canvas(){return canvases.find(c=>!c.removed&&c.attrs['aria-hidden'])},get image(){return image},canvases,media,motion,touch,classes};
}
test('WebGL failure preserves real-logo fallback and releases partial resources',()=>{
 for(const opts of [{webgl:false},{compile:false}]){
  const h=harness(opts);assert.equal(h.frames.size,0);assert.ok(h.canvases[0].removed);
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
test('mobile rotates for five seconds without pointer input and resumes after scrolling or hiding',()=>{
 const h=harness({desktop:false,width:280,height:280});h.image.onload();
 assert.equal(h.canvas.width,560);assert.equal(h.frames.size,1);
 h.run(100);const first=h.rotations[0];
 for(let i=1;i<=300;i++)h.run(100+i*1000/60);
 assert.notDeepEqual(h.rotations.at(-1),first,'actual 3D rotation matrix changes over five seconds');
 assert.ok(h.gl.draws>=140&&h.gl.draws<=160,'mobile draws about 30 fps');
 h.event(h.canvas,'pointerdown',{pointerType:'touch',button:0,pointerId:1});assert.equal(h.canvas.capture,undefined);
 h.event(h.canvas,'pointercancel');assert.equal(h.frames.size,1,'touch cancellation does not stop auto-rotation');
 for(let i=0;i<5;i++){
  h.observers[1].fn([{isIntersecting:false}]);assert.equal(h.frames.size,0);
  const before=h.gl.draws;h.run(7000);assert.equal(h.gl.draws,before);
  h.observers[1].fn([{isIntersecting:true}]);h.observers[1].fn([{isIntersecting:true}]);assert.equal(h.frames.size,1);
  h.doc.hidden=true;h.event(h.doc,'visibilitychange');assert.equal(h.frames.size,0);
  h.doc.hidden=false;h.event(h.doc,'visibilitychange');h.event(h.doc,'visibilitychange');assert.equal(h.frames.size,1);
 }
 h.run(8000);assert.ok(h.gl.draws>150);h.preview.destroy();assert.equal(h.frames.size,0);
});
test('reduced motion uses the original static PNG with no WebGL and resumes after preference changes',()=>{
 const h=harness({desktop:false,reduced:true});
 assert.equal(h.contexts.length,0);assert.equal(h.frames.size,0);assert.equal(h.canvas,undefined);
 h.motion.matches=false;h.event(h.motion,'change');h.image.onload();h.run();
 assert.equal(h.contexts.length,1);assert.ok(h.classes.has('glass-ready'));assert.equal(h.frames.size,1);
 h.motion.matches=true;h.event(h.motion,'change');assert.equal(h.frames.size,0);assert.equal(h.canvas,undefined);assert.ok(!h.classes.has('glass-ready'));
 h.motion.matches=false;h.event(h.motion,'change');h.image.onload();h.run();assert.equal(h.frames.size,1);
 h.preview.destroy();
});
test('every requested viewport can animate with the same approved stage sizes',()=>{
 for(const [width,height] of [[430,932],[390,844],[360,800],[320,720],[768,1024],[1440,900]]){
  for(const stage of [width<900?280:520,width<900?220:360,width<900?160:240]){
   const h=harness({desktop:width>=900,width:stage,height:stage});h.image.onload();h.run();
   assert.equal(h.frames.size,1,`${width}×${height}`);assert.ok(h.gl.draws>0);h.preview.destroy();
  }
 }
 const h=harness({desktop:true,coarse:true});h.image.onload();assert.equal(h.canvas.width,640);h.run();assert.equal(h.frames.size,1);h.preview.destroy();
});
test('one stage gets only one canvas and loop; failure and context loss retain static fallback',()=>{
 const h=harness({desktop:false});assert.equal(initGlassLogo(h.host),h.preview);assert.equal(h.contexts.length,1);
 h.image.onload();h.run();assert.equal(h.frames.size,1);
 h.event(h.canvas,'webglcontextlost');assert.equal(h.frames.size,0);assert.equal(h.canvas,undefined);assert.ok(!h.classes.has('glass-ready'));
 h.preview.destroy();
});
test('lazy loader initializes once after rapid intersection events and cleans up on navigation',async()=>{
 const h=harness({desktop:false});h.preview.destroy();
 h.doc.querySelectorAll=()=>[h.host];
 await import('../build/glass-loader.js');
 const lazy=h.observers.at(-1);const before=h.contexts.length;
 lazy.fn([{target:h.host,isIntersecting:false}]);assert.equal(h.contexts.length,before);
 lazy.fn([{target:h.host,isIntersecting:true}]);lazy.fn([{target:h.host,isIntersecting:true}]);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.contexts.length,before+1);h.image.onload();h.run();assert.equal(h.frames.size,1);
 lazy.fn([{target:h.host,isIntersecting:true}]);assert.equal(h.contexts.length,before+1);
 h.event(window,'pagehide',{persisted:true});assert.equal(h.frames.size,1,'BFCache keeps the owner intact');
 h.event(window,'pagehide',{persisted:false});assert.equal(h.frames.size,0);assert.ok(lazy.disconnected);
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


test('mobile DPR caps at 2 with sharp 390px profile stages and native lower-DPR rendering',()=>{
 for(const dpr of [2,3,4]){
  for(const [stage,internal] of [[280,560],[220,440],[160,320]]){
   const h=harness({desktop:false,width:stage,height:stage,dpr});h.image.onload();
   assert.equal(h.canvas.width,internal);assert.equal(h.canvas.height,internal);
   assert.equal(h.frames.size,1);h.preview.destroy();
  }
 }
 for(const dpr of [1,1.5]){
  const h=harness({desktop:false,width:280,height:280,dpr});h.image.onload();
  assert.equal(h.canvas.width,280*dpr);h.preview.destroy();
 }
 const capped=harness({desktop:false,width:500,height:500,dpr:4});capped.image.onload();
 assert.equal(capped.canvas.width,640);assert.equal(capped.canvas.height,640);capped.preview.destroy();
});
test('desktop retains DPR 1.5, dimension cap 780 and its existing frame cadence',()=>{
 for(const [stage,internal] of [[240,360],[360,540],[520,780],[800,780]]){
  const h=harness({desktop:true,width:stage,height:stage,dpr:4});h.image.onload();
  assert.equal(h.canvas.width,internal);assert.equal(h.canvas.height,internal);
  for(let i=0;i<61;i++)h.run(100+i*1000/60);
  assert.equal(h.gl.draws,61);assert.equal(h.frames.size,1);h.preview.destroy();
 }
});
