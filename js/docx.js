/* Word (.docx) export: hand-built OOXML in a stored (uncompressed) zip. No libraries.
   Letterhead layout: institution, department and address from Settings, then the patient table,
   findings, impression, advice and the resident / consultant sign-off. */
import {report,titleOf,fmtDate,sexWord,conOf} from './engine.js';

const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};

export function zip(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const d=new Date(),tm=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF,dt=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
  for(const f of files){
    const nm=enc.encode(f.name),data=f.bytes||enc.encode(f.str),crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);
    h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),nm,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,tm,true);c.setUint16(14,dt,true);
    c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cen.push(new Uint8Array(c.buffer),nm);
    off+=30+nm.length+data.length;
  }
  const cs=cen.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  const all=[...parts,...cen,new Uint8Array(e.buffer)],out=new Uint8Array(all.reduce((a,b)=>a+b.length,0));let p=0;
  for(const a of all){out.set(a,p);p+=a.length}
  return out;
}

/* getNotes(group) → handwritten notes for that part of the report:
   [{label, png:Uint8Array, w, h, W}] where w×h is the ink's size and W the width it was drawn at. */
export function documentParts(D,set,getNotes=()=>[]){
  const R=report(D,set),p=D.pt,con=conOf(D,set),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const X=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const run=(t,o={})=>`<w:r><w:rPr>${o.b?'<w:b/><w:bCs/>':''}${o.it?'<w:i/><w:iCs/>':''}${o.col?`<w:color w:val="${o.col}"/>`:''}${o.sz?`<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`:''}${o.sp?`<w:spacing w:val="${o.sp}"/>`:''}</w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
  const P=(runs,o={})=>`<w:p><w:pPr>${o.keep?'<w:keepNext/>':''}${o.bdr?`<w:pBdr><w:bottom w:val="single" w:sz="${o.bdr}" w:space="6" w:color="000000"/></w:pBdr>`:''}<w:spacing w:before="${o.before||0}" w:after="${o.after??80}"/>${o.ind?`<w:ind w:left="${o.ind}" w:hanging="${o.hang||0}"/>`:''}${o.jc?`<w:jc w:val="${o.jc}"/>`:''}</w:pPr>${runs}</w:p>`;
  const media=[];
  const noteDx=g=>getNotes(g).map(im=>{
    const n=media.length+1,f=Math.min(1,624/im.W),cx=Math.round(im.w*f*9525),cy=Math.round(im.h*f*9525);
    media.push({n,bytes:im.png});
    return P(run('Handwritten note · '+im.label,{it:1,sz:18,col:'6F6D66'}),{keep:1,before:40,after:20})+
      P(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Note ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="note${n}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdN${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`,{after:100});
  }).join('');
  const lv=(l,v)=>run(l+' ',{col:'6F6D66'})+run(v||'');
  const cell=(w,content,span)=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span?`<w:gridSpan w:val="${span}"/>`:''}</w:tcPr>${content}</w:tc>`;
  const tbl=(cols,rows,bdr)=>`<w:tbl><w:tblPr><w:tblW w:w="${cols.reduce((a,b)=>a+b,0)}" w:type="dxa"/>${bdr?'<w:tblBorders><w:bottom w:val="single" w:sz="4" w:space="0" w:color="999999"/></w:tblBorders>':''}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="20" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map(c=>`<w:gridCol w:w="${c}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>`;
  const head=(t,o={})=>P(run(t,{b:1,sz:19,sp:30,col:'4A4945'}),{keep:1,before:o.before||240,after:80});
  let b='';
  if(set.inst) b+=P(run(set.inst,{b:1,sz:30}),{jc:'center',after:20});
  if(set.dept) b+=P(run(set.dept,{sz:23,col:'4A4945'}),{jc:'center',after:20});
  if(set.addr) b+=P(run(set.addr,{sz:18,col:'6F6D66'}),{jc:'center',after:0});
  b+=P('',{bdr:12,after:200});
  b+=P(run(titleOf(D).replace(' · ','  ·  '),{b:1,sz:21,sp:40}),{jc:'center',after:200});
  const C=[4840,4906],cp=(l,v)=>P(lv(l,v),{after:0});
  const meta=[['Name:',p.name,1],['Age/Sex:',`${p.age?p.age+' / ':''}${sexWord(D)}`],['Date:',fmtDate(p.date)],['CR No:',p.cr],['USG No:',p.usg],['Bill No:',p.bill],['Referred by:',p.ref],['Clinical:',(p.clin||'').trim(),1]];
  const rows=[];let cur=[];
  const flush=()=>{if(!cur.length)return;rows.push(`<w:tr>${cur.length===1&&cur[0][2]?cell(C[0]+C[1],cp(cur[0][0],cur[0][1]),2):cur.map((m,i)=>cell(C[i],cp(m[0],m[1]))).join('')+(cur.length===1?cell(C[1],P('',{after:0})):'')}</w:tr>`);cur=[]};
  meta.forEach(m=>{if(m[2]){flush();cur=[m];flush()}else{cur.push(m);if(cur.length===2)flush()}});flush();
  b+=tbl(C,rows,true);
  b+=noteDx('pt');
  b+=head('FINDINGS');
  R.paras.forEach(x=>{b+=P(run(x.t),{after:100});b+=noteDx(x.g)});
  b+=head('IMPRESSION');
  R.imp.forEach(t=>b+=P(run('•')+'<w:r><w:tab/></w:r>'+run(t,{b:1}),{ind:360,hang:360,after:40}));
  if(R.advice) b+=P(run(R.advice,{it:1}),{before:200});
  b+=noteDx('sum');
  const SC=[4873,4873],sig=(n,r,jc)=>P(run(n||' ',{b:1}),{after:0,jc})+P(run(r,{col:'6F6D66',sz:19}),{after:0,jc});
  b+=P('',{before:720,after:0});
  b+=tbl(SC,[`<w:tr>${cell(SC[0],sig(set.resident,'Resident'))}${cell(SC[1],sig(con&&con.name,con?(con.title?con.title+', ':'')+'Consultant Radiologist':'Consultant Radiologist','right'))}</w:tr>`],false);
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${b}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1080" w:bottom="1000" w:left="1080" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:eastAsia="Georgia" w:cs="Nirmala UI"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-IN" w:bidi="hi-IN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
  return {doc,styles,media};
}

export function buildDocx(D,set,getNotes){
  const {doc,styles,media}=documentParts(D,set,getNotes);
  return zip([
    {name:'[Content_Types].xml',str:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
    {name:'_rels/.rels',str:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name:'word/_rels/document.xml.rels',str:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+media.map(m=>`<Relationship Id="rIdN${m.n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/note${m.n}.png"/>`).join('')+'</Relationships>'},
    {name:'word/document.xml',str:doc},
    {name:'word/styles.xml',str:styles},
    ...media.map(m=>({name:`word/media/note${m.n}.png`,bytes:m.bytes}))]);
}

