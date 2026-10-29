// Background Music (BGM) Manager for Ryan's Grand Casino Big 2 Poker

type BGMListener = (isPlaying: boolean, trackName: string, isMuted: boolean) => void;

class BGMManager {
  private audio: HTMLAudioElement | null = null;
  private isPlayingState: boolean = false;
  private isMutedState: boolean = false;
  private volume: number = 0.45;
  private trackName: string = "Casino Lounge Theme";
  private listeners: Set<BGMListener> = new Set();
  private isProceduralPlaying: boolean = false;
  private audioCtx: AudioContext | null = null;
  private synthInterval: number | null = null;
  private isUsingCustomFile: boolean = false;

  constructor() {
    // Try to initialize HTML5 Audio pointing to /theme.mp3 or public audio
    if (typeof window !== 'undefined') {
      this.initAudioElement('/theme.mp3');
    }
  }

  private initAudioElement(src: string) {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }

    try {
      this.audio = new Audio(src);
      this.audio.loop = true;
      this.audio.volume = this.volume;

      this.audio.addEventListener('play', () => {
        this.isPlayingState = true;
        this.notifyListeners();
      });

      this.audio.addEventListener('pause', () => {
        this.isPlayingState = false;
        this.notifyListeners();
      });

      this.audio.addEventListener('error', () => {
        // If theme.mp3 is not found in public/, we can seamlessly fall back to our procedural casino lounge ambient music
        if (!this.isUsingCustomFile) {
          console.log("Custom MP3 file not found yet; procedural casino ambient music ready.");
        }
      });
    } catch {
      // Audio element not supported in current environment
    }
  }

  public setCustomAudioFile(file: File) {
    const url = URL.createObjectURL(file);
    this.isUsingCustomFile = true;
    this.trackName = file.name.replace(/\.[^/.]+$/, '');
    this.stopProcedural();
    this.initAudioElement(url);
    this.play();
  }

  public subscribe(listener: BGMListener) {
    this.listeners.add(listener);
    listener(this.isPlaying(), this.trackName, this.isMutedState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentPlaying = this.isPlaying();
    this.listeners.forEach((fn) => fn(currentPlaying, this.trackName, this.isMutedState));
  }

  public isPlaying(): boolean {
    return this.isPlayingState || this.isProceduralPlaying;
  }

  public getTrackName(): string {
    return this.trackName;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public async play() {
    this.isMutedState = false;

    if (this.audio && this.audio.src && this.audio.src !== '') {
      try {
        this.audio.volume = this.volume;
        await this.audio.play();
        this.isPlayingState = true;
        this.stopProcedural();
        this.notifyListeners();
        return;
      } catch {
        // Fallback to procedural synth if audio file cannot autoplay or failed
      }
    }

    // Fallback to high-class Procedural Casino Lounge Jazz Ambient
    this.startProceduralCasinoLounge();
  }

  public pause() {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {
        // Ignore
      }
    }
    this.stopProcedural();
    this.isPlayingState = false;
    this.notifyListeners();
  }

  public toggle() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  // High quality procedural smooth Casino Lounge Jazz Chord loop generator (Web Audio API)
  private startProceduralCasinoLounge() {
    if (this.isProceduralPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.isProceduralPlaying = true;
      this.isPlayingState = true;
      this.notifyListeners();

      // Jazzy progression: Dm9 -> G13 -> Cmaj9 -> A7b13
      const chords = [
        [146.83, 220.00, 261.63, 329.63, 392.00], // Dm9
        [196.00, 246.94, 329.63, 370.00, 440.00], // G13
        [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9
        [220.00, 277.18, 329.63, 415.30, 493.88], // A7b13
      ];

      let chordIdx = 0;

      const playChord = () => {
        if (!this.isProceduralPlaying || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const chord = chords[chordIdx % chords.length];
        chordIdx++;

        chord.forEach((freq, i) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const filter = this.audioCtx.createBiquadFilter();

          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(650, now);
          filter.frequency.exponentialRampToValueAtTime(350, now + 3.2);

          const baseVol = (i === 0 ? 0.08 : 0.04) * (this.volume / 0.5);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(baseVol, now + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now);
          osc.stop(now + 3.5);
        });

        // Subtle soft jazz brush hi-hat
        const noiseBuffer = this.audioCtx.createBuffer(1, Math.floor(this.audioCtx.sampleRate * 0.06), this.audioCtx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let j = 0; j < noiseBuffer.length; j++) {
          noiseData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (this.audioCtx.sampleRate * 0.015));
        }
        const noiseSrc = this.audioCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        const noiseFilter = this.audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(7000, now);
        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.015 * (this.volume / 0.5), now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioCtx.destination);
        noiseSrc.start(now);
      };

      playChord();
      this.synthInterval = window.setInterval(playChord, 3500);
    } catch {
      this.isProceduralPlaying = false;
    }
  }

  private stopProcedural() {
    this.isProceduralPlaying = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

export const bgmManager = new BGMManager();
