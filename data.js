// Synthetic campus data: each "source" is a separate table keyed by roll number.
function rng(seed){return()=>((seed=Math.imul(seed^seed>>>15,1|seed*48271))>>>0)/4294967296||0.5}
const R=rng(42),r=(a,b)=>a+(b-a)*R(),ri=(a,b)=>Math.round(r(a,b)),cl=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const N=['Aarav','Diya','Rohan','Sneha','Vikram','Ananya','Karthik','Meera','Arjun','Isha','Rahul','Priya','Nikhil','Kavya','Siddharth','Pooja','Manish','Riya','Varun','Lakshmi'];
const L=['Reddy','Sharma','Iyer','Patel','Rao','Nair','Gupta','Singh','Kumar','Joshi'];
const DEPTS=['CSE','ECE','Mech','Civil','IT'];
const SRC={academic:[],attendance:[],lms:[],engagement:[],placement:[],skills:[],feedback:[]};
const PROFILES=[{a:.6,e:.4,p:.4},{a:.8,e:.4,p:.3},{a:.5,e:.8,p:.5},{a:.85,e:.8,p:.85},{a:.35,e:.3,p:.3}];
for(let i=1;i<=150;i++){
  const roll='R'+String(1000+i), dept=DEPTS[i%5], P=PROFILES[Math.floor(R()*5)];
  const ab=cl(P.a+r(-.2,.2),.1,1), eb=cl(P.e+r(-.2,.2),0,1), pb=cl(P.p+r(-.2,.2),0,1);
  const name=N[ri(0,19)]+' '+L[ri(0,9)];
  const miss=v=>R()<.04?null:v; // simulate missing values
  SRC.academic.push({roll,name,dept,cgpa:miss(+(4+ab*5.5).toFixed(2)),backlogs:ab<.35?ri(1,4):ab<.5?ri(0,2):0});
  SRC.attendance.push({roll,overall:miss(Math.round(cl(55+ab*40+r(-8,8),35,100)))});
  SRC.lms.push({roll,logins:miss(ri(2,30)*(.4+eb)|0),assignments:miss(Math.round(cl(40+eb*55+r(-10,10))))});
  SRC.engagement.push({roll,events:ri(0,8)*eb|0,clubs:ri(0,3)*(eb>.4)|0,hackathons:ri(0,3)*eb|0,certs:ri(0,5)*(eb+pb)/2|0});
  SRC.placement.push({roll,aptitude:miss(Math.round(cl(30+pb*65+r(-8,8)))),coding:miss(Math.round(cl(25+pb*70+r(-10,10)))),mock:miss(Math.round(cl(30+pb*60+r(-10,10))))});
  SRC.skills.push({roll,tech:miss(Math.round(cl(35+(ab+pb)*30+r(-8,8)))),soft:miss(Math.round(cl(40+(eb+pb)*28+r(-8,8))))});
  SRC.feedback.push({roll,satisfaction:miss(+cl(2+(ab+eb)*1.5+r(-.6,.6),1,5).toFixed(1))});
}
