/* UI: rendering, input, handwriting, autosave, copy/print/Word. Report wording lives in engine.js. */
import {SECS,DOCS,ADV} from './schema.js';
import {esc} from './util.js';
import * as E from './engine.js';
import {buildDocx,docName as docNameOf} from './docx.js';

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const {SEXW,sidesOf,key,IDX,opt,isAbn,fmtDate,blank}=E;

/* ---------- State (drafts autosave on this device) ---------- */
const KEY='usg-abd-male-v1', TKEY='usg-abd-theme';
let S=(()=>{try{const j=localStorage.getItem(KEY);if(j){const o=JSON.parse(j);if(o&&o.r)return Object.assign(blank(),o)}}catch(e){}return blank()})();
const sex=()=>E.sex(S), act=()=>E.act(S), titleTxt=()=>E.titleTxt(S);
const st=k=>E.st(S,k), peek=k=>E.peek(S,k);
const naSet=(sec,sd)=>E.naSet(S,sec,sd), marked=(sec,row,sd)=>E.marked(S,sec,row,sd);
const counts=()=>E.counts(S), impression=()=>E.impression(S), report=()=>E.report(S), reportText=()=>E.reportText(S);

function reportHTML(){
  const R=report(),p=R.p,left=R.c.tot-R.c.done;
  const row=(k,v)=>v?`<dt>${k}</dt><dd>${esc(v)}</dd>`:'';
  let h='<div class="doc">';
  if(left>0) h+=`<div class="warn-l">${left} row${left>1?'s':''} still unmarked</div>`;
  h+='<div class="inst"><b>All India Institute of Medical Sciences, Guwahati</b>Department of Diagnostic &amp; Interventional Radiology</div>';
  h+=`<div class="ttl">${titleTxt()}</div>`;
  const pt=row('Name',p.name)+row('Age/Sex',p.age?p.age+'/'+sex():'')+row('CR No',p.cr)+row('USG No',p.usg)+row('Bill No',p.bill)+row('Date',fmtDate(p.date))+row('Referred by',p.ref)+row('Clinical',(p.clin||'').trim());
  if(pt) h+=`<dl class="pt">${pt}</dl>`;
  h+=notesHTML('pt');
  h+='<h3>Findings</h3>';
  const fb=act().map(sec=>R.paras.filter(x=>x.g===sec.id).map(x=>`<p>${esc(x.t)}</p>`).join('')+notesHTML(sec.id)).join('');
  h+=fb||'<p class="ph">Findings appear here as you mark rows.</p>';
  if(R.add) h+=`<h3>Additional findings</h3><p>${esc(R.add)}</p>`;
  h+=`<h3>Impression${R.impAuto&&R.imp.length?'<span class="auto">suggested</span>':''}</h3>`;
  h+=R.imp.length?'<ul>'+R.imp.map(t=>`<li>${esc(t)}</li>`).join('')+'</ul>':'<p class="ph">Built from your positive findings.</p>';
  if(R.adv) h+=`<h3>Advice</h3><p>${esc(R.adv)}</p>`;
  h+=notesHTML('sum');
  if(R.con||R.res) h+=`<div class="sig">${R.con?`<b>${esc(R.con[0])}</b><br>${esc(R.con[1])}`:''}${R.res?`${R.con?'<br><br>':''}Resident: ${esc(R.res)}`:''}</div>`;
  return h+'</div>';
}

