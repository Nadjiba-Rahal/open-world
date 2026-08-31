"use client";

import {
  createDefaultAudioSettings,
  type AmbienceTrack,
  type AudioSettings,
  type MusicTrack,
  type ResourceKind,
  type SfxId,
  type WeatherKind
} from "@afterlight/shared";

export const AUDIO_STORAGE_KEY = "afterlight.audio";

type Beds = { music: MusicTrack; ambience: AmbienceTrack; weather: WeatherKind };

const MUSIC_ROOT: Record<MusicTrack, number[]> = {
  "lumenfall-day": [261.63, 293.66, 329.63, 392.0, 440.0],
  "lumenfall-night": [196.0, 220.0, 246.94, 293.66, 329.63],
  moonwood: [174.61, 196.0, 233.08, 261.63, 311.13],
  "astral-vale": [207.65, 246.94, 311.13, 415.3, 493.88],
  homestead: [246.94, 277.18, 329.63, 370.0, 440.0]
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function loadSettings(): AudioSettings {
  if (typeof window === "undefined") return createDefaultAudioSettings();
  try {
    const stored = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!stored) return createDefaultAudioSettings();
    const parsed = JSON.parse(stored) as Partial<AudioSettings>;
    const defaults = createDefaultAudioSettings();
    return {
      masterVolume: clamp01(parsed.masterVolume ?? defaults.masterVolume),
      musicVolume: clamp01(parsed.musicVolume ?? defaults.musicVolume),
      sfxVolume: clamp01(parsed.sfxVolume ?? defaults.sfxVolume),
      ambienceVolume: clamp01(parsed.ambienceVolume ?? defaults.ambienceVolume),
      muted: Boolean(parsed.muted)
    };
  } catch {
    return createDefaultAudioSettings();
  }
}

