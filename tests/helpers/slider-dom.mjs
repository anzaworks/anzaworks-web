import assert from 'node:assert/strict';
import { initSmoothWorkSlider } from '../../build/smooth-work-slider.js';

// Small DOM adapter exercises the compiled module's input/lifecycle behavior.
export function harness({desktop = true, reduced = false, count = 5} = {}) {
  const classes = () => ({values:new Set(), add(v){this.values.add(v)}, remove(...v){v.forEach(x=>this.values.delete(x))}, contains(v){return this.values.has(v)}, toggle(v,on){on?this.add(v):this.remove(v)}});
  const style = () => ({values:new Map(),setProperty(k,v){this.values.set(k,v)},removeProperty(k){this.values.delete(k)}});
  class Card {
    constructor(index){this.dataset={slideIndex:String(index)};this.style=style();this.link={tabIndex:0};this.attrs={};this.parent=null;this.offsetWidth=800;}
    get offsetLeft(){return this.parent.children.indexOf(this)*828+2;}
    setAttribute(k,v){this.attrs[k]=v;}
    querySelectorAll(){return [this.link];}
    cloneNode(){const card=new Card(Number(this.dataset.slideIndex));card.dataset={...this.dataset};return card;}
    remove(){this.parent.children=this.parent.children.filter(x=>x!==this);}
  }
  const track = {children:[],querySelectorAll(){return this.children.filter(x=>x.dataset.sliderClone)},prepend(f){this.children=[...f.children,...this.children];this.children.forEach(c=>c.parent=this)},append(f){this.children.push(...f.children);this.children.forEach(c=>c.parent=this)}};
  track.children=Array.from({length:count},(_,i)=>new Card(i));track.children.forEach(c=>c.parent=track);
  const viewport = new EventTarget();
  Object.assign(viewport,{clientWidth:1080,_scroll:0,attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},scrollBy({left}){this.scrollLeft+=left},scrollTo({left}){this.scrollLeft=left},setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},releasePointerCapture(){this.capture=null}});
  Object.defineProperties(viewport,{scrollWidth:{get(){return track.children.length*828-28+4}},scrollLeft:{get(){return this._scroll},set(v){this._scroll=Math.max(0,Math.min(this.scrollWidth-this.clientWidth,v))}}});
  const previous=new EventTarget(),next=new EventTarget(),status={textContent:'1 / 5'};
  const root={classList:classes(),style:style(),querySelector(selector){return ({'.work-slider-viewport':viewport,'.work-slider-track':track,'[data-slider-prev]':previous,'[data-slider-next]':next,'.work-slider-status':status})[selector]}};
  const width=new EventTarget(),motion=new EventTarget();width.matches=desktop;motion.matches=reduced;
  const doc=new EventTarget();doc.hidden=false;doc.body={classList:classes()};doc.createDocumentFragment=()=>({children:[],append(card){this.children.push(card)}});
  const frames=new Map();let counter=0;const observers=[];
  globalThis.document=doc;globalThis.matchMedia=q=>q.includes('min-width')?width:motion;
  globalThis.requestAnimationFrame=fn=>{frames.set(++counter,fn);return counter};globalThis.cancelAnimationFrame=id=>frames.delete(id);
  globalThis.ResizeObserver=class {constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}};
  globalThis.IntersectionObserver=class {constructor(fn){this.fn=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}};
  const event=(target,type,data={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,data);target.dispatchEvent(e);return e};
  const flush=()=>{for(let i=0;frames.size&&i<200;i++){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(i*16.67))}assert.equal(frames.size,0,'easing must stop')};
  const slider=initSmoothWorkSlider(root);
  return {viewport,track,root,status,width,motion,doc,frames,observers,event,flush,slider,previous,next};
}

