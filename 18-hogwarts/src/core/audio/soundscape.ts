type MagicCue = "lumos" | "dim" | "rune" | "discovery" | "reward";

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambienceStarted = false;
let soundEnabled = true;

function getAudioContext() {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  if (!context || context.state === "closed") {
    context = new window.AudioContext();
    masterGain = context.createGain();
    masterGain.gain.value = soundEnabled ? 0.3 : 0;
    masterGain.connect(context.destination);
    ambienceStarted = false;
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

export function startSoundscape() {
  const audio = getAudioContext();
  if (!audio || !masterGain || ambienceStarted) return;

  const sampleCount = audio.sampleRate * 3;
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.985 + white * 0.015;
    samples[index] = previous * 0.7;
  }

  const wind = audio.createBufferSource();
  const windFilter = audio.createBiquadFilter();
  const windGain = audio.createGain();
  wind.buffer = buffer;
  wind.loop = true;
  windFilter.type = "lowpass";
  windFilter.frequency.value = 720;
  windGain.gain.value = 0.18;
  wind.connect(windFilter).connect(windGain).connect(masterGain);
  wind.start();

  const drone = audio.createOscillator();
  const droneGain = audio.createGain();
  drone.type = "sine";
  drone.frequency.value = 72;
  droneGain.gain.value = 0.045;
  drone.connect(droneGain).connect(masterGain);
  drone.start();
  ambienceStarted = true;
}

export function playMagicCue(cue: MagicCue) {
  const audio = getAudioContext();
  if (!audio || !masterGain) return;
  const output = masterGain;
  startSoundscape();

  const notes: Record<MagicCue, number[]> = {
    lumos: [523.25, 783.99],
    dim: [392],
    rune: [659.25, 987.77],
    discovery: [440, 587.33],
    reward: [523.25, 659.25, 783.99],
  };
  const now = audio.currentTime;

  notes[cue].forEach((frequency, index) => {
    const startAt = now + index * 0.085;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = cue === "dim" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(cue === "reward" ? 0.14 : 0.09, startAt + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.5);
    oscillator.connect(envelope).connect(output);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.52);
  });
}

export function toggleSoundscape() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    startSoundscape();
  } else if (context && masterGain) {
    masterGain.gain.setTargetAtTime(0, context.currentTime, 0.08);
  }
  return soundEnabled;
}

export function isSoundscapeEnabled() {
  return soundEnabled;
}
