// Web Audio API Synthesizer for High-Urgency Emergency Siren (Zero External Files)

class EmergencyAudioAlert {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;

  public playUrgentTone(): void {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.isPlaying = true;

      let highPitch = true;
      const playBeep = () => {
        if (!this.isPlaying || !this.audioCtx) return;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        // Alternating European/Emergency frequency pair (880Hz / 440Hz)
        osc.frequency.setValueAtTime(highPitch ? 880 : 440, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);

        highPitch = !highPitch;
        this.timer = window.setTimeout(playBeep, 450);
      };

      playBeep();
    } catch (e) {
      console.warn('Web Audio playback prevented by browser autoplay policy:', e);
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

export const emergencyAudio = new EmergencyAudioAlert();
