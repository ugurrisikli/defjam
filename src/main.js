window.Game = window.Game || {};

// Sabit zaman adimli oyun döngüsü: mantik 60 Hz'de deterministik ilerler,
// çizim her ekran karesinde yapilir.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const STEP = 1 / 60;
  const MAX_LAG = 0.25; // sekme arka planda kalirsa dev adim atlamayi engelle

  let scene = null;
  let accumulator = 0;
  let last = performance.now();

  Game.time = 0; // animasyonlar için toplam oyun süresi (saniye)

  Game.changeScene = function (name) {
    scene = Game.scenes[name];
    if (scene.enter) scene.enter();
  };

  function frame(now) {
    accumulator += Math.min((now - last) / 1000, MAX_LAG);
    last = now;

    while (accumulator >= STEP) {
      scene.update(STEP);
      Game.time += STEP;
      accumulator -= STEP;
    }
    Game.Input.endFrame();

    scene.render(ctx, canvas);
    requestAnimationFrame(frame);
  }

  Game.changeScene('menu');
  requestAnimationFrame(frame);
})();
