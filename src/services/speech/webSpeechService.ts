import { VoiceOption } from '../../types/notice';

export type SpeechPlaybackStatus = 'idle' | 'playing' | 'paused' | 'error';

export interface SpeechStatusState {
  status: SpeechPlaybackStatus;
  currentText: string;
  voiceName: string;
  rate: number;
  errorMessage?: string;
  hasBengaliVoice: boolean;
}

class WebSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speechRate: number = 1.0;
  private statusListeners: Set<(state: SpeechStatusState) => void> = new Set();

  private currentState: SpeechStatusState = {
    status: 'idle',
    currentText: '',
    voiceName: '',
    rate: 1.0,
    hasBengaliVoice: false,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (this.synth.addEventListener) {
        this.synth.addEventListener('voiceschanged', () => {
          this.loadVoices();
        });
      } else if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public loadVoices(): VoiceOption[] {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices();

    const hasBengali = this.voices.some((v) => v.lang.startsWith('bn'));
    this.currentState.hasBengaliVoice = hasBengali;

    // Pick a default voice if not selected
    if (!this.selectedVoice && this.voices.length > 0) {
      const bnVoice = this.voices.find((v) => v.lang.startsWith('bn'));
      const enVoice = this.voices.find((v) => v.lang.startsWith('en'));
      this.selectedVoice = bnVoice || enVoice || this.voices[0];
      this.currentState.voiceName = this.selectedVoice.name;
    }

    this.notifyState();
    return this.getAvailableVoices();
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const list = this.voices.length > 0 ? this.voices : this.synth.getVoices();
    return list.map((v) => ({
      voice: v,
      lang: v.lang,
      name: `${v.name} (${v.lang})${v.default ? ' [Default]' : ''}`,
      isBengali: v.lang.startsWith('bn'),
      isEnglish: v.lang.startsWith('en'),
    }));
  }

  public hasBengaliVoice(): boolean {
    return this.voices.some((v) => v.lang.startsWith('bn'));
  }

  public setVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice = voice;
    this.currentState.voiceName = voice.name;
    this.notifyState();
  }

  public setRate(rate: number): void {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
    this.currentState.rate = this.speechRate;
    this.notifyState();
  }

  public speak(
    text: string,
    preferLanguage?: 'bn' | 'en',
    onComplete?: () => void
  ): { success: boolean; warning?: string } {
    if (!this.synth) {
      this.updateStatus('error', 'Speech synthesis is not supported on this browser.');
      return { success: false, warning: 'Speech synthesis is not supported on this device/browser.' };
    }

    // Cancel any running speech
    this.stop();

    if (!text || !text.trim()) {
      return { success: false, warning: 'No readable text content provided.' };
    }

    const cleanText = text.trim();
    let warning: string | undefined;

    // Language matching check
    const isBengaliText = /[\u0980-\u09FF]/.test(cleanText) || preferLanguage === 'bn';
    const hasBn = this.hasBengaliVoice();

    let targetVoice = this.selectedVoice;

    if (isBengaliText) {
      if (hasBn) {
        // Find best Bengali voice
        const bnVoice = this.voices.find((v) => v.lang.startsWith('bn'));
        if (bnVoice) targetVoice = bnVoice;
      } else {
        warning =
          'Notice: This device does not have an installed Bengali speech voice. Playing using fallback voice, which may sound unnatural for Bengali words.';
      }
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    } else if (isBengaliText && hasBn) {
      utterance.lang = 'bn-BD';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = this.speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.updateStatus('playing', cleanText);
    };

    utterance.onpause = () => {
      this.updateStatus('paused', cleanText);
    };

    utterance.onresume = () => {
      this.updateStatus('playing', cleanText);
    };

    utterance.onend = () => {
      this.updateStatus('idle', '');
      this.currentUtterance = null;
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        this.updateStatus('error', `Speech playback error: ${e.error}`);
      } else {
        this.updateStatus('idle', '');
      }
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);

    return { success: true, warning };
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.updateStatus('paused', this.currentState.currentText);
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.updateStatus('playing', this.currentState.currentText);
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.updateStatus('idle', '');
    }
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public subscribe(listener: (state: SpeechStatusState) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getState(): SpeechStatusState {
    return { ...this.currentState };
  }

  private updateStatus(status: SpeechPlaybackStatus, text: string, error?: string): void {
    this.currentState = {
      ...this.currentState,
      status,
      currentText: text,
      errorMessage: error,
    };
    this.notifyState();
  }

  private notifyState(): void {
    for (const listener of this.statusListeners) {
      listener({ ...this.currentState });
    }
  }
}

export const speechService = new WebSpeechService();
