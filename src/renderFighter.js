window.Game = window.Game || {};

// Stile özgü görünüm: ten, saç, kiyafet ve vücut tipi.
// f.color = kiyafet ana rengi (P1/P2 ayrimi), f.accent = ikincil (bant/kemer/bandaj).
Game.STYLE_LOOK = {
  sokak: { skin: '#c98e63', hair: '#1d1410', hairStyle: 'cap', outfit: 'tank', pants: 'jeans', build: 1.0 },
  kickbox: { skin: '#8a5a3b', hair: '#15100c', hairStyle: 'short', outfit: 'bare', pants: 'shorts', build: 1.05, wraps: true },
  gures: { skin: '#d9a06f', hair: '#2b1a12', hairStyle: 'bald', outfit: 'singlet', pants: 'singlet', build: 1.3 },
  sanat: { skin: '#e8b88a', hair: '#0d0d12', hairStyle: 'bun', outfit: 'gi', pants: 'gi', build: 0.88 },
  submission: { skin: '#b97f55', hair: '#15100d', hairStyle: 'mohawk', outfit: 'rash', pants: 'shorts2', build: 1.1 },
};

// Incelen uzuv: koyu kontur + kalin üst segment + ince alt segment (cel-shade)
function limb(ctx, x0, y0, x1, y1, x2, y2, w1, w2, c1, c2) {
  ctx.strokeStyle = '#14101a';
  ctx.lineWidth = w1 + 3.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
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
  // sprite sheet varsa o çizer; yoksa vektör kukla (fallback) devam eder
  if (Game.Sprites && Game.Sprites.draw(ctx, f, t, opts)) return;
  const groundY = Game.ARENA.groundY;
  const footY = groundY - f.y;
  const look = Game.STYLE_LOOK[f.style] || Game.STYLE_LOOK.sokak;
  const B = look.build;
  const skin = look.skin;
  const skinDark = Game.shade(skin, -28);
  const suit = f.color;
  const suitDark = Game.shade(f.color, -38);
  const pose = Game.Anim.pose(f, t);

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

  // yere serilme ve duruma göre tüm-gövde dönmeleri (klip degil, sahne efekti)
  let lie = 0;
  if (f.state === 'down' || f.state === 'ko') lie = Math.min(1, f.stateTime / 0.18);
  else if (f.state === 'getup') lie = 1 - Math.min(1, f.stateTime / 0.35);
  ctx.rotate(-lie * Math.PI / 2);
  if (f.state === 'thrown') ctx.rotate(-f.stateTime * 8);
  else if (f.state === 'launched') ctx.rotate(-0.55 - f.stateTime * 0.8);
  else if (f.state === 'staggered') ctx.rotate(Math.sin(f.stateTime * 18) * 0.14);
  else if (f.state === 'crowdhold') ctx.rotate(-0.28);
  else if (f.state === 'held') ctx.rotate(-0.1);
  else if (f.state === 'run') ctx.rotate(0.14);

  // klipten gelen gövde dönmesi
  ctx.rotate(pose.t);

  const hipY = -52 + pose.cr * 0.6;
  const shoulderY = -96 + pose.cr;
  const headY = -116 + pose.cr;

  // kanal -> mutlak nokta
  const legPt = (k, fp) => ({
    knee: { x: k[0], y: hipY + k[1] },
    foot: { x: fp[0], y: fp[1] },
  });
  const armPt = (e, h) => ({
    elbow: { x: e[0], y: shoulderY + e[1] },
    fist: { x: h[0], y: shoulderY + h[1] },
  });
  const frontLeg = legPt(pose.flk, pose.flf);
  const backLeg = legPt(pose.blk, pose.blf);
  const frontArm = armPt(pose.fae, pose.faf);
  const backArm = armPt(pose.bae, pose.baf);

  // ---- ÇIZIM (arkadan öne) ----
  const thighW = 15 * B;
  const calfW = 10 * B;
  const upperArmW = 11 * B;
  const foreArmW = 8 * B;
  const pantsCol = look.pants === 'jeans' ? '#2b3038'
    : look.pants === 'gi' ? '#ddd6c8'
    : look.pants === 'singlet' || look.pants === 'shorts' ? suit
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
    ctx.fillStyle = f.style === 'sanat' ? skin : '#17141c';
    ctx.beginPath();
    ctx.ellipse(x + 4, y - 2, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // arka kol
  limb(ctx, 2, shoulderY + 4, backArm.elbow.x, backArm.elbow.y, backArm.fist.x, backArm.fist.y, upperArmW, foreArmW, armColD, armColD);
  handFor(pose.bh, backArm.fist.x, backArm.fist.y, true);

  // arka bacak
  limb(ctx, 0, hipY, backLeg.knee.x, backLeg.knee.y, backLeg.foot.x, backLeg.foot.y, thighW, calfW, Game.shadeAny(pantsCol, -30), Game.shadeAny(calfCol, -30));
  shoe(backLeg.foot.x, backLeg.foot.y);

  // ön bacak
  limb(ctx, 2, hipY, frontLeg.knee.x, frontLeg.knee.y, frontLeg.foot.x, frontLeg.foot.y, thighW, calfW, pantsCol, calfCol);
  shoe(frontLeg.foot.x, frontLeg.foot.y);

  // ---- GÖVDE ----
  const shW = 15 * B;
  const hpW = 10 * B;
  ctx.beginPath();
  ctx.moveTo(-shW + 4, shoulderY - 4);
  ctx.quadraticCurveTo(4, shoulderY - 12, shW + 6, shoulderY - 2);
  ctx.quadraticCurveTo(shW + 8, shoulderY + 24, hpW + 2, hipY + 6);
  ctx.lineTo(-hpW + 2, hipY + 6);
  ctx.quadraticCurveTo(-shW - 2, shoulderY + 24, -shW + 4, shoulderY - 4);
  ctx.closePath();
  ctx.strokeStyle = '#14101a'; // kontur
  ctx.lineWidth = 3;
  ctx.stroke();
  if (look.outfit === 'bare') {
    ctx.fillStyle = skin;
    ctx.fill();
  } else {
    ctx.fillStyle = suit;
    ctx.fill();
  }
  const tg = ctx.createLinearGradient(-shW, 0, shW, 0);
  tg.addColorStop(0, 'rgba(0,0,0,0.28)');
  tg.addColorStop(0.55, 'rgba(0,0,0,0)');
  ctx.fillStyle = tg;
  ctx.fill();

  // kiyafet detaylari
  if (look.outfit === 'tank') {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(4, shoulderY - 2, shW * 0.55, 6, 0, Math.PI, 0);
    ctx.fill();
  } else if (look.outfit === 'gi') {
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, shoulderY - 4);
    ctx.lineTo(-2, hipY - 6);
    ctx.stroke();
    ctx.fillStyle = f.accent;
    ctx.fillRect(-hpW, hipY - 2, hpW * 2 + 4, 7);
  } else if (look.outfit === 'singlet') {
    ctx.strokeStyle = suitDark;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-7, shoulderY - 2);
    ctx.lineTo(-5, shoulderY + 16);
    ctx.moveTo(13, shoulderY - 2);
    ctx.lineTo(11, shoulderY + 16);
    ctx.stroke();
  } else if (look.outfit === 'rash') {
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
  if (look.hairStyle === 'cap') {
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
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(hx - 3, headY - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = look.hair;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx + 6, headY + 6);
    ctx.lineTo(hx + 13, headY + 7);
    ctx.stroke();
  } else if (look.hairStyle === 'bun') {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(hx, headY - 3, 12, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx - 6, headY - 13, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (look.hairStyle === 'mohawk') {
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
  // yüz
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
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.arc(hx, headY + 5, 9, 0, Math.PI);
  ctx.fill();
  if (look.hairStyle !== 'cap' && look.hairStyle !== 'mohawk') {
    ctx.fillStyle = f.accent;
    ctx.fillRect(hx - 12, headY - 7, 24, 4);
  }

  // ön kol (en önde)
  limb(ctx, 4, shoulderY + 4, frontArm.elbow.x, frontArm.elbow.y, frontArm.fist.x, frontArm.fist.y, upperArmW, foreArmW, armCol, armCol);
  handFor(pose.fh, frontArm.fist.x, frontArm.fist.y, false);

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

// Saldiri animasyonunun uzanma orani (efektler için hâlâ kullanisli).
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
// 'rgb(...)' veya '#...' fark etmeksizin koyulastirir
Game.shadeAny = function (c, amount) {
  if (c.startsWith('#')) return Game.shade(c, amount);
  const m = c.match(/\d+/g).map(Number);
  const cl = (v) => Math.max(0, Math.min(255, v + amount));
  return `rgb(${cl(m[0])},${cl(m[1])},${cl(m[2])})`;
};
