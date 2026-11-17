/**
 * Audio synthesis helper using Web Audio API
 * Generates an extended, attention-grabbing harmonic chime (~5.5s) when study timer finishes
 */
type AudioContextCtor = typeof AudioContext;

let sharedCtx: AudioContext | null = null;
let activeMasterGain: GainNode | null = null;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

function getSharedContext(): AudioContext | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

export function unlockAudioContext(): void {
  try {
    const ctx = getSharedContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  } catch {
    // ignore browser audio unlock errors
  }
}

export function stopChimeSound(): void {
  try {
    if (activeMasterGain && sharedCtx) {
      const now = sharedCtx.currentTime;
      activeMasterGain.gain.cancelScheduledValues(now);
      activeMasterGain.gain.setValueAtTime(activeMasterGain.gain.value, now);
      activeMasterGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      activeMasterGain = null;
    }
  } catch {
    // ignore
  }
}

export function playChimeSound(): void {
  try {
    const ctx = getSharedContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    stopChimeSound();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1, ctx.currentTime);
    masterGain.connect(ctx.destination);
    activeMasterGain = masterGain;

    const now = ctx.currentTime;

    // 3 clear bell-chime sequences spaced over ~5.5 seconds so the user notices immediately
    const cycleOffsets = [0, 1.7, 3.4];
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5 -> G#5 -> B5 -> E6

    cycleOffsets.forEach((cycleStart) => {
      notes.forEach((freq, idx) => {
        const startTime = now + cycleStart + idx * 0.14;
        const duration = idx === notes.length - 1 ? 1.85 : 1.35;

        // Warm fundamental tone
        const mainOsc = ctx.createOscillator();
        const mainGain = ctx.createGain();
        mainOsc.type = 'sine';
        mainOsc.frequency.setValueAtTime(freq, startTime);

        mainGain.gain.setValueAtTime(0.0001, startTime);
        mainGain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
        mainGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        mainOsc.connect(mainGain);
        mainGain.connect(masterGain);

        mainOsc.start(startTime);
        mainOsc.stop(startTime + duration + 0.05);

        // Crisp harmonic overtone for clear audibility on laptop & phone speakers
        const overtoneOsc = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtoneOsc.type = 'triangle';
        overtoneOsc.frequency.setValueAtTime(freq * 2, startTime);

        overtoneGain.gain.setValueAtTime(0.0001, startTime);
        overtoneGain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(masterGain);

        overtoneOsc.start(startTime);
        overtoneOsc.stop(startTime + 0.6);
      });
    });
  } catch (err) {
    console.warn('Audio synthesis not supported or prevented by browser policy:', err);
  }
}
