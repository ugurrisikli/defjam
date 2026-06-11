window.Game = window.Game || {};

// Kulüp arenasi: karanlik duvar, neon tabela, zemin ve sallanan kalabalik silüeti.
Game.Arena = (function () {
  const crowd = [];
  // deterministik "rastgele" dagilim: her yüklemede ayni kalabalik
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let x = -20; x < 1000; x += 34 + rand() * 18) {
    crowd.push({
      x,
      size: 16 + rand() * 10,
      phase: rand() * Math.PI * 2,
      tone: 14 + Math.floor(rand() * 16),
    });
  }

  function draw(ctx, t) {
    const W = 960;
    const groundY = Game.ARENA.groundY;

    // arka duvar
    const wall = ctx.createLinearGradient(0, 0, 0, groundY);
    wall.addColorStop(0, '#0b0b14');
    wall.addColorStop(1, '#1a1424');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, groundY);

    // neon tabela
    ctx.save();
    ctx.font = 'bold 38px Impact, sans-serif';
    ctx.textAlign = 'center';
    const glow = 14 + Math.sin(t * 3.1) * 5;
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = glow;
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

    // zemin
    const floor = ctx.createLinearGradient(0, groundY, 0, 540);
    floor.addColorStop(0, '#2a2233');
    floor.addColorStop(1, '#121018');
    ctx.fillStyle = floor;
    ctx.fillRect(0, groundY, W, 540 - groundY);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // kalabalik: ritimle sallanan kafa+omuz silüetleri
    for (const c of crowd) {
      const bob = Math.sin(t * 2.2 + c.phase) * 4;
      const baseY = 332 + bob;
      ctx.fillStyle = `rgb(${c.tone},${c.tone},${c.tone + 6})`;
      ctx.beginPath();
      ctx.arc(c.x, baseY, c.size * 0.55, 0, Math.PI * 2); // kafa
      ctx.fill();
      ctx.beginPath(); // omuzlar
      ctx.ellipse(c.x, baseY + c.size * 0.9, c.size, c.size * 0.6, 0, Math.PI, 0);
      ctx.fill();
    }
    // kalabalik önü karartma seridi (derinlik hissi)
    const fade = ctx.createLinearGradient(0, 330, 0, groundY);
    fade.addColorStop(0, 'rgba(10,10,16,0)');
    fade.addColorStop(1, 'rgba(10,10,16,0.55)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 330, W, groundY - 330);
  }

  return { draw };
})();
