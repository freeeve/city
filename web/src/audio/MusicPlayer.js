/**
 * Hybrid chiptune: cheerful city-builder meets Pigstep groove.
 * Part A (8 bars): Bright Bb major — upbeat, bouncy city vibes
 * Part B (8 bars): Dark G minor — Pigstep-inspired syncopated groove
 * Both share the same key signature (Bb major / G minor are relatives)
 * so transitions are seamless. 113 BPM throughout.
 * Uses Web Audio API — no external files needed.
 */

const N = {
  G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81, Db3: 138.59,
  D3: 146.83, Eb3: 155.56, F3: 174.61, 'F#3': 185.00, G3: 196.00,
  A3: 220.00, Bb3: 233.08, C4: 261.63, Db4: 277.18, D4: 293.66,
  Eb4: 311.13, F4: 349.23, 'F#4': 369.99, G4: 392.00, A4: 440.00,
  Bb4: 466.16, C5: 523.25, D5: 587.33, Eb5: 622.25, F5: 698.46,
  G5: 783.99,
};

// ═══════════════════════════════════════════════════
// PART A — BRIGHT CITY BUILDER (Bb major feel, 8 bars)
// Cheerful, bouncy, upbeat — building your city!
// ═══════════════════════════════════════════════════

const MELODY_A = [
  // Bar 1: bright opening — cheerful ascending riff
  ['D4',2],['F4',2],['Bb4',2],['A4',2],['G4',2],['F4',2],['G4',2],['F4',2],
  // Bar 2: playful answer
  ['Eb4',2],['G4',2],['Bb4',2],['A4',2],['F4',4],['D4',2],[null,2],
  // Bar 3: ascending energy
  ['D4',2],['F4',2],['G4',2],['Bb4',2],['C5',2],['Bb4',2],['A4',2],['G4',2],
  // Bar 4: resolve with a little bounce
  ['F4',2],['D4',2],['Eb4',2],['D4',2],['Bb3',4],[null,4],
  // Bar 5: repeat with variation — higher
  ['F4',2],['G4',2],['Bb4',2],['C5',2],['D5',2],['C5',2],['Bb4',2],['A4',2],
  // Bar 6: call and response
  ['G4',2],[null,2],['Bb4',2],['A4',1],['G4',1],['F4',2],['G4',2],[null,2],['F4',2],
  // Bar 7: build up to transition
  ['Bb4',2],['C5',2],['D5',2],[null,2],['C5',2],['Bb4',2],['A4',2],['G4',2],
  // Bar 8: tension — leading into the dark section
  ['A4',2],['Bb4',2],['A4',2],['G4',2],['F#4',2],['G4',2],[null,4],
];

const BASS_A = [
  // Bar 1: Bb — bouncy root-fifth
  ['Bb2',2],[null,1],['Bb2',1],['F3',2],[null,2],['Bb2',2],['F3',1],[null,1],['Bb2',2],[null,2],
  // Bar 2: Eb — walking
  ['Eb3',2],[null,1],['Eb3',1],['Bb2',2],[null,2],['Eb3',2],['G3',1],[null,1],['Eb3',2],[null,2],
  // Bar 3: F — climbing
  ['F3',2],[null,1],['F3',1],['C3',2],[null,2],['F3',2],['A3',1],[null,1],['F3',2],[null,2],
  // Bar 4: Bb resolve
  ['Bb2',2],[null,1],['Bb2',1],['D3',2],['F3',2],['Bb2',2],[null,2],[null,2],[null,2],
  // Bar 5: Bb — variation
  ['Bb2',2],['Bb2',1],[null,1],['D3',2],['F3',2],[null,2],['Bb2',1],[null,1],['D3',2],['F3',2],
  // Bar 6: Eb
  ['Eb3',2],[null,1],['G3',1],['Eb3',2],[null,2],['Bb2',2],['Eb3',1],[null,1],['G3',2],[null,2],
  // Bar 7: F — building
  ['F3',2],['F3',1],[null,1],['A3',2],['F3',2],[null,1],['C4',1],['A3',2],['F3',2],[null,2],
  // Bar 8: transition — chromatic walk down to G minor
  ['Bb2',2],['A2',1],['Bb2',1],['A2',2],['G2',2],['G2',2],['G3',3],[null,1],[null,2],
];

