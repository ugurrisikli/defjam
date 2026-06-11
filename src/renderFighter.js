window.Game = window.Game || {};

// Kodla çizilen eklemli siluet dövüsçü.
// Tüm uzuvlar yuvarlak uçlu kalin çizgiler; sprite dosyasi gerekmez.
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

  const breathe = f.state === 'idle' ? Math.sin(t * 2.6) * 2 : 0;
  const swing = f.state === 'walk' ? Math.sin(f.walkPhase) : 0;
  const inAir = f.state === 'jump';

  // iskelet ölçüleri (ayak hizasi y=0, yukari negatif)
  const hipY = -52 + breathe * 0.4;
  const shoulderY = -96 + breathe;
  const headY = -116 + breathe;

  // --- bacaklar ---
  ctx.strokeStyle = f.color;
  ctx.lineWidth = 13;
  const legs = inAir
    ? [
        { foot: { x: 14, y: -26 }, knee: { x: 22, y: hipY * 0.55 } },
        { foot: { x: -10, y: -18 }, knee: { x: 2, y: hipY * 0.5 } },
      ]
    : [
        { foot: { x: swing * 19, y: -Math.max(0, swing) * 9 }, knee: { x: swing * 11 + 6, y: hipY * 0.5 } },
        { foot: { x: -swing * 19, y: -Math.max(0, -swing) * 9 }, knee: { x: -swing * 11 + 6, y: hipY * 0.5 } },
      ];
  for (const leg of legs) {
    ctx.beginPath();
    ctx.moveTo(2, hipY);
    ctx.lineTo(leg.knee.x, leg.knee.y);
    ctx.lineTo(leg.foot.x, leg.foot.y);
    ctx.stroke();
  }

  // --- gövde: hafif öne egik ---
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(6, shoulderY);
  ctx.stroke();

  // --- kollar: gard pozisyonu, yürürken hafif salinim ---
  ctx.lineWidth = 11;
  const armBob = swing * 4;
  // arka kol (gövdenin gerisinde kalsin diye önce çizilir, koyu ton)
  ctx.strokeStyle = Game.shade(f.color, -25);
  ctx.beginPath();
  ctx.moveTo(4, shoulderY + 4);
  ctx.lineTo(20, shoulderY + 18 - armBob);
  ctx.lineTo(30, shoulderY + 4 - armBob);
  ctx.stroke();
  Game.drawFist(ctx, 30, shoulderY + 4 - armBob, f.accent);
  // ön kol
  ctx.strokeStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(4, shoulderY + 4);
  ctx.lineTo(16, shoulderY + 24 + armBob);
  ctx.lineTo(34, shoulderY + 14 + armBob);
  ctx.stroke();
  Game.drawFist(ctx, 34, shoulderY + 14 + armBob, f.accent);

  // --- kafa + saç bandi ---
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(9, headY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = f.accent;
  ctx.fillRect(-3, headY - 7, 24, 5);

  ctx.restore();
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
