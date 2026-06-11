window.Game = window.Game || {};

// Stile özgü görünüm: ten, saç, kiyafet ve vücut tipi.
// f.color = kiyafet ana rengi (P1/P2 ayrimi), f.accent = ikincil (bant/kemer/bandaj).
Game.STYLE_LOOK = {
  sokak: { skin: '#c98e63', hair: '#1d1410', hairStyle: 'cap', outfit: 'tank', pants: 'jeans', build: 1.0, crouch: 0 },
  kickbox: { skin: '#8a5a3b', hair: '#15100c', hairStyle: 'short', outfit: 'bare', pants: 'shorts', build: 1.05, crouch: 2, wraps: true },
  gures: { skin: '#d9a06f', hair: '#2b1a12', hairStyle: 'bald', outfit: 'singlet', pants: 'singlet', build: 1.3, crouch: 9 },
  sanat: { skin: '#e8b88a', hair: '#0d0d12', hairStyle: 'bun', outfit: 'gi', pants: 'gi', build: 0.88, crouch: 0 },
  submission: { skin: '#b97f55', hair: '#15100d', hairStyle: 'mohawk', outfit: 'rash', pants: 'shorts2', build: 1.1, crouch: 6 },
};

// Incelen uzuv: kalin üst segment + ince alt segment
function limb(ctx, x0, y0, x1, y1, x2, y2, w1, w2, c1, c2) {
  ctx.strokeStyle = c1;
  ctx.lineWidth = w1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = c2;
  ctx.lineWidth = w2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

Game.drawFighter = function (ctx, f, t, opts = {}) {
  const groundY = Game.ARENA.groundY;
  const footY = groundY - f.y;
  const look = Game.STYLE_LOOK[f.style] || Game.STYLE_LOOK.sokak;
  const B = look.build;
  const skin = look.skin;
  const skinDark = Game.shade2(skin, -28);
  const suit = f.color;
  const suitDark = Game.shade(f.color, -38);

  if (!opts.plain) {
    // gölge: havadayken küçülür
    const airScale = 1 - Math.min(f.y / 220, 0.55);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(f.x, groundY + 6, 36 * airScale * B, 9 * airScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // BLAZIN aurasi
    if (f.blazinTime > 0) {
      ctx.save();
      const pulse = 0.5 + Math.sin(t * 12) * 0.2;
      const g = ctx.createRadialGradient(f.x, footY - 60, 10, f.x, footY - 60, 80);
      g.addColorStop(0, `rgba(255, 200, 60, ${0.35 * pulse + 0.15})`);
      g.addColorStop(1, 'rgba(255, 200, 60, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(f.x - 90, footY - 150, 180, 170);
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(f.x, footY);
  ctx.scale(f.facing, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (f.blazinTime > 0 && !opts.plain) {
    ctx.shadowColor = '#ffc83c';
    ctx.shadowBlur = 16;
  }

  // yere serilme ve duruma göre gövde egimi
  let lie = 0;
  if (f.state === 'down' || f.state === 'ko') lie = Math.min(1, f.stateTime / 0.18);
  else if (f.state === 'getup') lie = 1 - Math.min(1, f.stateTime / 0.35);
  ctx.rotate(-lie * Math.PI / 2);
  if (f.state === 'hit') ctx.rotate(-0.16);
  else if (f.state === 'thrown') ctx.rotate(-f.stateTime * 8);
  else if (f.state === 'staggered') ctx.rotate(Math.sin(f.stateTime * 18) * 0.14);
  else if (f.state === 'crowdhold') ctx.rotate(-0.28);
  else if (f.state === 'held') ctx.rotate(-0.1);

  const breathe = f.state === 'idle' ? Math.sin(t * 2.6) * 2 : 0;
  const running = f.state === 'run';
  const swing = f.state === 'walk' || running ? Math.sin(f.walkPhase) : 0;
  const inAir = f.state === 'jump';
  const ext = Game.attackExt(f);
  const anim = (f.attack && f.attack.anim) || null;
  const style = f.style;
  const grounded = ['idle', 'walk', 'block'].includes(f.state);
  const crouch = grounded ? look.crouch : 0;

  // gövde egimleri
  if (running) ctx.rotate(0.14);
  else if (f.state === 'runpunch') ctx.rotate(0.2 * ext);
  else if (f.state === 'runkick') ctx.rotate(-0.3 * ext);
  else if (anim === 'charge') ctx.rotate(0.3 * ext);
  else if (f.state === 'kick' && style === 'sokak') ctx.rotate(0.30 * ext); // çevirme yumrugu: gövde döner
  else if (f.state === 'kick' && style === 'sanat') ctx.rotate(-0.22 * ext); // dönen tekme: geriye yatis
  else if (f.state === 'kick' && style === 'kickbox') ctx.rotate(-0.18 * ext); // roundhouse
  else if (f.state === 'punch' && style === 'gures') ctx.rotate(0.18 * ext); // agir tokat savrulur
  else if (f.state === 'specialmove') {
    const sp = Math.min(1, f.stateTime / 0.2);
    if (style === 'gures') ctx.rotate(-0.85 * sp); // suplex kavisi
    else if (style === 'sokak') ctx.rotate(0.35 * sp); // kafa atma
    else if (style === 'submission') ctx.rotate(0.25 * sp); // kilit bükmesi
  }

  const hipY = -52 + breathe * 0.4 + crouch * 0.6;
  const shoulderY = -96 + breathe + crouch;
  const headY = -116 + breathe + crouch;

  // ---- POZ HESABI: bacaklar ----
  let legs;
  if (f.state === 'kick') {
    if (anim === 'low') {
      legs = [
        { knee: { x: 16 + 16 * ext, y: hipY * 0.6 }, foot: { x: 18 + 60 * ext, y: -8 - 6 * ext } },
        { knee: { x: -4, y: hipY * 0.5 }, foot: { x: -10, y: 0 } },
      ];
    } else if (anim === 'charge') {
      legs = [
        { knee: { x: 20, y: hipY * 0.55 }, foot: { x: 30, y: 0 } },
        { knee: { x: -8, y: hipY * 0.5 }, foot: { x: -22, y: 0 } },
      ];
    } else if (style === 'sokak') {
      // çevirme yumrugu: bacaklar pivot yapar, tekme yok
      legs = [
        { knee: { x: 14 + 8 * ext, y: hipY * 0.55 }, foot: { x: 20 + 10 * ext, y: 0 } },
        { knee: { x: -6, y: hipY * 0.5 }, foot: { x: -16, y: 0 } },
      ];
    } else if (style === 'sanat') {
      // dönen tekme: bacak yüksek kaviste savrulur
      legs = [
        { knee: { x: 14 + 22 * ext, y: hipY * 0.6 - 22 * ext }, foot: { x: 8 + 62 * ext, y: -52 * ext - 14 } },
        { knee: { x: -4, y: hipY * 0.5 }, foot: { x: -12, y: 0 } },
      ];
    } else {
      // kickbox roundhouse / varsayilan yüksek tekme
      legs = [
        { knee: { x: 18 + 20 * ext, y: hipY * 0.55 - 14 * ext }, foot: { x: 16 + 58 * ext, y: -22 - 34 * ext } },
        { knee: { x: -4, y: hipY * 0.5 }, foot: { x: -10, y: 0 } },
      ];
    }
  } else if (f.state === 'punch' && style === 'kickbox') {
    // hizli diz: ön diz göguse kalkar
    legs = [
      { knee: { x: 16 + 12 * ext, y: hipY * 0.55 - 32 * ext }, foot: { x: 8 + 16 * ext, y: hipY * 0.35 - 10 * ext } },
      { knee: { x: -4, y: hipY * 0.5 }, foot: { x: -12, y: 0 } },
    ];
  } else if (f.state === 'runkick') {
    legs = [
      { knee: { x: 22 + 18 * ext, y: hipY * 0.6 - 16 * ext }, foot: { x: 20 + 62 * ext, y: -34 - 28 * ext } },
      { knee: { x: 14 + 14 * ext, y: hipY * 0.6 - 8 * ext }, foot: { x: 12 + 50 * ext, y: -22 - 22 * ext } },
    ];
  } else if (running) {
    legs = [
      { knee: { x: swing * 16 + 10, y: hipY * 0.5 }, foot: { x: swing * 27, y: -Math.max(0, swing) * 14 } },
      { knee: { x: -swing * 16 + 10, y: hipY * 0.5 }, foot: { x: -swing * 27, y: -Math.max(0, -swing) * 14 } },
    ];
  } else if (inAir) {
    legs = [
      { knee: { x: 22, y: hipY * 0.55 }, foot: { x: 14, y: -26 } },
      { knee: { x: 2, y: hipY * 0.5 }, foot: { x: -10, y: -18 } },
    ];
  } else if (f.state === 'specialmove' && style === 'kickbox') {
    // diz sovu: diz havada
    legs = [
      { knee: { x: 20, y: hipY * 0.5 - 30 }, foot: { x: 12, y: hipY * 0.35 } },
      { knee: { x: -4, y: hipY * 0.5 }, foot: { x: -12, y: 0 } },
    ];
  } else {
    // duruslar: stil bazli ayak açikligi
    const wide = style === 'gures' ? 1.6 : style === 'submission' ? 1.3 : style === 'sanat' ? 0.8 : 1;
    legs = [
      { knee: { x: swing * 11 + 6 + 4 * wide, y: hipY * 0.5 }, foot: { x: swing * 19 + 10 * wide, y: -Math.max(0, swing) * 9 } },
      { knee: { x: -swing * 11 + 6 - 4 * wide, y: hipY * 0.5 }, foot: { x: -swing * 19 - 8 * wide, y: -Math.max(0, -swing) * 9 } },
    ];
  }

  // ---- POZ HESABI: kollar ----
  const armBob = swing * 4;
  const idleBob = f.state === 'idle' ? Math.sin(t * (style === 'kickbox' ? 6 : 2.6)) * 2 : 0;
  let backArm, frontArm;
  let frontHand = 'fist';
  let backHand = 'fist';
  if (f.state === 'kick' && anim === 'charge') {
    backArm = { elbow: { x: 16, y: shoulderY + 14 }, fist: { x: 26 + 10 * ext, y: shoulderY + 18 } };
    frontArm = { elbow: { x: 18, y: shoulderY + 10 }, fist: { x: 30 + 14 * ext, y: shoulderY + 12 } };
  } else if (f.state === 'kick' && style === 'sokak') {
    // çevirme yumrugu: genis kavisli kanca
    backArm = { elbow: { x: 6, y: shoulderY + 18 }, fist: { x: -4, y: shoulderY + 10 } };
    frontArm = { elbow: { x: 16 + 12 * ext, y: shoulderY + 2 - 6 * ext }, fist: { x: 18 + 44 * ext, y: shoulderY + 12 - 22 * ext } };
  } else if (f.state === 'kick' && (style === 'sanat' || style === 'kickbox')) {
    // tekmede denge kollari geriye savrulur
    backArm = { elbow: { x: -10 - 6 * ext, y: shoulderY + 16 }, fist: { x: -20 - 10 * ext, y: shoulderY + 4 } };
    frontArm = { elbow: { x: 10, y: shoulderY + 14 }, fist: { x: 18 - 8 * ext, y: shoulderY + 22 } };
  } else if (f.state === 'kick') {
    backArm = { elbow: { x: 18, y: shoulderY + 16 }, fist: { x: 26, y: shoulderY + 6 } };
    frontArm = { elbow: { x: 12, y: shoulderY + 16 }, fist: { x: 6, y: shoulderY + 26 } };
  } else if (f.state === 'punch') {
    if (style === 'gures') {
      // agir tokat: açik el genis savrulur
      frontHand = 'palm';
      backArm = { elbow: { x: 14, y: shoulderY + 18 }, fist: { x: 22, y: shoulderY + 10 } };
      frontArm = { elbow: { x: 14 + 14 * ext, y: shoulderY - 4 * ext }, fist: { x: 16 + 46 * ext, y: shoulderY + 14 - 14 * ext } };
    } else if (style === 'kickbox') {
      // hizli diz: kollar rakibi asagi çeker (klinç)
      backArm = { elbow: { x: 20, y: shoulderY + 10 }, fist: { x: 30 + 10 * ext, y: shoulderY + 18 + 8 * ext } };
      frontArm = { elbow: { x: 22, y: shoulderY + 6 }, fist: { x: 32 + 12 * ext, y: shoulderY + 14 + 10 * ext } };
    } else if (style === 'submission') {
      // pençe: açik el yukaridan asagi süpürür
      frontHand = 'claw';
      backArm = { elbow: { x: 16, y: shoulderY + 16 }, fist: { x: 24, y: shoulderY + 8 } };
      frontArm = { elbow: { x: 18 + 8 * ext, y: shoulderY - 8 * ext }, fist: { x: 24 + 38 * ext, y: shoulderY - 12 * ext + 16 * ext * ext } };
    } else if (style === 'sanat') {
      // yildirim vurus: keskin, kisa, düz
      backArm = { elbow: { x: 2, y: shoulderY + 14 }, fist: { x: -8, y: shoulderY + 18 } };
      frontArm = { elbow: { x: 22, y: shoulderY + 6 }, fist: { x: 28 + 44 * ext, y: shoulderY + 6 } };
    } else {
      backArm = { elbow: { x: 18, y: shoulderY + 16 }, fist: { x: 26, y: shoulderY + 6 } };
      frontArm = { elbow: { x: 20, y: shoulderY + 8 }, fist: { x: 30 + 40 * ext, y: shoulderY + 8 } };
    }
  } else if (f.state === 'runpunch') {
    backArm = { elbow: { x: -6, y: shoulderY + 18 }, fist: { x: -14, y: shoulderY + 30 } };
    frontArm = { elbow: { x: 24, y: shoulderY + 6 }, fist: { x: 32 + 50 * ext, y: shoulderY + 2 - 6 * ext } };
  } else if (f.state === 'runkick') {
    backArm = { elbow: { x: -8, y: shoulderY + 16 }, fist: { x: -18, y: shoulderY + 26 } };
    frontArm = { elbow: { x: 6, y: shoulderY + 20 }, fist: { x: -2, y: shoulderY + 34 } };
  } else if (f.state === 'run') {
    backArm = { elbow: { x: 14 - swing * 10, y: shoulderY + 18 }, fist: { x: 24 - swing * 16, y: shoulderY + 8 } };
    frontArm = { elbow: { x: 14 + swing * 10, y: shoulderY + 20 }, fist: { x: 24 + swing * 16, y: shoulderY + 10 } };
  } else if (f.state === 'blazinpose') {
    backArm = { elbow: { x: 14, y: shoulderY + 18 }, fist: { x: 22, y: shoulderY + 8 } };
    frontArm = { elbow: { x: 16, y: shoulderY - 14 }, fist: { x: 22, y: shoulderY - 38 } };
  } else if (f.state === 'specialmove') {
    if (style === 'gures') { // suplex: kollar yukari kenetli
      backArm = { elbow: { x: 10, y: shoulderY - 10 }, fist: { x: 6, y: shoulderY - 30 } };
      frontArm = { elbow: { x: 16, y: shoulderY - 8 }, fist: { x: 12, y: shoulderY - 28 } };
    } else if (style === 'submission') { // kilit: kollar çapraz çeker
      backArm = { elbow: { x: 18, y: shoulderY + 14 }, fist: { x: 30, y: shoulderY + 24 } };
      frontArm = { elbow: { x: 22, y: shoulderY + 18 }, fist: { x: 10, y: shoulderY + 30 } };
    } else if (style === 'sanat') { // savurma: kol uzanmis
      frontHand = 'palm';
      backArm = { elbow: { x: -8, y: shoulderY + 14 }, fist: { x: -18, y: shoulderY + 6 } };
      frontArm = { elbow: { x: 22, y: shoulderY + 4 }, fist: { x: 44, y: shoulderY } };
    } else {
      backArm = { elbow: { x: 18, y: shoulderY + 12 }, fist: { x: 30, y: shoulderY + 14 } };
      frontArm = { elbow: { x: 20, y: shoulderY + 6 }, fist: { x: 34, y: shoulderY + 8 } };
    }
  } else if (f.state === 'grab') {
    const gext = Game.grabExt(f);
    frontHand = backHand = 'palm';
    backArm = { elbow: { x: 18, y: shoulderY + 18 }, fist: { x: 26 + 26 * gext, y: shoulderY + 18 } };
    frontArm = { elbow: { x: 20, y: shoulderY + 10 }, fist: { x: 28 + 30 * gext, y: shoulderY + 8 } };
  } else if (f.state === 'hold') {
    frontHand = backHand = 'palm';
    backArm = { elbow: { x: 22, y: shoulderY + 16 }, fist: { x: 38, y: shoulderY + 14 } };
    frontArm = { elbow: { x: 24, y: shoulderY + 8 }, fist: { x: 40, y: shoulderY + 4 } };
  } else if (f.state === 'held' || f.state === 'crowdhold' || f.state === 'staggered' || f.state === 'thrown') {
    backArm = { elbow: { x: 0, y: shoulderY + 22 }, fist: { x: -10, y: shoulderY + 8 } };
    frontArm = { elbow: { x: 12, y: shoulderY + 26 }, fist: { x: 18, y: shoulderY + 38 } };
  } else if (f.state === 'block') {
    backArm = { elbow: { x: 14, y: shoulderY + 22 }, fist: { x: 20, y: shoulderY + 2 } };
    frontArm = { elbow: { x: 18, y: shoulderY + 26 }, fist: { x: 24, y: shoulderY + 12 } };
  } else if (lie > 0) {
    backArm = { elbow: { x: 12, y: shoulderY + 26 }, fist: { x: 8, y: shoulderY + 42 } };
    frontArm = { elbow: { x: 16, y: shoulderY + 28 }, fist: { x: 12, y: shoulderY + 46 } };
  } else {
    // STIL GARDLARI
    if (style === 'gures') { // genis açik kollar, avuçlar hazir
      frontHand = backHand = 'palm';
      backArm = { elbow: { x: 22, y: shoulderY + 16 - idleBob }, fist: { x: 34, y: shoulderY + 18 - idleBob } };
      frontArm = { elbow: { x: 18, y: shoulderY + 24 + idleBob }, fist: { x: 36, y: shoulderY + 28 + idleBob } };
    } else if (style === 'sanat') { // yan durus: ön el açik uzanmis, arka el bel hizasinda
      frontHand = 'palm';
      backArm = { elbow: { x: -2, y: shoulderY + 18 }, fist: { x: -10, y: shoulderY + 26 } };
      frontArm = { elbow: { x: 22, y: shoulderY + 10 + idleBob }, fist: { x: 42, y: shoulderY + 6 + idleBob } };
    } else if (style === 'kickbox') { // yüksek siki gard, seken omuzlar
      backArm = { elbow: { x: 14, y: shoulderY + 18 - idleBob }, fist: { x: 24, y: shoulderY - 2 - idleBob } };
      frontArm = { elbow: { x: 18, y: shoulderY + 20 + idleBob }, fist: { x: 28, y: shoulderY + 2 + idleBob } };
    } else if (style === 'submission') { // alçak, kapma pozisyonu
      frontHand = backHand = 'claw';
      backArm = { elbow: { x: 16, y: shoulderY + 20 }, fist: { x: 28, y: shoulderY + 24 - idleBob } };
      frontArm = { elbow: { x: 20, y: shoulderY + 26 }, fist: { x: 34, y: shoulderY + 18 + idleBob } };
    } else {
      backArm = { elbow: { x: 20, y: shoulderY + 18 - armBob }, fist: { x: 30, y: shoulderY + 4 - armBob } };
      frontArm = { elbow: { x: 16, y: shoulderY + 24 + armBob }, fist: { x: 34, y: shoulderY + 14 + armBob } };
    }
  }

  // ---- ÇIZIM (arkadan öne) ----
  const thighW = 15 * B;
  const calfW = 10 * B;
  const upperArmW = 11 * B;
  const foreArmW = 8 * B;
  const pantsCol = look.pants === 'jeans' ? '#2b3038'
    : look.pants === 'gi' ? '#ddd6c8'
    : look.pants === 'singlet' ? suit
    : look.pants === 'shorts' ? suit
    : suitDark; // shorts2
  const calfCol = look.pants === 'jeans' || look.pants === 'gi' ? pantsCol : skin;
  const armCol = look.outfit === 'gi' || look.outfit === 'rash' ? suit : skin;
  const armColD = look.outfit === 'gi' || look.outfit === 'rash' ? suitDark : skinDark;
  const handFor = (kind, x, y, dark) => {
    const hc = look.wraps ? f.accent : dark ? skinDark : skin;
    ctx.fillStyle = hc;
    if (kind === 'palm') {
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 5, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'claw') {
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hc;
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + i * 3);
        ctx.lineTo(x + 10, y + i * 4);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const shoe = (x, y) => {
    ctx.fillStyle = style === 'sanat' ? skin : '#17141c';
    ctx.beginPath();
    ctx.ellipse(x + 4, y - 2, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // arka kol
  limb(ctx, 2, shoulderY + 4, backArm.elbow.x, backArm.elbow.y, backArm.fist.x, backArm.fist.y, upperArmW, foreArmW, armColD, armColD);
  handFor(backHand, backArm.fist.x, backArm.fist.y, true);

  // arka bacak
  limb(ctx, 0, hipY, legs[1].knee.x, legs[1].knee.y, legs[1].foot.x, legs[1].foot.y, thighW, calfW, Game.shadeAny(pantsCol, -30), Game.shadeAny(calfCol, -30));
  shoe(legs[1].foot.x, legs[1].foot.y);

  // ön bacak
  limb(ctx, 2, hipY, legs[0].knee.x, legs[0].knee.y, legs[0].foot.x, legs[0].foot.y, thighW, calfW, pantsCol, calfCol);
  shoe(legs[0].foot.x, legs[0].foot.y);

  // ---- GÖVDE: omuzdan kalçaya dolgun form ----
  const shW = 15 * B;
  const hpW = 10 * B;
  ctx.beginPath();
  ctx.moveTo(-shW + 4, shoulderY - 4);
  ctx.quadraticCurveTo(4, shoulderY - 12, shW + 6, shoulderY - 2);
  ctx.quadraticCurveTo(shW + 8, shoulderY + 24, hpW + 2, hipY + 6);
  ctx.lineTo(-hpW + 2, hipY + 6);
  ctx.quadraticCurveTo(-shW - 2, shoulderY + 24, -shW + 4, shoulderY - 4);
  ctx.closePath();
  if (look.outfit === 'bare') {
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; // gögüs gölgesi
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-shW + 4, shoulderY - 4);
    ctx.quadraticCurveTo(4, shoulderY - 12, shW + 6, shoulderY - 2);
    ctx.quadraticCurveTo(shW + 4, shoulderY + 16, 2, shoulderY + 22);
    ctx.quadraticCurveTo(-shW, shoulderY + 14, -shW + 4, shoulderY - 4);
    ctx.fill();
  } else {
    ctx.fillStyle = suit;
    ctx.fill();
  }
  // gövde gölgeleme: arka taraf koyu
  const tg = ctx.createLinearGradient(-shW, 0, shW, 0);
  tg.addColorStop(0, 'rgba(0,0,0,0.28)');
  tg.addColorStop(0.55, 'rgba(0,0,0,0)');
  ctx.fillStyle = tg;
  ctx.fill();

  // kiyafet detaylari
  if (look.outfit === 'tank') { // atlet askilari + bel
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(4, shoulderY - 2, shW * 0.55, 6, 0, Math.PI, 0);
    ctx.fill();
  } else if (look.outfit === 'gi') { // kimono yakasi + kemer
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, shoulderY - 4);
    ctx.lineTo(-2, hipY - 6);
    ctx.stroke();
    ctx.fillStyle = f.accent;
    ctx.fillRect(-hpW, hipY - 2, hpW * 2 + 4, 7);
  } else if (look.outfit === 'singlet') { // güres mayosu askilari
    ctx.strokeStyle = suitDark;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-7, shoulderY - 2);
    ctx.lineTo(-5, shoulderY + 16);
    ctx.moveTo(13, shoulderY - 2);
    ctx.lineTo(11, shoulderY + 16);
    ctx.stroke();
  } else if (look.outfit === 'rash') { // gögüste serit
    ctx.strokeStyle = f.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-shW + 6, shoulderY + 10);
    ctx.lineTo(shW + 2, shoulderY + 6);
    ctx.stroke();
  }

  // ---- KAFA ----
  const hx = 9;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx, headY, 12, 0, Math.PI * 2);
  ctx.fill();
  // saç / aksesuar
  if (look.hairStyle === 'cap') { // ters sapka
    ctx.fillStyle = f.accent;
    ctx.beginPath();
    ctx.arc(hx, headY - 2, 12.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(hx - 14, headY - 4, 10, 5);
  } else if (look.hairStyle === 'short') {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(hx, headY - 2, 12, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  } else if (look.hairStyle === 'bald') {
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; // parlama
    ctx.beginPath();
    ctx.arc(hx - 3, headY - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = look.hair; // biyik
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx + 6, headY + 6);
    ctx.lineTo(hx + 13, headY + 7);
    ctx.stroke();
  } else if (look.hairStyle === 'bun') { // topuz
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(hx, headY - 3, 12, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx - 6, headY - 13, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (look.hairStyle === 'mohawk') {
    // dar tepe seridi: kafayi izleyen ince mohawk
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(hx, headY - 2, 12, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
    ctx.fillStyle = f.accent;
    ctx.beginPath();
    ctx.moveTo(hx - 9, headY - 8);
    ctx.lineTo(hx - 6, headY - 16);
    ctx.lineTo(hx - 1, headY - 17);
    ctx.lineTo(hx + 4, headY - 15);
    ctx.lineTo(hx + 7, headY - 9);
    ctx.closePath();
    ctx.fill();
  }
  // yüz: göz + kas
  const koFace = f.state === 'ko';
  ctx.fillStyle = '#1a1414';
  if (koFace) {
    ctx.strokeStyle = '#1a1414';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + 4, headY - 3);
    ctx.lineTo(hx + 9, headY + 1);
    ctx.moveTo(hx + 9, headY - 3);
    ctx.lineTo(hx + 4, headY + 1);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(hx + 6.5, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1414';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + 3, headY - 6);
    ctx.lineTo(hx + 10, headY - 5);
    ctx.stroke();
  }
  // çene gölgesi
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.arc(hx, headY + 5, 9, 0, Math.PI);
  ctx.fill();
  if (look.hairStyle !== 'cap' && look.hairStyle !== 'mohawk') { // saç bandi
    ctx.fillStyle = f.accent;
    ctx.fillRect(hx - 12, headY - 7, 24, 4);
  }

  // ön kol (en önde)
  limb(ctx, 4, shoulderY + 4, frontArm.elbow.x, frontArm.elbow.y, frontArm.fist.x, frontArm.fist.y, upperArmW, foreArmW, armCol, armCol);
  handFor(frontHand, frontArm.fist.x, frontArm.fist.y, false);

  ctx.restore();
};

// Tutma denemesinin uzanma orani.
Game.grabExt = function (f) {
  const g = Game.GRAB;
  const t = f.stateTime;
  if (t < g.startup) return t / g.startup;
  const activeEnd = g.startup + g.active;
  if (t < activeEnd) return 1;
  return Math.max(0, 1 - (t - activeEnd) / g.recovery);
};

// Saldiri animasyonunun uzanma orani: hazirlikta gerilir,
// isabet penceresinde tam uzanir, toparlanmada geri çekilir.
Game.attackExt = function (f) {
  const a = f.attack;
  if (!a) return 0;
  const t = f.stateTime;
  if (t < a.startup) return (t / a.startup) * 0.35;
  const activeEnd = a.startup + a.active;
  if (t < activeEnd) return 1;
  return Math.max(0, 1 - (t - activeEnd) / a.recovery);
};

// '#rrggbb' rengini verilen miktar kadar açar/koyulastirir.
Game.shade = function (hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v + amount));
  return `rgb(${clamp(n >> 16)},${clamp((n >> 8) & 0xff)},${clamp(n & 0xff)})`;
};
Game.shade2 = Game.shade;
// 'rgb(...)' veya '#...' fark etmeksizin koyulastirir
Game.shadeAny = function (c, amount) {
  if (c.startsWith('#')) return Game.shade(c, amount);
  const m = c.match(/\d+/g).map(Number);
  const cl = (v) => Math.max(0, Math.min(255, v + amount));
  return `rgb(${cl(m[0])},${cl(m[1])},${cl(m[2])})`;
};
