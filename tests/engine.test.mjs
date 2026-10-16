/* The new engine must produce exactly what the original design produced.
   Run: npm test */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CASES} from './cases.mjs';
import {SECS} from '../js/schema.js';
import * as E from '../js/engine.js';
import {documentParts,buildDocx} from '../js/docx.js';

const FIX=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url),'utf8'));

function run(ops){
  const S=E.blank();
  for(const [op,a,b,c] of ops){
    if(op==='patient') Object.assign(S.p,a);
    else if(op==='pick') E.pick(S,a,b);
    else if(op==='field') E.st(S,a).f[b]=c;
    else if(op==='choice') E.setChoice(S,a,b,c);
    else if(op==='rest') E.restNormal(S,a?[SECS.find(s=>s.id===a)]:E.act(S));
    else if(op==='set') S[a]=b;
    else throw new Error('unknown op '+op);
  }
  return S;
}

test('every case has a fixture',()=>assert.deepEqual(FIX.map(f=>f.name),CASES.map(c=>c.name)));

for(const c of CASES){
  test(c.name,()=>{
    const want=FIX.find(f=>f.name===c.name).expected, S=run(c.ops);
    assert.deepEqual(JSON.parse(JSON.stringify(S.r)),want.rows,'marks');
    assert.equal(E.reportText(S),want.text,'report text');
    assert.deepEqual(E.impression(S),want.impression,'impression');
    assert.deepEqual(E.findings(S),want.findings,'findings');
    assert.deepEqual(E.counts(S),want.counts,'counts');
    assert.equal(documentParts(S).doc,want.docx,'Word document.xml');
  });
}

test('Word file is a valid zip with the expected parts',()=>{
  const S=run(CASES[1].ops), b=buildDocx(S);
  assert.equal(b[0],0x50);assert.equal(b[1],0x4b);
  const s=Buffer.from(b).toString('latin1');
  for(const p of ['[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml']) assert.ok(s.includes(p),p);
});

test('nextTodo finds the first unmarked row in form order',()=>{
  const S=run([['patient',{date:'2026-10-15'}],['rest']]);
  const n=E.nextTodo(S);
  assert.equal(n.sec.id,'kid');assert.equal(n.row.id,'size');assert.equal(n.sd,'R');
  assert.equal(E.nextTodo(run([['patient',{date:'2026-10-15'}]])).sec.id,'liver');
});

test('pick asks to focus a required empty field',()=>{
  const S=E.blank();
  assert.equal(E.pick(S,'kid.size.R','Measured'),'L');
  assert.equal(E.pick(S,'liver.size','Enlarged'),null);
});
