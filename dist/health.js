import { euro } from './korean.js';
import { clinicalAccess, clinicVisit } from './people-world.js';
import { mix } from './world.js';
import { endCause, endDuration, END_SOURCE } from './end-of-life.js';
// Two kinds of episode. Everyday illnesses and injuries come and mostly heal (authored, not
// calibrated). A last illness begins with the life table's daily hazard and its cause follows
// the VetCompass shares (end-of-life.js); it does not heal.
// Fitted so that all deaths together (accidents, the street, last illnesses) follow the UK
// life table for family dogs (game calibration; see scripts/measure-lifespan.mjs).
export const END_HAZARD_FIT = 0.8;
// The seed is mixed first so that lives with nearby seeds do not share their unlucky days.
const dayMix = (s, salt) => mix(mix(s.seed, salt) + s.day, salt);
export function initHealth(s) {
  if (!s.medical) s.medical = { episode: null, history: [], nextEligible: 0 };
}
const TYPES = {
  nutrition: {
    cause: '먹이 부족에 따른 전신 쇠약',
    symptom: '며칠째 충분히 먹지 못했다. 걸음이 느려지고 몸을 웅크린 채 쉬는 시간이 늘었다.',
    diagnosis: '진료실에서 몸 상태를 살핀 뒤 먹이와 수분을 조금씩 보충받는다.',
  },
  dehydration: {
    cause: '수분 부족에 따른 전신 상태 악화',
    symptom: '물을 충분히 마시지 못한 날이 이어졌다. 몸이 무겁고 평소처럼 움직이기 힘들다.',
    diagnosis: '진료실에서 수분 부족을 확인하고 몸 상태에 맞춰 수분 보충과 치료를 받는다.',
  },
  digestive: {
    cause: '위장 질환 악화',
    symptom: '밥그릇에서 고개를 돌린다. 배가 불편하고 묽은 변을 본 뒤 몸을 웅크린다.',
    diagnosis:
      '진료대 위에서 배를 살피는 손길이 느껴진다. 위장 질환으로 치료와 수분 보충이 시작된다.',
  },
  respiratory: {
    cause: '호흡기 질환 악화',
    symptom: '기침 때문에 잠에서 깬다. 몸이 무겁고 숨을 고르느라 놀이를 멈춘다.',
    diagnosis: '낯선 진료실에서 가슴에 차가운 물건이 닿는다. 호흡기 질환으로 치료를 받는다.',
  },
  injury: {
    cause: '다리 부상 후 전신 상태 악화',
    symptom: '길의 깨진 틈에 발이 걸렸다. 한쪽 다리를 딛기 힘들어 걸음을 멈춘다.',
    diagnosis:
      '진료실에서 아픈 다리를 살핀다. 상처를 처치받고 움직임을 줄여야 하는 시간이 시작된다.',
  },
  cancer: {
    cause: '종양',
    symptom: '몸 한쪽에 단단한 덩어리가 만져진다. 먹는 양이 줄고 쉽게 지친다.',
    diagnosis: '진료실에서 덩어리를 살피고 검사를 받는다. 쉽게 낫지 않는 종양이라는 말이 오간다.',
  },
  joint: {
    cause: '관절·척추 질환',
    symptom: '뒷다리에 힘이 들어가지 않는다. 일어서다 주저앉고, 계단 앞에서 오래 머뭇거린다.',
    diagnosis:
      '진료실에서 다리와 허리를 살핀다. 통증을 줄이는 약과 움직임을 줄이는 돌봄이 시작된다.',
  },
  brain: {
    cause: '뇌 질환',
    symptom: '갑자기 몸이 굳고 떨렸다. 정신이 돌아온 뒤에도 한동안 멍하니 벽을 바라본다.',
    diagnosis: '진료실에서 발작을 살피는 검사를 받는다. 발작을 줄이는 약이 시작된다.',
  },
  behaviour: {
    cause: '공격성 등 행동 문제',
    symptom:
      '다가오는 손에 이를 드러내고, 가족에게도 으르렁거리는 날이 늘었다. 집 안의 긴장이 날마다 커진다.',
    diagnosis: '진료실에서 행동 상담을 받는다. 함께 지내기 위한 훈련과 약이 시작된다.',
  },
  heart: {
    cause: '심장병',
    symptom: '조금만 걸어도 숨이 가빠진다. 밤이면 마른기침에 잠을 깬다.',
    diagnosis: '진료실에서 가슴 소리를 오래 듣는다. 심장을 돕는 약을 날마다 먹게 된다.',
  },
  kidney: {
    cause: '신장 질환',
    symptom: '물그릇 앞에 자꾸 간다. 소변이 잦아지고 입에서 낯선 냄새가 난다.',
    diagnosis: '진료실에서 피와 소변을 검사한다. 신장을 돕는 밥과 수액이 시작된다.',
  },
  trauma: {
    cause: '사고로 인한 큰 외상',
    symptom: '무언가에 세게 부딪혔다. 몸을 일으키지 못한 채 낮은 소리만 낸다.',
    diagnosis: '진료실에서 다친 곳을 처치받는다. 상처가 깊어 오래 지켜봐야 한다.',
  },
  decline: {
    cause: '노년기 전신 쇠약',
    symptom: '쉬어도 기운이 잘 돌아오지 않는다. 먹는 양이 줄고 일어서는 시간이 길어진다.',
    diagnosis: '익숙한 사람이 진료실까지 안고 간다. 검사를 받은 뒤 편안히 쉬도록 돌봄을 받는다.',
  },
};
// `symptom` lets a scene describe how this episode began (a crossroad's fall or bite).
export function beginIllness(s, { log, random }, kind = null, symptom = null, terminal = false) {
  initHealth(s);
  if (s.medical.episode) return;
  const types =
    s.day >= 90 && s.home === 'street'
      ? ['injury', 'digestive', 'respiratory']
      : ['digestive', 'respiratory'];
  kind = kind || types[Math.floor(random(s) * types.length)];
  const e = (s.medical.episode = {
    kind,
    start: s.day,
    stage: 'symptoms',
    treated: false,
    supported: false,
    baseline: s.health,
    critical: false,
  });
  if (terminal) {
    e.terminal = true;
    // At least ten days from the first sign to the end; never past the 20-year limit.
    const days = Math.max(10, 5 + endDuration(kind, (dayMix(s, 2902) % 1000) / 1000));
    e.due = Math.min(s.day + days, Math.max(s.day + 10, 7299));
  }
  s.health = Math.max(5, s.health - 18);
  log(s, 'illness-onset', symptom || TYPES[e.kind].symptom);
}
export function healthChoice(s, id, log) {
  const e = s.medical?.episode;
  if (!e) return;
  e.signal = id === 'seek';
  log(
    s,
    'illness-response',
    e.signal
      ? s.home === 'street'
        ? '몸을 낮춘 채 작은 소리를 낸다. 아직 곁으로 다가오는 돌봄의 기척은 없다.'
        : '몸을 낮추고 가까운 돌봄의 기척 쪽으로 움직인다. 작은 소리를 낸다.'
      : '익숙한 자리 안쪽에 몸을 숨긴다. 움직이지 않고 쉬려 한다.',
  );
}
export function healthStep(s, { log, random, decision }, risk) {
  initHealth(s);
  let e = s.medical.episode;
  if (!e) {
    // A last illness: the life table's hazard for this age. A street pup's first months are
    // modelled in street-survival.js instead.
    const pup = s.home === 'street' && s.day < (s.reproduction?.matureAt ?? 240),
      roll = (dayMix(s, 2901) % 1000000) / 1000000;
    if (s.day >= 7280 || (!pup && roll < risk * END_HAZARD_FIT)) {
      const kind = s.day >= 7280 ? 'decline' : endCause(s, (dayMix(s, 2903) % 1000) / 1000);
      beginIllness(s, { log, random }, kind, null, true);
      return true;
    }
    if (
      s.needs?.strain >= 3 ||
      (s.day >= s.medical.nextEligible &&
        random(s) < Math.min(0.1, risk * 3 * (s.health < 40 ? 1.5 : 1)))
    ) {
      beginIllness(
        s,
        { log, random },
        s.needs?.strain >= 3 ? (s.needs.thirst > 85 ? 'dehydration' : 'nutrition') : null,
      );
      return true;
    }
    return false;
  }
  const elapsed = s.day - e.start;
  if (elapsed === 1 && s.day >= 21) {
    decision(
      s,
      'health-response',
      TYPES[e.kind].symptom +
        (s.home === 'street'
          ? ' 바람을 피하던 자리에서 움직임을 줄이고 있다.'
          : ' 익숙한 잠자리 가까이에 돌보는 사람이 있다.'),
      [
        [
          'seek',
          s.home === 'street'
            ? '움직임을 줄인 채 주변으로 작은 소리를 낸다'
            : '가까운 돌봄의 기척을 향해 알린다',
        ],
        ['rest', '익숙한 자리에 웅크리고 쉰다'],
      ],
    );
    return true;
  }
  if (elapsed >= 2 && e.stage === 'symptoms') {
    const access = clinicalAccess(s),
      human = access.human,
      care = s.worldModel.care;
    const detected = e.signal || !human || human.time + human.knowledge >= 70;
    const accessible = !s.story.lost && s.home !== 'street';
    e.supported = accessible && detected && (s.home === 'family' || random(s) < care / 100);
    e.treated = e.supported && access.available && (s.home === 'family' || random(s) < 0.75);
    e.caregiver = human?.id || null;
    e.access = access.available;
    e.stage = 'care';
    if (e.treated) {
      clinicVisit(s, 'acute-care');
      log(
        s,
        'vet-visit',
        '먹지 못하고 움직임이 줄어든 모습을 돌보는 사람이 알아챘다. 이동장 안에서 흔들림을 느끼며 병원으로 간다.',
      );
      log(s, 'vet-assessment', TYPES[e.kind].diagnosis);
    } else
      log(
        s,
        'illness-care',
        e.supported
          ? '돌보는 사람이 먹는 양과 움직임을 살피며 물과 마른 잠자리를 가까이 둔다. 아직 진료를 받지는 못했다.'
          : '아픈 채 잠자리에 머문다. 곁에서 상태를 살피거나 병원으로 데려가는 사람은 아직 없다.',
      );
    return true;
  }
  if (e.terminal) return lastIllnessStep(s, e, elapsed, log);
  if (elapsed >= 5 && e.stage === 'care') {
    // Everyday illnesses and injuries mostly heal with care (game assumption).
    // A wound heals more often than an illness, and a dog living with people is usually
    // noticed limping in the end even if no one took it to a vet.
    const recoverChance =
      e.kind === 'injury'
        ? e.treated
          ? 0.98
          : e.supported
            ? 0.92
            : s.home === 'street'
              ? 0.45
              : 0.75
        : e.treated
          ? 0.95
          : e.supported
            ? 0.8
            : 0.45;
    e.recovering = random(s) < recoverChance;
    e.stage = e.recovering ? 'recovering' : 'critical';
    e.critical = !e.recovering;
    log(
      s,
      e.recovering ? 'illness-improving' : 'illness-worsening',
      e.recovering
        ? '조금씩 물과 먹이를 받아들인다. 쉬고 나면 몸을 일으킬 힘이 돌아온다.'
        : '먹지 못하는 시간이 이어지고 일어서기 더 힘들어졌다. 주변 소리에 반응하는 힘도 줄어든다.',
    );
    s.health = Math.max(3, e.recovering ? s.health + 8 : s.health - 25);
    return true;
  }
  if (elapsed >= 7 && e.stage === 'critical') {
    e.stage = 'final-care';
    log(
      s,
      'illness-final-care',
      e.treated
        ? '상태가 나아지지 않아 다시 병원에 간다. 집중적인 치료를 받지만 몸이 잘 버티지 못한다.'
        : e.supported
          ? '돌보는 사람이 곁을 지키지만 몸은 점점 약해진다. 진료에 닿지 못한 채 밤을 보낸다.'
          : '도움을 받지 못한 채 쇠약해졌다. 몸을 움직이기 어려워 잠자리에서 시간을 보낸다.',
    );
    return true;
  }
  if (elapsed >= 10) {
    if (e.recovering) {
      s.health = Math.min(100, e.baseline);
      log(
        s,
        'illness-recovered',
        '다시 스스로 그릇 앞으로 걸어간다. 회복하는 동안 줄였던 일상을 천천히 되찾는다.',
      );
      s.medical.history.push({ ...e, end: s.day, outcome: 'recovered' });
      s.medical.episode = null;
      s.medical.nextEligible = s.day + 90;
    } else {
      s.alive = false;
      s.pending = null;
      s.cause =
        TYPES[e.kind].cause +
        (e.treated
          ? ' · 치료에도 회복하지 못함'
          : e.supported
            ? ' · 돌봄을 받았으나 진료받지 못함'
            : ' · 치료에 닿지 못함');
      s.medical.history.push({ ...e, end: s.day, outcome: 'died' });
      log(
        s,
        'death',
        `${euro(TYPES[e.kind].cause)} 기력이 다했다. ${e.supported ? '곁의 기척을 느끼며' : '몸을 누인 자리에서'} 호흡이 천천히 멎었다.`,
      );
    }
    return true;
  }
  return true;
}
// A last illness after it is found: care turns to comfort, then the end. Most dogs with people
// are put to sleep when it is time (END_SOURCE.euthanasia); the others die on their own.
function lastIllnessStep(s, e, elapsed, log) {
  if (elapsed >= 5 && e.stage === 'care') {
    e.stage = 'managed';
    e.critical = true;
    s.health = Math.max(3, s.health - 15);
    log(
      s,
      'illness-worsening',
      e.treated
        ? '진료실에서 낫기 어려운 병이라는 말이 오간다. 남은 날을 편하게 보내도록 돌봄이 바뀐다.'
        : e.supported
          ? '돌보는 사람이 밥을 잘게 나누고 잠자리를 곁으로 옮겼다. 몸은 천천히 약해진다.'
          : '아픈 몸으로 혼자 버틴다. 먹는 양이 날마다 줄어든다.',
    );
    return true;
  }
  if (e.stage === 'managed' && s.day >= e.due - 3) {
    e.stage = 'final-care';
    log(
      s,
      'illness-final-care',
      e.supported
        ? '일어서는 일이 드물어졌다. 익숙한 손이 자주 머리를 쓰다듬는다.'
        : '움직이기 어려워 잠자리에서만 시간을 보낸다.',
    );
    return true;
  }
  if (e.stage === 'final-care' && s.day >= e.due) {
    const cause = TYPES[e.kind].cause,
      shareEuth = END_SOURCE.euthanasia / (END_SOURCE.euthanasia + END_SOURCE.unassisted),
      euth = e.supported && s.home !== 'street' && (dayMix(s, 2904) % 1000) / 1000 < shareEuth;
    s.alive = false;
    s.pending = null;
    const how = euth
      ? s.home === 'shelter'
        ? '보호소 돌봄 속에서 편히 보내 줌'
        : '보호자가 곁에서 편히 보내 줌'
      : e.supported
        ? '곁의 돌봄 속에 숨을 거둠'
        : '돌봄 없이 숨을 거둠';
    s.cause = `${cause} · ${how}`;
    s.medical.history.push({ ...e, end: s.day, outcome: 'died' });
    log(
      s,
      'death',
      euth
        ? `${euro(cause)} 더는 편히 지낼 수 없게 되었다. 익숙한 손이 몸을 쓰다듬는 사이, 잠들 듯 숨이 멎었다.`
        : `${euro(cause)} 기력이 다했다. ${e.supported ? '곁의 기척을 느끼며' : '몸을 누인 자리에서'} 호흡이 천천히 멎었다.`,
    );
    return true;
  }
  return true;
}
export function validateHealth(s) {
  if (!s.medical) return;
  const m = s.medical,
    e = m.episode;
  if (
    !Array.isArray(m.history) ||
    !Number.isFinite(m.nextEligible) ||
    (e &&
      (!TYPES[e.kind] ||
        !Number.isInteger(e.start) ||
        e.start < 0 ||
        e.start > s.day ||
        !['symptoms', 'care', 'recovering', 'critical', 'final-care', 'managed'].includes(
          e.stage,
        ) ||
        (e.terminal && !Number.isFinite(e.due)) ||
        !Number.isFinite(e.baseline)))
  )
    throw Error('손상된 건강 기록');
}