/* ---------- Rendering ---------- */
function fldHTML(k,f,v){
  const need=f.req&&!String(v).trim()?' need':'';
  if(f.ch) return `<div class="fld sub${need}"><span>${f.l}</span>${f.ch.map(c=>`<button type="button" class="mini" data-key="${k}" data-k="${f.k}" data-val="${c}" aria-pressed="${v===c}">${c}</button>`).join('')}</div>`;
  const id=`f-${k.replace(/\./g,'-')}-${f.k}`;
  return `<label class="fld${f.num?'':' txt'}${f.wide?' wide':''}${need}" for="${id}" data-req="${f.req?1:''}"><span>${f.l}</span><input id="${id}" data-key="${k}" data-k="${f.k}" autocomplete="off"${f.num?' inputmode="decimal"':''} placeholder="${esc(f.ph||'')}" value="${esc(v)}">${f.u?`<em>${f.u}</em>`:''}</label>`;
}
function sideHTML(sec,row,sd){
  const k=key(sec.id,row.id,sd),x=peek(k);
  let h='<div class="sidebox">'+(sd?`<div class="sidetag">${sd==='R'?'Right':'Left'}</div>`:'');
  if(naSet(sec,sd).has(row.id)) return h+'<div class="namsg">Not applicable</div></div>';
  h+='<div class="chips">'+row.o.map(o=>`<button type="button" class="chip" data-key="${k}" data-v="${esc(o.v)}"${o.n?' data-n':''} aria-pressed="${x.s.includes(o.v)}">${esc(o.v)}</button>`).join('')+'</div>';
  const fl=[],seen=new Set();
  x.s.forEach(v=>(opt(row,v)?.f||[]).forEach(f=>{if(!seen.has(f.k)){seen.add(f.k);fl.push(f)}}));
  if(fl.length) h+='<div class="flds">'+fl.map(f=>fldHTML(k,f,x.f[f.k]??'')).join('')+'</div>';
  return h+'</div>';
}
function rowCls(sec,row){
  const sds=sidesOf(sec);let todo=false,abn=false,na=0;
  sds.forEach(sd=>{if(naSet(sec,sd).has(row.id)){na++;return}if(!marked(sec,row,sd))todo=true;if(isAbn(row,peek(key(sec.id,row.id,sd))))abn=true});
  return 'row'+(na===sds.length?' na':'')+(todo?' todo':'')+(abn?' abn':'');
}
const rowHTML=(sec,row)=>`<div class="${rowCls(sec,row)}" id="row-${sec.id}-${row.id}" data-ink="${sec.id}.${row.id}"><div class="rl">${row.l}</div><div class="rc${sec.sides?' sides':''}">${sidesOf(sec).map(sd=>sideHTML(sec,row,sd)).join('')}</div></div>`;
const secBody=sec=>sec.rows.map(r=>rowHTML(sec,r)).join('');
function renderSec(sec){const c=$('#sb-'+sec.id);inkRelease(c);c.innerHTML=secBody(sec);mountInk(c)}
function renderAll(){
  inkRelease($('#secs'));
  for(const k in imgCache) delete imgCache[k];
  undoInk.length=0;updUndo();
  $('#inkWordBtn').setAttribute('aria-pressed',String(S.inkWord!==false));
  $('#secs').innerHTML=SECS.map(sec=>`<section class="sec" id="s-${sec.id}" data-sec="${sec.id}"><div class="sec-h"><h2>${sec.t}</h2><span class="badge" id="b-${sec.id}"></span><button type="button" class="btn" data-alln="${sec.id}">All normal</button></div><div id="sb-${sec.id}">${secBody(sec)}</div></section>`).join('');
  $$('[data-p]').forEach(el=>el.value=S.p[el.dataset.p]||'');
  $$('[data-t]').forEach(el=>el.value=S[el.dataset.t]||'');
  renderCon();
  $$('textarea').forEach(grow);
  observe();
  mountInk(document);
}
function renderCon(){
  $('#conChips').innerHTML=DOCS.map(d=>`<button type="button" class="chip" data-n data-con="${esc(d[0])}" aria-pressed="${S.con===d[0]}">${esc(d[0])}</button>`).join('');
}
const NAV=[{id:'pt',t:'Patient'},...SECS.map(s=>({id:s.id,t:s.short||s.t})),{id:'sum',t:'Impression'}];
function navHTML(c){
  return NAV.filter(n=>{const s=SECS.find(x=>x.id===n.id);return !s||act().includes(s)}).map(n=>{
    const p=c.per[n.id];let tag='';
    if(p){tag=(p.a?'<span class="dot" title="Has positive findings"></span>':'')+`<span class="cnt${p.d===p.t?' ok':''}">${p.d===p.t?'✓':p.d+'/'+p.t}</span>`}
    return `<a href="#s-${n.id}" data-go="${n.id}"${cur===n.id?' class="cur"':''}>${n.t}${tag}</a>`;
  }).join('');
}
let cur='pt';
function updateStatus(){
  const c=counts();
  SECS.forEach(s=>{const el=$('#s-'+s.id);if(el)el.hidden=!act().includes(s)});
  $('#sexT').textContent='· '+SEXW[sex()];
  $$('[data-sex]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sex===sex())));
  act().forEach(sec=>{
    const p=c.per[sec.id],b=$('#b-'+sec.id);
    b.textContent=p.d===p.t?'✓ Complete':`${p.d}/${p.t}`;b.classList.toggle('ok',p.d===p.t);
    const btn=$(`[data-alln="${sec.id}"]`);
    let hasEmpty=false;
    sidesOf(sec).forEach(sd=>{const na=naSet(sec,sd);sec.rows.forEach(r=>{if(!na.has(r.id)&&!peek(key(sec.id,r.id,sd)).s.length)hasEmpty=true})});
    btn.hidden=!hasEmpty;btn.textContent=p.d===0?'All normal':'Rest normal';
    sec.rows.forEach(r=>{const el=$(`#row-${sec.id}-${r.id}`);if(el)el.className=rowCls(sec,r)});
  });
  $('#progTxt').textContent=`${c.done}/${c.tot}`;
  $('#ring').setAttribute('stroke-dashoffset',String(56.55*(1-(c.tot?c.done/c.tot:0))));
  $('#sideNav').innerHTML=navHTML(c);$('#strip').innerHTML=navHTML(c);
  const left=c.tot-c.done;
  [$('#dockNext'),$('#sideNext')].forEach(b=>{b.textContent=left?`${left} to mark ›`:'All marked ✓';b.disabled=!left});
  const anyEmpty=act().some(sec=>!$(`[data-alln="${sec.id}"]`).hidden);
  $('#dockRest').disabled=$('#sideRest').disabled=!anyEmpty;
  return c;
}
function renderDraft(){
  const a=impression(),c=counts();
  const list=a.length?a:(c.done?['No significant abnormality detected on ultrasound of the whole abdomen.']:[]);
  $('#draft').innerHTML=`<div class="draft-h">Suggested from your marks${list.length?'<button type="button" class="btn" id="useDraft">Edit this</button>':''}</div>`+
    (list.length?'<ul>'+list.map(t=>`<li>${esc(t)}</li>`).join('')+'</ul>':'<div class="ph" style="color:var(--muted)">Mark rows above and positive findings collect here.</div>');
}
let pvT=0,svT=0;
function after(){
  updateStatus();
  $('#inkWordWrap').hidden=!INK_ORDER.some(hasInk);
  cancelAnimationFrame(pvT);pvT=requestAnimationFrame(()=>{
    const h=reportHTML();
    if(getComputedStyle($('.pane')).display!=='none')$('#rep1').innerHTML=h;
    if(!$('#sheet').hidden)$('#rep2').innerHTML=h;
    renderDraft();
  });
  clearTimeout(svT);svT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},250);
}
function grow(el){el.style.height='auto';el.style.height=Math.max(42,el.scrollHeight+2)+'px'}

