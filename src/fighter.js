window.Game = window.Game || {};

Game.ARENA = { left: 90, right: 870, groundY: 470 };

// Dövüs olaylari (duvar çarpmasi, kalabalik itmesi...) sahneye bu kuyrukla tasinir.
Game.events = [];

// Vurus tanimi: eksik alanlara varsayilan degerler
function MOVE(o) {
  return {
    hitstop: 0.06, shake: 4, lunge: 55,
    knockdown: false, stagger: false, hitstun: 0.28, anim: null,
    ...o,
  };
}

// Bes dövüs stili: kendi vuruslari, tutus özel hamlesi ve kombo zinciri ile.
Game.STYLES = {
  sokak: {
    label: 'SOKAK', desc: 'Dengeli kombocu',
    hp: 100, speed: 1.0, strike: 1.0, grapple: 1.0, momentum: 1.0, chain: 3,
    moves: {
      light: MOVE({ name: 'Direkt', startup: 0.067, active: 0.05, recovery: 0.15, damage: 6, reach: 80, knockback: 130 }),
      heavy: MOVE({ name: 'Çevirme Yumruk', startup: 0.117, active: 0.067, recovery: 0.25, damage: 10, reach: 96, knockback: 200, knockdown: true, hitstop: 0.09, shake: 8, lunge: 70, hitstun: 0.38 }),
      special: { name: 'Kafa Atma', damage: 9, effect: 'staggered' },
    },
  },
  kickbox: {
    label: 'KICKBOX', desc: 'Yikici baski',
    hp: 95, speed: 1.05, strike: 1.3, grapple: 0.75, momentum: 1.0, chain: 3,
    moves: {
      light: MOVE({ name: 'Hizli Diz', startup: 0.075, active: 0.05, recovery: 0.16, damage: 7, reach: 84, knockback: 140 }),
      heavy: MOVE({ name: 'Palet Tekme', startup: 0.142, active: 0.067, recovery: 0.30, damage: 13, reach: 112, knockback: 220, knockdown: true, hitstop: 0.10, shake: 9, lunge: 80, hitstun: 0.40 }),
      special: { name: 'Diz Sovu', damage: 12, effect: 'hit' },
    },
  },
  gures: {
    label: 'GÜRES', desc: 'Ezici tutus gücü',
    hp: 115, speed: 0.85, strike: 0.8, grapple: 1.45, momentum: 0.9, chain: 2,
    moves: {
      light: MOVE({ name: 'Agir Tokat', startup: 0.084, active: 0.05, recovery: 0.18, damage: 7, reach: 76, knockback: 180 }),
      heavy: MOVE({ name: 'Omuz Sarji', startup: 0.15, active: 0.084, recovery: 0.32, damage: 12, reach: 88, knockback: 280, knockdown: true, hitstop: 0.11, shake: 10, lunge: 110, hitstun: 0.42, anim: 'charge' }),
      special: { name: 'Suplex', damage: 16, effect: 'suplex' },
    },
  },
  sanat: {
    label: 'DÖVÜS SANATLARI', desc: 'Yildirim hizi, akan kombo',
    hp: 85, speed: 1.15, strike: 0.95, grapple: 0.9, momentum: 1.4, chain: 3,
    moves: {
      light: MOVE({ name: 'Yildirim Vurus', startup: 0.05, active: 0.05, recovery: 0.12, damage: 5, reach: 78, knockback: 110 }),
      heavy: MOVE({ name: 'Dönen Tekme', startup: 0.117, active: 0.067, recovery: 0.20, damage: 9, reach: 102, knockback: 190, knockdown: true, hitstop: 0.09, shake: 8, lunge: 75, hitstun: 0.38 }),
      special: { name: 'Savurma', damage: 10, effect: 'down', momentum: 15 },
    },
  },
  submission: {
    label: 'SUBMISSION', desc: 'Kilitler ve can çalma',
    hp: 105, speed: 0.9, strike: 0.85, grapple: 1.25, momentum: 1.0, chain: 2, holdSteal: true,
    moves: {
      light: MOVE({ name: 'Pençe', startup: 0.075, active: 0.05, recovery: 0.16, damage: 6, reach: 74, knockback: 120 }),
      heavy: MOVE({ name: 'Alçak Tekme', startup: 0.125, active: 0.067, recovery: 0.24, damage: 9, reach: 92, knockback: 120, stagger: true, hitstop: 0.08, shake: 6, lunge: 60, anim: 'low' }),
      special: { name: 'Eklem Kilidi', damage: 14, effect: 'staggered', steal: 4 },
    },
  },
};
Game.STYLE_KEYS = ['sokak', 'kickbox', 'gures', 'sanat', 'submission'];

