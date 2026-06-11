window.Game = window.Game || {};

// Üç arena: Kulüp, Otopark, Metro. Her biri kendi paleti, sahne ögeleri ve
// müzik ayariyla gelir. Kalabalik "hype" degerine göre cosar (hizli sallanir).
Game.Arena = (function () {
  const W = 960;

  // deterministik "rastgele": her yüklemede ayni kalabalik/araba dizilimi
  function rng(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }

  function makeCrowd(seed, y, spacing) {
    const r = rng(seed);
    const out = [];
    for (let x = -20; x < 1000; x += spacing + r() * 18) {
      out.push({ x, y, size: 16 + r() * 10, phase: r() * Math.PI * 2, tone: 14 + Math.floor(r() * 16) });
    }
    return out;
  }

  // hype 0..1: kalabalik daha hizli ve genis sallanir, kollar havaya kalkar
  function drawCrowd(ctx, crowd, t, hype) {
    const speed = 2.2 + hype * 5;
    const amp = 4 + hype * 7;
    for (const c of crowd) {
      const bob = Math.sin(t * speed + c.phase) * amp;
      const baseY = c.y + bob;
      ctx.fillStyle = `rgb(${c.tone},${c.tone},${c.tone + 6})`;
      ctx.beginPath();
      ctx.arc(c.x, baseY, c.size * 0.55, 0, Math.PI * 2); // kafa
      ctx.fill();
      ctx.beginPath(); // omuzlar
      ctx.ellipse(c.x, baseY + c.size * 0.9, c.size, c.size * 0.6, 0, Math.PI, 0);
      ctx.fill();
      if (hype > 0.45 && Math.sin(t * speed + c.phase) > 0.2) { // havaya kalkan kollar
        ctx.strokeStyle = `rgb(${c.tone},${c.tone},${c.tone + 6})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(c.x - c.size * 0.7, baseY + c.size * 0.5);
        ctx.lineTo(c.x - c.size * 1.1, baseY - c.size * 0.9);
        ctx.moveTo(c.x + c.size * 0.7, baseY + c.size * 0.5);
        ctx.lineTo(c.x + c.size * 1.1, baseY - c.size * 0.9);
        ctx.stroke();
      }
    }
  }

  function drawFloor(ctx, groundY, top, bottom) {
    const floor = ctx.createLinearGradient(0, groundY, 0, 540);
    floor.addColorStop(0, top);
    floor.addColorStop(1, bottom);
    ctx.fillStyle = floor;
    ctx.fillRect(0, groundY, W, 540 - groundY);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
  }

  function fadeStrip(ctx, groundY) {
    const fade = ctx.createLinearGradient(0, 330, 0, groundY);
    fade.addColorStop(0, 'rgba(10,10,16,0)');
    fade.addColorStop(1, 'rgba(10,10,16,0.55)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 330, W, groundY - 330);
  }

  // ---- KULÜP ----
  const clubCrowd = makeCrowd(7, 332, 34);
  function drawClub(ctx, t, hype) {
    const groundY = Game.ARENA.groundY;
    const wall = ctx.createLinearGradient(0, 0, 0, groundY);
    wall.addColorStop(0, '#0b0b14');
    wall.addColorStop(1, '#1a1424');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, groundY);

    // neon tabela
    ctx.save();
    ctx.font = 'bold 38px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 14 + Math.sin(t * 3.1) * 5 + hype * 8;
    ctx.fillStyle = '#ff5e9c';
    ctx.fillText('SOKAK KRALI', W / 2, 86);
    ctx.restore();

    // duvar lambalari
    for (let i = 0; i < 4; i++) {
      const lx = 140 + i * 230;
      ctx.fillStyle = 'rgba(255, 190, 90, 0.10)';
      ctx.beginPath();
      ctx.moveTo(lx, 120);
      ctx.lineTo(lx - 55, 330);
      ctx.lineTo(lx + 55, 330);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd27a';
      ctx.fillRect(lx - 5, 114, 10, 7);
    }

    drawFloor(ctx, groundY, '#2a2233', '#121018');
    drawCrowd(ctx, clubCrowd, t, hype);

    // kenar hoparlör kuleleri: firlatma hedefi olan sert yüzeyler
    for (const sx of [10, W - 10 - 64]) {
      ctx.fillStyle = '#1c1822';
      ctx.fillRect(sx, 300, 64, groundY - 300);
      ctx.strokeStyle = '#2e2838';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 4, 306, 56, 70);
      ctx.strokeRect(sx + 4, 384, 56, 80);
      for (const [cy, r] of [[341, 20], [424, 24]]) {
        ctx.fillStyle = '#0c0a10';
        ctx.beginPath();
        ctx.arc(sx + 32, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a3346';
        ctx.beginPath();
        ctx.arc(sx + 32, cy, r * (0.55 + Math.sin(t * 7) * (0.04 + hype * 0.05)), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    fadeStrip(ctx, groundY);
  }

  // ---- OTOPARK ----
  const parkCrowd = makeCrowd(23, 352, 40);
  const parkCars = (() => {
    const r = rng(51);
    const palette = ['#3a2d4e', '#2d3a4e', '#4e2d35', '#37402a'];
    return [80, 330, 620, 840].map((x) => ({
      x: x + r() * 30, w: 150 + r() * 30, color: palette[Math.floor(r() * palette.length)],
    }));
  })();
  function drawPark(ctx, t, hype) {
    const groundY = Game.ARENA.groundY;
    const wall = ctx.createLinearGradient(0, 0, 0, groundY);
    wall.addColorStop(0, '#101216');
    wall.addColorStop(1, '#1d2026');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, groundY);

    // beton tavan ve titreyen floresanlar
    ctx.fillStyle = '#15171c';
    ctx.fillRect(0, 0, W, 70);
    for (let i = 0; i < 5; i++) {
      const lx = 90 + i * 200;
      const flicker = i === 2 && Math.sin(t * 23) > 0.92 ? 0.25 : 1; // bozuk lamba
      ctx.fillStyle = `rgba(190, 230, 255, ${0.85 * flicker})`;
      ctx.fillRect(lx - 38, 64, 76, 7);
      ctx.fillStyle = `rgba(160, 210, 255, ${0.07 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(lx - 38, 71);
      ctx.lineTo(lx - 90, 350);
      ctx.lineTo(lx + 90, 350);
      ctx.lineTo(lx + 38, 71);
      ctx.closePath();
      ctx.fill();
    }
    // kat yazisi
    ctx.font = 'bold 64px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(232, 193, 45, 0.18)';
    ctx.fillText('KAT -3', W / 2, 200);

    // park halindeki arabalar (kalabaligin arkasinda)
    for (const c of parkCars) {
      const cy = 296;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(c.x, cy + 44);
      ctx.lineTo(c.x + 8, cy + 16);
      ctx.lineTo(c.x + c.w * 0.25, cy + 12);
      ctx.lineTo(c.x + c.w * 0.38, cy - 8);
      ctx.lineTo(c.x + c.w * 0.72, cy - 8);
      ctx.lineTo(c.x + c.w * 0.84, cy + 12);
      ctx.lineTo(c.x + c.w - 6, cy + 16);
      ctx.lineTo(c.x + c.w, cy + 44);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(170, 210, 235, 0.25)'; // camlar
      ctx.fillRect(c.x + c.w * 0.4, cy - 5, c.w * 0.3, 14);
      ctx.fillStyle = '#0c0d10'; // tekerler
      for (const wx of [c.x + c.w * 0.22, c.x + c.w * 0.78]) {
        ctx.beginPath();
        ctx.arc(wx, cy + 44, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawFloor(ctx, groundY, '#23262d', '#101216');
    // yag lekeleri ve park çizgileri
    ctx.strokeStyle = 'rgba(232, 193, 45, 0.18)';
    ctx.lineWidth = 4;
    for (const lx of [180, 480, 780]) {
      ctx.beginPath();
      ctx.moveTo(lx, groundY + 12);
      ctx.lineTo(lx - 30, 538);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(620, groundY + 40, 60, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    drawCrowd(ctx, parkCrowd, t, hype);

    // kenarlarda beton kolonlar (duvar çarpma yüzeyi)
    for (const px of [6, W - 6 - 56]) {
      ctx.fillStyle = '#2a2d35';
      ctx.fillRect(px, 70, 56, groundY - 70);
      ctx.fillStyle = '#e8c12d';
      for (let sy = 90; sy < groundY - 30; sy += 60) {
        ctx.fillRect(px, sy, 56, 10);
        ctx.fillStyle = '#16171b';
        ctx.fillRect(px, sy + 10, 56, 10);
        ctx.fillStyle = '#e8c12d';
      }
    }
    fadeStrip(ctx, groundY);
  }

  // ---- METRO ----
  const metroCrowd = makeCrowd(91, 356, 44);
  function drawMetro(ctx, t, hype) {
    const groundY = Game.ARENA.groundY;
    ctx.fillStyle = '#0d1114';
    ctx.fillRect(0, 0, W, groundY);

    // fayansli duvar
    ctx.fillStyle = '#1b262b';
    ctx.fillRect(0, 60, W, 210);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    for (let y = 60; y <= 270; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, 270);
      ctx.stroke();
    }

    // istasyon tabelasi
    ctx.fillStyle = '#11181c';
    ctx.fillRect(W / 2 - 170, 96, 340, 54);
    ctx.strokeStyle = '#3d565f';
    ctx.lineWidth = 3;
    ctx.strokeRect(W / 2 - 170, 96, 340, 54);
    ctx.font = 'bold 30px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fe8ff';
    ctx.fillText('SON DURAK', W / 2, 133);

    // duran tren: pencerelerinden hafif isik
    const ty = 270;
    ctx.fillStyle = '#232a31';
    ctx.fillRect(-10, ty, W + 20, 84);
    ctx.fillStyle = '#2e373f';
    ctx.fillRect(-10, ty, W + 20, 14);
    for (let wx = 24; wx < W; wx += 96) {
      const lit = Math.sin(wx * 13.7) > -0.3;
      ctx.fillStyle = lit ? 'rgba(255, 226, 150, 0.5)' : 'rgba(120, 150, 170, 0.18)';
      ctx.fillRect(wx, ty + 22, 56, 30);
    }
    // kapilar
    for (let dx = 220; dx < W; dx += 320) {
      ctx.fillStyle = '#1a2026';
      ctx.fillRect(dx, ty + 14, 44, 70);
    }
    // tren farinin parlamasi (hype ile nefes alir)
    ctx.fillStyle = `rgba(255, 240, 200, ${0.06 + hype * 0.05 + Math.sin(t * 1.7) * 0.02})`;
    ctx.fillRect(-10, ty, W + 20, 84);

    drawFloor(ctx, groundY, '#2c2f33', '#131517');
    // peron güvenlik çizgisi
    ctx.fillStyle = 'rgba(232, 193, 45, 0.5)';
    ctx.fillRect(0, groundY + 6, W, 6);

    drawCrowd(ctx, metroCrowd, t, hype);

    // kenar kolonlari (çarpma yüzeyi)
    for (const px of [10, W - 10 - 44]) {
      ctx.fillStyle = '#26333a';
      ctx.fillRect(px, 60, 44, groundY - 60);
      ctx.strokeStyle = '#11181c';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 6, 70, 32, groundY - 140);
    }
    fadeStrip(ctx, groundY);
  }

  const ARENAS = {
    club: { label: 'KULÜP', music: { bpm: 96, bass: [55, 55, 65.4, 49] }, draw: drawClub },
    otopark: { label: 'OTOPARK', music: { bpm: 86, bass: [49, 49, 58.3, 43.7] }, draw: drawPark },
    metro: { label: 'METRO', music: { bpm: 106, bass: [61.7, 61.7, 73.4, 55] }, draw: drawMetro },
  };
  const KEYS = Object.keys(ARENAS);

  let current = 'club';

  return {
    KEYS,
    get current() { return current; },
    get data() { return ARENAS[current]; },
    set(key) { current = ARENAS[key] ? key : 'club'; },
    random() { current = KEYS[Math.floor(Math.random() * KEYS.length)]; return current; },
    draw(ctx, t, hype = 0) { ARENAS[current].draw(ctx, t, Math.max(0, Math.min(1, hype))); },
  };
})();
