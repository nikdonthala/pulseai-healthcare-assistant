import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  Droplet,
  FileText,
  HeartPulse,
  Loader2,
  Mic,
  MicOff,
  ScanLine,
  Search,
  Send,
  Settings as SettingsIcon,
  Stethoscope,
  Thermometer,
  Upload,
  Users,
} from "lucide-react";
import { scrollToSection, useScrollSpy } from "@/hooks/use-scroll-spy";
import { useVoiceNav, type VoiceCommand } from "@/hooks/use-voice-nav";
import { useLiveVitals, useStreamSeries } from "@/hooks/use-live-vitals";
import { EcgCanvas, StreamLine } from "@/components/EcgCanvas";
import { SearchPalette, type SearchItem } from "@/components/SearchPalette";
import { chatCopilot, summarizeRadiology } from "@/lib/ai.functions";
import { Markdown } from "@/lib/markdown";

const HeartScene = lazy(() =>
  import("@/components/HeartScene").then((m) => ({ default: m.HeartScene })),
);


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "PulseAI — Intelligent Critical Care, Reimagined" },
      {
        name: "description",
        content:
          "Real-time AI-powered patient monitoring with predictive health insights. A luxury glass dashboard for modern critical care.",
      },
      { property: "og:title", content: "PulseAI — Intelligent Critical Care" },
      {
        property: "og:description",
        content:
          "Continuous vitals, ECG, and an AI clinical companion — one calm, editorial dashboard.",
      },
    ],
  }),
  component: Overview,
});

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: Activity, phrases: ["dashboard", "overview", "home"] },
  { id: "live-monitoring", label: "Live Monitoring", icon: HeartPulse, phrases: ["live monitoring", "monitoring", "live"] },
  { id: "patients", label: "Patients", icon: Users, phrases: ["patients", "patient list", "roster"] },
  { id: "ai-assistant", label: "AI Assistant", icon: BrainCircuit, phrases: ["ai assistant", "assistant", "pulse ai", "chat"] },
  { id: "ehr", label: "EHR Co-pilot", icon: Stethoscope, phrases: ["ehr", "co-pilot", "copilot", "ehr copilot"] },
  { id: "radiology", label: "Radiology", icon: ScanLine, phrases: ["radiology", "scan", "imaging"] },
  { id: "alerts", label: "Critical Alerts", icon: AlertTriangle, phrases: ["alerts", "critical alerts", "warnings"] },
  { id: "timeline", label: "Timeline", icon: ClipboardList, phrases: ["timeline", "patient timeline", "history"] },
  { id: "reports", label: "Reports", icon: FileText, phrases: ["reports", "medical reports"] },
  { id: "settings", label: "Settings", icon: SettingsIcon, phrases: ["settings", "preferences", "config"] },
] as const;