// Kosu vuruslari her stilde ortak (hasar stil çarpanindan etkilenir).
Game.ATTACKS = {
  runpunch: MOVE({
    name: 'Dalis Yumrugu', startup: 0.084, active: 0.067, recovery: 0.32,
    damage: 10, reach: 88, hitstun: 0.4, knockback: 260,
    hitstop: 0.10, shake: 9, lunge: 240, knockdown: true,
  }),
  runkick: MOVE({
    name: 'Uçan Tekme', startup: 0.117, active: 0.084, recovery: 0.45,
    damage: 14, reach: 110, hitstun: 0.45, knockback: 320,
    hitstop: 0.12, shake: 11, lunge: 280, knockdown: true,
  }),
};

// Tutma denemesi: blok bunu DURDURAMAZ (tas-kagit-makas).
Game.GRAB = { startup: 0.10, active: 0.084, recovery: 0.30, reach: 66, lunge: 60 };

Game.THROW = {
  speed: 560, liftVy: 240, gravity: 1500,
  landDamage: 8, wallDamage: 16, wallShake: 12,
};

Game.CROWD = { catchSpeed: 60, holdTime: 0.45, shoveSpeed: 280, staggerTime: 0.8 };

Game.RUN = { speedMult: 1.75, tapWindow: 0.28 };

Game.BLAZIN = {
  duration: 5, strikeMult: 1.3, grabDamage: 22,
  throwSpeed: 720, throwVy: 420,
};

// Momentum ekonomisi: vuran hizli dolar, yiyen de azar azar dolar (comeback).
Game.MOMENTUM = {
  hitGive: 10, hitTake: 5, blockGain: 6, blockedPenalty: -3,
  holdHit: 5, throwGain: 12, specialGain: 8,
};

