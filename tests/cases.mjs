/* Test cases: each is a sequence of form actions, as a user would do them.
   ['patient', {...}]          set patient fields
   ['pick', rowKey, option]    tap an option chip
   ['field', rowKey, k, value] type into a value field
   ['choice', rowKey, k, v]    tap a choice button (e.g. grade)
   ['rest'] / ['rest', secId]  "Mark the rest normal" (whole form / one section)
   ['set', prop, value]        impression/advice/consultant/resident/additional text */
const pt=(o={})=>['patient',{date:'2026-10-15',...o}];

export const CASES=[
  {name:'empty form', ops:[pt()]},

  {name:'all normal, male, sizes and sign-off', ops:[
    pt({name:'Ramesh Das',age:'45',cr:'2610151234',usg:'U-77',bill:'B-901',ref:'Dr. A. Sharma (Medicine)',clin:'Pain abdomen for 2 weeks'}),
    ['rest'],
    ['field','kid.size.R','L','10.2'],['field','kid.size.R','W','4.5'],
    ['field','kid.size.L','L','10.4'],['field','kid.size.L','W','4.8'],
    ['field','liver.size','span','14.2'],['field','liver.pv','d','11'],['choice','liver.pv','flow','Hepatopetal'],
    ['field','cbd.cal','mm','4'],['field','pro.vol','cc','18'],
    ['set','con','Dr. Kalyan Sarma'],['set','res','Dr. Sujay Dev']]},

  {name:'rest normal leaves kidneys needing values', ops:[pt({name:'Anil'}),['rest']]},

  {name:'chronic liver disease with portal hypertension', ops:[
    pt({name:'Bipul Kalita',age:'52',sex:'M'}),
    ['pick','liver.size','Shrunken'],['field','liver.size','span','11'],
    ['pick','liver.echo','Coarse'],['pick','liver.surf','Nodular'],
    ['pick','liver.fl','Yes'],['field','liver.fl','nat','Echogenic'],['field','liver.fl','seg','VI'],['field','liver.fl','size','2.1 × 1.8 cm'],
    ['pick','liver.pv','Abnormal'],['field','liver.pv','t','dilated'],['field','liver.pv','d','14'],['choice','liver.pv','flow','Hepatofugal'],
    ['pick','spl.size','Enlarged'],['field','spl.size','cm','15.5'],
    ['pick','spl.sv','Abnormal'],['field','spl.sv','t','dilated, 12 mm'],
    ['pick','oth.ff','Moderate'],['field','oth.ff','site','perihepatic and pelvic'],
    ['pick','oth.pe','Right'],['pick','oth.pe','Left'],
    ['pick','gb.dist','Post-cholecystectomy'],
    ['rest'],
    ['field','kid.size.R','L','10'],['field','kid.size.R','W','4.6'],['field','kid.size.L','L','10.1'],['field','kid.size.L','W','4.4'],
    ['set','adv','Correlate with LFT.'],['set','con','Dr. Pranjal Phukan']]},

  {name:'fatty liver grade, gallstones, sludge, exclusive lumen chip', ops:[
    pt({name:'Mousumi Bora',age:'38',sex:'F'}),
    ['pick','liver.echo','Fatty'],['choice','liver.echo','g','II'],
    ['pick','gb.lumen','N'],['pick','gb.lumen','Calculus'],['choice','gb.lumen','num','Multiple'],['field','gb.lumen','mm','8'],
    ['pick','gb.lumen','Sludge'],
    ['pick','gb.wall','Thick'],['field','gb.wall','mm','4.5'],
    ['pick','cbd.cal','Dilated'],['field','cbd.cal','mm','8'],['pick','cbd.cal','Calculus'],
    ['rest'],
    ['field','kid.size.R','L','9.8'],['field','kid.size.R','W','4.2'],['field','kid.size.L','L','9.9'],['field','kid.size.L','W','4.3']]},

  {name:'right hydroureteronephrosis with calculus, left normal', ops:[
    pt({name:'Hemanta',age:'30'}),
    ['field','kid.size.R','L','11.2'],['field','kid.size.R','W','5.1'],['pick','kid.size.R','Measured'],
    ['pick','kid.calc.R','Yes'],['field','kid.calc.R','mm','6'],['field','kid.calc.R','site','lower pole'],
    ['pick','kid.hdn.R','Moderate'],['pick','kid.ure.R','Dilated'],['field','kid.ure.R','t','up to VUJ calculus'],
    ['pick','kid.size.L','Measured'],['field','kid.size.L','L','10.5'],['field','kid.size.L','W','4.9'],
    ['rest','kid'],
    ['pick','ub.lumen','Calculus'],['field','ub.lumen','mm','9'],
    ['set','adv','Urology consultation.']]},

  {name:'bilateral identical renal findings', ops:[
    pt({name:'Kamal',age:'61'}),
    ['pick','kid.size.R','Measured'],['field','kid.size.R','L','8.1'],['field','kid.size.R','W','3.9'],
    ['pick','kid.size.L','Measured'],['field','kid.size.L','L','8.0'],['field','kid.size.L','W','3.8'],
    ['pick','kid.cmd.R','↑ Echo'],['pick','kid.cmd.R','CMD lost'],
    ['pick','kid.cmd.L','↑ Echo'],['pick','kid.cmd.L','CMD lost'],
    ['pick','kid.calc.R','Yes'],['pick','kid.calc.L','Yes'],
    ['rest','kid']]},

  {name:'left kidney not visualised, right size missing', ops:[
    pt({name:'Pinky',age:'27',sex:'F'}),
    ['pick','kid.size.L','Not seen'],
    ['pick','kid.hdn.R','Mild'],['pick','kid.les.R','Yes'],['field','kid.les.R','t','simple cortical cyst, upper pole'],
    ['pick','ub.dist','Partial'],['pick','ub.pvr','Measured'],['field','ub.pvr','ml','120'],
    ['pick','ub.wall','Trabeculated'],['pick','ub.lumen','Mass'],['field','ub.lumen','t','2 cm, left lateral wall']]},

  {name:'pancreas partly seen, enlarged prostate, nodes, others', ops:[
    pt({name:'Dhruba',age:'68'}),
    ['rest','panc'],['pick','panc.seen','Tail'],
    ['pick','panc.mpd','Dilated'],['field','panc.mpd','mm','5'],
    ['pick','pro.vol','Enlarged'],['field','pro.vol','cc','45'],['choice','pro.vol','g','II'],
    ['pick','pro.echo','Abnormal'],['field','pro.echo','t','median lobe indenting bladder base'],
    ['pick','oth.ln','Yes'],['field','oth.ln','t','paraaortic, largest 12 mm SAD'],
    ['pick','oth.misc','Yes'],['field','oth.misc','t','Small umbilical hernia with omental content'],
    ['pick','oth.ao','Abnormal'],['field','oth.ao','t','infrarenal aortic aneurysm, 3.4 cm'],
    ['set','add','Bowel gas limits evaluation of the retroperitoneum.']]},

  {name:'pancreas not visualised', ops:[pt({name:'X'}),['pick','panc.seen','Head'],['pick','panc.seen','NV (bowel gas)'],['rest','panc']]},

  {name:'own impression with bullets overrides suggestion', ops:[
    pt({name:'Rupa Devi',age:'44',sex:'F'}),
    ['pick','liver.size','Enlarged'],['rest'],
    ['set','imp','- Hepatomegaly\n• likely fatty liver\n\n* correlate clinically'],
    ['set','adv','Clinical correlation. Follow-up ultrasound.'],['set','res','Dr. R. Nath']]},

  {name:'sex switch hides prostate', ops:[pt({sex:'M'}),['pick','pro.vol','Enlarged'],pt({sex:'F'}),['rest','liver']]},

  {name:'toggle off a chip and required field blank', ops:[
    pt({name:'Toggle'}),['pick','liver.size','Enlarged'],['pick','liver.size','Enlarged'],
    ['pick','ub.pvr','Measured'],['pick','gb.wall','Thick'],['pick','gb.wall','N'],
    ['pick','oth.pe','No'],['pick','oth.pe','Left'],['pick','oth.pe','No']]}
];
