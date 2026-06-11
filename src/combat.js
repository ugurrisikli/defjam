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

    if (def.isBlocking()) {
      def.x += dir * 14; // blok geri kaydirir ama hasar yok
      return { type: 'block', x: def.x - dir * 20, y: fxY };
    }
    def.takeHit(a, dir);
    return { type: 'hit', attack: a, x: def.x - dir * 15, y: fxY };
  },

  // Tutma denemesi: blogu DELER. Basarirsa holder/held çiftine geçilir.
  resolveGrab(att, def) {
    if (!att.grabActive()) return null;
    const dx = def.x - att.x;
    if (Math.sign(dx || att.facing) !== att.facing) return null;
    if (Math.abs(dx) > Game.GRAB.reach) return null;
    if (!def.isGrabbable()) return null;

    att.enterState('hold');
    att.holdStrikes = 0;
    def.attack = null;
    def.enterState('held');
    def.facing = -att.facing;
    return { type: 'grab', x: def.x, y: Game.ARENA.groundY - 95 };
  },

  // Tutus sürerken: sallama (yumruk tusu), firlatma (tutma tusu), zaman asimi.
  updateHold(att, def, input) {
    const A = Game.ARENA;
    // rakip önde sabit tutulur
    def.x = Math.max(A.left, Math.min(A.right, att.x + att.facing * 44));
    def.y = 0;

    if (input.punch && att.holdStrikes < 3) {
      att.holdStrikes++;
      def.hp = Math.max(0, def.hp - 5);
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
      def.kvx = dir * Game.THROW.speed;
      def.vy = Game.THROW.liftVy;
      def.y = Math.max(def.y, 1);
      def.enterState('thrown');
      att.enterState('idle');
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