export function sfxForResourceKind(kind: ResourceKind, itemId?: string): SfxId {
  if (kind === "tree") return "gather-tree";
  if (kind === "boulder") return itemId === "ore" ? "gather-ore" : "gather-stone";
  if (kind === "herbs") return "gather-herb";
  if (kind === "fruit") return "gather-fruit";
  if (kind === "crystals") return "gather-crystal";
  if (kind === "fishing") return "gather-fish";
  return "gather-plant";
}

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private settings = loadSettings();
  private beds: Beds | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private ambienceNodes: AudioNode[] = [];
  private weatherNodes: AudioNode[] = [];
  private noise: AudioBuffer | null = null;
  private lastFootstep = 0;
  private listeners = new Set<(settings: AudioSettings) => void>();

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  subscribe(listener: (settings: AudioSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setSettings(partial: Partial<AudioSettings>): AudioSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      masterVolume: clamp01(partial.masterVolume ?? this.settings.masterVolume),
      musicVolume: clamp01(partial.musicVolume ?? this.settings.musicVolume),
      sfxVolume: clamp01(partial.sfxVolume ?? this.settings.sfxVolume),
      ambienceVolume: clamp01(partial.ambienceVolume ?? this.settings.ambienceVolume)
    };
    if (typeof window !== "undefined") window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    this.applyGains();
    this.listeners.forEach((listener) => listener(this.getSettings()));
    return this.getSettings();
  }

  async resume(): Promise<void> {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.ambienceGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.ambienceGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise(2);
      this.applyGains();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.beds) this.startBeds(this.beds);
  }

  setBeds(beds: Beds): void {
    const same =
      this.beds &&
      this.beds.music === beds.music &&
      this.beds.ambience === beds.ambience &&
      this.beds.weather === beds.weather;
    this.beds = beds;
    if (!this.ctx || this.ctx.state !== "running" || same) return;
    this.startBeds(beds);
  }

  playSfx(id: SfxId): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const t = this.ctx.currentTime;
    switch (id) {
      case "gather-tree":
        this.noiseBurst(180, 0.18, 0.22);
        this.tone(140, 0.12, "triangle", 0.08);
        break;
      case "gather-stone":
        this.noiseBurst(90, 0.12, 0.28);
        this.tone(90, 0.08, "square", 0.05);
        break;
      case "gather-ore":
        this.tone(420, 0.1, "square", 0.06);
        this.noiseBurst(220, 0.14, 0.2);
        break;
      case "gather-plant":
      case "gather-herb":
        this.tone(520, 0.08, "sine", 0.07);
        this.tone(740, 0.1, "sine", 0.04, 0.04);
        break;
      case "gather-fruit":
        this.tone(640, 0.07, "sine", 0.08);
        this.tone(880, 0.09, "triangle", 0.05, 0.03);
        break;
      case "gather-crystal":
        this.tone(880, 0.18, "sine", 0.07);
        this.tone(1320, 0.22, "sine", 0.04, 0.05);
        break;
      case "gather-fish":
        this.tone(280, 0.16, "sine", 0.06);
        this.noiseBurst(400, 0.2, 0.08);
        break;
      case "craft":
        this.tone(196, 0.08, "triangle", 0.08);
        this.tone(247, 0.1, "triangle", 0.06, 0.08);
        this.tone(330, 0.12, "triangle", 0.05, 0.16);
        break;
      case "cook":
        this.noiseBurst(500, 0.28, 0.1);
        this.tone(180, 0.2, "sine", 0.05);
        break;
      case "place-furniture":
        this.tone(150, 0.1, "triangle", 0.09);
        this.noiseBurst(120, 0.1, 0.16);
        break;
      case "store-furniture":
        this.tone(220, 0.08, "triangle", 0.06);
        this.tone(140, 0.1, "triangle", 0.05, 0.06);
        break;
      case "rotate-furniture":
        this.tone(360, 0.07, "sine", 0.05);
        this.tone(420, 0.07, "sine", 0.04, 0.04);
        break;
      case "npc-talk":
        this.tone(310, 0.05, "sine", 0.05);
        this.tone(360, 0.06, "sine", 0.04, 0.05);
        break;
      case "quest-accept":
        this.tone(392, 0.1, "sine", 0.07);
        this.tone(523, 0.14, "sine", 0.06, 0.08);
        break;
      case "quest-complete":
        this.tone(392, 0.12, "triangle", 0.08);
        this.tone(523, 0.14, "triangle", 0.07, 0.1);
        this.tone(784, 0.22, "sine", 0.06, 0.22);
        break;
      case "xp-gain":
        this.tone(660, 0.07, "sine", 0.05);
        this.tone(880, 0.09, "sine", 0.04, 0.04);
        break;
      case "level-up":
        this.tone(523, 0.12, "sine", 0.08);
        this.tone(659, 0.14, "sine", 0.07, 0.1);
        this.tone(784, 0.16, "sine", 0.06, 0.2);
        this.tone(1046, 0.28, "triangle", 0.05, 0.32);
        break;
      case "reward":
        this.tone(587, 0.1, "triangle", 0.07);
        this.tone(880, 0.16, "sine", 0.05, 0.08);
        break;
      case "discovery":
        this.tone(440, 0.16, "sine", 0.07);
        this.tone(660, 0.2, "sine", 0.05, 0.08);
        this.tone(880, 0.28, "sine", 0.04, 0.16);
        break;
      case "portal-travel":
        this.tone(110, 0.4, "sawtooth", 0.04);
        this.tone(220, 0.45, "sine", 0.06, 0.05);
        this.tone(880, 0.35, "sine", 0.04, 0.12);
        break;
      case "world-event":
        this.tone(247, 0.12, "triangle", 0.06);
        this.tone(370, 0.16, "sine", 0.05, 0.08);
        break;
      case "ui-click":
        this.tone(720, 0.04, "square", 0.035);
        break;
      case "ui-hover":
        this.tone(980, 0.025, "sine", 0.02);
        break;
      case "footstep":
        this.noiseBurst(70, 0.06, 0.12);
        break;
      case "emote":
        this.tone(494, 0.08, "sine", 0.06);
        this.tone(740, 0.12, "triangle", 0.05, 0.06);
        break;
      default:
        this.tone(440, 0.08, "sine", 0.05);
    }
    void t;
  }

  playFootstep(): void {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.lastFootstep < 340) return;
    this.lastFootstep = now;
    this.playSfx("footstep");
  }

  private applyGains(): void {
    if (!this.master || !this.musicGain || !this.ambienceGain || !this.sfxGain) return;
    const mute = this.settings.muted ? 0 : 1;
    this.master.gain.value = this.settings.masterVolume * mute;
    this.musicGain.gain.value = this.settings.musicVolume * 0.22;
    this.ambienceGain.gain.value = this.settings.ambienceVolume * 0.35;
    this.sfxGain.gain.value = this.settings.sfxVolume;
  }

  private startBeds(beds: Beds): void {
    this.stopMusic();
    this.stopNodes(this.ambienceNodes);
    this.stopNodes(this.weatherNodes);
    this.ambienceNodes = [];
    this.weatherNodes = [];
    this.startMusic(beds.music);
    this.startAmbience(beds.ambience);
    if (beds.weather === "rain" || beds.weather === "snow") this.startWeather(beds.weather);
  }

  private startMusic(track: MusicTrack): void {
    if (!this.ctx) return;
    const notes = MUSIC_ROOT[track];
    const interval = track === "astral-vale" ? 1400 : track === "lumenfall-night" || track === "moonwood" ? 900 : 720;
    const wave: OscillatorType = track === "astral-vale" ? "sine" : track === "moonwood" ? "triangle" : "sine";
    this.musicStep = 0;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      const freq = notes[this.musicStep % notes.length]! * (this.musicStep % 7 === 0 ? 0.5 : 1);
      this.musicStep += 1;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = track === "astral-vale" ? 1800 : 900;
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.85);
      osc.connect(filter).connect(gain).connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    };
    tick();
    this.musicTimer = window.setInterval(tick, interval);
  }

  private startAmbience(track: AmbienceTrack): void {
    if (!this.ctx || !this.ambienceGain || !this.noise) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    const gain = this.ctx.createGain();
    if (track === "forest-day") {
      filter.frequency.value = 2400;
      filter.Q.value = 0.6;
      gain.gain.value = 0.08;
    } else if (track === "forest-night") {
      filter.frequency.value = 1800;
      filter.Q.value = 1.1;
      gain.gain.value = 0.07;
    } else if (track === "moonwood-ambience") {
      filter.frequency.value = 1200;
      filter.Q.value = 0.8;
      gain.gain.value = 0.09;
    } else if (track === "astral-ambience") {
      filter.frequency.value = 700;
      filter.Q.value = 0.4;
      gain.gain.value = 0.1;
    } else if (track === "home-ambience") {
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
      gain.gain.value = 0.05;
    } else {
      filter.frequency.value = 1600;
      gain.gain.value = 0.06;
    }
    source.connect(filter).connect(gain).connect(this.ambienceGain);
    source.start();
    this.ambienceNodes.push(source, filter, gain);

    if (track === "forest-night") {
      const cricket = this.ctx.createOscillator();
      const cricketGain = this.ctx.createGain();
      cricket.type = "square";
      cricket.frequency.value = 2400;
      cricketGain.gain.value = 0.012;
      cricket.connect(cricketGain).connect(this.ambienceGain);
      cricket.start();
      this.ambienceNodes.push(cricket, cricketGain);
    }
    if (track === "astral-ambience" || track === "moonwood-ambience") {
      const pad = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();
      pad.type = "sine";
      pad.frequency.value = track === "astral-ambience" ? 55 : 82;
      padGain.gain.value = 0.04;
      pad.connect(padGain).connect(this.ambienceGain);
      pad.start();
      this.ambienceNodes.push(pad, padGain);
    }
  }

  private startWeather(kind: "rain" | "snow"): void {
    if (!this.ctx || !this.ambienceGain || !this.noise) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = kind === "rain" ? "highpass" : "lowpass";
    filter.frequency.value = kind === "rain" ? 1800 : 500;
    const gain = this.ctx.createGain();
    gain.gain.value = kind === "rain" ? 0.12 : 0.06;
    source.connect(filter).connect(gain).connect(this.ambienceGain);
    source.start();
    this.weatherNodes.push(source, filter, gain);
  }

  private stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private stopNodes(nodes: AudioNode[]): void {
    for (const node of nodes) {
      try {
        if ("stop" in node && typeof (node as AudioScheduledSourceNode).stop === "function") (node as AudioScheduledSourceNode).stop();
      } catch {
        /* already stopped */
      }
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    }
  }

  private makeNoise(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private tone(freq: number, dur: number, type: OscillatorType, volume: number, delay = 0): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(freq: number, dur: number, volume: number): void {
    if (!this.ctx || !this.sfxGain || !this.noise) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    source.connect(filter).connect(gain).connect(this.sfxGain);
    source.start();
    source.stop(this.ctx.currentTime + dur + 0.02);
  }
}

export const gameAudio = new GameAudioEngine();

export function playSfx(id: SfxId): void {
  void gameAudio.resume().then(() => gameAudio.playSfx(id));
}
