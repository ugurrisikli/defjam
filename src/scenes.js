window.Game = window.Game || {};

Game.scenes = {};

// ----- ANA MENÜ -----
Game.scenes.menu = {
  update() {
    if (Game.Input.wasPressed('Enter')) Game.changeScene('match');
  },
  render(ctx, canvas) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.save();
    ctx.font = 'bold 72px Impact, sans-serif';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ff5e9c';
    ctx.fillText('SOKAK KRALI', W / 2, 180);
    ctx.restore();

    ctx.font = '20px monospace';
    ctx.fillStyle = '#8a8a9a';
    ctx.fillText('Yeralti dövüs arenasina hosgeldin', W / 2, 225);

    if (Math.floor(Game.time * 2) % 2 === 0) {
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#ffd27a';
      ctx.fillText('BASLA — ENTER', W / 2, 330);
    }

    ctx.font = '16px monospace';
    ctx.fillStyle = '#55556a';
    ctx.fillText('P1: A / D yürü, W zipla      P2: Ok tuslari', W / 2, 440);
    ctx.fillText('Menüye dönüs: ESC', W / 2, 466);
  },
};

// ----- MAÇ -----
Game.scenes.match = {
  enter() {
    this.p1 = new Game.Fighter({ name: 'OYUNCU 1', x: 320, facing: 1, color: '#e8512d', accent: '#ffd27a' });
    this.p2 = new Game.Fighter({ name: 'OYUNCU 2', x: 640, facing: -1, color: '#2d9de8', accent: '#aef3ff' });
  },
  update(dt) {
    const I = Game.Input;
    if (I.wasPressed('Escape')) {
      Game.changeScene('menu');
      return;
    }
    this.p1.update(dt, { left: I.isDown('KeyA'), right: I.isDown('KeyD'), jump: I.isDown('KeyW') });
    this.p2.update(dt, { left: I.isDown('ArrowLeft'), right: I.isDown('ArrowRight'), jump: I.isDown('ArrowUp') });
    // dövüsçüler her zaman birbirine bakar
    this.p1.facing = this.p2.x >= this.p1.x ? 1 : -1;
    this.p2.facing = -this.p1.facing;
  },
  render(ctx, canvas) {
    Game.Arena.draw(ctx, Game.time);
    // geride kalan önce çizilir (basit derinlik)
    const order = this.p1.y <= this.p2.y ? [this.p2, this.p1] : [this.p1, this.p2];
    for (const f of order) Game.drawFighter(ctx, f, Game.time);
    this.drawNamePlates(ctx, canvas);
  },
  drawNamePlates(ctx, canvas) {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = this.p1.color;
    ctx.fillText(this.p1.name, 24, 30);
    ctx.textAlign = 'right';
    ctx.fillStyle = this.p2.color;
    ctx.fillText(this.p2.name, canvas.width - 24, 30);
    // Sprint 1'de buraya can barlari gelecek
  },
};
