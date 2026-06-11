window.Game = window.Game || {};

Game.ARENA = { left: 90, right: 870, groundY: 470 };

// Dövüs olaylari (duvar çarpmasi, kalabalik itmesi...) sahneye bu kuyrukla tasinir.
Game.events = [];

// Vurus tanimi: eksik alanlara varsayilan degerler
function MOVE(o) {
  return {
    hitstop: 0.06, shake: 4, lunge: 55,
    knockdown: false, stagger: false, hitstun: 0.28, anim: null, region: 'mid',
    ...o,
  };
}

// Bes dövüs stili: kendi vuruslari, tutus özel hamlesi ve kombo zinciri ile.
Game.STYLES = {
  sokak: {
    label: 'SOKAK', desc: 'Dengeli kombocu',
    hp: 100, speed: 1.0, strike: 1.0, grapple: 1.0, momentum: 1.0, chain: 3,
    moves: {
      light: MOVE({ name: 'Direkt', region: 'high', startup: 0.067, active: 0.05, recovery: 0.15, damage: 6, reach: 80, knockback: 130 }),
      heavy: MOVE({ name: 'Çevirme Yumruk', region: 'high', startup: 0.117, active: 0.067, recovery: 0.25, damage: 10, reach: 96, knockback: 200, knockdown: true, hitstop: 0.09, shake: 8, lunge: 70, hitstun: 0.38 }),
      special: { name: 'Kafa Atma', damage: 9, effect: 'staggered' },
    },
    cancels: { punch: ['punch', 'kick'], kick: ['punch'] },
    combos: [
      { name: 'Kaldirim Klasigi', seq: ['punch', 'punch', 'kick'], bonus: 'bounce' },
      { name: 'Aldatmaca', seq: ['punch', 'kick', 'punch'], bonus: 'damage' },
    ],
  },
  kickbox: {
    label: 'KICKBOX', desc: 'Yikici baski',
    hp: 95, speed: 1.05, strike: 1.3, grapple: 0.75, momentum: 1.0, chain: 3,
    moves: {
      light: MOVE({ name: 'Hizli Diz', region: 'mid', startup: 0.075, active: 0.05, recovery: 0.16, damage: 7, reach: 84, knockback: 140 }),
      heavy: MOVE({ name: 'Palet Tekme', region: 'high', launcher: true, startup: 0.142, active: 0.067, recovery: 0.30, damage: 13, reach: 112, knockback: 220, knockdown: true, hitstop: 0.10, shake: 9, lunge: 80, hitstun: 0.40 }),
      special: { name: 'Diz Sovu', damage: 12, effect: 'hit' },
    },
    cancels: { punch: ['punch', 'kick'], kick: [] },
    combos: [
      { name: 'Diz Firtinasi', seq: ['punch', 'punch', 'kick'], bonus: 'damage' },
      { name: 'Palet Duvari', seq: ['punch', 'kick'], bonus: 'bounce' },
    ],
  },
  gures: {
    label: 'GÜRES', desc: 'Ezici tutus gücü',
    hp: 115, speed: 0.85, strike: 0.8, grapple: 1.45, momentum: 0.9, chain: 2,
    moves: {
      light: MOVE({ name: 'Agir Tokat', region: 'high', startup: 0.084, active: 0.05, recovery: 0.18, damage: 7, reach: 76, knockback: 180 }),
      heavy: MOVE({ name: 'Omuz Sarji', region: 'mid', startup: 0.15, active: 0.084, recovery: 0.32, damage: 12, reach: 88, knockback: 280, knockdown: true, hitstop: 0.11, shake: 10, lunge: 110, hitstun: 0.42, anim: 'charge' }),
      special: { name: 'Suplex', damage: 16, effect: 'suplex' },
    },
    cancels: { punch: ['punch', 'grapple'], kick: [] },
    combos: [
      { name: 'Boga Dalisi', seq: ['punch', 'punch', 'grapple'], bonus: 'grab' },
      { name: 'Tokat Samatasi', seq: ['punch', 'punch'], bonus: 'bounce' },
    ],
  },
  sanat: {
    label: 'DÖVÜS SANATLARI', desc: 'Yildirim hizi, akan kombo',
    hp: 85, speed: 1.15, strike: 0.95, grapple: 0.9, momentum: 1.4, chain: 3,
    moves: {
      light: MOVE({ name: 'Yildirim Vurus', region: 'high', startup: 0.05, active: 0.05, recovery: 0.12, damage: 5, reach: 78, knockback: 110 }),
      heavy: MOVE({ name: 'Dönen Tekme', region: 'high', launcher: true, startup: 0.117, active: 0.067, recovery: 0.20, damage: 9, reach: 102, knockback: 190, knockdown: true, hitstop: 0.09, shake: 8, lunge: 75, hitstun: 0.38 }),
      special: { name: 'Savurma', damage: 10, effect: 'down', momentum: 15 },
    },
    cancels: { punch: ['punch', 'kick'], kick: ['punch'] },
    combos: [
      { name: 'Yildirim Dansi', seq: ['punch', 'punch', 'kick'], bonus: 'damage' },
      { name: 'Ay Tekmesi', seq: ['punch', 'kick'], bonus: 'bounce' },
    ],
  },
  submission: {
    label: 'SUBMISSION', desc: 'Kilitler ve can çalma',
    hp: 105, speed: 0.9, strike: 0.85, grapple: 1.25, momentum: 1.0, chain: 2, holdSteal: true,
    moves: {
      light: MOVE({ name: 'Pençe', region: 'mid', startup: 0.075, active: 0.05, recovery: 0.16, damage: 6, reach: 74, knockback: 120 }),
      heavy: MOVE({ name: 'Alçak Tekme', region: 'low', startup: 0.125, active: 0.067, recovery: 0.24, damage: 9, reach: 92, knockback: 120, stagger: true, hitstop: 0.08, shake: 6, lunge: 60, anim: 'low' }),
      special: { name: 'Eklem Kilidi', damage: 14, effect: 'staggered', steal: 4 },
    },
    cancels: { punch: ['punch', 'kick', 'grapple'], kick: [] },
    combos: [
      { name: 'Örümcek Agi', seq: ['punch', 'punch', 'grapple'], bonus: 'grab' },
      { name: 'Pençe Yagmuru', seq: ['punch', 'kick'], bonus: 'damage' },
    ],
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
    // girdi tamponu + kombo takibi + kaçinma
    this.buffer = []; // {k, t}: basis kuyrugu (0.25 sn tazelik)
    this.prevPunch = false;
    this.prevKick = false;
    this.prevGrap = false;
    this.comboSeq = []; // bu zincirde atilan hamleler
    this.namedCombo = null; // eslesen isimli hedef kombo
    this.grabComboName = null; // tutusla biten kombo ismi
    this.extUsed = false; // momentum uzatmasi bu zincirde kullanildi mi
    this.dodgeCd = 0;
    this.dodgeDir = 0;
  }

  enterState(s) {
    if (s !== 'run') this.runDir = 0;
    if (s !== 'punch' && s !== 'kick') {
      this.chainCount = 0;
      this.extUsed = false;
    }
    this.state = s;
    this.stateTime = 0;
  }

  // tampondan ilk uygun basisi tüket (öncesindekiler düser)
  takeBuffered(keys) {
    const i = this.buffer.findIndex((b) => keys.includes(b.k));
    if (i < 0) return null;
    const k = this.buffer[i].k;
    this.buffer.splice(0, i + 1);
    return k;
  }

  // comboSeq tanimli bir hedef komboyla tam eslesiyor mu?
  matchCombo(asGrab) {
    const c = (this.styleData.combos || []).find(
      (c) => c.seq.length === this.comboSeq.length && c.seq.every((s, i) => s === this.comboSeq[i])
    );
    if (asGrab) this.grabComboName = c && c.bonus === 'grab' ? c.name : null;
    else this.namedCombo = c || null;
  }

  startDodge(dir) {
    this.dodgeDir = dir;
    this.dodgeCd = 0.5;
    this.enterState('dodge');
  }

  // hareket durumlari arasinda stateTime'i sifirlamadan geçis
  setMoveState(s) {
    if (this.state !== s) this.enterState(s);
  }

  canTurn() {
    return ['idle', 'walk', 'jump'].includes(this.state); // kosarken yön kilitli
  }

  isVulnerable() {
    return !['down', 'getup', 'ko', 'held', 'thrown', 'crowdhold', 'dodge'].includes(this.state);
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
    // isimli kombo takibi (kosu vuruslari zincire girmez)
    if (slot === 'punch' || slot === 'kick') {
      if (this.chainCount === 0) this.comboSeq = [slot];
      else this.comboSeq.push(slot);
      this.matchCombo(false);
    } else {
      this.comboSeq = [];
      this.namedCombo = null;
    }
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
    this.hitRegion = atk.region || 'mid'; // bölgesel tepki animasyonu için
    this.attack = null;
    this.hitstun = atk.hitstun;
    if (this.hp <= 0) this.enterState('ko');
    else if (this.state === 'launched' && this.y > 0) {
      // juggle: havadaki rakip tekrar yukari itilir
      this.vy = 260;
      this.kvx = dir * atk.knockback * 0.5;
      this.enterState('launched');
    } else if (atk.launcher && this.y === 0) {
      // launcher: rakip havaya kalkar, takip vuruslarina açik
      this.vy = 400;
      this.kvx = dir * atk.knockback * 0.55;
      this.enterState('launched');
    } else if (atk.knockdown) this.enterState('down');
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
    // GIRDI TAMPONU: basis kenarlari kuyruga girer, 0.25 sn taze kalir.
    // Toparlanma sirasinda basilan tus yutulmaz; ilk uygun anda ateslenir.
    if (!!input.punch && !this.prevPunch) this.buffer.push({ k: 'punch', t: this.age });
    if (!!input.kick && !this.prevKick) this.buffer.push({ k: 'kick', t: this.age });
    if (!!input.grapple && !this.prevGrap) this.buffer.push({ k: 'grapple', t: this.age });
    this.prevPunch = !!input.punch;
    this.prevKick = !!input.kick;
    this.prevGrap = !!input.grapple;
    while (this.buffer.length && this.age - this.buffer[0].t > 0.25) this.buffer.shift();
    // tutus canli-girdi bölgesidir: ayni basislar tampondan da ateslenmesin
    if (this.state === 'hold' || this.state === 'held') this.buffer.length = 0;
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
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
          // blok basiliyken yön dokunusu = i-frame'li kaçinma adimi
          if (input.block && (tapLeft || tapRight) && this.dodgeCd <= 0) {
            this.startDodge(tapRight ? 1 : -1);
            break;
          }
          const act = this.takeBuffered(['punch', 'kick', 'grapple']);
          if (act === 'punch') { this.startAttack(running ? 'runpunch' : 'punch'); break; }
          if (act === 'kick') { this.startAttack(running ? 'runkick' : 'kick'); break; }
          if (act === 'grapple') { this.grabComboName = null; this.enterState('grab'); break; }
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
        if ((tapLeft || tapRight) && this.dodgeCd <= 0) { this.startDodge(tapRight ? 1 : -1); break; }
        if (!input.block) this.enterState('idle');
        break;

      case 'dodge':
        // i-frame'li kisa kaçinma adimi
        this.x += this.dodgeDir * 330 * dt;
        if (this.stateTime >= 0.22) this.enterState('idle');
        break;

      case 'punch':
      case 'kick': {
        const a = this.attack;
        if (this.stateTime < a.startup + a.active) this.x += this.facing * a.lunge * dt;
        // KOMBO ZINCIRI: isabet ettiyse toparlanmada stile göre iptal aglari islenir.
        // Zincir limiti dolunca momentum (35) harcanarak +1 vurus uzatilabilir.
        if (this.attackHasHit && !this.lastHitBlocked && this.stateTime >= a.startup + a.active) {
          const allowed = (this.styleData.cancels && this.styleData.cancels[this.attackName]) || [];
          const within = this.chainCount + 1 < this.styleData.chain;
          const canExtend = !within && !this.extUsed && this.momentum >= 35 && this.blazinTime <= 0;
          // tutus iptali zincir hakki yemez; vuruslar limit/uzatmaya tabidir
          const eff = allowed.filter((x) => x === 'grapple' || within || canExtend);
          if (eff.length) {
            const k = this.takeBuffered(eff);
            if (k === 'grapple') {
              // vurus -> tutus linki (grappler kombolarinin kalbi)
              this.comboSeq.push('grapple');
              this.matchCombo(true);
              this.enterState('grab');
              break;
            }
            if (k) {
              if (!within) { this.extUsed = true; this.addMomentum(-35); }
              this.chainCount++;
              this.startAttack(k);
              break;
            }
          }
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

      case 'launched':
        // havaya kaldirilmis: takip vuruslarina açik, yere inince düser
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 2.5 * dt);
        this.y += this.vy * dt;
        this.vy -= this.gravity * dt;
        if (this.y <= 0 && this.vy <= 0) {
          this.y = 0;
          this.vy = 0;
          this.kvx *= 0.4;
          this.enterState('down');
        }
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
        if (this.y > 0) { // havada K.O./düsme: yere çakil
          this.y = Math.max(0, this.y + this.vy * dt);
          this.vy -= this.gravity * dt;
          if (this.y === 0) this.vy = 0;
        }
        if (this.stateTime >= 0.9) this.enterState('getup');
        break;

      case 'getup':
        if (this.stateTime >= 0.35) this.enterState('idle');
        break;

      case 'ko':
        this.x += this.kvx * dt;
        this.kvx *= Math.max(0, 1 - 4 * dt);
        if (this.y > 0) {
          this.y = Math.max(0, this.y + this.vy * dt);
          this.vy -= this.gravity * dt;
          if (this.y === 0) this.vy = 0;
        }
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
