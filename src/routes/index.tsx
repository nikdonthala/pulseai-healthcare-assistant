import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Activity, Brain, ScanLine, ShieldCheck, Stethoscope, Waves } from "lucide-react";

const HeartScene = lazy(() =>
  import("@/components/HeartScene").then((m) => ({ default: m.HeartScene })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseAI — Clinical Co-Pilot for General Physicians" },
      {
        name: "description",
        content:
          "PulseAI synthesizes multi-modal EHR data and summarizes radiology reports into plain-language insights for physicians and patients.",
      },
      { property: "og:title", content: "PulseAI — Clinical Co-Pilot" },
      {
        property: "og:description",
        content:
          "Evidence-based treatment suggestions and plain-language radiology summaries, in one console.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4">
        <Nav />

        {/* HERO */}
        <section className="relative grid gap-10 pt-14 pb-24 md:grid-cols-2 md:pt-24">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-vital animate-pulse" />
              Clinical intelligence · v2.0
            </div>
            <h1 className="mt-6 text-5xl leading-[1.05] md:text-7xl">
              An AI co-pilot that <span className="text-gradient">thinks like a physician</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              PulseAI reads across your patient's EHR — vitals, history, labs, medications — and
              returns evidence-based treatment suggestions in seconds. Upload a scan and get a
              radiology summary written for both clinicians and patients.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/copilot"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow-primary transition hover:opacity-90"
              >
                Open the Co-Pilot
              </Link>
              <Link
                to="/radiology"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-white/10"
              >
                Try radiology summarizer
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
              <Stat label="Modalities" value="4+" />
              <Stat label="Guidelines cited" value="NICE · AHA · IDSA" small />
              <Stat label="Latency" value="~1.4s" />
            </div>
          </div>

          {/* 3D HEART */}
          <div className="relative h-[520px] rounded-3xl glass overflow-hidden">
            <div className="absolute inset-0">
              <Suspense fallback={<HeartFallback />}>
                <HeartScene />
              </Suspense>
            </div>
            <div className="pointer-events-none absolute left-5 top-5 rounded-xl bg-black/40 backdrop-blur px-3 py-2 text-xs">
              <div className="text-muted-foreground">Live model · sinus rhythm</div>
              <div className="mt-0.5 flex items-center gap-2 font-mono text-vital">
                <span className="h-1.5 w-1.5 rounded-full bg-vital animate-pulse" />
                72 BPM · SpO₂ 98%
              </div>
            </div>
            <div className="pointer-events-none absolute right-5 bottom-5 rounded-xl bg-black/40 backdrop-blur px-3 py-2 text-xs text-muted-foreground">
              drag to rotate
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="pb-28">
          <h2 className="text-4xl md:text-5xl">Two consoles. One clinical brain.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Purpose-built surfaces for the two moments physicians need help most — synthesizing
            complex charts, and translating imaging into something everyone understands.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <FeatureCard
              icon={<Stethoscope className="h-5 w-5" />}
              title="EHR synthesis + treatment"
              body="Enter vitals, history, meds and complaint. PulseAI returns a structured impression, differential, workup, and evidence-based treatment — every response cites guidelines."
              to="/copilot"
              cta="Open co-pilot"
            />
            <FeatureCard
              icon={<ScanLine className="h-5 w-5" />}
              title="Radiology summarizer"
              body="Drop an X-ray, CT slice, MRI, or ultrasound. Get a clinician-grade findings list AND a warm, plain-language summary written for the patient."
              to="/radiology"
              cta="Summarize a scan"
              accent
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <MiniCard icon={<Brain />} title="Multi-modal reasoning" body="Text + medical imagery in one model call." />
            <MiniCard icon={<Waves />} title="Vitals-aware" body="Blends structured EHR context into every suggestion." />
            <MiniCard icon={<ShieldCheck />} title="Physician-in-the-loop" body="Every response ends with a decision-support disclaimer." />
            <MiniCard icon={<Activity />} title="Secure by default" body="Model keys stay server-side. No data leaves your session." />
          </div>
        </section>

        <footer className="border-t border-white/5 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} PulseAI · Decision support only — not a substitute for professional medical judgment.
        </footer>
      </div>
    </div>
  );
}

function HeartFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-40 w-40 rounded-full bg-accent/30 animate-pulse" />
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className={small ? "font-display text-lg" : "font-display text-3xl"}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  to,
  cta,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  to: string;
  cta: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between rounded-3xl glass p-8 transition hover:-translate-y-0.5"
    >
      <div>
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            accent ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"
          }`}
        >
          {icon}
        </div>
        <h3 className="mt-5 text-3xl">{title}</h3>
        <p className="mt-3 text-muted-foreground">{body}</p>
      </div>
      <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground">
        {cta}
        <span className="transition group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}

function MiniCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-primary">
        {icon}
      </div>
      <div className="mt-3 font-medium">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
