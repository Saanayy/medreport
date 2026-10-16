/* The form: every section, row, option, sentence template and impression phrase.
   Edit here to change wording or add options.
   Option keys: v label · n normal · x clears other choices (multi rows) · s findings sentence ·
   i impression phrase · f extra fields · na rows it makes not-applicable.
   Row keys: m multi-choice · def options used by "Rest normal" · say/imp custom wording. */
import {andJoin} from './util.js';

/* ---------- Form definition (mirrors the paper form) ---------- */
const num=(k,l,u,o)=>({k,l,u,num:1,...o});
const txt=(k,l,ph,o)=>({k,l,ph,...o});
const chs=(k,l,c,o)=>({k,l,ch:c,...o});
const ab=(s,i,ph,v)=>({v:v||'Abnormal',s:s||'{t}',i:i||'{t}',f:[txt('t','Describe',ph||'Describe the finding',{req:1,wide:1})]});

export const SECS=[
{id:'liver',t:'Liver',rows:[
 {id:'size',l:'Size',o:[
  {v:'N',n:1,s:'Liver is normal in size[ (span {span} cm)]',f:[num('span','Span','cm')]},
  {v:'Enlarged',s:'Liver is enlarged[ (span {span} cm)]',i:'hepatomegaly',f:[num('span','Span','cm')]},
  {v:'Shrunken',s:'Liver is shrunken[ (span {span} cm)]',i:'shrunken liver',f:[num('span','Span','cm')]}]},
 {id:'echo',l:'Echotexture',o:[
  {v:'N',n:1,s:'Echotexture is normal'},
  {v:'Fatty',s:'Echotexture shows[ grade {g}] fatty infiltration',i:'[grade {g} ]fatty liver',f:[chs('g','Grade',['I','II','III'],{req:1})]},
  {v:'Coarse',s:'Echotexture is coarse',i:'coarse echotexture'}]},
 {id:'surf',l:'Surface / margins',o:[
  {v:'N',n:1,s:'Surface is smooth with regular margins'},
  {v:'Nodular',s:'Surface is nodular',i:'nodular surface'}]},
 {id:'fl',l:'Focal lesion',o:[
  {v:'No',n:1,s:'No focal lesion is seen'},
  {v:'Yes',s:'A[ {nat.l}] focal lesion is seen[ in segment {seg}][ measuring {size}]',i:'[{nat.l} ]focal hepatic lesion[ in segment {seg}]',f:[txt('nat','Nature','e.g. hypoechoic'),txt('seg','Segment','e.g. VI'),txt('size','Size','e.g. 2.1 × 1.8 cm')]}]},
 {id:'ihbr',l:'IHBR',o:[
  {v:'N',n:1,s:'IHBR are not dilated'},
  {v:'Dilated',s:'IHBR are dilated',i:'IHBR dilatation'}]},
 {id:'hv',l:'Hepatic veins, IVC',o:[
  {v:'N',n:1,s:'Hepatic veins and IVC are normal'},
  ab('Hepatic veins / IVC: {t}',0,'e.g. dilated hepatic veins')]},
 {id:'pv',l:'Portal vein',o:[
  {v:'N',n:1,s:'Portal vein is normal[ in calibre ({d} mm)][ with {flow.l} flow]',f:[num('d','Calibre','mm'),chs('flow','Flow',['Hepatopetal','Hepatofugal'])]},
  {v:'Abnormal',s:'Portal vein: {t}[, calibre {d} mm][, {flow.l} flow]',i:'portal vein {t}',f:[txt('t','Describe','e.g. thrombus',{req:1,wide:1}),num('d','Calibre','mm'),chs('flow','Flow',['Hepatopetal','Hepatofugal','Absent'])]}]}
]},
{id:'gb',t:'Gall bladder',rows:[
 {id:'dist',l:'Distension',o:[
  {v:'N',n:1,s:'Gall bladder is well distended'},
  {v:'Contracted',s:'Gall bladder is contracted',i:'contracted gall bladder'},
  {v:'Post-cholecystectomy',s:'Gall bladder is not visualised (post-cholecystectomy status)',i:'post-cholecystectomy status',na:['wall','lumen','pcf']}]},
 {id:'wall',l:'Wall',o:[
  {v:'N',n:1,s:'Wall thickness is normal'},
  {v:'Thick',s:'Wall is thickened[ ({mm} mm)]',i:'gall bladder wall thickening',f:[num('mm','Thickness','mm')]}]},
 {id:'lumen',l:'Lumen',m:1,o:[
  {v:'N',n:1,x:1,s:'Lumen is clear'},
  {v:'Calculus',s:'Calculus is seen in the lumen[ ({num.l})][, measuring {mm} mm]',i:'cholelithiasis',f:[chs('num','Number',['Single','Multiple']),num('mm','Largest','mm')]},
  {v:'Sludge',s:'Sludge is seen',i:'sludge'},
  {v:'Polyp',s:'A polyp is seen[ measuring {pm} mm]',i:'gall bladder polyp',f:[num('pm','Polyp','mm')]}]},
 {id:'pcf',l:'Pericholecystic fluid',o:[
  {v:'No',n:1,s:'No pericholecystic fluid'},
  {v:'Yes',s:'Pericholecystic fluid is present',i:'pericholecystic fluid'}]}
]},
{id:'cbd',t:'CBD',rows:[
 {id:'cal',l:'Calibre, lumen',m:1,o:[
  {v:'N',n:1,x:1,s:'CBD is normal in calibre[ ({mm} mm)] with a clear lumen',f:[num('mm','Calibre','mm')]},
  {v:'Dilated',s:'CBD is dilated[ ({mm} mm)]',i:'dilated CBD',f:[num('mm','Calibre','mm')]},
  {v:'Calculus',s:'Calculus is seen in the CBD',i:'choledocholithiasis'}]}
]},
{id:'panc',t:'Pancreas',rows:[
 {id:'seen',l:'Seen',m:1,def:['Head','Body','Tail'],o:[
  {v:'Head',n:1},{v:'Body',n:1},{v:'Tail',n:1},
  {v:'NV (bowel gas)',n:1,x:1,na:['echo','mpd','les']}],
  say:s=>{
   if(s.includes('NV (bowel gas)')) return 'Pancreas is not visualised due to overlying bowel gas';
   const p=['Head','Body','Tail'].filter(x=>s.includes(x));
   if(p.length===3) return 'Pancreas is visualised in entirety';
   return `Pancreatic ${andJoin(p.map(x=>x.toLowerCase()))} ${p.length>1?'are':'is'} visualised; the rest is obscured by bowel gas`;
  }},
 {id:'echo',l:'Echotexture, bulk',o:[
  {v:'N',n:1,s:'Echotexture and bulk are normal'},
  ab(0,0,'e.g. bulky, hypoechoic pancreas')]},
 {id:'mpd',l:'MPD',o:[
  {v:'N',n:1,s:'MPD is not dilated'},
  {v:'Dilated',s:'MPD is dilated[ ({mm} mm)]',i:'dilated MPD',f:[num('mm','Calibre','mm')]}]},
 {id:'les',l:'Lesion / collection',o:[
  {v:'No',n:1,s:'No focal lesion or collection'},
  ab(0,0,'e.g. peripancreatic collection','Yes')]}
]},
{id:'spl',t:'Spleen',rows:[
 {id:'size',l:'Size',o:[
  {v:'N',n:1,s:'Spleen is normal in size[ ({cm} cm)]',f:[num('cm','Size','cm')]},
  {v:'Enlarged',s:'Spleen is enlarged[ ({cm} cm)]',i:'splenomegaly',f:[num('cm','Size','cm')]}]},
 {id:'echo',l:'Echotexture, lesion',o:[
  {v:'N',n:1,s:'Echotexture is normal with no focal lesion'},
  ab(0,0,'e.g. multiple hypoechoic lesions')]},
 {id:'sv',l:'Splenic vein',o:[
  {v:'N',n:1,s:'Splenic vein is normal'},
  ab('Splenic vein: {t}','splenic vein {t}','e.g. dilated, 12 mm')]}
]},
{id:'kid',t:'Kidneys',sides:1,rows:[
 {id:'size',l:'Size',o:[
  {v:'Measured',n:1,s:'{Side} kidney measures {L} × {W} cm',f:[num('L','Length','cm',{req:1}),num('W','Width','cm',{req:1})]},
  {v:'Not seen',s:'{Side} kidney is not visualised',i:'not visualised',na:['cmd','calc','hdn','ure','les']}]},
 {id:'cmd',l:'Echo, CMD',m:1,o:[
  {v:'N',n:1,x:1,s:'Cortical echogenicity and CMD are normal'},
  {v:'↑ Echo',s:'Cortical echogenicity is raised',i:'raised cortical echogenicity'},
  {v:'CMD lost',s:'Corticomedullary differentiation is lost',i:'loss of CMD'}]},
 {id:'calc',l:'Calculus',o:[
  {v:'No',n:1,s:'No calculus'},
  {v:'Yes',s:'Calculus[ of {mm} mm] is seen[ in the {site}]',i:'calculus',f:[num('mm','Size','mm'),txt('site','Site','e.g. lower pole')]}]},
 {id:'hdn',l:'HDN',o:[
  {v:'No',n:1,s:'No hydronephrosis'},
  {v:'Mild',s:'Mild hydronephrosis',i:'mild hydronephrosis'},
  {v:'Moderate',s:'Moderate hydronephrosis',i:'moderate hydronephrosis'},
  {v:'Gross',s:'Gross hydronephrosis',i:'gross hydronephrosis'}]},
 {id:'ure',l:'Ureter',o:[
  {v:'N',n:1,s:'Ureter is not dilated'},
  {v:'Dilated',s:'Ureter is dilated[ ({t})]',i:'dilated ureter',f:[txt('t','Level / cause','e.g. up to VUJ calculus')]}]},
 {id:'les',l:'Lesion / cyst',o:[
  {v:'No',n:1,s:'No focal lesion or cyst'},
  ab(0,0,'e.g. simple cortical cyst, upper pole','Yes')]}
]},
{id:'ub',t:'Urinary bladder',short:'Bladder',rows:[
 {id:'dist',l:'Distension',o:[
  {v:'Adequate',n:1,s:'Urinary bladder is adequately distended'},
  {v:'Partial',n:1,s:'Urinary bladder is partially distended'},
  {v:'Empty',n:1,s:'Urinary bladder is empty'}]},
 {id:'wall',l:'Wall',m:1,o:[
  {v:'N',n:1,x:1,s:'Wall is normal'},
  {v:'Thick',s:'Wall is thickened[ ({mm} mm)]',i:'bladder wall thickening',f:[num('mm','Thickness','mm')]},
  {v:'Trabeculated',s:'Wall is trabeculated',i:'trabeculation'}]},
 {id:'lumen',l:'Lumen',m:1,o:[
  {v:'N',n:1,x:1,s:'Lumen is clear'},
  {v:'Calculus',s:'Calculus is seen in the lumen[ ({mm} mm)]',i:'vesical calculus',f:[num('mm','Size','mm')]},
  {v:'Mass',s:'An intraluminal mass is seen[ ({t})]',i:'intravesical mass',f:[txt('t','Details','e.g. 2 cm, left lateral wall')]},
  {v:'Debris',s:'Internal debris is seen',i:'internal debris'}]},
 {id:'pvr',l:'PVR',o:[
  {v:'Not done',n:1,s:''},
  {v:'Measured',n:1,s:'Post-void residual volume is {ml} ml',f:[num('ml','Volume','ml',{req:1})]}]}
]},
{id:'pro',t:'Prostate',sex:'M',rows:[
 {id:'vol',l:'Volume',o:[
  {v:'N',n:1,s:'Prostate is normal in size[ (volume {cc} cc)]',f:[num('cc','Volume','cc')]},
  {v:'Enlarged',s:'Prostate is enlarged[ (volume {cc} cc)]',i:'[grade {g} ]prostatomegaly',f:[num('cc','Volume','cc'),chs('g','Grade',['I','II','III','IV'])]}]},
 {id:'echo',l:'Echo, median lobe',o:[
  {v:'N',n:1,s:'Echotexture is normal with no median lobe protrusion'},
  ab(0,0,'e.g. median lobe indenting bladder base')]},
 {id:'sv',l:'Seminal vesicles',o:[
  {v:'N',n:1,s:'Seminal vesicles are normal'},
  ab('Seminal vesicles: {t}','seminal vesicles {t}')]}
]},
{id:'oth',t:'Others',sep:1,rows:[
 {id:'ff',l:'Free fluid',o:[
  {v:'No',n:1,s:'No free fluid'},
  ...['Mild','Moderate','Gross'].map(g=>({v:g,s:g+' free fluid[ in the {site}]',i:g.toLowerCase()+' free fluid[ in the {site}]',f:[txt('site','Site','e.g. pelvis')]}))]},
 {id:'ao',l:'Aorta, IVC',o:[
  {v:'N',n:1,s:'Aorta and IVC are normal'},
  ab(0,0,'e.g. infrarenal aortic aneurysm')]},
 {id:'pe',l:'Pleural effusion',m:1,o:[{v:'No',n:1,x:1},{v:'Right'},{v:'Left'}],
  say:s=>s.includes('No')?'No pleural effusion':(s.length===2?'Bilateral pleural effusion':s[0]+' pleural effusion'),
  imp:s=>s.includes('No')||!s.length?[]:[s.length===2?'bilateral pleural effusion':s[0].toLowerCase()+' pleural effusion']},
 {id:'ln',l:'Lymph nodes',o:[
  {v:'No',n:1,s:'No significant lymphadenopathy'},
  {v:'Yes',s:'Lymphadenopathy[: {t}]',i:'lymphadenopathy',f:[txt('t','Details','e.g. paraaortic, largest 12 mm SAD',{wide:1})]}]},
 {id:'bowel',l:'Bowel loops, RIF',o:[
  {v:'N',n:1,s:'Bowel loops and RIF are normal'},
  ab(0,0,'e.g. probe tenderness in RIF')]},
 {id:'misc',l:'Others',o:[
  {v:'Nil',n:1,s:''},
  ab(0,0,'Any other finding','Yes')]}
]}];

export const DOCS=[['Dr. Pranjal Phukan','Professor'],['Dr. Deb. Kr. Boruah','Additional Professor'],['Dr. Kalyan Sarma','Associate Professor'],['Dr. Prince Das','Assistant Professor']];
export const ADV=['Clinical correlation.','Correlate with LFT.','Follow-up ultrasound.','Further evaluation with CECT abdomen.','Urology consultation.'];
export const KID_IMP_ORDER=['size','calc','hdn','ure','cmd','les'];