/* ---------- Actions ---------- */
function pick(k,v){
  const {sec}=IDX[k];
  const focusK=E.pick(S,k,v);
  renderSec(sec);after();
  if(focusK){const inp=$(`#f-${k.replace(/\./g,'-')}-${focusK}`);inp&&inp.focus({preventScroll:true})}
}
let undoSnap=null;
function restNormal(list){
  undoSnap=JSON.stringify(S);
  const n=E.restNormal(S,list);
  list.forEach(sec=>renderSec(sec));
  const c=updateStatus();after();
  const left=c.tot-c.done;
  toast(`Marked ${n} row${n===1?'':'s'} normal${left?` · ${left} need values`:''}`,true);
}
function nextTodo(){
  for(const sec of act())for(const row of sec.rows)for(const sd of sidesOf(sec)){
    if(naSet(sec,sd).has(row.id)||marked(sec,row,sd))continue;
    const el=$(`#row-${sec.id}-${row.id}`);if(!el)continue;
    closeSheet();
    el.scrollIntoView({behavior:reduce()?'auto':'smooth',block:'center'});
    el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
    const need=el.querySelector('.fld.need input');if(need)setTimeout(()=>need.focus({preventScroll:true}),350);
    return;
  }
}
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastT=0;
function toast(msg,undo){
  $('#toastMsg').textContent=msg;$('#toastAct').hidden=!undo;$('#toast').hidden=false;
  clearTimeout(toastT);toastT=setTimeout(()=>$('#toast').hidden=true,undo?6000:2200);
}
$('#toastAct').onclick=()=>{if(!undoSnap)return;S=Object.assign(blank(),JSON.parse(undoSnap));undoSnap=null;renderAll();after();$('#toast').hidden=true};

