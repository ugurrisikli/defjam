window.Game = window.Game || {};

Game.ARENA = { left: 90, right: 870, groundY: 470 };

// Dövüs olaylari (duvar çarpmasi, kalabalik itmesi...) sahneye bu kuyrukla tasinir.
Game.events = [];

// Saldiri verileri (süreler saniye, 60 Hz sabit adimda deterministik):
// startup = hazirlik, active = isabet penceresi, recovery = toparlanma.
Game.ATTACKS = {
  punch: {
    startup: 0.067, active: 0.05, recovery: 0.166,
    damage: 6, reach: 80, hitstun: 0.28, knockback: 130,
    hitstop: 0.06, shake: 4, lunge: 55, knockdown: false,
  },
  kick: {
    startup: 0.133, active: 0.067, recovery: 0.266,
    damage: 11, reach: 104, hitstun: 0.38, knockback: 190,
    hitstop: 0.09, shake: 8, lunge: 75, knockdown: true,
  },
};

// Tutma denemesi: blok bunu DURDURAMAZ (tas-kagit-makas).
Game.GRAB = { startup: 0.10, active: 0.084, recovery: 0.30, reach: 66, lunge: 60 };

Game.THROW = {
  speed: 560, liftVy: 240, gravity: 1500,
  landDamage: 8, wallDamage: 16, wallShake: 12,
};

Game.CROWD = { catchSpeed: 60, holdTime: 0.45, shoveSpeed: 280, staggerTime: 0.8 };

Game.Fighter = class {
  constructor(opts) {
    this.name = opts.name;
    this.color = opts.color;
    this.accent = opts.accent;
    this.x = opts.x;
    this.y = 0; // zeminden yükseklik (0 = yerde)
    this.vy = 0;
    this.facing = opts.facing; // 1 saga, -1 sola bakiyor
    this.maxHp = 100;
    this.hp = 100;
    this.speed = 300;
    this.jumpVel = 580;
    this.gravity = 1900;
    this.state = 'idle';
    this.stateTime = 0;
    this.walkPhase = 0;
    this.attack = null;
    this.attackHasHit = false;
    this.kvx = 0; // savrulma hizi
    this.hitstun = 0;
    this.holdStrikes = 0;
  }

  enterState(s) {
    this.state = s;
    this.stateTime = 0;
  }

  // hareket durumlari arasinda stateTime'i sifirlamadan geçis
  setMoveState(s) {
    if (this.state !== s) this.enterState(s);
  }

  canTurn() {
    return this.state === 'idle' || this.state === 'walk' || this.state === 'jump';
  }

  isVulnerable() {
    return !['down', 'getup', 'ko', 'held', 'thrown', 'crowdhold'].includes(this.state);
  }

  // tutma için: ayakta ve müdahale edilebilir mi (blok KORUMAZ, sersemlik korumaz)
  isGrabbable() {
    return ['idle', 'walk', 'block', 'hit', 'staggered', 'punch', 'kick', 'grab'].includes(this.state) && this.y === 0;
  }

  isBlocking() {
    return this.state === 'block';
  }

  startAttack(name) {
    this.attack = Game.ATTACKS[name];
    this.attackHasHit = false;
    this.enterState(name);
  }

  // saldirinin isabet penceresi açik mi?
  attackActive() {
    if (this.state !== 'punch' && this.state !== 'kick') return false;
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
    else this.enterState('hit');
  }

  // firlatma sonucu: yere veya duvara inis
  throwImpact(damage, dirAway) {
    this.hp = Math.max(0, this.hp - damage);
    this.kvx = dirAway * 120;
    this.y = Math.min(this.y, 4);
    this.vy = 0;
    this.enterState(this.hp <= 0 ? 'ko' : 'down');
  }

  update(dt, input) {
    this.stateTime += dt;
    const A = Game.ARENA;

    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'jump': {
        const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        this.x += dir * this.speed * dt;
        if (this.y === 0) {
          if (input.punch) { this.startAttack('punch'); break; }
          if (input.kick) { this.startAttack('kick'); break; }
          if (input.grapple) { this.enterState('grab'); break; }
          if (input.block) { this.enterState('block'); break; }
          if (input.jump) this.vy = this.jumpVel;
        }
        if (this.y > 0 || this.vy > 0) {
          this.y += this.vy * dt;
          this.vy -= this.gravity * dt;
          if (this.y <= 0) { this.y = 0; this.vy = 0; }
        }
        this.setMoveState(this.y > 0 ? 'jump' : dir !== 0 ? 'walk' : 'idle');
        if (this.state === 'walk') this.walkPhase += dt * 12;
        break;
      }

      case 'block':
        if (!input.block) this.enterState('idle');
        break;

      case 'punch':
      case 'kick': {
        const a = this.attack;
        // hazirlik+isabet sirasinda öne hamle
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
