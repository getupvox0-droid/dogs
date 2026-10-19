// Wall-clock pacing never changes the day-based engine's random sequence.
export const TIME_CONFIG={dayMs:10000,speeds:[1,2,4,8,16],pollMs:100,maxCatchupDays:1,readBaseMs:2500,readCharMs:55,readMaxMs:18000};
export function readingMs(text=''){return Math.min(TIME_CONFIG.readMaxMs,Math.max(TIME_CONFIG.readBaseMs,text.length*TIME_CONFIG.readCharMs));}
export function clockState(){return {elapsed:0,last:null,speed:1};}
export function clockDays(clock,now,speed=1,blocked=false){speed=TIME_CONFIG.speeds.includes(Number(speed))?Number(speed):1;if(clock.last===null){clock.last=now;clock.speed=speed;return 0}const dt=Math.max(0,now-clock.last);clock.last=now;if(blocked){clock.elapsed=0;clock.speed=speed;return 0}if(clock.speed!==speed){clock.elapsed=0;clock.speed=speed;return 0}clock.elapsed+=Math.min(dt,1000)*speed;if(clock.elapsed<TIME_CONFIG.dayMs)return 0;clock.elapsed-=TIME_CONFIG.dayMs;return 1;}
export function importantEvent(e){return /^(eyes|ears|walking|weaning|maturity|adopt|moving|settled|reunion|companion-close|companion-parting|litter-born|child-departure|child-reunion|illness-onset|illness-worsening|illness-recovered|vet-visit|clinical-symptom|clinical-diagnosis|surgery-performed|clinical-managed|rescued-shelter|guardian-changed|shelter-return|lost-long-separation|found-intake|owner-unconfirmed|foster-start|foster-return|journey-complete|death)$/.test(e.id);}
export function readingGate(s,from){const events=s.log.slice(from).filter(e=>importantEvent(e));if(!events.length)return null;return {id:`read:${s.day}:${s.log.length}`,day:s.day,text:events.map(e=>e.text).join(' '),events:events.map(e=>e.id),minimumMs:readingMs(events.map(e=>e.text).join(' '))};}

// Normalize legacy/malformed preferences without touching simulation RNG.
export function playbackSpeed(s){const value=Number(s.chronicle.preferences.speed);return TIME_CONFIG.speeds.includes(value)?value:1;}
