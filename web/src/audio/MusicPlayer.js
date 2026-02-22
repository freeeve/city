/**
 * Hybrid chiptune: cheerful city-builder meets Pigstep groove.
 * Part A (8 bars): Bright Bb major — upbeat, bouncy city vibes
 * Part B (8 bars): Dark G minor — Pigstep-inspired syncopated groove
 * Smooth crossfade transitions: instrument tones, drums, and arps
 * gradually morph over the last 2 bars of each section.
 * 113 BPM throughout. Uses Web Audio API.
 */

const N = {
  G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81, Db3: 138.59,
  D3: 146.83, Eb3: 155.56, F3: 174.61, 'F#3': 185.00, G3: 196.00,
  A3: 220.00, Bb3: 233.08, C4: 261.63, Db4: 277.18, D4: 293.66,
  Eb4: 311.13, F4: 349.23, 'F#4': 369.99, G4: 392.00, A4: 440.00,
  Bb4: 466.16, C5: 523.25, D5: 587.33, Eb5: 622.25, F5: 698.46,
  G5: 783.99,
};

const lerp = (a, b, t) => a + (b - a) * t;

// ═══════════════════════════════════════════════════
// PART A — BRIGHT CITY BUILDER (Bb major feel, 8 bars)
// ═══════════════════════════════════════════════════

const MELODY_A = [
  ['D4',2],['F4',2],['Bb4',2],['A4',2],['G4',2],['F4',2],['G4',2],['F4',2],
  ['Eb4',2],['G4',2],['Bb4',2],['A4',2],['F4',4],['D4',2],[null,2],
  ['D4',2],['F4',2],['G4',2],['Bb4',2],['C5',2],['Bb4',2],['A4',2],['G4',2],
  ['F4',2],['D4',2],['Eb4',2],['D4',2],['Bb3',4],[null,4],
  ['F4',2],['G4',2],['Bb4',2],['C5',2],['D5',2],['C5',2],['Bb4',2],['A4',2],
  ['G4',2],[null,2],['Bb4',2],['A4',1],['G4',1],['F4',2],['G4',2],[null,2],['F4',2],
  // Bars 7-8: transition — melody gradually gets darker/sparser
  ['Bb4',2],['C5',2],['D5',2],[null,2],['C5',2],['Bb4',2],['A4',2],['G4',2],
  ['A4',2],['Bb4',2],['A4',2],['G4',2],['F#4',2],['G4',2],[null,4],
];

const BASS_A = [
  ['Bb2',2],[null,1],['Bb2',1],['F3',2],[null,2],['Bb2',2],['F3',1],[null,1],['Bb2',2],[null,2],
  ['Eb3',2],[null,1],['Eb3',1],['Bb2',2],[null,2],['Eb3',2],['G3',1],[null,1],['Eb3',2],[null,2],
  ['F3',2],[null,1],['F3',1],['C3',2],[null,2],['F3',2],['A3',1],[null,1],['F3',2],[null,2],
  ['Bb2',2],[null,1],['Bb2',1],['D3',2],['F3',2],['Bb2',2],[null,2],[null,2],[null,2],
  ['Bb2',2],['Bb2',1],[null,1],['D3',2],['F3',2],[null,2],['Bb2',1],[null,1],['D3',2],['F3',2],
  ['Eb3',2],[null,1],['G3',1],['Eb3',2],[null,2],['Bb2',2],['Eb3',1],[null,1],['G3',2],[null,2],
  // Bars 7-8: transition bass — getting heavier, syncopation creeping in
  ['F3',2],['F3',1],[null,1],['A3',2],['F3',2],[null,1],['C4',1],['A3',2],['F3',2],[null,2],
  ['Bb2',2],['A2',1],['Bb2',1],['A2',2],['G2',2],['G2',2],['G3',3],[null,1],[null,2],
];

const CHORDS_A = [
  [null,3],[['Bb3','D4','F4'],2],[null,3],[null,3],[['Bb3','D4','F4'],2],[null,3],
  [null,3],[['Eb4','G4','Bb4'],2],[null,3],[null,3],[['Eb4','G4','Bb4'],2],[null,3],
  [null,3],[['F3','A3','C4'],2],[null,3],[null,3],[['F4','A4','C5'],2],[null,3],
  [['Bb3','D4','F4'],2],[null,2],[['Bb3','D4','F4'],2],[null,2],[null,4],[null,4],
  [null,2],[['Bb3','D4','F4'],1],[null,1],[['Bb3','D4','F4'],2],[null,2],[null,2],[['Bb4','D5','F5'],2],[null,2],[null,2],
  [null,2],[['Eb4','G4','Bb4'],1],[null,1],[['Eb4','G4','Bb4'],2],[null,2],[null,4],[null,4],
  // Bars 7-8: shared chords that work in both Bb and Gm
  [null,2],[['F3','A3','C4'],1],[null,1],[['F4','A4','C5'],2],[null,2],[null,4],[null,4],
  [['G3','Bb3','D4'],4],[null,4],[['G3','Bb3','D4'],4],[null,4],
];

