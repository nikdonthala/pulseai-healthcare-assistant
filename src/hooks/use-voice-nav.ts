import { useCallback, useEffect, useRef, useState } from "react";

type SR = typeof window extends { SpeechRecognition: infer T }
  ? T
  : unknown;

export type VoiceCommand = {
  /** Section id or route target */
  target: string;
  /** Words/phrases that should match this target */
  phrases: string[];
};

export function useVoiceNav(
  commands: VoiceCommand[],
  onMatch: (target: string) => void,
) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SRClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SRClass) return;
    setSupported(true);
    const rec = new SRClass();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      const clean = text.toLowerCase().trim();
      setTranscript(clean);
      const final = e.results[e.results.length - 1].isFinal;
      if (final) {
        const match = commands.find((c) =>
          c.phrases.some((p) => clean.includes(p.toLowerCase())),
        );
        if (match) onMatch(match.target);
        setListening(false);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [commands, onMatch]);

  const start = useCallback(() => {
    if (!recRef.current || listening) return;
    setTranscript("");
    try {
      recRef.current.start();
      setListening(true);
    } catch {}
  }, [listening]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
    setListening(false);
  }, []);

  return { listening, transcript, supported, start, stop };
}
