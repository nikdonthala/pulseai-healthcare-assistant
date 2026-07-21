import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Markdown } from "@/lib/markdown";
import { chatCopilot } from "@/lib/ai.functions";
import { Send, Loader2, User2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "Clinical Co-Pilot · PulseAI" },
      {
        name: "description",
        content:
          "Enter patient EHR context and get evidence-based, guideline-cited treatment suggestions.",
      },
    ],
  }),
  component: CopilotPage,
});

type Msg = { role: "user" | "assistant"; content: string };
type EHR = {
  name?: string;
  age?: number;
  sex?: string;
  vitals?: string;
  history?: string;
  medications?: string;
  labs?: string;
  chief_complaint?: string;
};

const SAMPLE: EHR = {
  name: "J. Doe",
  age: 58,
  sex: "M",
  vitals: "BP 158/96, HR 92, T 37.1°C, SpO2 96% RA, RR 18",
  history: "T2DM (8y), hyperlipidemia, ex-smoker (30 pack-years)",
  medications: "Metformin 1g BD, Atorvastatin 40mg OD",
  labs: "HbA1c 8.4%, LDL 3.9, eGFR 68, K 4.1",
  chief_complaint: "Central chest tightness on exertion x 2 weeks, relieved by rest",
};

function CopilotPage() {
  const runChat = useServerFn(chatCopilot);
  const [ehr, setEhr] = useState<EHR>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setErr(null);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await runChat({ data: { messages: next, ehr } });
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4">
        <Nav />
        <div className="mt-8 mb-6">
          <h1 className="text-4xl md:text-5xl">Clinical Co-Pilot</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Populate the EHR panel — vitals, meds, labs, complaint — then ask anything. PulseAI
            synthesizes it and returns structured, guideline-cited guidance.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* EHR PANEL */}
          <aside className="rounded-3xl glass p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Patient EHR</h2>
              <button
                type="button"
                onClick={() => setEhr(SAMPLE)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground hover:bg-white/5"
              >
                Load sample
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <Row2>
                <Field label="Name" value={ehr.name} onChange={(v) => setEhr({ ...ehr, name: v })} />
                <Field
                  label="Age"
                  type="number"
                  value={ehr.age?.toString()}
                  onChange={(v) => setEhr({ ...ehr, age: v ? Number(v) : undefined })}
                />
              </Row2>
              <Field label="Sex" value={ehr.sex} onChange={(v) => setEhr({ ...ehr, sex: v })} />
              <Field label="Vitals" value={ehr.vitals} onChange={(v) => setEhr({ ...ehr, vitals: v })} area />
              <Field label="History" value={ehr.history} onChange={(v) => setEhr({ ...ehr, history: v })} area />
              <Field
                label="Medications"
                value={ehr.medications}
                onChange={(v) => setEhr({ ...ehr, medications: v })}
                area
              />
              <Field label="Labs" value={ehr.labs} onChange={(v) => setEhr({ ...ehr, labs: v })} area />
              <Field
                label="Chief complaint"
                value={ehr.chief_complaint}
                onChange={(v) => setEhr({ ...ehr, chief_complaint: v })}
                area
              />
            </div>
          </aside>

          {/* CHAT */}
          <section className="flex h-[72vh] flex-col rounded-3xl glass">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.length === 0 && (
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl">Ask the co-pilot</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try one of these to see structured, guideline-aware output.
                  </p>
                  <div className="mt-5 grid gap-2">
                    {[
                      "Summarize this patient and give a working diagnosis.",
                      "Recommend an evidence-based workup and treatment plan.",
                      "What red flags should I safety-net for?",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-left text-sm text-foreground/90 transition hover:bg-white/[0.06]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Consulting evidence base…
                </div>
              )}
              {err && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                  {err}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-white/5 p-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this patient…"
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm outline-none focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  area,
  type,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  area?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {area ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
      ) : (
        <input
          type={type ?? "text"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
      )}
    </label>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-white/10" : "bg-primary/20 text-primary"
        }`}
      >
        {isUser ? <User2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "border border-white/8 bg-white/[0.03]"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px]">{msg.content}</p>
        ) : (
          <Markdown content={msg.content} />
        )}
      </div>
    </div>
  );
}
