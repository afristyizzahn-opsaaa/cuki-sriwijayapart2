import { useSettingsStore } from '../stores/useSettingsStore';

const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

const gateAudioUrl = asset('assets/audio/for-gate.mp3');
const websiteAudioUrl = asset('assets/audio/for-website.mp3');
const gateAudioInitialGain = 1;
const gateAudioBoostGain = 5;
const gateAudioBoostDelaySeconds = 2;
const gateCrossfadeSeconds = 0.5;
const websiteStartBeforeEndSeconds = 3;
const websiteFadeInSeconds = 1;
const websiteFadeOutSeconds = 0.8;
const safeGainFloor = 0.0001;

type WebAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

interface MediaGraph {
  readonly element: HTMLMediaElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

class CukiAudioManager {
  private audioContext: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private gateAudio: HTMLAudioElement | null = null;
  private websiteAudio: HTMLAudioElement | null = null;
  private gateGraph: MediaGraph | null = null;
  private websiteGraph: MediaGraph | null = null;
  private gateVideoElement: HTMLVideoElement | null = null;
  private gatePlaybackStarted = false;
  private gateCrossfadeStarted = false;
  private gateCompleted = false;
  private websiteLoopFadeQueued = false;
  private websiteLoopRestartToken = 0;

  bindGateVideo(video: HTMLVideoElement): void {
    this.gateVideoElement = video;
    video.muted = true;
    video.volume = 1;
    this.ensureAudioContext();
    this.ensureGateGraph();
    this.ensureWebsiteGraph();
  }

  releaseGateVideo(video: HTMLVideoElement): void {
    if (this.gateVideoElement !== video) {
      return;
    }

    this.gateVideoElement = null;
    this.gatePlaybackStarted = false;
  }

  handleGateVideoPlay(): void {
    if (this.gateCompleted) {
      return;
    }

    const audioContext = this.ensureAudioContext();
    const gateAudio = this.ensureGateAudioElement();
    const gateGraph = this.gateGraph;
    if (!audioContext || !gateAudio || !gateGraph) {
      return;
    }

    void this.resumeAudioContext(audioContext);

    gateAudio.loop = false;
    gateAudio.currentTime = 0;
    gateAudio.volume = 1;
    void gateAudio.play().catch((error) => {
      console.error('CUKI GATE AUDIO PLAYBACK FAILED', error);
    });

    const now = audioContext.currentTime;
    gateGraph.gain.gain.cancelScheduledValues(now);
    gateGraph.gain.gain.setValueAtTime(gateAudioInitialGain, now);
    gateGraph.gain.gain.linearRampToValueAtTime(gateAudioBoostGain, now + gateAudioBoostDelaySeconds);
    this.gatePlaybackStarted = true;
  }

  handleGateVideoProgress(currentTime: number, duration: number): void {
    if (
      this.gateCompleted ||
      !this.gatePlaybackStarted ||
      this.gateCrossfadeStarted ||
      !Number.isFinite(duration) ||
      duration <= gateCrossfadeSeconds
    ) {
      return;
    }

    if (duration - currentTime > websiteStartBeforeEndSeconds) {
      return;
    }

    this.beginGateCrossfade();
  }

  handleGateVideoEnded(): void {
    this.gateCompleted = true;
    this.gatePlaybackStarted = false;
    this.gateCrossfadeStarted = false;
    this.websiteLoopFadeQueued = false;

    const audioContext = this.audioContext;
    const gateAudio = this.gateAudio;
    const gateGraph = this.gateGraph;

    if (audioContext && gateAudio && gateGraph) {
      const now = audioContext.currentTime;
      gateAudio.pause();
      gateAudio.currentTime = 0;
      gateGraph.gain.gain.cancelScheduledValues(now);
      gateGraph.gain.gain.setValueAtTime(safeGainFloor, now);
    }
  }

  syncFromSettings(): void {
    const audioContext = this.audioContext;
    const gateGraph = this.gateGraph;
    const websiteGraph = this.websiteGraph;

    if (!audioContext) {
      return;
    }

    const now = audioContext.currentTime;
    const targetGateGain = this.getGateTargetGain();
    const targetWebsiteGain = this.getWebsiteTargetGain();

    if (gateGraph) {
      gateGraph.gain.gain.cancelScheduledValues(now);
      gateGraph.gain.gain.setValueAtTime(Math.max(gateGraph.gain.gain.value, safeGainFloor), now);
      gateGraph.gain.gain.linearRampToValueAtTime(targetGateGain, now + 0.15);
    }

    if (websiteGraph) {
      websiteGraph.gain.gain.cancelScheduledValues(now);
      websiteGraph.gain.gain.setValueAtTime(Math.max(websiteGraph.gain.gain.value, safeGainFloor), now);
      websiteGraph.gain.gain.linearRampToValueAtTime(targetWebsiteGain, now + 0.15);
    }
  }

