import { useEffect, useRef } from "react";

/**
 * Continuous, non-repeating ECG waveform on canvas.
 * Uses requestAnimationFrame; synthesizes P/QRS/T with slight beat-to-beat variability.
 */
export function EcgCanvas({
  bpm = 72,
  height = 128,
  color = "#F06D6D",
}: {
  bpm?: number;
  height?: number;
  color?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    let width = wrap.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const ro = new ResizeObserver(() => {
      width = wrap.clientWidth;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    });
    ro.observe(wrap);

    // Point buffer: one y value per pixel column.
    const buffer: number[] = new Array(2048).fill(height / 2);
    let head = 0; // next write index
    let phase = 0; // 0..1 within current beat
    let last = performance.now();
    // slight variability per beat
    let beatJitter = 1;

    const baseline = height / 2;

    function ecgAt(t: number, jitter: number) {
      // t in [0,1) — one heart cycle. Sum of Gaussians for P, Q, R, S, T.
      const g = (mu: number, sigma: number, amp: number) =>
        amp * Math.exp(-Math.pow((t - mu) / sigma, 2));
      const y =
        g(0.18, 0.025, 6) + // P
        g(0.36, 0.008, -10) + // Q
        g(0.4, 0.008, 42 * jitter) + // R
        g(0.44, 0.01, -14) + // S
        g(0.68, 0.05, 10); // T
      return baseline - y;
    }

    let raf = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const cyc = bpmRef.current / 60; // beats per second
      const advance = cyc * dt; // fraction of a beat this frame
      // pixels to add this frame — scroll speed roughly 120 px/s
      const pxPerSec = 140;
      const pxThisFrame = Math.max(1, Math.round(pxPerSec * dt));

      for (let i = 0; i < pxThisFrame; i++) {
        phase += advance / pxThisFrame;
        if (phase >= 1) {
          phase -= 1;
          // new beat — jitter amplitude a touch
          beatJitter = 0.9 + Math.random() * 0.2;
        }
        const noise = (Math.random() - 0.5) * 0.4;
        buffer[head] = ecgAt(phase, beatJitter) + noise;
        head = (head + 1) % buffer.length;
      }

      // draw
      ctx.clearRect(0, 0, width, height);
      // grid
      ctx.strokeStyle = "rgba(240,109,109,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const idx = (head - width + x + buffer.length) % buffer.length;
        const y = buffer[idx];
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height, color]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/40"
      style={{ height }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
    </div>
  );
}

/** Simple streaming line for a numeric series (0..1 space). */
export function StreamLine({
  data,
  color = "#B89AF6",
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const step = w / (data.length - 1);
  const pts = data
    .map((v, i) => `${(i * step).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
