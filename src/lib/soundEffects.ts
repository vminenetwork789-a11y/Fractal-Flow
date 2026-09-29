// Web Audio API Synthesizer Sound Effects for System Notifications

let audioCtx: AudioContext | null = null;
let soundMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  try {
    const saved = localStorage.getItem('rebirth_matrix_sound_muted');
    if (saved !== null) {
      soundMuted = saved === 'true';
    }
  } catch {
    // Ignore storage issues
  }
  return soundMuted;
}

export function setSoundMuted(muted: boolean): void {
  soundMuted = muted;
  try {
    localStorage.setItem('rebirth_matrix_sound_muted', String(muted));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Play sound for New Registration (📝 การสมัครสมาชิก)
 * Upbeat 3-note ascending synth chime
 */
export function playRegistrationSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25]; // A4, C#5, E5 (Major chord)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  } catch (err) {
    console.debug('Audio playback error:', err);
  }
}

/**
 * Play sound for Rebirth Spawn (🌱 การโคลนนิ่ง)
 * Magical sparkling 4-note ascending crystal chime
 */
export function playRebirthSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (High sparkling arpeggio)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.46);
    });
  } catch (err) {
    console.debug('Audio playback error:', err);
  }
}

/**
 * Play sound for Rank Upgrade (⭐ การอัพเกรดผัง)
 * Triumphant golden fanfare chord
 */
export function playUpgradeSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord1 = [392.0, 493.88, 587.33]; // G4, B4, D5
    const chord2 = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    // Lead-in note
    chord1.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    });

    // Main triumphant chord
    chord2.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.12);
      gain.gain.setValueAtTime(0.01, now + 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.12);
      osc.stop(now + 0.72);
    });
  } catch (err) {
    console.debug('Audio playback error:', err);
  }
}
