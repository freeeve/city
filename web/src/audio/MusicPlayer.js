/**
 * Chiptune rendition inspired by "Pigstep" by Lena Raine.
 * Key: G minor, ~113 BPM, syncopated bass-driven groove.
 * Uses Web Audio API — no external files needed.
 */

// Note frequencies
const N = {
  // Octave 2
  G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81, Db3: 138.59,
  D3: 146.83, Eb3: 155.56, F3: 174.61, 'F#3': 185.00, G3: 196.00,
  A3: 220.00, Bb3: 233.08, C4: 261.63, Db4: 277.18, D4: 293.66,
  Eb4: 311.13, F4: 349.23, 'F#4': 369.99, G4: 392.00, A4: 440.00,
  Bb4: 466.16, C5: 523.25, D5: 587.33, Eb5: 622.25, F5: 698.46,
  G5: 783.99,
};

// ─── THE ICONIC BASS RIFF ───
// Pigstep's heart: syncopated, bouncy, with octave jumps.
// Pattern notation: [note, 16th-note duration]
const BASS = [
  // Bar 1: Gm — the signature bounce
  ['G2',2],[null,1],['G2',1],['G3',2],[null,2],['G2',1],['G2',1],['G3',2],['D3',2],[null,2],
  // Bar 2: Eb — walking up
  ['Eb3',2],[null,1],['Eb3',1],['Eb3',2],[null,2],['F3',1],['F3',1],['G3',2],['Eb3',2],[null,2],
  // Bar 3: F — push
  ['F3',2],[null,1],['F3',1],['F3',2],['A3',2],['G3',1],['F3',1],['D3',2],[null,2],[null,2],
  // Bar 4: Gm — back home with chromatic slide
  ['G2',2],[null,1],['G2',1],['Bb2',2],['A2',2],['G2',2],['G3',2],[null,2],[null,2],

  // Bar 5: Gm — variation with deeper bounce
  ['G2',2],['G2',1],[null,1],['D3',2],['G3',2],[null,2],['G2',1],[null,1],['Bb2',2],['D3',2],
  // Bar 6: Eb — syncopated climb
  ['Eb3',2],[null,1],['G3',1],['Eb3',2],[null,2],['Bb2',2],['Eb3',1],[null,1],['G3',2],[null,2],
  // Bar 7: F — tension builder
  ['F3',2],['F3',1],[null,1],['A3',2],['F3',2],[null,1],['C4',1],['A3',2],['F3',2],[null,2],
  // Bar 8: Gm resolve — big slide down
  ['G3',2],['F#3',1],['F3',1],['Eb3',2],['D3',2],['G2',2],['G3',3],[null,1],[null,2],
];

// ─── MELODY — sparse, chromatic, mysterious ───
// Short punchy notes with lots of breathing room, characteristic chromatic touches
const MELODY = [
  // Bar 1: iconic opening — da.. da-da da
  [null,4],['D5',1],['Eb5',1],['D5',2],['Bb4',2],[null,2],['A4',2],['G4',2],
  // Bar 2: answer phrase
  [null,2],['Bb4',2],['G4',1],[null,1],['F4',2],[null,2],['D4',2],['Eb4',2],[null,2],
  // Bar 3: climb with chromatic color
  ['F4',2],[null,1],['G4',1],['A4',2],['Bb4',2],['C5',2],[null,1],['Bb4',1],['A4',2],[null,2],
  // Bar 4: resolve with the characteristic drop
  ['G4',3],[null,1],[null,4],['D5',1],['C5',1],['Bb4',2],['A4',2],[null,2],

  // Bar 5: second section — higher energy
  ['Bb4',2],['D5',2],[null,2],['C5',1],['Bb4',1],['G4',2],['A4',2],[null,2],['Bb4',2],
  // Bar 6: chromatic passing tones (the Pigstep flavor)
  ['A4',1],['Bb4',1],['C5',2],['Bb4',2],[null,2],['A4',1],['G4',1],['F#4',2],['G4',2],[null,2],
  // Bar 7: tension — rising
  ['Eb5',2],[null,1],['D5',1],['C5',2],['Bb4',2],['A4',2],['C5',2],[null,2],[null,2],
  // Bar 8: big finish — fall with chromatic run
  ['D5',2],['Db4',1],['C5',1],['Bb4',2],['A4',1],['G4',1],['G4',4],[null,4],
];

