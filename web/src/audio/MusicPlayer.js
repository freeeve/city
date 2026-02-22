/**
 * Procedural chiptune music for the city builder game.
 * Uses Web Audio API — no external files needed.
 */

// Note frequencies (octave 3-5)
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

// Melody pattern (cheerful city-building vibe) — each entry is [note, duration in 16ths]
const MELODY = [
  // Phrase 1
  ['E4',2],['G4',2],['C5',2],['B4',2],['A4',2],['G4',2],['A4',2],['G4',2],
  // Phrase 2
  ['F4',2],['A4',2],['C5',2],['B4',2],['G4',4],['E4',2],[null,2],
  // Phrase 3
  ['E4',2],['G4',2],['A4',2],['C5',2],['D5',2],['C5',2],['B4',2],['A4',2],
  // Phrase 4
  ['G4',2],['E4',2],['F4',2],['E4',2],['C4',4],[null,4],
];

// Bass pattern (root notes following chord progression: C - Am - F - G)
const BASS = [
  ['C3',4],['C3',4],['C3',4],['C3',4],  // C
  ['A3',4],['A3',4],['A3',4],['A3',4],  // Am
  ['F3',4],['F3',4],['F3',4],['F3',4],  // F
  ['G3',4],['G3',4],['G3',4],['G3',4],  // G
  ['C3',4],['C3',4],['C3',4],['C3',4],  // C
  ['A3',4],['A3',4],['A3',4],['A3',4],  // Am
  ['F3',4],['F3',4],['F3',4],['F3',4],  // F
  ['G3',4],['G3',2],['B3',2],['G3',4],['G3',4], // G
];

// Chord pads (triads)
const CHORDS = [
  [['C4','E4','G4'], 16],  // C
  [['A3','C4','E4'], 16],  // Am
  [['F3','A3','C4'], 16],  // F
  [['G3','B3','D4'], 16],  // G
  [['C4','E4','G4'], 16],  // C
  [['A3','C4','E4'], 16],  // Am
  [['F3','A3','C4'], 16],  // F
  [['G3','B3','D4'], 16],  // G
];

export class MusicPlayer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.playing = false;
    this.muted = false;
    this.volume = 0.3;
    this.timer = null;
  }

  /** Must be called from a user gesture (click) to unlock AudioContext */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
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

    const bpm = 115;
    const sixteenth = 60 / bpm / 4; // duration of one 16th note in seconds
    const now = this.ctx.currentTime + 0.05; // small lookahead

    // Schedule melody
    let t = now;
    for (const [note, dur] of MELODY) {
      if (note) {
        this._playNote(note, 'square', 0.08, t, sixteenth * dur * 0.8);
      }
      t += sixteenth * dur;
    }
    const loopDuration = t - now;

    // Schedule bass
    t = now;
    for (const [note, dur] of BASS) {
      if (note) {
        this._playNote(note, 'triangle', 0.12, t, sixteenth * dur * 0.9);
      }
      t += sixteenth * dur;
    }

    // Schedule chord pads
    t = now;
    for (const [notes, dur] of CHORDS) {
      for (const note of notes) {
        this._playNote(note, 'sine', 0.04, t, sixteenth * dur * 0.95);
      }
      t += sixteenth * dur;
    }

    // Schedule hi-hat-like percussion on every other 16th
    const totalSixteenths = Math.floor(loopDuration / sixteenth);
    for (let i = 0; i < totalSixteenths; i++) {
      if (i % 2 === 0) {
        this._playHiHat(now + i * sixteenth, 0.03);
      }
      // Kick on beats 1 and 3 (every 8 sixteenths)
      if (i % 8 === 0) {
        this._playKick(now + i * sixteenth, 0.1);
      }
    }

    // Schedule next loop
    this.timer = setTimeout(() => this._scheduleLoop(), (loopDuration - 0.1) * 1000);
  }

  _playNote(noteName, waveType, volume, startTime, duration) {
    const freq = NOTES[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.04);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  _playHiHat(startTime, volume) {
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(startTime);
  }

  _playKick(startTime, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.12);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }
}