function copyReport(){
  const t=reportText();
  const fallback=()=>{
    const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,t.length);
    let ok=false;try{ok=document.execCommand('copy')}catch(e){}
    ta.remove();toast(ok?'Report copied':'Copy was blocked. Select the report text and copy it manually.');
  };
  try{navigator.clipboard.writeText(t).then(()=>toast('Report copied'),fallback)}catch(e){fallback()}
}
function openSheet(){$('#rep2').innerHTML=reportHTML();$('#sheet').hidden=false;document.documentElement.style.overflow='hidden'}
function closeSheet(){if($('#sheet').hidden)return;$('#sheet').hidden=true;document.documentElement.style.overflow=''}

/* ---------- Handwriting: ink on any row or field ---------- */
const INKC={ink:'--ink-ink',red:'--ink-red',blue:'--ink-blue',hl:'--ink-hl'};
const EXPORT_C={ink:'#141413',red:'#C2412D',blue:'#2457B0',hl:'#F2C230'};
const LABEL={},inkVer={},imgCache={},undoInk=[],touches=new Map(),ptKeys=[],sumKeys=[];
let inkMode=false,tool='ink',penSeen=false,drawing=null,pan=null,swallowUntil=0,inkRaf=0;
$$('#s-pt .in, #s-sum .in').forEach(el=>{
  if(el.id==='inkWordWrap')return;
  const f=el.querySelector('[id]');if(!f)return;
  const g=el.closest('#s-pt')?'pt':'sum',k=g+'.'+f.id;
  el.dataset.ink=k;LABEL[k]=(el.querySelector('label,.lbl')?.textContent||'').trim();
  (g==='pt'?ptKeys:sumKeys).push(k);
});
SECS.forEach(s=>s.rows.forEach(r=>LABEL[s.id+'.'+r.id]=`${s.t} › ${r.l}`));
const INK_ORDER=[...ptKeys,...SECS.flatMap(s=>s.rows.map(r=>s.id+'.'+r.id)),...sumKeys];
const hasInk=k=>!!(S.ink&&S.ink[k]&&S.ink[k].s.length);
const ro=('ResizeObserver' in window)?new ResizeObserver(es=>es.forEach(en=>{const el=en.target;if(!el._inkc)return;if(!drawing||drawing.el!==el)fitH(el);sizeC(el);paint(el)})):null;