// ─── CHORD STABS — dark, offbeat, punchy ───
// Gm - Eb - F - Gm progression with Pigstep-style stab timing
const CHORDS = [
  // Bar 1: Gm
  [null,3],[['G3','Bb3','D4'],2],[null,3],[null,3],[['G3','Bb3','D4'],2],[null,3],
  // Bar 2: Eb
  [null,3],[['Eb3','G3','Bb3'],2],[null,3],[null,3],[['Eb3','G3','Bb3'],2],[null,3],
  // Bar 3: F
  [null,3],[['F3','A3','C4'],2],[null,3],[null,3],[['F3','A3','C4'],2],[null,3],
  // Bar 4: Gm
  [['G3','Bb3','D4'],2],[null,2],[['G3','Bb3','D4'],2],[null,2],[null,4],[null,4],

  // Bar 5: Gm — more aggressive stabs
  [null,2],[['G3','Bb3','D4'],1],[null,1],[['G3','Bb3','D4'],2],[null,2],[null,2],[['G4','Bb4','D5'],2],[null,2],[null,2],
  // Bar 6: Eb
  [null,2],[['Eb3','G3','Bb3'],1],[null,1],[['Eb3','G3','Bb3'],2],[null,2],[null,2],[['Eb4','G4','Bb4'],2],[null,2],[null,2],
  // Bar 7: F
  [null,2],[['F3','A3','C4'],1],[null,1],[['F3','A3','C4'],2],[null,2],[null,2],[['F4','A4','C5'],2],[null,2],[null,2],
  // Bar 8: Gm — sustained resolve
  [['G3','Bb3','D4'],4],[null,4],[['G3','Bb3','D4'],4],[null,4],
];

// ─── DRUMS — Pigstep's trap-influenced bounce ───
// The key to Pigstep's feel: syncopated kicks, crisp snares, active hats
// Positions are in 16th notes within a bar (0-15)
const DRUMS_A = [
  // Main groove — syncopated kick with snare on 4 and 12
  ['k',0],['h',0],['h',2],['k',3],['s',4],['h',4],['h',6],
  ['k',7],['h',8],['k',10],['h',10],['s',12],['h',12],['k',13],['h',14],['oh',15],
];

const DRUMS_B = [
  // Variation — double kick, open hat flourish
  ['k',0],['h',0],['k',1],['h',2],['k',3],['s',4],['h',4],['oh',6],
  ['k',8],['h',8],['h',10],['k',11],['s',12],['h',12],['k',14],['oh',15],
];

const DRUMS_FILL = [
  // Fill bar — rapid snares building tension
  ['k',0],['s',1],['h',2],['s',3],['k',4],['s',5],['s',6],['s',7],
  ['k',8],['s',9],['s',10],['s',11],['k',12],['s',13],['s',14],['k',15],
];

