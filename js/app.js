/* UI: screens, rendering, input, drafts, settings, copy/print/Word. Report wording lives in schema.js. */
import {ORG,SIDES,STUDIES,DEFAULT_SETTINGS} from './schema.js';
import {esc} from './util.js';
import * as E from './engine.js';
import {buildDocx} from './docx.js';
import * as Ink from './ink.js';

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const mq=q=>matchMedia(q).matches;
const isWide=()=>mq('(min-width:1280px)');
const reduce=()=>mq('(prefers-reduced-motion: reduce)');

/* ---------- Storage: everything stays on this device ---------- */
const K={drafts:'sonoform-drafts',set:'sonoform-settings',theme:'sonoform-theme',pos:'sonoform-positive'};
const load=(k,d)=>{try{const j=localStorage.getItem(k);return j?JSON.parse(j):d}catch(e){return d}};
const store=(k,v)=>{try{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))}catch(e){}};
let set={...DEFAULT_SETTINGS,...load(K.set,{})};
let drafts=load(K.drafts,[]).filter(d=>d&&d.id&&d.sel);
let D=null;
let svT=0;
const saveSet=()=>store(K.set,set);
function saveDrafts(){drafts.sort((a,b)=>b.updated-a.updated);if(drafts.length>100)drafts.length=100;store(K.drafts,drafts)}
function touch(){if(!D)return;D.updated=Date.now();clearTimeout(svT);svT=setTimeout(saveDrafts,250)}
const untouched=d=>!d.pt.name.trim()&&!Object.keys(d.sel).length&&!Ink.anyInk()&&!(d.other||'').trim();

/* The earlier single-draft app (USG Whole Abdomen): carry its patient over once. */
(function migrate(){
  if(load('sonoform-migrated',0))return;store('sonoform-migrated','1');
  const o=load('usg-abd-male-v1',null);
  if(o&&o.p&&(o.p.name||'').trim()){const d=E.blank('abd',o.p.sex==='F'?'Female':'Male');Object.keys(d.pt).forEach(k=>{if(o.p[k])d.pt[k]=o.p[k]});drafts.push(d);saveDrafts()}
  const t=load('usg-abd-theme',null);if(t&&!localStorage.getItem(K.theme))store(K.theme,t);
})();

/* ---------- Routing: #home · #settings · #r/<draft id> ---------- */
function route(){
  const h=location.hash.slice(1);
  if(D&&!h.startsWith('r/'))leaveFill();
  if(h==='settings')return show('settings');
  if(h.startsWith('r/')){const d=drafts.find(x=>x.id===h.slice(2));if(d)return openFill(d)}
  show('home');
}
const go=h=>{if(location.hash==='#'+h)route();else location.hash=h};
function show(id){
  $$('.screen').forEach(s=>s.hidden=s.id!==id);$('#toast').hidden=true;
  if(id==='home')renderHome();
  if(id==='settings')renderSettings();
  if(id!=='fill'){closeSheet();if(Ink.inkOn())Ink.setInk(false)}
  scrollTo(0,0);
}
function leaveFill(){
  if(!D)return;
  if(untouched(D))drafts=drafts.filter(x=>x!==D);
  saveDrafts();D=null;closeSheet();if(Ink.inkOn())Ink.setInk(false);
}

