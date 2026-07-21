import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowRight, Clock, HeartPulse, Sparkles } from "lucide-react";

const HeartScene = lazy(() =>
  import("@/components/HeartScene").then((m) => ({ default: m.HeartScene })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseAI — Every heartbeat, heard in time." },
      {
        name: "description",
        content:
          "An AI clinical OS that continuously monitors vitals, predicts deterioration, and unifies patient history — so clinicians act sooner, with more context.",
      },
      { property: "og:title", content: "PulseAI — Every heartbeat, heard in time." },
      {
        property: "og:description",
        content:
          "Continuous vitals, sepsis lead time, and one-click patient timelines. Luxury AI for critical care.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ivory + mesh gradient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 8% -10%, rgba(247,181,140,0.35), transparent 60%)," +
            "radial-gradient(900px 700px at 100% 10%, rgba(233,197,233,0.55), transparent 60%)," +
            "radial-gradient(1100px 900px at 50% 110%, rgba(184,154,246,0.30), transparent 60%)," +
            "#FFF8F4",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 pt-8 sm:px-10">
        <TopBar />

        <section className="grid gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-20">
          {/* Copy */}
          <div className="flex flex-col justify-center">
            <div className="text-xs uppercase tracking-[0.28em] text-[#E27C7C]">
              01 — Introducing PulseAI
            </div>
            <h1
              className="mt-6 text-[64px] leading-[0.98] tracking-tight text-neutral-900 md:text-[88px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Every heartbeat,
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(120deg,#F06D6D 0%,#E27C7C 40%,#B89AF6 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                heard in time.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-neutral-500">
              An AI clinical OS that continuously monitors vitals, predicts
              deterioration, and unifies patient history — so clinicians act sooner,
              with more context.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white shadow-[0_16px_40px_-14px_rgba(184,154,246,0.65)] transition hover:shadow-[0_20px_50px_-14px_rgba(184,154,246,0.8)]"
                style={{
                  background:
                    "linear-gradient(135deg,#F7B58C 0%,#E9C5E9 55%,#B89AF6 100%)",
                }}
              >
                Enter clinical dashboard
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                hash="ai-assistant"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3.5 text-sm font-medium text-neutral-800 backdrop-blur transition hover:bg-white"
              >
                <Sparkles className="h-4 w-4 text-[#B89AF6]" />
                Try AI Assistant
              </Link>
            </div>

            <div className="mt-14 grid max-w-lg grid-cols-3 gap-6">
              <Stat value="7" label="Vitals streams" />
              <Stat value="< 4h" label="Sepsis lead time" />
              <Stat value="1-click" label="Patient timeline" />
            </div>
          </div>

          {/* 3D Heart card */}
          <div className="relative">
            <div className="relative aspect-square w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/40 shadow-[0_30px_80px_-30px_rgba(184,154,246,0.35)] backdrop-blur-2xl">
              <div className="absolute inset-0">
                <Suspense fallback={<HeartFallback />}>
                  <HeartScene />
                </Suspense>
              </div>
              <div className="pointer-events-none absolute bottom-5 left-5 rounded-full bg-white/70 px-3 py-1.5 text-xs text-neutral-500 backdrop-blur">
                interactive · drag to rotate
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TopBar() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-10px_rgba(240,109,109,0.55)]"
          style={{
            background: "linear-gradient(135deg,#F7B58C 0%,#F06D6D 60%,#B89AF6 100%)",
          }}
        >
          <HeartPulse className="h-5 w-5" />
        </span>
        <span
          className="text-2xl leading-none text-neutral-900"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Pulse<span style={{ color: "#F06D6D" }}>AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3.5 py-2 text-sm text-neutral-500 backdrop-blur sm:flex">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-neutral-700">
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_-12px_rgba(184,154,246,0.6)] transition hover:shadow-[0_16px_36px_-14px_rgba(184,154,246,0.8)]"
          style={{
            background:
              "linear-gradient(135deg,#F7B58C 0%,#E9C5E9 55%,#B89AF6 100%)",
          }}
        >
          Open dashboard
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        className="text-4xl leading-none text-neutral-900"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
        {label}
      </div>
    </div>
  );
}

function HeartFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div
        className="h-40 w-40 rounded-full opacity-70 blur-md"
        style={{ background: "radial-gradient(circle,#F06D6D,#B89AF6)" }}
      />
    </div>
  );
}
