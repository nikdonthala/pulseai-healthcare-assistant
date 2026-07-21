import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

export type SearchItem = {
  id: string;
  label: string;
  section: string;
  keywords?: string;
};

export function SearchPalette({
  items,
  onSelect,
  open,
  onOpenChange,
}: {
  items: SearchItem[];
  onSelect: (item: SearchItem) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 8);
    return items
      .map((it) => {
        const hay = `${it.label} ${it.section} ${it.keywords ?? ""}`.toLowerCase();
        let score = 0;
        if (hay.includes(s)) score += 10;
        // fuzzy subsequence
        let idx = 0;
        for (const ch of s) {
          const p = hay.indexOf(ch, idx);
          if (p === -1) return { it, score: -1 };
          score += 1;
          idx = p + 1;
        }
        return { it, score };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => r.it);
  }, [q, items]);

  useEffect(() => {
    if (i >= results.length) setI(0);
  }, [results.length, i]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 border-b border-white/60 px-4 py-3">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((p) => Math.min(results.length - 1, p + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((p) => Math.max(0, p - 1));
              } else if (e.key === "Enter" && results[i]) {
                e.preventDefault();
                onSelect(results[i]);
                onOpenChange(false);
              }
            }}
            placeholder="Search patients, sections, reports…"
            className="flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <kbd className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] text-neutral-500">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-neutral-400">No matches</li>
          )}
          {results.map((it, idx) => (
            <li key={it.id}>
              <button
                onClick={() => {
                  onSelect(it);
                  onOpenChange(false);
                }}
                onMouseEnter={() => setI(idx)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                  idx === i ? "bg-white/90 text-neutral-900" : "text-neutral-700 hover:bg-white/60"
                }`}
              >
                <span>{it.label}</span>
                <span className="text-[11px] uppercase tracking-widest text-neutral-400">
                  {it.section}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