const CHORDS_A = [
  // Bar 1: Bb
  [null,3],[['Bb3','D4','F4'],2],[null,3],[null,3],[['Bb3','D4','F4'],2],[null,3],
  // Bar 2: Eb
  [null,3],[['Eb4','G4','Bb4'],2],[null,3],[null,3],[['Eb4','G4','Bb4'],2],[null,3],
  // Bar 3: F
  [null,3],[['F3','A3','C4'],2],[null,3],[null,3],[['F4','A4','C5'],2],[null,3],
  // Bar 4: Bb
  [['Bb3','D4','F4'],2],[null,2],[['Bb3','D4','F4'],2],[null,2],[null,4],[null,4],
  // Bar 5: Bb — brighter stabs
  [null,2],[['Bb3','D4','F4'],1],[null,1],[['Bb3','D4','F4'],2],[null,2],[null,2],[['Bb4','D5','F5'],2],[null,2],[null,2],
  // Bar 6: Eb
  [null,2],[['Eb4','G4','Bb4'],1],[null,1],[['Eb4','G4','Bb4'],2],[null,2],[null,4],[null,4],
  // Bar 7: F
  [null,2],[['F3','A3','C4'],1],[null,1],[['F4','A4','C5'],2],[null,2],[null,4],[null,4],
  // Bar 8: Gm transition
  [['G3','Bb3','D4'],4],[null,4],[['G3','Bb3','D4'],4],[null,4],
];

// ═══════════════════════════════════════════════════
// PART B — DARK PIGSTEP (G minor feel, 8 bars)
// Syncopated, bass-driven, mysterious groove
// ═══════════════════════════════════════════════════

const MELODY_B = [
  // Bar 1: iconic Pigstep opening
  [null,4],['D5',1],['Eb5',1],['D5',2],['Bb4',2],[null,2],['A4',2],['G4',2],
  // Bar 2: answer phrase
  [null,2],['Bb4',2],['G4',1],[null,1],['F4',2],[null,2],['D4',2],['Eb4',2],[null,2],
  // Bar 3: climb with chromatic color
  ['F4',2],[null,1],['G4',1],['A4',2],['Bb4',2],['C5',2],[null,1],['Bb4',1],['A4',2],[null,2],
  // Bar 4: resolve with the characteristic drop
  ['G4',3],[null,1],[null,4],['D5',1],['C5',1],['Bb4',2],['A4',2],[null,2],
  // Bar 5: second section — higher energy
  ['Bb4',2],['D5',2],[null,2],['C5',1],['Bb4',1],['G4',2],['A4',2],[null,2],['Bb4',2],
  // Bar 6: chromatic passing tones
  ['A4',1],['Bb4',1],['C5',2],['Bb4',2],[null,2],['A4',1],['G4',1],['F#4',2],['G4',2],[null,2],
  // Bar 7: rising tension
  ['Eb5',2],[null,1],['D5',1],['C5',2],['Bb4',2],['A4',2],['C5',2],[null,2],[null,2],
  // Bar 8: chromatic run leading back to bright section
  ['D5',2],['C5',1],['Bb4',1],['A4',2],['Bb4',2],['C5',2],['D5',2],[null,4],
];