// 8 bars: A A B A  A B A Fill
const DRUM_PATTERN = [DRUMS_A, DRUMS_A, DRUMS_B, DRUMS_A, DRUMS_A, DRUMS_B, DRUMS_A, DRUMS_FILL];

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

    // Compressor for that punchy, glued-together Pigstep sound
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 5;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.1;
    this.compressor.connect(this.ctx.destination);
    this.masterGain.connect(this.compressor);

    // Pre-generate noise buffer for drums (reuse for efficiency)
    this._noiseBuffer = this._createNoiseBuffer(0.15);
  }

  _createNoiseBuffer(seconds) {
    const size = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
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

    const bpm = 113; // Pigstep tempo
    const sixteenth = 60 / bpm / 4;
    const now = this.ctx.currentTime + 0.08;

    // ── Schedule bass ──
    let t = now;
    for (const [note, dur] of BASS) {
      if (note) {
        this._playBass(note, t, sixteenth * dur * 0.8);
      }
      t += sixteenth * dur;
    }
    const loopDuration = t - now;

    // ── Schedule melody ──
    t = now;
    for (const [note, dur] of MELODY) {
      if (note) {
        this._playLead(note, t, sixteenth * dur * 0.7);
      }
      t += sixteenth * dur;
    }

    // ── Schedule chord stabs ──
    t = now;
    for (const entry of CHORDS) {
      const [notes, dur] = entry;
      if (notes) {
        for (const note of notes) {
          this._playStab(note, t, sixteenth * dur * 0.5);
        }
      }
      t += sixteenth * dur;
    }

    // ── Schedule drums (8 bars) ──
    for (let bar = 0; bar < 8; bar++) {
      const barStart = now + bar * 16 * sixteenth;
      const pattern = DRUM_PATTERN[bar];
      for (const [type, pos] of pattern) {
        const time = barStart + pos * sixteenth;
        if (type === 'k') this._playKick(time);
        else if (type === 's') this._playSnare(time);
        else if (type === 'h') this._playHiHat(time, false);
        else if (type === 'oh') this._playHiHat(time, true);
      }
    }

    // ── Schedule subtle background arp (Pigstep has these background textures) ──
    this._scheduleArp(now, loopDuration, sixteenth);

    this.timer = setTimeout(() => this._scheduleLoop(), (loopDuration - 0.2) * 1000);
  }

  // Background arpeggio — adds texture like Pigstep's synth layers
  _scheduleArp(now, loopDuration, sixteenth) {
    const arpNotes = ['G4','Bb4','D5','Bb4','G4','D4','F4','D4'];
    const totalSteps = Math.floor(loopDuration / (sixteenth * 2));
    for (let i = 0; i < totalSteps; i++) {
      const note = arpNotes[i % arpNotes.length];
      const time = now + i * sixteenth * 2;
      this._playArp(note, time, sixteenth * 1.5);
    }
  }

  // ── INSTRUMENTS ──

  // Lead — pulse wave with slight detune (chip-tune character)
  _playLead(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc1.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * 1.004;

    // Low-pass to soften the square wave slightly
    filter.type = 'lowpass';
    filter.frequency.value = freq * 4;
    filter.Q.value = 1;

    // Punchy envelope — fast attack, slight sustain, quick release
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.065, startTime + 0.008);
    gain.gain.setValueAtTime(0.055, startTime + duration * 0.4);
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

  // Bass — heavy distorted triangle, the star of Pigstep
  _playBass(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const shaper = this.ctx.createWaveShaper();

    // Main bass: triangle wave
    osc.type = 'triangle';
    osc.frequency.value = freq;
    // Sub layer: sine an octave below for weight
    osc2.type = 'sine';
    osc2.frequency.value = freq * 0.5;

    // Warm saturation curve
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2.5);
    }
    shaper.curve = curve;

    // Punchy attack — that Pigstep bass thump
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.006);
    gain.gain.setValueAtTime(0.16, startTime + 0.03);
    gain.gain.setValueAtTime(0.12, startTime + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    const merge = this.ctx.createGain();
    merge.gain.value = 1;
    osc.connect(merge);
    osc2.connect(merge);
    merge.connect(shaper);
    shaper.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.02);
  }

  // Chord stab — aggressive square wave, tight and short
  _playStab(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    // Very snappy — immediate attack, fast decay
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.04, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // Background arp — quiet sine wave texture
  _playArp(noteName, startTime, duration) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.015, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  // Kick — deep, punchy, Pigstep-style
  _playKick(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Fast pitch sweep from 160Hz → 30Hz — that chest-thumping Pigstep kick
    osc.frequency.setValueAtTime(160, startTime);
    osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.08);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.setValueAtTime(0.28, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    // Click transient for attack
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.value = 800;
    clickGain.gain.setValueAtTime(0.06, startTime);
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

  // Snare — tight, crisp, with tonal body
  _playSnare(startTime) {
    // Noise burst (top end)
    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 5000;
    noiseFilter.Q.value = 0.8;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    source.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + 0.12);

    // Tonal body (triangle pitch sweep)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, startTime);
    osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.04);
    oscGain.gain.setValueAtTime(0.12, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }

  // Hi-hat — metallic filtered noise
  _playHiHat(startTime, open = false) {
    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = open ? 7000 : 9500;

    const gain = this.ctx.createGain();
    const vol = open ? 0.06 : 0.04;
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