function Overview() {
  const ids = useMemo(() => SECTIONS.map((s) => s.id), []);
  const active = useScrollSpy(ids);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const commands: VoiceCommand[] = useMemo(
    () => [
      ...SECTIONS.map((s) => ({ target: s.id, phrases: [...s.phrases, `go to ${s.label.toLowerCase()}`, `open ${s.label.toLowerCase()}`] })),
      { target: "dashboard", phrases: ["scroll to top", "top"] },
    ],
    [],
  );

  const { listening, transcript, supported, start, stop } = useVoiceNav(
    commands,
    (target) => scrollToSection(target),
  );

  const searchItems: SearchItem[] = useMemo(
    () => [
      ...SECTIONS.map((s) => ({ id: s.id, label: s.label, section: "Navigation", keywords: s.phrases.join(" ") })),
      { id: "patients", label: "Amelia Hart · P-1042 · ICU-04", section: "Patients", keywords: "amelia hart post-op cardiac" },
      { id: "patients", label: "James O'Neill · P-1043 · ICU-12", section: "Patients", keywords: "james oneill sepsis" },
      { id: "patients", label: "Priya Shah · P-1044 · ICU-03", section: "Patients", keywords: "priya shah pneumonia" },
      { id: "patients", label: "Marcus Lee · P-1045 · ICU-09", section: "Patients", keywords: "marcus lee arrhythmia" },
      { id: "patients", label: "Sofia García · P-1046 · ICU-05", section: "Patients", keywords: "sofia garcia post-partum" },
      { id: "patients", label: "Henrik Bakke · P-1047 · ICU-11", section: "Patients", keywords: "henrik bakke copd" },
      { id: "reports", label: "Ward 3B daily vitals summary", section: "Reports" },
      { id: "reports", label: "Sepsis risk cohort — weekly", section: "Reports" },
      { id: "alerts", label: "Rising sepsis risk — James O'Neill", section: "Alerts" },
      { id: "ai-assistant", label: "Ask PulseAI about a patient", section: "AI" },
      { id: "ehr", label: "EHR Co-pilot", section: "AI" },
      { id: "radiology", label: "Radiology summarizer", section: "AI" },
    ],
    [],
  );

  // Deep-link on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash && (ids as string[]).includes(hash)) {
      requestAnimationFrame(() => scrollToSection(hash));
    }
  }, [ids]);

  return (
    <div className="pulse-ivory min-h-screen">
      {/* Warm ivory mesh background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 8% -10%, rgba(247,181,140,0.35), transparent 60%)," +
            "radial-gradient(900px 700px at 100% 10%, rgba(233,197,233,0.35), transparent 60%)," +
            "radial-gradient(1000px 900px at 50% 120%, rgba(184,154,246,0.22), transparent 60%)," +
            "#FFF8F4",
        }}
      />

      <SearchPalette
        items={searchItems}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={(it) => scrollToSection(it.id)}
      />

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-2 border-r border-white/60 bg-white/40 p-5 backdrop-blur-2xl lg:flex">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("dashboard");
            }}
            className="mb-5 flex items-center gap-3"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_8px_24px_-8px_rgba(184,154,246,0.6)]"
              style={{ background: "linear-gradient(135deg,#F7B58C,#E9C5E9,#B89AF6)" }}
            >
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-normal tracking-tight text-neutral-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                PulseAI
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">Clinical OS</span>
            </span>
          </a>

          <nav className="flex flex-col gap-1">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(s.id);
                  }}
                  className={`group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-all duration-[250ms] ${
                    isActive
                      ? "bg-white/80 text-neutral-900 shadow-[0_8px_24px_-12px_rgba(184,154,246,0.55)]"
                      : "text-neutral-600 hover:bg-white/50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-[#B89AF6]" : "text-neutral-500 group-hover:text-neutral-700"
                    }`}
                  />
                  <span>{s.label}</span>
                </a>
              );
            })}
          </nav>

          <Link
            to="/"
            className="mt-auto flex items-center justify-between rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-sm text-neutral-600 backdrop-blur transition hover:bg-white/70"
          >
            <span>Back to landing</span>
            <span className="text-neutral-400">›</span>
          </Link>
        </aside>

        {/* Main scroll area */}
        <main className="min-w-0 flex-1">
          <TopBar
            listening={listening}
            supported={supported}
            transcript={transcript}
            onMic={() => (listening ? stop() : start())}
            onOpenSearch={() => setPaletteOpen(true)}
          />

          <div className="mx-auto max-w-6xl px-5 pb-32 pt-6 sm:px-8">
            <DashboardSection />
            <LiveMonitoringSection />
            <PatientsSection />
            <AIAssistantSection />
            <EHRSection />
            <RadiologySection />
            <AlertsSection />
            <TimelineSection />
            <ReportsSection />
            <SettingsSection />

            <footer className="mt-16 border-t border-white/60 pt-6 text-xs text-neutral-500">
              © {new Date().getFullYear()} PulseAI · Decision support only — not a substitute for professional medical judgment.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}


/* ---------------- shared bits ---------------- */