/* ---------- Home ---------- */
let editDrafts=false;
function ringHTML(p,cls=''){return `<div class="ring ${cls}" style="--p:${p}"><span>${p}%</span></div>`}
function when(t){
  const d=new Date(t),n=new Date(),y=new Date(n);y.setDate(n.getDate()-1);
  if(d.toDateString()===n.toDateString())return d.toTimeString().slice(0,5);
  if(d.toDateString()===y.toDateString())return 'Yesterday';
  return d.toLocaleDateString(undefined,{day:'numeric',month:'short'});
}
function renderHome(){
  $('#studies').innerHTML=STUDIES.map(s=>{
    const soon=!s.organs.length;
    return `<div class="study${soon?' soon':''}"><div style="flex:1;min-width:0"><div class="sn">${esc(s.n)}</div><div class="sd">${esc(s.d)}</div></div>
      <div class="so">${soon?'<span class="soonTag">Coming soon</span>':s.opts.map(o=>`<button type="button" data-new="${s.id}" data-var="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`}).join('');
  $('#draftsEdit').hidden=!drafts.length;$('#draftsEdit').textContent=editDrafts?'Done':'Edit';
  $('#drafts').innerHTML=drafts.length?drafts.map(d=>{
    const c=E.counts(d),st=E.studyName(d)+(d.study==='abd'?' · '+d.sex:'');
    return `<button type="button" class="draft" data-open="${d.id}">${ringHTML(c.pct)}<div style="min-width:0"><div class="dn">${esc(d.pt.name||'Unnamed patient')}</div><div class="dm">${esc(st)} · ${when(d.updated)}</div></div>`+
      (editDrafts?`<span class="dx" data-del="${d.id}" role="button">Delete</span>`:`<span class="da">${c.pct===100?'Open':'Resume'} ›</span>`)+'</button>'}).join(''):'<div class="empty">No drafts yet. Drafts appear here as you fill reports.</div>';
}
function newDraft(study,variant){const d=E.blank(study,variant);drafts.unshift(d);go('r/'+d.id)}

/* ---------- Settings ---------- */
let setEdit={cons:false,adv:false},adding=null;
function renderSettings(){
  const theme=load(K.theme,'system')||'system',pos=localStorage.getItem(K.pos)||'filled';
  const fr=(k,l)=>`<label class="fieldrow"><span>${l}</span><input data-set="${k}" value="${esc(set[k])}" autocomplete="off"></label>`;
  let h=`<div class="sect">Letterhead</div><div class="group pad">${fr('inst','Institution')}${fr('dept','Department')}${fr('addr','Address')}</div>`;
  h+=`<div class="sect">Consultant sign-off${set.cons.length?`<button type="button" class="link" data-setedit="cons">${setEdit.cons?'Done':'Edit'}</button>`:''}</div><div class="group">`;
  h+=set.cons.map((c,i)=>`<button type="button" class="opt" data-cons="${i}"><span class="ot">${esc(c.name)}${c.title?`<small>${esc(c.title)}</small>`:''}</span>`+
    (setEdit.cons?`<span class="rm" data-rmcons="${i}" role="button">Remove</span>`:`<span class="otag">${i===set.consSel?'Signs reports':''}</span><span class="radio${i===set.consSel?' on':''}"></span>`)+'</button>').join('');
  h+=adding==='cons'?`<div class="addrow"><input id="addName" placeholder="Name, e.g. Dr A. Rao" autocomplete="off"><input id="addTitle" placeholder="Designation (optional)" autocomplete="off"><button type="button" class="btn dark" data-add="cons">Add</button></div>`
    :'<button type="button" class="addbtn" data-adding="cons">+ Add consultant</button>';
  h+='</div>';
  h+=`<div class="sect">Resident</div><div class="group pad">${fr('resident','Name on report')}</div>`;
  h+=`<div class="sect">Default advice${set.adv.length?`<button type="button" class="link" data-setedit="adv">${setEdit.adv?'Done':'Edit'}</button>`:''}</div><div class="group">`;
  h+=set.adv.map((a,i)=>`<button type="button" class="opt serif" data-advd="${i}"><span class="ot">${esc(a)}</span>`+
    (setEdit.adv?`<span class="rm" data-rmadv="${i}" role="button">Remove</span>`:`<span class="tagd" style="opacity:${i===set.advSel?1:0}">DEFAULT</span>`)+'</button>').join('');
  h+=adding==='adv'?`<div class="addrow"><input id="addAdv" placeholder="e.g. Follow-up scan advised." autocomplete="off"><button type="button" class="btn dark" data-add="adv">Add</button></div>`
    :'<button type="button" class="addbtn" data-adding="adv">+ Add phrase</button>';
  h+='</div>';
  const seg=(attr,cur,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button type="button" ${attr}="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
  h+=`<div class="sect">Appearance</div>${seg('data-theme-set',theme,[['system','System'],['light','Light'],['dark','Dark']])}`;
  h+=`<div class="sect">Positive findings</div>${seg('data-pos-set',pos,[['filled','Filled'],['tinted','Tinted']])}`;
  h+=`<div class="sect">Drafts</div><div class="group"><button type="button" class="opt" id="wipe"><span class="ot">Delete all drafts</span><span class="otag">${drafts.length} on this device</span></button></div>`;
  h+='<p class="footnote">Patient data and drafts are stored only on this device. The app works offline once loaded.</p>';
  $('#setBody').innerHTML=h;
  if(adding){const f=$(adding==='cons'?'#addName':'#addAdv');f&&f.focus()}
}

/* ---------- Fill: rendering ---------- */
const rid=k=>'r-'+k.replace(/\./g,'_');
const reqMark=b=>b?'<b>Required</b>':'';
function chip(on,pos,attrs,label){return `<button type="button" class="chip${on?' on':''}${on&&pos?' pos':''}" aria-pressed="${!!on}" ${attrs}>${esc(label)}</button>`}
function detHTML(key,v,dd){
  const Dd=v.d||{},val=Dd[dd.id],n=E.dCount(dd,Dd),arr=Array.isArray(val)?val:[];
  const miss=dd.req&&dd.t==='m'&&!Array.from({length:n}).every((_,i)=>arr[i]);
  let h=`<div class="det${dd.full?' full':''}" data-detbox="${dd.id}"><div class="dl"><span>${esc(dd.l)}</span>${reqMark(miss)}</div><div class="dc">`;
  if(dd.t==='c')h+=dd.o.map((x,i)=>chip(dd.multi?arr.includes(i):val===i,false,`data-det="${key}" data-id="${dd.id}" data-i="${i}"${dd.multi?' data-multi="1"':''}`,x)).join('');
  else h+=Array.from({length:n},(_,i)=>`${i?'<span class="x">×</span>':''}<label class="meas${dd.req&&!arr[i]?' need':''}"><input id="${rid(key)}-${dd.id}-${i}" data-detm="${key}" data-id="${dd.id}" data-i="${i}" inputmode="decimal" placeholder="—" value="${esc(arr[i]||'')}" autocomplete="off" aria-label="${esc(dd.l)}${n>1?' '+(i+1):''}">${i===n-1?`<em>${esc(dd.u)}</em>`:''}</label>`).join('');
  return h+'</div></div>';
}
function rowHTML(o,s,r){
  const key=`${o.id}.${s}.${r.id}`,v=D.sel[key],opt=v&&r.o[v.o];
  let h=`<div class="row" id="${rid(key)}" data-row="${key}" data-ink="${key}"><div class="rl">${esc(r.l)}</div><div class="rc">`;
  h+=r.o.map((x,i)=>chip(v&&v.o===i,!x.n,`data-pick="${key}" data-i="${i}"`,x.l)).join('');
  if(opt&&opt.d)h+=`<div class="dets">${opt.d.filter(dd=>!dd.when||dd.when(v.d||{})).map(dd=>detHTML(key,v,dd)).join('')}</div>`;
  if(opt&&opt.sub)h+=`<div class="subc"><span>${esc(opt.subL||'')}</span>${opt.sub.map((x,i)=>chip(v.s===i,true,`data-sub="${key}" data-i="${i}"`,x)).join('')}</div>`;
  if(opt&&opt.u)h+=`<label class="meas${opt.req&&!v.m?' need':''}">${opt.ml?`<span>${esc(opt.ml)}</span>`:''}<input id="${rid(key)}-m" data-meas="${key}" inputmode="decimal" placeholder="—" value="${esc(v.m||'')}" autocomplete="off" aria-label="${esc(r.l)} ${esc(opt.ml||'')}"><em>${esc(opt.u)}</em></label>`;
  return h+'</div></div>';
}
function cardBody(o){
  return `<div class="chead"><span class="dot"></span><h3>${esc(o.name)}</h3><span class="cnt"></span><button type="button" class="btn" data-alln="${o.id}">All normal</button></div><div class="sides">`+
    SIDES(o).map(s=>{const rows=o.rows.filter(r=>E.vis(o,s,r,D.sel));if(!rows.length)return'';
      const lab=s==='-'?'':(s==='R'?'Right ':'Left ')+(o.paired==='side'?'':o.paired);
      return `<div class="sidebox${s==='-'?' full':' pair'}">${lab?`<div class="sl">${lab}</div>`:''}${rows.map(r=>rowHTML(o,s,r)).join('')}</div>`}).join('')+'</div>';
}
function renderCard(o){
  const c=$('#c-'+o.id);if(!c)return;
  const a=document.activeElement,fid=a&&a.id&&c.contains(a)?a.id:null,sel=fid&&a.selectionStart!=null?[a.selectionStart,a.selectionEnd]:null;
  Ink.inkRelease(c);c.innerHTML=cardBody(o);Ink.mountInk(c);
  if(fid){const n=document.getElementById(fid);if(n){n.focus({preventScroll:true});if(sel)try{n.setSelectionRange(...sel)}catch(e){}}}
}
const PF=[['date','Date',1,'date'],['cr','CR No',1],['usg','USG No',1],['bill','Bill No',1],['ref','Referred by',2],['clin','Clinical details',2,'ta']];
function patientHTML(){
  const p=D.pt,inp=(k,t)=>t==='ta'?`<textarea id="p-${k}" data-pt="${k}" rows="1">${esc(p[k])}</textarea>`:`<input id="p-${k}" data-pt="${k}" value="${esc(p[k])}"${t==='date'?' type="date"':''} autocomplete="off"${k==='cr'||k==='age'?' inputmode="numeric"':''}${k==='name'?' autocapitalize="words" placeholder="Required"':''}>`;
  return `<section class="card pcard" id="c-pt" data-ink="pt"><div class="chead"><h3>Patient</h3></div><div class="pgrid">
    <label class="pf s2${p.name.trim()?'':' need'}" id="pfName"><span>Name <i>*</i></span>${inp('name')}</label>
    <label class="pf"><span>Age</span>${inp('age')}</label>
    <div class="pf"><span>Sex</span><div class="seg" role="group" aria-label="Sex"><button type="button" data-sex="M" aria-pressed="${D.sex==='M'}">M</button><button type="button" data-sex="F" aria-pressed="${D.sex==='F'}">F</button></div></div>
    ${PF.map(([k,l,sp,t])=>`<label class="pf${sp===2?' s2':''}"><span>${l}</span>${inp(k,t)}</label>`).join('')}
  </div></section>`;
}
function signHTML(){
  const ai=D.adv==null?set.advSel:D.adv,ci=D.con==null?set.consSel:D.con;
  let h=`<section class="card" id="c-sum" data-ink="sum"><div class="chead"><h3>Sign-off</h3></div><div class="sgrid">`;
  h+=`<div><div class="rl">Other findings</div><textarea id="t-other" data-other rows="1" placeholder="Anything the rows above don't cover. Appears at the end of Findings.">${esc(D.other||'')}</textarea></div>`;
  if(set.adv.length)h+=`<div><div class="rl">Advice</div><div class="rc" style="margin-top:8px">${set.adv.map((a,i)=>chip(i===ai,false,`data-adv="${i}"`,a)).join('')}</div></div>`;
  if(set.cons.length)h+=`<div><div class="rl">Consultant</div><div class="rc" style="margin-top:8px">${set.cons.map((c,i)=>chip(i===ci,false,`data-con="${i}"`,c.name)).join('')}</div></div>`;
  if(Ink.anyInk())h+=`<div><div class="rl">Handwritten notes</div><div class="rc" style="margin-top:8px">${chip(D.inkWord!==false,false,'data-inkword',"Include in report and Word file")}</div></div>`;
  return h+'</div></section>';
}
function renderForm(){
  Ink.inkRelease($('#form'));Ink.resetInk();
  $('#form').innerHTML=patientHTML()+E.orgs(D).map(o=>`<section class="card" id="c-${o.id}" data-organ="${o.id}">${cardBody(o)}</section>`).join('')+signHTML();
  $$('#form textarea').forEach(grow);
  Ink.mountInk($('#form'));observe();
}
function renderSign(){const c=$('#c-sum');if(!c)return;Ink.inkRelease(c);c.outerHTML=signHTML();const n=$('#c-sum');$$('textarea',n).forEach(grow);Ink.mountInk(n)}
function grow(el){el.style.height='auto';el.style.height=Math.max(44,el.scrollHeight+2)+'px'}

function openFill(d){
  D=d;impEdit=false;
  show('fill');renderForm();after();
  const f=$('#form');if(f)f.scrollTop=0;
}
let cur=null;
function navHTML(c,strip){
  return E.orgs(D).map(o=>{const p=c.per[o.id],dot=`<span class="dot${p.pos?' pos':p.d===p.t?' done':''}"></span>`;
    return strip?`<button type="button" data-goorg="${o.id}"${cur===o.id?' class="cur"':''}>${dot}${esc(o.name)}</button>`
      :`<button type="button" data-goorg="${o.id}"${cur===o.id?' class="cur"':''}>${dot}<span class="on">${esc(o.name)}</span><span class="oc">${p.d}/${p.t}</span></button>`}).join('');
}
function updateStatus(){
  const c=E.counts(D),left=c.total-c.done,p=D.pt;
  const sub=`${p.name.trim()||'Unnamed'}${p.age?' · '+p.age:''} ${D.sex}`;
  $('#hTitle').textContent=$('#sTitle').textContent=E.studyName(D);
  $('#hSub').textContent=sub+(isWide()&&p.usg?' · '+p.usg:'');$('#sSub').textContent=sub;
  [['#hRing','#hPct'],['#sRing','#sPct']].forEach(([r,t])=>{$(r).style.setProperty('--p',c.pct);$(t).textContent=c.pct+'%'});
  $('#hProgT').innerHTML=`<b>${c.pct}%</b> · ${left} left`;
  $('#sProgT').innerHTML=`<b>${c.done} of ${c.total}</b> rows marked<br>${c.pos} positive finding${c.pos===1?'':'s'}`;
  $('#dNext').textContent=$('#sNext').textContent=`Next · ${left}`;
  $('#onav').innerHTML=navHTML(c,false);$('#strip').innerHTML=navHTML(c,true);
  E.orgs(D).forEach(o=>{const el=$('#c-'+o.id);if(!el)return;const q=c.per[o.id];
    $('.chead .dot',el).className='dot'+(q.pos?' pos':q.d===q.t?' done':'');$('.chead .cnt',el).textContent=`${q.d}/${q.t}`});
  const pn=$('#pfName');if(pn)pn.classList.toggle('need',!p.name.trim());
  return c;
}

/* ---------- Report ---------- */
let impEdit=false,pvT=0;
function reportHTML(){
  const R=E.report(D,set),p=D.pt,con=E.conOf(D,set);
  const m=(k,v,s2)=>`<div${s2?' class="s2"':''}><span>${k}:</span> ${esc(v||'')}</div>`;
  let h=`<div class="lh"><div class="i">${esc(set.inst)}</div>${set.dept?`<div class="d">${esc(set.dept)}</div>`:''}${set.addr?`<div class="a">${esc(set.addr)}</div>`:''}</div>`;
  h+=`<div class="rt">${esc(E.titleOf(D))}</div>`;
  h+=`<div class="meta">${m('Name',p.name,1)}${m('Age/Sex',`${p.age?p.age+' / ':''}${D.sex}`)}${m('Date',E.fmtDate(p.date))}${m('CR No',p.cr)}${m('USG No',p.usg)}${m('Bill No',p.bill)}${m('Referred by',p.ref)}${m('Clinical',p.clin,1)}</div>`;
  h+=Ink.notesHTML('pt');
  h+='<div class="rh"><span class="k">FINDINGS</span></div>';
  h+=R.paras.map(x=>`<p>${esc(x.t)}</p>`+Ink.notesHTML(x.g)).join('');
  const seen=new Set(R.paras.map(x=>x.g));h+=E.orgs(D).filter(o=>!seen.has(o.id)).map(o=>Ink.notesHTML(o.id)).join('');
  if(R.pending)h+=`<p class="pend">${esc(R.pending)}</p>`;
  h+=`<div class="rh"><span class="k">IMPRESSION</span><small>${R.impNote}</small><button type="button" data-act="imp">${impEdit?'Done':R.edited?'Reset':'Edit'}</button></div>`;
  h+=impEdit?`<textarea data-impta rows="5" aria-label="Impression, one point per line">${esc(D.impOv!=null?D.impOv:R.auto.join('\n'))}</textarea>`:`<ul>${R.imp.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`;
  if(R.advice)h+=`<p class="adv">${esc(R.advice)}</p>`;
  h+=Ink.notesHTML('sum');
  h+=`<div class="sig"><div><b>${esc(set.resident||' ')}</b>Resident</div><div><b>${esc(con?con.name:' ')}</b>${esc(con&&con.title?con.title+' · ':'')}Consultant Radiologist</div></div>`;
  return h;
}
function renderReports(force){
  if(!D)return;
  const h=reportHTML(),a=document.activeElement;
  [['#rep1',isWide()],['#rep2',!$('#sheet').hidden]].forEach(([id,on])=>{
    const el=$(id);if(!on)return;
    if(!force&&a&&a.matches('[data-impta]')&&el.contains(a))return;
    el.innerHTML=h;
  });
}
function after(){
  updateStatus();touch();
  cancelAnimationFrame(pvT);pvT=requestAnimationFrame(()=>renderReports());
}
function openSheet(){
  $('#rep2').innerHTML=reportHTML();$('#sheet').hidden=false;$('#scrim').hidden=!mq('(min-width:700px)');
  document.documentElement.classList.add('sheet-open');document.documentElement.style.overflow='hidden';$('.sheetbody').scrollTop=0;
}
function closeSheet(){
  if($('#sheet').hidden)return;$('#sheet').hidden=true;$('#scrim').hidden=true;
  document.documentElement.classList.remove('sheet-open');document.documentElement.style.overflow='';
  if(impEdit){impEdit=false;renderReports(true)}
}
function toggleImp(){
  if(impEdit)impEdit=false;
  else if(D.impOv!=null)D.impOv=null;
  else{impEdit=true;D.impOv=E.report(D,set).auto.join('\n')}
  after();renderReports(true);
  if(impEdit)requestAnimationFrame(()=>{const t=$$('[data-impta]').find(x=>x.offsetParent);t&&t.focus()});
}

/* ---------- Actions ---------- */
let undoSnap=null;
const snap=()=>{undoSnap=JSON.stringify(D.sel)};
function pick(key,i){
  const o=E.orgById(key.split('.')[0]),before=D.sel[key];
  E.pick(D,key,i);renderCard(o);after();
  const v=D.sel[key];if(!v||(before&&before.o===i))return;
  // Jump straight to a required value (numeric keypad on touch).
  const x=E.rowBy(key).o[i],inp=x.req&&!v.m&&document.getElementById(rid(key)+'-m');
  if(inp)inp.focus({preventScroll:true});
}
function restNormal(){
  snap();const n=E.rest(D);
  if(!n){undoSnap=null;return toast('Every row is already marked')}
  E.orgs(D).forEach(renderCard);after();toast(`${n} row${n===1?'':'s'} marked normal`,true);
}
function organNormal(oid){const o=E.orgById(oid);snap();E.organNormal(D,o);renderCard(o);after();toast(`${o.name} marked normal`,true)}
function undo(){if(undoSnap==null)return;D.sel=JSON.parse(undoSnap);undoSnap=null;E.orgs(D).forEach(renderCard);after();$('#toast').hidden=true}
function scrollToEl(el,block='start'){el.scrollIntoView({behavior:reduce()?'auto':'smooth',block})}
let ftT=0;
function nextTodo(){
  const t=E.nextTodo(D);closeSheet();
  if(t==='name'){const f=$('#form');if(f.scrollTop)f.scrollTo({top:0,behavior:'smooth'});scrollTo({top:0,behavior:'smooth'});$('#p-name').focus({preventScroll:true});return toast('Patient name is required')}
  if(!t)return toast('All rows marked. Report is ready.');
  const el=document.getElementById(rid(t));if(!el)return;
  scrollToEl(el,'center');
  $$('.row.focus').forEach(r=>r.classList.remove('focus'));el.classList.add('focus');
  clearTimeout(ftT);ftT=setTimeout(()=>el.classList.remove('focus'),1800);
  const need=el.querySelector('.meas.need input');if(need)setTimeout(()=>need.focus({preventScroll:true}),reduce()?0:350);
}
let toastT=0;
function toast(msg,canUndo){
  $('#toastMsg').textContent=msg;$('#toastAct').hidden=!canUndo;$('#toast').hidden=false;
  clearTimeout(toastT);toastT=setTimeout(()=>{$('#toast').hidden=true;if(canUndo)undoSnap=null},canUndo?6000:3000);
}
$('#toastAct').onclick=()=>{if(D&&undoSnap!=null)return undo();if(delSnap){drafts=delSnap;delSnap=null;saveDrafts();renderHome();$('#toast').hidden=true}};

function copyReport(){
  const b=E.blocker(D);if(b)return toast(b);
  const t=E.plain(D,set);
  const fallback=()=>{
    const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,t.length);
    let ok=false;try{ok=document.execCommand('copy')}catch(e){}
    ta.remove();toast(ok?'Report text copied':'Copy was blocked. Select the report text and copy it manually.');
  };
  try{navigator.clipboard.writeText(t).then(()=>toast('Report text copied'),fallback)}catch(e){fallback()}
}
const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let saving=false;
async function saveWord(){
  const b=E.blocker(D);if(b)return toast(b);
  if(saving)return;saving=true;
  try{
    const name=E.docName(D),file=new File([buildDocx(D,set,Ink.wordNotes)],name,{type:DOCX_MIME});
    if(isIOS()&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file]});toast('Saved '+name)}
      catch(e){if(e&&e.name==='AbortError')return;download(file)}
      return;
    }
    download(file);
  }catch(e){console.error(e);toast('The Word file could not be made. Use Copy text instead.')}
  finally{saving=false}
}
function download(file){
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);toast(`Saved ${file.name} with letterhead`);
}
function print(){$('#repPrint').innerHTML=`<div class="paper">${reportHTML()}</div>`;window.print()}

