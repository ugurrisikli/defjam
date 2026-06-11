window.Game = window.Game || {};

// Saldirilarin isabet çözümü ve gövde itisi.
Game.Combat = {
  // Saldirgan -> savunan tek yönlü çözüm. Olay döner: hit / block / null.
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

  // Dövüsçüler üst üste binmesin: gövde itisi.
  separate(p1, p2) {
    const lying = (f) => f.state === 'down' || f.state === 'getup' || f.state === 'ko';
    if (lying(p1) || lying(p2)) return;
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