function TopBar({
  listening,
  supported,
  transcript,
  onMic,
}: {
  listening: boolean;
  supported: boolean;
  transcript: string;
  onMic: () => void;
}) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-white/60 bg-white/50 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:px-8">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm text-neutral-500 shadow-[0_6px_20px_-14px_rgba(0,0,0,0.15)]">
          <Search className="h-4 w-4" />
          <span>Search patients, vitals, pages…</span>
          <kbd className="ml-auto rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">⌘K</kbd>
        </div>
        <button
          onClick={onMic}
          disabled={!supported}
          title={supported ? (listening ? "Stop listening" : "Voice navigation") : "Voice not supported in this browser"}
          className={`relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
            listening
              ? "bg-[#F06D6D] text-white shadow-[0_10px_30px_-8px_rgba(240,109,109,0.55)]"
              : supported
              ? "border border-white/70 bg-white/70 text-neutral-700 hover:bg-white"
              : "border border-white/70 bg-white/40 text-neutral-400"
          }`}
        >
          {listening ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
          <span className="hidden sm:inline">{listening ? "Listening…" : "Voice"}</span>
          {listening && (
            <span className="pointer-events-none absolute -inset-0.5 -z-10 rounded-full bg-[#F06D6D]/30 blur-md" />
          )}
        </button>
        <div className="hidden text-right text-xs text-neutral-500 md:block">
          <div className="font-mono text-neutral-700">
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div>{time.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" })}</div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-3 py-1 text-xs text-emerald-700 md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
        </div>
      </div>
      {listening && transcript && (
        <div className="mx-auto max-w-6xl px-5 pb-2 text-xs text-neutral-500 sm:px-8">
          Heard: <span className="text-neutral-700">"{transcript}"</span>
        </div>
      )}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/55 p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.12)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{eyebrow}</div>
      <h2
        className="mt-2 text-4xl leading-tight text-neutral-900 md:text-5xl"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {title}
      </h2>
      {sub && <p className="mt-2 max-w-2xl text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-12 ${className}`}>
      {children}
    </section>
  );
}

/* ---------------- sections ---------------- */

function DashboardSection() {
  const vitals = [
    { label: "Heart rate", value: "72", unit: "bpm", color: "#F06D6D", Icon: HeartPulse },
    { label: "SpO₂", value: "98.7", unit: "%", color: "#A88BEF", Icon: Droplet },
    { label: "Blood pressure", value: "120/78", unit: "mmHg", color: "#F5A15A", Icon: Activity },
    { label: "Temperature", value: "36.8", unit: "°C", color: "#F49A9A", Icon: Thermometer },
  ];
  return (
    <Section id="dashboard" className="pt-4">
      <SectionHeader
        eyebrow="01 — Live overview"
        title="Good morning, Dr. Reyes."
        sub="5 patients in your care · 1 critical · 2 pending reviews"
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          {vitals.map((v) => (
            <GlassCard key={v.label} className="!p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400">
                <v.Icon className="h-3.5 w-3.5" style={{ color: v.color }} />
                {v.label}
              </div>
              <div className="mt-2 flex items-end gap-1">
                <div className="text-4xl font-normal text-neutral-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {v.value}
                </div>
                <div className="pb-1 text-sm text-neutral-500">{v.unit}</div>
              </div>
              <div className="mt-3 h-8 w-full overflow-hidden rounded-lg" style={{ background: `linear-gradient(90deg, ${v.color}22, transparent)` }}>
                <svg viewBox="0 0 100 30" className="h-full w-full">
                  <path
                    d="M0 20 Q10 5 20 20 T40 20 T60 20 T80 20 T100 20"
                    fill="none"
                    stroke={v.color}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </GlassCard>
          ))}
          <GlassCard className="col-span-2 !p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-400">Health score</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-5xl font-normal text-neutral-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    92
                  </div>
                  <div className="pb-2 text-sm text-neutral-500">/ 100</div>
                </div>
                <div className="mt-1 text-xs text-neutral-500">Trending stable over 6h</div>
              </div>
              <div
                className="relative h-24 w-24 rounded-full"
                style={{
                  background: `conic-gradient(#B89AF6 0 92%, rgba(0,0,0,0.06) 92% 100%)`,
                }}
              >
                <div className="absolute inset-2 rounded-full bg-white/80 backdrop-blur" />
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="relative overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-400">Interactive</div>
              <div className="text-2xl text-neutral-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Heart in motion
              </div>
              <div className="mt-1 text-xs text-neutral-500">Drag to rotate — a live 3D pulse.</div>
            </div>
            <div className="rounded-full bg-emerald-50/80 px-3 py-1 text-xs text-emerald-700">72 BPM</div>
          </div>
          <div className="relative h-[280px] overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 to-white/20">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-neutral-400">Loading…</div>}>
              <HeartScene />
            </Suspense>
          </div>
        </GlassCard>
      </div>

      {/* Live ECG + AI risk */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-400">Live ECG</div>
              <div className="text-2xl text-neutral-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Lead II · 250 Hz · Streaming
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F06D6D]" /> Recording
            </div>
          </div>
          <EcgLine />
          <div className="mt-3 flex gap-4 text-xs text-neutral-500">
            <span>72 BPM</span>
            <span>Signal excellent</span>
            <span>Noise 0.02 mV</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">AI Risk engine</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-2xl text-neutral-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Stable
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">low risk</span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            No critical events forecast in the next 6 hours.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Cardiovascular", "Low", 22, "#A88BEF"],
              ["Fatigue", "Moderate", 62, "#F5A15A"],
              ["Hydration", "Low", 28, "#A88BEF"],
            ].map(([k, v, pct, c]) => (
              <div key={k as string}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-700">{k}</span>
                  <span className="text-neutral-500">{v}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/60">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct as number}%`, background: c as string }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F7B58C]/25 via-[#E9C5E9]/40 to-[#B89AF6]/25 p-4 text-sm text-neutral-700">
            <div className="text-xs uppercase tracking-widest text-neutral-500">Suggested action</div>
            <div className="mt-1">
              Encourage 250 ml fluid intake within the next hour and recheck vitals at 11:00.
            </div>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}

function EcgLine() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/40">
      <svg viewBox="0 0 800 120" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ecgG" x1="0" x2="1">
            <stop offset="0%" stopColor="#F06D6D" stopOpacity="0" />
            <stop offset="50%" stopColor="#F06D6D" />
            <stop offset="100%" stopColor="#B89AF6" />
          </linearGradient>
        </defs>
        <path
          d="M0 60 L60 60 L80 60 L90 30 L100 90 L110 60 L200 60 L220 60 L230 30 L240 90 L250 60 L340 60 L360 60 L370 30 L380 90 L390 60 L480 60 L500 60 L510 30 L520 90 L530 60 L620 60 L640 60 L650 30 L660 90 L670 60 L760 60 L800 60"
          fill="none"
          stroke="url(#ecgG)"
          strokeWidth="2"
          className="animate-ecg"
          style={{ strokeDasharray: 2000 }}
        />
      </svg>
    </div>
  );
}

