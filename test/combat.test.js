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
  assert.strictEqual(p2.hp, 100 - Game.STYLES.sokak.moves.light.damage);
  assert.strictEqual(events.filter((e) => e.type === 'hit').length, 1);
});

test('menzil disindaki yumruk isabet etmez', () => {
  const [p1, p2] = makePair(300);
  frames(30, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 100);
});

test('blok hasari engeller ve savunani geri iter', () => {
  const [p1, p2] = makePair(50);
  frames(20, p1, p2, {}, { block: true }); // parry penceresi geçsin, yerlesik blok
  const startX = p2.x;
  const events = frames(30, p1, p2, { punch: true }, { block: true });
  assert.strictEqual(p2.hp, 100);
  assert.strictEqual(events.filter((e) => e.type === 'block').length, 1);
  assert.ok(p2.x > startX, 'blok geri kaydirmali');
});

test('tam zamanli blok = PARRY: saldirgan sersemler, hasar yok', () => {
  const [p1, p2] = makePair(50);
  frames(2, p1, p2, { punch: true }); // vurus yolda
  const events = frames(30, p1, p2, {}, { block: true }); // blok tam vurus gelirken basilir
  assert.strictEqual(events.filter((e) => e.type === 'parry').length, 1);
  assert.strictEqual(p2.hp, 100);
  assert.strictEqual(p1.state, 'staggered');
});

test('kaçinma (blok+yön) i-frame verir ve vurustan kaçirir', () => {
  const [p1, p2] = makePair(50);
  const startX = p2.x;
  const events = frames(30, p1, p2, { punch: true }, { block: true, right: true });
  assert.strictEqual(events.filter((e) => e.type === 'hit').length, 0);
  assert.strictEqual(p2.hp, 100);
  assert.ok(p2.x > startX + 30, 'kaçinma adimi mesafe açmali');
});