  private ensureAudioContext(): AudioContext | null {
    if (this.audioContext) {
      return this.audioContext;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const audioWindow = window as WebAudioWindow;
    const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      return null;
    }

    this.audioContext = new AudioContextConstructor();
    this.ensureCompressor();
    return this.audioContext;
  }

  private ensureCompressor(): DynamicsCompressorNode | null {
    const audioContext = this.audioContext;
    if (!audioContext) {
      return null;
    }

    if (this.compressor) {
      return this.compressor;
    }

    this.compressor = audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 24;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.24;
    this.compressor.connect(audioContext.destination);
    return this.compressor;
  }

  private ensureGateAudioElement(): HTMLAudioElement | null {
    if (this.gateAudio) {
      return this.gateAudio;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const audio = new Audio(gateAudioUrl);
    audio.preload = 'auto';
    audio.loop = false;
    audio.crossOrigin = 'anonymous';
    audio.load();

    this.gateAudio = audio;
    return audio;
  }

  private ensureWebsiteAudioElement(): HTMLAudioElement | null {
    if (this.websiteAudio) {
      return this.websiteAudio;
    }

    if (typeof window === 'undefined') {
      return null;
    }

    const audio = new Audio(websiteAudioUrl);
    audio.preload = 'auto';
    audio.loop = false;
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('ended', this.handleWebsiteEnded);
    audio.addEventListener('timeupdate', this.handleWebsiteTimeUpdate);
    audio.addEventListener('error', this.handleWebsiteError);
    audio.load();

    this.websiteAudio = audio;
    return audio;
  }

  private ensureGateGraph(): MediaGraph | null {
    const audio = this.ensureGateAudioElement();
    if (!audio) {
      return null;
    }

    if (this.gateGraph?.element === audio) {
      return this.gateGraph;
    }

    const audioContext = this.ensureAudioContext();
    if (!audioContext) {
      this.gateGraph = null;
      return null;
    }

    const source = audioContext.createMediaElementSource(audio);
    const gain = audioContext.createGain();
    gain.gain.value = safeGainFloor;
    source.connect(gain);
    gain.connect(this.ensureCompressor() ?? audioContext.destination);

    this.gateGraph = { element: audio, source, gain };
    return this.gateGraph;
  }

  private ensureWebsiteGraph(): MediaGraph | null {
    const audio = this.ensureWebsiteAudioElement();
    if (!audio) {
      return null;
    }

    if (this.websiteGraph?.element === audio) {
      return this.websiteGraph;
    }

    const audioContext = this.ensureAudioContext();
    if (!audioContext) {
      this.websiteGraph = null;
      return null;
    }

    const source = audioContext.createMediaElementSource(audio);
    const gain = audioContext.createGain();
    gain.gain.value = safeGainFloor;
    source.connect(gain);
    gain.connect(this.ensureCompressor() ?? audioContext.destination);

    this.websiteGraph = { element: audio, source, gain };
    return this.websiteGraph;
  }

  private beginGateCrossfade(): void {
    if (this.gateCrossfadeStarted || this.gateCompleted) {
      return;
    }

    const audioContext = this.ensureAudioContext();
    const gateAudio = this.gateAudio;
    const gateGraph = this.gateGraph;
    const websiteAudio = this.websiteAudio;
    const websiteGraph = this.ensureWebsiteGraph();

    if (!audioContext || !gateAudio || !gateGraph || !websiteAudio || !websiteGraph) {
      return;
    }

    void this.resumeAudioContext(audioContext);

    this.gateCrossfadeStarted = true;
    this.websiteLoopFadeQueued = false;

    const now = audioContext.currentTime;
    const websiteTargetGain = this.getWebsiteTargetGain();

    gateGraph.gain.gain.cancelScheduledValues(now);
    gateGraph.gain.gain.setValueAtTime(Math.max(gateGraph.gain.gain.value, safeGainFloor), now);
    gateGraph.gain.gain.linearRampToValueAtTime(safeGainFloor, now + gateCrossfadeSeconds);

    websiteGraph.gain.gain.cancelScheduledValues(now);
    websiteGraph.gain.gain.setValueAtTime(safeGainFloor, now);
    websiteGraph.gain.gain.linearRampToValueAtTime(websiteTargetGain, now + gateCrossfadeSeconds);

    gateAudio.loop = false;
    websiteAudio.loop = false;
    websiteAudio.currentTime = 0;
    void websiteAudio.play().catch((error) => {
      console.error('CUKI WEBSITE AUDIO PLAYBACK FAILED', error);
    });
  }

  private handleWebsiteTimeUpdate = (): void => {
    const websiteAudio = this.websiteAudio;
    const websiteGraph = this.websiteGraph;
    const audioContext = this.audioContext;

    if (!websiteAudio || !websiteGraph || !audioContext || websiteAudio.paused) {
      return;
    }

    const duration = websiteAudio.duration;
    if (!Number.isFinite(duration) || duration <= websiteFadeOutSeconds) {
      return;
    }

    if (this.websiteLoopFadeQueued) {
      return;
    }

    if (duration - websiteAudio.currentTime > websiteFadeOutSeconds) {
      return;
    }

    this.websiteLoopFadeQueued = true;
    const now = audioContext.currentTime;
    websiteGraph.gain.gain.cancelScheduledValues(now);
    websiteGraph.gain.gain.setValueAtTime(Math.max(websiteGraph.gain.gain.value, safeGainFloor), now);
    websiteGraph.gain.gain.linearRampToValueAtTime(safeGainFloor, now + websiteFadeOutSeconds);
  };

  private handleWebsiteEnded = (): void => {
    const websiteAudio = this.websiteAudio;
    const websiteGraph = this.websiteGraph;
    const audioContext = this.audioContext;

    if (!websiteAudio || !websiteGraph || !audioContext) {
      return;
    }

    this.websiteLoopRestartToken += 1;
    const restartToken = this.websiteLoopRestartToken;
    const targetGain = this.getWebsiteTargetGain();
    const now = audioContext.currentTime;

    websiteAudio.currentTime = 0;
    websiteGraph.gain.gain.cancelScheduledValues(now);
    websiteGraph.gain.gain.setValueAtTime(safeGainFloor, now);
    websiteGraph.gain.gain.linearRampToValueAtTime(targetGain, now + websiteFadeInSeconds);
    this.websiteLoopFadeQueued = false;

    void websiteAudio.play().catch((error) => {
      console.error('CUKI WEBSITE AUDIO LOOP FAILED', error);
    });

    window.setTimeout(() => {
      if (restartToken !== this.websiteLoopRestartToken) {
        return;
      }
      this.websiteLoopFadeQueued = false;
    }, Math.ceil(websiteFadeInSeconds * 1000));
  };

  private handleWebsiteError = (): void => {
    console.error('CUKI WEBSITE AUDIO FAILED', this.websiteAudio?.currentSrc ?? websiteAudioUrl);
  };

  private getGateTargetGain(): number {
    const { bgmVolume, isMuted } = this.readSettings();
    if (isMuted) {
      return safeGainFloor;
    }

    return clampVolume(Math.max(gateAudioInitialGain, bgmVolume) * gateAudioBoostGain);
  }

  private getWebsiteTargetGain(): number {
    const { bgmVolume, isMuted } = this.readSettings();
    if (isMuted) {
      return safeGainFloor;
    }

    return clampVolume(Math.max(bgmVolume, gateAudioInitialGain) * gateAudioBoostGain);
  }

  private readSettings(): { bgmVolume: number; isMuted: boolean } {
    try {
      const settingsStore = useSettingsStore.getState();
      return {
        bgmVolume: settingsStore.bgmVolume,
        isMuted: settingsStore.isMuted,
      };
    } catch {
      return {
        bgmVolume: 0.8,
        isMuted: false,
      };
    }
  }

  private async resumeAudioContext(audioContext: AudioContext): Promise<void> {
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        console.error('CUKI AUDIO CONTEXT RESUME FAILED', error);
      }
    }
  }
}

function clampVolume(volume: number): number {
  return Math.min(5, Math.max(safeGainFloor, volume));
}

export const cukiAudioManager = new CukiAudioManager();