function LiveMonitoringSection() {
  const beds = Array.from({ length: 8 }, (_, i) => ({
    id: `ICU-${(i + 1).toString().padStart(2, "0")}`,
    hr: 71 + ((i * 3) % 20),
    spo2: 95 + (i % 4),
    bp: `${118 + i}/${72 + (i % 8)}`,
    risk: ["Low", "Low", "Moderate", "Low", "High", "Low", "Moderate", "Low"][i],
  }));
  return (
    <Section id="live-monitoring">
      <SectionHeader
        eyebrow="02 — Live Monitoring"
        title="Every bed, every beat"
        sub="Vitals refresh in real time across the ward."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {beds.map((b) => {
          const riskColor =
            b.risk === "High" ? "#F06D6D" : b.risk === "Moderate" ? "#F5A15A" : "#A88BEF";
          return (
            <GlassCard key={b.id} className="!p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-800">{b.id}</div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] text-white"
                  style={{ background: riskColor }}
                >
                  {b.risk}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="HR" value={b.hr} color="#F06D6D" />
                <MiniStat label="SpO₂" value={`${b.spo2}%`} color="#A88BEF" />
                <MiniStat label="BP" value={b.bp} color="#F5A15A" />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Section>
  );
}

function MiniStat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl bg-white/60 p-2">
      <div className="text-[10px] uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="text-base text-neutral-800" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function PatientsSection() {
  const rows = [
    ["Amelia Hart", "62", "P-1042", "ICU-04", "Post-op cardiac", "Moderate"],
    ["James O'Neill", "71", "P-1043", "ICU-12", "Sepsis observation", "High"],
    ["Priya Shah", "34", "P-1044", "ICU-03", "Pneumonia", "Low"],
    ["Marcus Lee", "48", "P-1045", "ICU-09", "Arrhythmia", "Moderate"],
    ["Sofia García", "29", "P-1046", "ICU-05", "Post-partum", "Low"],
    ["Henrik Bakke", "66", "P-1047", "ICU-11", "COPD flare", "High"],
  ];
  return (
    <Section id="patients">
      <SectionHeader
        eyebrow="03 — Patients"
        title="Active patient roster"
        sub="Search, filter, and jump into any patient's timeline."
      />
      <GlassCard className="!p-0">
        <div className="grid grid-cols-[1.4fr_60px_1fr_1fr_1.4fr_1fr_120px] items-center gap-4 border-b border-white/70 px-6 py-3 text-xs uppercase tracking-widest text-neutral-400">
          <div>Patient</div>
          <div>Age</div>
          <div>ID</div>
          <div>Bed</div>
          <div>Condition</div>
          <div>Risk</div>
          <div />
        </div>
        {rows.map(([name, age, id, bed, cond, risk]) => (
          <div
            key={id}
            className="grid grid-cols-[1.4fr_60px_1fr_1fr_1.4fr_1fr_120px] items-center gap-4 border-b border-white/50 px-6 py-4 text-sm last:border-0 hover:bg-white/40"
          >
            <div className="font-medium text-neutral-800">{name}</div>
            <div className="text-neutral-500">{age}</div>
            <div className="text-neutral-500">{id}</div>
            <div className="text-neutral-500">{bed}</div>
            <div className="text-neutral-700">{cond}</div>
            <div>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] text-white"
                style={{
                  background: risk === "High" ? "#F06D6D" : risk === "Moderate" ? "#F5A15A" : "#A88BEF",
                }}
              >
                {risk}
              </span>
            </div>
            <button className="text-xs text-[#B89AF6] hover:underline">Open timeline →</button>
          </div>
        ))}
      </GlassCard>
    </Section>
  );
}

function AIAssistantSection() {
  return (
    <Section id="ai-assistant">
      <SectionHeader
        eyebrow="04 — AI Assistant"
        title="Ask PulseAI"
        sub="Server-side AI companion. Ask about vitals, sepsis risk, or medication interactions."
      />
      <GlassCard>
        <div className="rounded-2xl bg-gradient-to-br from-[#F7B58C]/20 via-[#E9C5E9]/30 to-[#B89AF6]/20 p-5 text-sm text-neutral-700">
          <div className="text-xs uppercase tracking-widest text-neutral-500">PulseAI · Live insight</div>
          <p className="mt-2">
            Amelia's vitals are within normal range. Fatigue index is trending up — consider a short
            rest period and hydration prompt before her afternoon session.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            placeholder="Ask about a patient…"
            className="flex-1 rounded-full border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-[#B89AF6]"
          />
          <button
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_-10px_rgba(184,154,246,0.6)]"
            style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
          >
            Ask
          </button>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Streaming Groq integration ships next — the server key will be added to this workspace.
        </p>
      </GlassCard>
    </Section>
  );
}

