/* Report engine: everything that turns marks into report text.
   Pure functions of the form state S — no DOM — so it runs in the browser and in tests.
   Ported one-to-one from the original design page; tests/ checks the output stays identical. */
import {SECS,DOCS,KID_IMP_ORDER} from './schema.js';
import {cap,lc1,andJoin,sent} from './util.js';

/* ---------- State ---------- */
export const SEXW={M:'Male',F:'Female'};
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const blank=()=>({p:{date:today(),sex:'M'},r:{},add:'',imp:'',adv:'',con:'',res:'',ink:{},inkWord:true});
export const sex=S=>S.p.sex==='F'?'F':'M';
export const act=S=>SECS.filter(s=>!s.sex||s.sex===sex(S));
export const titleTxt=S=>`ULTRASOUND WHOLE ABDOMEN (${SEXW[sex(S)].toUpperCase()})`;
export const NO_ABN='No significant abnormality detected on ultrasound of the whole abdomen.';

export const sidesOf=sec=>sec.sides?['R','L']:[null];
export const key=(s,r,sd)=>sd?`${s}.${r}.${sd}`:`${s}.${r}`;
export const IDX={};
SECS.forEach(sec=>sec.rows.forEach(row=>sidesOf(sec).forEach(sd=>IDX[key(sec.id,row.id,sd)]={sec,row,sd})));
export const opt=(row,v)=>row.o.find(o=>o.v===v);
export const st=(S,k)=>S.r[k]||(S.r[k]={s:[],f:{}});
export const peek=(S,k)=>S.r[k]||{s:[],f:{}};

export function naSet(S,sec,sd){
  const set=new Set();
  sec.rows.forEach(row=>peek(S,key(sec.id,row.id,sd)).s.forEach(v=>(opt(row,v)?.na||[]).forEach(x=>set.add(x))));
  return set;
}
export function marked(S,sec,row,sd){
  const x=peek(S,key(sec.id,row.id,sd));
  if(!x.s.length) return false;
  return x.s.every(v=>(opt(row,v)?.f||[]).every(f=>!f.req||String(x.f[f.k]??'').trim()));
}
export const isAbn=(row,x)=>x.s.some(v=>!opt(row,v)?.n);

/* ---------- Text generation ---------- */
/* Templates: {key} inserts a field value ({key.l} lower-cased, {Side}/{side} the kidney side);
   [ ... ] is an optional span, dropped whole when any field inside it is empty. */
