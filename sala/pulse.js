/**
 * Pulso del territorio · Living signal.
 * Regla: valor → normalizado entre 0 y 1 (mín–máx de la serie) → frecuencia de 220 a 660 Hz.
 * Es una codificación artística de los datos, no un sonido real.
 */
(() => {
  const F_MIN = 220, F_MAX = 660;
  const STEP_S = 0.7;  // duración de cada año al reproducir

  function setupCanvas(c) {
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  /** Convierte una serie en notas: [{year, value, norm, hz}] (hz = null si falta el dato). */
  function encode(series) {
    const vals = series.map(p => p.value).filter(v => v != null);
    const min = Math.min(...vals), max = Math.max(...vals);
    return series.map(p => {
      if (p.value == null) return { ...p, norm: null, hz: null };
      const norm = max > min ? (p.value - min) / (max - min) : 0.5;
      return { ...p, norm, hz: Math.round(F_MIN + norm * (F_MAX - F_MIN)) };
    });
  }

  function createPulse({ wave, chladni, onStep, onPlayChange }) {
    let notes = [];
    let color = '#5FD39A';
    let year = null;        // año seleccionado
    let current = null;     // nota que suena / se muestra
    let mode = 'wave';
    let phase = 0;
    let playing = false;
    let raf = 0;
    let audio = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const noteFor = y => notes.find(n => n.year === y) || null;

    function drawWave() {
      const { ctx, w, h } = setupCanvas(wave);
      const mid = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(232,238,242,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      if (!current || current.hz == null) return;

      // más Hz = más ciclos en pantalla
      const cycles = 2 + ((current.hz - F_MIN) / (F_MAX - F_MIN)) * 8;
      const amp = h * 0.38;
      const N = Math.max(80, Math.round(w / 1.5));
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const edge = Math.sin(Math.PI * t) ** 0.4;
        const y = mid - Math.sin(2 * Math.PI * cycles * t + phase) * amp * edge;
        i ? ctx.lineTo(t * w, y) : ctx.moveTo(t * w, y);
      }
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawChladni() {
      const { ctx, w, h } = setupCanvas(chladni);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(3,10,14,0.6)';
      ctx.fillRect(0, 0, w, h);
      if (!current || current.norm == null) return;
      // el valor elige el modo de vibración de la placa
      const n = 1 + Math.round(current.norm * 4), m = n + 2;
      ctx.fillStyle = color;
      for (let px = 0; px < w; px += 1.5) {
        for (let py = 0; py < h; py += 1.5) {
          const x = px / w, y = py / h;
          const v = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
          if (Math.abs(v) < 0.07) ctx.fillRect(px, py, 1.2, 1.2);
        }
      }
    }

    function draw() {
      if (mode === 'wave') drawWave(); else drawChladni();
    }

    function loop() {
      phase += playing ? 0.14 : 0.03;
      if (mode === 'wave') drawWave();
      raf = reduceMotion && !playing ? 0 : requestAnimationFrame(loop);
    }

    function restart() {
      cancelAnimationFrame(raf);
      draw();
      if (mode === 'wave') loop();
    }

    function show(note) {
      current = note;
      if (mode === 'chladni') drawChladni();
      onStep && onStep(note);
    }

    // ───────── Reproducción: recorre los años ─────────
    function play() {
      const AC = window.AudioContext || window.webkitAudioContext;
      const seq = notes.filter(n => n.hz != null);
      if (!seq.length) return;
      playing = true;
      onPlayChange && onPlayChange(true);
      restart();

      let ctx = null, osc = null, gain = null;
      if (AC) {
        ctx = new AC();
        osc = ctx.createOscillator();
        osc.type = 'sine';
        gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain).connect(ctx.destination);
        const t0 = ctx.currentTime + 0.05;
        seq.forEach((n, i) => {
          osc.frequency.setValueAtTime(n.hz, t0 + i * STEP_S);
          gain.gain.setValueAtTime(0.0001, t0 + i * STEP_S);
          gain.gain.exponentialRampToValueAtTime(0.2, t0 + i * STEP_S + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.03, t0 + (i + 1) * STEP_S - 0.02);
        });
        gain.gain.linearRampToValueAtTime(0, t0 + seq.length * STEP_S);
        osc.start(t0);
        osc.stop(t0 + seq.length * STEP_S + 0.05);
      }
      const timers = seq.map((n, i) => setTimeout(() => show(n), i * STEP_S * 1000));
      timers.push(setTimeout(stop, seq.length * STEP_S * 1000 + 100));
      audio = { ctx, timers };
    }

    function stop() {
      if (audio) {
        audio.timers.forEach(clearTimeout);
        if (audio.ctx) audio.ctx.close();
        audio = null;
      }
      playing = false;
      onPlayChange && onPlayChange(false);
      show(noteFor(year));
      restart();
    }

    window.addEventListener('resize', () => notes.length && restart());

    return {
      /** signal: { series:[{year,value}], id } */
      setSignal(signal, selectedYear) {
        if (playing) stop();
        notes = encode(signal.series);
        color = signal.id && signal.id.startsWith('power') ? '#D9C7A3' : '#5FD39A';
        year = selectedYear;
        show(noteFor(year));
        restart();
        return notes;
      },
      setYear(y) {
        year = y;
        if (!playing) { show(noteFor(y)); restart(); }
      },
      setMode(m) { mode = m; restart(); },
      toggle() { playing ? stop() : play(); },
      hide() { if (playing) stop(); notes = []; current = null; cancelAnimationFrame(raf); },
    };
  }

  window.KatouwaPulse = { createPulse, F_MIN, F_MAX };
})();
