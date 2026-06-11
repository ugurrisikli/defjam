window.Game = window.Game || {};

// Klavye durumu: "down" basili tutulanlar, "pressed" bu kare içinde yeni basilanlar.
Game.Input = (function () {
  const down = new Set();
  const pressed = new Set();
  const swallowed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

  window.addEventListener('keydown', (e) => {
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
    if (swallowed.includes(e.code)) e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    down.delete(e.code);
  });

  window.addEventListener('blur', () => {
    down.clear();
    pressed.clear();
  });

  return {
    isDown: (code) => down.has(code),
    wasPressed: (code) => pressed.has(code),
    endFrame: () => pressed.clear(),
  };
})();
