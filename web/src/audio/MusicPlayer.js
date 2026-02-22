/**
 * Procedural chiptune music — Pigstep-inspired dark, bass-heavy groove.
 * Uses Web Audio API — no external files needed.
 */

// Note frequencies
const N = {
  C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, G2: 98.00, Ab2: 103.83, Bb2: 116.54,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, Ab3: 207.65, Bb3: 233.08,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, Ab4: 415.30, Bb4: 466.16,
  C5: 523.25, D5: 587.33, Eb5: 622.25, F5: 698.46, G5: 783.99,
};

// Pigstep-inspired: C minor, syncopated, bass-driven
// Each entry: [note, duration in 16ths]  (null = rest)

// Dark, catchy melody — syncopated with rests
const MELODY = [
  // Bar 1 — punchy opening riff
  ['Eb4',2],[null,1],['G4',1],['Ab4',2],['G4',1],[null,1],['Eb4',2],[null,2],['C4',2],['D4',2],
  // Bar 2 — tension
  ['Eb4',2],[null,1],['G4',1],['Bb4',3],[null,1],['Ab4',2],['G4',2],[null,2],
  // Bar 3 — resolve down
  ['F4',2],[null,1],['Eb4',1],['D4',2],['C4',2],['Eb4',2],[null,2],['D4',2],['C4',2],
  // Bar 4 — dramatic pause + hit
  [null,4],['G4',2],['Ab4',1],['G4',1],['Eb4',2],['D4',2],['C4',2],[null,2],
];

// Heavy bass — driving rhythm, Pigstep-style syncopated
const BASS = [
  // Bar 1
  ['C2',2],[null,1],['C2',1],['C3',2],[null,2],['Eb2',2],['Eb2',1],[null,1],['G2',2],[null,2],
  // Bar 2
  ['Ab2',2],[null,1],['Ab2',1],['Ab2',2],[null,2],['G2',2],[null,1],['G2',1],['G2',2],[null,2],
  // Bar 3
  ['F2',2],[null,1],['F2',1],['F2',2],[null,2],['Eb2',2],['Eb2',1],[null,1],['D2',2],[null,2],
  // Bar 4
  ['C2',2],[null,1],['C2',1],['C2',2],[null,2],['G2',3],[null,1],['G2',2],[null,2],
];

// Chord stabs — short, aggressive, on offbeats
const CHORDS = [
  // Bar 1
  [null, 3], [['C4','Eb4','G4'], 2], [null, 3], [['C4','Eb4','G4'], 2], [null, 2], [['Eb4','G4','Bb4'], 2], [null, 2],
  // Bar 2
  [null, 3], [['Ab3','C4','Eb4'], 2], [null, 3], [['Ab3','C4','Eb4'], 2], [null, 2], [['G3','Bb3','D4'], 2], [null, 2],
  // Bar 3
  [null, 3], [['F3','Ab3','C4'], 2], [null, 3], [['Eb3','G3','Bb3'], 2], [null, 2], [['D3','F3','Ab3'], 2], [null, 2],
  // Bar 4
  [null, 3], [['C3','Eb3','G3'], 2], [null, 3], [['C3','Eb3','G3'], 4], [null, 2], [['G3','Bb3','D4'], 2],
];

// Drum pattern — each entry: [type, position in 16ths]
// Types: 'k' = kick, 's' = snare, 'h' = hihat, 'oh' = open hihat
const DRUMS_PER_BAR = [
  ['k',0],['h',0],['h',2],['k',3],['h',4],['s',4],['h',6],['k',7],
  ['h',8],['k',8],['h',10],['s',12],['h',12],['h',14],['oh',15],
];

export class MusicPlayer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.playing = false;
    this.muted = false;
    this.volume = 0.35;
    this.timer = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    // Compressor to glue the mix together
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.ratio.value = 4;
    this.compressor.connect(this.ctx.destination);
    this.masterGain.connect(this.compressor);
  }

  start() {
    this.init();
    if (this.playing) return;
    this.playing = true;
    this._scheduleLoop();
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05
      );
    }
    return this.muted;
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  _scheduleLoop() {
    if (!this.playing) return;

    const bpm = 110;
    const sixteenth = 60 / bpm / 4;
    const now = this.ctx.currentTime + 0.05;

    // Schedule melody (pulse wave approximated with square + slight detune)
    let t = now;
    for (const [note, dur] of MELODY) {
      if (note) {
        this._playLead(note, t, sixteenth * dur * 0.75);
      }
      t += sixteenth * dur;
    }
    const loopDuration = t - now;

    // Schedule bass (distorted triangle — heavy)
    t = now;
    for (const [note, dur] of BASS) {
      if (note) {
        this._playBass(note, t, sixteenth * dur * 0.85);
      }
      t += sixteenth * dur;
    }

    // Schedule chord stabs
    t = now;
    for (const entry of CHORDS) {
      const [notes, dur] = entry;
      if (notes) {
        for (const note of notes) {
          this._playStab(note, t, sixteenth * dur * 0.6);
        }
      }
      t += sixteenth * dur;
    }

    // Schedule drums (4 bars)
    for (let bar = 0; bar < 4; bar++) {
      const barStart = now + bar * 16 * sixteenth;
      for (const [type, pos] of DRUMS_PER_BAR) {
        const time = barStart + pos * sixteenth;
        if (type === 'k') this._playKick(time);
        else if (type === 's') this._playSnare(time);
        else if (type === 'h') this._playHiHat(time, 0.04);
        else if (type === 'oh') this._playHiHat(time, 0.07, true);
      }
    }

    this.timer = setTimeout(() => this._scheduleLoop(), (loopDuration - 0.1) * 1000);
  }

  // Lead — detuned square waves for that chiptune grit
  _playLead(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * 1.005; // slight detune for thickness

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.07, startTime + 0.01);
    gain.gain.setValueAtTime(0.06, startTime + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.01);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.01);
  }

  // Bass — heavy triangle wave with waveshaper distortion
  _playBass(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const shaper = this.ctx.createWaveShaper();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Soft clip distortion
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2);
    }
    shaper.curve = curve;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.008);
    gain.gain.setValueAtTime(0.15, startTime + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(shaper);
    shaper.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // Chord stab — short, aggressive square wave chords
  _playStab(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.04, startTime + 0.005);
    gain.gain.linearRampToValueAtTime(0.02, startTime + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // Kick — punchy sine sweep
  _playKick(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, startTime);
    osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.1);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }

  // Snare — noise burst + body tone
  _playSnare(startTime) {
    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.12;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(startTime);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, startTime);
    osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.05);
    oscGain.gain.setValueAtTime(0.1, startTime);
    oscGain.gain.linearRampToValueAtTime(0, startTime + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }

  // Hi-hat — filtered noise
  _playHiHat(startTime, volume = 0.04, open = false) {
    const dur = open ? 0.1 : 0.04;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const decay = open ? 0.4 : 0.15;
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * decay));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 9000;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(startTime);
  }
}
