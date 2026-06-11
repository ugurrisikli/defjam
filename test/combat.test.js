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

// maç döngüsünün sadelestirilmis hali: update + itis + isabet/tutma çözümü
function frames(n, p1, p2, i1 = NO, i2 = NO) {
  const events = [];
  const push = (e) => { if (e) events.push(e); };
  for (let i = 0; i < n; i++) {
    p1.update(DT, i1);
    p2.update(DT, i2);
    Game.Combat.separate(p1, p2);
    push(Game.Combat.resolve(p1, p2));
    push(Game.Combat.resolve(p2, p1));
    push(Game.Combat.resolveGrab(p1, p2));
    push(Game.Combat.resolveGrab(p2, p1));
    if (p1.state === 'hold') push(Game.Combat.updateHold(p1, p2, i1));
    if (p2.state === 'hold') push(Game.Combat.updateHold(p2, p1, i2));
    for (const e of Game.events) events.push(e);
    Game.events.length = 0;
    // saldiri tuslari tek kare basilir (oyunda wasPressed), blok/yön basili kalir
    i1 = i1 === NO ? NO : { ...i1, punch: false, kick: false, grapple: false };
    i2 = i2 === NO ? NO : { ...i2, punch: false, kick: false, grapple: false };
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

// ---- Sprint 2: tutma (grapple) ve çevre ----

test('tutma blogu deler', () => {
  const [p1, p2] = makePair(50);
  const events = frames(15, p1, p2, { grapple: true }, { block: true });
  assert.strictEqual(events.filter((e) => e.type === 'grab').length, 1);
  assert.strictEqual(p1.state, 'hold');
  assert.strictEqual(p2.state, 'held');
});

test('tutusta sallama hasar verir, 3. sallamada rakip kurtulur', () => {
  const [p1, p2] = makePair(50);
  frames(15, p1, p2, { grapple: true });
  assert.strictEqual(p1.state, 'hold');
  frames(5, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 95);
  frames(5, p1, p2, { punch: true });
  frames(5, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 85);
  assert.strictEqual(p2.state, 'staggered');
  assert.strictEqual(p1.state, 'idle');
});

test('firlatilan rakip yere düser ve hasar alir', () => {
  const [p1, p2] = makePair(50);
  frames(15, p1, p2, { grapple: true });
  const events = frames(60, p1, p2, { grapple: true });
  assert.ok(events.some((e) => e.type === 'throw'), 'firlatma olayi olusmali');
  assert.ok(events.some((e) => e.type === 'land'), 'inis olayi olusmali');
  assert.strictEqual(p2.hp, 100 - Game.THROW.landDamage);
  assert.ok(p2.state === 'down' || p2.state === 'getup');
});

test('duvara firlatma daha büyük hasar verir', () => {
  const [p1, p2] = makePair(50);
  p1.x = Game.ARENA.right - 160;
  p2.x = Game.ARENA.right - 110; // duvara yakin
  frames(15, p1, p2, { grapple: true });
  const events = frames(60, p1, p2, { grapple: true });
  assert.ok(events.some((e) => e.type === 'wallslam'), 'duvar çarpmasi olusmali');
  assert.strictEqual(p2.hp, 100 - Game.THROW.wallDamage);
});

test('tutusu uzatan saldirgandan rakip kurtulur', () => {
  const [p1, p2] = makePair(50);
  frames(15, p1, p2, { grapple: true });
  const events = frames(120, p1, p2); // 1.5 sn zaman asimi
  assert.ok(events.some((e) => e.type === 'escape'));
  assert.strictEqual(p1.state, 'staggered');
});

test('kenarda sert savrulan kalabalik tarafindan tutulup geri itilir', () => {
  const [p1, p2] = makePair(50);
  p2.x = Game.ARENA.right - 8; // kalabaligin dibinde
  p1.x = p2.x - 50;
  const events = frames(60, p1, p2, { punch: true });
  assert.ok(events.some((e) => e.type === 'crowdcatch'), 'kalabalik yakalamali');
  assert.ok(events.some((e) => e.type === 'crowdshove'), 'kalabalik geri itmeli');
  assert.strictEqual(p2.state, 'staggered');
  assert.ok(p2.x < Game.ARENA.right - 10, 'arenaya dogru itilmis olmali');
});

test('havadaki rakip tutulamaz', () => {
  const [p1, p2] = makePair(50);
  p2.y = 50; // havada
  frames(12, p1, p2, { grapple: true });
  assert.notStrictEqual(p1.state, 'hold');
  assert.notStrictEqual(p2.state, 'held');
});
