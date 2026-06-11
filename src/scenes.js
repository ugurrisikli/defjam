window.Game = window.Game || {};

Game.scenes = {};
Game.matchStyles = { p1: 'sokak', p2: 'sokak' };
Game.matchMode = 'ai'; // 'ai' = tek oyuncu, '2p' = iki oyuncu

// ----- ANA MENÜ -----
Game.scenes.menu = {
  enter() {
    this.sel = 0;
    Game.Audio.stopMusic();
  },
  update() {
    const I = Game.Input;
    if (I.wasPressed('KeyW') || I.wasPressed('ArrowUp')) { this.sel = (this.sel + 1) % 2; Game.Audio.play('blip'); }
    if (I.wasPressed('KeyS') || I.wasPressed('ArrowDown')) { this.sel = (this.sel + 1) % 2; Game.Audio.play('blip'); }
    if (I.wasPressed('Enter')) {
      Game.matchMode = this.sel === 0 ? 'ai' : '2p';
      Game.Audio.play('lock');
      Game.changeScene('select');
    }
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
    ctx.fillText('SOKAK KRALI', W / 2, 150);
    ctx.restore();

    ctx.font = '20px monospace';
    ctx.fillStyle = '#8a8a9a';
    ctx.fillText('Yeralti dövüs arenasina hosgeldin', W / 2, 195);

    const opts = ['TEK OYUNCU', 'IKI OYUNCU'];
    for (let i = 0; i < opts.length; i++) {
      const selected = this.sel === i;
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = selected ? '#ffd27a' : '#55556a';
      ctx.fillText((selected ? '> ' : '') + opts[i] + (selected ? ' <' : ''), W / 2, 258 + i * 38);
    }
    ctx.font = '15px monospace';
    ctx.fillStyle = '#8a8a9a';
    ctx.fillText('W/S seç · ENTER basla · M ses aç/kapa', W / 2, 330);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#55556a';
    ctx.fillText('P1: A/D yürü (çift dokun: KOS) · W zipla · J yumruk · K tekme · L tut · S blok · BOSLUK blazin', W / 2, 360);
    ctx.fillText('P2: Oklar (çift dokun: KOS) · , yumruk · . tekme · / tut · asagi blok · SAG SHIFT blazin', W / 2, 386);
    ctx.fillText('Kosarken vurus = dalis yumrugu / uçan tekme · Isabet eden vurus zincire baglanir (KOMBO)', W / 2, 412);
    ctx.fillText('Tutunca: yumruk = salla · tekme = STIL ÖZEL HAMLESI · tutma = firlat (+yön)', W / 2, 438);
    ctx.fillText('2 round alan maçi kazanir · Momentum dolunca BOSLUK = BLAZIN! · ESC menü', W / 2, 464);
  },
};

