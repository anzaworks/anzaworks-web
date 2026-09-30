import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {site,projects} from '../build/content.js';
const origin='https://anzaworks-web.vercel.app';
const image=origin+'/brand/anza-social-preview.png';
const alt='Anza Works — Creative Digital Studio';
const htmlFor=path=>readFileSync('site/'+(path==='/'?'index.html':path.slice(1)+'index.html'),'utf8');
const tag=(html,kind,key)=>html.match(new RegExp('<meta '+kind+'="'+key+'" content="([^"]*)">'))?.[1];

test('social PNG is a real 1200×630 card separate from the existing favicon',()=>{
 const png=readFileSync('public/brand/anza-social-preview.png');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert.ok(png.length>20000);
 assert.deepEqual(readFileSync('site/brand/anza-social-preview.png'),png);
 const home=htmlFor('/');
 assert.match(home,/<link rel="icon" href="\/brand\/anza-icon.png" type="image\/png">/);
 assert.match(home,/<link rel="apple-touch-icon" href="\/brand\/anza-icon.png">/);
 assert.notDeepEqual(png,readFileSync('site/brand/anza-icon.png'));
});

test('Home and normal pages have complete absolute OG and Twitter sharing metadata',()=>{
 assert.equal(site.origin,origin);
 for(const path of ['/','/work/','/services/','/about/','/contact/']){
  const html=htmlFor(path);
  assert.equal(tag(html,'property','og:type'),'website');
  assert.equal(tag(html,'property','og:url'),origin+path);
  for(const key of ['og:image','og:image:secure_url'])assert.equal(tag(html,'property',key),image);
  assert.equal(new URL(tag(html,'property','og:image')).protocol,'https:');
  assert.equal(tag(html,'property','og:image:type'),'image/png');
  assert.equal(tag(html,'property','og:image:width'),'1200');
  assert.equal(tag(html,'property','og:image:height'),'630');
  assert.equal(tag(html,'property','og:image:alt'),alt);
  assert.equal(tag(html,'name','twitter:card'),'summary_large_image');
  assert.equal(tag(html,'name','twitter:image'),image);
  assert.equal(tag(html,'name','twitter:image:alt'),alt);
  assert.ok(html.includes('<link rel="canonical" href="'+origin+path+'">'));
  assert.doesNotMatch(html,/https:\/\/anzaworks\.lk/);
 }
 const home=htmlFor('/');
 assert.equal(tag(home,'property','og:title'),'Creative digital studio | Anza Works');
 assert.equal(tag(home,'property','og:description'),site.description);
 for(const file of ['sitemap.xml','robots.txt']){
  const text=readFileSync('site/'+file,'utf8');assert.ok(text.includes(origin));assert.doesNotMatch(text,/https:\/\/anzaworks\.lk/);
 }
});

test('case studies retain real project-specific screenshots with matching image metadata',()=>{
 for(const p of projects){
  const html=htmlFor('/work/'+p.slug+'/');
  assert.equal(tag(html,'property','og:image'),origin+p.cover);
  assert.equal(tag(html,'property','og:image:secure_url'),origin+p.cover);
  assert.equal(tag(html,'name','twitter:image'),origin+p.cover);
  assert.equal(tag(html,'property','og:image:type'),'image/webp');
  assert.equal(tag(html,'property','og:image:width'),String(p.coverWidth));
  assert.equal(tag(html,'property','og:image:height'),String(p.coverHeight));
  assert.ok(tag(html,'property','og:image:alt'));
  assert.ok(readFileSync('site'+p.cover).length>5000);
 }
});
