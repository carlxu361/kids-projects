const PartyEffects = (() => {
  const sky = document.querySelector('#sky');
  const ctx = sky.getContext('2d');
  const music = document.querySelector('#music');
  const fireworks = document.querySelector('#fireworks');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const notes = [67,67,69,67,72,71,null,67,67,69,67,74,72,null,67,67,79,76,72,71,69,null,77,77,76,72,74,72,null,null];
  const harmony = [48,55,64,55,50,57,65,57,55,62,67,62,48,55,64,55];
  const colors = ['#ffbb68', '#e0b6ff', '#ff759e', '#a69cff', '#fff1d4'];
  let context;
  let bus;
  let timer;
  let step = 0;
  let video = true;
  let enabled = false;
  let optedOut = false;
  try { optedOut = localStorage.getItem('orange-birthday-music-off') === 'true'; } catch {}
  let paused = false;
  let animation = 0;
  let last = 0;
  let next = 0;
  let particles = [];

  function paint(time) {
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    if (time > next) {
      const x = sky.width * (.08 + Math.random() * .84);
      const y = sky.height * (.12 + Math.random() * .51);
      const tone = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 38; i++) {
        const a = i * Math.PI * 2 / 38;
        const speed = 20 + Math.random() * 150;
        particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          opacity: 1, tone, size: Math.random() * 1.9 + .7 });
      }
      next = time + 1050 + Math.random() * 900;
    }
    ctx.clearRect(0, 0, sky.width, sky.height);
    for (const p of particles) {
      p.opacity -= dt * .62;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 38 * dt;
      p.vx *= 1 - .9 * dt;
      ctx.globalAlpha = Math.max(0, p.opacity) * .65;
      ctx.fillStyle = p.tone;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    particles = particles.filter(p => p.opacity > 0);
    ctx.globalAlpha = 1;
    animation = requestAnimationFrame(paint);
  }

  function resize() {
    sky.width = innerWidth;
    sky.height = innerHeight;
  }
  function allowsFireworks() {
    return video && !reduced.matches;
  }
  function updateSky() {
    cancelAnimationFrame(animation);
    particles = [];
    ctx.clearRect(0, 0, sky.width, sky.height);
    const allowed = !reduced.matches;
    const enabled = allowsFireworks();
    fireworks.setAttribute('aria-pressed', String(enabled));
    fireworks.setAttribute('aria-disabled', String(!allowed));
    fireworks.title = allowed ? (enabled ? '关闭烟花' : '开启烟花') : '系统已开启减少动态效果';
    if (enabled && !paused && !document.hidden) {
      last = next = 0;
      animation = requestAnimationFrame(paint);
    }
  }
  function tone(note, volume, duration) {
    const at = context.currentTime;
    const synth = context.createOscillator();
    const envelope = context.createGain();
    synth.type = 'sine';
    synth.frequency.value = 440 * 2 ** ((note - 69) / 12);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + .028);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    synth.connect(envelope).connect(bus);
    synth.start(at);
    synth.stop(at + duration + .02);
    synth.onended = () => { synth.disconnect(); envelope.disconnect(); };
  }
  function tick() {
    const key = notes[step % notes.length];
    if (key) tone(key, .043, .55);
    if (step % 2 === 0) tone(harmony[(step / 2) % harmony.length], .026, .6);
    step++;
  }
  function updateMusic() {
    clearInterval(timer);
    music.setAttribute('aria-pressed', String(enabled));
    music.title = enabled ? '关闭生日背景音乐' : '播放生日背景音乐';
    if (!bus) return;
    const playing = enabled && !paused && !document.hidden;
    bus.gain.setTargetAtTime(playing ? .78 : .0001, context.currentTime, .025);
    if (playing) {
      tick();
      timer = setInterval(tick, 375);
    }
  }
  async function setMusic(wanted) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (wanted && !Audio) return false;
    enabled = wanted;
    if (wanted && !context) {
      context = new Audio();
      bus = context.createGain();
      bus.gain.value = .0001;
      bus.connect(context.destination);
    }
    if (wanted && context.state === 'suspended') {
      try { await context.resume(); } catch { enabled = false; }
    }
    updateMusic();
    return enabled;
  }
  music.addEventListener('click', () => {
    optedOut = enabled;
    try { localStorage.setItem('orange-birthday-music-off', String(optedOut)); } catch {}
    setMusic(!optedOut);
  });
  fireworks.addEventListener('click', () => {
    if (reduced.matches) return;
    video = !video;
    updateSky();
  });
  reduced.addEventListener('change', updateSky);
  document.addEventListener('visibilitychange', () => { updateSky(); updateMusic(); });
  addEventListener('resize', resize);
  resize();
  updateSky();
  updateMusic();
  return {
    allowsFireworks,
    startMusic: () => { if (!optedOut) setMusic(true); },
    focus: value => { paused = value; updateSky(); updateMusic(); },
  };
})();