function inkRelease(root){if(ro)$$('[data-ink]',root).forEach(el=>{if(el._inkc)ro.unobserve(el)})}
function ensureC(el){
  if(!el._inkc){const c=document.createElement('canvas');c.className='inkc';c.setAttribute('aria-hidden','true');el.appendChild(c);el._inkc=c;ro&&ro.observe(el)}
  sizeC(el);
}
function mountEl(el){
  if(hasInk(el.dataset.ink)||inkMode){fitH(el);ensureC(el);paint(el)}
  else if(el._inkc){ro&&ro.unobserve(el);el._inkc.remove();el._inkc=null;el.style.minHeight=''}
}
function mountInk(root){$$('[data-ink]',root||document).forEach(mountEl)}
function sizeC(el){
  const c=el._inkc,w=el.offsetWidth,h=el.offsetHeight,d=Math.min(window.devicePixelRatio||1,2.5),W=Math.round(w*d),H=Math.round(h*d);
  c._w=w;c._d=d;if(c.width!==W||c.height!==H){c.width=W;c.height=H}
}
function palette(){const cs=getComputedStyle(document.documentElement),o={};for(const k in INKC)o[k]=cs.getPropertyValue(INKC[k]).trim()||EXPORT_C[k];return o}
function drawS(ctx,s,col){
  const p=s.p;if(!p.length)return;
  ctx.save();ctx.strokeStyle=ctx.fillStyle=col;ctx.lineWidth=s.w;ctx.lineCap=ctx.lineJoin='round';
  if(s.c==='hl')ctx.globalAlpha=.4;
  if(p.length<=4){ctx.beginPath();ctx.arc(p[0],p[1],s.w/2,0,Math.PI*2);ctx.fill()}
  else{
    ctx.beginPath();ctx.moveTo(p[0],p[1]);
    for(let i=2;i<p.length-2;i+=2)ctx.quadraticCurveTo(p[i],p[i+1],(p[i]+p[i+2])/2,(p[i+1]+p[i+3])/2);
    ctx.lineTo(p[p.length-2],p[p.length-1]);ctx.stroke();
  }
  ctx.restore();
}
function paint(el,pal){
  const c=el._inkc;if(!c)return;
  const ctx=c.getContext('2d'),st=S.ink[el.dataset.ink];
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);
  if(!st||!st.s.length||!c._w)return;
  const s=c._d*c._w/st.W;ctx.setTransform(s,0,0,s,0,0);
  pal=pal||palette();st.s.forEach(x=>drawS(ctx,x,pal[x.c]||pal.ink));
}
function repaintAll(){const pal=palette();$$('[data-ink]').forEach(el=>el._inkc&&paint(el,pal))}
function fitH(el){
  const st=S.ink[el.dataset.ink];
  if(!st||!st.s.length||!el.offsetWidth){el.style.minHeight='';return}
  let my=0;st.s.forEach(s=>{for(let i=1;i<s.p.length;i+=2)my=Math.max(my,s.p[i]+s.w)});
  el.style.minHeight=Math.ceil(my*el.offsetWidth/st.W+12)+'px';
}
function ptr(el,e,st){
  const r=el.getBoundingClientRect(),k=st.W/r.width;
  return [Math.min(st.W,Math.max(0,(e.clientX-r.left)*k)),Math.max(0,(e.clientY-r.top)*k),r.width/st.W];
}
function schedPaint(){if(inkRaf)return;inkRaf=requestAnimationFrame(()=>{inkRaf=0;drawing&&paint(drawing.el)})}
function startInk(el,e){
  const k=el.dataset.ink;
  if(!S.ink[k])S.ink[k]={W:Math.max(1,Math.round(el.offsetWidth)),s:[]};
  const st=S.ink[k];
  undoInk.push({k,prev:JSON.stringify(st)});if(undoInk.length>80)undoInk.shift();
  try{el.setPointerCapture(e.pointerId)}catch(_){}
  ensureC(el);
  const sc=el.offsetWidth/st.W;
  drawing={el,k,st,pid:e.pointerId,type:e.pointerType,erase:tool==='erase',t0:performance.now(),cx:e.clientX,cy:e.clientY};
  if(drawing.erase)eraseAt(e);
  else{drawing.s={c:tool,w:+((tool==='hl'?16:e.pointerType==='pen'?2.2:2.6)/sc).toFixed(2),p:[]};st.s.push(drawing.s);addPts(e)}
  updUndo();
}
function addPts(e){
  const d=drawing,ce=e.getCoalescedEvents?e.getCoalescedEvents():[],list=ce.length?ce:[e];
  let sc=1,y=0;
  for(const ev of list){
    const [x,yy,s]=ptr(d.el,ev,d.st);sc=s;y=yy;
    const p=d.s.p,n=p.length;
    if(n&&Math.hypot(x-p[n-2],yy-p[n-1])<1/sc)continue;
    p.push(Math.round(x*10)/10,Math.round(yy*10)/10);
  }
  const yc=y*sc;
  if(yc>d.el.offsetHeight-24){d.el.style.minHeight=Math.ceil(yc+48)+'px';sizeC(d.el)}
  schedPaint();
}
function eraseAt(e){
  const d=drawing,[x,y,sc]=ptr(d.el,e,d.st),r=12/sc,n=d.st.s.length;
  d.st.s=d.st.s.filter(s=>{const rr=r+s.w/2;for(let i=0;i<s.p.length;i+=2)if(Math.hypot(s.p[i]-x,s.p[i+1]-y)<rr)return false;return true});
  if(d.st.s.length!==n)schedPaint();
}
function endInk(){
  const d=drawing;if(!d)return;drawing=null;
  if(d.s&&!inkMode&&d.type==='pen'&&performance.now()-d.t0<300){
    const sc=d.el.offsetWidth/d.st.W,p=d.s.p;let len=0;
    for(let i=2;i<p.length;i+=2)len+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);
    if(len*sc<6){
      d.st.s.pop();const u=undoInk.pop();if(u&&!d.st.s.length)delete S.ink[d.k];
      mountEl(d.el);updUndo();
      const tg=document.elementFromPoint(d.cx,d.cy),b=tg&&tg.closest('button,a,input,textarea');
      if(b){if(b.matches('input,textarea'))b.focus();else b.click()}
      swallowUntil=performance.now()+450;
      return;
    }
  }
  if(d.s&&!d.s.p.length)d.st.s.pop();
  const last=undoInk[undoInk.length-1];
  if(last&&last.k===d.k&&last.prev===JSON.stringify(d.st))undoInk.pop();
  if(!d.st.s.length)delete S.ink[d.k];
  inkVer[d.k]=(inkVer[d.k]||0)+1;
  if(d.type==='pen'&&!inkMode)swallowUntil=performance.now()+450;
  mountEl(d.el);updUndo();after();
}
function abortInk(){
  const d=drawing;if(!d)return;drawing=null;
  const u=undoInk.pop();if(u&&u.prev)S.ink[u.k]=JSON.parse(u.prev);
  if(S.ink[d.k]&&!S.ink[d.k].s.length)delete S.ink[d.k];
  mountEl(d.el);updUndo();
}
function undoInkStep(){
  const u=undoInk.pop();if(!u)return;
  const st=u.prev?JSON.parse(u.prev):null;
  if(st&&st.s.length)S.ink[u.k]=st;else delete S.ink[u.k];
  inkVer[u.k]=(inkVer[u.k]||0)+1;
  const el=$(`[data-ink="${u.k}"]`);el&&mountEl(el);
  updUndo();after();
}
function updUndo(){const b=$('#inkUndo');if(b)b.disabled=!undoInk.length}
function setTool(t){tool=t;$$('#inkbar [data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)))}
function setInk(on){
  inkMode=on;document.documentElement.classList.toggle('inking',on);
  $('#inkBtn').setAttribute('aria-pressed',String(on));$('#inkbar').hidden=!on;$('#dock').hidden=on;
  if(on){closeSheet();document.activeElement&&document.activeElement.blur&&document.activeElement.blur()}
  mountInk(document);
  if(on)toast(penSeen?'Write with Apple Pencil. Fingers scroll.':matchMedia('(pointer:coarse)').matches?'Write with your finger. Scroll with two fingers.':'Draw on any field. Press Done to fill the form again.');
}
const midY=()=>{let s=0;touches.forEach(v=>s+=v);return s/touches.size};

/* Notes as images for the report and Word file */
function notes(g){return S.inkWord===false?[]:INK_ORDER.filter(k=>k.slice(0,k.indexOf('.'))===g&&hasInk(k))}
function noteImg(k){
  const v=inkVer[k]||0,c=imgCache[k];if(c&&c.v===v)return c;
  const st=S.ink[k];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  st.s.forEach(s=>{const r=s.w/2+2;for(let i=0;i<s.p.length;i+=2){x0=Math.min(x0,s.p[i]-r);x1=Math.max(x1,s.p[i]+r);y0=Math.min(y0,s.p[i+1]-r);y1=Math.max(y1,s.p[i+1]+r)}});
  x0=Math.max(0,x0-6);y0=Math.max(0,y0-6);x1+=6;y1+=6;
  const w=Math.max(4,x1-x0),h=Math.max(4,y1-y0),SC=2,cv=document.createElement('canvas');
  cv.width=Math.ceil(w*SC);cv.height=Math.ceil(h*SC);
  const ctx=cv.getContext('2d');ctx.setTransform(SC,0,0,SC,-x0*SC,-y0*SC);
  st.s.forEach(s=>drawS(ctx,s,EXPORT_C[s.c]||EXPORT_C.ink));
  return imgCache[k]={v,url:cv.toDataURL('image/png'),w,h,W:st.W};
}
function notesHTML(g){
  return notes(g).map(k=>{const im=noteImg(k),f=Math.min(1,560/im.W);
    return `<figure class="note"><figcaption>Handwritten · ${esc(LABEL[k])}</figcaption><img alt="Handwritten note on ${esc(LABEL[k])}" src="${im.url}" style="width:${Math.round(im.w*f)}px"></figure>`}).join('');
}
function dataBytes(url){const s=atob(url.slice(url.indexOf(',')+1)),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}

/* Ink input: Apple Pencil always writes; pen mode lets finger and mouse write too */
document.addEventListener('pointerdown',e=>{
  if(e.pointerType==='pen'&&!penSeen){penSeen=true;document.documentElement.classList.add('pen-seen');if(!inkMode)toast('Apple Pencil writes on any field. Fingers still tap.')}
  if(inkMode&&e.pointerType==='touch'&&!penSeen){
    touches.set(e.pointerId,e.clientY);
    if(touches.size>1){abortInk();pan={y:midY()};e.preventDefault();return}
  }
  if(drawing||e.button>0)return;
  const el=e.target.closest?e.target.closest('[data-ink]'):null;
  if(!el||!el.offsetParent)return;
  if(inkMode){if(e.pointerType==='touch'&&penSeen)return}
  else if(e.pointerType!=='pen'||e.target.closest('input,textarea,select'))return;
  e.preventDefault();startInk(el,e);
});
document.addEventListener('pointermove',e=>{
  if(pan&&touches.has(e.pointerId)){touches.set(e.pointerId,e.clientY);const m=midY();window.scrollBy(0,pan.y-m);pan.y=m;return}
  if(drawing&&e.pointerId===drawing.pid){e.preventDefault();drawing.erase?eraseAt(e):addPts(e)}
});
const inkUp=e=>{touches.delete(e.pointerId);if(touches.size<2)pan=null;if(drawing&&e.pointerId===drawing.pid)endInk()};
document.addEventListener('pointerup',inkUp);
document.addEventListener('pointercancel',inkUp);
document.addEventListener('touchstart',e=>{
  for(const t of e.changedTouches){
    if(t.touchType!=='stylus')continue;
    const tg=t.target&&t.target.closest?t.target:null,el=tg&&tg.closest('[data-ink]');
    if(el&&(inkMode||!tg.closest('input,textarea,select'))){e.preventDefault();return}
  }
},{passive:false});
document.addEventListener('touchmove',e=>{if(drawing&&drawing.type==='pen')e.preventDefault()},{passive:false});
document.addEventListener('click',e=>{if(performance.now()<swallowUntil){e.stopPropagation();e.preventDefault();swallowUntil=0}},true);
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>requestAnimationFrame(repaintAll))}catch(_){}

