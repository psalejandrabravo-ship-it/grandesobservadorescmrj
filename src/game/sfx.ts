let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, duration: number, gain = 0.05, slide?: number) {
  try {
    const c = ac();
    if (!c) return;
    void c.resume();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, c.currentTime + duration);
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {
    /* un sonido fallido no debe interrumpir el juego */
  }
}

function clap(at: number, gain = 0.42) {
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * 0.09);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < len; n++) data[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 1.6;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200 + Math.random() * 900;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + at + 0.09);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(c.currentTime + at);
}

export const sfx = {
  tap: (on: boolean) => on && tone(420, 0.07, 0.035),
  pickup: (on: boolean) => on && tone(360, 0.09, 0.04, 460),
  snap: (on: boolean) => on && tone(520, 0.12, 0.06, 680),
  miss: (on: boolean) => on && tone(220, 0.06, 0.02),
  done: (on: boolean) => {
    if (!on) return;
    tone(440, 0.14, 0.05, 660);
    setTimeout(() => tone(660, 0.16, 0.04), 90);
  },
  cheer: (on: boolean) => {
    if (!on) return;
    tone(523, 0.12, 0.07, 659);
    setTimeout(() => tone(659, 0.12, 0.06, 784), 110);
    setTimeout(() => tone(784, 0.22, 0.05, 1046), 220);
    try {
      const c = ac();
      void c?.resume();
      clap(0.05, 0.28);
      clap(0.16, 0.24);
      clap(0.28, 0.22);
    } catch {
      /* el aplauso corto no debe cortar el juego */
    }
  },
  hint: (on: boolean) => on && tone(392, 0.16, 0.03, 349),
  applause: (on: boolean) => {
    if (!on) return;
    try {
      const c = ac();
      if (!c) return;
      void c.resume();
      tone(523, 0.18, 0.07, 659);
      setTimeout(() => tone(659, 0.18, 0.07, 784), 160);
      setTimeout(() => tone(784, 0.28, 0.08, 1046), 320);
      for (let i = 0; i < 22; i++) clap(i * 0.09 + Math.random() * 0.03, 0.34 + (i % 3) * 0.06);
    } catch {
      /* un aplauso fallido no debe interrumpir el cierre */
    }
  },
};
