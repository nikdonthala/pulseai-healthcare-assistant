// Minimal, safe markdown-ish renderer (no external dep).
// Supports: ## headings, **bold**, *italic*, > quotes, - bullets, paragraphs.
import { Fragment } from "react";

function renderInline(text: string, keyBase: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const tok = match[0];
    if (tok.startsWith("**"))
      parts.push(<strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`"))
      parts.push(
        <code key={`${keyBase}-${i++}`} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    else parts.push(<em key={`${keyBase}-${i++}`}>{tok.slice(1, -1)}</em>);
    lastIndex = match.index + tok.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];

  const flushList = (key: string) => {
    if (!listBuffer.length) return;
    blocks.push(
      <ul key={`ul-${key}`} className="my-2 list-disc space-y-1 pl-5 text-[15px]">
        {listBuffer.map((it, idx) => (
          <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };
  const flushPara = (key: string) => {
    if (!paraBuffer.length) return;
    blocks.push(
      <p key={`p-${key}`} className="my-2 leading-relaxed text-[15px]">
        {renderInline(paraBuffer.join(" "), `p-${key}`)}
      </p>,
    );
    paraBuffer = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const key = String(i);
    if (line.startsWith("## ")) {
      flushList(key);
      flushPara(key);
      blocks.push(
        <h3 key={`h-${key}`} className="mt-5 font-display text-2xl text-foreground">
          {renderInline(line.slice(3), `h-${key}`)}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      flushList(key);
      flushPara(key);
      blocks.push(
        <blockquote
          key={`bq-${key}`}
          className="my-3 border-l-2 border-primary/60 bg-primary/5 px-4 py-2 text-sm text-muted-foreground"
        >
          {renderInline(line.slice(2), `bq-${key}`)}
        </blockquote>,
      );
    } else if (/^[-*]\s+/.test(line)) {
      flushPara(key);
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
    } else if (line === "") {
      flushList(key);
      flushPara(key);
    } else {
      flushList(key);
      paraBuffer.push(line);
    }
  });
  flushList("end");
  flushPara("end");

  return <Fragment>{blocks}</Fragment>;
}
