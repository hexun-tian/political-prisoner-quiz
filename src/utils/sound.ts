/**
 * @file src/utils/sound.ts
 * @description 瀏覽器 Web Audio API 輕柔歷史氛圍配樂與紙張翻頁／蓋印音效工具。
 * 保持克制、輕柔的背景氛圍（「一點點就好」，不過度沉重壓迫），並搭配真實紙張翻頁觸感。
 */

let audioCtx: AudioContext | null = null;
let ambientMasterGain: GainNode | null = null;
let ambientStarted = false;
let motifIntervalId: number | null = null;
let motifIndex = 0;

// 輕柔內斂的反思小調音階（Hz），不過度低沉壓迫
const GENTLE_MOTIF_FREQS = [293.66, 220.0, 261.63, 246.94, 220.0, 196.0, 220.0, 293.66];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {
      // 忽略瀏覽器未授權前之自動播放限制
    });
  }
  return audioCtx;
}

/** 播放輕柔的微光琴鍵音 */
function playSoftTone(ctx: AudioContext, dest: AudioNode, freq: number): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const noteGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(620, now);

  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.linearRampToValueAtTime(0.028, now + 0.16);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

  osc.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(dest);

  osc.start(now);
  osc.stop(now + 3.0);
}

/**
 * 啟動或同步輕柔歷史氛圍背景配樂（音量克制、不搶戲）
 */
export function syncAmbientMusic(muted: boolean): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (!ambientStarted) {
      ambientMasterGain = ctx.createGain();
      ambientMasterGain.gain.setValueAtTime(0.0001, now);
      ambientMasterGain.connect(ctx.destination);

      // 輕柔低音襯底（純淨正弦波，無厚重鋸齒波）
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(280, now);
      padFilter.connect(ambientMasterGain);

      const padOsc1 = ctx.createOscillator();
      const padGain1 = ctx.createGain();
      padOsc1.type = 'sine';
      padOsc1.frequency.setValueAtTime(146.83, now); // D3
      padGain1.gain.setValueAtTime(0.016, now);
      padOsc1.connect(padGain1);
      padGain1.connect(padFilter);
      padOsc1.start(now);

      const padOsc2 = ctx.createOscillator();
      const padGain2 = ctx.createGain();
      padOsc2.type = 'sine';
      padOsc2.frequency.setValueAtTime(220.0, now); // A3
      padGain2.gain.setValueAtTime(0.011, now);
      padOsc2.connect(padGain2);
      padGain2.connect(padFilter);
      padOsc2.start(now);

      // 每 4.2 秒緩慢落下一顆輕柔的反思音符
      playSoftTone(ctx, ambientMasterGain, GENTLE_MOTIF_FREQS[0]);
      motifIndex = 1;

      motifIntervalId = window.setInterval(() => {
        if (!audioCtx || !ambientMasterGain || audioCtx.state !== 'running') return;
        const freq = GENTLE_MOTIF_FREQS[motifIndex % GENTLE_MOTIF_FREQS.length];
        motifIndex += 1;
        playSoftTone(ctx, ambientMasterGain, freq);
      }, 4200);

      ambientStarted = true;
    }

    if (ambientMasterGain) {
      ambientMasterGain.gain.cancelScheduledValues(now);
      ambientMasterGain.gain.setValueAtTime(
        Math.max(0.0001, ambientMasterGain.gain.value),
        now
      );
      ambientMasterGain.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.42, now + 0.65);
    }
  } catch {
    // 靜默容錯
  }
}

/** 釋放背景音樂計時器 */
export function disposeAmbientMusic(): void {
  if (motifIntervalId !== null) {
    window.clearInterval(motifIntervalId);
    motifIntervalId = null;
  }
}

/** 選擇選項時的輕微紙張點選聲 */
export function playPaperSelectSound(muted: boolean): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.06);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // 靜默容錯
  }
}

/** 換頁時的舊報紙翻頁沙沙聲 */
export function playPageTransitionSound(muted: boolean): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.14;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = 'bandpass';
    bandFilter.frequency.setValueAtTime(850, now);
    bandFilter.frequency.exponentialRampToValueAtTime(520, now + duration);
    bandFilter.Q.setValueAtTime(1.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSrc.connect(bandFilter);
    bandFilter.connect(gain);
    gain.connect(ctx.destination);
    noiseSrc.start(now);
  } catch {
    // 靜默容錯
  }
}

/** 公佈結果蓋下紅色印章時的沉穩蓋印聲（桌面厚實落印 ＋ 紙面接觸聲） */
export function playArchivalStampSound(muted: boolean): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. 印章壓落案桌的低頻沉穩落印聲
    const osc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(44, now + 0.16);

    thudGain.gain.setValueAtTime(0.18, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(thudGain);
    thudGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // 2. 極短促的紙張接觸清脆壓印聲
    const tapDur = 0.04;
    const tapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * tapDur), ctx.sampleRate);
    const tapData = tapBuf.getChannelData(0);
    for (let i = 0; i < tapData.length; i += 1) {
      tapData[i] = (Math.random() * 2 - 1) * (1 - i / tapData.length);
    }

    const tapSrc = ctx.createBufferSource();
    tapSrc.buffer = tapBuf;
    const tapFilter = ctx.createBiquadFilter();
    tapFilter.type = 'bandpass';
    tapFilter.frequency.setValueAtTime(520, now);
    tapFilter.Q.setValueAtTime(1.2, now);

    const tapGain = ctx.createGain();
    tapGain.gain.setValueAtTime(0.065, now);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + tapDur);

    tapSrc.connect(tapFilter);
    tapFilter.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapSrc.start(now);
  } catch {
    // 靜默容錯
  }
}
