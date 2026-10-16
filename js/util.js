/* Small text helpers shared by the schema, engine and UI. */
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
export const lc1=s=>(s&&/^[A-Z][a-z]/.test(s))?s.charAt(0).toLowerCase()+s.slice(1):s;
export const andJoin=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
export const sent=t=>{t=cap(String(t).trim());return t?t.replace(/[\s.]*$/,'.'):''};
