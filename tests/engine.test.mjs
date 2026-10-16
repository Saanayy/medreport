/* The app's engine must produce exactly what the Sonoform design produces.
   Run: npm test   (fixtures come from the design itself: npm run fixtures) */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CASES} from './cases.mjs';
import {DEFAULT_SETTINGS} from '../js/schema.js';
import * as E from '../js/engine.js';
import {documentParts,buildDocx} from '../js/docx.js';

const FIX=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url),'utf8'));

export function run(ops){
  const D=E.blank('abd','Male');
  for(const [op,a,b,c,d] of ops){
    const row=['pick','sub','det'].includes(op)?E.rowBy(a):null;
    if(op==='sex')D.sex=a;
    else if(op==='name')D.pt.name=a;
    else if(op==='pick')E.pick(D,a,row.o.findIndex(x=>x.l===b));
    else if(op==='sub')E.sub(D,a,row.o[D.sel[a].o].sub.indexOf(b));
    else if(op==='meas')E.meas(D,a,b);
    else if(op==='det'){const f=row.o[D.sel[a].o].d.find(x=>x.id===b);E.det(D,a,b,f.o.indexOf(c),f.multi)}
    else if(op==='detM')E.detM(D,a,b,c,d);
    else if(op==='normal')E.organNormal(D,E.orgById(a));
    else if(op==='rest')E.rest(D);
    else if(op==='imp')D.impOv=a;
    else throw new Error('unknown op '+op);
  }
  return D;
}

test('every case has a fixture',()=>assert.deepEqual(FIX.map(f=>f.name),CASES.map(c=>c.name)));

for(const c of CASES){
  test(c.name,()=>{
    const want=FIX.find(f=>f.name===c.name).expected, D=run(c.ops), R=E.report(D,DEFAULT_SETTINGS), n=E.counts(D);
    assert.deepEqual(JSON.parse(JSON.stringify(D.sel)),want.sel,'marks');
    assert.deepEqual(R.paras.map(p=>p.t),want.paras,'findings');
    assert.deepEqual(R.imp,want.imp,'impression');
    assert.equal(R.pending,want.pending,'not yet marked');
    assert.deepEqual([n.done,n.total,n.pos,n.pct],[want.done,want.total,want.pos,want.pct],'progress');
    assert.deepEqual(E.orgs(D).map(o=>[o.id,`${n.per[o.id].d}/${n.per[o.id].t}`]),want.organs,'organ counts');
    assert.equal(E.blocker(D),want.blocker,'export blocker');
  });
}

test('next unmarked: name first, then rows in form order',()=>{
  const D=E.blank();assert.equal(E.nextTodo(D),'name');
  D.pt.name='X';assert.equal(E.nextTodo(D),'liver.-.size');
  E.rest(D);assert.equal(E.nextTodo(D),null);
  E.pick(D,'liver.-.size',1);assert.equal(E.nextTodo(D),'liver.-.size','enlarged needs a span');
});

test('studies pick their organs and sex',()=>{
  assert.deepEqual(E.orgs(E.blank('kub','Start')).map(o=>o.id),['kid','ub','pros']);
  const P=E.blank('pel','TVS');assert.equal(P.sex,'F');assert.deepEqual(E.orgs(P).map(o=>o.id),['ub','ut','ov','perit']);
  assert.equal(E.titleOf(P),'ULTRASOUND · PELVIS (TVS)');
  assert.equal(E.blank('abd','Female').sex,'F');
});

test('plain text and Word file',()=>{
  const D=run(CASES[1].ops);D.pt.date='2026-10-14';
  const t=E.plain(D,DEFAULT_SETTINGS);
  assert.match(t,/^All India Institute/);assert.match(t,/ULTRASOUND WHOLE ABDOMEN/);assert.match(t,/• Grade II fatty liver\./);assert.match(t,/Date: 14\/10\/2026/);
  const {doc}=documentParts(D,DEFAULT_SETTINGS);
  assert.match(doc,/grade II fatty infiltration/);assert.match(doc,/IMPRESSION/);
  const b=buildDocx(D,DEFAULT_SETTINGS),s=Buffer.from(b).toString('latin1');
  assert.equal(b[0],0x50);assert.equal(b[1],0x4b);
  for(const p of ['[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml']) assert.ok(s.includes(p),p);
  assert.equal(E.docName(D),'Sharma_USG-Whole-Abdomen.docx');
});
