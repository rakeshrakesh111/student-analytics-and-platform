// ---------- 1. Integrate: join all sources on roll number, impute missing values ----------
const median=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a[a.length>>1]};
function integrate(){
  const by={};
  Object.values(SRC).forEach(t=>t.forEach(row=>{by[row.roll]=Object.assign(by[row.roll]||{},row)}));
  const rows=Object.values(by);
  const fields=['cgpa','overall','logins','assignments','aptitude','coding','mock','tech','soft','satisfaction'];
  DEPTS.forEach(d=>{const g=rows.filter(x=>x.dept===d);
    fields.forEach(f=>{const m=median(g.map(x=>x[f]));g.forEach(x=>{if(x[f]==null)x[f]=m})})});
  return rows;
}
// ---------- 2. Success Score: 7 components (0-100) with weights ----------
const W={academic:.25,attendance:.15,lms:.10,engagement:.10,placement:.20,skills:.15,feedback:.05};
const LABEL={academic:'Academic',attendance:'Attendance',lms:'LMS activity',engagement:'Engagement',placement:'Placement readiness',skills:'Skills',feedback:'Feedback'};
function components(s){return{
  academic:cl(s.cgpa*10-s.backlogs*8),
  attendance:s.overall,
  lms:.5*cl(s.logins*3.3)+.5*s.assignments,
  engagement:cl(s.events*10+s.clubs*12+s.hackathons*15+s.certs*10),
  placement:.4*s.aptitude+.4*s.coding+.2*s.mock,
  skills:.6*s.tech+.4*s.soft,
  feedback:s.satisfaction*20}}
const students=integrate();
students.forEach(s=>{s.c=components(s)});
const mean={};Object.keys(W).forEach(k=>mean[k]=students.reduce((a,s)=>a+s.c[k],0)/students.length);
students.forEach(s=>{
  s.score=Math.round(Object.keys(W).reduce((a,k)=>a+W[k]*s.c[k],0));
  s.academic=Math.round(s.c.academic);s.placement=Math.round(s.c.placement);
  // Explainability: weighted gap from the campus average for each indicator
  s.drivers=Object.keys(W).map(k=>({k,v:W[k]*(s.c[k]-mean[k])})).sort((a,b)=>a.v-b.v);
  // ---------- 3. Risk flags ----------
  s.flags=[];
  if(s.c.academic<55||s.backlogs>=2||s.overall<75)s.flags.push('Academic');
  if(s.c.placement<50||s.c.skills<50)s.flags.push('Placement');
  s.risk=s.score<50||s.flags.length===2?'High':s.flags.length||s.score<60?'Medium':'Low';
  // ---------- 4. Segments ----------
  const c=s.c;
  s.segment=c.academic>=65&&c.placement<55?'High academics, low placement readiness'
    :c.academic>=65&&c.placement>=65?'Placement-ready achievers'
    :c.engagement>=55&&c.academic<55?'Engaged but struggling academically'
    :c.lms<50&&c.attendance<75?'Disengaged and slipping'
    :'Steady middle';
});
const ACTION={'High academics, low placement readiness':'Enrol in aptitude and coding bootcamp; schedule mock interviews.',
 'Placement-ready achievers':'Fast-track to company drives and mentoring roles.',
 'Engaged but struggling academically':'Pair with a peer tutor; review subject-wise marks with faculty.',
 'Disengaged and slipping':'Mentor call this week; check attendance and LMS access barriers.',
 'Steady middle':'Encourage certifications and club participation.'};
// ---------- 5. Dashboard ----------
const $=id=>document.getElementById(id);
const SEGS=[...new Set(students.map(s=>s.segment))];
let sortK='score',asc=true,sel=null;
$('dept').innerHTML='<option value="">All departments</option>'+DEPTS.map(d=>`<option>${d}</option>`).join('');
$('seg').innerHTML='<option value="">All segments</option>'+SEGS.map(d=>`<option>${d}</option>`).join('');
['q','dept','risk','seg'].forEach(id=>$(id).addEventListener('input',render));
document.querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.k;asc=sortK===k?!asc:true;sortK=k;render()}));
const bar=(l,v,cls='')=>`<div class="bar"><span>${l}</span><div class="track"><div class="fill ${cls}" style="width:${v}%"></div></div><b>${Math.round(v)}</b></div>`;
const avg=a=>a.length?Math.round(a.reduce((x,s)=>x+s.score,0)/a.length):0;
function filtered(){const q=$('q').value.toLowerCase();
  return students.filter(s=>(!q||(s.name+s.roll).toLowerCase().includes(q))&&(!$('dept').value||s.dept===$('dept').value)&&(!$('risk').value||s.risk===$('risk').value)&&(!$('seg').value||s.segment===$('seg').value))}
