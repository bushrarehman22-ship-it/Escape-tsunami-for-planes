// Procedural Web Audio API Sound Synthesizer for Escape Tsunami for Planes

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxMuted = false;
    this.bgmMuted = false;
    this.sfxVolume = 0.7;
    this.bgmVolume = 0.35;
    this.isPlayingBgm = false;
    this.bgmTimer = null;
    this.waveGainNode = null;
    this.waveSourceNode = null;
    this.sirenGainNode = null;
    this.sirenOsc = null;
    this.sirenTimer = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playPickup() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

      const startTime = this.ctx.currentTime + idx * 0.04;
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  playCash() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playBaseDeposit() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const chords = [
      [440, 554.37, 659.25], // A major
      [587.33, 739.99, 880]  // D major
    ];

    chords.forEach((chord, step) => {
      const t = this.ctx.currentTime + step * 0.12;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    });
  }

  playUpgrade() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const freqs = [392, 523.25, 659.25, 1046.5]; // G4, C5, E5, C6
    freqs.forEach((f, i) => {
      const t = this.ctx.currentTime + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playRebirth() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major
      [349.23, 440.00, 523.25, 698.46], // F major
      [392.00, 493.88, 587.33, 783.99], // G major
      [523.25, 659.25, 783.99, 1046.50, 1318.51] // C major high
    ];

    chords.forEach((chord, step) => {
      const t = this.ctx.currentTime + step * 0.16;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = step === 3 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
      });
    });
  }

  playJump() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playDash() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.25);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.25);
  }

  playSplash() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    // Noise blast for water crash
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.6);
  }

  playCrateOpen() {
    if (this.sfxMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    const notes = [261, 329, 392, 523, 659, 783, 1046];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  startSiren() {
    if (this.sfxMuted || this.sirenOsc) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGainNode = this.ctx.createGain();
      this.sirenOsc.type = 'sawtooth';
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      this.sirenGainNode.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);

      this.sirenOsc.connect(filter);
      filter.connect(this.sirenGainNode);
      this.sirenGainNode.connect(this.ctx.destination);

      let high = false;
      this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);
      this.sirenOsc.start();

      this.sirenTimer = setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        high = !high;
        const targetFreq = high ? 920 : 650;
        this.sirenOsc.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.25);
      }, 350);
    } catch (e) {
      console.warn('Siren start error', e);
    }
  }

  stopSiren() {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenGainNode && this.ctx) {
      try {
        this.sirenGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          if (this.sirenOsc) {
            try { this.sirenOsc.stop(); } catch(e){}
            this.sirenOsc = null;
            this.sirenGainNode = null;
          }
        }, 120);
      } catch (e) {
        this.sirenOsc = null;
        this.sirenGainNode = null;
      }
    }
  }

  updateWaveRoar(distanceToPlayer) {
    if (this.sfxMuted || !this.ctx) return;
    
    // Create continuous roar node if not exists
    if (!this.waveGainNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise
        lastOut = data[i];
      }

      this.waveSourceNode = this.ctx.createBufferSource();
      this.waveSourceNode.buffer = buffer;
      this.waveSourceNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      this.waveGainNode = this.ctx.createGain();
      this.waveGainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.waveSourceNode.connect(filter);
      filter.connect(this.waveGainNode);
      this.waveGainNode.connect(this.ctx.destination);
      this.waveSourceNode.start();
    }

    // Distance attenuation (closer = louder up to 0.4 max volume)
    const maxRange = 250;
    if (distanceToPlayer > 0 && distanceToPlayer < maxRange) {
      const factor = 1 - (distanceToPlayer / maxRange);
      const targetGain = Math.max(0.001, factor * factor * 0.45 * this.sfxVolume);
      this.waveGainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    } else {
      this.waveGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    }
  }

  startBgm() {
    if (this.isPlayingBgm || this.bgmMuted) return;
    this.init();
    this.resume();
    if (!this.ctx) return;

    this.isPlayingBgm = true;
    let step = 0;
    const tempo = 128; // BPM
    const stepDuration = 60 / tempo / 4; // 16th note

    // Aviator synth progression: F#m - D - A - E
    const bassline = [
      185, 185, 185, 185, 146.8, 146.8, 146.8, 146.8,
      220, 220, 220, 220, 164.8, 164.8, 164.8, 164.8
    ];
    const arpeggios = [
      370, 440, 554.37, 740, 293.66, 370, 440, 587.33,
      440, 554.37, 659.25, 880, 329.63, 392, 493.88, 659.25
    ];

    const playBgmStep = () => {
      if (!this.isPlayingBgm || this.bgmMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const beat16 = step % 16;
      const bassNote = bassline[beat16];
      const arpNote = arpeggios[beat16];

      // Bass synth
      if (beat16 % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassNote / 2, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + stepDuration * 1.8);

        gain.gain.setValueAtTime(0.12 * this.bgmVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + stepDuration * 1.8);
      }

      // Arpeggio high synth
      if (beat16 % 2 === 1 || beat16 % 4 === 2) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(arpNote, t);

        gain.gain.setValueAtTime(0.06 * this.bgmVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + stepDuration * 1.2);
      }

      // Snare / Hi-hat
      if (beat16 % 4 === 2) {
        // Snare
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
        const n = this.ctx.createBufferSource();
        n.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.08 * this.bgmVolume, t);
        n.connect(g);
        g.connect(this.ctx.destination);
        n.start(t);
      }

      step++;
      this.bgmTimer = setTimeout(playBgmStep, stepDuration * 1000);
    };

    playBgmStep();
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBgm() {
    this.bgmMuted = !this.bgmMuted;
    if (this.bgmMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return !this.bgmMuted;
  }

  toggleSfx() {
    this.sfxMuted = !this.sfxMuted;
    if (this.sfxMuted) {
      this.stopSiren();
      if (this.waveGainNode && this.ctx) {
        this.waveGainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      }
    }
    return !this.sfxMuted;
  }
}

export const soundEngine = new SoundEngine();
