/**
 * Audio synthesis helper using Web Audio API
 * Generates a clean, relaxing chime sound when study timer finishes
 */
type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export function playChimeSound(): void {
  try {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    const ctx = new Ctor();

    const now = ctx.currentTime;
    
    // Play a gentle two-tone harmonic chime (E5 -> G#5 -> B5)
    const freqs = [659.25, 830.61, 987.77];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.25);
    });
  } catch (err) {
    console.warn('Audio synthesis not supported or prevented by browser policy:', err);
  }
}