function render(){
  const f=filtered(),hi=f.filter(s=>s.risk==='High').length;
  $('kpis').innerHTML=[['Students',f.length,''],['Average success score',avg(f),''],['High risk',hi,'red'],
    ['Academic risk',f.filter(s=>s.flags.includes('Academic')).length,'amber'],['Placement risk',f.filter(s=>s.flags.includes('Placement')).length,'amber']]
    .map(([l,v,c])=>`<div class="kpi ${c}"><b>${v}</b><span>${l}</span></div>`).join('');
  const bins=Array(10).fill(0);f.forEach(s=>bins[Math.min(9,s.score/10|0)]++);const mx=Math.max(1,...bins);
  $('hist').innerHTML=bins.map((n,i)=>`<div class="${i<5?'low':i<6?'mid':''}" style="height:${n/mx*100}%" title="${i*10}-${i*10+9}: ${n}"><span>${n||''}</span></div>`).join('');
  $('depts').innerHTML=DEPTS.map(d=>{const a=avg(f.filter(s=>s.dept===d));return bar(d,a,a<60?'mid':'')}).join('');
  $('segs').innerHTML=SEGS.map(g=>{const n=f.filter(s=>s.segment===g).length;return `<div class="drv"><span>${g}</span><b>${n}</b></div>`}).join('');
  f.sort((a,b)=>(a[sortK]>b[sortK]?1:-1)*(asc?1:-1));
  $('count').textContent='('+f.length+')';
  $('tbl').tBodies[0].innerHTML=f.map(s=>`<tr data-r="${s.roll}" class="${sel===s.roll?'sel':''}" tabindex="0"><td>${s.name} <small class="muted">${s.roll}</small></td><td>${s.dept}</td><td><b>${s.score}</b></td><td>${s.academic}</td><td>${s.placement}</td><td><span class="tag ${s.risk}">${s.risk}</span></td><td>${s.segment}</td></tr>`).join('');
  $('tbl').tBodies[0].querySelectorAll('tr').forEach(tr=>{const open=()=>{sel=tr.dataset.r;detail(sel);render()};tr.onclick=open;tr.onkeydown=e=>e.key==='Enter'&&open()});
}
function detail(roll){
  const s=students.find(x=>x.roll===roll),d=s.drivers;
  const row=x=>`<div class="drv"><span>${LABEL[x.k]} (${Math.round(s.c[x.k])})</span><b class="${x.v<0?'neg':'pos'}">${x.v>0?'+':''}${x.v.toFixed(1)}</b></div>`;
  $('detail').innerHTML=`<h2>${s.name}</h2><p class="muted">${s.roll} · ${s.dept} · CGPA ${s.cgpa} · ${s.backlogs} backlogs · ${s.overall}% attendance</p>
  <p><b style="font-size:1.6rem;font-family:Georgia">${s.score}</b> success score <span class="tag ${s.risk}">${s.risk} risk</span></p>
  ${Object.keys(W).map(k=>bar(LABEL[k],s.c[k],s.c[k]<50?'neg':s.c[k]<65?'mid':'')).join('')}
  <h2 style="margin-top:1rem">Why this score</h2><p class="muted">Points gained or lost versus the campus average.</p>
  <b>Pulling the score down</b>${d.slice(0,3).filter(x=>x.v<0).map(row).join('')||'<div class="muted">None</div>'}
  <b>Holding the score up</b>${d.slice(-3).reverse().filter(x=>x.v>0).map(row).join('')||'<div class="muted">None</div>'}
  <p>${s.flags.length?'Flags: '+s.flags.join(' and ')+' risk.':'No risk flags.'}</p>
  <div class="act"><b>${s.segment}</b><br>${ACTION[s.segment]}</div>`;
}
$('export').onclick=()=>{
  const rows=students.filter(s=>s.risk!=='Low').map(s=>[s.roll,s.name,s.dept,s.score,s.risk,s.flags.join('+'),s.segment].map(v=>`"${v}"`).join(','));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([['Roll,Name,Dept,Score,Risk,Flags,Segment',...rows].join('\n')],{type:'text/csv'}));a.download='at-risk-students.csv';a.click()};
render();