// ----- STIL SEÇIMI -----
Game.scenes.select = {
  enter() {
    this.i1 = 0;
    this.i2 = 1;
    this.lock1 = false;
    this.lock2 = false;
    this.startDelay = 0;
    // önceki ekrandan tasinan Enter basisinin P2'yi aninda onaylamasini önler
    this.inputCooldown = 0.15;
    this.aiMode = Game.matchMode === 'ai';
    Game.Audio.stopMusic();
    if (this.aiMode) {
      // rakip stilini kendisi seçer
      this.i2 = Math.floor(Math.random() * Game.STYLE_KEYS.length);
      this.lock2 = true;
    }
  },
  update(dt) {
    const I = Game.Input;
    const n = Game.STYLE_KEYS.length;
    if (I.wasPressed('Escape')) { Game.changeScene('menu'); return; }
    if (this.inputCooldown > 0) { this.inputCooldown -= dt; return; }

    if (!this.lock1) {
      if (I.wasPressed('KeyA')) { this.i1 = (this.i1 + n - 1) % n; Game.Audio.play('blip'); }
      if (I.wasPressed('KeyD')) { this.i1 = (this.i1 + 1) % n; Game.Audio.play('blip'); }
      if (I.wasPressed('KeyJ')) { this.lock1 = true; Game.Audio.play('lock'); }
    } else if (I.wasPressed('KeyK')) this.lock1 = false;

    if (!this.aiMode) {
      if (!this.lock2) {
        if (I.wasPressed('ArrowLeft')) { this.i2 = (this.i2 + n - 1) % n; Game.Audio.play('blip'); }
        if (I.wasPressed('ArrowRight')) { this.i2 = (this.i2 + 1) % n; Game.Audio.play('blip'); }
        if (I.wasPressed('Enter')) { this.lock2 = true; Game.Audio.play('lock'); }
      } else if (I.wasPressed('Period')) this.lock2 = false;
    }

    if (this.lock1 && this.lock2) {
      this.startDelay += dt;
      if (this.startDelay >= 0.7) {
        Game.matchStyles = { p1: Game.STYLE_KEYS[this.i1], p2: Game.STYLE_KEYS[this.i2] };
        Game.changeScene('match');
      }
    } else {
      this.startDelay = 0;
    }
  },
  render(ctx, canvas) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.save();
    ctx.font = 'bold 44px Impact, sans-serif';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff5e9c';
    ctx.fillText('STILINI SEÇ', W / 2, 70);
    ctx.restore();

    const keys = Game.STYLE_KEYS;
    const cardW = 168;
    const gap = 12;
    const total = keys.length * cardW + (keys.length - 1) * gap;
    let x = (W - total) / 2;

    for (let i = 0; i < keys.length; i++) {
      const st = Game.STYLES[keys[i]];
      const y = 120;
      const cardH = 270;
      const sel1 = this.i1 === i;
      const sel2 = this.i2 === i;

      ctx.fillStyle = '#16121e';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.lineWidth = 3;
      if (sel1 && sel2) ctx.strokeStyle = '#b76de8';
      else if (sel1) ctx.strokeStyle = '#e8512d';
      else if (sel2) ctx.strokeStyle = '#2d9de8';
      else ctx.strokeStyle = '#2a2433';
      ctx.strokeRect(x, y, cardW, cardH);

      ctx.font = 'bold 17px Impact, sans-serif';
      ctx.fillStyle = '#eee6f5';
      ctx.fillText(st.label, x + cardW / 2, y + 32);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#8a8a9a';
      ctx.fillText(st.desc, x + cardW / 2, y + 54);

      // stat çubuklari
      const stats = [
        ['VURUS', (st.strike - 0.6) / 0.8, '#e8512d'],
        ['TUTMA', (st.grapple - 0.6) / 0.9, '#2d9de8'],
        ['HIZ', (st.speed - 0.7) / 0.5, '#e8c12d'],
        ['CAN', (st.hp - 70) / 50, '#6de87a'],
        ['MOMENTUM', (st.momentum - 0.7) / 0.8, '#ffd27a'],
      ];
      let sy = y + 78;
      for (const [label, v, color] of stats) {
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(label, x + 12, sy);
        ctx.fillStyle = '#241e2e';
        ctx.fillRect(x + 12, sy + 4, cardW - 24, 8);
        ctx.fillStyle = color;
        ctx.fillRect(x + 12, sy + 4, (cardW - 24) * Math.max(0.08, Math.min(1, v)), 8);
        sy += 26;
        ctx.textAlign = 'center';
      }
      // hamle listesi
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9a8ab0';
      ctx.fillText('J ' + st.moves.light.name, x + 12, sy + 6);
      ctx.fillText('K ' + st.moves.heavy.name, x + 12, sy + 20);
      ctx.fillStyle = '#ff8de8';
      ctx.fillText('Ö ' + st.moves.special.name + ' · x' + st.chain + ' kombo', x + 12, sy + 34);
      ctx.textAlign = 'center';

      // seçim isaretleri
      if (sel1) {
        ctx.fillStyle = '#e8512d';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(this.lock1 ? 'P1 HAZIR' : 'P1', x + cardW / 2, y + cardH + 22);
      }
      if (sel2) {
        ctx.fillStyle = '#2d9de8';
        ctx.font = 'bold 13px monospace';
        const tag = this.aiMode ? 'RAKIP' : this.lock2 ? 'P2 HAZIR' : 'P2';
        ctx.fillText(tag, x + cardW / 2, y + cardH + (sel1 ? 42 : 22));
      }
      x += cardW + gap;
    }

    ctx.font = '15px monospace';
    ctx.fillStyle = '#55556a';
    if (this.aiMode) {
      ctx.fillText('A/D seç · J onayla · K geri al — rakibin stilini kendisi seçti', W / 2, H - 40);
    } else {
      ctx.fillText('P1: A/D seç · J onayla · K geri al     P2: ←/→ seç · ENTER onayla · . geri al', W / 2, H - 40);
    }
    if (this.lock1 && this.lock2) {
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('DÖVÜS BASLIYOR...', W / 2, H - 80);
    }
  },
};