/* ---------- Events ---------- */
let delSnap=null,wipeArm=0;
document.addEventListener('click',e=>{
  const t=e.target.closest('button,[role="button"],a');if(!t)return;
  const ds=t.dataset;
  if(ds.go)return go(ds.go);
  // Home
  if(ds.new)return newDraft(ds.new,ds.var);
  if(ds.del){e.stopPropagation();delSnap=drafts.slice();drafts=drafts.filter(d=>d.id!==ds.del);saveDrafts();if(!drafts.length)editDrafts=false;renderHome();return toast('Draft deleted',true)}
  if(ds.open)return go('r/'+ds.open);
  if(t.id==='draftsEdit'){editDrafts=!editDrafts;return renderHome()}
  // Settings
  if(ds.setedit){setEdit[ds.setedit]=!setEdit[ds.setedit];adding=null;return renderSettings()}
  if(ds.rmcons!=null){e.stopPropagation();const i=+ds.rmcons;set.cons.splice(i,1);if(set.consSel>=set.cons.length||set.consSel===i)set.consSel=0;else if(set.consSel>i)set.consSel--;if(!set.cons.length)setEdit.cons=false;saveSet();return renderSettings()}
  if(ds.rmadv!=null){e.stopPropagation();const i=+ds.rmadv;set.adv.splice(i,1);if(set.advSel>=set.adv.length||set.advSel===i)set.advSel=0;else if(set.advSel>i)set.advSel--;if(!set.adv.length)setEdit.adv=false;saveSet();return renderSettings()}
  if(ds.cons!=null&&!setEdit.cons){set.consSel=+ds.cons;saveSet();return renderSettings()}
  if(ds.advd!=null&&!setEdit.adv){set.advSel=+ds.advd;saveSet();return renderSettings()}
  if(ds.adding){adding=ds.adding;return renderSettings()}
  if(ds.add==='cons'){const n=$('#addName').value.trim();if(n){set.cons.push({name:n,title:$('#addTitle').value.trim()});saveSet()}adding=null;return renderSettings()}
  if(ds.add==='adv'){const n=$('#addAdv').value.trim();if(n){set.adv.push(/[.!?]$/.test(n)?n:n+'.');saveSet()}adding=null;return renderSettings()}
  if(ds.themeSet){store(K.theme,ds.themeSet);applyTheme();return renderSettings()}
  if(ds.posSet){store(K.pos,ds.posSet);applyPos();return renderSettings()}
  if(t.id==='wipe'){
    if(!drafts.length)return;
    if(!wipeArm){wipeArm=setTimeout(()=>{wipeArm=0;const w=$('#wipe .ot');if(w)w.textContent='Delete all drafts'},3000);$('#wipe .ot').textContent='Tap again to delete all drafts';return}
    clearTimeout(wipeArm);wipeArm=0;delSnap=drafts.slice();drafts=[];saveDrafts();renderSettings();return toast('All drafts deleted',true);
  }
  if(!D)return;
  // Fill
  if(ds.pick)return pick(ds.pick,+ds.i);
  if(ds.sub){E.sub(D,ds.sub,+ds.i);renderCard(E.orgById(ds.sub.split('.')[0]));return after()}
  if(ds.det){E.det(D,ds.det,ds.id,+ds.i,!!ds.multi);renderCard(E.orgById(ds.det.split('.')[0]));return after()}
  if(ds.alln)return organNormal(ds.alln);
  if(ds.sex){if(D.sex===ds.sex)return;D.sex=ds.sex;renderForm();return after()}
  if(ds.adv!=null){const i=+ds.adv,cur=D.adv==null?set.advSel:D.adv;D.adv=cur===i?-1:i;renderSign();return after()}
  if(ds.con!=null){D.con=+ds.con;renderSign();return after()}
  if(ds.inkword!=null){D.inkWord=D.inkWord===false;renderSign();return after()}
  if(ds.goorg){const el=$('#c-'+ds.goorg);if(el){scrollToEl(el);cur=ds.goorg;markCur()}return}
  if(t.classList.contains('inkBtn'))return Ink.setInk(!Ink.inkOn());
  switch(ds.act){
    case 'next':return nextTodo();
    case 'rest':return restNormal();
    case 'report':return openSheet();
    case 'close':return closeSheet();
    case 'copy':return copyReport();
    case 'word':return saveWord();
    case 'print':return print();
    case 'imp':return toggleImp();
  }
});
$('#scrim').addEventListener('click',closeSheet);
document.addEventListener('input',e=>{
  const el=e.target,ds=el.dataset;
  if(ds.set){set[ds.set]=el.value;return saveSet()}
  if(!D)return;
  if(ds.pt){D.pt[ds.pt]=el.value;if(el.tagName==='TEXTAREA')grow(el);return after()}
  if(ds.other!=null){D.other=el.value;grow(el);return after()}
  if(ds.impta!=null){D.impOv=el.value;return after()}
  if(ds.meas){
    const key=ds.meas,ch=E.meas(D,key,el.value);if(el.value!==D.sel[key].m)el.value=D.sel[key].m;
    if(ch)renderCard(E.orgById(key.split('.')[0]));
    else{const x=E.rowBy(key).o[D.sel[key].o];el.closest('.meas').classList.toggle('need',!!x.req&&!D.sel[key].m)}
    return after();
  }
  if(ds.detm){
    const key=ds.detm,v=D.sel[key],x=E.rowBy(key).o[v.o],dd=x.d.find(q=>q.id===ds.id),n0=E.dCount(dd,v.d);
    E.detM(D,key,ds.id,+ds.i,el.value);const nv=D.sel[key];if(el.value!==nv.d[ds.id][+ds.i])el.value=nv.d[ds.id][+ds.i];
    if(E.dCount(dd,nv.d)!==n0)renderCard(E.orgById(key.split('.')[0]));
    else{
      const arr=nv.d[ds.id]||[],n=E.dCount(dd,nv.d),box=el.closest('.det');
      el.closest('.meas').classList.toggle('need',!!dd.req&&!arr[+ds.i]);
      $('.dl',box).innerHTML=`<span>${esc(dd.l)}</span>${reqMark(dd.req&&!Array.from({length:n}).every((_,i)=>arr[i]))}`;
    }
    return after();
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(Ink.inkOn())Ink.setInk(false);else closeSheet()}
  if(Ink.inkOn()&&(e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();Ink.undoInkStep()}
  if(e.key==='Enter'&&e.target.matches('.addrow input')){e.preventDefault();e.target.closest('.addrow').querySelector('[data-add]').click()}
});

/* Current organ while scrolling */
let io;
function markCur(){
  $$('[data-goorg]').forEach(a=>a.classList.toggle('cur',a.dataset.goorg===cur));
  const a=$(`#strip [data-goorg="${cur}"]`);if(a){const s=$('#strip');s.scrollTo({left:a.offsetLeft-s.clientWidth/2+a.offsetWidth/2,behavior:reduce()?'auto':'smooth'})}
}
function observe(){
  if(!('IntersectionObserver' in window))return;
  io&&io.disconnect();
  io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting&&en.target.dataset.organ){cur=en.target.dataset.organ;markCur()}}),{rootMargin:'-35% 0px -60% 0px'});
  $$('#form [data-organ]').forEach(s=>io.observe(s));
}
let rzT=0;
addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(D){updateStatus();renderReports(true)}},120)});

