window.Game = window.Game || {};

Game.ARENA = { left: 90, right: 870, groundY: 470 };

// Dövüsçü varligi. Sprint 0: konum, yön, yürüme ve ziplama.
// Sprint 1'de state machine (vurus, blok, hasar...) buraya genisleyecek.
Game.Fighter = class {
  constructor(opts) {
    this.name = opts.name;
    this.color = opts.color;
    this.accent = opts.accent;
    this.x = opts.x;
    this.y = 0; // zeminden yükseklik (0 = yerde)
    this.vy = 0;
    this.facing = opts.facing; // 1 saga, -1 sola bakiyor
    this.state = 'idle';
    this.walkPhase = 0;
    this.speed = 230;
    this.jumpVel = 540;
    this.gravity = 1600;
  }

  // input: { left, right, jump } o karedeki niyet
  update(dt, input) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.x += dir * this.speed * dt;
    this.x = Math.max(Game.ARENA.left, Math.min(Game.ARENA.right, this.x));

    if (input.jump && this.y === 0) this.vy = this.jumpVel;
    if (this.y > 0 || this.vy > 0) {
      this.y += this.vy * dt;
      this.vy -= this.gravity * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
      }
    }

    if (this.y > 0) this.state = 'jump';
    else if (dir !== 0) this.state = 'walk';
    else this.state = 'idle';

    if (this.state === 'walk') this.walkPhase += dt * 10;
  }
};
