import { useEffect, useRef, useState } from "react";

export type Vitals = {
  hr: number;
  spo2: number;
  sys: number;
  dia: number;
  temp: number;
  resp: number;
  hrv: number;
  stress: number;
  recovery: number;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// Ornstein-Uhlenbeck-ish random walk toward a mean.
function drift(v: number, mean: number, k: number, sigma: number, lo: number, hi: number) {
  const next = v + k * (mean - v) + (Math.random() - 0.5) * 2 * sigma;
  return clamp(next, lo, hi);
}

export function useLiveVitals(intervalMs = 1200) {
  const [v, setV] = useState<Vitals>({
    hr: 74,
    spo2: 98,
    sys: 120,
    dia: 78,
    temp: 36.8,
    resp: 17,
    hrv: 62,
    stress: 34,
    recovery: 78,
  });
  const ref = useRef(v);
  ref.current = v;

  useEffect(() => {
    const id = window.setInterval(() => {
      const c = ref.current;
      setV({
        hr: Math.round(drift(c.hr, 75, 0.15, 1.2, 68, 82)),
        spo2: Math.round(drift(c.spo2, 98.5, 0.2, 0.3, 97, 100) * 10) / 10,
        sys: Math.round(drift(c.sys, 120, 0.1, 0.8, 115, 125)),
        dia: Math.round(drift(c.dia, 78, 0.1, 0.6, 75, 82)),
        temp: Math.round(drift(c.temp, 36.9, 0.1, 0.05, 36.5, 37.4) * 10) / 10,
        resp: Math.round(drift(c.resp, 18, 0.15, 0.4, 16, 20)),
        hrv: Math.round(drift(c.hrv, 60, 0.1, 1.5, 45, 78)),
        stress: Math.round(drift(c.stress, 35, 0.08, 2, 15, 65)),
        recovery: Math.round(drift(c.recovery, 78, 0.08, 1.5, 60, 92)),
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return v;
}

// Continuous non-repeating streaming series for sparklines.
export function useStreamSeries(
  produce: () => number,
  length = 60,
  intervalMs = 800,
) {
  const [data, setData] = useState<number[]>(() =>
    Array.from({ length }, produce),
  );
  const produceRef = useRef(produce);
  produceRef.current = produce;

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((prev) => {
        const next = prev.slice(1);
        next.push(produceRef.current());
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, length]);

  return data;
}
