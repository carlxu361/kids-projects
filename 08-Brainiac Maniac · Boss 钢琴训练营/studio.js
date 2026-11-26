const pitchNames = "C C# D D# E F F# G G# A A# B".split(" ");
function midiFor(note) {
  const [, letter, accidental, octave] = /^([A-G])([#b]?)(\d)$/.exec(note);
  return (Number(octave) + 1) * 12 + pitchNames.indexOf(letter) + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
}
function nameFor(midi) {
  return pitchNames[midi % 12] + (Math.floor(midi / 12) - 1);
}

function createPianoAudio(getContext, samples = "samples/") {
  const roots = Array.from({ length: 17 }, (_, i) => 36 + i * 3);
  const files = Promise.all(roots.map(async midi => {
    const response = await fetch(`${samples}${nameFor(midi).replace("#", "s")}.mp3`);
    if (!response.ok) throw new Error("Sample unavailable");
    return response.arrayBuffer();
  })).catch(() => null);
  const voices = new Set();
  let buffers, loading, output;
  return {
    async ready() {
      const context = getContext();
      if (context.state !== "running") await context.resume();
      loading ||= (async () => {
        const bytes = await files;
        if (!bytes) throw new Error("Piano samples unavailable");
        buffers = await Promise.all(bytes.map(data => context.decodeAudioData(data)));
        output = context.createDynamicsCompressor();
        output.threshold.value = -12;
        output.ratio.value = 3;
        output.connect(context.destination);
      })();
      await loading;
      return context;
    },
    play(midi, at, length, velocity) {
      const context = getContext();
      const index = Math.max(0, Math.min(roots.length - 1, Math.round((midi - roots[0]) / 3)));
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffers[index];
      source.playbackRate.value = 2 ** ((midi - roots[index]) / 12);
      gain.gain.setValueAtTime(velocity * .52, at);
      source.connect(gain).connect(output);
      const release = (when = context.currentTime, fade = .22) => {
        gain.gain.cancelScheduledValues(when);
        gain.gain.setTargetAtTime(.0001, when, fade / 4);
        source.stop(when + fade);
      };
      const voice = { release };
      voices.add(voice);
      source.onended = () => {
        voices.delete(voice);
        source.disconnect();
        gain.disconnect();
      };
      source.start(at);
      if (length != null) release(at + length, .32);
      return voice;
    },
    silence() { voices.forEach(voice => voice.release(undefined, .035)); }
  };
}

function createStudio({ getContext, getLesson, onMic, enabled, notify }) {
  const $ = id => document.getElementById(id);
  const piano = $("piano");
  const audio = createPianoAudio(getContext);
  const part = $("parts"), piece = $("piece"), tempo = $("tempo");
  const canvas = $("note-roll");
  const scroller = piano.closest(".keyboard-scroll");
  const ink = canvas.getContext("2d");
  const keys = new Map();
  const inputKeys = "KeyA KeyW KeyS KeyE KeyD KeyF KeyT KeyG KeyY KeyH KeyU KeyJ KeyK KeyO KeyL KeyP Semicolon Quote".split(" ");
  const labels = "A W S E D F T G Y H U J K O L P ; ’".split(" ");
  const held = new Map();
  const sustained = new Set();
  let pedal = false, playback = null, pending = null, frame, follow = null, clickTimer;
  let timeline = [];
  let keyboardBase = 60;
  const micGuide = $("mic-guide").textContent;
  const whiteCount = 29;
  let white = 0;
  for (let midi = 36; midi <= 84; midi++) {
    const name = nameFor(midi);
    const sharp = name.includes("#");
    const key = document.createElement("button");
    key.type = "button";
    key.className = `piano-key ${sharp ? "black-key" : "white-key"}`;
    key.dataset.midi = midi;
    key.setAttribute("aria-label", name.replace("#", " 升 "));
    key.innerHTML = `<span>${name.replace("#", "♯")}<kbd></kbd></span>`;
    const x = (white + (sharp ? 0 : .5)) / whiteCount;
    if (sharp) key.style.left = `${x * 100}%`;
    else white++;
    keys.set(midi, { key, x, sharp });
    piano.append(key);
  }

  function updateKeyboardLabels() {
    for (const [midi, { key }] of keys) {
      key.querySelector("kbd").textContent = labels[midi - keyboardBase] ?? "";
    }
  }
  updateKeyboardLabels();

  function bringIntoView(midi = 60) {
    scroller.scrollLeft = keys.get(midi).x * piano.clientWidth - scroller.clientWidth / 2;
  }

  function score() {
    if (piece.value === "lesson") {
      const lesson = getLesson();
      const left = lesson.stage === "低音";
      const beats = lesson.stage === "切分" ? [0,.75,1.5,2.5,4,4.75,5.5,6.5] : [0,.5,1,1.75,3,3.5,4.25,5.5];
      const melody = lesson.notes.map((note, index) => ({
        midi: midiFor(note), beat: beats[index], length: index === 7 ? 1.5 : .42,
        velocity: [.88,.67,.8,.73,.91,.66,.8,.7][index], hand: left ? "left" : "right"
      }));
      return { beats: 8, detail: `${lesson.exercise} · 2 小节`, events: melody };
    }
    const song = repertoire[piece.value];
    const events = ["left", "right"].flatMap(hand => song[hand].flatMap((bar, index) =>
      bar.flatMap(([beat, chord, length, velocity]) => [chord].flat().map(note => ({
        midi: midiFor(note), beat: index * 4 + beat, length, velocity, hand
      })))));
    return { beats: 32, detail: `${song.description} · 8 小节`, events };
  }

  function refresh() {
    const music = score();
    const lessonHand = music.events[0].hand;
    for (const option of part.options) {
      option.disabled = piece.value === "lesson" && option.value !== "both" && option.value !== lessonHand;
    }
    if (part.selectedOptions[0].disabled) part.value = "both";
    timeline = music.events.filter(event => part.value === "both" || event.hand === part.value);
    $("piece-detail").textContent = music.detail;
    draw(0);
  }

  function draw(beat) {
    const height = canvas.clientHeight;
    const width = canvas.clientWidth;
    const density = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * density) || canvas.height !== Math.round(height * density)) {
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
    }
    ink.setTransform(density, 0, 0, density, 0, 0);
    ink.clearRect(0, 0, width, height);
    const travel = height / 4.5;
    ink.lineWidth = 1;
    for (const { x, sharp } of keys.values()) {
      if (sharp) continue;
      ink.strokeStyle = "rgba(194,202,230,.09)";
      ink.beginPath();
      ink.moveTo((x - .5 / whiteCount) * width, 0);
      ink.lineTo((x - .5 / whiteCount) * width, height);
      ink.stroke();
    }
    for (let line = Math.ceil(beat); line <= beat + 4.5; line++) {
      const y = height - (line - beat) * travel;
      ink.fillStyle = line % 4 === 0 ? "#626780" : "#353a4f";
      ink.fillRect(0, y, width, 1);
    }
    const notes = follow ? follow.steps.slice(follow.index) : timeline;
    for (const event of notes) {
      if (event.beat > beat + 4.7 || event.beat + event.length < beat) continue;
      const lane = keys.get(event.midi);
      const w = width / whiteCount * (lane.sharp ? .48 : .68);
      const h = Math.max(6, event.length * travel - 3);
      const y = height - (event.beat - beat) * travel - h;
      ink.fillStyle = event.hand === "left" ? "#a7aaff" : "#f5c787";
      ink.beginPath();
      ink.roundRect(lane.x * width - w / 2, y, w, h, 3);
      ink.fill();
    }
  }

  function clearHighlights() {
    keys.forEach(({ key }) => key.classList.remove("played-left", "played-right", "expected"));
  }

  function stop() {
    pending = null;
    if (playback) {
      playback.voices.forEach(voice => voice.release(undefined, .045));
      playback = null;
    }
    cancelAnimationFrame(frame);
    clearHighlights();
    $("listen-button").textContent = "▶ 播放";
    tempo.disabled = false;
    $("play-position").textContent = "第 1 小节";
    draw(follow?.steps[follow.index]?.beat ?? 0);
  }

  async function audioReady() {
    try {
      const context = await audio.ready();
      $("audio-status").textContent = "Yamaha C5 · 实录采样";
      return context;
    } catch {
      $("audio-status").textContent = "琴声加载失败，请通过本地服务器或网页重新打开。";
      return null;
    }
  }

  async function play() {
    if (playback || pending) { stop(); return; }
    if (!enabled()) { notify("请先开启页面声音。"); return; }
    onMic();
    stopFollow();
    const request = {};
    pending = request;
    $("listen-button").textContent = "■ 取消";
    const context = await audioReady();
    if (pending !== request) return;
    pending = null;
    if (!context) { stop(); return; }

    const seconds = 60 / Number(tempo.value);
    const start = context.currentTime + .08;
    const totalBeats = score().beats;
    const tail = totalBeats + 1;
    const events = timeline;
    const voices = events.map(event => audio.play(event.midi, start + event.beat * seconds, event.length * seconds, event.velocity));
    playback = { voices };
    $("listen-button").textContent = "■ 停止";
    tempo.disabled = true;
    function update() {
      const beat = Math.max(0, (context.currentTime - start) / seconds);
      if (beat >= tail) { stop(); return; }
      clearHighlights();
      for (const event of events) {
        if (event.beat <= beat && beat < event.beat + event.length) keys.get(event.midi).key.classList.add(`played-${event.hand}`);
      }
      $("play-position").textContent = `第 ${Math.min(Math.ceil(totalBeats / 4), Math.floor(beat / 4) + 1)} 小节`;
      draw(beat);
      frame = requestAnimationFrame(update);
    }
    update();
  }

  function showExpected() {
    clearHighlights();
    const event = follow?.steps[follow.index];
    $("play-position").textContent = event ? `${follow.index + 1} / ${follow.steps.length} · 请弹 ${nameFor(event.midi)}` : "跟练完成";
    if (!event) return;
    if (follow.input === "virtual" && (event.midi < keyboardBase || event.midi >= keyboardBase + inputKeys.length)) {
      keyboardBase = Math.min(72, Math.floor(event.midi / 12) * 12);
      updateKeyboardLabels();
    }
    keys.get(event.midi).key.classList.add("expected");
    if (piano.clientWidth > scroller.clientWidth) {
      const key = keys.get(event.midi).key;
      const bounds = key.getBoundingClientRect(), area = scroller.getBoundingClientRect();
      if (bounds.left < area.left + 10 || bounds.right > area.right - 10) bringIntoView(event.midi);
    }
    draw(event.beat);
  }

  function startFollow(input) {
    stop();
    const hand = piece.value === "lesson" ? score().events[0].hand : part.value === "left" ? "left" : "right";
    const byBeat = new Map();
    for (const event of timeline.filter(event => event.hand === hand)) {
      const current = byBeat.get(event.beat);
      if (!current || (hand === "right" ? event.midi > current.midi : event.midi < current.midi)) byBeat.set(event.beat, event);
    }
    follow = { input, index: 0, steps: [...byBeat.values()].sort((a, b) => a.beat - b.beat) };
    $("mic-guide").textContent = `${hand === "left" ? "左手低音" : "右手旋律"} · ${input === "mic" ? "在真实钢琴上逐音弹奏" : "点击、触摸或按标出的电脑键位，[ 和 ] 可换八度"}`;
    $("play-position").setAttribute("aria-live", "polite");
    $("virtual-follow").setAttribute("aria-pressed", String(input === "virtual"));
    $("virtual-follow").textContent = input === "virtual" ? "结束网页琴键跟练" : "没有钢琴？用网页琴键跟练";
    showExpected();
  }

  function hear(midi) {
    const event = follow?.steps[follow.index];
    if (!event) return;
    $("mic-heard").textContent = `${follow.input === "mic" ? "听到" : "弹了"} ${nameFor(midi)}`;
    if (event.midi !== midi) return;
    follow.index++;
    if (follow.index === follow.steps.length) {
      clearHighlights();
      draw(event.beat);
      $("play-position").textContent = "跟练完成";
      $("mic-guide").textContent = "本段已弹完，可重新跟练或换一首。";
      return "done";
    }
    showExpected();
  }

  function stopFollow() {
    if (!follow) return;
    const { input, index, steps } = follow;
    const completed = index === steps.length;
    follow = null;
    $("play-position").setAttribute("aria-live", "off");
    $("virtual-follow").setAttribute("aria-pressed", "false");
    $("virtual-follow").textContent = "没有钢琴？用网页琴键跟练";
    if (input === "virtual") {
      if (!completed) $("mic-guide").textContent = micGuide;
      $("mic-heard").textContent = "";
    }
    clearHighlights();
    if (!completed) {
      $("play-position").textContent = "第 1 小节";
      draw(0);
    }
  }

  async function press(id, midi) {
    if (held.has(id)) return;
    const { key } = keys.get(midi);
    const entry = { key };
    held.set(id, entry);
    key.classList.add("active");
    if (follow?.input === "mic") return;
    if (follow?.input === "virtual" && hear(midi) === "done") stopFollow();
    if (!enabled()) return;
    const context = await audioReady();
    if (!context || !enabled() || follow?.input === "mic") return;
    const stillHeld = held.get(id) === entry;
    if (stillHeld || entry.tap) entry.voice = audio.play(midi, context.currentTime, stillHeld ? null : .16, .79);
  }

  function release(id, tap = false) {
    const entry = held.get(id);
    if (!entry) return;
    held.delete(id);
    entry.tap = tap;
    if (![...held.values()].some(other => other.key === entry.key)) entry.key.classList.remove("active");
    if (!entry.voice) return;
    if (pedal) sustained.add(entry.voice);
    else entry.voice.release();
  }

  function togglePedal() {
    pedal = !pedal;
    $("sustain").setAttribute("aria-pressed", String(pedal));
    if (!pedal) {
      sustained.forEach(voice => voice.release(undefined, .32));
      sustained.clear();
    }
  }

  function clickBeat() {
    if (!enabled()) return;
    const context = getContext();
    if (context.state !== "running") return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    osc.frequency.value = 1080;
    gain.gain.setValueAtTime(.08, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .04);
    osc.connect(gain).connect(context.destination);
    osc.start(now);
    osc.stop(now + .045);
  }

  function stopClick() {
    clearInterval(clickTimer);
    clickTimer = null;
    $("metronome").setAttribute("aria-pressed", "false");
  }

  function startClick() {
    const context = getContext();
    context.resume().catch(() => {});
    clickBeat();
    clickTimer = setInterval(clickBeat, 60000 / tempo.value);
    $("metronome").setAttribute("aria-pressed", "true");
  }

  piano.addEventListener("pointerdown", event => {
    const key = event.target.closest(".piano-key");
    if (!key || event.button !== 0) return;
    key.setPointerCapture(event.pointerId);
    press(event.pointerId, Number(key.dataset.midi));
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    piano.addEventListener(type, event => release(event.pointerId, type === "pointerup"));
  }
  piano.addEventListener("click", event => {
    const key = event.target.closest(".piano-key");
    if (event.detail !== 0 || !key) return;
    press("accessibility", Number(key.dataset.midi)).then(() => setTimeout(() => release("accessibility"), 280));
  });
  window.addEventListener("keydown", event => {
    const { target } = event;
    if (event.ctrlKey || event.metaKey || event.altKey || target.closest?.("input, select, textarea, [contenteditable]")) return;
    if (event.code === "BracketLeft" || event.code === "BracketRight") {
      event.preventDefault();
      if (event.repeat) return;
      keyboardBase = Math.max(36, Math.min(72, keyboardBase + (event.code === "BracketLeft" ? -12 : 12)));
      updateKeyboardLabels();
      bringIntoView(keyboardBase + 5);
      return;
    }
    const index = inputKeys.indexOf(event.code);
    if (index < 0 && (event.code !== "Space" || target.closest?.("button, a"))) return;
    event.preventDefault();
    if (event.repeat) return;
    if (index < 0) togglePedal();
    else if (keys.has(keyboardBase + index)) press(event.code, keyboardBase + index);
  });
  window.addEventListener("keyup", event => release(event.code, true));
  window.addEventListener("blur", () => held.forEach((_, id) => release(id)));
  $("sustain").addEventListener("click", togglePedal);
  $("label-toggle").addEventListener("click", event => {
    const hidden = piano.classList.toggle("hide-labels");
    event.currentTarget.setAttribute("aria-pressed", String(!hidden));
  });
  $("metronome").addEventListener("click", () => {
    if (clickTimer) stopClick();
    else if (enabled() && !follow) startClick();
  });
  $("listen-button").addEventListener("click", play);
  $("virtual-follow").addEventListener("click", () => {
    if (follow?.input === "virtual") { stopFollow(); return; }
    onMic();
    startFollow("virtual");
  });
  piece.addEventListener("change", () => {
    stop();
    tempo.value = repertoire[piece.value]?.tempo ?? 60;
    tempo.dispatchEvent(new Event("input"));
    refresh();
    if (follow) startFollow(follow.input);
  });
  part.addEventListener("change", () => {
    stop();
    refresh();
    if (follow) startFollow(follow.input);
  });
  tempo.addEventListener("input", () => {
    $("tempo-value").textContent = tempo.value;
    if (clickTimer) { stopClick(); startClick(); }
  });
  for (const [id, direction] of [["range-low", -1], ["range-high", 1]]) {
    $(id).addEventListener("click", () => scroller.scrollBy({ left: direction * piano.clientWidth * 7 / whiteCount }));
  }
  function updateRange() {
    const max = scroller.scrollWidth - scroller.clientWidth;
    $("range-low").disabled = scroller.scrollLeft < 1;
    $("range-high").disabled = scroller.scrollLeft >= max - 1;
    scroller.classList.toggle("scrollable", max > 1);
  }
  scroller.addEventListener("scroll", updateRange);
  $("audio-status").textContent = "Yamaha C5 · 实录采样";
  refresh();
  bringIntoView();
  updateRange();
  const resize = new ResizeObserver(() => {
    updateRange();
    if (!playback) draw(follow?.steps[follow.index]?.beat ?? 0);
  });
  resize.observe(canvas);
  resize.observe(scroller);
  return {
    stopFollow, hear,
    async cue(notes) {
      if (!enabled() || follow) return;
      const context = await audioReady();
      if (!context || !enabled() || follow) return;
      notes.forEach((note, i) => audio.play(midiFor(note), context.currentTime + i * .14, .3, .52));
    },
    lessonChanged() {
      if (piece.value !== "lesson") return;
      stop();
      refresh();
      if (follow) startFollow(follow.input);
    },
    startMicFollow() { stopClick(); audio.silence(); startFollow("mic"); },
    mute() { stop(); stopClick(); audio.silence(); sustained.clear(); if (follow) showExpected(); },
    previewLesson() {
      piece.value = "lesson";
      part.value = "both";
      piece.dispatchEvent(new Event("change"));
      document.querySelector(".studio").scrollIntoView({ block: "start" });
      play();
    }
  };
}

// Use the first strong minimum of the normalized difference to avoid octave errors.
function detectPitch(samples, rate) {
  const minLag = Math.floor(rate / 1100);
  const maxLag = Math.ceil(rate / 62);
  const windowSize = samples.length - maxLag;
  const curve = new Float32Array(maxLag + 1);
  let total = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < windowSize; i++) sum += (samples[i] - samples[i + lag]) ** 2;
    total += sum;
    curve[lag] = total ? sum * lag / total : 1;
    if (lag > minLag + 1 && curve[lag - 1] < .2 && curve[lag - 1] <= curve[lag] && curve[lag - 1] < curve[lag - 2]) {
      const [left, center, right] = [curve[lag - 2], curve[lag - 1], curve[lag]];
      return rate / (lag - 1 + (left - right) / (2 * (left + right - 2 * center)));
    }
  }
  return null;
}

