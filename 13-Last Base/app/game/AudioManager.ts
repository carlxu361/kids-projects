type SoundName = 'shoot' | 'arc' | 'hit' | 'kill' | 'tower' | 'ice' | 'missile' | 'pickup' | 'build' | 'upgrade' | 'alarm' | 'boss' | 'hurt' | 'base';

export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastPlayed = new Map<SoundName, number>();
  private volume = 68;

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(100, value));
    if (this.master) this.master.gain.value = .18 * this.volume / 100;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    this.context = new AudioCtor();
    this.master = this.context.createGain();
    this.master.gain.value = .18 * this.volume / 100;
    this.master.connect(this.context.destination);
  }

  play(name: SoundName) {
    if (!this.context || !this.master) return;
    const nowMs = performance.now();
    const minimumGap = name === 'shoot' ? 55 : name === 'hit' ? 40 : 0;
    if (nowMs - (this.lastPlayed.get(name) || 0) < minimumGap) return;
    this.lastPlayed.set(name, nowMs);

    const presets: Record<SoundName, [number, number, number, OscillatorType, number]> = {
      shoot: [190, 95, .045, 'square', .16],
      arc: [920, 185, .11, 'sawtooth', .11],
      hit: [110, 70, .035, 'sine', .08],
      kill: [100, 42, .11, 'sawtooth', .13],
      tower: [260, 120, .055, 'square', .1],
      ice: [620, 280, .13, 'sine', .12],
      missile: [86, 34, .24, 'sawtooth', .22],
      pickup: [470, 780, .12, 'sine', .15],
      build: [140, 360, .2, 'square', .13],
      upgrade: [330, 880, .35, 'sine', .17],
      alarm: [430, 330, .3, 'square', .12],
      boss: [75, 34, .75, 'sawtooth', .25],
      hurt: [155, 80, .16, 'sawtooth', .16],
      base: [95, 55, .22, 'square', .16],
    };
    const [from, to, duration, type, volume] = presets[name];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), this.context.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}
