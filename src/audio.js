window.Game = window.Game || {};

// Prosedürel WebAudio motoru: hiç ses dosyasi yok, her sey sentezlenir.
// Tarayici politikasi geregi ilk tus basisinda kilidi açilir.
Game.Audio = (function () {
  let ac = null;
  let master = null;
  let crowdGain = null; // kalabalik ugultusu seviyesi
  let cheerEnv = 0; // tezahürat zarfi (0..1, sönümlenir)
  let muted = false;

  // müzik durumu: bakis-ileri zamanlayici ile 8'lik adimlar
  const music = { on: false, bpm: 92, bass: [55, 55, 65.4, 49], nextTime: 0, step: 0 };

  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ac.destination);

    // kalabalik: döngülü gürültü -> alçak geçiren filtre -> ugultu
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    crowdGain = ac.createGain();
    crowdGain.gain.value = 0;
    src.connect(lp).connect(crowdGain).connect(master);
    src.start();
  }

  function env(t0, peak, dur) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0012, peak), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0012, t0 + dur);
    g.connect(master);
    return g;
  }

  // pesten inen vurus gümlemesi
  function thump(f0, f1, dur, peak, t0 = ac.currentTime) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    o.connect(env(t0, peak, dur));
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // filtrelenmis gürültü patlamasi (siddet/temas sesleri)
  function burst(type, freq, dur, peak, t0 = ac.currentTime) {
    const n = ac.createBufferSource();
    const len = Math.max(1, (ac.sampleRate * dur) | 0);
    const b = ac.createBuffer(1, len, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    n.buffer = b;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    n.connect(f).connect(env(t0, peak, dur));
    n.start(t0);
  }

  function blip(freq, dur, peak, type = 'square', t0 = ac.currentTime) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(env(t0, peak, dur));
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // yükselen gerilim sesi (BLAZIN)
  function riser(t0 = ac.currentTime) {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t0);
    o.frequency.exponentialRampToValueAtTime(720, t0 + 0.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0012, t0 + 0.6);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + 0.65);
  }

  const SFX = {
    hit() { thump(180, 55, 0.12, 0.5); burst('lowpass', 1400, 0.07, 0.3); },
    heavy() { thump(150, 38, 0.2, 0.75); burst('lowpass', 900, 0.12, 0.4); },
    block() { blip(820, 0.05, 0.16); burst('highpass', 3000, 0.04, 0.12); },
    grab() { burst('lowpass', 600, 0.1, 0.25); },
    whoosh() { burst('bandpass', 1100, 0.22, 0.3); },
    slam() { thump(95, 26, 0.32, 0.95); burst('lowpass', 500, 0.2, 0.5); },
    land() { thump(120, 45, 0.15, 0.5); burst('lowpass', 700, 0.08, 0.25); },
    special() { burst('bandpass', 1300, 0.18, 0.35); thump(140, 35, 0.24, 0.8); },
    blazin() { riser(); },
    ko() { thump(80, 22, 0.5, 1.0); burst('lowpass', 400, 0.35, 0.6); },
    blip() { blip(660, 0.05, 0.12); },
    lock() { blip(440, 0.05, 0.14); blip(660, 0.06, 0.14, 'square', ac.currentTime + 0.07); },
    bell() { blip(1320, 0.5, 0.2, 'triangle'); blip(880, 0.5, 0.12, 'triangle'); },
  };

  function play(name) {
    if (!ac || muted) return;
    if (SFX[name]) SFX[name]();
  }

  // tezahürat: kalabalik ugultusu kabarir, kademeli söner
  function cheer(i) {
    cheerEnv = Math.min(1, cheerEnv + i);
  }

  function startMusic(cfg) {
    if (!ac) { music.pending = cfg; return; }
    music.bpm = cfg.bpm;
    music.bass = cfg.bass;
    music.on = true;
    music.step = 0;
    music.nextTime = ac.currentTime + 0.05;
  }

  function stopMusic() {
    music.on = false;
    music.pending = null;
  }

  // her oyun karesinde çagrilir: müzigi planlar, kalabaligi günceller
  function update(dt) {
    if (!ac) return;
    if (music.pending) { startMusic(music.pending); music.pending = null; }

    // kalabalik: taban ugultu + tezahürat zarfi
    cheerEnv = Math.max(0, cheerEnv - dt * 0.7);
    if (crowdGain) {
      const target = muted ? 0 : 0.04 + cheerEnv * 0.22;
      crowdGain.gain.setTargetAtTime(target, ac.currentTime, 0.08);
    }

    if (!music.on || muted) return;
    const stepDur = 60 / music.bpm / 2; // 8'lik adimlar
    while (music.nextTime < ac.currentTime + 0.12) {
      const t = music.nextTime;
      const s = music.step % 8;
      if (s === 0 || s === 4) thump(115, 42, 0.12, 0.4, t); // kick
      if (s === 4) burst('bandpass', 1900, 0.09, 0.16, t); // snare
      burst('highpass', 6500, 0.025, s % 2 ? 0.05 : 0.08, t); // hat
      if (s % 2 === 0) { // bas hatti
        const note = music.bass[(music.step >> 1) % music.bass.length];
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = note;
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 260;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0012, t + stepDur * 1.8);
        o.connect(f).connect(g).connect(master);
        o.start(t);
        o.stop(t + stepDur * 2);
      }
      music.nextTime += stepDur;
      music.step++;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.6;
    return muted;
  }

  return { unlock, update, play, cheer, startMusic, stopMusic, toggleMute, get muted() { return muted; } };
})();