export function fill(tpl,f,sd){
  if(!tpl) return '';
  const get=k=>{
    if(k==='Side') return sd==='R'?'Right':'Left';
    if(k==='side') return sd==='R'?'right':'left';
    const [kk,mod]=k.split('.'); let v=String(f[kk]??'').trim();
    return mod==='l'?v.toLowerCase():v;
  };
  let out=tpl.replace(/\[([^\[\]]*)\]/g,(m,inner)=>{let ok=true;const r=inner.replace(/\{([\w.]+)\}/g,(m2,k)=>{const v=get(k);if(!v)ok=false;return v});return ok?r:''});
  out=out.replace(/\{([\w.]+)\}/g,(m,k)=>get(k));
  return out.replace(/\b([Aa]) (?=[aeiou])/g,'$1n ').replace(/\s+/g,' ').trim();
}
export function secSentences(S,sec,sd){
  const na=naSet(S,sec,sd), ss=[];
  sec.rows.forEach(row=>{
    if(na.has(row.id)||!marked(S,sec,row,sd)) return;
    const x=peek(S,key(sec.id,row.id,sd));
    if(row.say) ss.push(row.say(x.s,x.f,sd));
    else x.s.forEach(v=>ss.push(fill(opt(row,v).s,x.f,sd)));
  });
  let out=ss.filter(Boolean).map(sent);
  if(sd&&out.length&&!marked(S,sec,sec.rows[0],sd)) out.unshift((sd==='R'?'Right':'Left')+' kidney:');
  return out.join(' ');
}
export function findings(S){
  const P=[];
  act(S).forEach(sec=>sidesOf(sec).forEach(sd=>{const t=secSentences(S,sec,sd);if(t)P.push({g:sec.id,t})}));
  return P;
}
function frags(S,sec,sd,order){
  const na=naSet(S,sec,sd), out=[];
  (order?order.map(id=>sec.rows.find(r=>r.id===id)):sec.rows).forEach(row=>{
    if(na.has(row.id)||!marked(S,sec,row,sd)) return;
    const x=peek(S,key(sec.id,row.id,sd));
    const a=row.imp?row.imp(x.s):x.s.map(v=>{const o=opt(row,v);return(!o.n&&o.i)?fill(o.i,x.f,sd):''});
    a.forEach(t=>{t=lc1(t);if(t&&!out.includes(t))out.push(t)});
  });
  return out;
}
function kidLine(side,fr,bil){
  fr=fr.slice(); let head;
  if(fr[0]==='calculus'){head=bil?'Bilateral renal calculi':`${side} renal calculus`;fr.shift()}
  else{head=(bil?'Both kidneys':`${side} kidney`)+': '+fr.shift()}
  return head+(fr.length?' with '+andJoin(fr):'');
}
export function impression(S){
  const L=[];
  act(S).forEach(sec=>{
    if(sec.sides){
      const per={};
      ['R','L'].forEach(sd=>{
        const f=frags(S,sec,sd,KID_IMP_ORDER);
        const h=f.findIndex(t=>/hydronephrosis$/.test(t)), u=f.indexOf('dilated ureter');
        if(h>-1&&u>-1){f[h]=f[h].replace('hydronephrosis','hydroureteronephrosis');f.splice(u,1)}
        per[sd]=f;
      });
      if(per.R.length&&per.R.join('|')===per.L.join('|')) L.push(kidLine('',per.R,true));
      else{if(per.R.length)L.push(kidLine('Right',per.R));if(per.L.length)L.push(kidLine('Left',per.L))}
      return;
    }
    const f=frags(S,sec,null);
    if(!f.length) return;
    if(sec.sep) f.forEach(t=>L.push(cap(t)));
    else L.push(cap(f[0])+(f.length>1?' with '+andJoin(f.slice(1)):''));
  });
  return L.map(sent);
}
export function counts(S){
  let tot=0,done=0;const per={};
  act(S).forEach(sec=>{
    let t=0,d=0,a=false;
    sidesOf(sec).forEach(sd=>{const na=naSet(S,sec,sd);sec.rows.forEach(row=>{
      if(na.has(row.id))return;t++;if(marked(S,sec,row,sd))d++;if(isAbn(row,peek(S,key(sec.id,row.id,sd))))a=true;})});
    per[sec.id]={t,d,a};tot+=t;done+=d;
  });
  return {tot,done,per};
}
export const fmtDate=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');return m?`${m[3]}/${m[2]}/${m[1]}`:(d||'')};
export function report(S){
  const c=counts(S), auto=impression(S);
  const own=S.imp.trim()?S.imp.split(/\n+/).map(t=>t.replace(/^\s*[-•*]\s*/,'').trim()).filter(Boolean).map(sent):null;
  let imp=own||auto;
  if(!own&&!imp.length&&c.done>0) imp=[NO_ABN];
  const con=DOCS.find(d=>d[0]===S.con);
  return {c,paras:findings(S),imp,impAuto:!own,p:S.p,add:S.add.trim(),adv:S.adv.trim(),con,res:S.res.trim()};
}
export function reportText(S){
  const R=report(S),p=R.p,L=[];
  L.push(titleTxt(S),'');
  const kv=(k,v)=>v?`${k}: ${v}`:'';
  const line=(...a)=>{const t=a.filter(Boolean).join('    ');if(t)L.push(t)};
  line(kv('Name',p.name),kv('Age/Sex',p.age?p.age+'/'+sex(S):''));
  line(kv('CR No',p.cr),kv('USG No',p.usg),kv('Bill No',p.bill));
  line(kv('Date',fmtDate(p.date)));
  line(kv('Referred by',p.ref));
  line(kv('Clinical details',(p.clin||'').trim()));
  L.push('','FINDINGS:');
  R.paras.forEach(x=>L.push(x.t));
  if(R.add) L.push('','Additional findings: '+R.add);
  if(R.imp.length){L.push('','IMPRESSION:');R.imp.forEach(t=>L.push('- '+t))}
  if(R.adv) L.push('','Advice: '+R.adv);
  if(R.con||R.res) L.push('');
  if(R.con) L.push(`${R.con[0]}, ${R.con[1]}`);
  if(R.res) L.push('Resident: '+R.res);
  return L.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

/* ---------- Actions on the state (the UI re-renders afterwards) ---------- */
/* Toggle option v on row k. Single-choice rows swap; multi-choice rows add/remove,
   with "exclusive" options (x:1, e.g. "Lumen is clear") clearing the others.
   Returns the key of a required text/number field to focus, or null. */
export function pick(S,k,v){
  const {row}=IDX[k],x=st(S,k),o=opt(row,v),was=x.s.includes(v);
  if(!row.m) x.s=was?[]:[v];
  else if(was) x.s=x.s.filter(y=>y!==v);
  else if(o.x) x.s=[v];
  else x.s=[...x.s.filter(y=>!opt(row,y).x),v];
  if(was) return null;
  const reqF=(o.f||[]).find(f=>f.req&&!f.ch&&!String(x.f[f.k]??'').trim());
  return reqF?reqF.k:null;
}
/* Choice-field buttons (e.g. fatty-liver grade) toggle. */
export function setChoice(S,k,fk,val){const x=st(S,k);x.f[fk]=x.f[fk]===val?'':val}
/* Mark every untouched row in the given sections with its normal option. Returns the count. */
export function restNormal(S,list){
  let n=0;
  list.forEach(sec=>sidesOf(sec).forEach(sd=>sec.rows.forEach(row=>{
    if(naSet(S,sec,sd).has(row.id))return;
    const x=st(S,key(sec.id,row.id,sd));if(x.s.length)return;
    x.s=(row.def||[row.o.find(o=>o.n).v]).slice();n++;
  })));
  return n;
}
/* True when the section still has a row with nothing selected (drives "All/Rest normal"). */
export function hasEmpty(S,sec){
  return sidesOf(sec).some(sd=>{const na=naSet(S,sec,sd);return sec.rows.some(r=>!na.has(r.id)&&!peek(S,key(sec.id,r.id,sd)).s.length)});
}
/* First row (in form order) that is unmarked or missing a required value. */
export function nextTodo(S){
  for(const sec of act(S))for(const row of sec.rows)for(const sd of sidesOf(sec)){
    if(naSet(S,sec,sd).has(row.id)||marked(S,sec,row,sd))continue;
    return {sec,row,sd};
  }
  return null;
}
