/* Runs the ORIGINAL design page's logic (reference/design.html) on tests/cases.mjs
   and writes the expected outputs to tests/fixtures.json.
   Only needed again if the cases change, or to re-baseline after a deliberate wording change.
   Usage: node tools/make-fixtures.mjs */
import fs from 'node:fs';
import vm from 'node:vm';
import {CASES} from '../tests/cases.mjs';

const root=new URL('..',import.meta.url);
const html=fs.readFileSync(new URL('reference/design.html',root),'utf8');
const js=html.slice(html.indexOf('<script>')+'<script>'.length,html.lastIndexOf('</script>'));
const L=js.split('\n'), lines=(a,b)=>L.slice(a-1,b).join('\n');

// Sanity-check the line ranges still point where we expect.
const expect=(n,s)=>{if(!L[n-1].includes(s))throw new Error(`design line ${n} should contain ${s}: ${L[n-1]}`)};
expect(4,'const $=');expect(311,'function reportHTML');expect(427,'function pick');expect(453,'}');expect(703,'function buildDocx');expect(755,'}');

const code=`(()=>{'use strict';
const document={querySelector:()=>null,querySelectorAll:()=>[]};
const renderSec=()=>{},after=()=>{},toast=()=>{},notesHTML=()=>'',notes=()=>[],noteImg=()=>null,dataBytes=()=>null,LABEL={};
${lines(4,331)}
const updateStatus=()=>counts();
${lines(427,453)}
const zip=files=>files.find(f=>f.name==='word/document.xml').str;
${lines(703,755)}
return {reset:()=>{S=blank()},S:()=>S,st,pick,restNormal,reportText,impression,findings,counts,buildDocx,act,SECS};
})()`;
const O=vm.runInNewContext(code,{console});

const run=ops=>{
  O.reset();
  for(const [op,a,b,c] of ops){
    const S=O.S();
    if(op==='patient') Object.assign(S.p,a);
    else if(op==='pick') O.pick(a,b);
    else if(op==='field') O.st(a).f[b]=c;
    else if(op==='choice'){const x=O.st(a);x.f[b]=x.f[b]===c?'':c}
    else if(op==='rest') O.restNormal(a?[O.SECS.find(s=>s.id===a)]:O.act());
    else if(op==='set') S[a]=b;
    else throw new Error('unknown op '+op);
  }
  const S=O.S();
  return JSON.parse(JSON.stringify({rows:S.r,text:O.reportText(),impression:O.impression(),findings:O.findings(),counts:O.counts(),docx:O.buildDocx()}));
};

const out=CASES.map(c=>({name:c.name,expected:run(c.ops)}));
fs.writeFileSync(new URL('tests/fixtures.json',root),JSON.stringify(out,null,1)+'\n');
console.log(`wrote ${out.length} fixtures from the original design`);
