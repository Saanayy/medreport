/* Handwriting: ink on any element with data-ink="key" (organ rows, the patient card, sign-off).
   Apple Pencil always writes; pen mode lets a finger or mouse write too.
   Strokes live in the draft (D.ink[key] = {W: width drawn at, s: [{c, w, p:[x,y,…]}]}) so they save with it. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

const INKC={ink:'--ink-ink',red:'--ink-red',blue:'--ink-blue',hl:'--ink-hl'};
const EXPORT_C={ink:'#141413',red:'#C2412D',blue:'#2457B0',hl:'#F2C230'};
const inkVer={},imgCache={},undoInk=[],touches=new Map();
let inkMode=false,tool='ink',penSeen=false,drawing=null,pan=null,swallowUntil=0,inkRaf=0;
let H={getD:()=>null,changed:()=>{},toast:()=>{},label:k=>k,order:k=>0,onMode:()=>{}};

const ink=()=>{const D=H.getD();if(!D)return {};return D.ink||(D.ink={})};
export const hasInk=k=>{const s=ink()[k];return !!(s&&s.s&&s.s.length)};
export const anyInk=()=>Object.keys(ink()).some(hasInk);
export const groupOf=k=>k.split('.')[0];
const ro=('ResizeObserver' in window)?new ResizeObserver(es=>es.forEach(en=>{const el=en.target;if(!el._inkc)return;if(!drawing||drawing.el!==el)fitH(el);sizeC(el);paint(el)})):null;

export function inkRelease(root){if(ro)$$('[data-ink]',root).forEach(el=>{if(el._inkc)ro.unobserve(el)})}
function ensureC(el){
  if(!el._inkc){const c=document.createElement('canvas');c.className='inkc';c.setAttribute('aria-hidden','true');el.appendChild(c);el._inkc=c;ro&&ro.observe(el)}
  sizeC(el);
}
function mountEl(el){
  if(hasInk(el.dataset.ink)||inkMode){fitH(el);ensureC(el);paint(el)}
  else if(el._inkc){ro&&ro.unobserve(el);el._inkc.remove();el._inkc=null;el.style.minHeight=''}
}
export function mountInk(root){$$('[data-ink]',root||document).forEach(mountEl)}
export function resetInk(){for(const k in imgCache)delete imgCache[k];undoInk.length=0;updUndo()}
function sizeC(el){
  const c=el._inkc,w=el.offsetWidth,h=el.offsetHeight,d=Math.min(window.devicePixelRatio||1,2.5),W=Math.round(w*d),Hh=Math.round(h*d);
  c._w=w;c._d=d;if(c.width!==W||c.height!==Hh){c.width=W;c.height=Hh}
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
  const ctx=c.getContext('2d'),st=ink()[el.dataset.ink];
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);
  if(!st||!st.s.length||!c._w)return;
  const s=c._d*c._w/st.W;ctx.setTransform(s,0,0,s,0,0);
  pal=pal||palette();st.s.forEach(x=>drawS(ctx,x,pal[x.c]||pal.ink));
}
export function repaintAll(){const pal=palette();$$('[data-ink]').forEach(el=>el._inkc&&paint(el,pal))}
function fitH(el){
  const st=ink()[el.dataset.ink];
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
  const k=el.dataset.ink,I=ink();
  if(!I[k])I[k]={W:Math.max(1,Math.round(el.offsetWidth)),s:[]};
  const st=I[k];
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
  const d=drawing;if(!d)return;drawing=null;const I=ink();
  // A quick pencil tap on a control is a tap, not a dot.
  if(d.s&&!inkMode&&d.type==='pen'&&performance.now()-d.t0<300){
    const sc=d.el.offsetWidth/d.st.W,p=d.s.p;let len=0;
    for(let i=2;i<p.length;i+=2)len+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);
    if(len*sc<6){
      d.st.s.pop();const u=undoInk.pop();if(u&&!d.st.s.length)delete I[d.k];
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
  if(!d.st.s.length)delete I[d.k];
  inkVer[d.k]=(inkVer[d.k]||0)+1;
  if(d.type==='pen'&&!inkMode)swallowUntil=performance.now()+450;
  mountEl(d.el);updUndo();H.changed();
}
function abortInk(){
  const d=drawing;if(!d)return;drawing=null;const I=ink();
  const u=undoInk.pop();if(u&&u.prev)I[u.k]=JSON.parse(u.prev);
  if(I[d.k]&&!I[d.k].s.length)delete I[d.k];
  mountEl(d.el);updUndo();
}
export function undoInkStep(){
  const u=undoInk.pop();if(!u)return;const I=ink();
  const st=u.prev?JSON.parse(u.prev):null;
  if(st&&st.s.length)I[u.k]=st;else delete I[u.k];
  inkVer[u.k]=(inkVer[u.k]||0)+1;
  const el=$(`[data-ink="${u.k}"]`);el&&mountEl(el);
  updUndo();H.changed();
}
function updUndo(){const b=$('#inkUndo');if(b)b.disabled=!undoInk.length}
function setTool(t){tool=t;$$('#inkbar [data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)))}
export const inkOn=()=>inkMode;
export function setInk(on){
  inkMode=on;document.documentElement.classList.toggle('inking',on);
  $$('.inkBtn').forEach(b=>b.setAttribute('aria-pressed',String(on)));$('#inkbar').hidden=!on;
  if(on&&document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  H.onMode(on);mountInk(document);
  if(on)H.toast(penSeen?'Write with Apple Pencil. Fingers scroll.':matchMedia('(pointer:coarse)').matches?'Write with your finger. Scroll with two fingers.':'Draw on any row. Press Done to fill the form again.');
}
const midY=()=>{let s=0;touches.forEach(v=>s+=v);return s/touches.size};

/* Notes as images for the report and the Word file */
export function notes(g){
  const D=H.getD();if(!D||D.inkWord===false)return[];
  return Object.keys(ink()).filter(k=>groupOf(k)===g&&hasInk(k)).sort((a,b)=>H.order(a)-H.order(b));
}
function noteImg(k){
  const v=inkVer[k]||0,c=imgCache[k];if(c&&c.v===v)return c;
  const st=ink()[k];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  st.s.forEach(s=>{const r=s.w/2+2;for(let i=0;i<s.p.length;i+=2){x0=Math.min(x0,s.p[i]-r);x1=Math.max(x1,s.p[i]+r);y0=Math.min(y0,s.p[i+1]-r);y1=Math.max(y1,s.p[i+1]+r)}});
  x0=Math.max(0,x0-6);y0=Math.max(0,y0-6);x1+=6;y1+=6;
  const w=Math.max(4,x1-x0),h=Math.max(4,y1-y0),SC=2,cv=document.createElement('canvas');
  cv.width=Math.ceil(w*SC);cv.height=Math.ceil(h*SC);
  const ctx=cv.getContext('2d');ctx.setTransform(SC,0,0,SC,-x0*SC,-y0*SC);
  st.s.forEach(s=>drawS(ctx,s,EXPORT_C[s.c]||EXPORT_C.ink));
  return imgCache[k]={v,url:cv.toDataURL('image/png'),w,h,W:st.W};
}
const escA=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function notesHTML(g){
  return notes(g).map(k=>{const im=noteImg(k),f=Math.min(1,560/im.W),l=escA(H.label(k));
    return `<figure class="note"><figcaption>Handwritten · ${l}</figcaption><img alt="Handwritten note on ${l}" src="${im.url}" style="width:${Math.round(im.w*f)}px"></figure>`}).join('');
}
function dataBytes(url){const s=atob(url.slice(url.indexOf(',')+1)),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
export const wordNotes=g=>notes(g).map(k=>{const im=noteImg(k);return {label:H.label(k),png:dataBytes(im.url),w:im.w,h:im.h,W:im.W}});

export function initInk(hooks){
  H={...H,...hooks};
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType==='pen'&&!penSeen){penSeen=true;document.documentElement.classList.add('pen-seen');if(!inkMode&&H.getD())H.toast('Apple Pencil writes on any row. Fingers still tap.')}
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
    if(pan&&touches.has(e.pointerId)){touches.set(e.pointerId,e.clientY);const m=midY(),sc=document.querySelector('.form');
      const target=sc&&getComputedStyle(sc).overflowY==='auto'?sc:window;target.scrollBy(0,pan.y-m);pan.y=m;return}
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
  $$('#inkbar [data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
  $('#inkUndo').addEventListener('click',undoInkStep);
  $('#inkDone').addEventListener('click',()=>setInk(false));
}
