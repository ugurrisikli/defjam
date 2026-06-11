const test = require('node:test');
const assert = require('node:assert');

global.window = global;
require('../src/fighter.js');
require('../src/combat.js');

const DT = 1 / 60;
const NO = {};

function makePair(dist = 50) {
  const p1 = new Game.Fighter({ name: 'P1', x: 400, facing: 1, color: '#fff', accent: '#fff' });
  const p2 = new Game.Fighter({ name: 'P2', x: 400 + dist, facing: -1, color: '#fff', accent: '#fff' });
  return [p1, p2];
}

// maç döngüsünün sadelestirilmis hali: update + itis + isabet çözümü
function frames(n, p1, p2, i1 = NO, i2 = NO) {
  const events = [];
  for (let i = 0; i < n; i++) {
    p1.update(DT, i1);
    p2.update(DT, i2);
    Game.Combat.separate(p1, p2);
    const e1 = Game.Combat.resolve(p1, p2);
    const e2 = Game.Combat.resolve(p2, p1);
    if (e1) events.push(e1);
    if (e2) events.push(e2);
    // saldiri tuslari tek kare basilir (oyunda wasPressed), blok/yön basili kalir
    i1 = i1 === NO ? NO : { ...i1, punch: false, kick: false };
    i2 = i2 === NO ? NO : { ...i2, punch: false, kick: false };
  }
  return events;
}

test('menzildeki yumruk bir kez hasar verir', () => {
  const [p1, p2] = makePair(50);
  const events = frames(30, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 100 - Game.ATTACKS.punch.damage);
  assert.strictEqual(events.filter((e) => e.type === 'hit').length, 1);
});

test('menzil disindaki yumruk isabet etmez', () => {
  const [p1, p2] = makePair(300);
  frames(30, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 100);
});

test('blok hasari engeller ve savunani geri iter', () => {
  const [p1, p2] = makePair(50);
  const startX = p2.x;
  const events = frames(30, p1, p2, { punch: true }, { block: true });
  assert.strictEqual(p2.hp, 100);
  assert.strictEqual(events.filter((e) => e.type === 'block').length, 1);
  assert.ok(p2.x > startX, 'blok geri kaydirmali');
});

test('tekme yere düsürür, düsen toparlanip ayaga kalkar', () => {
  const [p1, p2] = makePair(60);
  frames(30, p1, p2, { kick: true });
  assert.strictEqual(p2.hp, 100 - Game.ATTACKS.kick.damage);
  assert.strictEqual(p2.state, 'down');
  frames(120, p1, p2); // 2 sn: down (0.9) + getup (0.35) biter
  assert.strictEqual(p2.state, 'idle');
});

test('yerdeki rakibe vurulamaz', () => {
  const [p1, p2] = makePair(60);
  frames(30, p1, p2, { kick: true });
  assert.strictEqual(p2.state, 'down');
  const hpAfterKnockdown = p2.hp;
  frames(20, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, hpAfterKnockdown);
});

test('can sifirlaninca K.O. olur', () => {
  const [p1, p2] = makePair(50);
  p2.hp = 5;
  frames(30, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 0);
  assert.strictEqual(p2.state, 'ko');
});

test('saldirgan rakibinin sirtina vuramaz', () => {
  const [p1, p2] = makePair(50);
  p1.facing = -1; // rakip sagda ama sola bakiyor
  p1.startAttack('punch');
  frames(30, p1, p2);
  assert.strictEqual(p2.hp, 100);
});

test('gövde itisi üst üste binmeyi engeller', () => {
  const [p1, p2] = makePair(10);
  frames(5, p1, p2);
  assert.ok(Math.abs(p2.x - p1.x) >= 39, 'aralarinda en az ~40px olmali');
});

test('hazirlik karelerinde isabet olmaz (startup penceresi)', () => {
  const [p1, p2] = makePair(50);
  frames(3, p1, p2, { punch: true }); // yumruk startup = 4 kare
  assert.strictEqual(p2.hp, 100);
});
