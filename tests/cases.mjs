/* Test cases: each is a sequence of form actions, as a user would do them. Options are named by label.
   ['sex', 'M'|'F'] · ['name', text]
   ['pick', key, optionLabel]            tap an option chip (key 'organ.side.row', side '-', 'R' or 'L')
   ['sub', key, label]                   inline sub-choice (grade, pole, amount…)
   ['meas', key, value]                  inline measurement
   ['det', key, fieldId, label]          detail-panel choice chip
   ['detM', key, fieldId, index, value]  detail-panel measurement
   ['normal', organId] / ['rest']        "All normal" on a card / "Mark the rest normal"
   ['imp', text]                         edited impression */
export const SAMPLE=[['sex','M'],['name','R. K. Sharma'],
 ['pick','liver.-.size','Normal'],['meas','liver.-.size','14.5'],['pick','liver.-.margin','Smooth'],['pick','liver.-.hv','Normal'],
 ['pick','liver.-.echo','Diffusely increased'],['sub','liver.-.echo','II'],['pick','liver.-.focal','None'],['pick','liver.-.ihbr','Not dilated'],['pick','liver.-.pv','Normal'],
 ['pick','gb.-.dist','Well distended'],['pick','gb.-.calc','Single'],['meas','gb.-.calc','12'],['pick','gb.-.wall','Normal'],['pick','gb.-.sludge','None'],['pick','cbd.-.cal','Normal'],
 ['pick','kid.R.size','Normal'],['meas','kid.R.size','10.6'],['pick','kid.R.echo','Normal'],['pick','kid.R.cmd','Maintained'],['pick','kid.R.calc','Present'],['meas','kid.R.calc','8'],['sub','kid.R.calc','Lower'],['pick','kid.R.cyst','None'],['pick','kid.R.hn','Mild'],['pick','kid.R.ur','Not dilated'],
 ['pick','kid.L.size','Normal'],['meas','kid.L.size','10.2'],...['echo','cmd','calc','cyst','hn','ur'].map(r=>['pick','kid.L.'+r,{echo:'Normal',cmd:'Maintained',ur:'Not dilated'}[r]||'None']),
 ['pick','pros.-.size','Enlarged'],['meas','pros.-.size','42'],['pick','pros.-.echo','Homogeneous'],['pick','pros.-.focal','None']];