function EHRSection() {
  return (
    <Section id="ehr">
      <SectionHeader
        eyebrow="05 — EHR Co-pilot"
        title="Synthesize the chart. Suggest the plan."
        sub="Paste any multi-modal EHR snapshot — history, meds, vitals, labs, imaging. PulseAI returns an evidence-based, guideline-cited plan."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">Patient EHR</div>
          <textarea
            rows={9}
            placeholder="62F, post-op day 3, HR 92, SpO2 94%, temp 38.1°C, WBC 14.2, on ceftriaxone…"
            className="mt-3 w-full resize-none rounded-2xl border border-white/70 bg-white/70 p-4 text-sm outline-none focus:border-[#B89AF6]"
          />
          <div className="mt-3 flex gap-2">
            <button className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-neutral-600">Reset sample</button>
            <button
              className="rounded-full px-5 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
            >
              Generate plan
            </button>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">AI clinical plan</div>
          <p className="mt-3 text-sm text-neutral-500">
            Your evidence-based plan will appear here — assessment, red flags, workup, treatment
            with guideline citations, and monitoring.
          </p>
        </GlassCard>
      </div>
    </Section>
  );
}

function RadiologySection() {
  return (
    <Section id="radiology">
      <SectionHeader
        eyebrow="06 — Radiology"
        title="From dense report to plain language."
        sub="Upload or paste an unstructured radiology report. PulseAI extracts key findings and generates a patient-friendly summary alongside the clinician view."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">Radiology report</div>
          <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-white/70 bg-white/40 text-sm text-neutral-400">
            Attach image or report
          </div>
          <button
            className="mt-3 w-full rounded-full py-2.5 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
          >
            Summarize
          </button>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">Dual-view summary</div>
          <p className="mt-3 text-sm text-neutral-500">
            Clinician bullets on top, plain-English patient summary below — with recommended next
            steps.
          </p>
        </GlassCard>
      </div>
    </Section>
  );
}