const BASS_B = [
  // Bar 1: Gm — the signature bounce
  ['G2',2],[null,1],['G2',1],['G3',2],[null,2],['G2',1],['G2',1],['G3',2],['D3',2],[null,2],
  // Bar 2: Eb — walking up
  ['Eb3',2],[null,1],['Eb3',1],['Eb3',2],[null,2],['F3',1],['F3',1],['G3',2],['Eb3',2],[null,2],
  // Bar 3: F — push
  ['F3',2],[null,1],['F3',1],['F3',2],['A3',2],['G3',1],['F3',1],['D3',2],[null,2],[null,2],
  // Bar 4: Gm — chromatic slide
  ['G2',2],[null,1],['G2',1],['Bb2',2],['A2',2],['G2',2],['G3',2],[null,2],[null,2],
  // Bar 5: deeper bounce variation
  ['G2',2],['G2',1],[null,1],['D3',2],['G3',2],[null,2],['G2',1],[null,1],['Bb2',2],['D3',2],
  // Bar 6: syncopated climb
  ['Eb3',2],[null,1],['G3',1],['Eb3',2],[null,2],['Bb2',2],['Eb3',1],[null,1],['G3',2],[null,2],
  // Bar 7: tension builder
  ['F3',2],['F3',1],[null,1],['A3',2],['F3',2],[null,1],['C4',1],['A3',2],['F3',2],[null,2],
  // Bar 8: slide up to Bb for transition back
  ['G3',2],['F#3',1],['F3',1],['Eb3',2],['F3',2],['A3',2],['Bb3',3],[null,1],[null,2],
];

const CHORDS_B = [
  // Bar 1: Gm
  [null,3],[['G3','Bb3','D4'],2],[null,3],[null,3],[['G3','Bb3','D4'],2],[null,3],
  // Bar 2: Eb
  [null,3],[['Eb3','G3','Bb3'],2],[null,3],[null,3],[['Eb3','G3','Bb3'],2],[null,3],
  // Bar 3: F
  [null,3],[['F3','A3','C4'],2],[null,3],[null,3],[['F3','A3','C4'],2],[null,3],
  // Bar 4: Gm
  [['G3','Bb3','D4'],2],[null,2],[['G3','Bb3','D4'],2],[null,2],[null,4],[null,4],
  // Bar 5: Gm — aggressive stabs
  [null,2],[['G3','Bb3','D4'],1],[null,1],[['G3','Bb3','D4'],2],[null,2],[null,2],[['G4','Bb4','D5'],2],[null,2],[null,2],
  // Bar 6: Eb
  [null,2],[['Eb3','G3','Bb3'],1],[null,1],[['Eb3','G3','Bb3'],2],[null,2],[null,2],[['Eb4','G4','Bb4'],2],[null,2],[null,2],
  // Bar 7: F
  [null,2],[['F3','A3','C4'],1],[null,1],[['F3','A3','C4'],2],[null,2],[null,2],[['F4','A4','C5'],2],[null,2],[null,2],
  // Bar 8: Bb resolve — smooth transition
  [['Bb3','D4','F4'],4],[null,4],[['Bb3','D4','F4'],4],[null,4],
];

// ═══════════════════════════════════════════════════
// DRUMS — lighter in Part A, heavier in Part B
// ═══════════════════════════════════════════════════

// Part A drums: lighter, more hi-hat driven, bouncy city feel
const DRUMS_LIGHT_A = [
  ['k',0],['h',0],['h',2],['h',4],['s',4],['h',6],
  ['h',8],['k',8],['h',10],['s',12],['h',12],['h',14],
];
const DRUMS_LIGHT_B = [
  ['k',0],['h',0],['h',2],['k',4],['s',4],['h',6],
  ['h',8],['k',10],['h',10],['s',12],['h',12],['oh',14],
];

// Part B drums: heavy Pigstep trap bounce
const DRUMS_HEAVY_A = [
  ['k',0],['h',0],['h',2],['k',3],['s',4],['h',4],['h',6],
  ['k',7],['h',8],['k',10],['h',10],['s',12],['h',12],['k',13],['h',14],['oh',15],
];
const DRUMS_HEAVY_B = [
  ['k',0],['h',0],['k',1],['h',2],['k',3],['s',4],['h',4],['oh',6],
  ['k',8],['h',8],['h',10],['k',11],['s',12],['h',12],['k',14],['oh',15],
];
const DRUMS_FILL = [
  ['k',0],['s',1],['h',2],['s',3],['k',4],['s',5],['s',6],['s',7],
  ['k',8],['s',9],['s',10],['s',11],['k',12],['s',13],['s',14],['k',15],
];

