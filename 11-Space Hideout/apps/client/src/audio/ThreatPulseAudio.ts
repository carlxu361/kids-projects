export class ThreatPulseAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private enabled = false;
  private nextPulseAt = 0;

  enable(): void {
    if (!this.context) this.context = new AudioContext();
    if (!this.master || !this.droneGain) this.createChaseBed();
    this.enabled = true;
    void this.context.resume();
  }

  update(danger: number): void {
    if (!this.enabled || !this.context || !this.droneGain) return;

    const now = this.context.currentTime;
    const normalized = Math.max(0, Math.min(1, danger));
    this.droneGain.gain.setTargetAtTime(0.003 + normalized * 0.028, now, 0.08);
    if (normalized < 0.18) return;
    if (now < this.nextPulseAt) return;
    const interval = 1.15 - normalized * 0.78;
    this.nextPulseAt = now + interval;
    this.playPulse(now, normalized);
  }

  private createChaseBed(): void {
    if (!this.context) return;
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
    this.droneGain = this.context.createGain();
    this.droneGain.gain.value = 0.003;
    this.droneGain.connect(this.master);

    const lowDrone = this.context.createOscillator();
    lowDrone.type = "sine";
    lowDrone.frequency.value = 42;
    lowDrone.connect(this.droneGain);
    lowDrone.start();

    const roughDrone = this.context.createOscillator();
    roughDrone.type = "triangle";
    roughDrone.frequency.value = 85;
    roughDrone.detune.value = -9;
    roughDrone.connect(this.droneGain);
    roughDrone.start();
  }

  private playPulse(startAt: number, danger: number): void {
    if (!this.context) return;
    this.playBurst(
      startAt,
      58 + danger * 76,
      0.14,
      0.018 + danger * 0.042,
      danger > 0.7 ? "sawtooth" : "triangle"
    );
    if (danger > 0.42)
      this.playBurst(startAt + 0.055, 210 + danger * 120, 0.06, 0.008 + danger * 0.018, "square");
    if (danger > 0.76)
      this.playBurst(startAt + 0.11, 290 + danger * 150, 0.045, 0.01 + danger * 0.02, "sawtooth");
  }

  private playBurst(
    startAt: number,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType
  ): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.01);
  }
}
