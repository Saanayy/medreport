/* Report engine: the draft's marks → report text. Pure functions, no DOM, so it runs in the
   browser and in tests. Mirrors the Sonoform design's logic; tests/ checks the output is identical.

   A draft D: {id, study, variant, sex, pt:{name,age,date,cr,usg,bill,ref,clin},
     sel:{'organ.side.row':{o, m, s, d}}, other (free-text findings), impOv (edited impression),
     adv/con (advice and consultant index; null = the Settings default), ink, inkWord, updated}
     o chosen option index · m inline measurement · s sub-choice index · d detail values
     side is '-' for single organs, 'R'/'L' for paired ones. */
import {ORG,W,SIDES,STUDIES,Land,cap} from './schema.js';

export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const fmtDate=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');return m?`${m[3]}/${m[2]}/${m[1]}`:(d||'')};
export const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export function blank(study='abd',variant=''){
  const sd=STUDIES.find(s=>s.id===study)||STUDIES[0];
  const sex=variant==='Female'?'F':variant==='Male'?'M':(sd.sex||'M');
  return {id:newId(),study:sd.id,variant,sex,pt:{name:'',age:'',date:today(),cr:'',usg:'',bill:'',ref:'',clin:''},sel:{},other:'',impOv:null,adv:null,con:null,ink:{},inkWord:true,updated:Date.now()};
}
export const studyOf=D=>STUDIES.find(s=>s.id===D.study)||STUDIES[0];
export const studyName=D=>{const s=studyOf(D);return s.n+(D.variant&&!/^(Male|Female|Start)$/.test(D.variant)?` (${D.variant})`:'')};
export const titleOf=D=>{const s=studyOf(D);return 'ULTRASOUND · '+s.title+(D.variant&&!/^(Male|Female|Start)$/.test(D.variant)?` (${D.variant})`:'')};

export const orgs=D=>{const ids=studyOf(D).organs;return ORG.filter(o=>ids.includes(o.id)&&(!o.sex||o.sex===D.sex))};
export const orgById=id=>ORG.find(o=>o.id===id);
export const rowBy=key=>{const[oid,,rid]=key.split('.');return orgById(oid).rows.find(r=>r.id===rid)};
export const dCount=(dd,D)=>typeof dd.n==='function'?dd.n(D||{}):(dd.n||1);

/* Is row r of organ o shown on side s, given the current marks? */
export function vis(o,s,r,sel){
  if(o.paired&&((s==='-')!==!!r.single))return false;
  return !r.when||r.when(rid=>{const rr=o.rows.find(x=>x.id===rid);if(!rr)return null;const v=sel[`${o.id}.${rr.single?'-':s}.${rid}`];return v?rr.o[v.o].l:null});
}
export function allRows(D){const r=[];orgs(D).forEach(o=>SIDES(o).forEach(s=>o.rows.forEach(row=>{if(vis(o,s,row,D.sel))r.push({o,s,row,key:`${o.id}.${s}.${row.id}`})})));return r}
/* True when the row is unmarked or a required value is still empty. */
export function missing(r,v){
  if(!v)return true;const x=r.o[v.o];if(x.req&&!v.m)return true;
  return(x.d||[]).some(dd=>(!dd.when||dd.when(v.d||{}))&&dd.req&&dd.t==='m'&&!Array.from({length:dCount(dd,v.d)}).every((_,i)=>((v.d||{})[dd.id]||[])[i]));
}
export function blocker(D){
  if(!D.pt.name.trim())return'Add the patient name before exporting';
  const r=allRows(D).find(x=>{const v=D.sel[x.key];return v&&missing(x.row,v)});
  return r?`Complete ${r.o.name} › ${r.row.l} before exporting`:null;
}
export function counts(D){
  let done=0,total=0,pos=0;const per={};
  orgs(D).forEach(o=>{let d=0,t=0,p=false;
    SIDES(o).forEach(s=>o.rows.forEach(r=>{if(!vis(o,s,r,D.sel))return;t++;const v=D.sel[`${o.id}.${s}.${r.id}`];if(v){if(!missing(r,v))d++;if(!r.o[v.o].n){p=true;pos++}}}));
    per[o.id]={d,t,pos:p};done+=d;total+=t});
  total++;if(D.pt.name.trim())done++;
  return {done,total,pos,per,pct:total?Math.round(done/total*100):0};
}

/* ---------- Actions (mutate D; the UI re-renders afterwards) ---------- */
export function pick(D,key,i){
  const x=rowBy(key).o[i],[oid,sd]=key.split('.'),sel=D.sel,v=sel[key];
  if(v&&v.o===i){delete sel[key];return}
  sel[key]={o:i,m:v?v.m:'',d:{...(x.pre||{})}};
  if(x.sets)Object.entries(x.sets).forEach(([rid,val])=>{sel[`${oid}.${sd}.${rid}`]={m:'',...val,d:{...(val.d||{})}}});
}
export function det(D,key,id,i,multi){
  const v=D.sel[key],Dd={...(v.d||{})};
  if(multi){const a=Dd[id]||[];Dd[id]=a.includes(i)?a.filter(q=>q!==i):[...a,i]}else Dd[id]=Dd[id]===i?undefined:i;
  D.sel[key]={...v,d:Dd};
}
export const clean=val=>String(val).replace(/[^0-9.]/g,'');
export function detM(D,key,id,i,val){const v=D.sel[key],Dd={...(v.d||{})},a=[...(Dd[id]||[])];a[i]=clean(val);Dd[id]=a;D.sel[key]={...v,d:Dd}}
export function sub(D,key,i){D.sel[key]={...D.sel[key],s:i}}
/* Inline measurement; rows with auto() switch option from the value (e.g. span ≥ 15.5 cm → Enlarged).
   Returns true when the option changed. */