// Part A: 8 bars light drums
const DRUMS_PART_A = [
  DRUMS_LIGHT_A, DRUMS_LIGHT_A, DRUMS_LIGHT_B, DRUMS_LIGHT_A,
  DRUMS_LIGHT_A, DRUMS_LIGHT_B, DRUMS_LIGHT_A, DRUMS_FILL,
];
// Part B: 8 bars heavy drums
const DRUMS_PART_B = [
  DRUMS_HEAVY_A, DRUMS_HEAVY_A, DRUMS_HEAVY_B, DRUMS_HEAVY_A,
  DRUMS_HEAVY_A, DRUMS_HEAVY_B, DRUMS_HEAVY_A, DRUMS_FILL,
];

// ═══════════════════════════════════════════════════
// ARPEGGIOS — bright in A, dark in B
// ═══════════════════════════════════════════════════

const ARP_A = ['Bb4','D5','F5','D5','Bb4','F4','A4','F4']; // Bb major arp
const ARP_B = ['G4','Bb4','D5','Bb4','G4','D4','F4','D4']; // G minor arp

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

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 5;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.1;
    this.compressor.connect(this.ctx.destination);
    this.masterGain.connect(this.compressor);

    this._noiseBuffer = this._createNoiseBuffer(0.15);
  }

  _createNoiseBuffer(seconds) {
    const size = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  start() {
    this.init();
    if (this.playing) return;
    this.playing = true;
    this._scheduleLoop();
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  _scheduleSection(melody, bass, chords, drums, arpNotes, now, sixteenth, bright) {
    // Bass
    let t = now;
    for (const [note, dur] of bass) {
      if (note) this._playBass(note, t, sixteenth * dur * 0.8, bright);
      t += sixteenth * dur;
    }
    const sectionDuration = t - now;

    // Melody
    t = now;
    for (const [note, dur] of melody) {
      if (note) this._playLead(note, t, sixteenth * dur * 0.7, bright);
      t += sixteenth * dur;
    }

    // Chords
    t = now;
    for (const entry of chords) {
      const [notes, dur] = entry;
      if (notes) {
        for (const note of notes) this._playStab(note, t, sixteenth * dur * 0.5);
      }
      t += sixteenth * dur;
    }

    // Drums (8 bars)
    for (let bar = 0; bar < 8; bar++) {
      const barStart = now + bar * 16 * sixteenth;
      for (const [type, pos] of drums[bar]) {
        const time = barStart + pos * sixteenth;
        if (type === 'k') this._playKick(time, bright);
        else if (type === 's') this._playSnare(time, bright);
        else if (type === 'h') this._playHiHat(time, false);
        else if (type === 'oh') this._playHiHat(time, true);
      }
    }

    // Arpeggio texture
    const totalSteps = Math.floor(sectionDuration / (sixteenth * 2));
    for (let i = 0; i < totalSteps; i++) {
      const note = arpNotes[i % arpNotes.length];
      this._playArp(note, now + i * sixteenth * 2, sixteenth * 1.5, bright);
    }

    return sectionDuration;
  }

  _scheduleLoop() {
    if (!this.playing) return;

    const bpm = 113;
    const sixteenth = 60 / bpm / 4;
    const now = this.ctx.currentTime + 0.08;

    // ── PART A: Bright city builder ──
    const durA = this._scheduleSection(
      MELODY_A, BASS_A, CHORDS_A, DRUMS_PART_A, ARP_A,
      now, sixteenth, true
    );

    // ── PART B: Dark Pigstep groove ──
    const durB = this._scheduleSection(
      MELODY_B, BASS_B, CHORDS_B, DRUMS_PART_B, ARP_B,
      now + durA, sixteenth, false
    );

    const totalDuration = durA + durB;
    this.timer = setTimeout(() => this._scheduleLoop(), (totalDuration - 0.2) * 1000);
  }

  // ═══════════════════════════════════════════════════
  // INSTRUMENTS — adapt tone based on bright/dark mode
  // ═══════════════════════════════════════════════════

  // Lead — brighter square in Part A, grittier detuned in Part B
  _playLead(noteName, startTime, duration, bright) {
    const freq = N[noteName];
    if (!freq) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc1.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * (bright ? 1.002 : 1.005);

    filter.type = 'lowpass';
    filter.frequency.value = bright ? freq * 6 : freq * 3.5;
    filter.Q.value = bright ? 0.5 : 1.2;

    const vol = bright ? 0.055 : 0.065;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.008);
    gain.gain.setValueAtTime(vol * 0.85, startTime + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.02);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.02);
  }

  // Bass — clean bounce in Part A, distorted thump in Part B
  _playBass(noteName, startTime, duration, bright) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 0.5;

    const vol = bright ? 0.14 : 0.2;

    if (bright) {
      // Clean, rounder bass for Part A
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
      gain.gain.setValueAtTime(vol * 0.8, startTime + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      const merge = this.ctx.createGain();
      merge.gain.value = 1;
      osc.connect(merge);
      osc2.connect(merge);
      merge.connect(gain);
      gain.connect(this.masterGain);
    } else {
      // Distorted, punchy bass for Part B
      const shaper = this.ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 128) - 1;
        curve[i] = Math.tanh(x * 2.5);
      }
      shaper.curve = curve;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.006);
      gain.gain.setValueAtTime(vol * 0.8, startTime + 0.03);
      gain.gain.setValueAtTime(vol * 0.6, startTime + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      const merge = this.ctx.createGain();
      merge.gain.value = 1;
      osc.connect(merge);
      osc2.connect(merge);
      merge.connect(shaper);
      shaper.connect(gain);
      gain.connect(this.masterGain);
    }

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.02);
  }

  // Chord stab
  _playStab(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.035, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // Arp — sine in Part A (sparkly), quieter in Part B (atmospheric)
  _playArp(noteName, startTime, duration, bright) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = bright ? 'triangle' : 'sine';
    osc.frequency.value = freq;

    const vol = bright ? 0.022 : 0.012;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // Kick — softer in Part A, deep thump in Part B
  _playKick(startTime, bright) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(bright ? 140 : 160, startTime);
    osc.frequency.exponentialRampToValueAtTime(bright ? 40 : 30, startTime + (bright ? 0.06 : 0.08));

    const vol = bright ? 0.2 : 0.3;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.setValueAtTime(vol * 0.9, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + (bright ? 0.15 : 0.2));

    // Click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.value = bright ? 600 : 800;
    clickGain.gain.setValueAtTime(bright ? 0.04 : 0.06, startTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.015);
    click.connect(clickGain);
    clickGain.connect(this.masterGain);
    click.start(startTime);
    click.stop(startTime + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.25);
  }

  // Snare — lighter snap in Part A, heavier crack in Part B
  _playSnare(startTime, bright) {
    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = bright ? 'highpass' : 'bandpass';
    noiseFilter.frequency.value = bright ? 4000 : 5000;
    noiseFilter.Q.value = bright ? 0.5 : 0.8;

    const noiseGain = this.ctx.createGain();
    const noiseVol = bright ? 0.09 : 0.14;
    noiseGain.gain.setValueAtTime(noiseVol, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + (bright ? 0.07 : 0.1));

    source.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + 0.12);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bright ? 180 : 220, startTime);
    osc.frequency.exponentialRampToValueAtTime(bright ? 90 : 100, startTime + 0.04);
    oscGain.gain.setValueAtTime(bright ? 0.08 : 0.12, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }

  // Hi-hat
  _playHiHat(startTime, open = false) {
    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = open ? 7000 : 9500;

    const gain = this.ctx.createGain();
    const vol = open ? 0.055 : 0.035;
    const decay = open ? 0.12 : 0.04;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + decay + 0.01);
  }
}
