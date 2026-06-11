window.Game = window.Game || {};

// Kodla çizilen eklemli siluet dövüsçü. Pozlar state'ten türetilir;
// sprite dosyasi gerekmez.
Game.drawFighter = function (ctx, f, t) {
  const groundY = Game.ARENA.groundY;
  const footY = groundY - f.y;

  // gölge: havadayken küçülür
  const airScale = 1 - Math.min(f.y / 220, 0.55);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(f.x, groundY + 6, 34 * airScale, 9 * airScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(f.x, footY);
  ctx.scale(f.facing, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // yere serilme (0 ayakta, 1 sirtüstü) ve duruma göre gövde egimi
  let lie = 0;
  if (f.state === 'down' || f.state === 'ko') lie = Math.min(1, f.stateTime / 0.18);
  else if (f.state === 'getup') lie = 1 - Math.min(1, f.stateTime / 0.35);
  ctx.rotate(-lie * Math.PI / 2);
  if (f.state === 'hit') ctx.rotate(-0.16);
  else if (f.state === 'thrown') ctx.rotate(-f.stateTime * 8); // havada takla
  else if (f.state === 'staggered') ctx.rotate(Math.sin(f.stateTime * 18) * 0.14); // sersem sallanma
  else if (f.state === 'crowdhold') ctx.rotate(-0.28); // kalabalik geriye çekiyor
  else if (f.state === 'held') ctx.rotate(-0.1);

  const breathe = f.state === 'idle' ? Math.sin(t * 2.6) * 2 : 0;
  const swing = f.state === 'walk' ? Math.sin(f.walkPhase) : 0;
  const inAir = f.state === 'jump';
  const ext = Game.attackExt(f); // saldiri uzanma orani 0..1

  const hipY = -52 + breathe * 0.4;
  const shoulderY = -96 + breathe;
  const headY = -116 + breathe;

  // --- bacaklar ---
  ctx.strokeStyle = f.color;
  ctx.lineWidth = 13;
  let legs;
  if (f.state === 'kick') {
    // ön bacak uzanan tekme, arka bacak destek
    legs = [
      { knee: { x: 18 + 20 * ext, y: hipY * 0.55 - 10 * ext }, foot: { x: 16 + 58 * ext, y: -16 - 36 * ext } },
      { knee: { x: -4, y: hipY * 0.5 }, foot: { x: -10, y: 0 } },
    ];
  } else if (inAir) {
    legs = [
      { knee: { x: 22, y: hipY * 0.55 }, foot: { x: 14, y: -26 } },
      { knee: { x: 2, y: hipY * 0.5 }, foot: { x: -10, y: -18 } },
    ];
  } else {
    legs = [
      { knee: { x: swing * 11 + 6, y: hipY * 0.5 }, foot: { x: swing * 19, y: -Math.max(0, swing) * 9 } },
      { knee: { x: -swing * 11 + 6, y: hipY * 0.5 }, foot: { x: -swing * 19, y: -Math.max(0, -swing) * 9 } },
    ];
  }
  for (const leg of legs) {
    ctx.beginPath();
    ctx.moveTo(2, hipY);
    ctx.lineTo(leg.knee.x, leg.knee.y);
    ctx.lineTo(leg.foot.x, leg.foot.y);
    ctx.stroke();
  }

  // --- gövde ---
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(6, shoulderY);
  ctx.stroke();

  // --- kollar ---
  ctx.lineWidth = 11;
  const armBob = swing * 4;
  let backArm, frontArm;
  if (f.state === 'punch') {
    backArm = { elbow: { x: 18, y: shoulderY + 16 }, fist: { x: 26, y: shoulderY + 6 } };
    frontArm = { elbow: { x: 20, y: shoulderY + 8 }, fist: { x: 30 + 40 * ext, y: shoulderY + 8 } };
  } else if (f.state === 'grab') {
    const gext = Game.grabExt(f);
    backArm = { elbow: { x: 18, y: shoulderY + 18 }, fist: { x: 26 + 26 * gext, y: shoulderY + 18 } };
    frontArm = { elbow: { x: 20, y: shoulderY + 10 }, fist: { x: 28 + 30 * gext, y: shoulderY + 8 } };
  } else if (f.state === 'hold') {
    backArm = { elbow: { x: 22, y: shoulderY + 16 }, fist: { x: 38, y: shoulderY + 14 } };
    frontArm = { elbow: { x: 24, y: shoulderY + 8 }, fist: { x: 40, y: shoulderY + 4 } };
  } else if (f.state === 'held' || f.state === 'crowdhold' || f.state === 'staggered' || f.state === 'thrown') {
    // kollar gevsek savrulur
    backArm = { elbow: { x: 0, y: shoulderY + 22 }, fist: { x: -10, y: shoulderY + 8 } };
    frontArm = { elbow: { x: 12, y: shoulderY + 26 }, fist: { x: 18, y: shoulderY + 38 } };
  } else if (f.state === 'block') {
    backArm = { elbow: { x: 14, y: shoulderY + 22 }, fist: { x: 20, y: shoulderY + 2 } };
    frontArm = { elbow: { x: 18, y: shoulderY + 26 }, fist: { x: 24, y: shoulderY + 12 } };
  } else if (lie > 0) {
    // yerdeyken kollar gevsek
    backArm = { elbow: { x: 12, y: shoulderY + 26 }, fist: { x: 8, y: shoulderY + 42 } };
    frontArm = { elbow: { x: 16, y: shoulderY + 28 }, fist: { x: 12, y: shoulderY + 46 } };
  } else {
    // gard durusu
    backArm = { elbow: { x: 20, y: shoulderY + 18 - armBob }, fist: { x: 30, y: shoulderY + 4 - armBob } };
    frontArm = { elbow: { x: 16, y: shoulderY + 24 + armBob }, fist: { x: 34, y: shoulderY + 14 + armBob } };
  }
  ctx.strokeStyle = Game.shade(f.color, -25);
  ctx.beginPath();
  ctx.moveTo(4, shoulderY + 4);
  ctx.lineTo(backArm.elbow.x, backArm.elbow.y);
  ctx.lineTo(backArm.fist.x, backArm.fist.y);
  ctx.stroke();
  Game.drawFist(ctx, backArm.fist.x, backArm.fist.y, f.accent);
  ctx.strokeStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(4, shoulderY + 4);
  ctx.lineTo(frontArm.elbow.x, frontArm.elbow.y);
  ctx.lineTo(frontArm.fist.x, frontArm.fist.y);
  ctx.stroke();
  Game.drawFist(ctx, frontArm.fist.x, frontArm.fist.y, f.accent);

  // --- kafa + saç bandi ---
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(9, headY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = f.accent;
  ctx.fillRect(-3, headY - 7, 24, 5);

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

Game.drawFist = function (ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
};

// '#rrggbb' rengini verilen miktar kadar açar/koyulastirir.
Game.shade = function (hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v + amount));
  const r = clamp(n >> 16);
  const g = clamp((n >> 8) & 0xff);
  const b = clamp(n & 0xff);
  return `rgb(${r},${g},${b})`;
};
