window.Game = window.Game || {};

Game.ARENA = { left: 90, right: 870, groundY: 470 };

// Saldiri verileri (süreler saniye, 60 Hz sabit adimda deterministik):
// startup = hazirlik, active = isabet penceresi, recovery = toparlanma.
Game.ATTACKS = {
  punch: {
    startup: 0.067, active: 0.05, recovery: 0.166,
    damage: 6, reach: 64, hitstun: 0.28, knockback: 90,
    hitstop: 0.06, shake: 4, lunge: 55, knockdown: false,
  },
  kick: {
    startup: 0.133, active: 0.067, recovery: 0.266,
    damage: 11, reach: 88, hitstun: 0.38, knockback: 190,
    hitstop: 0.09, shake: 8, lunge: 75, knockdown: true,
  },
};

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
    return this.state !== 'down' && this.state !== 'getup' && this.state !== 'ko';
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

  takeHit(atk, dir) {
    this.hp = Math.max(0, this.hp - atk.damage);
    this.kvx = dir * atk.knockback;
    this.attack = null;
    this.hitstun = atk.hitstun;
    if (this.hp <= 0) this.enterState('ko');
    else if (atk.knockdown) this.enterState('down');
    else this.enterState('hit');
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

      case 'hit':
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 6 * dt);
        if (this.stateTime >= this.hitstun) this.enterState('idle');
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

    this.x = Math.max(A.left, Math.min(A.right, this.x));
  }
};
