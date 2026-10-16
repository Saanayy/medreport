/* The form and all report wording, ported unchanged from the Sonoform design
   (reference/sonoform.dc.html). tests/ checks the output stays identical.

   ORG: one entry per organ card.
     paired: 'kidney' | 'ovary' | 'side' → Right/Left columns · sex: 'M' | 'F' → only for that sex.
   Row: id, l (label), o (options), when(g) → row shown only if true (g(rowId) = chosen label),
     auto(m) → option index picked from the measurement, single → shown once above the sides.
   Option O(label, {...}):
     n normal · u unit of the inline measurement · ml its label · req measurement required
     sub/subL inline sub-choice (e.g. fatty-liver grade) · d detail panel fields · pre detail presets
     sets → picking it also sets other rows (e.g. Acute pancreatitis → bulky, heterogeneous …).
   Detail field: t 'c' choice (multi: several) | 'm' measurement (n planes, u unit, req), when(D), full width.
   W[organ](G) → [findings sentences, impression lines]; G(rowId, side) reads the row's mark. */
const O=(l,x={})=>Object.assign({l},x);
const LES=[{id:'num',l:'Number',t:'c',o:['Single','Multiple']},{id:'mar',l:'Margins',t:'c',o:['Well-defined','Ill-defined']},{id:'ech',l:'Echogenicity',t:'c',o:['Anechoic','Hypoechoic','Isoechoic','Hyperechoic']},{id:'vas',l:'Vascularity (Doppler)',t:'c',o:['Absent','Present']},{id:'size',l:'Size in two planes (largest if multiple)',t:'m',n:2,u:'cm',req:1,full:1},{id:'seg',l:'Segments',t:'c',multi:1,full:1,o:['I','II','III','IVa','IVb','V','VI','VII','VIII']}];
const LESC=LES.filter(x=>x.id!=='mar'&&x.id!=='ech');
const INV={id:'inv',l:'Vessel involvement',t:'c',full:1,o:['None','Portal vein','Hepatic vein','Both']};
const RC=[{id:'num',l:'Number',t:'c',o:['Single','Multiple']},{id:'pole',l:'Pole',t:'c',multi:1,o:['Upper','Mid','Lower']},{id:'lpole',l:'Largest cyst in',t:'c',o:['Upper pole','Mid pole','Lower pole'],when:D=>D.num===1},{id:'size',l:'Size in two planes (largest if multiple)',t:'m',n:2,u:'cm',req:1,full:1}];
const RCX=[{id:'ech',l:'Contents',t:'c',o:['Anechoic','Internal echoes']},{id:'sep',l:'Septations',t:'c',o:['Absent','Present']},{id:'sepn',l:'Number of septa',t:'c',o:['1–3','More than 3'],when:D=>D.sep===1},{id:'sept',l:'Septal thickness',t:'c',o:['Thin','Thick'],when:D=>D.sep===1},{id:'nod',l:'Solid nodules',t:'c',o:['Absent','Present']},{id:'vas',l:'Vascularity',t:'c',o:['Absent','Present']}];
const OSZ={id:'size',l:'Size in two planes',t:'m',n:2,u:'cm',req:1,full:1};
export const SIDES=o=>o.paired?(o.rows.some(r=>r.single)?['-','R','L']:['R','L']):['-'];
const PW=g=>g('acute')==='Yes'||g('size')==='Bulky'||g('echo')==='Heterogeneous';
export const ORG=[
{id:'liver',name:'Liver',rows:[
 {id:'size',l:'Size',auto:m=>m>=15.5?1:0,o:[O('Normal',{n:1,u:'cm',ml:'Span'}),O('Enlarged',{u:'cm',ml:'Span',req:1})]},
 {id:'echo',l:'Echotexture',o:[O('Normal',{n:1}),O('Diffusely increased',{sub:['I','II','III'],subL:'Grade'}),O('Heterogeneous')]},
 {id:'margin',l:'Margins',o:[O('Smooth',{n:1}),O('Nodular')]},
 {id:'focal',l:'Focal lesion',o:[O('None',{n:1}),O('Cyst',{d:LESC,pre:{num:0,vas:0}}),O('Hemangioma',{d:LES,pre:{num:0,mar:0,ech:3,vas:0}}),O('Solid',{d:[...LES,INV]})]},
 {id:'ihbr',l:'IHBR',o:[O('Not dilated',{n:1}),O('Dilated',{d:[{id:'ext',l:'Extent',t:'c',o:['Right lobe','Left lobe','Bilobar']},{id:'loc',l:'Location',t:'c',o:['Central','Peripheral','Both']},{id:'dia',l:'Max diameter',t:'m',u:'mm',req:1}]})]},
 {id:'pv',l:'Portal vein',auto:m=>m>12?1:0,o:[O('Normal',{n:1,u:'mm',ml:'Calibre'}),O('Dilated',{u:'mm',ml:'Calibre',req:1})]},
 {id:'pvflow',l:'PV flow',when:g=>g('echo')==='Heterogeneous'||g('margin')==='Nodular',o:[O('Hepatopetal',{n:1,u:'cm/s',ml:'PSV'}),O('Hepatofugal',{u:'cm/s',ml:'PSV',req:1})]},
 {id:'hv',l:'Hepatic veins',o:[O('Normal',{n:1,u:'mm',ml:'Calibre'}),O('Dilated',{u:'mm',ml:'Calibre',req:1}),O('Altered flow',{sub:['Monophasic','Absent'],subL:'Flow'})]}]},
{id:'gb',name:'Gallbladder',rows:[
 {id:'dist',l:'Distension',o:[O('Well distended',{n:1}),O('Contracted',{n:1}),O('Post-op',{n:1})]},
 {id:'calc',l:'Calculus',o:[O('None',{n:1}),O('Single',{u:'mm',ml:'Size',req:1}),O('Multiple',{d:[{id:'cnt',l:'Number',t:'c',o:['Few','Multiple']},{id:'lg',l:'Largest',t:'m',u:'mm',req:1}],pre:{cnt:0}})]},
 {id:'wall',l:'Wall',o:[O('Normal',{n:1}),O('Thickened',{d:[{id:'max',l:'Max thickness',t:'m',u:'mm',req:1},{id:'ext',l:'Extent',t:'c',o:['Focal','Diffuse']},{id:'comet',l:'Comet-tail artefact',t:'c',o:['Absent','Present'],when:D=>D.ext===0},{id:'ass',l:'Associated',t:'c',multi:1,o:['Wall edema','Pericholecystic fluid'],when:D=>D.ext===1}]})]},
 {id:'sludge',l:'Sludge',o:[O('None',{n:1}),O('Present')]}]},
{id:'cbd',name:'CBD',rows:[{id:'cal',l:'Calibre',o:[O('Normal',{n:1}),O('Dilated',{u:'mm'})]}]},
{id:'panc',name:'Pancreas',rows:[
 {id:'acute',l:'Acute pancreatitis',o:[O('No',{n:1}),O('Yes',{sets:{size:{o:1},echo:{o:1},fluid:{o:1},fat:{o:1}}})]},
 {id:'size',l:'Size',o:[O('Normal',{n:1}),O('Bulky',{d:[{id:'site',l:'Max AP diameter at',t:'c',o:['Head','Body','Tail']},{id:'ap',l:'AP diameter',t:'m',u:'mm',req:1}]})]},
 {id:'echo',l:'Echotexture',o:[O('Normal',{n:1}),O('Heterogeneous')]},
 {id:'vis',l:'Visualisation',o:[O('Fully seen',{n:1}),O('Tail obscured',{n:1}),O('Partly obscured',{n:1,d:[{id:'part',l:'Part obscured',t:'c',multi:1,o:['Head','Body','Tail']}]})]},
 {id:'fluid',l:'Peripancreatic fluid',when:PW,o:[O('None',{n:1}),O('Minimal'),O('Collection',{u:'cc',ml:'Volume'})]},
 {id:'fat',l:'Fat stranding',when:PW,o:[O('Absent',{n:1}),O('Present')]}]},
{id:'spleen',name:'Spleen',rows:[
 {id:'size',l:'Size',o:[O('Normal',{n:1,u:'cm',ml:'Length'}),O('Enlarged',{u:'cm',ml:'Length',req:1})]},
 {id:'focal',l:'Focal lesion',o:[O('None',{n:1}),O('Present',{pre:{num:0,loc:2},d:[{id:'num',l:'Number',t:'c',o:['Single','Multiple']},{id:'ech',l:'Echogenicity',t:'c',o:['Anechoic','Hypoechoic','Isoechoic','Hyperechoic']},{id:'loc',l:'Location',t:'c',o:['Superior pole','Inferior pole','Not specified']},{id:'size',l:'Size in two planes (largest if multiple)',t:'m',n:2,u:'cm',req:1,full:1}]})]}]},
{id:'kid',name:'Kidneys',paired:'kidney',rows:[
 {id:'size',l:'Size',o:[O('Normal',{n:1,u:'cm'}),O('Enlarged',{u:'cm'}),O('Small',{u:'cm'})]},
 {id:'echo',l:'Parenchymal echogenicity',o:[O('Normal',{n:1}),O('Raised')]},
 {id:'cmd',l:'CMD',o:[O('Maintained',{n:1}),O('Lost')]},
 {id:'calc',l:'Calculus',o:[O('None',{n:1}),O('Present',{u:'mm',sub:['Upper','Mid','Lower'],subL:'Pole'})]},
 {id:'cyst',l:'Cyst',o:[O('None',{n:1}),O('Simple',{pre:{num:0},d:RC}),O('Complex',{pre:{num:0},d:[...RC,...RCX]})]},
 {id:'hn',l:'Hydronephrosis',o:[O('None',{n:1}),O('Mild'),O('Moderate'),O('Severe')]},
 {id:'ur',l:'Ureter',o:[O('Not dilated',{n:1}),O('Dilated')]}]},
{id:'ub',name:'Urinary bladder',rows:[
 {id:'cyst',l:'Cystitis',o:[O('No',{n:1}),O('Cystitis',{sets:{cont:{o:1}}}),O('Chronic cystitis',{sets:{wall:{o:1,d:{ext:1,cont:1,trab:1}}}})]},
 {id:'wall',l:'Wall',o:[O('Normal',{n:1}),O('Thickened',{d:[{id:'ext',l:'Extent',t:'c',o:['Focal','Diffuse']},
  {id:'fs',l:'Size of thickening',t:'m',n:2,u:'cm',req:1,when:D=>D.ext===0},{id:'fe',l:'Echotexture',t:'c',o:['Hypoechoic','Isoechoic','Hyperechoic'],when:D=>D.ext===0},{id:'fv',l:'Vascularity',t:'c',o:['Absent','Present'],when:D=>D.ext===0},{id:'fp',l:'Projection into lumen',t:'c',o:['Absent','Present'],when:D=>D.ext===0},
  {id:'max',l:'Max thickness',t:'m',u:'mm',req:1,when:D=>D.ext===1},{id:'cont',l:'Contour',t:'c',o:['Smooth','Irregular'],when:D=>D.ext===1},{id:'trab',l:'Trabeculations',t:'c',o:['Absent','Present'],when:D=>D.ext===1}]})]},
 {id:'cont',l:'Contents',o:[O('Clear',{n:1}),O('Internal echoes'),O('Calculus',{u:'mm',ml:'Size'}),O('Debris')]}]},
{id:'pros',name:'Prostate',sex:'M',rows:[
 {id:'size',l:'Size',o:[O('Normal',{n:1,u:'cc'}),O('Enlarged',{u:'cc'})]},
 {id:'echo',l:'Echotexture',o:[O('Homogeneous',{n:1}),O('Heterogeneous')]},
 {id:'focal',l:'Focal lesion',o:[O('None',{n:1}),O('Cyst',{d:[{id:'size',l:'Size in two planes',t:'m',n:2,u:'cm',req:1,full:1}]}),O('Calcifications')]}]},
{id:'ut',name:'Uterus',sex:'F',rows:[
 {id:'size',l:'Size',o:[O('Normal',{n:1}),O('Bulky',{d:[{id:'dim',l:'Size in three planes',t:'m',n:3,u:'cm',req:1,full:1}]}),O('PMA',{n:1})]},
 {id:'myo',l:'Myometrium',o:[O('Normal',{n:1}),O('Fibroid',{pre:{num:0},d:[{id:'num',l:'Number',t:'c',o:['Single','Multiple']},{id:'loc',l:'Location',t:'c',multi:1,full:1,o:['Anterior','Posterior','Right lateral','Left lateral','Fundal']},{id:'typ',l:'Type',t:'c',o:['Intramural','Subserosal','Submucosal']},{id:'figo',l:'FIGO type',t:'c',full:1,o:['0','1','2','3','4','5','6','7','2–5']},{id:'size',l:'Size (largest if multiple) · 3rd plane opens above 3 cm',t:'m',n:D=>(D.size||[]).slice(0,2).some(x=>+x>3)?3:2,u:'cm',req:1,full:1}]}),O('Adenomyosis',{d:[{id:'ext',l:'Type',t:'c',o:['Focal','Diffuse']},{id:'wall',l:'Wall',t:'c',o:['Anterior','Posterior'],when:D=>D.ext===0},{id:'sz',l:'Size in two planes',t:'m',n:2,u:'cm',req:1,when:D=>D.ext===0}]})]},
 {id:'endo',l:'Endometrium',o:[O('Normal',{n:1,u:'mm'}),O('Thickened',{u:'mm',d:[{id:'cys',l:'Cystic changes',t:'c',o:['Absent','Present']}]})]}]},
{id:'ov',name:'Ovaries',sex:'F',paired:'ovary',rows:[
 {id:'pcom',l:'PCOM',single:1,o:[O('No',{n:1}),O('Yes',{d:[{id:'rv',l:'Right ovary volume',t:'m',u:'cc',req:1},{id:'lv',l:'Left ovary volume',t:'m',u:'cc',req:1}]})]},
 {id:'st',l:'Appearance',when:g=>g('pcom')!=='Yes',o:[O('Normal',{n:1}),
 O('Simple cyst',{d:[OSZ]}),
 O('Hemorrhagic cyst',{pre:{ret:1},d:[OSZ,{id:'ret',l:'Fine reticulations',t:'c',o:['Absent','Present']},{id:'clot',l:'Retracting clot',t:'c',o:['Absent','Present']},{id:'deb',l:'Debris',t:'c',o:['Absent','Present']},{id:'vas',l:'Internal vascularity',t:'c',o:['Absent','Present']}]}),
 O('Chocolate cyst',{pre:{lle:1},d:[OSZ,{id:'lle',l:'Low-level internal echoes',t:'c',o:['Absent','Present']},{id:'wf',l:'Echogenic wall foci',t:'c',o:['Absent','Present']},{id:'vas',l:'Internal vascularity',t:'c',o:['Absent','Present']}]}),
 O('Complex cyst',{d:[OSZ,{id:'cont',l:'Contents',t:'c',o:['Anechoic','Low-level echoes','Mixed']},{id:'sep',l:'Septations',t:'c',o:['Absent','Present']},{id:'sepn',l:'Number of septa',t:'c',o:['1–2','3–5','More than 5'],when:D=>D.sep===1},{id:'sept',l:'Septal thickness',t:'c',o:['Thin (< 3 mm)','Thick (≥ 3 mm)'],when:D=>D.sep===1},{id:'nod',l:'Mural nodule / solid component',t:'c',o:['Absent','Present']},{id:'nsz',l:'Nodule size',t:'m',u:'mm',req:1,when:D=>D.nod===1},{id:'vas',l:'Vascularity (Doppler)',t:'c',o:['Absent','In septa','In solid component']},{id:'asc',l:'Free fluid',t:'c',o:['Absent','Present']}]}),
 O('Dermoid cyst',{d:[OSZ,{id:'fat',l:'Echogenic fat',t:'c',o:['Absent','Present']},{id:'calc',l:'Calcification',t:'c',o:['Absent','Present']},{id:'hair',l:'Dermoid mesh / fat-fluid level',t:'c',o:['Absent','Present']},{id:'vas',l:'Internal vascularity',t:'c',o:['Absent','Present']}]}),
 O('Not seen',{n:1})]}]},
{id:'bowel',name:'Bowel loops',rows:[
 {id:'cal',l:'Calibre',o:[O('Normal',{n:1}),O('Dilated',{d:[{id:'which',l:'Loops',t:'c',multi:1,o:['Small bowel','Large bowel']},{id:'mx',l:'Max calibre',t:'m',u:'mm',req:1}]})]},
 {id:'wall',l:'Wall',o:[O('Normal',{n:1}),O('Thickened',{d:[{id:'t',l:'Max thickness',t:'m',u:'mm',req:1},{id:'seg',l:'Segment',t:'c',multi:1,full:1,o:['Jejunum','Ileum','Terminal ileum','Caecum','Ascending colon','Transverse colon','Descending colon','Sigmoid colon','Rectum']}]})]}]},
{id:'addl',name:'Additional findings',rows:[
 {id:'hern',l:'Ventral hernia',o:[O('No',{n:1}),O('Yes',{d:[{id:'pos',l:'Position',t:'c',o:['Paraumbilical','Supraumbilical','Infraumbilical']},{id:'line',l:'Line',t:'c',o:['Midline','Paramedian']},{id:'side',l:'Side',t:'c',o:['Right','Left'],when:D=>D.line===1},{id:'def',l:'Defect size',t:'m',u:'mm',req:1}]})]},
 {id:'appx',l:'Acute appendicitis',o:[O('No',{n:1}),O('Yes',{d:[{id:'dia',l:'Diameter',t:'m',u:'mm',req:1},{id:'flu',l:'Periappendiceal fluid',t:'c',o:['None','Minimal','Collection']},{id:'edm',l:'Reactive bowel edema',t:'c',o:['Absent','Present']},{id:'cae',l:'Caecal involvement',t:'c',o:['Absent','Present']}]})]}]},
{id:'perit',name:'Peritoneum',rows:[{id:'fluid',l:'Free fluid',o:[O('None',{n:1}),O('Minimal'),O('Moderate'),O('Gross')]}]},
{id:'pleura',name:'Pleural spaces',paired:'side',rows:[{id:'eff',l:'Effusion',o:[O('None',{n:1}),O('Present',{sub:['Minimal','Mild','Moderate'],subL:'Amount'})]}]}
];
export const Lor=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' or '+a[a.length-1];
export const Land=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
export const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const ms=(v,u)=>v?` measuring ${v} ${u}`:'';
const par=(v,u)=>v?` (${v} ${u})`:'';
const SD={R:'right',L:'left'};
const lesion=fo=>{const mult=fo.d('num')==='Multiple',mar=fo.d('mar'),ech=fo.d('ech'),sz=fo.d('size'),seg=fo.d('seg')||[],vas=fo.d('vas'),inv=fo.d('inv');
 const adj=fo.l==='Cyst'?'well-defined anechoic':[mar,ech].filter(Boolean).map(x=>x.toLowerCase()).join(' ');
 const noun=(fo.l==='Cyst'?'cystic lesion':'lesion')+(mult?'s':'');
 const where=seg.length?` in segment${seg.length>1?'s':''} ${Land(seg)} of the liver`:' in the liver';
 const dim=sz[0]&&sz[1]?`${sz[0]} × ${sz[1]} cm`:sz[0]?`${sz[0]} cm`:'';
 let s=mult?`Multiple ${adj?adj+' ':''}${noun} are seen${where}${dim?`, the largest measuring ${dim}`:''}`:`${/^[aeiou]/i.test(adj||noun)?'An':'A'} ${adj?adj+' ':''}${noun}${dim?` measuring ${dim}`:''} is seen${where}`;
 if(vas)s+=vas==='Absent'?', with no internal vascularity on colour Doppler':', with internal vascularity on colour Doppler';
 if(fo.l==='Hemangioma')s+=`, suggestive of hemangioma${mult?'s':''}`;if(fo.l==='Cyst')s+=`, suggestive of simple cyst${mult?'s':''}`;
 const out=[s+'.'];
 if(inv)out.push(inv==='None'?'No portal or hepatic venous involvement is seen.':`The lesion${mult?'s involve':' involves'} the ${inv==='Both'?'portal and hepatic veins':inv.toLowerCase()}.`);
 return out};
