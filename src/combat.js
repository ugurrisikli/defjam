window.Game = window.Game || {};

// Saldirilarin isabet çözümü, tutma (grapple) yönetimi ve gövde itisi.
Game.Combat = {
  // Saldirgan -> savunan tek yönlü vurus çözümü. Olay döner: hit / block / null.
  resolve(att, def) {
    if (!att.attackActive() || att.attackHasHit) return null;
    const a = att.attack;
    const dx = def.x - att.x;
    if (Math.sign(dx || att.facing) !== att.facing) return null; // sirtina vuramaz
    if (Math.abs(dx) > a.reach) return null;
    if (Math.abs(def.y - att.y) > 70) return null;
    if (!def.isVulnerable()) return null;

    att.attackHasHit = true;
    const dir = att.facing;
    const fxY = Game.ARENA.groundY - def.y - 95;
    const MO = Game.MOMENTUM;

    if (def.isBlocking()) {
      att.lastHitBlocked = true;
      // kosu vurusu blok edilirse daha sert iter; saldirgan momentum kaybeder
      def.x += dir * (a.lunge > 200 ? 26 : 14);
      def.addMomentum(MO.blockGain);
      att.addMomentum(MO.blockedPenalty);
      return { type: 'block', x: def.x - dir * 20, y: fxY };
    }

    const dmg = Math.round(a.damage * att.strikeMult * (att.blazinTime > 0 ? Game.BLAZIN.strikeMult : 1));
    def.takeHit({ ...a, damage: dmg }, dir);
    att.addMomentum(MO.hitGive);
    def.addMomentum(MO.hitTake); // hasar yiyen de bar doldurur (comeback)
    return { type: 'hit', attack: a, x: def.x - dir * 15, y: fxY };
  },

  // Tutma denemesi: blogu DELER. BLAZIN aktifse sinematik özel harekete dönüsür.
  resolveGrab(att, def) {
    if (!att.grabActive()) return null;
    const dx = def.x - att.x;
    if (Math.sign(dx || att.facing) !== att.facing) return null;
    if (Math.abs(dx) > Game.GRAB.reach) return null;
    if (!def.isGrabbable()) return null;

    const fxY = Game.ARENA.groundY - 95;

    if (att.blazinTime > 0) {
      // BLAZIN ÖZEL HAREKETI: modu tüketir, rakibi ezici güçle savurur
      att.blazinTime = 0;
      att.momentum = 0;
      const dmg = Math.round(Game.BLAZIN.grabDamage * att.grappleMult);
      def.hp = Math.max(0, def.hp - dmg);
      def.attack = null;
      def.impactMult = att.grappleMult;
      def.kvx = att.facing * Game.BLAZIN.throwSpeed;
      def.vy = Game.BLAZIN.throwVy;
      def.y = Math.max(def.y, 1);
      def.enterState('thrown');
      att.enterState('blazinpose');
      return { type: 'blazinmove', x: def.x, y: fxY };
    }

    att.enterState('hold');
    att.holdStrikes = 0;
    def.attack = null;
    def.enterState('held');
    def.facing = -att.facing;
    return { type: 'grab', x: def.x, y: fxY };
  },

  // Tutus sürerken: salla (yumruk), stil özel hamlesi (tekme),
  // firlat (tutma) veya zaman asimi.
  updateHold(att, def, input) {
    const A = Game.ARENA;
    const MO = Game.MOMENTUM;
    // rakip önde sabit tutulur
    def.x = Math.max(A.left, Math.min(A.right, att.x + att.facing * 44));
    def.y = 0;

    // STIL ÖZEL HAMLESI: her stilin imza tutus bitiricisi
    if (input.kick) {
      const sp = att.moves.special;
      def.hp = Math.max(0, def.hp - sp.damage);
      if (sp.steal) att.hp = Math.min(att.maxHp, att.hp + sp.steal);
      att.addMomentum(MO.specialGain + (sp.momentum || 0));
      if (def.hp <= 0) {
        def.kvx = att.facing * 160;
        def.enterState('ko');
      } else if (sp.effect === 'suplex') {
        // rakip arkaya asirilir: pozisyonlar degisir
        def.x = att.x - att.facing * 50;
        def.kvx = -att.facing * 60;
        def.enterState('down');
      } else if (sp.effect === 'down') {
        def.kvx = att.facing * 180;
        def.enterState('down');
      } else if (sp.effect === 'staggered') {
        def.kvx = att.facing * 90;
        def.enterState('staggered');
      } else {
        def.takeHit({ ...att.moves.light, damage: 0, knockback: 200 }, att.facing);
      }
      att.enterState('idle');
      return { type: 'special', name: sp.name, x: def.x, y: A.groundY - 95 };
    }

    if (input.punch && att.holdStrikes < 3) {
      att.holdStrikes++;
      const dmg = Math.round(5 * att.grappleMult);
      def.hp = Math.max(0, def.hp - dmg);
      if (att.styleData.holdSteal) att.hp = Math.min(att.maxHp, att.hp + 2); // can çalma
      att.addMomentum(MO.holdHit);
      if (def.hp <= 0) {
        def.kvx = att.facing * 140;
        def.enterState('ko');
        att.enterState('idle');
      } else if (att.holdStrikes >= 3) {
        // üçüncü sallamadan sonra rakip yakayi kurtarir
        def.kvx = att.facing * 100;
        def.enterState('staggered');
        att.enterState('idle');
      }
      return { type: 'holdhit', x: def.x, y: A.groundY - 95 };
    }

    if (input.grapple) {
      // yön tusuyla geriye dogru da firlatilabilir
      const dir = input.left ? -1 : input.right ? 1 : att.facing;
      def.impactMult = att.grappleMult;
      def.kvx = dir * Game.THROW.speed;
      def.vy = Game.THROW.liftVy;
      def.y = Math.max(def.y, 1);
      def.enterState('thrown');
      att.enterState('idle');
      att.addMomentum(Game.MOMENTUM.throwGain);
      return { type: 'throw', x: def.x, y: A.groundY - 95 };
    }

    if (att.stateTime >= 1.5) {
      // çok bekleyen tutusu rakip kirar
      def.enterState('idle');
      att.kvx = -att.facing * 80;
      att.enterState('staggered');
      return { type: 'escape', x: att.x, y: A.groundY - 95 };
    }
    return null;
  },

  // Dövüsçüler üst üste binmesin: gövde itisi.
  separate(p1, p2) {
    const noPush = (f) => ['down', 'getup', 'ko', 'hold', 'held', 'thrown', 'crowdhold'].includes(f.state);
    if (noPush(p1) || noPush(p2)) return;
    const minGap = 40;
    const dx = p2.x - p1.x;
    if (Math.abs(dx) >= minGap || Math.abs(p1.y - p2.y) > 80) return;
    const push = (minGap - Math.abs(dx)) / 2;
    const s = dx >= 0 ? 1 : -1;
    const A = Game.ARENA;
    p1.x = Math.max(A.left, Math.min(A.right, p1.x - s * push));
    p2.x = Math.max(A.left, Math.min(A.right, p2.x + s * push));
  },
};