// ═══════════════════════════════════════════════════
// PART B — DARK PIGSTEP (G minor feel, 8 bars)
// ═══════════════════════════════════════════════════

const MELODY_B = [
  // Bars 1-2: transition in — melody emerges from the bright section
  [null,4],['D5',1],['Eb5',1],['D5',2],['Bb4',2],[null,2],['A4',2],['G4',2],
  [null,2],['Bb4',2],['G4',1],[null,1],['F4',2],[null,2],['D4',2],['Eb4',2],[null,2],
  ['F4',2],[null,1],['G4',1],['A4',2],['Bb4',2],['C5',2],[null,1],['Bb4',1],['A4',2],[null,2],
  ['G4',3],[null,1],[null,4],['D5',1],['C5',1],['Bb4',2],['A4',2],[null,2],
  ['Bb4',2],['D5',2],[null,2],['C5',1],['Bb4',1],['G4',2],['A4',2],[null,2],['Bb4',2],
  ['A4',1],['Bb4',1],['C5',2],['Bb4',2],[null,2],['A4',1],['G4',1],['F#4',2],['G4',2],[null,2],
  // Bars 7-8: transition out — melody brightens, lifts back up
  ['Eb5',2],[null,1],['D5',1],['C5',2],['Bb4',2],['C5',2],['D5',2],[null,2],[null,2],
  ['D5',2],['C5',1],['Bb4',1],['A4',2],['Bb4',2],['C5',2],['D5',2],[null,4],
];

const BASS_B = [
  // Bars 1-2: transition in — bass gets heavier
  ['G2',2],[null,1],['G2',1],['G3',2],[null,2],['G2',1],['G2',1],['G3',2],['D3',2],[null,2],
  ['Eb3',2],[null,1],['Eb3',1],['Eb3',2],[null,2],['F3',1],['F3',1],['G3',2],['Eb3',2],[null,2],
  ['F3',2],[null,1],['F3',1],['F3',2],['A3',2],['G3',1],['F3',1],['D3',2],[null,2],[null,2],
  ['G2',2],[null,1],['G2',1],['Bb2',2],['A2',2],['G2',2],['G3',2],[null,2],[null,2],
  ['G2',2],['G2',1],[null,1],['D3',2],['G3',2],[null,2],['G2',1],[null,1],['Bb2',2],['D3',2],
  ['Eb3',2],[null,1],['G3',1],['Eb3',2],[null,2],['Bb2',2],['Eb3',1],[null,1],['G3',2],[null,2],
  // Bars 7-8: transition out — bass lightens, walks up to Bb
  ['F3',2],['F3',1],[null,1],['A3',2],['F3',2],[null,1],['C4',1],['A3',2],['F3',2],[null,2],
  ['G3',2],['A3',1],['Bb3',1],['A3',2],['Bb2',2],['D3',2],['F3',3],[null,1],[null,2],
];

const CHORDS_B = [
  [null,3],[['G3','Bb3','D4'],2],[null,3],[null,3],[['G3','Bb3','D4'],2],[null,3],
  [null,3],[['Eb3','G3','Bb3'],2],[null,3],[null,3],[['Eb3','G3','Bb3'],2],[null,3],
  [null,3],[['F3','A3','C4'],2],[null,3],[null,3],[['F3','A3','C4'],2],[null,3],
  [['G3','Bb3','D4'],2],[null,2],[['G3','Bb3','D4'],2],[null,2],[null,4],[null,4],
  [null,2],[['G3','Bb3','D4'],1],[null,1],[['G3','Bb3','D4'],2],[null,2],[null,2],[['G4','Bb4','D5'],2],[null,2],[null,2],
  [null,2],[['Eb3','G3','Bb3'],1],[null,1],[['Eb3','G3','Bb3'],2],[null,2],[null,2],[['Eb4','G4','Bb4'],2],[null,2],[null,2],
  // Bars 7-8: transition out — chords brighten toward Bb
  [null,2],[['F3','A3','C4'],1],[null,1],[['F4','A4','C5'],2],[null,2],[null,4],[null,4],
  [['Bb3','D4','F4'],4],[null,4],[['Bb3','D4','F4'],4],[null,4],
];