const dim2=z=>z[0]&&z[1]?`${z[0]} × ${z[1]} cm`:z[0]?`${z[0]} cm`:'';
const rcyst=x=>{const c=x.cy,mult=c.d('num')==='Multiple',poles=c.d('pole').map(p=>p.toLowerCase()),d=dim2(c.d('size'));
 const where=poles.length?` in the ${Land(poles)} pole${poles.length>1?'s':''} of the ${x.nm} kidney`:` in the ${x.nm} kidney`,lp=mult?c.d('lpole'):null,lg=d||lp?`, the largest${lp?` in the ${lp.toLowerCase()}`:''}${d?` measuring ${d}`:''}`:'';
 if(c.l==='Simple')return mult?`Multiple well-defined anechoic cystic lesions are seen${where}${lg}, suggestive of simple cortical cysts.`:`A well-defined anechoic cystic lesion${d?` measuring ${d}`:''} is seen${where}, suggestive of a simple cortical cyst.`;
 const q=[],e=c.d('ech'),sp=c.d('sep'),no=c.d('nod'),v=c.d('vas');
 if(e)q.push(e==='Anechoic'?'anechoic contents':'internal echoes');
 if(sp==='Absent')q.push('no septations');if(sp==='Present'){const n=c.d('sepn'),t=c.d('sept');q.push(`${n==='More than 3'?'more than three ':n==='1–3'?'one to three ':''}${t?t.toLowerCase()+' ':''}septations`)}
 if(no)q.push(no==='Present'?'solid mural nodules':'no solid nodules');if(v)q.push(v==='Present'?'internal vascularity on colour Doppler':'no internal vascularity');
 return (mult?`Multiple cystic lesions are seen${where}${lg}`:`A cystic lesion${d?` measuring ${d}`:''} is seen${where}`)+(q.length?', with '+Land(q):'')+'.'};
