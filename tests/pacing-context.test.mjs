import test from 'node:test';
import assert from 'node:assert/strict';
import {createLife,serialize,restore} from '../dist/engine.js';
import {TIME_CONFIG,playbackSpeed,readingMs} from '../dist/time-config.js';
import {beatDelay} from '../dist/story-runner.js';
import {visualFor} from '../dist/visuals.js';
test('16x is supported, restored and safe for legacy preferences',()=>{const s=createLife(82);assert.ok(TIME_CONFIG.speeds.includes(16));assert.equal(playbackSpeed(s),1);s.chronicle.preferences.speed=16;assert.equal(playbackSpeed(restore(serialize(s))),16);s.chronicle.preferences.speed=Infinity;assert.equal(playbackSpeed(s),1)});
test('maximum speed protects important and long reading, malformed speeds default safely',()=>{for(const b of [{text:'중요한 순간',important:true,waitMs:4000},{text:'긴'.repeat(180),important:false,waitMs:9000}])assert.ok(beatDelay(b,16)>=readingMs(b.text));const b={text:'짧은 일상',important:false,waitMs:8000};assert.equal(beatDelay(b,16),500);assert.equal(beatDelay(b,999),8000)});
test('current scene excludes previous homes, remote places and future records',()=>{const s=createLife(82);s.day=500;s.medical.episode=null;if(s.clinical)s.clinical.active=null;s.log=[];for(const e of [{area:'remote',home:s.home,day:500},{area:s.areaId,home:s.home==='street'?'family':'street',day:500},{area:s.areaId,home:s.home,day:501}]){s.log=[{id:'moving',...e}];assert.equal(visualFor(s).situation,'daily')}s.log=[{id:'moving',area:s.areaId,home:s.home,day:499}];assert.equal(visualFor(s).situation,'moving');s.day=505;assert.equal(visualFor(s).situation,'daily')});