function AlertsSection() {
  const alerts = [
    ["James O'Neill · ICU-12", "Rising sepsis risk detected in next 4 hours", "2 min ago", "#F06D6D"],
    ["Henrik Bakke · ICU-11", "SpO₂ dropped to 89% — recheck oxygen", "8 min ago", "#F5A15A"],
    ["Amelia Hart · ICU-04", "Temperature 38.4°C, trending up", "22 min ago", "#F49A9A"],
  ] as const;
  return (
    <Section id="alerts">
      <SectionHeader
        eyebrow="07 — Critical alerts"
        title="Context-aware notifications"
        sub="Only what needs your attention, prioritized by AI risk models."
      />
      <div className="grid gap-3">
        {alerts.map(([who, what, when, c]) => (
          <GlassCard key={who} className="!p-4">
            <div className="flex items-center gap-4">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-800">{who}</div>
                <div className="text-sm text-neutral-600">{what}</div>
              </div>
              <div className="text-xs text-neutral-400">{when}</div>
              <button className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs text-neutral-700">
                Acknowledge
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}

function TimelineSection() {
  const items = [
    ["Today · 09:12", "AI risk score: Sepsis rising", "Lactate recheck ordered"],
    ["Today · 07:40", "Vitals checked", "HR 82 · SpO₂ 97 · Temp 37.1°C"],
    ["Yesterday", "Medication administered", "Ceftriaxone 1g IV"],
    ["2 days ago", "Lab report", "WBC 14.2, CRP 96 mg/L"],
    ["Admission", "Diagnosis", "Post-op cardiac observation, ward 3B"],
  ];
  return (
    <Section id="timeline">
      <SectionHeader
        eyebrow="08 — Patient timeline"
        title="Amelia Hart · P-1042"
        sub="One-click access to diagnoses, medications, allergies, labs, and AI-generated summary."
      />
      <GlassCard>
        <ol className="relative ml-3 border-l border-white/70 pl-6">
          {items.map(([when, title, body], i) => (
            <li key={i} className="mb-6 last:mb-0">
              <span
                className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white"
                style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
              />
              <div className="text-xs uppercase tracking-widest text-neutral-400">{when}</div>
              <div className="mt-1 text-sm font-medium text-neutral-800">{title}</div>
              <div className="text-sm text-neutral-500">{body}</div>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F7B58C]/20 via-[#E9C5E9]/30 to-[#B89AF6]/20 p-4 text-sm text-neutral-700">
          <div className="text-xs uppercase tracking-widest text-neutral-500">AI summary</div>
          <p className="mt-1">
            62F, post-op cardiac. Vitals mostly stable, but temperature and CRP trending upward
            over 48h. Suggest early sepsis workup: lactate, blood cultures, reassess in 2h.
          </p>
        </div>
      </GlassCard>
    </Section>
  );
}

function ReportsSection() {
  const reports = [
    ["Ward 3B daily vitals summary", "Today", "1.2 MB"],
    ["Sepsis risk cohort — weekly", "This week", "820 KB"],
    ["Alarm fatigue analysis Q3", "Q3", "3.4 MB"],
  ];
  return (
    <Section id="reports">
      <SectionHeader eyebrow="09 — Reports" title="Generated clinical reports" />
      <div className="grid gap-3">
        {reports.map(([title, when, size]) => (
          <GlassCard key={title} className="!p-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-800">{title}</div>
                <div className="text-xs text-neutral-500">
                  {when} · {size}
                </div>
              </div>
              <button className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs text-neutral-700">
                Download
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}

function SettingsSection() {
  return (
    <Section id="settings">
      <SectionHeader eyebrow="10 — Settings" title="PulseAI preferences" />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <div className="text-sm font-medium text-neutral-800">Voice navigation</div>
          <p className="mt-1 text-sm text-neutral-500">
            Say a section name — "open patients", "go to reports" — to jump around the dashboard.
            Uses your browser's on-device speech recognition; no audio leaves your device.
          </p>
        </GlassCard>
        <GlassCard>
          <div className="text-sm font-medium text-neutral-800">About PulseAI</div>
          <p className="mt-1 text-sm text-neutral-500">
            PulseAI unifies continuous vitals monitoring with an AI-generated patient timeline so
            clinicians can act on the right signal, faster.
          </p>
        </GlassCard>
      </div>
    </Section>
  );
}
