// Turns of a life: a choice at a crossroad can move the dog to a different home.
// Each turn reuses the state the existing arcs set (adoption in engine.js, rescue in
// people-world.js, getting lost in stories.js), so later systems read it the same way.
import { changeArea } from './social.js';
import { syncContext } from './world.js';

const clamp = (v) => Math.max(0, Math.min(100, v));

export const TURNS = {
  // A street dog followed someone home and was let in.
  family: (s, { log, remember }, text) => {
    if (s.home !== 'street' || s.story?.lost) return false;
    s.home = 'family';
    changeArea(s, 'followed-home');
    syncContext(s);
    s.adoptionRoute = 'followed-home';
    s.caregiverId = 'carer-follow-' + s.areaSerial;
    if (s.environmentModel) s.environmentModel.facility = 'home';
    s.familyBond = 30;
    s.story.settleAt = s.day + 14;
    log(s, 'adopt', text);
    remember(s, 'new-home');
    return true;
  },
  // Picked up while hurt and taken somewhere safe.
  rescued: (s, { log, remember }, text) => {
    if (s.home !== 'street' || s.story?.lost) return false;
    toShelter(s, 'rescue', 'rescue-adoption');
    log(s, 'rescued-shelter', text);
    remember(s, 'rescued');
    return true;
  },
  // Caught by people clearing the street.
  caught: (s, { log, remember }, text) => {
    if (s.home !== 'street' || s.story?.lost) return false;
    toShelter(s, 'caught', 'shelter-adoption');
    log(s, 'caught-shelter', text);
    remember(s, 'caught');
    return true;
  },
  // A family dog wandered too far. The lost arc in stories.js takes it from here: searching,
  // maybe a reunion, or after about two months a life on the street.
  lost: (s, { log, remember }, text) => {
    if (s.home !== 'family' || s.story?.lost) return false;
    Object.assign(s.story, {
      lost: true,
      lostAt: s.day,
      returnHome: s.home,
      returnArea: s.areaId,
      returnFriend: { ...s.friend },
      returnContext: { ...s.worldModel.context },
      returnResource: s.worldModel.resource,
      returnCare: s.worldModel.care,
    });
    s.home = 'street';
    changeArea(s, 'lost');
    syncContext(s);
    s.stress = clamp(s.stress + 25);
    log(s, 'gate-out', text);
    remember(s, 'lost');
    return true;
  },
  // Slipped out of a shelter and did not go back.
  escaped: (s, { log, remember }, text) => {
    if (s.home !== 'shelter') return false;
    s.home = 'street';
    changeArea(s, 'escape');
    syncContext(s);
    s.caregiverId = null;
    if (s.environmentModel) s.environmentModel.facility = 'street';
    s.stress = clamp(s.stress + 15);
    log(s, 'shelter-escape', text);
    remember(s, 'escaped');
    return true;
  },
};
function toShelter(s, reason, route) {
  s.home = 'shelter';
  changeArea(s, reason);
  syncContext(s);
  s.caregiverId = `${reason}-carer-${s.areaId}`;
  if (s.environmentModel) {
    s.environmentModel.facility = 'shelter';
    s.environmentModel.route = route;
  }
}
export function applyTurn(s, turn, ctx) {
  const [kind, text] = turn;
  return TURNS[kind]?.(s, ctx, text) ?? false;
}