function trackPianoPitch(context, analyser, onNote) {
  const buffer = new Float32Array(analyser.fftSize);
  const stride = Math.max(1, Math.round(context.sampleRate / 12000));
  const samples = new Float32Array(Math.floor(buffer.length / stride));
  const rate = context.sampleRate / stride;
  let lastMidi, candidate, previousRms = 0;
  const listenAfter = performance.now() + 180;
  return setInterval(() => {
    if (performance.now() < listenAfter) return;
    analyser.getFloatTimeDomainData(buffer);
    let power = 0;
    for (let i = 0; i < samples.length; i++) {
      let sum = 0;
      for (let j = 0; j < stride; j++) sum += buffer[i * stride + j];
      samples[i] = sum / stride;
      if (i >= samples.length / 2) power += samples[i] ** 2;
    }
    const rms = Math.sqrt(2 * power / samples.length);
    if (rms < .004 || (rms > previousRms * 1.65 && rms - previousRms > .003)) lastMidi = candidate = null;
    previousRms = rms;
    if (rms < .004) return;
    const hz = detectPitch(samples, rate);
    if (!hz) { candidate = null; return; }
    const pitch = 69 + 12 * Math.log2(hz / 440);
    const midi = Math.round(pitch);
    if (Math.abs(pitch - midi) > .43 || midi < 36 || midi > 84) { candidate = null; return; }
    if (candidate === midi && lastMidi !== midi && onNote(midi) !== false) lastMidi = midi;
    candidate = midi;
  }, 35);
}
