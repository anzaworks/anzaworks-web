import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
  assert.match(css,/\.work-card-body\{display:flex;flex-direction:column/);
  assert.match(css,/\.work-card-description\{[^}]*width:100%;max-width:50ch;[^}]*line-height:1\.65/);
  assert.match(css,/\.work-card-actions \.case-link\{[^}]*white-space:nowrap/);
  assert.match(css,/@media\(max-width:1023px\)\{\.real-project-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.work-slide-image img\{[^}]*object-fit:cover;object-position:top center/);
  const projects=JSON.parse(readFileSync('site/projects.json','utf8'));
  for(const p of projects)assert.ok(p.coverWidth/p.coverHeight<1.75,'no shallow capture needing giant contain bars: '+p.title);
});
