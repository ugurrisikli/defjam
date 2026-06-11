window.Game = window.Game || {};

// ============================================================
// KEYFRAME ANIMASYON MOTORU
// Iskelet = ~20 sayisal kanal. Her hareket bir "klip": anahtar
// pozlar + easing. Saldiri klipleri frame-data'ya senkron örneklenir
// (hazirlik = gerilme, temas = outBack tasmasi, toparlanma = sönüm).
// State degisimlerinde pozlar 85 ms harmanlanir: ani atlama yok.
// ============================================================
//
// Kanal düzeni (gövde uzayi, +x = bakis yönü):
//  t: gövde dönmesi (rad)   cr: çömelme (px, asagi)
//  fae/faf: ön kol dirsek/el  [x, shoulderY'ye göre y]
//  bae/baf: arka kol
//  flk/blk: ön/arka diz [x, hipY'ye göre y]   flf/blf: ayak [x, y(0=zemin)]
//  fh/bh: el tipi 'fist'|'palm'|'claw'

Game.Anim = (function () {
  const EASE = {
    lin: (u) => u,
    in: (u) => u * u,
    out: (u) => 1 - (1 - u) * (1 - u),
    outBack: (u) => { const c = 1.6, v = u - 1; return 1 + (c + 1) * v * v * v + c * v * v; },
  };

  const NUM = ['t', 'cr'];
  const VEC = ['fae', 'faf', 'bae', 'baf', 'flk', 'blk', 'flf', 'blf'];

  function clone(p) {
    const o = { t: p.t, cr: p.cr, fh: p.fh, bh: p.bh };
    for (const k of VEC) o[k] = [p[k][0], p[k][1]];
    return o;
  }

  function mix(a, b, u) {
    const o = { fh: u > 0.4 ? b.fh : a.fh, bh: u > 0.4 ? b.bh : a.bh };
    for (const k of NUM) o[k] = a[k] + (b[k] - a[k]) * u;
    for (const k of VEC) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * u, a[k][1] + (b[k][1] - a[k][1]) * u];
    return o;
  }

  // ---- POZ KÜTÜPHANESI ----
  // Taban gard pozlari (stile özgü durus kimligi)
  const GUARD = {
    sokak: {
      t: 0, cr: 0, fh: 'fist', bh: 'fist',
      bae: [20, 22], baf: [30, 8], fae: [16, 28], faf: [34, 18],
      flk: [10, 26], flf: [14, 0], blk: [2, 26], blf: [-12, 0],
    },
    kickbox: {
      t: 0, cr: 2, fh: 'fist', bh: 'fist',
      bae: [14, 22], baf: [24, 2], fae: [18, 24], faf: [28, 6],
      flk: [12, 26], flf: [16, 0], blk: [0, 26], blf: [-12, 0],
    },
    gures: {
      t: 0.06, cr: 9, fh: 'palm', bh: 'palm',
      bae: [22, 20], baf: [34, 22], fae: [18, 28], faf: [36, 32],
      flk: [14, 26], flf: [22, 0], blk: [-2, 26], blf: [-20, 0],
    },
    sanat: {
      t: -0.04, cr: 0, fh: 'palm', bh: 'fist',
      bae: [-2, 22], baf: [-10, 30], fae: [22, 14], faf: [42, 10],
      flk: [8, 26], flf: [10, 0], blk: [2, 26], blf: [-10, 0],
    },
    submission: {
      t: 0.08, cr: 6, fh: 'claw', bh: 'claw',
      bae: [16, 24], baf: [28, 28], fae: [20, 30], faf: [34, 22],
      flk: [12, 26], flf: [18, 0], blk: [0, 26], blf: [-16, 0],
    },
  };

  // kismi pozu gard üstüne bindir
  function P(style, part) {
    const o = clone(GUARD[style] || GUARD.sokak);
    for (const k in part) o[k] = Array.isArray(part[k]) ? [part[k][0], part[k][1]] : part[k];
    return o;
  }

  // Yürüyüs kimligi: adim boyu / ayak kaldirma / gövde zipi / kol salinimi
  const GAIT = {
    sokak: { stride: 1, lift: 1, bob: 1, arm: 1 },
    kickbox: { stride: 0.9, lift: 1.2, bob: 1.5, arm: 0.6 }, // seker
    gures: { stride: 0.75, lift: 0.6, bob: 0.5, arm: 1.2 }, // agir basar
    sanat: { stride: 1.15, lift: 0.8, bob: 0.4, arm: 0.5 }, // süzülür
    submission: { stride: 0.85, lift: 0.8, bob: 0.8, arm: 0.9 },
  };

  // ---- VURUS KLIPLERI: {ant: gerilme pozu, hit: temas pozu} ----
  const STRIKE = {
    sokak: {
      light: { // Direkt: omuzdan düz yumruk
        ant: (s) => P(s, { t: -0.08, bae: [22, 20], baf: [30, 10], fae: [4, 26], faf: [-2, 22] }),
        hit: (s) => P(s, { t: 0.12, fae: [26, 12], faf: [72, 10], bae: [16, 22], baf: [22, 14] }),
      },
      heavy: { // Çevirme Yumruk: genis kavisli kanca, gövde pivotu
        ant: (s) => P(s, { t: -0.22, fae: [-6, 18], faf: [-18, 6], bae: [18, 20], baf: [26, 12] }),
        hit: (s) => P(s, { t: 0.34, fae: [30, -4], faf: [62, -12], bae: [4, 20], baf: [-6, 12], flk: [16, 24], flf: [24, 0] }),
      },
    },
    kickbox: {
      light: { // Hizli Diz: diz göguse, kollar klinç
        ant: (s) => P(s, { t: 0.06, fae: [22, 8], faf: [34, 14], bae: [18, 8], baf: [30, 16] }),
        hit: (s) => P(s, { t: 0.14, fae: [26, 16], faf: [40, 26], bae: [22, 14], baf: [36, 24], flk: [28, -8], flf: [22, -34], cr: 4 }),
      },
      heavy: { // Palet Tekme: yüksek roundhouse, gövde geriye yatar
        ant: (s) => P(s, { t: 0.10, flk: [10, 20], flf: [6, -8], bae: [10, 20], baf: [18, 6] }),
        hit: (s) => P(s, { t: -0.30, flk: [34, -8], flf: [76, -58], fae: [6, 22], faf: [12, 34], bae: [-16, 14], baf: [-30, 2] }),
      },
    },
    gures: {
      light: { // Agir Tokat: açik el genis savruluş
        ant: (s) => P(s, { t: -0.16, fae: [-2, 12], faf: [-12, 2], fh: 'palm' }),
        hit: (s) => P(s, { t: 0.26, fae: [28, 4], faf: [64, 6], fh: 'palm', bae: [14, 22], baf: [22, 16] }),
      },
      heavy: { // Omuz Sarji: kollar kenetli dalis
        ant: (s) => P(s, { t: -0.12, cr: 14, fae: [12, 18], faf: [20, 26], bae: [10, 20], baf: [18, 28] }),
        hit: (s) => P(s, { t: 0.42, cr: 8, fae: [26, 16], faf: [38, 20], bae: [22, 20], baf: [34, 24], flk: [22, 20], flf: [32, 0], blk: [-10, 22], blf: [-26, 0] }),
      },
    },
    sanat: {
      light: { // Yildirim Vurus: minimal gerilme, jilet gibi düz
        ant: (s) => P(s, { fae: [14, 14], faf: [20, 12] }),
        hit: (s) => P(s, { t: 0.10, fae: [28, 10], faf: [74, 8], fh: 'fist', bae: [-4, 20], baf: [-14, 26] }),
      },
      heavy: { // Dönen Tekme: yüksek kaviste savrulan bacak
        ant: (s) => P(s, { t: 0.14, flk: [6, 22], flf: [0, -6], fae: [18, 12], faf: [30, 8] }),
        hit: (s) => P(s, { t: -0.26, flk: [30, -14], flf: [70, -72], fae: [-6, 16], faf: [-18, 8], bae: [12, 18], baf: [20, 28] }),
      },
    },
    submission: {
      light: { // Pençe: yukaridan süpüren açik el
        ant: (s) => P(s, { t: -0.10, fae: [10, -2], faf: [16, -12], fh: 'claw' }),
        hit: (s) => P(s, { t: 0.16, fae: [28, 6], faf: [64, 14], fh: 'claw', bae: [14, 24], baf: [24, 30] }),
      },
      heavy: { // Alçak Tekme: yere paralel süpürme
        ant: (s) => P(s, { cr: 12, flk: [4, 24], flf: [-2, -4] }),
        hit: (s) => P(s, { t: 0.08, cr: 10, flk: [30, 14], flf: [74, -10], fae: [10, 20], faf: [16, 30], bae: [-8, 16], baf: [-18, 22] }),
      },
    },
  };

  // kosu vuruslari (ortak)
  const RUNATK = {
    runpunch: {
      ant: (s) => P(s, { t: 0.10, fae: [18, 10], faf: [26, 6], bae: [-4, 18], baf: [-12, 28] }),
      hit: (s) => P(s, { t: 0.26, fae: [30, 2], faf: [82, -4], bae: [-8, 18], baf: [-16, 30], flk: [18, 22], flf: [26, 0] }),
    },
    runkick: {
      ant: (s) => P(s, { t: -0.12, flk: [16, 18], flf: [16, -18] }),
      hit: (s) => P(s, { t: -0.38, flk: [36, -6], flf: [82, -38], blk: [26, 0], blf: [62, -26], fae: [-10, 16], faf: [-22, 6], bae: [-6, 18], baf: [-16, 28] }),
    },
  };

  // ---- ZAMANLI KLIPLER: keys [{u: 0..1, p, e}] ----
  function sampleKeys(keys, u) {
    if (u <= keys[0].u) return keys[0].p;
    for (let i = 1; i < keys.length; i++) {
      if (u <= keys[i].u) {
        const a = keys[i - 1], b = keys[i];
        const lu = (u - a.u) / (b.u - a.u);
        return mix(a.p, b.p, EASE[b.e || 'out'](lu));
      }
    }
    return keys[keys.length - 1].p;
  }

  // bölgesel hasar tepkileri (high: kafa sarsilir, mid: gövde kivrilir, low: diz çöker)
  const REACT = {
    high: (s) => [
      { u: 0, p: P(s, { t: -0.30, fae: [8, 2], faf: [4, -10], bae: [-6, 14], baf: [-16, 6] }), e: 'out' },
      { u: 0.45, p: P(s, { t: -0.34, cr: 2 }), e: 'out' },
      { u: 1, p: GUARD[s], e: 'out' },
    ],
    mid: (s) => [
      { u: 0, p: P(s, { t: 0.22, cr: 10, fae: [16, 30], faf: [22, 42], bae: [10, 28], baf: [14, 40] }), e: 'out' },
      { u: 0.5, p: P(s, { t: 0.16, cr: 6 }), e: 'out' },
      { u: 1, p: GUARD[s], e: 'out' },
    ],
    low: (s) => [
      { u: 0, p: P(s, { t: 0.10, cr: 22, flk: [20, 10], flf: [12, 0], blk: [-8, 18], blf: [-18, 0], fae: [12, 30], faf: [16, 44] }), e: 'out' },
      { u: 0.55, p: P(s, { cr: 12 }), e: 'out' },
      { u: 1, p: GUARD[s], e: 'out' },
    ],
  };

  // tutus özel hamleleri koreografisi
  const SPECIAL = {
    sokak: (s) => [ // kafa atma: geri çekil, kafayla dal
      { u: 0, p: P(s, { t: -0.30, cr: 4 }), e: 'out' },
      { u: 0.4, p: P(s, { t: 0.40, fae: [24, 18], faf: [38, 22], bae: [20, 20], baf: [34, 26] }), e: 'outBack' },
      { u: 1, p: GUARD.sokak, e: 'out' },
    ],
    kickbox: (s) => [ // diz sovu: rakibi çek + diz
      { u: 0, p: P(s, { fae: [30, 12], faf: [44, 18], bae: [26, 14], baf: [40, 22] }), e: 'out' },
      { u: 0.45, p: P(s, { t: 0.12, flk: [30, -12], flf: [24, -40], fae: [22, 26], faf: [32, 38], bae: [18, 28], baf: [28, 40], cr: 4 }), e: 'outBack' },
      { u: 1, p: GUARD.kickbox, e: 'out' },
    ],
    gures: (s) => [ // suplex: kenetlen, geriye kavis
      { u: 0, p: P(s, { fae: [34, 14], faf: [46, 18], bae: [30, 16], baf: [44, 22], cr: 12 }), e: 'out' },
      { u: 0.55, p: P(s, { t: -0.95, fae: [10, -16], faf: [4, -34], bae: [6, -14], baf: [0, -32], cr: 0, flk: [12, 22], flf: [18, 0] }), e: 'outBack' },
      { u: 1, p: GUARD.gures, e: 'out' },
    ],
    sanat: (s) => [ // savurma: çek ve firlat
      { u: 0, p: P(s, { t: -0.18, fae: [30, 10], faf: [44, 12] }), e: 'out' },
      { u: 0.5, p: P(s, { t: 0.30, fae: [28, 4], faf: [66, -2], fh: 'palm', bae: [-8, 18], baf: [-18, 10] }), e: 'outBack' },
      { u: 1, p: GUARD.sanat, e: 'out' },
    ],
    submission: (s) => [ // eklem kilidi: kenetlen ve bük
      { u: 0, p: P(s, { fae: [34, 16], faf: [46, 20], bae: [28, 20], baf: [42, 26] }), e: 'out' },
      { u: 0.5, p: P(s, { t: 0.28, cr: 14, fae: [30, 26], faf: [16, 36], bae: [24, 28], baf: [38, 38] }), e: 'outBack' },
      { u: 1, p: GUARD.submission, e: 'out' },
    ],
  };

  // tek pozlu durumlar
  const POSES = {
    jump: (s) => P(s, { flk: [22, 18], flf: [14, -26], blk: [2, 22], blf: [-10, -18] }),
    blockHi: (s) => P(s, { fae: [18, 30], faf: [24, 16], bae: [14, 26], baf: [20, 6], cr: 4 }),
    blockLow: (s) => P(s, { fae: [16, 32], faf: [22, 20], bae: [12, 28], baf: [18, 10], cr: 14, t: 0.10 }),
    limp: (s) => P(s, { fae: [12, 30], faf: [8, 46], bae: [0, 26], baf: [-10, 12], fh: 'palm', bh: 'palm' }),
    tumble: (s) => P(s, { t: 0, fae: [12, 30], faf: [18, 42], bae: [0, 26], baf: [-10, 12], flk: [18, 14], flf: [10, -18], blk: [-4, 18], blf: [-14, -10] }),
    hold: (s) => P(s, { fae: [28, 12], faf: [44, 8], bae: [26, 20], baf: [42, 18], fh: 'palm', bh: 'palm' }),
    grabAnt: (s) => P(s, { fae: [16, 16], faf: [22, 14], bae: [14, 22], baf: [20, 20], fh: 'palm', bh: 'palm', cr: 4 }),
    grabHit: (s) => P(s, { fae: [30, 10], faf: [58, 8], bae: [28, 18], baf: [54, 18], fh: 'palm', bh: 'palm', t: 0.10 }),
    blazin: (s) => P(s, { fae: [16, -18], faf: [22, -42], bae: [14, 20], baf: [22, 10] }),
  };

  // ---- ANA ÖRNEKLEYICI ----
  function styleOf(f) { return GUARD[f.style] ? f.style : 'sokak'; }

  function strikeSample(def, s, f) {
    const a = f.attack;
    const ts = f.stateTime;
    const g = GUARD[s];
    const antEnd = a.startup * 0.55;
    if (ts < antEnd) return mix(g, def.ant(s), EASE.out(ts / antEnd));
    if (ts < a.startup) return def.ant(s);
    if (ts < a.startup + a.active) {
      return mix(def.ant(s), def.hit(s), EASE.outBack(Math.min(1, (ts - a.startup) / Math.max(a.active, 0.03))));
    }
    return mix(def.hit(s), g, EASE.out(Math.min(1, (ts - a.startup - a.active) / a.recovery)));
  }

  function target(f, t) {
    const s = styleOf(f);
    const g = GUARD[s];
    const gait = GAIT[s];
    switch (f.state) {
      case 'idle': {
        const p = clone(g);
        p.cr += Math.sin(t * (s === 'kickbox' ? 6 : 2.6)) * 1.6; // nefes/sekme
        p.faf[1] += Math.sin(t * 2.6 + 1) * 1.5;
        return p;
      }
      case 'walk':
      case 'run': {
        const run = f.state === 'run';
        const sw = Math.sin(f.walkPhase);
        const str = (run ? 27 : 18) * gait.stride;
        const lift = (run ? 14 : 9) * gait.lift;
        const p = clone(g);
        p.cr += Math.abs(Math.cos(f.walkPhase)) * 2.5 * gait.bob + (run ? 2 : 0);
        p.flk = [sw * str * 0.55 + 8, 24]; p.flf = [sw * str, -Math.max(0, sw) * lift];
        p.blk = [-sw * str * 0.55 + 4, 24]; p.blf = [-sw * str, -Math.max(0, -sw) * lift];
        if (run) {
          p.fae = [14 + sw * 10 * gait.arm, 20]; p.faf = [24 + sw * 16 * gait.arm, 10];
          p.bae = [14 - sw * 10 * gait.arm, 18]; p.baf = [24 - sw * 16 * gait.arm, 8];
        } else {
          p.faf[1] += sw * 3 * gait.arm; p.baf[1] -= sw * 3 * gait.arm;
        }
        return p;
      }
      case 'jump': return POSES.jump(s);
      case 'block': return s === 'submission' || s === 'gures' ? POSES.blockLow(s) : POSES.blockHi(s);
      case 'punch': return strikeSample(STRIKE[s].light, s, f);
      case 'kick': return strikeSample(STRIKE[s].heavy, s, f);
      case 'runpunch': return strikeSample(RUNATK.runpunch, s, f);
      case 'runkick': return strikeSample(RUNATK.runkick, s, f);
      case 'grab': {
        const G = Game.GRAB;
        const fake = { attack: { startup: G.startup, active: G.active, recovery: G.recovery }, stateTime: f.stateTime };
        return strikeSample({ ant: POSES.grabAnt, hit: POSES.grabHit }, s, fake);
      }
      case 'hold': {
        const p = POSES.hold(s); // bogusma: ritmik çekistirme
        const w = Math.sin(t * 7) * 2.5;
        p.faf[0] += w; p.baf[0] -= w; p.cr += Math.sin(t * 7 + 1) * 1.5;
        return p;
      }
      case 'held': case 'crowdhold': case 'staggered': {
        const p = POSES.limp(s);
        p.faf[0] += Math.sin(t * 9) * 3;
        return p;
      }
      case 'thrown': return POSES.tumble(s);
      case 'hit': {
        const keys = REACT[f.hitRegion || 'mid'](s);
        return sampleKeys(keys, Math.min(1, f.stateTime / Math.max(f.hitstun, 0.2)));
      }
      case 'down': case 'ko': return POSES.limp(s);
      case 'getup': {
        return mix(P(s, { cr: 26, t: 0.3 }), g, EASE.out(Math.min(1, f.stateTime / 0.35)));
      }
      case 'specialmove': return sampleKeys(SPECIAL[s](s), Math.min(1, f.stateTime / 0.45));
      case 'blazinpose': return POSES.blazin(s);
      default: return g;
    }
  }

  // Geçis harmanlama: state degisince eski pozdan yeni hedefe 85 ms
  function pose(f, t) {
    const tgt = target(f, t);
    const key = f.state + ':' + (f.attackName || '') + ':' + (f.chainCount || 0);
    if (f._ak !== key) {
      f._ak = key;
      f._pf = f._pn ? clone(f._pn) : null;
      f._bt = t;
    }
    let out = tgt;
    if (f._pf) {
      const u = Math.min(1, (t - f._bt) / 0.085);
      out = u < 1 ? mix(f._pf, tgt, EASE.out(u)) : tgt;
      if (u >= 1) f._pf = null;
    }
    f._pn = out;
    return out;
  }

  return { pose, GUARD, EASE };
})();
