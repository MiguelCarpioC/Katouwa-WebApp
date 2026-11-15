/**
 * Pulso del territorio: onda, sonificación (Web Audio) y patrón Chladni.
 * Regla única: más distorsión = menos salud.
 */
(() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // 0 = onda limpia, 1 = máxima distorsión. Las zonas saludables (≥ 70) suenan limpias.
  const distortionFor = score => clamp((72 - score) / 50, 0, 1);

  function setupCanvas(c) {
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function createPulse({ wave, chladni }) {
    let state = null;        // { score, color }
    let mode = 'wave';
    let phase = 0;
    let playing = false;
    let raf = 0;
    let noise = [];
    let audio = null;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function refreshNoise(n, d, partial) {
      if (noise.length !== n) noise = Array.from({ length: n }, () => Math.random() * 2 - 1);
      const k = partial ? Math.ceil(n * 0.12 * d) : n;
      for (let i = 0; i < k; i++) noise[(Math.random() * n) | 0] = Math.random() * 2 - 1;
    }

    // ───────── Onda ─────────
    function drawWave() {
      const { ctx, w, h } = setupCanvas(wave);
      const d = distortionFor(state.score);
      const mid = h / 2;
      const amp = h * 0.38 * (playing ? 1 : 0.85);
      const cycles = 3.5;
      const N = Math.max(60, Math.round(w / 2));
      refreshNoise(N, d, true);

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(232,238,242,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = 2 * Math.PI * (cycles * t) + phase;
        let y = Math.sin(a) * (1 - 0.25 * d);
        if (d > 0) {
          y += d * (0.55 * noise[i % N] + 0.3 * Math.sin(a * 7.3 + phase * 3));
          const lim = 1 - 0.4 * d;                    // recorte: distorsión "saturada"
          y = clamp(y, -lim, lim);
        }
        // atenuar los extremos
        const edge = Math.sin(Math.PI * t) ** 0.4;
        const x = t * w, yy = mid - y * amp * edge;
        i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.lineJoin = d > 0 ? 'miter' : 'round';
      ctx.strokeStyle = state.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = state.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ───────── Patrón Chladni ─────────
    function drawChladni() {
      const { ctx, w, h } = setupCanvas(chladni);
      const d = distortionFor(state.score);
      const n = 2, m = 5;                       // modo de vibración
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(3,10,14,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = state.color;
      const step = 1.5;
      const eps = 0.07 + d * 0.05;
      for (let px = 0; px < w; px += step) {
        for (let py = 0; py < h; py += step) {
          const x = px / w, y = py / h;
          const v = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
          const onLine = Math.abs(v) < eps;
          const stray = Math.random() < d * 0.025;    // arena dispersa = poca salud
          if (onLine || stray) {
            const j = d * 3;
            ctx.globalAlpha = onLine ? 0.9 : 0.5;
            ctx.fillRect(px + (Math.random() - 0.5) * j, py + (Math.random() - 0.5) * j, 1.2, 1.2);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      if (!state) return;
      phase += playing ? 0.12 : 0.025;
      if (mode === 'wave') drawWave();
      else if (playing || !chladni.dataset.drawn) { drawChladni(); chladni.dataset.drawn = '1'; }
      raf = reduceMotion && !playing ? 0 : requestAnimationFrame(frame);
    }

    function restart() {
      cancelAnimationFrame(raf);
      chladni.dataset.drawn = '';
      frame();
    }

    // ───────── Sonificación ─────────
    function startAudio() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const d = distortionFor(state.score);
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 220;
      const shaper = ctx.createWaveShaper();
      const k = d * 300, N = 1024, curve = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const x = (i * 2) / N - 1;
        curve[i] = k ? ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)) : x;
      }
      shaper.curve = curve;
      osc.connect(shaper).connect(master);

      // Ruido proporcional a la pérdida de salud
      if (d > 0) {
        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const ng = ctx.createGain(); ng.gain.value = 0.35 * d;
        src.connect(ng).connect(master);
        src.start();
      }

      osc.start();
      const now = ctx.currentTime;
      master.gain.linearRampToValueAtTime(0.22, now + 0.25);
      master.gain.setValueAtTime(0.22, now + 5.5);
      master.gain.linearRampToValueAtTime(0, now + 6);
      const timer = setTimeout(() => stop(), 6000);
      audio = { ctx, timer };
    }

    function stopAudio() {
      if (!audio) return;
      clearTimeout(audio.timer);
      audio.ctx.close();
      audio = null;
    }

    let onPlayChange = () => {};
    function stop() {
      playing = false;
      stopAudio();
      onPlayChange(false);
      restart();
    }

    window.addEventListener('resize', () => state && restart());

    return {
      show({ score, status }) {
        if (playing) stop();
        state = { score, color: status === 'saludable' ? '#5FD39A' : '#E5604D' };
        noise = [];
        restart();
      },
      setMode(m) { mode = m; restart(); },
      toggle() {
        if (!state) return;
        if (playing) return stop();
        playing = true;
        startAudio();
        onPlayChange(true);
        restart();
      },
      onPlayChange(fn) { onPlayChange = fn; },
      hide() { if (playing) stop(); state = null; cancelAnimationFrame(raf); },
    };
  }

  window.KatouwaPulse = { createPulse };
})();