export function meas(D,key,val){
  val=clean(val);const r=rowBy(key),v={...D.sel[key],m:val};let ch=false;
  if(r.auto&&val!==''&&!isNaN(+val)){const o=r.auto(+val);if(o!==v.o){v.o=o;v.d={};ch=true}}
  D.sel[key]=v;return ch;
}
export function organNormal(D,o){
  SIDES(o).forEach(s=>o.rows.forEach(r=>{if(!vis(o,s,r,D.sel))return;const k=`${o.id}.${s}.${r.id}`,i=r.o.findIndex(x=>x.n),v=D.sel[k];D.sel[k]={o:i,m:v&&v.o===i?v.m:''}}));
}
export function rest(D){let n=0;allRows(D).forEach(({row,key})=>{if(!D.sel[key]){D.sel[key]={o:row.o.findIndex(x=>x.n),m:''};n++}});return n}
/* What "Next unmarked" goes to: 'name', a row key, or null when everything is filled. */
export function nextTodo(D){
  if(!D.pt.name.trim())return'name';
  const r=allRows(D).find(x=>missing(x.row,D.sel[x.key]));
  return r?r.key:null;
}

/* ---------- Report ---------- */
export const NO_ABN='No significant sonographic abnormality detected.';
function reader(o,sel){
  return (rid,side='-')=>{const r=o.rows.find(x=>x.id===rid),v=sel[`${o.id}.${side}.${rid}`];if(!v||!vis(o,side,r,sel))return null;const x=r.o[v.o],Dd=v.d||{};
    return{l:x.l,n:!!x.n,s:x.sub&&v.s!=null?x.sub[v.s]:null,m:v.m,d:id=>{const dd=(x.d||[]).find(q=>q.id===id);if(!dd)return null;if(dd.when&&!dd.when(Dd))return dd.t==='m'||dd.multi?[]:null;const val=Dd[id];if(dd.t==='m')return val||[];if(dd.multi)return(val||[]).slice().sort((p,q)=>p-q).map(i=>dd.o[i]);return val!=null?dd.o[val]:null}}};
}
export const advOf=(D,set)=>{const i=D.adv==null?set.advSel:D.adv;return i>=0&&set.adv[i]?set.adv[i]:''};
export const conOf=(D,set)=>{const i=D.con==null?set.consSel:D.con;return set.cons[i]||null};
/* paras: [{g: organ id, t: paragraph}] · imp: final bullets · auto: suggested bullets */
export function report(D,set){
  const paras=[],imp=[],pend=[];
  orgs(D).forEach(o=>{
    const[S,I]=W[o.id](reader(o,D.sel));
    if(S.length)paras.push({g:o.id,t:S.join(' ')});
    if(SIDES(o).some(s=>o.rows.some(r=>vis(o,s,r,D.sel)&&!D.sel[`${o.id}.${s}.${r.id}`])))pend.push(o.name.toLowerCase());
    imp.push(...I);
  });
  const oth=(D.other||'').trim();if(oth)paras.push({g:'other',t:oth});
  const auto=imp.length?imp:[NO_ABN];
  const final=D.impOv!=null?D.impOv.split('\n').map(s=>s.trim()).filter(Boolean):auto;
  const adv=set?advOf(D,set):'';
  return{paras,imp:final,auto,edited:D.impOv!=null,pending:pend.length?'Not yet marked: '+Land(pend)+'.':'',advice:adv?'Advice: '+adv:'',impNote:D.impOv!=null?'Edited':'Auto-suggested from positive findings'};
}
export const sexWord=D=>D.sex==='F'?'F':'M';
export function plain(D,set,R=report(D,set)){
  const p=D.pt,c=conOf(D,set),L=[];
  [set.inst,set.dept,set.addr].filter(Boolean).forEach(x=>L.push(x));
  L.push('',titleOf(D).replace(' · ',' '));
  L.push(`Name: ${p.name}   Age/Sex: ${p.age?p.age+'/':''}${sexWord(D)}   Date: ${fmtDate(p.date)}`);
  const ids=[['CR No',p.cr],['USG No',p.usg],['Bill No',p.bill]].filter(x=>x[1]).map(x=>`${x[0]}: ${x[1]}`);if(ids.length)L.push(ids.join('   '));
  if(p.ref)L.push(`Referred by: ${p.ref}`);
  if(p.clin&&p.clin.trim())L.push(`Clinical details: ${p.clin.trim()}`);
  L.push('','FINDINGS',...R.paras.map(x=>x.t),'','IMPRESSION',...R.imp.map(b=>'• '+b));
  if(R.advice)L.push('',R.advice);
  const sig=[];if(set.resident)sig.push(`${set.resident}, Resident`);if(c)sig.push(`${c.name}, ${c.title||'Consultant Radiologist'}`);
  if(sig.length)L.push('',...sig);
  return L.join('\n');
}
export const surname=D=>{const w=(D.pt.name||'Report').trim().replace(/[.,]/g,' ').split(/\s+/).filter(Boolean);return w.length?w[w.length-1]:'Report'};
export const docName=D=>`${surname(D)}_USG-${studyOf(D).n.replace(/[^A-Za-z0-9]+/g,'-').replace(/-$/,'')}${D.variant&&!/^(Male|Female|Start)$/.test(D.variant)?'-'+D.variant:''}.docx`.replace(/[\\/:*?"<>|]+/g,'');
export {Land,cap};
