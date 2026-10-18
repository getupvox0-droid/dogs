// Shared authored meanings, not NLP similarity or counts of wording variants.
const d=(cause,goal,conflict,role='caregiver')=>({cause,goal,conflict,role,stage:'routine',outcomeTypes:['comfortable','adjusted']});
const social={play:d('play-invitation','play','arousal-distance','dog'),cautious:d('social-distance','avoid','pressure','dog'),curious:d('social-inspection','contact','unfamiliar-distance','dog'),food:d('food-sharing','food','resource-competition','dog'),reunion:d('familiar-contact','contact','contact-duration','dog'),territory:d('blocked-route','passage','space-access','dog'),rest:d('resting-companion','rest','contact-pressure','dog')};
const opportunities={
 'cool-floor':d('heat-relief','rest','thermal-discomfort'),'rain-entry':d('wet-body-care','care','handling'),
 'snuffle-mat':d('food-puzzle','food','food-access'),'shop-glass':d('visible-movement','avoid','visual-pressure'),
 'shop-separation':d('neighbor-separation','contact','barrier'),'shelter-cleaning':d('cleaning-route','rest','temporary-access'),
 'night-light':d('night-rest','rest','orientation'),'leave-item':d('guarded-object','explore','object-access'),
 'puddle-route':d('wet-route','explore','surface-access','environment'),'wind-fence':d('moving-barrier','avoid','movement-pressure','environment'),
 'street-bin':d('closed-food-source','food','food-access','environment'),'street-hose':d('cleaning-route','avoid','water-pressure','environment'),
 'visitor-shoes':d('visitor-contact','contact','unfamiliar-distance'),'slow-ramp':d('low-step','care','mobility'),
 'water-bowl-change':d('water-access','water','orientation'),'short-training':d('familiar-cue','contact','attention-shift')};
const threads={brush:d('body-care','care','coat-handling'),'settling-sounds':d('home-sound','rest','noise-pressure'),
 'child-boundary':d('visitor-contact','contact','unfamiliar-distance'),'water-route':d('water-access','water','human-distance','environment'),
 'shelter-rest':d('shared-rest','rest','noise-pressure'),'rural-distance':d('large-animal-distance','avoid','space-access','environment'),
 'clinic-handling':d('body-care','care','touch-pressure'),'aging-companion':d('gentle-play','play','mobility'),
 'sibling-distance':d('shared-object','play','play-pressure','sibling'),'milk-to-bowl':d('feeding-route','food','orientation','environment'),
 'harness-fit':d('body-care','care','equipment-handling'),'nail-sound':d('body-care','care','paw-handling'),
 'departure-routine':d('separation-rest','rest','human-absence'),'two-bowls':d('food-sharing','food','resource-competition','dog'),
 'post-treatment-care':d('paced-activity','care','mobility'),'summer-shade':d('heat-relief','rest','thermal-discomfort','environment')};
export function routineDescriptor(id,purpose=null){return id==='dog-meet'?social[purpose]||null:id.startsWith('situation:')?opportunities[id.slice(10)]||null:id.startsWith('thread:')?threads[id.slice(7)]||null:null;}
export function protectedDecision(id){return !id.startsWith('composed:')&&!routineDescriptor(id,id==='dog-meet'?'play':null);}
export function normalizeRoutineSemantic(meta,id){const desc=routineDescriptor(id,id==='dog-meet'?(meta.socialPurpose||meta.goal):null);return desc?{...meta,...desc,...(id==='dog-meet'?{socialPurpose:meta.socialPurpose||meta.goal}:{}),taxonomy:'routine-v1'}:meta;}