// ═══════════════════════════════════════════════════
// DRUMS
// ═══════════════════════════════════════════════════

const DRUMS_LIGHT_A = [
  ['k',0],['h',0],['h',2],['h',4],['s',4],['h',6],
  ['h',8],['k',8],['h',10],['s',12],['h',12],['h',14],
];
const DRUMS_LIGHT_B = [
  ['k',0],['h',0],['h',2],['k',4],['s',4],['h',6],
  ['h',8],['k',10],['h',10],['s',12],['h',12],['oh',14],
];
// Medium drums — bridge between light and heavy
const DRUMS_MID = [
  ['k',0],['h',0],['h',2],['k',3],['s',4],['h',4],['h',6],
  ['h',8],['k',8],['h',10],['s',12],['h',12],['oh',14],
];
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

// Part A: bars 1-6 light, bar 7 medium (transition), bar 8 fill
const DRUMS_PART_A = [
  DRUMS_LIGHT_A, DRUMS_LIGHT_A, DRUMS_LIGHT_B, DRUMS_LIGHT_A,
  DRUMS_LIGHT_A, DRUMS_LIGHT_B, DRUMS_MID, DRUMS_FILL,
];
// Part B: bar 1 medium (transition in), bars 2-7 heavy, bar 8 fill
const DRUMS_PART_B = [
  DRUMS_MID, DRUMS_HEAVY_A, DRUMS_HEAVY_B, DRUMS_HEAVY_A,
  DRUMS_HEAVY_A, DRUMS_HEAVY_B, DRUMS_MID, DRUMS_FILL,
];

