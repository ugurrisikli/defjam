window.Game = window.Game || {};

// Stil bazli AI kisilikleri: karar agirliklari ve egilimler.
Game.AI_PROFILES = {
  sokak: { punch: 3, kick: 2, grab: 2, run: 1.0, blockChance: 0.40, holdStrike: 0.5, retreat: 1.0 },
  kickbox: { punch: 4, kick: 4, grab: 0.6, run: 1.4, blockChance: 0.30, holdStrike: 0.7, retreat: 0.6 },
  gures: { punch: 1.5, kick: 1, grab: 5, run: 0.7, blockChance: 0.22, holdStrike: 0.45, retreat: 0.4 },
  sanat: { punch: 3, kick: 2.5, grab: 1.2, run: 0.8, blockChance: 0.60, holdStrike: 0.5, retreat: 1.6 },
  submission: { punch: 1.5, kick: 1.2, grab: 4.5, run: 0.8, blockChance: 0.35, holdStrike: 0.8, retreat: 0.8 },
};

// Rakip beyni: anlik degil, insansi gecikmeli kararlar verir.
// Kararlar kisa girdi betiklerine (queue) dönüsür; betik kare kare oynatilir.
Game.AI = class {
  constructor(fighter, opts = {}) {
    this.f = fighter;
    this.rng = opts.rng || Math.random;
    this.difficulty = opts.difficulty === undefined ? 0.55 : opts.difficulty; // 0..1
    this.profile = Game.AI_PROFILES[fighter.style];
    this.queue = []; // [{ input, time }]
    this.wait = 0.7; // ilk karar gecikmesi: maça yavas girer
    this.blockTimer = 0;
    this.reactCooldown = 0;
    this.holdTimer = 0;
  }

  reactionDelay() {
    return 0.30 - this.difficulty * 0.18 + this.rng() * 0.08;
  }

  push(input, time) {
    this.queue.push({ input, time });
  }

  // ileri yöne çift dokunus betigi: kos
  dash(fwd) {
    this.push({ [fwd]: true }, 0.05);
    this.push({}, 0.05);
    this.push({ [fwd]: true }, 0.45 + this.rng() * 0.25);
  }

  update(dt, opp) {
    const f = this.f;
    const dx = opp.x - f.x;
    const dist = Math.abs(dx);
    const dir = dx >= 0 ? 1 : -1;
    const fwd = dir === 1 ? 'right' : 'left';
    const bck = dir === 1 ? 'left' : 'right';

    if (f.state === 'hold') return this.holdBrain(dt);

    // refleks blogu: rakip vurusa kalktiysa (insansi sansla) kapan
    this.reactCooldown -= dt;
    if (this.blockTimer > 0) {
      this.blockTimer -= dt;
      return { block: true };
    }
    if (
      this.reactCooldown <= 0 &&
      ['punch', 'kick', 'runpunch', 'runkick'].includes(opp.state) &&
      dist < 140 &&
      this.rng() < this.profile.blockChance + this.difficulty * 0.2
    ) {
      this.reactCooldown = 0.6;
      this.blockTimer = 0.30 + this.rng() * 0.2;
      this.queue.length = 0;
      return { block: true };
    }

    // süren betik adimini oynat
    if (this.queue.length > 0) {
      const step = this.queue[0];
      step.time -= dt;
      const input = { ...step.input };
      if (step.time <= 0) this.queue.shift();
      return input;
    }

    // kararlar arasi bekleme: uzaktaysa bos durmak yerine yürü
    this.wait -= dt;
    if (this.wait > 0) return dist > 130 ? { [fwd]: true } : {};

    this.wait = this.reactionDelay();
    this.decide(opp, dist, fwd, bck);
    if (this.queue.length > 0) {
      const step = this.queue[0];
      step.time -= dt;
      const input = { ...step.input };
      if (step.time <= 0) this.queue.shift();
      return input;
    }
    return {};
  }

  decide(opp, dist, fwd, bck) {
    const f = this.f;
    const p = this.profile;

    // rakip yerde: üstüne çullanma, mesafe al (insansi temiz oyun + tempo)
    if (['down', 'getup', 'ko', 'thrown'].includes(opp.state)) {
      this.push({ [bck]: dist < 150 }, 0.3);
      return;
    }

    // bar doluysa BLAZIN aç
    if (f.blazinReady()) {
      this.push({ blazin: true }, 0.05);
      return;
    }

    // zorluk düstükçe artan "insan hatasi": plansiz rastgele hamle
    const mistake = this.rng() < 0.22 - this.difficulty * 0.15;

    if (dist > 240 && !mistake) {
      // uzak: yaklas, bazen kosarak
      if (this.rng() < 0.4 * p.run) this.dash(fwd);
      else this.push({ [fwd]: true }, 0.35 + this.rng() * 0.3);
      return;
    }

    if (dist > 110 && !mistake) {
      // orta mesafe: dalis vurusu sansi, yoksa sokul
      if (this.rng() < 0.20 * p.run) {
        this.dash(fwd);
        this.push({ [fwd]: true, kick: true }, 0.06); // kosunun ucunda uçan tekme
      } else {
        this.push({ [fwd]: true }, 0.30);
      }
      return;
    }

    // yakin dövüs: agirlikli seçim
    const blazinHungry = f.blazinTime > 0 ? 5 : 1; // mod aktifken tutusu kovala
    const punishing = opp.attack && opp.stateTime > 0.15 ? 2.5 : 1; // toparlanani cezalandir
    const options = [
      ['punch', p.punch * punishing],
      ['kick', p.kick * punishing],
      ['grab', p.grab * (opp.isBlocking() ? 3 : 1) * blazinHungry],
      ['back', p.retreat],
      ['guard', 0.7],
    ];
    const total = options.reduce((s, o) => s + o[1], 0);
    let roll = this.rng() * total;
    let choice = options[0][0];
    for (const [name, w] of options) {
      roll -= w;
      if (roll <= 0) { choice = name; break; }
    }
    if (mistake) choice = ['punch', 'kick', 'grab', 'back'][Math.floor(this.rng() * 4)];

    switch (choice) {
      case 'punch': this.pushCombo('punch'); break;
      case 'kick': this.pushCombo('kick'); break;
      case 'grab': this.push({ grapple: true }, 0.05); break;
      case 'back': this.push({ [bck]: true }, 0.22 + this.rng() * 0.15); break;
      case 'guard': this.push({ block: true }, 0.3 + this.rng() * 0.2); break;
    }
  }

  // vurus + stilin zincir hakki kadar takip vurusu dener
  // (ilk vurus iskalir/bloklanirsa takipler kendiliginden bosa gider)
  pushCombo(key) {
    this.push({ [key]: true }, 0.05);
    const followups = this.f.styleData.chain - 1;
    for (let i = 0; i < followups; i++) {
      if (this.rng() < 0.7) {
        this.push({}, 0.1);
        this.push({ [key]: true }, 0.05);
      }
    }
  }

  // tutus sürerken: salla, stil özel hamlesi yap ya da en yakin duvara firlat
  holdBrain(dt) {
    this.holdTimer -= dt;
    if (this.holdTimer > 0) return {};
    this.holdTimer = 0.28;
    if (this.f.holdStrikes < 2 && this.rng() < this.profile.holdStrike) {
      return { punch: true };
    }
    if (this.rng() < 0.45) return { kick: true }; // stilin imza tutus hamlesi
    const A = Game.ARENA;
    const wallDir = this.f.x > (A.left + A.right) / 2 ? 1 : -1; // yakin duvar
    return { grapple: true, right: wallDir === 1, left: wallDir === -1 };
  }
};