/* ---------- Word (.docx): download on Mac, share sheet on iPad ---------- */
const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const wordNotes=g=>notes(g).map(k=>{const im=noteImg(k);return {label:LABEL[k],png:dataBytes(im.url),w:im.w,h:im.h,W:im.W}});
const docName=()=>docNameOf(S);
function download(file,note){
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Word report downloaded'+note);
}
let saving=false;
async function saveWord(){
  if(saving) return; saving=true;
  try{
    const bytes=buildDocx(S,wordNotes),name=docName(),c=counts(),left=c.tot-c.done;
    const note=left?` (${left} row${left>1?'s':''} unmarked)`:'';
    const file=new File([bytes],name,{type:DOCX_MIME});
    if(isIOS()&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file]});toast('Word report ready'+note)}
      catch(e){if(e&&e.name==='AbortError')return;download(file,note)}
      return;
    }
    download(file,note);
  }catch(e){console.error(e);toast('The Word file could not be made. Use Copy instead.')}
  finally{saving=false}
}

/* ---------- Events ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('button,a');if(!t)return;
  if(t.dataset.tool) return setTool(t.dataset.tool);
  if(t.id==='inkUndo') return undoInkStep();
  if(t.id==='inkBtn') return setInk(!inkMode);
  if(t.id==='inkDone') return setInk(false);
  if(t.id==='inkWordBtn'){S.inkWord=S.inkWord===false;t.setAttribute('aria-pressed',String(S.inkWord));return after()}
  if(t.matches('.chip[data-key]')) return pick(t.dataset.key,t.dataset.v);
  if(t.dataset.sex){S.p.sex=t.dataset.sex;return after()}
  if(t.matches('.mini')){const x=st(t.dataset.key);x.f[t.dataset.k]=x.f[t.dataset.k]===t.dataset.val?'':t.dataset.val;renderSec(IDX[t.dataset.key].sec);return after()}
  if(t.dataset.alln) return restNormal([SECS.find(s=>s.id===t.dataset.alln)]);
  if(t.dataset.con!==undefined){S.con=S.con===t.dataset.con?'':t.dataset.con;renderCon();return after()}
  if(t.dataset.adv){const ta=$('#t-adv');S.adv=(S.adv.trim()?S.adv.trim()+' ':'')+t.dataset.adv;ta.value=S.adv;grow(ta);return after()}
  if(t.id==='useDraft'){const ta=$('#t-imp');S.imp=report().imp.join('\n');ta.value=S.imp;grow(ta);ta.focus();return after()}
  if(t.dataset.go){e.preventDefault();closeSheet();$('#s-'+t.dataset.go).scrollIntoView({behavior:reduce()?'auto':'smooth',block:'start'});return}
  if(t.matches('.copyBtn')) return copyReport();
  if(t.matches('.wordBtn')) return saveWord();
  if(t.matches('.printBtn')){$('#repPrint').innerHTML=reportHTML();return window.print()}
});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset.k&&el.dataset.key){
    const x=st(el.dataset.key);x.f[el.dataset.k]=el.value;
    const lab=el.closest('.fld');if(lab&&lab.dataset.req)lab.classList.toggle('need',!el.value.trim());
    return after();
  }
  if(el.dataset.p){S.p[el.dataset.p]=el.value;if(el.tagName==='TEXTAREA')grow(el);return after()}
  if(el.dataset.t){S[el.dataset.t]=el.value;if(el.tagName==='TEXTAREA')grow(el);return after()}
});
$('#dockNext').onclick=$('#sideNext').onclick=nextTodo;
$('#dockRest').onclick=$('#sideRest').onclick=()=>restNormal(act());
$('#dockRep').onclick=()=>{openSheet();saveWord()};
$('#sheetClose').onclick=closeSheet;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(inkMode)setInk(false);else closeSheet()}
  if(inkMode&&(e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoInkStep()}
});

let newArm=0;
$('#newBtn').onclick=e=>{
  const b=e.currentTarget;
  if(!newArm){newArm=setTimeout(()=>{newArm=0;b.textContent='New';b.classList.remove('warn')},3000);b.textContent='Clear form?';b.classList.add('warn');return}
  clearTimeout(newArm);newArm=0;b.textContent='New';b.classList.remove('warn');
  undoSnap=JSON.stringify(S);S=blank();renderAll();after();scrollTo({top:0});toast('Started a new report',true);
};

/* Theme: system → light → dark */
const ICONS={
 system:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17A8.5 8.5 0 0 0 12 3.5z" fill="currentColor"/></svg>',
 light:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
 dark:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'};
let theme='system';try{theme=localStorage.getItem(TKEY)||'system'}catch(e){}
function applyTheme(){
  const r=document.documentElement;
  if(theme==='system')r.removeAttribute('data-theme');else r.setAttribute('data-theme',theme);
  const b=$('#themeBtn');b.innerHTML=ICONS[theme];b.setAttribute('aria-label','Theme: '+theme);b.title='Theme: '+theme;
  requestAnimationFrame(repaintAll);
}
$('#themeBtn').onclick=()=>{theme={system:'light',light:'dark',dark:'system'}[theme];try{localStorage.setItem(TKEY,theme)}catch(e){}applyTheme()};

/* Current-section tracking */
let io;
function observe(){
  if(!('IntersectionObserver' in window))return;
  io&&io.disconnect();
  io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){cur=en.target.dataset.sec;
    $$('[data-go]').forEach(a=>a.classList.toggle('cur',a.dataset.go===cur));
    const a=$(`#strip [data-go="${cur}"]`);if(a){const s=$('#strip');s.scrollTo({left:a.offsetLeft-s.clientWidth/2+a.offsetWidth/2,behavior:reduce()?'auto':'smooth'})}}})},{rootMargin:'-35% 0px -60% 0px'});
  $$('.sec').forEach(s=>io.observe(s));
}
addEventListener('resize',()=>{if(getComputedStyle($('.pane')).display!=='none')$('#rep1').innerHTML=reportHTML()});

/* Boot */
$('#advChips').innerHTML=ADV.map(a=>`<button type="button" class="chip" data-n data-adv="${esc(a)}">${esc(a.replace(/\.$/,''))}</button>`).join('');
let top=false;try{top=window.self===window.top}catch(e){}
if(top)$$('.printBtn').forEach(b=>b.hidden=false);
applyTheme();renderAll();after();

/* Offline + install: cache the app on this device */
if('serviceWorker' in navigator&&location.protocol!=='file:'){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
