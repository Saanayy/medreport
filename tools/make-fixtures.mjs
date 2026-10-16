/* Runs the Sonoform DESIGN's own logic (reference/sonoform.dc.html) on tests/cases.mjs
   and writes the expected report output to tests/fixtures.json.
   Only needed again if the cases change, or to re-baseline after a deliberate wording change.
   Usage: npm run fixtures */
import fs from 'node:fs';
import vm from 'node:vm';
import {CASES} from '../tests/cases.mjs';

const root=new URL('..',import.meta.url);
const html=fs.readFileSync(new URL('reference/sonoform.dc.html',root),'utf8');
const js=html.slice(html.indexOf('>',html.indexOf('<script type="text/x-dc"'))+1,html.lastIndexOf('</script>'));
const code=`${js}
;({Component,ORG})`;
class DCLogic{constructor(p){this.props=p||{}}setState(u){const s=typeof u==='function'?u(this.state):u;if(s)this.state={...this.state,...s}}}
const ctx={DCLogic,React:{createRef:()=>({current:null})},setTimeout:()=>0,clearTimeout:()=>{},navigator:{},console};
const {Component,ORG}=vm.runInNewContext(code,ctx);

const row=key=>{const[o,,r]=key.split('.');return ORG.find(x=>x.id===o).rows.find(x=>x.id===r)};
const optI=(key,l)=>{const i=row(key).o.findIndex(x=>x.l===l);if(i<0)throw new Error(`${key}: no option ${l}`);return i};
const dd=(key,id)=>{const c=row(key);const v=C.state.sel[key];return c.o[v.o].d.find(x=>x.id===id)};
let C;
function run(ops){
  C=new Component({});
  C.state.sel={};C.state.pt={...C.state.pt,name:'',age:''};C.state.sex='M';
  for(const [op,a,b,c,d] of ops){
    if(op==='sex')C.setState({sex:a});
    else if(op==='name')C.setState(s=>({pt:{...s.pt,name:a}}));
    else if(op==='pick')C.pick(a,optI(a,b));
    else if(op==='sub'){const o=row(a).o[C.state.sel[a].o];C.sub(a,o.sub.indexOf(b))}
    else if(op==='meas')C.meas(a,b);
    else if(op==='det'){const f=dd(a,b);const i=f.o.indexOf(c);if(i<0)throw new Error(`${a}.${b}: no ${c}`);C.det(a,b,i,f.multi)}
    else if(op==='detM')C.detM(a,b,c,d);
    else if(op==='normal')C.organNormal(ORG.find(o=>o.id===a),'mac');
    else if(op==='rest')C.rest('mac');
    else if(op==='imp')C.setState({impOv:a});
    else throw new Error('unknown op '+op);
  }
  const r=C.report(),v=C.renderVals();
  return JSON.parse(JSON.stringify({sel:C.state.sel,paras:r.paras,imp:r.imp,pending:r.hasPending?r.pending:'',
    done:v.doneCount,total:v.totalCount,pos:v.posCount,pct:v.pct,organs:v.organs.map(o=>[o.id,o.count]),blocker:C.blocker()}));
}
const out=CASES.map(c=>({name:c.name,expected:run(c.ops)}));
fs.writeFileSync(new URL('tests/fixtures.json',root),JSON.stringify(out,null,1)+'\n');
console.log(`wrote ${out.length} fixtures from the Sonoform design`);
