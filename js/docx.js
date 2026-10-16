/* Word (.docx) export: hand-built OOXML in a stored (uncompressed) zip. No libraries.
   Layout follows the department's paper report form. */
import {DOCS} from './schema.js';
import {report,sex,act,titleTxt,fmtDate} from './engine.js';

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
export function documentParts(S,getNotes=()=>[]){
  const R=report(S),p=R.p,W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const X=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const run=(t,o={})=>`<w:r><w:rPr>${o.b?'<w:b/><w:bCs/>':''}${o.it?'<w:i/><w:iCs/>':''}${o.col?`<w:color w:val="${o.col}"/>`:''}${o.sz?`<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`:''}${o.u?'<w:u w:val="single"/>':''}</w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
  const P=(runs,o={})=>`<w:p><w:pPr>${o.keep?'<w:keepNext/>':''}${o.bdr?'<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="000000"/></w:pBdr>':''}<w:spacing w:before="${o.before||0}" w:after="${o.after??80}"/>${o.ind?`<w:ind w:left="${o.ind}" w:hanging="${o.hang||0}"/>`:''}${o.jc?`<w:jc w:val="${o.jc}"/>`:''}</w:pPr>${runs}</w:p>`;
  const media=[];
  const noteDx=g=>getNotes(g).map(im=>{
    const n=media.length+1,f=Math.min(1,624/im.W),cx=Math.round(im.w*f*9525),cy=Math.round(im.h*f*9525);
    media.push({n,bytes:im.png});
    return P(run('Handwritten note · '+im.label,{it:1,sz:18,col:'6F6D66'}),{keep:1,before:40,after:20})+
      P(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Note ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="note${n}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdN${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`,{after:100});
  }).join('');
  const lv=(l,v)=>run(l+' ',{b:1})+run(v||'');
  const cell=(w,content,span)=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span?`<w:gridSpan w:val="${span}"/>`:''}</w:tcPr>${content}</w:tc>`;
  const bd=v=>`<w:${v} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`;
  const tbl=(cols,rows,borders)=>`<w:tbl><w:tblPr><w:tblW w:w="${cols.reduce((a,b)=>a+b,0)}" w:type="dxa"/>${borders?`<w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(bd).join('')}</w:tblBorders>`:''}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map(c=>`<w:gridCol w:w="${c}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>`;
  let b='';
  b+=P(run('अखिल भारतीय आयुर्विज्ञान संस्थान (एम्स), गुवाहाटी',{b:1,sz:26}),{jc:'center',after:0});
  b+=P(run('All India Institute of Medical Sciences, Guwahati-781101',{b:1,sz:26}),{jc:'center',after:0});
  b+=P(run('स्वास्थ्य और परिवार कल्याण मंत्रालय, भारत सरकार के तत्वावधान में एक वैधानिक निकाय',{sz:18}),{jc:'center',after:0});
  b+=P(run('(A statutory body under the aegis of Ministry of Health and Family Welfare, GoI)',{b:1,sz:18}),{jc:'center',after:0});
  b+=P(run('DEPARTMENT OF DIAGNOSTIC & INTERVENTIONAL RADIOLOGY',{b:1,sz:24}),{jc:'center',after:120,bdr:1});
  b+=P(run('Report Form',{b:1,u:1}),{jc:'center',before:60,after:100});
  const C=[3600,2050,2048,2048],cp=(l,v)=>P(lv(l,v),{after:0});
  b+=tbl(C,[
    `<w:tr>${cell(C[0],cp('Name:',p.name))}${cell(C[1],cp('CR No:',p.cr))}${cell(C[2],cp('Age/Sex:',(p.age||'')+'/'+sex(S)))}${cell(C[3],cp('USG No:',p.usg))}</w:tr>`,
    `<w:tr>${cell(C[0]+C[1],cp('Date:',fmtDate(p.date)),2)}${cell(C[2]+C[3],cp('Bill No:',p.bill),2)}</w:tr>`],true);
  b+=P(lv('Referred by:',p.ref),{before:120,after:40});
  b+=P(lv('Clinical Details/Remark:',(p.clin||'').trim()),{after:120});
  b+=noteDx('pt');
  b+=P(run(titleTxt(S),{b:1,u:1,sz:24}),{jc:'center',before:60,after:120});
  b+=P(run('FINDINGS:',{b:1}),{keep:1,after:60});
  act(S).forEach(sec=>{R.paras.filter(x=>x.g===sec.id).forEach(x=>b+=P(run(x.t),{after:80}));b+=noteDx(sec.id)});
  if(R.add) b+=P(lv('Additional findings:',R.add),{before:80});
  b+=P(run('IMPRESSION:',{b:1,u:1}),{keep:1,before:160,after:60});
  R.imp.forEach(t=>b+=P(run('•')+'<w:r><w:tab/></w:r>'+run(t,{b:1}),{ind:360,hang:360,after:40}));
  if(R.adv) b+=P(lv('Advice:',R.adv),{before:160});
  b+=noteDx('sum');
  const SC=[2437,2437,2436,2436];
  b+=P('',{before:420,after:0});
  b+=tbl(SC,[`<w:tr>${DOCS.map((d,i)=>{const bo=!S.con||S.con===d[0]?1:0;return cell(SC[i],P(run(d[0],{b:bo}),{after:0})+P(run(d[1],{b:bo}),{after:0}))}).join('')}</w:tr>`],false);
  b+=P(run('Resident Doctors',{b:1}),{before:360,after:20});
  if(R.res) b+=P(run(R.res));
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${b}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="1080" w:bottom="850" w:left="1080" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Nirmala UI"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-IN" w:bidi="hi-IN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
  return {doc,styles,media};
}

export function buildDocx(S,getNotes){
  const {doc,styles,media}=documentParts(S,getNotes);
  return zip([
    {name:'[Content_Types].xml',str:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
    {name:'_rels/.rels',str:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name:'word/_rels/document.xml.rels',str:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+media.map(m=>`<Relationship Id="rIdN${m.n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/note${m.n}.png"/>`).join('')+'</Relationships>'},
    {name:'word/document.xml',str:doc},
    {name:'word/styles.xml',str:styles},
    ...media.map(m=>({name:`word/media/note${m.n}.png`,bytes:m.bytes}))]);
}

export const docName=S=>`USG Abdomen - ${(S.p.name||'Report').trim()} - ${fmtDate(S.p.date).replace(/\//g,'-')}.docx`.replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ');
