// Synthesized retro TRON sounds using Web Audio API - no external files needed
class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientRunning = false;

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private get master(): GainNode {
    this.ensureContext();
    return this.masterGain!;
  }

  // Laser shot - quick descending sawtooth sweep + noise click
  shoot() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    // Sawtooth laser sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.1);

    // High-freq noise click
    const bufSize = ctx.sampleRate * 0.025;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.15, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    noise.connect(hp).connect(ng).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.04);
  }

  // Bullet hit - short metallic ping
  hit() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.05);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Enemy destroyed - heavy explosion with rumble
  explode() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    // Low rumble
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(90, t);
    osc1.frequency.exponentialRampToValueAtTime(15, t + 1.0);
    g1.gain.setValueAtTime(0.25, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc1.connect(g1).connect(this.master);
    osc1.start(t);
    osc1.stop(t + 1.0);

    // Impact crack
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(500, t);
    osc2.frequency.exponentialRampToValueAtTime(25, t + 0.25);
    g2.gain.setValueAtTime(0.2, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc2.connect(g2).connect(this.master);
    osc2.start(t);
    osc2.stop(t + 0.25);

    // Noise burst with filter sweep
    const bufSize = ctx.sampleRate * 0.6;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.35, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4000, t);
    lp.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    noise.connect(lp).connect(ng).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.6);

    // Sub-bass thud
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(60, t);
    osc3.frequency.exponentialRampToValueAtTime(20, t + 0.4);
    g3.gain.setValueAtTime(0.4, t);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc3.connect(g3).connect(this.master);
    osc3.start(t);
    osc3.stop(t + 0.4);
  }

  // Player takes damage - alarm beeps
  damage() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(350, t);
    gain.gain.setValueAtTime(0, t);
    // Three staccato beeps
    for (let i = 0; i < 3; i++) {
      gain.gain.setValueAtTime(0.12, t + i * 0.12);
      gain.gain.setValueAtTime(0.0, t + i * 0.12 + 0.06);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.5);

    // Low warning tone
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 120;
    g2.gain.setValueAtTime(0.15, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.connect(g2).connect(this.master);
    osc2.start(t);
    osc2.stop(t + 0.4);
  }

  // Start ambient background hum
  startAmbient() {
    if (this.ambientRunning) return;
    const ctx = this.ensureContext();

    // Deep drone
    this.ambientOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 55;
    gain.gain.value = 0.04;
    this.ambientOsc.connect(gain).connect(this.master);
    this.ambientOsc.start();

    // Higher harmonic
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = 110;
    g2.gain.value = 0.02;
    osc2.connect(g2).connect(this.master);
    osc2.start();

    this.ambientRunning = true;
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    this.ambientRunning = false;
  }
}

export const sound = SoundManager.getInstance();