Game.Fighter = class {
  constructor(opts) {
    const st = Game.STYLES[opts.style || 'sokak'];
    this.style = opts.style || 'sokak';
    this.styleData = st;
    this.moves = st.moves;
    this.name = opts.name;
    this.color = opts.color;
    this.accent = opts.accent;
    this.x = opts.x;
    this.y = 0; // zeminden yükseklik (0 = yerde)
    this.vy = 0;
    this.facing = opts.facing; // 1 saga, -1 sola bakiyor
    this.maxHp = st.hp;
    this.hp = st.hp;
    this.speed = 300 * st.speed;
    this.strikeMult = st.strike;
    this.grappleMult = st.grapple;
    this.momentumMult = st.momentum;
    this.jumpVel = 580;
    this.gravity = 1900;
    this.state = 'idle';
    this.stateTime = 0;
    this.walkPhase = 0;
    this.attack = null;
    this.attackHasHit = false;
    this.lastHitBlocked = false;
    this.chainCount = 0;
    this.kvx = 0; // savrulma hizi
    this.hitstun = 0;
    this.holdStrikes = 0;
    this.impactMult = 1; // firlatma inis hasari için firlatanin çarpani
    // kosu (çift dokunus)
    this.age = 0;
    this.runDir = 0;
    this.prevLeft = false;
    this.prevRight = false;
    this.lastTapLeft = -10;
    this.lastTapRight = -10;
    // momentum / BLAZIN
    this.momentum = 0;
    this.blazinTime = 0;
  }

  enterState(s) {
    if (s !== 'run') this.runDir = 0;
    if (s !== 'punch' && s !== 'kick') this.chainCount = 0;
    this.state = s;
    this.stateTime = 0;
  }

  // hareket durumlari arasinda stateTime'i sifirlamadan geçis
  setMoveState(s) {
    if (this.state !== s) this.enterState(s);
  }

  canTurn() {
    return ['idle', 'walk', 'jump'].includes(this.state); // kosarken yön kilitli
  }

  isVulnerable() {
    return !['down', 'getup', 'ko', 'held', 'thrown', 'crowdhold'].includes(this.state);
  }

  // tutma için: ayakta ve müdahale edilebilir mi (blok KORUMAZ)
  isGrabbable() {
    return ['idle', 'walk', 'run', 'block', 'hit', 'staggered', 'punch', 'kick', 'grab'].includes(this.state) && this.y === 0;
  }

  isBlocking() {
    return this.state === 'block';
  }

  addMomentum(v) {
    if (this.blazinTime > 0 && v > 0) return; // mod aktifken bar yalnizca bosalir
    if (v > 0) v *= this.momentumMult;
    this.momentum = Math.max(0, Math.min(100, this.momentum + v));
  }

  blazinReady() {
    return this.momentum >= 100 && this.blazinTime <= 0;
  }

  // slot: 'punch' (hizli) | 'kick' (güçlü) | 'runpunch' | 'runkick'
  startAttack(slot) {
    if (slot === 'punch') this.attack = this.moves.light;
    else if (slot === 'kick') this.attack = this.moves.heavy;
    else this.attack = Game.ATTACKS[slot];
    this.attackName = slot;
    this.attackHasHit = false;
    this.lastHitBlocked = false;
    const chain = this.chainCount; // enterState zinciri sifirlamasin
    this.enterState(slot);
    this.chainCount = chain;
  }

  // saldirinin isabet penceresi açik mi?
  attackActive() {
    if (!this.attack || this.state !== this.attackName) return false;
    const a = this.attack;
    return this.stateTime >= a.startup && this.stateTime < a.startup + a.active;
  }

  grabActive() {
    if (this.state !== 'grab') return false;
    const g = Game.GRAB;
    return this.stateTime >= g.startup && this.stateTime < g.startup + g.active;
  }

  takeHit(atk, dir) {
    this.hp = Math.max(0, this.hp - atk.damage);
    this.kvx = dir * atk.knockback;
    this.attack = null;
    this.hitstun = atk.hitstun;
    if (this.hp <= 0) this.enterState('ko');
    else if (atk.knockdown) this.enterState('down');
    else if (atk.stagger) this.enterState('staggered');
    else this.enterState('hit');
  }

  // firlatma sonucu: yere veya duvara inis
  throwImpact(baseDamage, dirAway) {
    const dmg = Math.round(baseDamage * this.impactMult);
    this.hp = Math.max(0, this.hp - dmg);
    this.kvx = dirAway * 120;
    this.y = Math.min(this.y, 4);
    this.vy = 0;
    this.enterState(this.hp <= 0 ? 'ko' : 'down');
  }

  // ileri yöne çift dokunus kosuyu tetikler
  detectDash(tapLeft, tapRight) {
    if (tapRight) {
      if (this.age - this.lastTapRight < Game.RUN.tapWindow && this.y === 0) this.runDir = 1;
      this.lastTapRight = this.age;
    }
    if (tapLeft) {
      if (this.age - this.lastTapLeft < Game.RUN.tapWindow && this.y === 0) this.runDir = -1;
      this.lastTapLeft = this.age;
    }
  }

  update(dt, input) {
    this.stateTime += dt;
    this.age += dt;
    const tapLeft = !!input.left && !this.prevLeft;
    const tapRight = !!input.right && !this.prevRight;
    this.prevLeft = !!input.left;
    this.prevRight = !!input.right;
    const A = Game.ARENA;

    // BLAZIN modu sayaci: bar süreyle birlikte bosalir
    if (this.blazinTime > 0) {
      this.blazinTime = Math.max(0, this.blazinTime - dt);
      this.momentum = 100 * (this.blazinTime / Game.BLAZIN.duration);
    }

    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'run':
      case 'jump': {
        this.detectDash(tapLeft, tapRight);
        const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const running = this.runDir !== 0 && dir === this.runDir && this.y === 0;
        if (!running) this.runDir = 0;
        this.x += dir * this.speed * (running ? Game.RUN.speedMult : 1) * dt;
        if (this.y === 0) {
          if (input.blazin && this.blazinReady()) {
            this.blazinTime = Game.BLAZIN.duration;
            Game.events.push({ type: 'blazinon', x: this.x, y: A.groundY - 120 });
          }
          if (input.punch) { this.startAttack(running ? 'runpunch' : 'punch'); break; }
          if (input.kick) { this.startAttack(running ? 'runkick' : 'kick'); break; }
          if (input.grapple) { this.enterState('grab'); break; }
          if (input.block) { this.enterState('block'); break; }
          if (input.jump) this.vy = this.jumpVel;
        }
        if (this.y > 0 || this.vy > 0) {
          this.y += this.vy * dt;
          this.vy -= this.gravity * dt;
          if (this.y <= 0) { this.y = 0; this.vy = 0; }
        }
        this.setMoveState(this.y > 0 ? 'jump' : running ? 'run' : dir !== 0 ? 'walk' : 'idle');
        if (this.state === 'walk') this.walkPhase += dt * 12;
        else if (this.state === 'run') this.walkPhase += dt * 17;
        break;
      }

      case 'block':
        if (!input.block) this.enterState('idle');
        break;

      case 'punch':
      case 'kick': {
        const a = this.attack;
        if (this.stateTime < a.startup + a.active) this.x += this.facing * a.lunge * dt;
        // kombo zinciri: isabet ettiyse toparlanma penceresinde sonraki vurus baglanir
        if (
          this.attackHasHit && !this.lastHitBlocked &&
          this.stateTime >= a.startup + a.active &&
          this.chainCount + 1 < this.styleData.chain &&
          (input.punch || input.kick)
        ) {
          this.chainCount++;
          this.startAttack(input.punch ? 'punch' : 'kick');
          break;
        }
        if (this.stateTime >= a.startup + a.active + a.recovery) {
          this.attack = null;
          this.enterState('idle');
        }
        break;
      }

      case 'runpunch':
      case 'runkick': {
        const a = this.attack;
        // hazirlik+isabet sirasinda öne dalis
        if (this.stateTime < a.startup + a.active) this.x += this.facing * a.lunge * dt;
        if (this.stateTime >= a.startup + a.active + a.recovery) {
          this.attack = null;
          this.enterState('idle');
        }
        break;
      }

      case 'grab': {
        const g = Game.GRAB;
        if (this.stateTime < g.startup + g.active) this.x += this.facing * g.lunge * dt;
        if (this.stateTime >= g.startup + g.active + g.recovery) this.enterState('idle');
        break;
      }

      case 'hold': // konum/eylem yönetimi Combat.updateHold'da (iki dövüsçü gerekir)
      case 'held':
        break;

      case 'blazinpose': // özel hareket sonrasi kisa zafer durusu
        if (this.stateTime >= 0.55) this.enterState('idle');
        break;

      case 'specialmove': // tutus özel hamlesi koreografisi
        if (this.stateTime >= 0.45) this.enterState('idle');
        break;

      case 'thrown': {
        this.x += this.kvx * dt;
        this.y += this.vy * dt;
        this.vy -= Game.THROW.gravity * dt;
        if (this.y <= 0) {
          this.y = 0;
          const dirAway = Math.sign(this.kvx) || 1;
          this.throwImpact(Game.THROW.landDamage, dirAway * -0.5);
          Game.events.push({ type: 'land', x: this.x, y: A.groundY - 30 });
        }
        break;
      }

      case 'hit':
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 6 * dt);
        if (this.stateTime >= this.hitstun) this.enterState('idle');
        break;

      case 'staggered':
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 5 * dt);
        if (this.stateTime >= Game.CROWD.staggerTime) this.enterState('idle');
        break;

      case 'crowdhold':
        if (this.stateTime >= Game.CROWD.holdTime) {
          // kalabalik arenaya geri firlatir; sersem dönersin
          const toCenter = this.x <= (A.left + A.right) / 2 ? 1 : -1;
          this.kvx = toCenter * Game.CROWD.shoveSpeed;
          this.enterState('staggered');
          Game.events.push({ type: 'crowdshove', x: this.x, y: A.groundY - 90 });
        }
        break;

      case 'down':
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 4 * dt);
        if (this.stateTime >= 0.9) this.enterState('getup');
        break;

      case 'getup':
        if (this.stateTime >= 0.35) this.enterState('idle');
        break;

      case 'ko':
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 4 * dt);
        break;
    }

    const atWall = this.x <= A.left || this.x >= A.right;
    this.x = Math.max(A.left, Math.min(A.right, this.x));

    // firlatilan dövüsçü duvara/sahne kenarina çakilir: büyük hasar
    if (this.state === 'thrown' && atWall) {
      const dirAway = this.x <= A.left ? 1 : -1;
      this.throwImpact(Game.THROW.wallDamage, dirAway);
      Game.events.push({ type: 'wallslam', x: this.x, y: A.groundY - 90 });
    }

    // sert savrulup kalabaliga düsen tutulur, sonra geri itilir
    // (savrulma yönü duvara dogru olmali; sönümlenmis hafif temas sayilmaz)
    const intoWall =
      (this.x <= A.left && this.kvx < -Game.CROWD.catchSpeed) ||
      (this.x >= A.right && this.kvx > Game.CROWD.catchSpeed);
    if (this.state === 'hit' && intoWall) {
      this.kvx = 0;
      this.enterState('crowdhold');
      Game.events.push({ type: 'crowdcatch', x: this.x, y: A.groundY - 90 });
    }
  }
};