const dimN=z=>{const f=(z||[]).filter(Boolean);return f.length?f.join(' × ')+' cm':''};
export const W={
liver(G){const S=[],I=[],sz=G('size'),ec=G('echo'),mg=G('margin'),fo=G('focal'),ih=G('ihbr'),pv=G('pv'),fl=G('pvflow');
 const mild=sz&&!sz.n&&sz.m&&+sz.m<=17,fat=ec&&ec.l==='Diffusely increased';
 const a=sz?(sz.n?'normal in size':mild?'mildly enlarged':'enlarged')+(sz.m?` (span ${sz.m} cm)`:''):'';
 const w=[];if(mg)w.push(mg.n?'smooth margins':'nodular surface margins');
 if(ec&&!fat)w.push(ec.n?'normal echotexture':'heterogeneous echotexture');
 if(a)S.push(`The liver is ${a}${w.length?' with '+Land(w):''}.`);else if(w.length)S.push(`The liver shows ${Land(w)}.`);
 if(fat){const g=ec.s||'I';S.push(`The liver parenchyma shows ${{I:'mild',II:'moderate',III:'severe'}[g]} diffuse increase in echogenicity${g==='III'?', with inability to differentiate the diaphragm from the liver parenchyma':''}, suggestive of grade ${g} fatty infiltration.`)}
 const neg=[];
 if(fo){if(fo.n)neg.push('focal lesion');else S.push(...lesion(fo))}
 if(ih){if(ih.n)neg.push('intrahepatic biliary radicle dilatation');else{const ext=ih.d('ext'),loc=ih.d('loc'),dia=ih.d('dia')[0];const q=[ext==='Bilobar'?'bilobar':ext==='Right lobe'?'right lobar':ext==='Left lobe'?'left lobar':'',loc==='Both'?'central and peripheral':loc?loc.toLowerCase():''].filter(Boolean).join(' ');S.push(cap(`${q?q+' ':''}intrahepatic biliary radicle dilatation is seen${dia?`, measuring up to ${dia} mm`:''}.`))}}
 if(neg.length)S.push(`No ${Lor(neg)} is seen.`);
 if(pv)S.push(`The portal vein is ${pv.n?'normal in calibre':'dilated'}${par(pv.m,'mm')}${fl?` with ${fl.l.toLowerCase()} flow${fl.m?` and a peak systolic velocity of ${fl.m} cm/s`:''}`:''}.`);
 const cir=(ec&&ec.l==='Heterogeneous')||(mg&&!mg.n),fug=fl&&!fl.n,pvd=pv&&!pv.n;
 if(cir){let t=mg&&!mg.n?'Features suggestive of liver cirrhosis':'Heterogeneous hepatic echotexture, suggestive of chronic liver parenchymal disease';if(sz&&!sz.n)t+=mild?', with mild hepatomegaly':', with hepatomegaly';if(pvd||fug)t+=`; ${fug?'hepatofugal portal venous flow':'dilated portal vein'}${fug&&pvd?' and dilated portal vein':''}, suggestive of portal hypertension`;I.push(t+'.')}
 else{const p=[];if(sz&&!sz.n)p.push(mild?'mild hepatomegaly':'hepatomegaly');if(fat)p.push(`grade ${ec.s||'I'} fatty liver`);if(p.length)I.push(cap(p.join(' with '))+'.');if(pvd)I.push('Dilated portal vein.')}
 if(fo&&!fo.n&&fo.l!=='Cyst'){const mult=fo.d('num')==='Multiple',seg=fo.d('seg')||[],inv=fo.d('inv');const sg=seg.length?` in segment${seg.length>1?'s':''} ${Land(seg)}`:'';
  if(fo.l==='Hemangioma')I.push(`Hepatic hemangioma${mult?'s':''}${sg}.`);
  else I.push(`${mult?'Multiple solid hepatic lesions':'Solid hepatic lesion'}${sg}${inv&&inv!=='None'?` with ${inv==='Both'?'portal and hepatic venous':inv.toLowerCase()} involvement`:''}; further evaluation with contrast-enhanced CT or MRI advised.`)}
 if(ih&&!ih.n)I.push('Intrahepatic biliary radicle dilatation.');
 const hv=G('hv');if(hv){if(hv.n)S.push(`The hepatic veins are normal in calibre${par(hv.m,'mm')} with normal triphasic flow.`);else if(hv.l==='Dilated'){S.push(`The hepatic veins are dilated${par(hv.m,'mm')}.`);I.push('Dilated hepatic veins, suggestive of hepatic congestion.')}else{const ab=hv.s==='Absent';S.push(`The hepatic veins show ${ab?'absent':'monophasic'} flow.`);I.push(ab?'Absent hepatic venous flow; Budd-Chiari syndrome to be excluded.':'Monophasic hepatic venous flow.')}}
 return[S,I]},
gb(G){const S=[],I=[],d=G('dist'),c=G('calc'),w=G('wall'),sl=G('sludge');
 if(d&&d.l==='Post-op'){S.push('The gallbladder is not visualised (post-cholecystectomy status).');return[S,I]}
 const s=d?(d.l==='Well distended'?'The gallbladder is well distended':'The gallbladder is contracted'):'';
 let cs='';
 if(c&&c.l==='Single')cs=`a calculus${ms(c.m,'mm')} with posterior acoustic shadowing`;
 if(c&&c.l==='Multiple'){const lg=c.d('lg')[0];cs=`${c.d('cnt')==='Few'?'a few':'multiple'} calculi${lg?`, the largest measuring ${lg} mm,`:''} with posterior acoustic shadowing`}
 if(s&&cs)S.push(`${s} and shows ${cs}.`);else if(s)S.push(s+'.');else if(cs)S.push(`The gallbladder shows ${cs}.`);
 const neg=[];if(c&&c.n)neg.push('calculus');
 let ext=null,acute=false,comet=null;
 if(w){if(w.n)neg.push('wall thickening');else{const mx=w.d('max')[0],up=mx?`, measuring up to ${mx} mm`:'';ext=w.d('ext');
  if(ext==='Focal'){comet=w.d('comet');S.push(`Focal wall thickening is seen${up}${comet==='Present'?', with comet-tail artefacts':comet==='Absent'?', with no comet-tail artefact':''}.`)}
  else{const ass=w.d('ass').map(x=>x==='Wall edema'?'mural edema':'pericholecystic fluid');acute=ass.length>0;S.push(`The wall is ${ext==='Diffuse'?'diffusely ':''}thickened${up}${ass.length?', with '+Land(ass):''}.`)}}}
 if(sl){if(sl.n)neg.push('sludge');else S.push('Minimal sludge is seen within the gallbladder lumen.')}
 if(neg.length)S.push(`No ${Lor(neg)} is seen.`);
 const calc=c&&!c.n,diff=w&&!w.n&&ext!=='Focal';
 if(diff){if(calc)I.push(acute?'Cholelithiasis with features suggestive of acute calculous cholecystitis.':'Cholelithiasis with diffuse gallbladder wall thickening, suggestive of chronic cholecystitis.');else I.push(acute?'Diffuse gallbladder wall thickening with features suggestive of acute acalculous cholecystitis.':'Diffuse gallbladder wall thickening.')}
 else if(calc)I.push('Cholelithiasis.');
 if(ext==='Focal')I.push(comet==='Present'?'Focal gallbladder wall thickening with comet-tail artefacts, suggestive of adenomyomatosis.':'Focal gallbladder wall thickening; further evaluation advised.');
 return[S,I]},
cbd(G){const c=G('cal');if(!c)return[[],[]];return c.n?[['The common bile duct is normal in calibre.'],[]]:[[`The common bile duct is dilated${ms(c.m,'mm')}.`],['Dilated common bile duct.']]},
panc(G){const S=[],I=[],ac=G('acute'),sz=G('size'),ec=G('echo'),vi=G('vis'),fl=G('fluid'),ft=G('fat');
 const bulky=sz&&!sz.n,het=ec&&!ec.n;
 if(sz||ec){let t=sz?(bulky?'The pancreas is bulky':'The pancreas is normal in size'):'The pancreas shows';const ap=bulky&&sz.d('ap')[0],site=bulky&&sz.d('site');
  if(ap)t+=`, with the ${site?site.toLowerCase():'gland'} measuring ${ap} mm in AP diameter`;
  if(ec){const e=het?'heterogeneous echotexture':'normal echotexture';t+=!sz?' '+e:ap?`, and shows ${e}`:` with ${e}`}
  if(sz&&sz.n&&ec&&ec.n)t='The pancreas is normal in size and echotexture';S.push(t+'.')}
 const pos=[],neg=[];
 if(fl){if(fl.n)neg.push('peripancreatic fluid');else pos.push(fl.l==='Minimal'?'minimal peripancreatic fluid':`a peripancreatic collection${fl.m?` of approximately ${fl.m} cc`:''}`)}
 if(ft){if(ft.n)neg.push('fat stranding');else pos.push('peripancreatic fat stranding')}
 if(pos.length)S.push(cap(Land(pos))+(pos.length>1?' are seen.':' is seen.'));
 if(neg.length)S.push(`No ${Lor(neg)} is seen.`);
 if(vi&&vi.l!=='Fully seen'){if(vi.l==='Tail obscured')S.push('The pancreatic tail is obscured by bowel gas.');else{const pt=vi.d('part').map(x=>x.toLowerCase());S.push(pt.length&&pt.length<3?`The pancreatic ${Land(pt)} ${pt.length>1?'are':'is'} obscured by bowel gas.`:'The pancreas is obscured by bowel gas.')}}
 if(ac&&!ac.n)I.push(`Features suggestive of acute pancreatitis${fl&&fl.l==='Collection'?' with peripancreatic collection':''}; correlate with serum amylase and lipase.`);
 else{const p=[];if(bulky)p.push('bulky pancreas');if(het)p.push(bulky?'heterogeneous echotexture':'heterogeneous pancreatic echotexture');let t=p.length?cap(p.join(' with ')):'';const ex=[];if(fl&&!fl.n)ex.push(fl.l==='Minimal'?'peripancreatic fluid':'peripancreatic collection');if(ft&&!ft.n)ex.push('fat stranding');if(ex.length)t=t?`${t} with ${Land(ex)}`:cap(Land(ex));if(t)I.push(t+'.')}
 return[S,I]},
spleen(G){const S=[],I=[],sz=G('size'),fo=G('focal');
 const a=sz?(sz.n?'normal in size':'enlarged')+par(sz.m,'cm'):'';
 if(a)S.push(`The spleen is ${a}${fo&&fo.n?' with no focal lesion':''}.`);else if(fo&&fo.n)S.push('No focal splenic lesion is seen.');
 if(fo&&!fo.n){const mult=fo.d('num')==='Multiple',ech=fo.d('ech'),z=fo.d('size'),loc=fo.d('loc');const adj=ech?ech.toLowerCase()+' ':'';const dim=z[0]&&z[1]?`${z[0]} × ${z[1]} cm`:z[0]?`${z[0]} cm`:'';const where=loc&&loc!=='Not specified'?` in the ${loc.toLowerCase()} of the spleen`:' in the spleen';
  S.push(mult?`Multiple ${adj}lesions are seen${where}${dim?`, the largest measuring ${dim}`:''}.`:`${/^[aeiou]/i.test(adj)?'An':'A'} ${adj}lesion${dim?` measuring ${dim}`:''} is seen${where}.`);
  I.push(ech==='Anechoic'?(mult?'Splenic cysts.':'Splenic cyst.'):(mult?'Multiple splenic focal lesions.':'Splenic focal lesion.'))}
 if(sz&&!sz.n)I.unshift('Splenomegaly.');
 return[S,I]},
kid(G){const S=[],I=[];
 const sides=['R','L'].map(k=>({k,nm:SD[k],sz:G('size',k),ec:G('echo',k),cm:G('cmd',k),ca:G('calc',k),cy:G('cyst',k),hn:G('hn',k),ur:G('ur',k)}));
 const norm=x=>['sz','ec','cm','ca','cy','hn','ur'].every(f=>x[f]&&x[f].n);
 const urD=x=>x.ur&&!x.ur.n, hnP=x=>x.hn&&!x.hn.n, caP=x=>x.ca&&!x.ca.n;
 const hw=x=>urD(x)?'hydroureteronephrosis':'hydronephrosis';
 if(sides.every(norm)){const[R,L]=sides;S.push(`Both kidneys are normal in size and parenchymal echogenicity with maintained corticomedullary differentiation${R.sz.m&&L.sz.m?` (right ${R.sz.m} cm, left ${L.sz.m} cm)`:''}. No calculus, cyst, hydronephrosis or ureteric dilatation is seen on either side.`)}
 else sides.forEach(x=>{const N=`The ${x.nm} kidney`;
  const sp=x.sz?(x.sz.l==='Normal'?'is normal in size':x.sz.l==='Enlarged'?'is enlarged':'is small in size')+par(x.sz.m,'cm'):'';
  const w=[];if(x.ec)w.push(x.ec.n?'normal parenchymal echogenicity':'raised parenchymal echogenicity');if(x.cm)w.push(x.cm.n?'maintained corticomedullary differentiation':'loss of corticomedullary differentiation');const cp=Land(w);
  if(sp&&cp)S.push(`${N} ${sp} with ${cp}.`);else if(sp)S.push(`${N} ${sp}.`);else if(cp)S.push(`${N} shows ${cp}.`);
  const tail=hnP(x)&&x.ur&&x.ur.n?'; the ureter is not dilated':'';
  if(caP(x))S.push(`A calculus${ms(x.ca.m,'mm')} is seen${x.ca.s?` in the ${x.ca.s.toLowerCase()} pole`:''}${hnP(x)?` with associated ${x.hn.l.toLowerCase()} ${hw(x)}`:''}${tail}.`);
  else if(hnP(x))S.push(`${x.hn.l} ${hw(x)} is seen${tail}.`);
  if(urD(x)&&!hnP(x))S.push(`The ${x.nm} ureter is dilated.`);
  if(x.cy&&!x.cy.n)S.push(rcyst(x));
  const neg=[];if(x.ca&&x.ca.n)neg.push('calculus');if(x.cy&&x.cy.n)neg.push('cyst');if(x.hn&&x.hn.n)neg.push('hydronephrosis');if(x.ur&&x.ur.n&&!hnP(x))neg.push('ureteric dilatation');
  if(neg.length)S.push(`No ${Lor(neg)} is seen.`)});
 const ca=sides.filter(caP),hn=sides.filter(hnP);
 const same=ca.length&&ca.length===hn.length&&ca.every(s=>hn.includes(s));
 if(same){if(ca.length===2){const g=ca[0].hn.l===ca[1].hn.l?ca[0].hn.l.toLowerCase()+' ':'';I.push(`Bilateral renal calculi with ${g}bilateral ${hw(ca[0])}.`)}else I.push(`${cap(ca[0].nm)} renal calculus with ${ca[0].hn.l.toLowerCase()} ${hw(ca[0])}.`)}
 else{if(ca.length===2)I.push('Bilateral renal calculi.');else if(ca.length)I.push(`${cap(ca[0].nm)} renal calculus.`);
  if(hn.length===2)I.push(`Bilateral ${hw(hn[0])}.`);else if(hn.length)I.push(`${hn[0].hn.l} ${hn[0].nm} ${hw(hn[0])}.`)}
 const ud=sides.filter(x=>urD(x)&&!hnP(x));if(ud.length===2)I.push('Bilateral ureteric dilatation.');else if(ud.length)I.push(`${cap(ud[0].nm)} ureteric dilatation.`);
 const re=sides.filter(x=>x.ec&&!x.ec.n),lost=sides.filter(x=>x.cm&&!x.cm.n);
 if(re.length===2){I.push(`Bilateral raised renal parenchymal echogenicity${lost.length===2?' with loss of corticomedullary differentiation':''}, suggestive of medical renal disease.`);if(lost.length===1)I.push(`Loss of ${lost[0].nm} renal corticomedullary differentiation.`)}
 else{if(lost.length===2)I.push('Bilateral loss of corticomedullary differentiation, suggestive of medical renal disease.');re.forEach(x=>{const l=lost.length===1&&lost[0]===x;I.push(`Raised ${x.nm} renal parenchymal echogenicity${l?' with loss of corticomedullary differentiation':''}.`)});if(lost.length===1&&!re.includes(lost[0]))I.push(`Loss of ${lost[0].nm} renal corticomedullary differentiation.`)}
 sides.filter(x=>x.cy&&x.cy.l==='Complex').forEach(x=>{const c=x.cy,hi=c.d('nod')==='Present'||c.d('vas')==='Present'||c.d('sept')==='Thick'||c.d('sepn')==='More than 3';I.push(`Complex ${x.nm} renal cyst${hi?' with suspicious features':''}; further evaluation with contrast-enhanced CT advised.`)});
 return[S,I]},
ub(G){const S=[],I=[],cy=G('cyst'),w=G('wall'),c=G('cont'),p=[];
 if(w&&w.n)p.push('normal wall thickness');
 if(c)p.push(c.l==='Clear'?'clear contents':c.l==='Calculus'?`a calculus${ms(c.m,'mm')}`:c.l==='Internal echoes'?'free-floating internal echoes':'echogenic internal debris');
 if(p.length||w)S.push(`The urinary bladder is well distended${p.length?' with '+Land(p):''}.`);
 const ext=w&&!w.n?w.d('ext'):null,foc=ext==='Focal',diff=w&&!w.n&&!foc;
 if(foc){const d=dim2(w.d('fs')),e=w.d('fe'),v=w.d('fv'),pr=w.d('fp'),q=[];if(v)q.push(v==='Present'?'internal vascularity':'no internal vascularity');if(pr)q.push(pr==='Present'?'a projection into the lumen':'no intraluminal projection');
  S.push(`Focal ${e?e.toLowerCase()+' ':''}wall thickening${d?` measuring ${d}`:''} is seen${q.length?', with '+Land(q):''}.`);
  I.push(v==='Present'||pr==='Present'?'Focal vascular urinary bladder wall thickening; neoplastic lesion to be excluded, cystoscopic correlation advised.':'Focal urinary bladder wall thickening; cystoscopic correlation advised.')}
 if(diff){const mx=w.d('max')[0],ct=w.d('cont'),tr=w.d('trab');S.push(`The wall is diffusely${ct==='Irregular'?' and irregularly':''} thickened${mx?`, measuring up to ${mx} mm`:''}${tr==='Present'?', with trabeculations':''}.`)}
 const ech=c&&c.l==='Internal echoes',chron=(cy&&cy.l==='Chronic cystitis')||(diff&&(w.d('trab')==='Present'||w.d('cont')==='Irregular'));
 if(chron)I.push(`Features suggestive of chronic cystitis${ech?' with free-floating internal echoes':''}.`);
 else if((cy&&cy.l==='Cystitis')||ech||diff)I.push('Features suggestive of cystitis.');
 if(c&&c.l==='Calculus')I.push('Urinary bladder calculus.');if(c&&c.l==='Debris')I.push('Echogenic debris in the urinary bladder.');
 return[S,I]},
pros(G){const S=[],I=[],sz=G('size'),ec=G('echo'),fo=G('focal');
 const a=sz?(sz.n?'normal in size':'enlarged')+(sz.m?` (volume ${sz.m} cc)`:''):'';
 const w=[];if(ec)w.push(`${ec.n?'homogeneous':'heterogeneous'} echotexture`);if(fo&&fo.n)w.push('no focal lesion');
 if(a)S.push(`The prostate is ${a}${w.length?' with '+Land(w):''}.`);else if(w.length)S.push(`The prostate shows ${Land(w)}.`);
 if(fo&&fo.l==='Cyst'){const d=dim2(fo.d('size'));S.push(`A cyst${d?` measuring ${d}`:''} is seen in the prostate.`)}
 if(fo&&fo.l==='Calcifications')S.push('Coarse prostatic calcifications are seen.');
 const p=[];if(sz&&!sz.n)p.push('prostatomegaly');if(ec&&!ec.n)p.push('heterogeneous prostatic echotexture');if(p.length)I.push(cap(p.join(' with '))+'.');
 if(fo&&fo.l==='Cyst')I.push('Prostatic cyst.');
 return[S,I]},
ut(G){const S=[],I=[],sz=G('size'),my=G('myo'),en=G('endo');
 const pma=sz&&sz.l==='PMA',bulky=sz&&sz.l==='Bulky',bd=bulky?dimN(sz.d('dim')):'';
 const ad=my&&my.l==='Adenomyosis'?my:null,ext=ad?ad.d('ext'):null,fb=my&&my.l==='Fibroid'?my:null;
 const a=sz?(pma?'small in size':sz.n?'normal in size':`bulky${bd?` (${bd})`:''}`):'';
 if(pma)S.push('The uterus is small in size with thin endometrium, suggestive of post-menopausal atrophic changes.');
 else if(ext==='Diffuse')S.push(`The uterus${a?' is '+a+' and':''} appears globular in shape, with heterogeneous myometrium and an ill-defined endometrial-myometrial junction.`);
 else if(a)S.push(`The uterus is ${a}${my&&my.n?' with normal myometrial echotexture':''}.`);else if(my&&my.n)S.push('The uterus shows normal myometrial echotexture.');
 if(ad&&ext!=='Diffuse'){const wl=ad.d('wall'),d=dim2(ad.d('sz'));S.push(ext==='Focal'?`An ill-defined heterogeneous area${d?` measuring ${d}`:''} is seen in the ${wl?wl.toLowerCase()+' ':''}myometrium, suggestive of focal adenomyosis.`:'Features of adenomyosis are seen.')}
 if(fb){const mult=fb.d('num')==='Multiple',loc=fb.d('loc').map(x=>x.toLowerCase()),typ=fb.d('typ'),fg=fb.d('figo'),d=dimN(fb.d('size'));
  const where=` in the ${loc.length?Land(loc)+' ':''}${typ?typ.toLowerCase()+' ':''}myometrium`,fx=fg?` (FIGO type ${fg})`:'';
  S.push(mult?`Multiple heterogeneous hypoechoic lesions are seen${where}${fx}${d?`, the largest measuring ${d}`:''}, suggestive of fibroids.`:`A heterogeneous hypoechoic lesion${d?` measuring ${d}`:''} is seen${where}${fx}, suggestive of a fibroid.`)}
 if(en&&!pma){const cy=!en.n&&en.d('cys')==='Present';S.push(en.n?`The endometrium is normal in thickness${par(en.m,'mm')}.`:`The endometrium is thickened${par(en.m,'mm')}${cy?', with cystic changes':''}.`)}
 const q=[];if(fb){const typ=fb.d('typ'),fg=fb.d('figo'),t=[typ&&typ.toLowerCase(),fg&&'FIGO '+fg].filter(Boolean).join(', ');q.push(`uterine fibroid${fb.d('num')==='Multiple'?'s':''}${t?` (${t})`:''}`)}
 if(ad)q.push(ext==='Diffuse'?'diffuse adenomyosis':ext==='Focal'?`focal adenomyosis${ad.d('wall')?' of the '+ad.d('wall').toLowerCase()+' wall':''}`:'adenomyosis');
 if(bulky)I.push(q.length?`Bulky uterus with ${Land(q)}.`:'Bulky uterus.');else if(q.length)I.push(cap(Land(q))+'.');
 if(en&&!en.n&&!pma)I.push(`Thickened endometrium${en.d('cys')==='Present'?' with cystic changes':''}.`);
 return[S,I]},
ov(G){const S=[],I=[],pc=G('pcom');
 if(pc&&!pc.n){const rv=pc.d('rv')[0],lv=pc.d('lv')[0];return[[`Bilateral ovaries are bulky${rv||lv?`, measuring ${rv||'—'} cc (right) and ${lv||'—'} cc (left) in volume,`:''} with peripherally arranged follicles and increased stromal echogenicity, suggestive of polycystic ovarian morphology.`],['Bilateral polycystic ovarian morphology (PCOM).']]}
 const R=G('st','R'),Lf=G('st','L');
 if(R&&Lf&&R.l==='Normal'&&Lf.l==='Normal')return[['Both ovaries are normal in size and echotexture.'],[]];
 const sent=(x,s)=>{if(x.l==='Normal')return`The ${s} ovary is normal in size and echotexture.`;if(x.l==='Not seen')return`The ${s} ovary is not visualised.`;
  const d=dim2(x.d('size')),m=d?` measuring ${d}`:'',at=` in the ${s} ovary`,q=[],P=id=>x.d(id)==='Present',A=id=>x.d(id)==='Absent',vas=x.d('vas');
  const vq=()=>{if(vas==='Absent')q.push('no internal vascularity on colour Doppler');else if(vas==='Present')q.push('internal vascularity on colour Doppler')};
  if(x.l==='PCOM')return`The ${s} ovary appears bulky${x.m?` (volume ${x.m} cc)`:''} with peripherally arranged follicles.`;
  if(x.l==='Simple cyst')return`A well-defined anechoic cystic lesion${m} is seen${at}, with posterior acoustic enhancement and no septations or solid component, suggestive of a simple cyst.`;
  if(x.l==='Hemorrhagic cyst'){if(P('ret'))q.push('fine internal reticulations');if(P('clot'))q.push('a retracting clot');if(P('deb'))q.push('internal debris');vq();return`A cystic lesion${m} is seen${at}${q.length?', with '+Land(q):''}, suggestive of a hemorrhagic cyst.`}
  if(x.l==='Chocolate cyst'){if(P('lle'))q.push('homogeneous low-level internal echoes ("ground-glass" appearance)');if(P('wf'))q.push('echogenic wall foci');vq();return`A cystic lesion${m} is seen${at}${q.length?', with '+Land(q):''}, suggestive of an endometrioma (chocolate cyst).`}
  if(x.l==='Dermoid cyst'){if(P('fat'))q.push('echogenic fat');if(P('calc'))q.push('calcification with posterior acoustic shadowing');if(P('hair'))q.push('a dermoid mesh / fat-fluid level');if(A('fat')&&A('calc'))q.push('no fat or calcification');vq();return`A heterogeneous lesion${m} is seen${at}${q.length?', with '+Land(q):''}, suggestive of a dermoid cyst.`}
  const c=x.d('cont');if(c)q.push(c==='Anechoic'?'anechoic contents':c==='Mixed'?'mixed internal contents':'low-level internal echoes');
  if(A('sep'))q.push('no septations');if(P('sep')){const n=x.d('sepn'),t=x.d('sept');q.push(`${n?(n==='More than 5'?'more than five':n.replace('–',' to '))+' ':''}${t?t.split(' ')[0].toLowerCase()+' ':''}septations`)}
  if(A('nod'))q.push('no mural nodule or solid component');if(P('nod')){const z=x.d('nsz')[0];q.push(`a mural nodule / solid component${z?` measuring ${z} mm`:''}`)}
  if(vas)q.push(vas==='Absent'?'no internal vascularity':`vascularity ${vas.toLowerCase()} on colour Doppler`);
  const out=`A complex cystic lesion${m} is seen${at}${q.length?', with '+Land(q):''}.`;return P('asc')?out+' Free fluid is seen in the pelvis.':out};
 const bothP=R&&Lf&&R.l==='PCOM'&&Lf.l==='PCOM';
 if(bothP)S.push(`Bilateral ovaries appear bulky with peripherally arranged follicles${R.m||Lf.m?` (right ovarian volume ${R.m||'—'} cc, left ovarian volume ${Lf.m||'—'} cc)`:''}.`);
 else [['R',R],['L',Lf]].forEach(([k,x])=>{if(x)S.push(sent(x,SD[k]))});
 const lab=x=>{if(x.l==='PCOM')return'polycystic ovarian morphology';if(x.l==='Simple cyst')return'simple ovarian cyst';if(x.l==='Hemorrhagic cyst')return'hemorrhagic ovarian cyst';if(x.l==='Chocolate cyst')return'ovarian endometrioma';if(x.l==='Dermoid cyst')return'ovarian dermoid cyst';return null};
 const susp=x=>x.d('nod')==='Present'||(x.d('vas')||'').startsWith('In')||(x.d('sept')||'').startsWith('Thick')||x.d('sepn')==='More than 5';
 const pos=[['right',R],['left',Lf]].filter(([,x])=>x&&!x.n);
 if(pos.length===2&&pos[0][1].l===pos[1][1].l&&pos[0][1].l!=='Complex cyst')I.push(pos[0][1].l==='PCOM'?'Bilateral polycystic ovarian morphology.':`Bilateral ${lab(pos[0][1]).replace('cyst','cysts').replace('endometrioma','endometriomas')}.`);
 else pos.forEach(([s,x])=>{if(x.l==='PCOM')I.push(`Polycystic morphology of the ${s} ovary.`);else if(x.l==='Complex cyst')I.push(`Complex ${s} ovarian cyst${susp(x)?' with suspicious features (nodule, thick septa or vascularity)':''}; further evaluation with MRI advised.`);else I.push(cap(`${s} ${lab(x)}.`))});
 return[S,I]},
bowel(G){const S=[],I=[],c=G('cal'),w=G('wall');
 if(c&&c.n&&w&&w.n)return[['Visualised bowel loops are normal in calibre with no wall thickening.'],[]];
 const wh=c&&!c.n?c.d('which').map(x=>x.split(' ')[0].toLowerCase()):[],lp=wh.length?Land(wh)+' bowel loops':'bowel loops',mx=c&&!c.n?c.d('mx')[0]:null,sg=w&&!w.n?w.d('seg').map(x=>x.toLowerCase()):[],t=w&&!w.n?w.d('t')[0]:null;
 if(c)S.push(c.n?'Visualised bowel loops are normal in calibre.':`Dilated ${lp} are seen${mx?`, measuring up to ${mx} mm`:''}.`);
 if(w)S.push(w.n?'No bowel wall thickening is seen.':`Bowel wall thickening is seen${sg.length?` involving the ${Land(sg)}`:''}${t?`, measuring up to ${t} mm`:''}.`);
 if(c&&!c.n)I.push(`Dilated ${lp}.`);
 if(w&&!w.n)I.push(`Bowel wall thickening${sg.length?` involving the ${Land(sg)}`:''}.`);
 return[S,I]},
addl(G){const S=[],I=[],a=G('appx'),hn=G('hern');
 if(a&&!a.n){const d=a.d('dia')[0],f=a.d('flu'),q=['surrounding inflammatory changes'];
  if(f&&f!=='None')q.push(f==='Minimal'?'minimal periappendiceal fluid':'a periappendiceal collection');if(a.d('edm')==='Present')q.push('reactive bowel wall edema');if(a.d('cae')==='Present')q.push('caecal wall involvement');
  const ex=[];if(a.d('cae')==='Present')ex.push('caecal involvement');if(f==='Collection')ex.push('periappendiceal collection');
  S.push(`A blind-ending tubular structure${d?` measuring ${d} mm in diameter`:''} is seen in the right iliac fossa, with ${Land(q)}.`);I.push(`Acute appendicitis${ex.length?' with '+Land(ex):''}.`)}
 if(hn&&!hn.n){const p=hn.d('pos'),ln=hn.d('line'),sd=hn.d('side'),df=hn.d('def')[0];const wh=[ln==='Paramedian'?`${sd?sd.toLowerCase()+' ':''}paramedian`:ln?'midline':'',p?p.toLowerCase():''].filter(Boolean).join(' ');
  S.push(`A defect${df?` measuring ${df} mm`:''} is seen in the ${wh?wh+' ':''}anterior abdominal wall, with herniation of abdominal contents, suggestive of a ventral hernia.`);I.push(`${cap(wh?wh+' ':'')}ventral hernia.`)}
 return[S,I]},
perit(G){const f=G('fluid');if(!f)return[[],[]];return f.n?[['No free fluid is seen in the peritoneal cavity.'],[]]:[[`${f.l} free fluid is seen in the peritoneal cavity.`],[`${f.l} ascites.`]]},
pleura(G){const S=[],I=[],R=G('eff','R'),Lf=G('eff','L'),amt=x=>x.s?x.s.toLowerCase()+' ':'';
 const p=[['right',R],['left',Lf]].filter(([,x])=>x&&!x.n);
 if(p.length===2){const same=R.s===Lf.s,t=same?`Bilateral ${amt(R)}pleural effusion`:`Bilateral pleural effusion (right ${R.s?R.s.toLowerCase():''}, left ${Lf.s?Lf.s.toLowerCase():''})`;S.push(t+' is seen.');I.push(t+'.')}
 else if(p.length){const[s,x]=p[0],o=s==='right'?Lf:R;S.push(cap(`${amt(x)}${s} pleural effusion is seen${o&&o.n?`, with no effusion on the ${s==='right'?'left':'right'}`:''}.`));I.push(cap(`${amt(x)}${s} pleural effusion.`))}
 else if(R||Lf)S.push(R&&Lf?'No pleural effusion is seen on either side.':`No ${R?'right':'left'} pleural effusion is seen.`);
 return[S,I]}
};

