/* Draws the app icon (an ultrasound probe and its scan sector) and writes every size the app needs.
   Usage: NODE_PATH=<dir with sharp> node tools/make-icons.mjs */
import fs from 'node:fs';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
const out=new URL('../icons/',import.meta.url);
fs.mkdirSync(out,{recursive:true});

const CLAY='#C96442', CREAM='#FAF9F5';
const rad=d=>d*Math.PI/180;
const pt=(r,a)=>[256+r*Math.sin(rad(a)),118+r*Math.cos(rad(a))].map(v=>v.toFixed(1));
const arc=(r,a)=>{const [x1,y1]=pt(r,-a),[x2,y2]=pt(r,a);return `M${x1} ${y1}A${r} ${r} 0 0 0 ${x2} ${y2}`};
const art=(scale=1)=>{
  const [lx,ly]=pt(320,-35),[rx,ry]=pt(320,35);
  return `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
  <path d="M216 110L${lx} ${ly}A320 320 0 0 0 ${rx} ${ry}L296 110Z" fill="${CREAM}"/>
  <path d="${arc(205,29)}" fill="none" stroke="${CLAY}" stroke-opacity=".38" stroke-width="11" stroke-linecap="round"/>
  <path d="${arc(265,31)}" fill="none" stroke="${CLAY}" stroke-opacity=".38" stroke-width="11" stroke-linecap="round"/>
  <ellipse cx="298" cy="350" rx="26" ry="16" fill="${CLAY}" fill-opacity=".8"/>
  <rect x="200" y="62" width="112" height="56" rx="16" fill="${CREAM}"/>
  </g>`;
};
const svg=({scale=1,corner=0}={})=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${corner}" fill="${CLAY}"/>${art(scale)}</svg>`;

fs.writeFileSync(new URL('favicon.svg',out),svg({corner:112}));
const png=async(s,size,name)=>sharp(Buffer.from(s)).resize(size,size).png().toFile(new URL(name,out).pathname);
await png(svg({corner:112}),32,'icon-32.png');
await png(svg(),180,'apple-touch-icon.png');       // iOS rounds the corners itself
await png(svg({corner:112}),192,'icon-192.png');
await png(svg({corner:112}),512,'icon-512.png');
await png(svg({scale:.8}),512,'maskable-512.png');   // content inside the maskable safe zone
console.log('icons written');