/* Theme and chip style */
function applyTheme(){
  const t=load(K.theme,'system')||'system',r=document.documentElement;
  if(t==='system')r.removeAttribute('data-theme');else r.setAttribute('data-theme',t);
  requestAnimationFrame(Ink.repaintAll);
}
function applyPos(){document.documentElement.classList.toggle('tinted',localStorage.getItem(K.pos)==='tinted')}

/* Handwriting */
function inkLabel(k){
  if(k==='pt')return'Patient';if(k==='sum')return'Sign-off';
  const[oid,s,r]=k.split('.'),o=E.orgById(oid);if(!o)return k;const row=o.rows.find(x=>x.id===r);
  const side=s==='-'?'':(s==='R'?'Right ':'Left ')+(o.paired==='side'?'':o.paired);
  return `${side?side.trim()+' › ':o.name+' › '}${row?row.l:''}`;
}
const ORDER=['pt',...ORG.flatMap(o=>SIDES(o).flatMap(s=>o.rows.map(r=>`${o.id}.${s}.${r.id}`))),'sum'];
Ink.initInk({getD:()=>D,changed:()=>{const had=!!$('#c-sum [data-inkword]');if(had!==Ink.anyInk())renderSign();after()},toast,label:inkLabel,order:k=>ORDER.indexOf(k),onMode:()=>{}});

/* Boot */
let top_=false;try{top_=window.self===window.top}catch(e){}
if(top_)$$('.printBtn').forEach(b=>b.hidden=false);
applyTheme();applyPos();
addEventListener('hashchange',route);
addEventListener('pagehide',()=>{if(D)saveDrafts()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&D)saveDrafts()});
route();

/* Offline + install: cache the app on this device */
if('serviceWorker' in navigator&&location.protocol!=='file:'){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