export const CASES=[
 {name:'empty form',ops:[]},
 {name:'sample patient (design)',ops:SAMPLE},
 {name:'sample + rest normal',ops:[...SAMPLE,['rest']]},
 {name:'all normal female',ops:[['sex','F'],['name','A Devi'],['rest']]},
 {name:'cirrhosis with portal hypertension',ops:[['name','B Kalita'],
  ['pick','liver.-.size','Normal'],['meas','liver.-.size','16'],['pick','liver.-.echo','Heterogeneous'],['pick','liver.-.margin','Nodular'],
  ['pick','liver.-.pv','Normal'],['meas','liver.-.pv','14'],['pick','liver.-.pvflow','Hepatofugal'],['meas','liver.-.pvflow','12'],
  ['pick','liver.-.hv','Altered flow'],['sub','liver.-.hv','Monophasic'],['pick','liver.-.ihbr','Dilated'],['det','liver.-.ihbr','ext','Bilobar'],['det','liver.-.ihbr','loc','Central'],['detM','liver.-.ihbr','dia',0,'5'],
  ['pick','spleen.-.size','Enlarged'],['meas','spleen.-.size','15'],['pick','perit.-.fluid','Moderate'],['rest']]},
 {name:'liver lesions',ops:[['pick','liver.-.focal','Hemangioma'],['det','liver.-.focal','num','Multiple'],['det','liver.-.focal','seg','VII'],['det','liver.-.focal','seg','VI'],['detM','liver.-.focal','size',0,'2.1'],['detM','liver.-.focal','size',1,'1.8'],
  ['pick','liver.-.hv','Dilated'],['meas','liver.-.hv','14'],['pick','liver.-.size','Enlarged'],['meas','liver.-.size','18'],['pick','liver.-.echo','Diffusely increased'],['sub','liver.-.echo','III']]},
 {name:'solid liver lesion with vessel involvement',ops:[['pick','liver.-.focal','Solid'],['det','liver.-.focal','mar','Ill-defined'],['det','liver.-.focal','ech','Hypoechoic'],['det','liver.-.focal','vas','Present'],['det','liver.-.focal','inv','Portal vein'],['det','liver.-.focal','seg','IVa'],['detM','liver.-.focal','size',0,'4'],
  ['pick','liver.-.hv','Altered flow'],['sub','liver.-.hv','Absent']]},
 {name:'liver cyst',ops:[['pick','liver.-.focal','Cyst'],['detM','liver.-.focal','size',0,'1.2'],['detM','liver.-.focal','size',1,'1.1'],['det','liver.-.focal','seg','II']]},
 {name:'gallbladder cholecystitis variants',ops:[['pick','gb.-.calc','Multiple'],['det','gb.-.calc','cnt','Few'],['detM','gb.-.calc','lg',0,'9'],['pick','gb.-.wall','Thickened'],['detM','gb.-.wall','max',0,'5'],['det','gb.-.wall','ext','Diffuse'],['det','gb.-.wall','ass','Wall edema'],['det','gb.-.wall','ass','Pericholecystic fluid'],['pick','gb.-.sludge','Present'],['pick','gb.-.dist','Well distended']]},
 {name:'gallbladder focal adenomyomatosis',ops:[['pick','gb.-.wall','Thickened'],['det','gb.-.wall','ext','Focal'],['det','gb.-.wall','comet','Present'],['pick','gb.-.calc','None']]},
 {name:'post-cholecystectomy and dilated CBD',ops:[['pick','gb.-.dist','Post-op'],['pick','cbd.-.cal','Dilated'],['meas','cbd.-.cal','9']]},
 {name:'acute pancreatitis',ops:[['pick','panc.-.acute','Yes'],['det','panc.-.size','site','Head'],['detM','panc.-.size','ap',0,'28'],['pick','panc.-.fluid','Collection'],['meas','panc.-.fluid','60'],['pick','panc.-.vis','Partly obscured'],['det','panc.-.vis','part','Tail'],['det','panc.-.vis','part','Body']]},
 {name:'bulky pancreas without pancreatitis',ops:[['pick','panc.-.size','Bulky'],['pick','panc.-.echo','Normal'],['pick','panc.-.vis','Tail obscured']]},
 {name:'spleen lesion',ops:[['pick','spleen.-.focal','Present'],['det','spleen.-.focal','ech','Anechoic'],['det','spleen.-.focal','loc','Superior pole'],['detM','spleen.-.focal','size',0,'2']]},
 {name:'kidneys bilateral',ops:[['pick','kid.R.calc','Present'],['pick','kid.L.calc','Present'],['pick','kid.R.hn','Moderate'],['pick','kid.L.hn','Moderate'],['pick','kid.R.ur','Dilated'],['pick','kid.L.ur','Dilated'],
  ['pick','kid.R.echo','Raised'],['pick','kid.L.echo','Raised'],['pick','kid.R.cmd','Lost'],['pick','kid.L.cmd','Lost'],['pick','kid.R.size','Small'],['meas','kid.R.size','8.1']]},
 {name:'kidney cysts',ops:[['pick','kid.R.cyst','Simple'],['det','kid.R.cyst','num','Multiple'],['det','kid.R.cyst','pole','Upper'],['det','kid.R.cyst','pole','Lower'],['det','kid.R.cyst','lpole','Lower pole'],['detM','kid.R.cyst','size',0,'2.1'],['detM','kid.R.cyst','size',1,'1.8'],
  ['pick','kid.L.cyst','Complex'],['det','kid.L.cyst','sep','Present'],['det','kid.L.cyst','sepn','More than 3'],['det','kid.L.cyst','sept','Thick'],['det','kid.L.cyst','nod','Absent'],['det','kid.L.cyst','ech','Internal echoes'],['pick','kid.L.ur','Dilated']]},
 {name:'bladder chronic cystitis',ops:[['pick','ub.-.cyst','Chronic cystitis'],['detM','ub.-.wall','max',0,'7'],['pick','ub.-.cont','Internal echoes']]},
 {name:'bladder focal mass',ops:[['pick','ub.-.wall','Thickened'],['det','ub.-.wall','ext','Focal'],['detM','ub.-.wall','fs',0,'2'],['detM','ub.-.wall','fs',1,'1.5'],['det','ub.-.wall','fe','Hypoechoic'],['det','ub.-.wall','fv','Present'],['det','ub.-.wall','fp','Present'],['pick','ub.-.cont','Calculus'],['meas','ub.-.cont','11']]},
 {name:'prostate cyst',ops:[['pick','pros.-.focal','Cyst'],['detM','pros.-.focal','size',0,'0.8'],['pick','pros.-.echo','Heterogeneous'],['pick','pros.-.size','Normal'],['meas','pros.-.size','18']]},
 {name:'uterus fibroid',ops:[['sex','F'],['pick','ut.-.size','Bulky'],['detM','ut.-.size','dim',0,'10'],['detM','ut.-.size','dim',1,'6'],['detM','ut.-.size','dim',2,'5'],
  ['pick','ut.-.myo','Fibroid'],['det','ut.-.myo','loc','Anterior'],['det','ut.-.myo','typ','Intramural'],['det','ut.-.myo','figo','4'],['detM','ut.-.myo','size',0,'4.2'],['detM','ut.-.myo','size',1,'3.1'],['detM','ut.-.myo','size',2,'3'],
  ['pick','ut.-.endo','Thickened'],['meas','ut.-.endo','14'],['det','ut.-.endo','cys','Present']]},
 {name:'diffuse adenomyosis',ops:[['sex','F'],['pick','ut.-.myo','Adenomyosis'],['det','ut.-.myo','ext','Diffuse'],['pick','ut.-.size','Normal']]},
 {name:'post-menopausal atrophy',ops:[['sex','F'],['pick','ut.-.size','PMA'],['pick','ut.-.endo','Normal']]},
 {name:'ovarian cysts',ops:[['sex','F'],['pick','ov.-.pcom','No'],['pick','ov.R.st','Hemorrhagic cyst'],['det','ov.R.st','clot','Present'],['detM','ov.R.st','size',0,'3'],['detM','ov.R.st','size',1,'2.5'],
  ['pick','ov.L.st','Complex cyst'],['det','ov.L.st','sep','Present'],['det','ov.L.st','sepn','3–5'],['det','ov.L.st','sept','Thick (≥ 3 mm)'],['det','ov.L.st','nod','Present'],['detM','ov.L.st','nsz',0,'8'],['det','ov.L.st','vas','In solid component'],['det','ov.L.st','asc','Present']]},
 {name:'ovaries chocolate and dermoid',ops:[['sex','F'],['pick','ov.R.st','Chocolate cyst'],['det','ov.R.st','wf','Present'],['pick','ov.L.st','Dermoid cyst'],['det','ov.L.st','fat','Present'],['det','ov.L.st','calc','Present'],['det','ov.L.st','vas','Absent']]},
 {name:'PCOM',ops:[['sex','F'],['pick','ov.R.st','Simple cyst'],['pick','ov.-.pcom','Yes'],['detM','ov.-.pcom','rv',0,'12'],['detM','ov.-.pcom','lv',0,'14']]},
 {name:'bowel, appendicitis, hernia, effusion',ops:[['pick','bowel.-.cal','Dilated'],['det','bowel.-.cal','which','Small bowel'],['detM','bowel.-.cal','mx',0,'32'],['pick','bowel.-.wall','Thickened'],['det','bowel.-.wall','seg','Terminal ileum'],['detM','bowel.-.wall','t',0,'6'],
  ['pick','addl.-.appx','Yes'],['detM','addl.-.appx','dia',0,'9'],['det','addl.-.appx','flu','Collection'],['det','addl.-.appx','edm','Present'],['det','addl.-.appx','cae','Present'],
  ['pick','addl.-.hern','Yes'],['det','addl.-.hern','pos','Paraumbilical'],['det','addl.-.hern','line','Paramedian'],['det','addl.-.hern','side','Right'],['detM','addl.-.hern','def',0,'15'],
  ['pick','pleura.R.eff','Present'],['sub','pleura.R.eff','Minimal'],['pick','pleura.L.eff','Present'],['sub','pleura.L.eff','Minimal']]},
 {name:'unilateral effusion and toggling off',ops:[['pick','pleura.R.eff','Present'],['sub','pleura.R.eff','Moderate'],['pick','pleura.L.eff','None'],['pick','perit.-.fluid','Gross'],['pick','perit.-.fluid','Gross']]},
 {name:'edited impression',ops:[...SAMPLE,['imp','Fatty liver.\nCholelithiasis.\n']]}
];
CASES.push({name:'organ all-normal on kidneys',ops:[['pick','kid.R.calc','Present'],['meas','kid.R.size','9'],['normal','kid']]});