const ARP_A = ['Bb4','D5','F5','D5','Bb4','F4','A4','F4'];
const ARP_B = ['G4','Bb4','D5','Bb4','G4','D4','F4','D4'];

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

  // Get blend value (0=bright, 1=dark) based on position in a section
  // Bars 1-6: hold at base value, bars 7-8: crossfade toward target
  _getBlend(sixteenthPos, sectionSixteenths, fromBlend, toBlend) {
    const transitionStart = sectionSixteenths - 32; // last 2 bars
    if (sixteenthPos < transitionStart) return fromBlend;
    const t = (sixteenthPos - transitionStart) / 32;
    return lerp(fromBlend, toBlend, Math.min(1, t));
  }

  _scheduleSection(melody, bass, chords, drums, arpNotes, arpNotesNext, now, sixteenth, fromBlend, toBlend) {
    // Calculate total section duration from bass
    let totalSixteenths = 0;
    for (const [, dur] of bass) totalSixteenths += dur;
    const sectionDuration = totalSixteenths * sixteenth;

    // Bass
    let pos = 0;
    for (const [note, dur] of bass) {
      if (note) {
        const blend = this._getBlend(pos, totalSixteenths, fromBlend, toBlend);
        this._playBass(note, now + pos * sixteenth, sixteenth * dur * 0.8, blend);
      }
      pos += dur;
    }

    // Melody
    pos = 0;
    for (const [note, dur] of melody) {
      if (note) {
        const blend = this._getBlend(pos, totalSixteenths, fromBlend, toBlend);
        this._playLead(note, now + pos * sixteenth, sixteenth * dur * 0.7, blend);
      }
      pos += dur;
    }

    // Chords
    pos = 0;
    for (const entry of chords) {
      const [notes, dur] = entry;
      if (notes) {
        for (const note of notes) {
          this._playStab(note, now + pos * sixteenth, sixteenth * dur * 0.5);
        }
      }
      pos += dur;
    }

    // Drums (8 bars) — blend affects kick/snare intensity
    for (let bar = 0; bar < 8; bar++) {
      const barStart = now + bar * 16 * sixteenth;
      const barBlend = this._getBlend(bar * 16, totalSixteenths, fromBlend, toBlend);
      for (const [type, drumPos] of drums[bar]) {
        const time = barStart + drumPos * sixteenth;
        if (type === 'k') this._playKick(time, barBlend);
        else if (type === 's') this._playSnare(time, barBlend);
        else if (type === 'h') this._playHiHat(time, false);
        else if (type === 'oh') this._playHiHat(time, true);
      }
    }

    // Arpeggio — crossfade between bright and dark arp notes
    const totalSteps = Math.floor(sectionDuration / (sixteenth * 2));
    for (let i = 0; i < totalSteps; i++) {
      const stepPos = i * 2; // position in sixteenths
      const blend = this._getBlend(stepPos, totalSixteenths, fromBlend, toBlend);
      const time = now + i * sixteenth * 2;
      const dur = sixteenth * 1.5;

      // Main arp
      const noteA = arpNotes[i % arpNotes.length];
      const noteB = arpNotesNext[i % arpNotesNext.length];

      // Crossfade: play both arps with complementary volumes
      this._playArp(noteA, time, dur, 1 - blend);
      if (blend > 0.05) {
        this._playArp(noteB, time, dur, blend);
      }
    }

    return sectionDuration;
  }

  _scheduleLoop() {
    if (!this.playing) return;

    const bpm = 113;
    const sixteenth = 60 / bpm / 4;
    const now = this.ctx.currentTime + 0.08;

    // Part A: bright (0.0) → crossfades toward dark (0.5) in last 2 bars
    const durA = this._scheduleSection(
      MELODY_A, BASS_A, CHORDS_A, DRUMS_PART_A, ARP_A, ARP_B,
      now, sixteenth, 0.0, 0.5
    );

    // Part B: picks up at 0.5 → goes fully dark (1.0) then crossfades back to 0.5 in last 2 bars
    const durB = this._scheduleSection(
      MELODY_B, BASS_B, CHORDS_B, DRUMS_PART_B, ARP_B, ARP_A,
      now + durA, sixteenth, 0.5, 0.0
    );

    const totalDuration = durA + durB;
    this.timer = setTimeout(() => this._scheduleLoop(), (totalDuration - 0.2) * 1000);
  }

  // ═══════════════════════════════════════════════════
  // INSTRUMENTS — all use blend (0=bright, 1=dark)
  // ═══════════════════════════════════════════════════

  _playLead(noteName, startTime, duration, blend) {
    const freq = N[noteName];
    if (!freq) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc1.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * lerp(1.002, 1.006, blend);

    filter.type = 'lowpass';
    filter.frequency.value = freq * lerp(6, 3, blend);
    filter.Q.value = lerp(0.5, 1.3, blend);

    const vol = lerp(0.055, 0.065, blend);
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

  _playBass(noteName, startTime, duration, blend) {
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 0.5;

    const vol = lerp(0.14, 0.2, blend);
    const attackTime = lerp(0.01, 0.006, blend);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + attackTime);
    gain.gain.setValueAtTime(vol * 0.8, startTime + 0.03);
    gain.gain.setValueAtTime(vol * lerp(0.7, 0.55, blend), startTime + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Waveshaper with blend-controlled drive
    const shaper = this.ctx.createWaveShaper();
    const drive = lerp(0.8, 2.5, blend);
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * drive);
    }
    shaper.curve = curve;

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

  // Arp with blend-controlled volume and waveform
  _playArp(noteName, startTime, duration, amount) {
    if (amount < 0.02) return;
    const freq = N[noteName];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    // Brighter arps use triangle, darker use sine
    osc.type = amount > 0.5 ? 'triangle' : 'sine';
    osc.frequency.value = freq;

    const vol = 0.02 * amount;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  _playKick(startTime, blend) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    const startFreq = lerp(140, 165, blend);
    const endFreq = lerp(42, 28, blend);
    const sweepTime = lerp(0.06, 0.09, blend);
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + sweepTime);

    const vol = lerp(0.2, 0.3, blend);
    const decayTime = lerp(0.14, 0.22, blend);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.setValueAtTime(vol * 0.9, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);

    // Click transient — louder when darker
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.value = lerp(600, 850, blend);
    clickGain.gain.setValueAtTime(lerp(0.03, 0.06, blend), startTime);
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

  _playSnare(startTime, blend) {
    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = blend > 0.5 ? 'bandpass' : 'highpass';
    noiseFilter.frequency.value = lerp(4000, 5200, blend);
    noiseFilter.Q.value = lerp(0.4, 0.9, blend);

    const noiseGain = this.ctx.createGain();
    const noiseVol = lerp(0.08, 0.15, blend);
    const noiseDecay = lerp(0.06, 0.11, blend);
    noiseGain.gain.setValueAtTime(noiseVol, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + noiseDecay);

    source.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + 0.12);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(lerp(175, 225, blend), startTime);
    osc.frequency.exponentialRampToValueAtTime(lerp(85, 100, blend), startTime + 0.04);
    oscGain.gain.setValueAtTime(lerp(0.07, 0.13, blend), startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }

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
