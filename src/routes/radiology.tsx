import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Markdown } from "@/lib/markdown";
import { summarizeRadiology } from "@/lib/ai.functions";
import { Loader2, Upload, ScanLine } from "lucide-react";

export const Route = createFileRoute("/radiology")({
  head: () => ({
    meta: [
      { title: "Radiology Summarizer · PulseAI" },
      {
        name: "description",
        content:
          "Upload an X-ray, CT, MRI or ultrasound and get a clinician-grade findings list plus a plain-language patient summary.",
      },
    ],
  }),
  component: RadiologyPage,
});

const MODALITIES = ["X-Ray", "CT", "MRI", "Ultrasound", "Other"];

function RadiologyPage() {
  const run = useServerFn(summarizeRadiology);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [modality, setModality] = useState("X-Ray");
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (f: File | null) => {
    setResult(null);
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
    setResult(null);
    try {
      const res = await run({
        data: { imageDataUrl: preview, modality, clinical_context: ctx },
      });
      setResult(res.content);
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
          <h1 className="text-4xl md:text-5xl">Radiology Summarizer</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Drop a medical image. PulseAI produces a clinician-grade findings list and a warm,
            plain-language summary the patient can actually read.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
          {/* Upload panel */}
          <aside className="rounded-3xl glass p-5">
            <h2 className="font-display text-2xl">Upload scan</h2>

            <label
              htmlFor="scan"
              className="mt-4 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/30 text-center transition hover:bg-black/40"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="scan" className="h-full w-full object-contain" />
              ) : (
                <div className="p-8 text-sm text-muted-foreground">
                  <Upload className="mx-auto mb-3 h-6 w-6 text-primary" />
                  Click to upload PNG or JPEG
                  <div className="mt-1 text-xs">X-Ray · CT · MRI · Ultrasound</div>
                </div>
              )}
              <input
                id="scan"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Modality
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {MODALITIES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModality(m)}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        modality === m
                          ? "bg-primary text-primary-foreground"
                          : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Clinical context (optional)
                </span>
                <textarea
                  value={ctx}
                  onChange={(e) => setCtx(e.target.value)}
                  rows={3}
                  placeholder="45F, cough & fever x 5d, r/o pneumonia"
                  className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </label>
              <button
                onClick={analyze}
                disabled={!file || loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40 glow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" /> Generate summary
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Result */}
          <section className="min-h-[72vh] rounded-3xl glass p-6">
            {!result && !loading && !err && (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <ScanLine className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl">Awaiting scan</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Upload an image on the left, choose the modality and add a short clinical
                  context. Your summary appears here.
                </p>
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Reading image, extracting findings, drafting patient summary…
              </div>
            )}
            {err && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
                {err}
              </div>
            )}
            {result && (
              <article className="prose-invert max-w-none">
                <Markdown content={result} />
              </article>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
