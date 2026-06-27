/**
 * Sound effects using the Web Audio API.
 * No external files needed — all sounds are synthesized.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  // Resume if suspended (browsers require user interaction first)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Buzzer sound — plays on timer expiry.
 * A short, low-pitched buzz.
 */
export function playBuzzer(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(180, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.6);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.0);
  } catch {
    // Silently fail if audio isn't available
  }
}

/**
 * Celebration sound — plays when points are awarded (correct answer).
 * A rising arpeggio with a bright tone.
 */
export function playCelebration(): void {
  try {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.25);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch {
    // Silently fail if audio isn't available
  }
}

/**
 * Click/select sound — plays when a question card is selected.
 * A card-flip whoosh sound.
 */
export function playSelect(): void {
  try {
    const ctx = getAudioContext();

    // White noise burst for the "flip" texture
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to shape the noise into a "swish"
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.08);
    filter.Q.setValueAtTime(1, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.1);
  } catch {
    // Silently fail if audio isn't available
  }
}

/**
 * Tick sound — plays each second while timer is counting down.
 * A soft, short click that gets higher-pitched and louder in the last 10 seconds.
 */
export function playTick(remainingTime: number): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // In the last 10 seconds, pitch goes up and volume increases
    const isUrgent = remainingTime <= 10;
    const freq = isUrgent ? 1200 + (10 - remainingTime) * 50 : 800;
    const vol = isUrgent ? 0.12 + (10 - remainingTime) * 0.015 : 0.06;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.06);
  } catch {
    // Silently fail if audio isn't available
  }
}
