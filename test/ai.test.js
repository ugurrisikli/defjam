const test = require('node:test');
const assert = require('node:assert');

global.window = global;
require('../src/fighter.js');
require('../src/combat.js');
require('../src/ai.js');

const DT = 1 / 60;

// deterministik testler için tohumlu sözde-rastgele üreteç
function lcg(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function makeFighter(name, x, facing, style) {
  return new Game.Fighter({ name, x, facing, color: '#fff', accent: '#fff', style: style || 'sokak' });
}

// sahnedeki maç döngüsünün AI'li sadelestirilmis hali
function aiFrame(p1, p2, in1, in2) {
  p1.update(DT, in1);
  p2.update(DT, in2);
  if (p1.canTurn()) p1.facing = p2.x >= p1.x ? 1 : -1;
  if (p2.canTurn()) p2.facing = p1.x >= p2.x ? 1 : -1;
  Game.Combat.separate(p1, p2);
  Game.Combat.resolve(p1, p2);
  Game.Combat.resolve(p2, p1);
  Game.Combat.resolveGrab(p1, p2);
  Game.Combat.resolveGrab(p2, p1);
  if (p1.state === 'hold') Game.Combat.updateHold(p1, p2, in1);
  if (p2.state === 'hold') Game.Combat.updateHold(p2, p1, in2);
  Game.events.length = 0;
}

test('AI vs AI maçi çökmeden biter ve bir kazanan çikar', () => {
  const p1 = makeFighter('A', 320, 1, 'kickbox');
  const p2 = makeFighter('B', 640, -1, 'gures');
  const ai1 = new Game.AI(p1, { rng: lcg(7), difficulty: 0.6 });
  const ai2 = new Game.AI(p2, { rng: lcg(13), difficulty: 0.6 });
  let frames = 0;
  const max = 60 * 180; // en fazla 3 dakika simülasyon
  while (p1.hp > 0 && p2.hp > 0 && frames < max) {
    aiFrame(p1, p2, ai1.update(DT, p2), ai2.update(DT, p1));
    frames++;
  }
  assert.ok(frames < max, 'maç makul sürede bitmeli');
  assert.ok(p1.hp <= 0 || p2.hp <= 0, 'bir taraf K.O. olmali');
});

// belirli bir duruma geçis sayisini ölçer
function countTransitions(style, targetStates, seed) {
  const ai = new Game.AI(makeFighter('A', 400, 1, style), { rng: lcg(seed), difficulty: 0.6 });
  const dummy = makeFighter('D', 470, -1);
  const f = ai.f;
  let prev = f.state;
  let count = 0;
  for (let i = 0; i < 60 * 30; i++) {
    aiFrame(f, dummy, ai.update(DT, dummy), {});
    if (f.state !== prev && targetStates.includes(f.state)) count++;
    prev = f.state;
    // sayim sürsün diye dummy'yi ayakta tut
    dummy.hp = dummy.maxHp;
    if (['down', 'getup', 'ko', 'thrown', 'staggered', 'held', 'crowdhold', 'hit'].includes(dummy.state)) {
      dummy.enterState('idle');
      dummy.x = Math.min(Game.ARENA.right - 60, f.x + 70);
      dummy.y = 0;
      dummy.kvx = 0;
    }
  }
  return count;
}

test('Güres AI tutma arar, Kickbox AI vurusa yüklenir (stil kisilikleri)', () => {
  const guresGrabs = countTransitions('gures', ['grab'], 21);
  const kickboxGrabs = countTransitions('kickbox', ['grab'], 21);
  assert.ok(guresGrabs > kickboxGrabs, `güres (${guresGrabs}) kickbox'tan (${kickboxGrabs}) çok tutmali`);

  const kickboxStrikes = countTransitions('kickbox', ['punch', 'kick', 'runpunch', 'runkick'], 33);
  const guresStrikes = countTransitions('gures', ['punch', 'kick', 'runpunch', 'runkick'], 33);
  assert.ok(kickboxStrikes > guresStrikes, `kickbox (${kickboxStrikes}) güresten (${guresStrikes}) çok vurmali`);
});

test('AI bari dolunca BLAZIN modunu açar', () => {
  const f = makeFighter('A', 400, 1, 'sokak');
  const dummy = makeFighter('D', 470, -1);
  const ai = new Game.AI(f, { rng: lcg(5), difficulty: 0.6 });
  f.momentum = 100;
  let activated = false;
  for (let i = 0; i < 60 * 5 && !activated; i++) {
    aiFrame(f, dummy, ai.update(DT, dummy), {});
    if (f.blazinTime > 0) activated = true;
  }
  assert.ok(activated, 'AI 5 saniye içinde BLAZIN açmali');
});

test('AI rakip saldirilarina blokla tepki verebiliyor', () => {
  const f = makeFighter('A', 400, 1, 'sanat'); // en yüksek blok egilimi
  const attacker = makeFighter('D', 470, -1);
  const ai = new Game.AI(f, { rng: lcg(11), difficulty: 1 });
  let blocked = false;
  for (let i = 0; i < 60 * 10 && !blocked; i++) {
    const atkInput = i % 36 === 0 ? { punch: true } : {};
    aiFrame(f, attacker, ai.update(DT, attacker), atkInput);
    if (f.state === 'block') blocked = true;
    attacker.hp = attacker.maxHp;
  }
  assert.ok(blocked, 'AI en az bir kez blok yapmali');
});

test('AI tutusu degerlendirir: sallar veya firlatir', () => {
  const f = makeFighter('A', 400, 1, 'gures');
  const victim = makeFighter('D', 455, -1);
  const ai = new Game.AI(f, { rng: lcg(17), difficulty: 0.6 });
  // tutusu dogrudan baslat
  f.enterState('hold');
  f.holdStrikes = 0;
  victim.enterState('held');
  let acted = false;
  for (let i = 0; i < 60 * 2 && !acted; i++) {
    aiFrame(f, victim, ai.update(DT, victim), {});
    if (victim.hp < victim.maxHp || victim.state === 'thrown') acted = true;
  }
  assert.ok(acted, 'AI tutusta sallamali ya da firlatmali');
});
