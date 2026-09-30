import test from 'node:test';
import assert from 'node:assert/strict';

import { harness } from './helpers/slider-dom.mjs';

test('desktop wheel, keyboard and controls move real project slides and loop',()=>{
  const h=harness();
  assert.equal(h.track.children.length,15);
  assert.ok(h.track.children.filter(c=>c.dataset.sliderClone).every(c=>c.attrs['aria-hidden']==='true'&&c.link.tabIndex===-1));
  const start=h.viewport.scrollLeft;
  assert.equal(h.event(h.viewport,'wheel',{deltaX:0,deltaY:828,deltaMode:0,ctrlKey:false}).defaultPrevented,true);
  h.flush();assert.ok(Math.abs(h.viewport.scrollLeft-start-828)<2);assert.equal(h.status.textContent,'2 / 5');
  h.event(h.viewport,'keydown',{key:'ArrowRight'});h.flush();assert.equal(h.status.textContent,'3 / 5');
  for(let i=0;i<3;i++){h.event(h.next,'click');h.flush()}
  assert.equal(h.status.textContent,'1 / 5');
  h.event(h.previous,'click');h.flush();assert.equal(h.status.textContent,'5 / 5');
  h.slider.destroy();assert.equal(h.track.children.length,5);assert.ok(h.observers.every(o=>o.disconnected));
});

test('mouse drag scrolls without following the dragged link; hidden tabs stop easing',()=>{
  const h=harness();const start=h.viewport.scrollLeft;
  h.event(h.viewport,'pointerdown',{pointerType:'mouse',button:0,pointerId:1,clientX:600});
  h.event(h.viewport,'pointermove',{pointerId:1,clientX:350});
  assert.equal(h.viewport.scrollLeft,start+250);
  h.event(h.viewport,'pointerup');
  assert.equal(h.event(h.viewport,'click').defaultPrevented,true);
  assert.equal(h.event(h.viewport,'click').defaultPrevented,false,'ordinary next click must work');
  h.event(h.next,'click');assert.ok(h.frames.size);
  h.doc.hidden=true;h.event(h.doc,'visibilitychange');assert.equal(h.frames.size,0);
  h.slider.destroy();assert.equal(h.frames.size,0);
});

test('mobile and reduced motion keep native scrolling and respond to preference changes',()=>{
  for(const options of [{desktop:false},{reduced:true}]){
    const h=harness(options);
    assert.equal(h.track.children.length,5);
    assert.equal(h.event(h.viewport,'wheel',{deltaY:500,deltaX:0,deltaMode:0}).defaultPrevented,false);
    h.event(h.viewport,'pointerdown',{pointerType:'touch',button:0,pointerId:2,clientX:400});
    h.event(h.viewport,'pointermove',{pointerId:2,clientX:100});assert.equal(h.viewport.scrollLeft,0);
    h.event(h.next,'click');assert.equal(h.viewport.scrollLeft,828);assert.equal(h.frames.size,0);
    h.width.matches=true;h.motion.matches=false;h.event(h.width,'change');assert.equal(h.track.children.length,15);
    h.motion.matches=true;h.event(h.motion,'change');assert.equal(h.track.children.length,5);
    h.slider.destroy();
    const before=h.viewport.scrollLeft;h.event(h.next,'click');assert.equal(h.viewport.scrollLeft,before,'destroy removes controls listeners');
  }
});
