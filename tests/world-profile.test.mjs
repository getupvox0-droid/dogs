import test from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advance,choose,serialize,restore} from '../dist/engine.js';
import {mix,syncContext,environmentAllows,eventWeight} from '../dist/world.js';
import {changeArea} from '../dist/social.js';
import {ensureHuman,initPeopleWorld} from '../dist/people-world.js';
import {applyWorldChange,worldProfileStep,worldAccess} from '../dist/world-profile.js';

const log=(s,id,text)=>s.log.push({day:s.day,id,text});
function run(s,to,chunk=1){while(s.alive&&s.day<to){if(s.pending)choose(s,s.pending.options[0].id);else advance(s,Math.min(chunk,to-s.day));}return s;}
function household(seed=12){const s=createLife(seed);s.home='family';s.day=300;s.caregiverId='world-test-carer';const h=ensureHuman(s,s.caregiverId,'guardian');h.area=s.areaId;h.money=h.time=60;initPeopleWorld(s);return s;}

test('10,000 birth worlds have correlated geography without counting life IDs as diversity',()=>{
  const groups={},signatures=new Set();
  for(let seed=0;seed<10000;seed++){
    const s=createLife(seed),p=s.worldModel.profile,g=p.geography;
    assert.equal(p.provenance,'authored-v4-world');assert.ok(p.birth);
    assert.deepEqual(p.birth.geography,g);
    const a=groups[g.region]??={count:0,medical:0,traffic:0};a.count++;a.medical+=g.medical;a.traffic+=g.traffic;
    signatures.add(JSON.stringify([s.country.id,s.home,s.worldModel.origin.id,g,p.society]));
    if(/coast|harbor/.test(s.worldModel.origin.id))assert.equal(g.region,'coast');
    if(/hill/.test(s.worldModel.origin.id))assert.equal(g.region,'mountain');
  }
  assert.equal(Object.keys(groups).length,5);assert.ok(signatures.size>9900);
  const avg=(r,k)=>groups[r][k]/groups[r].count;
  assert.ok(avg('urban','medical')>avg('rural','medical')+30);
  assert.ok(avg('urban','traffic')>avg('mountain','traffic')+50);
  console.log('v4 birth world sample:',JSON.stringify({sample:10000,uniqueWorldConditions:signatures.size,regions:groups}));
});
test('same seed and life identity reproduce world conditions independently of wall clock',()=>{
  assert.deepEqual(createLife(42).worldModel.profile,createLife(42).worldModel.profile);
  assert.deepEqual(createLife(42,'replay').worldModel.profile,createLife(42,'replay').worldModel.profile);
});
test('legacy saves preserve historical world, human scores, RNG and logs and only gain future state',()=>{
  const s=run(createLife(9),220);delete s.worldModel.profile;
  const log=structuredClone(s.log),humans=structuredClone(s.humans),rng=s.rng,care=s.worldModel.care,food=s.worldModel.resource;
  const r=restore(serialize(s));assert.deepEqual(r.log,log);assert.deepEqual(r.humans.map(({worldProfileArea,...h})=>h),humans.map(({worldProfileArea,...h})=>h));
  assert.equal(r.rng,rng);assert.equal(r.worldModel.care,care);assert.equal(r.worldModel.resource,food);
  assert.equal(r.worldModel.profile.birth,null);assert.equal(r.worldModel.profile.initializedDay,r.day);assert.ok(r.worldModel.profile.nextChange>r.day);
});
test('relocation changes the current locality while preserving the original birth world',()=>{
  const s=createLife(12),birth=structuredClone(s.worldModel.profile.birth),oldArea=s.areaId;
  s.day=200;changeArea(s,'test-move');syncContext(s);
  assert.notEqual(s.areaId,oldArea);assert.equal(s.worldModel.profile.area,s.areaId);
  assert.deepEqual(s.worldModel.profile.birth,birth);
  assert.ok(s.worldModel.profile.changes.some(e=>e.kind==='relocation'&&e.from===oldArea));
  assert.deepEqual(restore(serialize(s)).worldModel.profile,s.worldModel.profile);
});
test('a human work change changes real care time and daily attention rather than just prose',()=>{
  const s=household(),h=s.humans.find(h=>h.id===s.caregiverId);
  const time=h.time,attention=s.environmentModel.dailyCare.attention;
  assert.equal(applyWorldChange(s,'work-schedule',{hash:mix,log}),true);initPeopleWorld(s);
  assert.notEqual(h.time,time);assert.notEqual(s.environmentModel.dailyCare.attention,attention);
  assert.equal(s.worldModel.profile.society.careTime,h.time);
  assert.equal(s.log.at(-1).actorId,h.id);assert.equal(h.decisions.at(-1).kind,'work-schedule');assert.equal(s.pending,null);
});
test('water access and medical reach feed existing physiological and clinical access inputs',()=>{
  const s=createLife(1);s.home='street';s.day=300;
  const p=s.worldModel.profile;p.geography.water=50;const before=worldAccess(s,{food:50,water:50,medical:50});
  applyWorldChange(s,'water-access',{hash:mix,log});const after=worldAccess(s,{food:50,water:50,medical:50});assert.notEqual(after.water,before.water);
  p.geography.medical=10;const remote=worldAccess(s,{food:80,water:80,medical:80}).medical;
  p.geography.medical=90;assert.ok(worldAccess(s,{food:80,water:80,medical:80}).medical>remote);
  assert.equal(applyWorldChange(s,'household-economy',{hash:mix,log}),false);
});
test('geography constrains actual event eligibility and exploration weighting',()=>{
  const s=household();s.worldModel.context.space='garden';s.worldModel.care=90;
  s.worldModel.profile.geography.region='urban';assert.equal(environmentAllows(s,'beach'),false);
  s.worldModel.profile.geography.region='coast';assert.equal(environmentAllows(s,'beach'),true);
  s.worldModel.profile.geography.nature=5;const urban=eventWeight(s,{cat:'exploration'});
  s.worldModel.profile.geography.nature=95;assert.ok(eventWeight(s,{cat:'exploration'})>urban*2);
});
test('world changes run once per daily step and survive reload without duplicate effects',()=>{
  const s=household();s.worldModel.profile.nextChange=s.day;
  worldProfileStep(s,{hash:mix,log});const snapshot=serialize(s);
  worldProfileStep(s,{hash:mix,log});assert.equal(serialize(s),snapshot);
  const r=restore(snapshot);worldProfileStep(r,{hash:mix,log});assert.deepEqual(r.worldModel.profile,s.worldModel.profile);
});
test('daily and batched time compute identical world evolution and restored futures',()=>{
  for(const seed of [2,11,42,91]){
    const a=run(createLife(seed),850,1),b=run(createLife(seed),850,32);
    assert.deepEqual(a,b);const c=restore(serialize(a));run(a,1500);run(c,1500);assert.deepEqual(a,c);
  }
});
test('malformed world profiles are rejected rather than silently regenerated',()=>{
  for(const modify of [p=>p.geography.traffic=NaN,p=>p.geography.region='ocean',p=>p.society.economy=-3,p=>p.changes=[{day:99999,kind:'fake',area:'x'}],p=>p.version=4]){
    const s=createLife(5);modify(s.worldModel.profile);assert.throws(()=>restore(serialize(s)),/세계 프로필/);
  }
});