// ----- MAÇ (2 round alan kazanir) -----
Game.scenes.match = {
  enter() {
    this.aiMode = Game.matchMode === 'ai';
    this.wins = { p1: 0, p2: 0 };
    this.round = 1;
    this.hype = 0;
    Game.Arena.random();
    Game.Audio.startMusic(Game.Arena.data.music);
    this.startRound();
  },

  startRound() {
    this.p1 = new Game.Fighter({
      name: 'OYUNCU 1', x: 320, facing: 1, color: '#e8512d', accent: '#ffd27a',
      style: Game.matchStyles.p1,
    });
    this.p2 = new Game.Fighter({
      name: this.aiMode ? 'RAKIP' : 'OYUNCU 2', x: 640, facing: -1, color: '#2d9de8', accent: '#aef3ff',
      style: Game.matchStyles.p2,
    });
    this.ai = this.aiMode ? new Game.AI(this.p2, { difficulty: 0.55 }) : null;
    this.phase = 'intro'; // intro -> fight -> roundover -> (replay -> over | intro)
    this.phaseTime = 0;
    this.bellRung = false;
    this.firstBlood = false;
    this.hitstop = 0;
    this.shake = 0;
    this.slowmo = 0; // BLAZIN sinematigi: agir çekim süresi
    this.sparks = [];
    this.texts = [];
    this.anno = null; // anonsör satiri
    this.winner = null;
    this.final = false;
    this.koByBlazin = false;
    this.blazinWindow = 0;
    this.tape = []; // K.O. tekrari için son ~3.5 sn kayit
    Game.events.length = 0;
  },

  update(dt) {
    const I = Game.Input;
    if (I.wasPressed('Escape')) {
      Game.Audio.stopMusic();
      Game.changeScene('menu');
      return;
    }
    this.phaseTime += dt;
    this.slowmo = Math.max(0, this.slowmo - dt);
    this.blazinWindow = Math.max(0, (this.blazinWindow || 0) - dt);
    this.hype = Math.max(0, this.hype - dt * 0.25);
    const ts = this.slowmo > 0 ? 0.35 : 1; // agir çekim çarpani
    const gdt = dt * ts;
    this.updateFx(gdt);
    this.shake *= Math.max(0, 1 - 10 * dt);

    // hit-stop: vurus ani donar, sadece efektler akar
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }

    const idle = {};
    if (this.phase === 'intro') {
      this.p1.update(gdt, idle);
      this.p2.update(gdt, idle);
      if (this.phaseTime >= 0.6 && !this.bellRung) {
        this.bellRung = true;
        Game.Audio.play('bell');
      }
      if (this.phaseTime >= 1.1) { this.phase = 'fight'; this.phaseTime = 0; }
      return;
    }

    if (this.phase === 'roundover') {
      // K.O. düsüsü oynarken kaydetmeye devam: tekrar görüntüsüne girsin
      this.p1.update(gdt, idle);
      this.p2.update(gdt, idle);
      this.drainEvents();
      if (this.phaseTime < 1.2) this.record();
      if (this.phaseTime >= 2.2) {
        if (this.final) {
          this.phase = 'replay';
          this.phaseTime = 0;
          Game.Audio.play('bell');
        } else {
          this.round++;
          this.startRound();
        }
      }
      return;
    }

    if (this.phase === 'replay') {
      // kayittaki kareleri agir çekimde oynat; ENTER atlar
      const idx = Math.floor(this.phaseTime * 60 * 0.4);
      if (I.wasPressed('Enter') || idx >= this.tape.length) {
        this.phase = 'over';
        this.phaseTime = 0;
      }
      return;
    }

    if (this.phase === 'over') {
      if (I.wasPressed('Enter')) { Game.Audio.stopMusic(); Game.changeScene('select'); return; }
      this.p1.update(gdt, idle);
      this.p2.update(gdt, idle);
      this.drainEvents();
      return;
    }

    // --- fight ---
    const in1 = {
      left: I.isDown('KeyA'), right: I.isDown('KeyD'), jump: I.isDown('KeyW'),
      punch: I.wasPressed('KeyJ'), kick: I.wasPressed('KeyK'),
      grapple: I.wasPressed('KeyL'), block: I.isDown('KeyS'),
      blazin: I.wasPressed('Space'),
    };
    const in2 = this.ai
      ? this.ai.update(gdt, this.p1)
      : {
          left: I.isDown('ArrowLeft'), right: I.isDown('ArrowRight'), jump: I.isDown('ArrowUp'),
          punch: I.wasPressed('Comma'), kick: I.wasPressed('Period'),
          grapple: I.wasPressed('Slash'), block: I.isDown('ArrowDown'),
          blazin: I.wasPressed('ShiftRight'),
        };
    this.p1.update(gdt, in1);
    this.p2.update(gdt, in2);

    // dövüsçüler birbirine bakar (saldiri/kosu sirasinda yön kilitli)
    if (this.p1.canTurn()) this.p1.facing = this.p2.x >= this.p1.x ? 1 : -1;
    if (this.p2.canTurn()) this.p2.facing = this.p1.x >= this.p2.x ? 1 : -1;

    Game.Combat.separate(this.p1, this.p2);
    this.applyEvent(Game.Combat.resolve(this.p1, this.p2));
    this.applyEvent(Game.Combat.resolve(this.p2, this.p1));
    this.applyEvent(Game.Combat.resolveGrab(this.p1, this.p2));
    this.applyEvent(Game.Combat.resolveGrab(this.p2, this.p1));
    if (this.p1.state === 'hold') this.applyEvent(Game.Combat.updateHold(this.p1, this.p2, in1));
    if (this.p2.state === 'hold') this.applyEvent(Game.Combat.updateHold(this.p2, this.p1, in2));
    this.drainEvents();
    this.record();

    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      const key = this.p1.hp > 0 ? 'p1' : 'p2';
      this.wins[key]++;
      this.winner = this[key];
      this.final = this.wins[key] >= 2;
      this.koByBlazin = this.blazinWindow > 0;
      this.phase = 'roundover';
      this.phaseTime = 0;
      this.hype = 1;
      Game.Audio.play('ko');
      Game.Audio.cheer(1);
    }
  },

  // tekrar bandi: dövüsçülerin çizim için gereken tüm alanlarinin kopyasi
  record() {
    this.tape.push({ p1: { ...this.p1 }, p2: { ...this.p2 } });
    if (this.tape.length > 210) this.tape.shift();
  },

  // dövüsçü güncellemelerinin ürettigi çevre olaylari
  drainEvents() {
    for (const ev of Game.events) this.applyEvent(ev);
    Game.events.length = 0;
  },

  applyEvent(ev) {
    if (!ev) return;
    const AU = Game.Audio;
    switch (ev.type) {
      case 'hit':
        this.hitstop = ev.attack.hitstop;
        this.shake = ev.attack.shake;
        this.spawnSparks(ev.x, ev.y, 9, '#ffb347');
        AU.play(ev.attack.knockdown ? 'heavy' : 'hit');
        this.bumpHype(ev.attack.knockdown ? 0.3 : 0.12);
        if (!this.firstBlood) { this.firstBlood = true; this.addAnno('ILK KAN!'); }
        if (ev.chain === 2) { this.addAnno('KOMBO x3!'); AU.cheer(0.3); this.bumpHype(0.3); }
        break;
      case 'block':
        this.hitstop = 0.03;
        this.spawnSparks(ev.x, ev.y, 5, '#cfd8ff');
        AU.play('block');
        break;
      case 'grab':
        this.spawnSparks(ev.x, ev.y, 4, '#ffd27a');
        AU.play('grab');
        break;
      case 'holdhit':
        this.hitstop = 0.05;
        this.shake = 4;
        this.spawnSparks(ev.x, ev.y, 7, '#ffb347');
        AU.play('hit');
        break;
      case 'throw':
        this.addText('FIRLATMA!', ev.x, ev.y - 40, '#ffd27a');
        AU.play('whoosh');
        break;
      case 'special':
        this.hitstop = 0.10;
        this.shake = 9;
        this.spawnSparks(ev.x, ev.y, 12, '#ff8de8');
        this.addText(ev.name.toUpperCase() + '!', ev.x, ev.y - 40, '#ff8de8');
        AU.play('special');
        AU.cheer(0.4);
        this.bumpHype(0.4);
        break;
      case 'wallslam':
        this.hitstop = 0.12;
        this.shake = Game.THROW.wallShake;
        this.spawnSparks(ev.x, ev.y, 16, '#ff6b6b');
        this.addText('DUVAR!', ev.x, ev.y - 40, '#ff6b6b');
        this.addAnno(['DUVARA ÇAKILDI!', 'BU ÇOK ACITTI!', 'VAY ANASINI!'][Math.floor(Math.random() * 3)]);
        AU.play('slam');
        AU.cheer(0.8);
        this.bumpHype(0.8);
        break;
      case 'land':
        this.shake = 6;
        this.spawnSparks(ev.x, ev.y, 8, '#b0a8c0');
        AU.play('land');
        this.bumpHype(0.2);
        break;
      case 'crowdcatch':
        this.addText('KALABALIK TUTTU!', ev.x, ev.y - 40, '#aef3ff');
        AU.cheer(0.4);
        this.bumpHype(0.4);
        break;
      case 'crowdshove':
        this.shake = 5;
        this.spawnSparks(ev.x, ev.y, 6, '#aef3ff');
        this.addText('GERI ITTILER!', ev.x, ev.y - 40, '#aef3ff');
        AU.play('whoosh');
        break;
      case 'escape':
        this.addText('KURTULDU!', ev.x, ev.y - 40, '#cfd8ff');
        AU.play('blip');
        break;
      case 'blazinon': {
        this.shake = 6;
        this.spawnSparks(ev.x, ev.y, 14, '#ffc83c');
        this.addText('BLAZIN!', ev.x, ev.y - 30, '#ffc83c');
        AU.play('blazin');
        AU.cheer(0.5);
        this.bumpHype(0.5);
        const low = [this.p1, this.p2].find((f) => f.blazinTime > 0 && f.hp < f.maxHp * 0.35);
        if (low) this.addAnno('GERI DÖNÜYOR!');
        break;
      }
      case 'blazinmove':
        this.hitstop = 0.16;
        this.slowmo = 1.2;
        this.shake = 14;
        this.spawnSparks(ev.x, ev.y, 22, '#ffc83c');
        this.addText('BLAZIN HAREKETI!!', ev.x, ev.y - 50, '#ffc83c');
        this.blazinWindow = 2.0; // bu pencerede gelen K.O. "BLAZIN K.O." sayilir
        AU.play('slam');
        AU.play('special');
        AU.cheer(1);
        this.bumpHype(1);
        break;
    }
  },

  bumpHype(v) {
    this.hype = Math.min(1, this.hype + v);
  },

  addAnno(str) {
    this.anno = { str, life: 1.4 };
  },

  addText(str, x, y, color) {
    const W = 960;
    this.texts.push({ str, x: Math.max(90, Math.min(W - 90, x)), y, color, life: 0.9 });
  },

  spawnSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 220;
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.3 + Math.random() * 0.2, color });
    }
  },

  updateFx(dt) {
    for (const p of this.sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.y -= 36 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    if (this.anno) {
      this.anno.life -= dt;
      if (this.anno.life <= 0) this.anno = null;
    }
  },

  render(ctx, canvas) {
    const W = canvas.width;
    const H = canvas.height;

    // K.O. TEKRARI: kayittaki kareler agir çekimde, letterbox seritleriyle
    if (this.phase === 'replay') {
      const idx = Math.min(this.tape.length - 1, Math.floor(this.phaseTime * 60 * 0.4));
      const snap = this.tape[Math.max(0, idx)];
      Game.Arena.draw(ctx, Game.time, 1);
      if (snap) {
        const order = snap.p1.y <= snap.p2.y ? [snap.p2, snap.p1] : [snap.p1, snap.p2];
        this.drawReflections(ctx, order);
        for (const f of order) Game.drawFighter(ctx, f, Game.time);
      }
      Game.Arena.overlay(ctx, Game.time, 1);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, 60);
      ctx.fillRect(0, H - 60, W, 60);
      ctx.font = 'bold 26px Impact, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = Math.floor(Game.time * 3) % 2 === 0 ? '#ff5e5e' : '#ffb0b0';
      ctx.fillText('● TEKRAR', 30, 40);
      ctx.textAlign = 'right';
      ctx.font = '15px monospace';
      ctx.fillStyle = '#8a8a9a';
      ctx.fillText('ENTER — atla', W - 30, H - 25);
      return;
    }

    ctx.save();
    if (this.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2);
    }
    // BLAZIN sinematigi: dövüsçülerin ortasina yumusak zoom
    if (this.slowmo > 0) {
      const prog = Math.min(1, (1.2 - this.slowmo) / 1.2);
      const z = 1 + 0.32 * Math.sin(prog * Math.PI);
      const cx = Math.max(240, Math.min(W - 240, (this.p1.x + this.p2.x) / 2));
      ctx.translate(W / 2, 300);
      ctx.scale(z, z);
      ctx.translate(-cx, -300);
    }
    Game.Arena.draw(ctx, Game.time, this.hype);
    const order = this.p1.y <= this.p2.y ? [this.p2, this.p1] : [this.p1, this.p2];
    this.drawReflections(ctx, order);
    for (const f of order) Game.drawFighter(ctx, f, Game.time);
    Game.Arena.overlay(ctx, Game.time, this.hype);
    for (const p of this.sparks) {
      ctx.globalAlpha = Math.max(0, p.life / 0.4);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 0.4);
      ctx.font = 'bold 22px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    this.drawHud(ctx, canvas);
    this.drawBanners(ctx, canvas);
  },

  // parlak zeminde soluk ayna görüntüsü
  drawReflections(ctx, order) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.translate(0, (Game.ARENA.groundY + 9) * 2);
    ctx.scale(1, -1);
    for (const f of order) Game.drawFighter(ctx, f, Game.time, { plain: true });
    ctx.restore();
  },

  drawHud(ctx, canvas) {
    const W = canvas.width;
    this.drawPortrait(ctx, 24, 14, this.p1, this.wins.p1);
    this.drawBars(ctx, 80, 22, 304, this.p1, false);
    this.drawPortrait(ctx, W - 24 - 48, 14, this.p2, this.wins.p2);
    this.drawBars(ctx, W - 80 - 304, 22, 304, this.p2, true);

    // anonsör satiri
    if (this.anno) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.anno.life / 0.4);
      ctx.font = 'bold 26px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffd27a';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffd27a';
      ctx.fillText(this.anno.str, W / 2, 105);
      ctx.restore();
    }
  },

  // mini portre kutusu + round isiklari
  drawPortrait(ctx, x, y, f, wins) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 3, y - 3, 54, 54);
    ctx.fillStyle = '#16121e';
    ctx.fillRect(x, y, 48, 48);
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 48, 48);
    // kafa + omuz
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(x + 24, y + 20, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 24, y + 44, 17, 12, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = f.accent; // saç bandi
    ctx.fillRect(x + 13, y + 12, 22, 4);
    // round isiklari
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(x + 14 + i * 20, y + 60, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < wins ? '#ffd27a' : '#241e2e';
      ctx.fill();
      ctx.strokeStyle = '#55556a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  },

  drawBars(ctx, x, y, w, f, mirrored) {
    // can
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 3, y - 3, w + 6, 38);
    ctx.fillStyle = '#3a1020';
    ctx.fillRect(x, y, w, 18);
    const ratio = f.hp / f.maxHp;
    const fw = w * ratio;
    ctx.fillStyle = ratio > 0.35 ? '#e8c12d' : '#e8512d';
    ctx.fillRect(mirrored ? x + w - fw : x, y, fw, 18);
    // momentum
    ctx.fillStyle = '#1c1828';
    ctx.fillRect(x, y + 22, w, 9);
    const mw = w * (f.momentum / 100);
    const full = f.blazinReady();
    const flash = full && Math.floor(Game.time * 6) % 2 === 0;
    ctx.fillStyle = f.blazinTime > 0 ? '#ffc83c' : flash ? '#fff3c0' : '#c89a2e';
    ctx.fillRect(mirrored ? x + w - mw : x, y + 22, mw, 9);
    // isim + stil
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = mirrored ? 'right' : 'left';
    ctx.fillStyle = f.color;
    const label = f.name + ' · ' + f.styleData.label;
    ctx.fillText(label, mirrored ? x + w : x, y + 50);
    if (full) {
      ctx.fillStyle = '#ffc83c';
      ctx.fillText('BLAZIN HAZIR!', mirrored ? x + w : x, y + 68);
    }
  },

  drawBanners(ctx, canvas) {
    const W = canvas.width;
    ctx.textAlign = 'center';
    if (this.phase === 'intro') {
      ctx.font = 'bold 24px Impact, sans-serif';
      ctx.fillStyle = '#8a8a9a';
      ctx.fillText(Game.Arena.data.label + ' — ROUND ' + this.round, W / 2, 195);
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
    } else if (this.phase === 'roundover') {
      ctx.save();
      ctx.font = 'bold 84px Impact, sans-serif';
      ctx.shadowColor = this.koByBlazin ? '#ffc83c' : '#ff2d78';
      ctx.shadowBlur = 28;
      ctx.fillStyle = this.koByBlazin ? '#ffc83c' : '#ff5e9c';
      ctx.fillText(this.koByBlazin ? 'BLAZIN K.O.!' : 'K.O.!', W / 2, 230);
      ctx.restore();
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = this.winner.color;
      ctx.fillText(this.winner.name + ' ROUNDU ALDI', W / 2, 285);
    } else if (this.phase === 'over') {
      ctx.save();
      ctx.font = 'bold 72px Impact, sans-serif';
      ctx.shadowColor = this.koByBlazin ? '#ffc83c' : '#ff2d78';
      ctx.shadowBlur = 28;
      ctx.fillStyle = this.koByBlazin ? '#ffc83c' : '#ff5e9c';
      ctx.fillText('MAÇ BITTI', W / 2, 220);
      ctx.restore();
      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = this.winner.color;
      ctx.fillText(this.winner.name + ' KAZANDI (' + this.wins.p1 + '-' + this.wins.p2 + ')', W / 2, 275);
      if (this.phaseTime > 1 && Math.floor(Game.time * 2) % 2 === 0) {
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#ffd27a';
        ctx.fillText('ENTER — yeni dövüs · ESC — menü', W / 2, 335);
      }
    }
  },
};
