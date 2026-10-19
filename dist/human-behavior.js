import {mix} from './world.js';
// Human availability and stress are authored game scores, not demographic data.
const clamp=n=>Math.max(0,Math.min(100,n));
export function initHumanBehavior(s,h){
  h.life??={version:1,start:s.day,initialAgeDays:(22+mix(h.id,1901)%40)*365,lastDay:s.day,
    ageDays:(22+mix(h.id,1901)%40)*365,stress:15+mix(h.id,1902)%25,
    schedule:{offset:mix(h.id,1903)%7,workDays:h.role==='guardian'?5:4},
    activity:'rest',history:[]};
  return h.life;
}
export function humanSchedule(h,day){
  const b=h.life;if(!b)return {working:false,factor:1};
  const working=(day+b.schedule.offset)%7<b.schedule.workDays;
  // Facilities retain other-shift coverage. A day off never means no shelter care.
  return {working,factor:h.role==='guardian'?(working?.65:1):working?1:.85};
}
export function effectiveHumanTime(h,day){
  const plan=humanSchedule(h,day);
  return clamp(h.time*plan.factor*(1-(h.life?.stress||0)*.002));
}
export function humanBehaviorStep(s,h){
  const b=initHumanBehavior(s,h);if(s.day<=b.lastDay)return b;
  const end=Math.min(s.day,b.lastDay+366);
  for(let day=b.lastDay+1;day<=end;day++){
    const plan=humanSchedule(h,day),local=h.area===s.areaId;
    const caring=local&&h.id===s.caregiverId&&!s.story?.lost&&s.home!=='street';
    const medicalLoad=caring&&(s.medical?.episode||s.clinical?.active)?1:0;
    const pressure=(h.money<30?1:0)+(h.time<30?1:0)+medicalLoad;
    b.stress=clamp(b.stress+pressure+(plan.working?.25:-1.5));
    b.ageDays=b.initialAgeDays+day-b.start;
    b.activity=plan.working?(h.role==='guardian'?'work':'care-shift'):'rest';
    if(day%30===0){b.history.push({day,activity:b.activity,stress:Math.round(b.stress),area:h.area});b.history=b.history.slice(-12)}
    b.lastDay=day;
  }
  return b;
}
export function updateHumans(s){for(const h of s.humans||[])humanBehaviorStep(s,h);}
export function validateHumanBehavior(h,day){
  const b=h.life;if(!b)return;
  const validDay=n=>Number.isInteger(n)&&n>=0&&n<=day;
  if(b.version!==1||!validDay(b.start)||!validDay(b.lastDay)||b.lastDay<b.start||!Number.isFinite(b.initialAgeDays)||b.initialAgeDays<0||!Number.isFinite(b.ageDays)||b.ageDays!==b.initialAgeDays+b.lastDay-b.start||!Number.isFinite(b.stress)||b.stress<0||b.stress>100||!b.schedule||!Number.isInteger(b.schedule.offset)||b.schedule.offset<0||b.schedule.offset>6||!Number.isInteger(b.schedule.workDays)||b.schedule.workDays<0||b.schedule.workDays>7||!['rest','work','care-shift'].includes(b.activity)||!Array.isArray(b.history)||b.history.length>12||!b.history.every(x=>validDay(x.day)&&Number.isFinite(x.stress)&&x.stress>=0&&x.stress<=100&&typeof x.area==='string'&&['rest','work','care-shift'].includes(x.activity)))throw Error('손상된 인간 생활 기록');
}
