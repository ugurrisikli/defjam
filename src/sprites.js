window.Game = window.Game || {};

// ============================================================
// SPRITE PIPELINE
// Gerçek sanat varliklari (boyali anime sprite sheet'leri) için altyapi.
// assets/<stil>.png + assets/<stil>.json bulunursa karakter sprite ile
// çizilir; bulunamazsa vektör kukla devreye girer (oyun asla bozulmaz).
// Üretim rehberi ve atlas formati: ASSETS.md
// ============================================================
Game.Sprites = (function () {
  const atlases = {}; // stil -> {img, meta} | 'loading' | 'none'

  // Atlas JSON formati:
  // { "frameW":256, "frameH":256, "scale":1.0, "anchorY":1.0,
  //   "anims": { "idle": {"row":0,"frames":6,"fps":8,"loop":true},
  //              "punch":{"row":4,"frames":6,"sync":"attack"}, ... } }
  function request(style) {
    if (atlases[style] !== undefined) return;
    atlases[style] = 'loading';
    if (typeof fetch !== 'function' || typeof Image === 'undefined') {
      atlases[style] = 'none';
      return;
    }
    fetch('assets/' + style + '.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((meta) => {
        const img = new Image();
        img.onload = () => { atlases[style] = { img, meta }; };
        img.onerror = () => { atlases[style] = 'none'; };
        img.src = 'assets/' + style + '.png';
      })
      .catch(() => { atlases[style] = 'none'; });
  }

  // dövüsçü durumunu atlas animasyon adina çevir
  function animFor(f, meta) {
    const a = meta.anims;
    const direct = a[f.state];
    if (direct) return direct;
    // eslesme yoksa yakin akrabasi
    const alias = {
      runpunch: 'punch', runkick: 'kick', crowdhold: 'staggered',
      launched: 'thrown', specialmove: 'punch', blazinpose: 'idle',
      getup: 'idle', dodge: 'run',
    };
    return a[alias[f.state]] || a.idle;
  }

  function frameIndex(f, anim) {
    if (anim.sync === 'attack' && f.attack) {
      const total = f.attack.startup + f.attack.active + f.attack.recovery;
      const u = Math.min(0.999, f.stateTime / total);
      return Math.floor(u * anim.frames);
    }
    const fps = anim.fps || 10;
    const i = Math.floor(f.stateTime * fps);
    return anim.loop ? i % anim.frames : Math.min(anim.frames - 1, i);
  }

  // true dönerse sprite çizildi; false dönerse vektör fallback devralir
  function draw(ctx, f, t, opts) {
    const at = atlases[f.style];
    if (at === undefined) { request(f.style); return false; }
    if (at === 'loading' || at === 'none') return false;
    const { img, meta } = at;
    const anim = animFor(f, meta);
    if (!anim) return false;
    const idx = frameIndex(f, anim);
    const fw = meta.frameW;
    const fh = meta.frameH;
    const s = meta.scale || 1;
    const groundY = Game.ARENA.groundY;
    const footY = groundY - f.y;

    if (!opts || !opts.plain) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(f.x, groundY + 6, fw * 0.18 * s, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(f.x, footY);
    ctx.scale(f.facing, 1);
    if (f.blazinTime > 0 && (!opts || !opts.plain)) {
      ctx.shadowColor = '#ffc83c';
      ctx.shadowBlur = 22;
    }
    // yere serilme/savrulma döndürmeleri sprite'a da uygulanir
    let lie = 0;
    if (f.state === 'down' || f.state === 'ko') lie = Math.min(1, f.stateTime / 0.18);
    else if (f.state === 'getup') lie = 1 - Math.min(1, f.stateTime / 0.35);
    if (lie > 0 && !meta.anims.down) ctx.rotate(-lie * Math.PI / 2);
    if (f.state === 'thrown' && !meta.anims.thrown) ctx.rotate(-f.stateTime * 8);
    ctx.drawImage(
      img, idx * fw, anim.row * fh, fw, fh,
      -fw * 0.5 * s, -fh * (meta.anchorY === undefined ? 1 : meta.anchorY) * s,
      fw * s, fh * s
    );
    ctx.restore();
    return true;
  }

  return { draw, request, get atlases() { return atlases; } };
})();