test('güçlü vurus yere düsürür, düsen toparlanip ayaga kalkar', () => {
  const [p1, p2] = makePair(60);
  frames(30, p1, p2, { kick: true });
  assert.strictEqual(p2.hp, 100 - Game.STYLES.sokak.moves.heavy.damage);
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

// ---- Sprint 3: kosu, stiller, momentum, BLAZIN ----

// çift dokunus: bas, birak, tekrar bas
function doubleTap(f, dirKey) {
  f.update(DT, { [dirKey]: true });
  f.update(DT, {});
  f.update(DT, { [dirKey]: true });
}

test('ileri yöne çift dokunus kosu baslatir', () => {
  const [p1, p2] = makePair(400);
  doubleTap(p1, 'right');
  assert.strictEqual(p1.state, 'run');
  // kosu hizi normal yürüyüsten yüksek
  const x0 = p1.x;
  for (let i = 0; i < 30; i++) p1.update(DT, { right: true });
  const runDist = p1.x - x0;
  const w = new Game.Fighter({ name: 'W', x: 200, facing: 1, color: '#fff', accent: '#fff' });
  const wx0 = w.x;
  for (let i = 0; i < 30; i++) w.update(DT, { right: true });
  assert.ok(runDist > (w.x - wx0) * 1.5, 'kosu yürüyüsten belirgin hizli olmali');
});

test('yön birakilinca kosu biter', () => {
  const [p1] = makePair(400);
  doubleTap(p1, 'right');
  p1.update(DT, {});
  assert.strictEqual(p1.state, 'idle');
});

test('kosudan yumruk dalis yumruguna dönüsür ve yere düsürür', () => {
  const [p1, p2] = makePair(220);
  doubleTap(p1, 'right');
  // rakibe kosarak yaklas
  let guard = 0;
  while (p2.x - p1.x > 80 && guard++ < 120) frames(1, p1, p2, { right: true });
  assert.strictEqual(p1.state, 'run', 'hala kosuyor olmali');
  frames(1, p1, p2, { right: true, punch: true });
  assert.strictEqual(p1.state, 'runpunch', 'kosudan yumruk dalis yumrugu olmali');
  const events = frames(40, p1, p2);
  assert.ok(events.some((e) => e.type === 'hit'), 'dalis yumrugu isabet etmeli');
  assert.strictEqual(p2.hp, 100 - Game.ATTACKS.runpunch.damage);
  assert.ok(['down', 'getup'].includes(p2.state), 'rakip yere düsmeli');
});

test('kickbox vuruslari daha sert, güres tutusu daha agir', () => {
  const kb1 = new Game.Fighter({ name: 'K', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'kickbox' });
  const kb2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  frames(30, kb1, kb2, { punch: true });
  assert.strictEqual(kb2.hp, 100 - Math.round(Game.STYLES.kickbox.moves.light.damage * 1.3));

  const g1 = new Game.Fighter({ name: 'G', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'gures' });
  const g2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  frames(15, g1, g2, { grapple: true });
  frames(5, g1, g2, { punch: true });
  assert.strictEqual(g2.hp, 100 - Math.round(5 * 1.45));
});

test('isabet iki tarafa da momentum kazandirir (comeback)', () => {
  const [p1, p2] = makePair(50);
  frames(30, p1, p2, { punch: true });
  assert.strictEqual(p1.momentum, Game.MOMENTUM.hitGive);
  assert.strictEqual(p2.momentum, Game.MOMENTUM.hitTake);
});

test('bar dolunca BLAZIN aktive edilir, tutus özel harekete dönüsür', () => {
  const [p1, p2] = makePair(50);
  p1.momentum = 100;
  frames(2, p1, p2, { blazin: true });
  assert.ok(p1.blazinTime > 0, 'BLAZIN modu açilmali');
  const events = frames(12, p1, p2, { grapple: true });
  assert.ok(events.some((e) => e.type === 'blazinmove'), 'özel hareket tetiklenmeli');
  assert.strictEqual(p1.blazinTime, 0, 'mod tükenmeli');
  assert.ok(p2.hp <= 100 - Game.BLAZIN.grabDamage, 'büyük hasar almali');
  assert.strictEqual(p2.state, 'thrown');
});

test('BLAZIN modunda vuruslar güçlenir', () => {
  const [p1, p2] = makePair(50);
  p1.blazinTime = 5;
  frames(30, p1, p2, { punch: true });
  assert.strictEqual(p2.hp, 100 - Math.round(Game.STYLES.sokak.moves.light.damage * Game.BLAZIN.strikeMult));
});

// ---- Sprint 4.5: stil hamleleri ve kombo zinciri ----

test('isabet eden vurus toparlanmada zincire baglanir (3lü kombo)', () => {
  const [p1, p2] = makePair(50);
  const events = frames(60, p1, p2, { punch: true });
  // sokak 3 zincir: punch girisi her karede "basili" gibi degil tek kare;
  // zincir için tekrar basis gerekir -> elle besle
  let hits = events.filter((e) => e.type === 'hit').length;
  assert.strictEqual(hits, 1, 'tek basista tek vurus');

  const [a, b] = makePair(50);
  let total = [];
  // bas, kisa araliklarla tekrar bas: zincir penceresine denk gelir
  for (let i = 0; i < 5; i++) {
    total = total.concat(frames(1, a, b, { punch: true }));
    total = total.concat(frames(7, a, b));
  }
  total = total.concat(frames(40, a, b));
  const hitEvents = total.filter((e) => e.type === 'hit');
  // girdi tamponu sayesinde 5 basisin 5'i de vurusa dönüsür...
  assert.strictEqual(hitEvents.length, 5, 'tampon hiç basis yutmamali');
  // ...ama tek zincir 3'te kesilir (4. vurus yeni kombo olarak baslar)
  assert.strictEqual(Math.max(...hitEvents.map((e) => e.chain)), 2, 'zincir limiti 3 vurus');
  // hasar ölçekleme: 6+5+4 (zincir) + 6+5 (yeni zincir) = 26
  assert.strictEqual(b.hp, 100 - 26);
});

test('güres zinciri tutusa baglanir: P-P-TUT = Boga Dalisi', () => {
  const g1 = new Game.Fighter({ name: 'G', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'gures' });
  const g2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  let events = [];
  events = events.concat(frames(1, g1, g2, { punch: true }));
  events = events.concat(frames(8, g1, g2));
  events = events.concat(frames(1, g1, g2, { punch: true }));
  events = events.concat(frames(8, g1, g2));
  events = events.concat(frames(1, g1, g2, { grapple: true }));
  events = events.concat(frames(25, g1, g2));
  const grab = events.find((e) => e.type === 'grab');
  assert.ok(grab, 'zincirden tutusa baglanmali');
  assert.strictEqual(grab.comboName, 'Boga Dalisi');
  assert.strictEqual(g1.state, 'hold');
});

test('launcher rakibi havaya kaldirir, havadaki rakibe vurus baglanir', () => {
  const s1 = new Game.Fighter({ name: 'S', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'sanat' });
  const s2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  let events = frames(24, s1, s2, { kick: true }); // Dönen Tekme (launcher)
  assert.ok(events.some((e) => e.type === 'hit'), 'launcher isabet etmeli');
  events = events.concat(frames(1, s1, s2, { punch: true }));
  events = events.concat(frames(12, s1, s2));
  assert.strictEqual(events.filter((e) => e.type === 'hit').length, 2, 'hava vurusu baglanmali');
  events = events.concat(frames(70, s1, s2));
  assert.ok(['down', 'getup', 'idle'].includes(s2.state), 'juggle yere düsüsle biter');
  // hava vurusu tekme->yumruk iptaliyle ZINCIR olarak baglanir: 5 * 0.95 * 0.85 = 4
  assert.strictEqual(s2.hp, 100 - 9 - 4);
});

test('toparlanma sirasinda basilan tus tamponlanir ve atesleniyor', () => {
  const [p1, p2] = makePair(50);
  frames(1, p1, p2, { punch: true });
  frames(3, p1, p2); // hâlâ vurus animasyonunda (iskalamadi, isabetli)
  frames(1, p1, p2, { kick: true }); // toparlanmadan ÖNCE basildi
  const events = frames(40, p1, p2);
  // kick tamponda bekledi, zincir penceresinde atelendi
  assert.ok(events.some((e) => e.type === 'hit' && e.attack.name === 'Çevirme Yumruk'));
});

test('iskalayan/bloklanan vurus zincire baglanamaz', () => {
  const [a, b] = makePair(50);
  let events = [];
  for (let i = 0; i < 4; i++) {
    events = events.concat(frames(1, a, b, { punch: true }, { block: true }));
    events = events.concat(frames(7, a, b, {}, { block: true }));
  }
  events = events.concat(frames(30, a, b, {}, { block: true }));
  assert.strictEqual(events.filter((e) => e.type === 'hit').length, 0);
  assert.strictEqual(b.hp, 100);
});

test('güres özel hamlesi Suplex: hasar + pozisyon degisimi', () => {
  const g1 = new Game.Fighter({ name: 'G', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'gures' });
  const g2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  frames(15, g1, g2, { grapple: true });
  assert.strictEqual(g1.state, 'hold');
  const events = frames(5, g1, g2, { kick: true });
  assert.ok(events.some((e) => e.type === 'special' && e.name === 'Suplex'));
  assert.strictEqual(g2.hp, 100 - Game.STYLES.gures.moves.special.damage);
  assert.strictEqual(g2.state, 'down');
  assert.ok(g2.x < g1.x, 'rakip arkaya asirilmali (pozisyon degisimi)');
});

test('submission özel hamlesi Eklem Kilidi can çalar', () => {
  const s1 = new Game.Fighter({ name: 'S', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'submission' });
  const s2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  s1.hp = 60;
  frames(15, s1, s2, { grapple: true });
  frames(5, s1, s2, { kick: true });
  assert.strictEqual(s2.hp, 100 - Game.STYLES.submission.moves.special.damage);
  assert.strictEqual(s1.hp, 64, 'eklem kilidi 4 can çalmali');
  assert.strictEqual(s2.state, 'staggered');
});

test('submission alçak tekmesi yere düsürmez, sersemletir (tutusa giris)', () => {
  const s1 = new Game.Fighter({ name: 'S', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'submission' });
  const s2 = new Game.Fighter({ name: 'D', x: 460, facing: -1, color: '#fff', accent: '#fff' });
  frames(30, s1, s2, { kick: true });
  assert.strictEqual(s2.state, 'staggered');
});

test('submission tutusta can çalar', () => {
  const s1 = new Game.Fighter({ name: 'S', x: 400, facing: 1, color: '#fff', accent: '#fff', style: 'submission' });
  const s2 = new Game.Fighter({ name: 'D', x: 450, facing: -1, color: '#fff', accent: '#fff' });
  s1.hp = 50;
  frames(15, s1, s2, { grapple: true });
  frames(5, s1, s2, { punch: true });
  assert.strictEqual(s1.hp, 52, 'sallama can geri kazandirmali');
});