/* ---------- Studies (home screen) ---------- */
/* organs: ids from ORG, in report order. opts: start buttons (a sex, an approach, or Start).
   Studies without organs are listed as coming soon. */
export const STUDIES=[
 {id:'abd',n:'Whole Abdomen',d:'Liver to bladder, prostate or uterus',title:'WHOLE ABDOMEN',opts:['Male','Female'],organs:ORG.map(o=>o.id)},
 {id:'kub',n:'KUB',d:'Kidneys, ureters, bladder',title:'KUB',opts:['Start'],organs:['kid','ub','pros']},
 {id:'thy',n:'Thyroid & Neck',d:'Lobes, isthmus, nodes',opts:['Start'],organs:[]},
 {id:'scr',n:'Scrotum',d:'Testes, epididymides, cord',opts:['Start'],organs:[]},
 {id:'pel',n:'Pelvis',d:'Uterus, ovaries, adnexa',title:'PELVIS',opts:['TAS','TVS'],sex:'F',organs:['ub','pros','ut','ov','perit']},
 {id:'obs',n:'Obstetric (basic)',d:'Viability, biometry, liquor',opts:['Start'],organs:[]}
];

/* ---------- Settings defaults (editable in Settings, stored on the device) ---------- */
export const DEFAULT_SETTINGS={
 inst:'All India Institute of Medical Sciences, Guwahati',
 dept:'Department of Diagnostic & Interventional Radiology',
 addr:'Changsari, Guwahati, Assam 781101',
 resident:'',
 cons:[{name:'Dr. Pranjal Phukan',title:'Professor'},{name:'Dr. Deb. Kr. Boruah',title:'Additional Professor'},{name:'Dr. Kalyan Sarma',title:'Associate Professor'},{name:'Dr. Prince Das',title:'Assistant Professor'}],
 consSel:0,
 adv:['Clinical correlation advised.','Correlate with LFT.','Urology opinion advised.','Correlate with renal function tests.','Follow-up scan advised in 3 months.','Further evaluation with CECT abdomen advised.'],
 advSel:0
};
