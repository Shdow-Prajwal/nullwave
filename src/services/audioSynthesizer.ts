// src/services/audioSynthesizer.ts
import { Song } from '../types/music';

class AudioSynthesizerService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying: boolean = false;
  private currentSong: Song | null = null;
  private timerId: number | null = null;
  private step: number = 0;
  private volume: number = 0.65;
  private onFrequencyDataListeners: Set<(data: Uint8Array) => void> = new Set();
  private onTimeUpdateListeners: Set<(current: number, duration: number) => void> = new Set();
  private onEndedListeners: Set<() => void> = new Set();
  private animFrameId: number | null = null;

  // Real audio playback element
  private audioElement: HTMLAudioElement | null = null;
  private isPlayingRealAudio: boolean = false;
  private mediaSourceConnected: boolean = false;

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128; // 64 frequency bands
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.startVisualizerLoop();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isUsingRealAudio(): boolean {
    return this.isPlayingRealAudio;
  }

  /**
   * Play a song. If previewUrl is available, plays the real audio stream via HTML5 Audio + Web Audio API.
   * If previewUrl is absent or fails, falls back gracefully to procedural synth.
   */
  public playSong(song: Song) {
    this.initContext();
    this.stopPlayback();

    this.currentSong = song;
    this.isPlaying = true;

    // Check if song has a studio audio preview URL
    if (song.previewUrl && song.previewUrl.trim().length > 0) {
      this.playRealAudioPreview(song);
    } else {
      this.playProceduralSynth(song);
    }
  }

  private playRealAudioPreview(song: Song) {
    this.isPlayingRealAudio = true;

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      // Connect HTML5 Audio into Web Audio Analyser if supported
      try {
        if (this.ctx && this.masterGain && !this.mediaSourceConnected) {
          const source = this.ctx.createMediaElementSource(this.audioElement);
          source.connect(this.masterGain);
          this.mediaSourceConnected = true;
        }
      } catch (e) {
        console.warn('Media element source connection skipped:', e);
      }

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement) {
          const curr = this.audioElement.currentTime;
          const dur = this.audioElement.duration || song.durationSeconds || 30;
          this.onTimeUpdateListeners.forEach((cb) => cb(curr, dur));
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.isPlayingRealAudio = false;
        this.onEndedListeners.forEach((cb) => cb());
      });

      this.audioElement.addEventListener('error', (err) => {
        console.warn('Audio preview playback error, falling back to synthesizer:', err);
        this.isPlayingRealAudio = false;
        if (this.currentSong && this.isPlaying) {
          this.playProceduralSynth(this.currentSong);
        }
      });
    }

    this.audioElement.src = song.previewUrl!;
    this.audioElement.volume = this.volume;
    this.audioElement.currentTime = 0;

    this.audioElement.play().catch((err) => {
      console.warn('Autoplay prevented or stream failed, falling back to synthesizer:', err);
      this.isPlayingRealAudio = false;
      this.playProceduralSynth(song);
    });
  }

  private playProceduralSynth(song: Song) {
    this.isPlayingRealAudio = false;
    this.step = 0;

    const bpm = song.bpm || 110;
    const intervalMs = (60 / bpm / 4) * 1000;

    this.scheduleNotes();
    this.timerId = window.setInterval(() => {
      this.step = (this.step + 1) % 16;
      this.scheduleNotes();
    }, intervalMs);
  }

  public stopPlayback() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
    this.isPlayingRealAudio = false;
  }

  public pausePlayback() {
    if (this.audioElement && this.isPlayingRealAudio) {
      this.audioElement.pause();
    }
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
  }

  public resumePlayback() {
    if (!this.currentSong) return;
    this.initContext();
    this.isPlaying = true;

    if (this.isPlayingRealAudio && this.audioElement) {
      this.audioElement.play().catch(() => {
        this.playProceduralSynth(this.currentSong!);
      });
    } else {
      this.playSong(this.currentSong);
    }
  }

  public seek(seconds: number) {
    if (this.audioElement && this.isPlayingRealAudio) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration || 30));
    }
  }

  public togglePlayPause(song: Song): boolean {
    if (this.isPlaying && this.currentSong?.id === song.id) {
      this.pausePlayback();
      return false;
    } else if (!this.isPlaying && this.currentSong?.id === song.id) {
      this.resumePlayback();
      return true;
    } else {
      this.playSong(song);
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSong(): Song | null {
    return this.currentSong;
  }

  public subscribeTimeUpdate(cb: (current: number, duration: number) => void): () => void {
    this.onTimeUpdateListeners.add(cb);
    return () => {
      this.onTimeUpdateListeners.delete(cb);
    };
  }

  public subscribeEnded(cb: () => void): () => void {
    this.onEndedListeners.add(cb);
    return () => {
      this.onEndedListeners.delete(cb);
    };
  }

  private scheduleNotes() {
    if (!this.ctx || !this.masterGain || !this.currentSong) return;
    const now = this.ctx.currentTime;
    const config = this.currentSong.audioConfig || {
      rootFreq: 220,
      scale: [0, 3, 5, 7, 10],
      synthType: 'synthwave',
      bpm: 118,
    };
    const step = this.step;
    const root = config.rootFreq;
    const scale = config.scale && config.scale.length > 0 ? config.scale : [0, 3, 7, 10];

    switch (config.synthType) {
      case 'synthwave':
        if (step % 2 === 0) {
          const bassFreq = root * 0.5 * Math.pow(2, (scale[(step / 2) % scale.length] ?? 0) / 12);
          this.triggerOscillator('sawtooth', bassFreq, now, 0.18, 0.28, 600);
        }
        if (step % 4 !== 0) {
          const arpFreq = root * 2 * Math.pow(2, (scale[step % scale.length] ?? 0) / 12);
          this.triggerPluck(arpFreq, now, 0.09, 0.14);
        }
        if (step % 4 === 0) this.triggerDrumKick(now);
        if (step === 4 || step === 12) this.triggerSnare(now);
        break;

      case 'lofi':
        if (step === 0 || step === 8) {
          const chord = [0, 4, 7, 11].map((semi) => root * Math.pow(2, semi / 12));
          chord.forEach((freq) => this.triggerWarmChord(freq, now, 1.2, 0.12));
        }
        if (step === 0 || step === 10) this.triggerDrumKick(now, 60);
        if (step === 4 || step === 12) this.triggerVinylClick(now);
        break;

      case 'pop':
        if (step % 2 === 0) {
          const bassFreq = root * Math.pow(2, (scale[step % scale.length] ?? 0) / 12);
          this.triggerPluck(bassFreq, now, 0.15, 0.22);
        }
        if (step % 4 === 0) this.triggerDrumKick(now);
        if (step === 4 || step === 12) this.triggerSnare(now);
        break;

      default:
        if (step % 4 === 0) {
          const bassFreq = root * Math.pow(2, (scale[step % scale.length] ?? 0) / 12);
          this.triggerAmbientPad(bassFreq, now, 1.0, 0.18);
        }
        break;
    }
  }

  private triggerOscillator(
    type: OscillatorType,
    freq: number,
    time: number,
    duration: number,
    level: number,
    filterCutoff: number = 2000
  ) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(filterCutoff * 0.4, time + duration);

    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerPluck(freq: number, time: number, duration: number, level: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerWarmChord(freq: number, time: number, duration: number, level: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerDrumKick(time: number, startFreq: number = 130) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.28);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  private triggerVinylClick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.02);
  }

  private triggerAmbientPad(freq: number, time: number, duration: number, level: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  public subscribeFrequencyData(cb: (data: Uint8Array) => void): () => void {
    this.onFrequencyDataListeners.add(cb);
    return () => {
      this.onFrequencyDataListeners.delete(cb);
    };
  }

  private startVisualizerLoop() {
    const update = () => {
      if (this.analyser) {
        const buffer = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(buffer);

        // If playing real audio preview and buffer is completely silent (due to strict CORS in some browser environments),
        // simulate natural rhythmic frequency pulses matching the song's energy & tempo
        const hasSignal = buffer.some((v) => v > 0);
        if (!hasSignal && this.isPlaying) {
          const time = performance.now() / 1000;
          const bpm = this.currentSong?.bpm || 120;
          const beatFreq = (bpm / 60) * Math.PI * 2;
          const energy = this.currentSong?.vector?.energy || 0.6;
          for (let i = 0; i < buffer.length; i++) {
            const wave = Math.sin(time * beatFreq + i * 0.4);
            buffer[i] = Math.floor(Math.max(40, (wave * 0.5 + 0.5) * 200 * energy));
          }
        }

        this.onFrequencyDataListeners.forEach((cb) => cb(buffer));
      }
      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }
}

export const audioSynthesizer = new AudioSynthesizerService();