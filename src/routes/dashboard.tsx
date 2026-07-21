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
import { PATIENTS, getPatient, type Patient } from "@/lib/patients";

/** Supported multilingual assistant languages (BCP-47 for SpeechRecognition). */
export const LANGS: { code: string; bcp47: string; label: string; flag: string }[] = [
  { code: "en", bcp47: "en-US", label: "English", flag: "🇺🇸" },
  { code: "hi", bcp47: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "te", bcp47: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", bcp47: "ta-IN", label: "தமிழ்", flag: "🇮🇳" },
  { code: "mr", bcp47: "mr-IN", label: "मराठी", flag: "🇮🇳" },
  { code: "ur", bcp47: "ur-PK", label: "اردو", flag: "🇵🇰" },
  { code: "es", bcp47: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr", bcp47: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "it", bcp47: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", bcp47: "ru-RU", label: "Русский", flag: "🇷🇺" },
];

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
  const [lang, setLang] = useState("en");
  const [patientId, setPatientId] = useState(PATIENTS[0].id);
  const patient = getPatient(patientId);
  const bcp47 = LANGS.find((l) => l.code === lang)?.bcp47 ?? "en-US";

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
    bcp47,
  );

  const searchItems: SearchItem[] = useMemo(
    () => [
      ...SECTIONS.map((s) => ({ id: s.id, label: s.label, section: "Navigation", keywords: s.phrases.join(" ") })),
      ...PATIENTS.map((p) => ({
        id: "patients",
        label: `${p.name} · ${p.id} · ${p.bed}`,
        section: "Patients",
        keywords: `${p.name} ${p.id} ${p.bed} ${p.condition} ${p.diagnosis} ${p.doctor}`,
      })),
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
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-2 border-r border-white/60 bg-white/70 p-5 backdrop-blur-md lg:flex">
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
            <PatientsSection
              patientId={patientId}
              onSelect={(id) => {
                setPatientId(id);
                scrollToSection("timeline");
              }}
            />
            <AIAssistantSection lang={lang} setLang={setLang} patient={patient} />
            <EHRSection />
            <RadiologySection />
            <AlertsSection />
            <TimelineSection patientId={patientId} onSelect={setPatientId} />
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
  onOpenSearch,
}: {
  listening: boolean;
  supported: boolean;
  transcript: string;
  onMic: () => void;
  onOpenSearch: () => void;
}) {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:px-8">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-1 items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-left text-sm text-neutral-500 shadow-[0_6px_20px_-14px_rgba(0,0,0,0.15)] transition hover:bg-white/80"
        >
          <Search className="h-4 w-4" />
          <span>Search patients, vitals, pages…</span>
          <kbd className="ml-auto rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">⌘K</kbd>
        </button>

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
        <div className="hidden text-right text-xs text-neutral-500 md:block" suppressHydrationWarning>
          <div className="font-mono text-neutral-700" suppressHydrationWarning>
            {time ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
          </div>
          <div suppressHydrationWarning>
            {time ? time.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" }) : ""}
          </div>
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
      className={`rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.12)] ${className}`}
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
  const v = useLiveVitals(1200);
  const hrSeries = useStreamSeries(() => v.hr, 40, 1000);
  const spo2Series = useStreamSeries(() => v.spo2, 40, 1200);
  const bpSeries = useStreamSeries(() => v.sys, 40, 1500);
  const tempSeries = useStreamSeries(() => v.temp, 40, 1400);

  const cards = [
    { label: "Heart rate", value: v.hr.toString(), unit: "bpm", color: "#F06D6D", Icon: HeartPulse, series: hrSeries },
    { label: "SpO₂", value: v.spo2.toFixed(1), unit: "%", color: "#A88BEF", Icon: Droplet, series: spo2Series },
    { label: "Blood pressure", value: `${v.sys}/${v.dia}`, unit: "mmHg", color: "#F5A15A", Icon: Activity, series: bpSeries },
    { label: "Temperature", value: v.temp.toFixed(1), unit: "°C", color: "#F49A9A", Icon: Thermometer, series: tempSeries },
  ];

  const healthScore = Math.round(
    100 -
      Math.abs(v.hr - 72) * 0.4 -
      Math.max(0, 98 - v.spo2) * 4 -
      Math.abs(v.temp - 36.9) * 6,
  );

  return (
    <Section id="dashboard" className="pt-4">
      <SectionHeader
        eyebrow="01 — Live overview"
        title="Greetings, Dr. Ram."
        sub="8 patients in your care · 1 critical · 2 pending reviews"
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid grid-cols-2 gap-4">
          {cards.map((c) => (
            <GlassCard key={c.label} className="!p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400">
                <c.Icon
                  className="h-3.5 w-3.5"
                  style={{
                    color: c.color,
                    animation: c.label === "Heart rate" ? `pulse ${60 / v.hr}s ease-in-out infinite` : undefined,
                  }}
                />
                {c.label}
              </div>
              <div className="mt-2 flex items-end gap-1">
                <div className="text-4xl font-normal text-neutral-900 tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {c.value}
                </div>
                <div className="pb-1 text-sm text-neutral-500">{c.unit}</div>
              </div>
              <div className="mt-3 h-8 w-full overflow-hidden rounded-lg" style={{ background: `linear-gradient(90deg, ${c.color}22, transparent)` }}>
                <StreamLine data={c.series} color={c.color} height={32} />
              </div>
            </GlassCard>
          ))}
          <GlassCard className="col-span-2 !p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-400">Health score</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-5xl font-normal text-neutral-900 tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {healthScore}
                  </div>
                  <div className="pb-2 text-sm text-neutral-500">/ 100</div>
                </div>
                <div className="mt-1 text-xs text-neutral-500">Live · updated every 1.2s</div>
              </div>
              <div
                className="relative h-24 w-24 rounded-full transition-all"
                style={{
                  background: `conic-gradient(#B89AF6 0 ${healthScore}%, rgba(0,0,0,0.06) ${healthScore}% 100%)`,
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
            <div className="rounded-full bg-emerald-50/80 px-3 py-1 text-xs text-emerald-700 tabular-nums">{v.hr} BPM</div>
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
          <EcgCanvas bpm={v.hr} height={132} />
          <div className="mt-3 flex gap-4 text-xs text-neutral-500 tabular-nums">
            <span>{v.hr} BPM</span>
            <span>HRV {v.hrv} ms</span>
            <span>Resp {v.resp}/min</span>
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
              ["Cardiovascular", v.stress < 40 ? "Low" : "Moderate", Math.min(90, v.stress + 10), "#A88BEF"],
              ["Fatigue", v.recovery > 75 ? "Low" : "Moderate", 100 - v.recovery, "#F5A15A"],
              ["Hydration", "Low", Math.round(30 + (v.hr - 72)), "#A88BEF"],
            ].map(([k, val, pct, c]) => (
              <div key={k as string}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-700">{k}</span>
                  <span className="text-neutral-500">{val}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/60">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(6, Math.min(100, pct as number))}%`, background: c as string }}
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

function LiveBedCard({ id, seed }: { id: string; seed: number }) {
  const v = useLiveVitals(1500 + seed * 120);
  const risk = v.spo2 < 96 ? "High" : v.hr > 78 ? "Moderate" : "Low";
  const riskColor = risk === "High" ? "#F06D6D" : risk === "Moderate" ? "#F5A15A" : "#A88BEF";
  return (
    <GlassCard className="!p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-800">{id}</div>
        <span className="rounded-full px-2 py-0.5 text-[11px] text-white" style={{ background: riskColor }}>
          {risk}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="HR" value={v.hr} color="#F06D6D" />
        <MiniStat label="SpO₂" value={`${v.spo2.toFixed(0)}%`} color="#A88BEF" />
        <MiniStat label="BP" value={`${v.sys}/${v.dia}`} color="#F5A15A" />
      </div>
    </GlassCard>
  );
}

function LiveMonitoringSection() {
  const beds = Array.from({ length: 8 }, (_, i) => `ICU-${(i + 1).toString().padStart(2, "0")}`);
  return (
    <Section id="live-monitoring">
      <SectionHeader
        eyebrow="02 — Live Monitoring"
        title="Every bed, every beat"
        sub="Vitals refresh in real time across the ward."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {beds.map((id, i) => (
          <LiveBedCard key={id} id={id} seed={i} />
        ))}
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

function PatientsSection({
  patientId,
  onSelect,
}: {
  patientId: string;
  onSelect: (id: string) => void;
}) {
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
        {PATIENTS.map((p) => {
          const isActive = p.id === patientId;
          return (
            <div
              key={p.id}
              className={`grid grid-cols-[1.4fr_60px_1fr_1fr_1.4fr_1fr_120px] items-center gap-4 border-b border-white/50 px-6 py-4 text-sm last:border-0 transition ${
                isActive ? "bg-white/60" : "hover:bg-white/40"
              }`}
            >
              <div className="font-medium text-neutral-800">{p.name}</div>
              <div className="text-neutral-500">{p.age}</div>
              <div className="text-neutral-500">{p.id}</div>
              <div className="text-neutral-500">{p.bed}</div>
              <div className="text-neutral-700">{p.condition}</div>
              <div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] text-white"
                  style={{
                    background:
                      p.risk === "High" || p.risk === "Critical"
                        ? "#F06D6D"
                        : p.risk === "Moderate"
                        ? "#F5A15A"
                        : "#A88BEF",
                  }}
                >
                  {p.risk}
                </span>
              </div>
              <button
                onClick={() => onSelect(p.id)}
                className="text-xs text-[#B89AF6] hover:underline"
              >
                Open timeline →
              </button>
            </div>
          );
        })}
      </GlassCard>
    </Section>
  );
}

function AIAssistantSection({
  lang,
  setLang,
  patient,
}: {
  lang: string;
  setLang: (l: string) => void;
  patient: Patient;
}) {
  type Msg = { role: "user" | "assistant"; content: string };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text?: string, attempt = 0) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setErr(null);
    const history: Msg[] = [...messages, { role: "user", content: q }];
    const patientContext: Msg = {
      role: "user",
      content:
        `[Active patient context — use for any patient-specific questions]\n` +
        `Name: ${patient.name} (${patient.id}), ${patient.age}${patient.gender}, ${patient.bloodGroup}\n` +
        `Bed: ${patient.bed} · Doctor: ${patient.doctor}\n` +
        `Diagnosis: ${patient.diagnosis} · Status: ${patient.status} · Risk: ${patient.risk}\n` +
        `Latest vitals — HR ${patient.vitals.hr}, BP ${patient.vitals.sys}/${patient.vitals.dia}, SpO₂ ${patient.vitals.spo2}%, Temp ${patient.vitals.temp}°C, RR ${patient.vitals.rr}\n` +
        `Recent timeline: ${patient.timeline
          .slice(0, 4)
          .map((t) => `${t.when} — ${t.title}: ${t.body}`)
          .join(" | ")}\n` +
        `AI summary: ${patient.aiSummary}`,
    };
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [patientContext, ...history],
          language: lang,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `PulseAI is unavailable (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
      if (!acc) throw new Error("Empty response from PulseAI.");
    } catch (e) {
      const msg = (e as Error).message ?? "Unknown error";
      // Automatic single retry on transient network failure
      if (attempt === 0 && /network|fetch|failed|502|503|504/i.test(msg)) {
        setMessages(history);
        await new Promise((r) => setTimeout(r, 800));
        setStreaming(false);
        return send(q, 1);
      }
      setMessages(history);
      setErr(
        "PulseAI couldn't respond right now. Please check your connection and try again.",
      );
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  };

  return (
    <Section id="ai-assistant">
      <SectionHeader
        eyebrow="04 — AI Assistant"
        title="Ask PulseAI"
        sub="Server-side AI companion. Ask about vitals, sepsis risk, or medication interactions."
      />
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-widest text-neutral-400">
            Multilingual clinical co-pilot
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Language</span>
            <select
              aria-label="Assistant language"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs text-neutral-700 outline-none focus:border-[#B89AF6]"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {messages.length === 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-[#F7B58C]/20 via-[#E9C5E9]/30 to-[#B89AF6]/20 p-5 text-sm text-neutral-700">
            <div className="text-xs uppercase tracking-widest text-neutral-500">PulseAI · Live insight</div>
            <p className="mt-2">
              Amelia's vitals are within normal range. Fatigue index is trending up — consider a short
              rest period and hydration prompt before her afternoon session.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Summarize sepsis red flags to watch tonight.",
                "Metformin + contrast — safe for tomorrow's CT?",
                "Interpret HR 92, SpO₂ 94%, temp 38.1°C, WBC 14.2.",
                "Explain how PulseAI monitors patients.",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs text-neutral-700 hover:bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div ref={listRef} className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-gradient-to-br from-[#F7B58C]/40 to-[#B89AF6]/40 text-neutral-800"
                    : "mr-auto max-w-[92%] border border-white/70 bg-white/70 text-neutral-700"
                }`}
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="relative">
                      <Markdown content={m.content} />
                      {streaming && i === messages.length - 1 && (
                        <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-[#B89AF6]" />
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F7B58C]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E9C5E9] [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B89AF6] [animation-delay:240ms]" />
                    </span>
                  )
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask PulseAI in any supported language…"
            aria-label="Message PulseAI"
            className="flex-1 rounded-full border border-white/70 bg-white/70 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-[#B89AF6]"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_-10px_rgba(184,154,246,0.6)] transition disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </button>
        </form>
      </GlassCard>
    </Section>
  );
}

const EHR_SAMPLE =
  "62F, post-op day 3 (CABG). HR 92, BP 108/62, SpO₂ 94% on 2L NC, temp 38.1°C, RR 22. WBC 14.2, CRP 96, lactate 2.4, creatinine 1.1. On ceftriaxone 1g IV, metoprolol 25mg BD, atorvastatin 40 mg. PMH: T2DM, HTN. Complaint: new drowsiness, mild wound erythema.";

function EHRSection() {
  const runChat = useServerFn(chatCopilot);
  const [ehrText, setEhrText] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    if (!ehrText.trim() || loading) return;
    setLoading(true);
    setErr(null);
    setPlan("");
    try {
      const res = await runChat({
        data: {
          messages: [
            {
              role: "user",
              content: `Analyze this patient snapshot and produce your structured plan.\n\n${ehrText}`,
            },
          ],
        },
      });
      setPlan(res.content);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section id="ehr">
      <SectionHeader
        eyebrow="05 — EHR Co-pilot"
        title="Synthesize the chart. Suggest the plan."
        sub="Paste any EHR text — history, meds, vitals, labs. PulseAI returns an evidence-based, guideline-cited plan."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">Patient EHR</div>
          <textarea
            value={ehrText}
            onChange={(e) => setEhrText(e.target.value)}
            rows={9}
            placeholder="62F, post-op day 3, HR 92, SpO2 94%, temp 38.1°C, WBC 14.2, on ceftriaxone…"
            className="mt-3 w-full resize-none rounded-2xl border border-white/70 bg-white/70 p-4 text-sm outline-none focus:border-[#B89AF6]"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setEhrText(EHR_SAMPLE)}
              className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-neutral-600 hover:bg-white"
            >
              Load sample
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={loading || !ehrText.trim()}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white shadow-[0_10px_24px_-10px_rgba(184,154,246,0.6)] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate plan
            </button>
          </div>
          {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs text-red-700">{err}</div>}
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">AI clinical plan</div>
          {!plan && !loading && (
            <p className="mt-3 text-sm text-neutral-500">
              Your evidence-based plan will appear here — assessment, red flags, workup, treatment
              with guideline citations, and monitoring.
            </p>
          )}
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#B89AF6]" /> Reasoning through the chart…
            </div>
          )}
          {plan && (
            <div className="mt-3 max-h-[520px] overflow-y-auto pr-2 text-sm text-neutral-700">
              <Markdown content={plan} />
            </div>
          )}
        </GlassCard>
      </div>
    </Section>
  );
}

function RadiologySection() {
  const runRad = useServerFn(summarizeRadiology);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [modality, setModality] = useState("X-Ray");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setResult("");
    setErr(null);
    setFile(f);
    if (!f) return setPreview(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!preview || loading) return;
    setLoading(true);
    setErr(null);
    setResult("");
    try {
      const res = await runRad({
        data: { imageDataUrl: preview, modality, clinical_context: context },
      });
      setResult(res.content);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section id="radiology">
      <SectionHeader
        eyebrow="06 — Radiology"
        title="From dense report to plain language."
        sub="Upload an X-ray, CT, MRI or ultrasound. PulseAI extracts key findings and generates a patient-friendly summary alongside the clinician view."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-neutral-400">Radiology report</div>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs text-neutral-600 outline-none"
            >
              {["X-Ray", "CT", "MRI", "Ultrasound", "Other"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <label
            htmlFor="rad-file"
            className="mt-3 flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/70 bg-white/40 text-sm text-neutral-400 hover:bg-white/60"
          >
            {preview ? (
              <img src={preview} alt="scan" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <Upload className="h-5 w-5 text-[#B89AF6]" />
                Click to upload PNG / JPG
                <span className="text-[11px] text-neutral-400">X-Ray · CT · MRI · Ultrasound</span>
              </div>
            )}
            <input
              id="rad-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            placeholder="Clinical context (optional) — e.g. 45F, cough & fever x 5d, r/o pneumonia"
            className="mt-3 w-full resize-none rounded-2xl border border-white/70 bg-white/70 p-3 text-sm outline-none focus:border-[#B89AF6]"
          />
          <button
            type="button"
            onClick={analyze}
            disabled={!file || loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_-10px_rgba(184,154,246,0.6)] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Summarize
          </button>
          {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs text-red-700">{err}</div>}
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-neutral-400">Dual-view summary</div>
          {!result && !loading && (
            <p className="mt-3 text-sm text-neutral-500">
              Clinician bullets on top, plain-English patient summary below — with recommended next
              steps.
            </p>
          )}
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#B89AF6]" /> Reading the image…
            </div>
          )}
          {result && (
            <div className="mt-3 max-h-[560px] overflow-y-auto pr-2 text-sm text-neutral-700">
              <Markdown content={result} />
            </div>
          )}
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

function TimelineSection({
  patientId,
  onSelect,
}: {
  patientId: string;
  onSelect: (id: string) => void;
}) {
  const patient = getPatient(patientId);
  return (
    <Section id="timeline">
      <SectionHeader
        eyebrow="08 — Patient timeline"
        title={`${patient.name} · ${patient.id}`}
        sub={`${patient.age}${patient.gender} · ${patient.bed} · ${patient.doctor} · ${patient.diagnosis}`}
      />
      <GlassCard>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-widest text-neutral-400">
            Switch patient
          </div>
          <select
            value={patientId}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Select patient"
            className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs text-neutral-700 outline-none focus:border-[#B89AF6]"
          >
            {PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.id} · {p.condition}
              </option>
            ))}
          </select>
        </div>
        <ol className="relative ml-3 border-l border-white/70 pl-6">
          {patient.timeline.map((ev, i) => (
            <li key={i} className="mb-6 last:mb-0">
              <span
                className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white"
                style={{ background: "linear-gradient(135deg,#F7B58C,#B89AF6)" }}
              />
              <div className="text-xs uppercase tracking-widest text-neutral-400">{ev.when}</div>
              <div className="mt-1 text-sm font-medium text-neutral-800">{ev.title}</div>
              <div className="text-sm text-neutral-500">{ev.body}</div>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#F7B58C]/20 via-[#E9C5E9]/30 to-[#B89AF6]/20 p-4 text-sm text-neutral-700">
          <div className="text-xs uppercase tracking-widest text-neutral-500">AI summary</div>
          <p className="mt-1">{patient.aiSummary}</p>
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
