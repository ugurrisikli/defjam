window.Game = window.Game || {};

Game.scenes = {};

// ----- ANA MENÜ -----
Game.scenes.menu = {
  update() {
    if (Game.Input.wasPressed('Enter')) Game.changeScene('match');
  },
  render(ctx, canvas) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.save();
    ctx.font = 'bold 72px Impact, sans-serif';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ff5e9c';
    ctx.fillText('SOKAK KRALI', W / 2, 170);
    ctx.restore();

    ctx.font = '20px monospace';
    ctx.fillStyle = '#8a8a9a';
    ctx.fillText('Yeralti dövüs arenasina hosgeldin', W / 2, 215);

    if (Math.floor(Game.time * 2) % 2 === 0) {
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('BASLA — ENTER', W / 2, 310);
    }

    ctx.font = '16px monospace';
    ctx.fillStyle = '#55556a';
    ctx.fillText('P1: A/D yürü · W zipla · J yumruk · K tekme · S blok', W / 2, 410);
    ctx.fillText('P2: Oklar · , yumruk · . tekme · asagi ok blok', W / 2, 436);
    ctx.fillText('Menüye dönüs: ESC', W / 2, 462);
  },
};

// ----- MAÇ -----
Game.scenes.match = {
  enter() {
    this.p1 = new Game.Fighter({ name: 'OYUNCU 1', x: 320, facing: 1, color: '#e8512d', accent: '#ffd27a' });
    this.p2 = new Game.Fighter({ name: 'OYUNCU 2', x: 640, facing: -1, color: '#2d9de8', accent: '#aef3ff' });
    this.phase = 'intro'; // intro -> fight -> over
    this.phaseTime = 0;
    this.hitstop = 0;
    this.shake = 0;
    this.sparks = [];
    this.winner = null;
  },

  update(dt) {
    const I = Game.Input;
    if (I.wasPressed('Escape')) {
      Game.changeScene('menu');
      return;
    }
    this.phaseTime += dt;
    this.updateSparks(dt);
    this.shake *= Math.max(0, 1 - 10 * dt);

    // hit-stop: vurus ani donar, sadece efektler akar
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }

    const idle = {};
    if (this.phase === 'intro') {
      this.p1.update(dt, idle);
      this.p2.update(dt, idle);
      if (this.phaseTime >= 1.1) { this.phase = 'fight'; this.phaseTime = 0; }
      return;
    }

    if (this.phase === 'over') {
      if (I.wasPressed('Enter')) { this.enter(); return; }
      this.p1.update(dt, idle);
      this.p2.update(dt, idle);
      return;
    }

    // --- fight ---
    const in1 = {
      left: I.isDown('KeyA'), right: I.isDown('KeyD'), jump: I.isDown('KeyW'),
      punch: I.wasPressed('KeyJ'), kick: I.wasPressed('KeyK'), block: I.isDown('KeyS'),
    };
    const in2 = {
      left: I.isDown('ArrowLeft'), right: I.isDown('ArrowRight'), jump: I.isDown('ArrowUp'),
      punch: I.wasPressed('Comma'), kick: I.wasPressed('Period'), block: I.isDown('ArrowDown'),
    };
    this.p1.update(dt, in1);
    this.p2.update(dt, in2);

    // dövüsçüler birbirine bakar (saldiri sirasinda yön kilitli)
    if (this.p1.canTurn()) this.p1.facing = this.p2.x >= this.p1.x ? 1 : -1;
    if (this.p2.canTurn()) this.p2.facing = this.p1.x >= this.p2.x ? 1 : -1;

    Game.Combat.separate(this.p1, this.p2);
    this.applyEvent(Game.Combat.resolve(this.p1, this.p2));
    this.applyEvent(Game.Combat.resolve(this.p2, this.p1));

    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      this.phase = 'over';
      this.phaseTime = 0;
      this.winner = this.p1.hp > 0 ? this.p1 : this.p2;
    }
  },

  applyEvent(ev) {
    if (!ev) return;
    if (ev.type === 'hit') {
      this.hitstop = ev.attack.hitstop;
      this.shake = ev.attack.shake;
      this.spawnSparks(ev.x, ev.y, 9, '#ffb347');
    } else if (ev.type === 'block') {
      this.hitstop = 0.03;
      this.spawnSparks(ev.x, ev.y, 5, '#cfd8ff');
    }
  },

  spawnSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 220;
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.3 + Math.random() * 0.2, color });
    }
  },

  updateSparks(dt) {
    for (const p of this.sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
  },

  render(ctx, canvas) {
    ctx.save();
    if (this.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2);
    }
    Game.Arena.draw(ctx, Game.time);
    const order = this.p1.y <= this.p2.y ? [this.p2, this.p1] : [this.p1, this.p2];
    for (const f of order) Game.drawFighter(ctx, f, Game.time);
    for (const p of this.sparks) {
      ctx.globalAlpha = Math.max(0, p.life / 0.4);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    this.drawHud(ctx, canvas);
    this.drawBanners(ctx, canvas);
  },

  drawHud(ctx, canvas) {
    const W = canvas.width;
    this.drawHealthBar(ctx, 24, 22, 360, this.p1, false);
    this.drawHealthBar(ctx, W - 24 - 360, 22, 360, this.p2, true);
  },

  drawHealthBar(ctx, x, y, w, f, mirrored) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 3, y - 3, w + 6, 24);
    ctx.fillStyle = '#3a1020';
    ctx.fillRect(x, y, w, 18);
    const ratio = f.hp / f.maxHp;
    const fw = w * ratio;
    ctx.fillStyle = ratio > 0.35 ? '#e8c12d' : '#e8512d';
    ctx.fillRect(mirrored ? x + w - fw : x, y, fw, 18);
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = mirrored ? 'right' : 'left';
    ctx.fillStyle = f.color;
    ctx.fillText(f.name, mirrored ? x + w : x, y + 36);
  },

  drawBanners(ctx, canvas) {
    const W = canvas.width;
    ctx.textAlign = 'center';
    if (this.phase === 'intro') {
      ctx.font = 'bold 56px Impact, sans-serif';
      if (this.phaseTime < 0.6) {
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText('HAZIR...', W / 2, 250);
      } else {
        ctx.save();
        ctx.shadowColor = '#ff2d78';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffd27a';
        ctx.fillText('DÖVÜS!', W / 2, 250);
        ctx.restore();
      }
    } else if (this.phase === 'fight' && this.phaseTime < 0.4) {
      ctx.save();
      ctx.globalAlpha = 1 - this.phaseTime / 0.4;
      ctx.font = 'bold 56px Impact, sans-serif';
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('DÖVÜS!', W / 2, 250);
      ctx.restore();
    } else if (this.phase === 'over') {
      ctx.save();
      ctx.font = 'bold 84px Impact, sans-serif';
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 28;
      ctx.fillStyle = '#ff5e9c';
      ctx.fillText('K.O.!', W / 2, 230);
      ctx.restore();
      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = this.winner.color;
      ctx.fillText(this.winner.name + ' KAZANDI', W / 2, 285);
      if (this.phaseTime > 1 && Math.floor(Game.time * 2) % 2 === 0) {
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#ffd27a';
        ctx.fillText('ENTER — tekrar maç · ESC — menü', W / 2, 340);
      }
    }
  },
};
