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
  let noiseBuffer;
  let timer;
  let step = 0;
  let video = true;
  let enabled = false;
  let optedOut = false;
  try { optedOut = localStorage.getItem('orange-birthday-music-off') === 'true'; } catch {}
  let paused = false;
  let skyPaused = false;
  let externalSky = false;
  let chapter = 'intro';
  const climaxChapters = new Set(['intro', 'cake', 'shop', 'finale']);
  let fireworksListener = null;
  let animation = 0;
  let last = 0;
  let next = 0;
  let viewW = 1;
  let viewH = 1;
  let scale = 1;
  let particles = [];
  let rockets = [];
  let dustReady = false;
  const sprites = new Map(colors.map(tone => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 24;
    const g = sprite.getContext('2d');
    const glow = g.createRadialGradient(12, 12, 0, 12, 12, 12);
    glow.addColorStop(0, '#fffaf0');
    glow.addColorStop(.26, tone);
    glow.addColorStop(.62, tone + '55');
    glow.addColorStop(1, tone + '00');
    g.fillStyle = glow;
    g.fillRect(0, 0, 24, 24);
    return [tone, sprite];
  }));
  const dust = Array.from({ length: 22 }, (_, i) => ({
    x: 0,
    y: 0,
    vx: (Math.random() - .5) * 6,
    vy: -2.2 - Math.random() * 4.5,
    phase: Math.random() * Math.PI * 2,
    speed: .65 + Math.random() * .85,
    size: .9 + Math.random() * 1.15,
    tone: colors[i % colors.length],
  }));

  function clearSky() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, sky.width, sky.height);
    ctx.restore();
  }

  function burst(x, y, tone) {
    const count = 38;
    for (let i = 0; i < count; i++) {
      const a = i * Math.PI * 2 / count + (Math.random() - .5) * .08;
      const speed = 24 + Math.random() * 146;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        opacity: 1,
        tone,
        size: Math.random() * 1.7 + .85,
      });
    }
  }

  function launch(instant) {
    const tone = colors[Math.floor(Math.random() * colors.length)];
    const tx = viewW * (.1 + Math.random() * .8);
    const ty = viewH * (.13 + Math.random() * .44);
    if (instant) {
      burst(tx, ty, tone);
      return;
    }
    const sx = tx + (Math.random() - .5) * Math.min(120, viewW * .14);
    const sy = viewH * (.72 + Math.random() * .16);
    const flight = .46 + Math.random() * .2;
    rockets.push({
      x: sx,
      y: sy,
      vx: (tx - sx) / flight,
      vy: (ty - sy) / flight - 90 * flight,
      ttl: flight,
      tone,
    });
  }

  function paint(time) {
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    const firstFrame = last === 0;
    last = time;
    if (climaxChapters.has(chapter) && time > next) {
      launch(firstFrame);
      next = time + 1050 + Math.random() * 900;
    }

    if (particles.length || rockets.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      const fade = dt ? Math.min(1, 1 - Math.exp(-dt * 8.5)) : .15;
      ctx.fillStyle = `rgba(0,0,0,${fade.toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    } else {
      clearSky();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const mote of dust) {
      mote.x = ((mote.x + mote.vx * dt) % viewW + viewW) % viewW;
      mote.y = ((mote.y + mote.vy * dt) % viewH + viewH) % viewH;
      const breath = .18 + .26 * (.5 + .5 * Math.sin(time * .001 * mote.speed + mote.phase));
      const size = mote.size * 5;
      ctx.globalAlpha = breath;
      ctx.drawImage(sprites.get(mote.tone), mote.x - size / 2, mote.y - size / 2, size, size);
    }

    const nextRockets = [];
    for (const r of rockets) {
      r.ttl -= dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.vy += 180 * dt;
      if (r.ttl <= 0) {
        burst(r.x, r.y, r.tone);
        continue;
      }
      nextRockets.push(r);
      ctx.globalAlpha = .82;
      ctx.drawImage(sprites.get(r.tone), r.x - 9, r.y - 9, 18, 18);
    }
    rockets = nextRockets;

    const nextParticles = [];
    for (const p of particles) {
      p.opacity -= dt * .72;
      if (p.opacity <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 42 * dt;
      p.vx *= Math.max(0, 1 - .95 * dt);
      const size = p.size * 7;
      ctx.globalAlpha = Math.max(0, p.opacity) * .7;
      ctx.drawImage(sprites.get(p.tone), p.x - size / 2, p.y - size / 2, size, size);
      nextParticles.push(p);
    }
    particles = nextParticles;

    ctx.restore();
    animation = requestAnimationFrame(paint);
  }

  function resize() {
    viewW = Math.max(1, innerWidth);
    viewH = Math.max(1, innerHeight);
    const rawDpr = Math.min(window.devicePixelRatio || 1, 2);
    const budget = Math.min(1, Math.sqrt((2560 * 1600) / Math.max(1, viewW * viewH * rawDpr * rawDpr)));
    scale = rawDpr * budget;
    sky.width = Math.max(1, Math.round(viewW * scale));
    sky.height = Math.max(1, Math.round(viewH * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (!dustReady) {
      dustReady = true;
      for (const mote of dust) {
        mote.x = Math.random() * viewW;
        mote.y = Math.random() * viewH;
      }
    } else {
      for (const mote of dust) {
        mote.x = ((mote.x % viewW) + viewW) % viewW;
        mote.y = ((mote.y % viewH) + viewH) % viewH;
      }
    }
  }
  function allowsFireworks() {
    return video && !reduced.matches;
  }
  function updateSky() {
    cancelAnimationFrame(animation);
    particles = [];
    rockets = [];
    clearSky();
    const allowed = !reduced.matches;
    const skyOn = allowsFireworks();
    fireworks.setAttribute('aria-pressed', String(skyOn));
    fireworks.setAttribute('aria-disabled', String(!allowed));
    fireworks.title = allowed ? (skyOn ? '关闭烟花' : '开启烟花') : '系统已开启减少动态效果';
    if (skyOn && !externalSky && !paused && !skyPaused && !document.hidden) {
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
  function canPlaySfx() {
    return Boolean(enabled && !paused && context && context.state === 'running');
  }
  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    const length = Math.max(1, Math.round(context.sampleRate * .2));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      smooth = smooth * .35 + (Math.random() * 2 - 1) * .65;
      data[i] = smooth;
    }
    noiseBuffer = buffer;
    return noiseBuffer;
  }
  function playTurnSfx(kind = 'book') {
    if (!canPlaySfx()) return;
    const at = context.currentTime;
    const daybreak = kind === 'daybreak';
    const duration = daybreak ? .22 : .16;
    const peak = daybreak ? .038 : .045;
    const source = context.createBufferSource();
    source.buffer = getNoiseBuffer();
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = daybreak ? 1.1 : 1.4;
    filter.frequency.setValueAtTime(daybreak ? 680 : 1600, at);
    filter.frequency.exponentialRampToValueAtTime(daybreak ? 1250 : 750, at + duration);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(peak, at + .02);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter).connect(envelope).connect(bus || context.destination);
    source.start(at);
    source.stop(at + duration + .02);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
  }
  function playGiftSfx() {
    if (!canPlaySfx()) return;
    const base = context.currentTime;
    [84, 91, 96].forEach((note, index) => {
      const at = base + index * .07;
      const duration = .55;
      const synth = context.createOscillator();
      const envelope = context.createGain();
      synth.type = 'sine';
      synth.frequency.value = 440 * 2 ** ((note - 69) / 12);
      envelope.gain.setValueAtTime(.0001, at);
      envelope.gain.exponentialRampToValueAtTime(.028, at + .018);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      synth.connect(envelope).connect(bus || context.destination);
      synth.start(at);
      synth.stop(at + duration + .02);
      synth.onended = () => {
        synth.disconnect();
        envelope.disconnect();
      };
    });
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
    updateFireworks();
  });
  function updateFireworks() {
    updateSky();
    fireworksListener?.(allowsFireworks());
  }
  reduced.addEventListener('change', updateFireworks);
  document.addEventListener('visibilitychange', () => { updateSky(); updateMusic(); });
  addEventListener('resize', resize);
  resize();
  updateSky();
  updateMusic();
  return {
    allowsFireworks,
    setExternalSky(value) {
      const owned = Boolean(value);
      if (externalSky === owned) return;
      externalSky = owned;
      updateSky();
    },
    setChapter(key) {
      if (chapter === key) return;
      chapter = key;
      updateSky();
    },
    onFireworksChange(fn) { fireworksListener = fn; },
    startMusic: () => { if (!optedOut) setMusic(true); },
    focus: value => { paused = value; updateSky(); updateMusic(); },
    pauseSky: value => {
      const nextPaused = Boolean(value);
      if (skyPaused === nextPaused) return;
      skyPaused = nextPaused;
      updateSky();
    },
    isMusicEnabled: () => enabled,
    playTurnSfx,
    playGiftSfx,
  };
})();
