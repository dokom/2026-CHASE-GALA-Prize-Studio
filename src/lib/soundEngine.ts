/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class HolidaySoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor(initialMuted: boolean = false) {
    this.isMuted = initialMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Crystalline Music-Box / Celesta Tick + Subtle Sleigh Bell Shimmer
   */
  playReelTick(progress: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Holiday pentatonic intervals as reel advances towards the final prize
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5];
      const noteIdx = Math.min(
        Math.floor(progress * scale.length),
        scale.length - 1
      );
      const freq = scale[noteIdx];

      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Metallic celesta harmonic (3x frequency)
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 3, now);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.04, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 0.13);
      overtone.stop(now + 0.13);
    } catch {
      // Audio safety
    }
  }

  /**
   * Rising Suspense Swell during the final countdown / drumroll
   */
  playSuspenseRiser(durationSec: number = 2.0) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + durationSec);

      // Low-pass filter to keep it warm and orchestral
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + durationSec);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + durationSec * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    } catch {
      // Audio safety
    }
  }

  /**
   * Grand Holiday Orchestral Chime & Harp Fanfare on Reveal
   */
  playWinnerFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Lush C-Major 9th / Celestial Holiday Chord Arpeggio
      const notes = [
        { freq: 261.63, delay: 0.0, dur: 2.8, vol: 0.15 }, // C4
        { freq: 329.63, delay: 0.06, dur: 2.6, vol: 0.14 }, // E4
        { freq: 392.0, delay: 0.12, dur: 2.5, vol: 0.14 }, // G4
        { freq: 493.88, delay: 0.18, dur: 2.4, vol: 0.13 }, // B4
        { freq: 587.33, delay: 0.24, dur: 2.4, vol: 0.13 }, // D5
        { freq: 659.25, delay: 0.3, dur: 2.5, vol: 0.13 }, // E5
        { freq: 783.99, delay: 0.36, dur: 2.8, vol: 0.16 }, // G5
        { freq: 1046.5, delay: 0.44, dur: 3.5, vol: 0.22 }, // C6 (Tubular Bell Peak)
      ];

      notes.forEach(({ freq, delay, dur, vol }) => {
        const start = now + delay;
        const osc = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(freq * 2, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        harmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        harmonic.start(start);
        osc.stop(start + dur + 0.05);
        harmonic.stop(start + dur + 0.05);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Sleigh Bell Jingle for celebration
   */
  playSleighJingle() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const jinglePitches = [2093, 2349, 2637, 3136];

      jinglePitches.forEach((freq, idx) => {
        const start = now + idx * 0.04;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.05, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {
      // Audio safety
    }
  }
}
