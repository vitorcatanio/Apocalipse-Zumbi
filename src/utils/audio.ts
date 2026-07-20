// Synthesized Web Audio API sound effects for military terminal look & feel
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function playTick() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // Web audio block
  }
}

export function playSuccessChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Low to high bright cyber synth
    [600, 800, 1200].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  } catch (e) {}
}

export function playErrorBuzz() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(85, now + 0.25);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // Apply simple bandpass to make it sound muffled/retro
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.25);
  } catch (e) {}
}

export function playTerminalAccess() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Quick tech beep-boop sequence
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      
      gain.gain.setValueAtTime(0.03, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  } catch (e) {}
}

export function playWarningAlarm(duration = 1.2) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    
    // Siren sweeping
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.linearRampToValueAtTime(800, now + duration / 2);
    osc1.frequency.linearRampToValueAtTime(400, now + duration);
    
    // Frequency modulation
    osc2.frequency.setValueAtTime(4, now); // 4Hz pulse
    const modulationGain = ctx.createGain();
    modulationGain.gain.setValueAtTime(40, now);
    
    osc2.connect(modulationGain);
    modulationGain.connect(osc1.frequency);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.04, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.04, now + duration - 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc1.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch (e) {}
}

export function playDecryptStatic(durationSec = 2) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Create random noise buffer
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.Q.setValueAtTime(3, now);
    
    // Sweep the filter to simulate decrypting scanner
    filter.frequency.exponentialRampToValueAtTime(2500, now + durationSec * 0.7);
    filter.frequency.exponentialRampToValueAtTime(800, now + durationSec);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseNode.start(now);
    noiseNode.stop(now + durationSec);
    
    // Add intermittent terminal access boops during decrypt
    for (let t = 0.2; t < durationSec; t += 0.4) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now + t);
      g.gain.setValueAtTime(0.02, now + t);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.1);
    }
  } catch (e) {}
}

export function playZombieGroan() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const oscMod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.linearRampToValueAtTime(55, now + 1.2);
    
    oscMod.type = 'sine';
    oscMod.frequency.setValueAtTime(22, now);
    modGain.gain.setValueAtTime(15, now);
    
    oscMod.connect(modGain);
    modGain.connect(osc.frequency);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);
    filter.Q.setValueAtTime(2, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.04, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.03, now + 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    oscMod.start(now);
    osc.stop(now + 1.2);
    oscMod.stop(now + 1.2);
  } catch (e) {}
}

