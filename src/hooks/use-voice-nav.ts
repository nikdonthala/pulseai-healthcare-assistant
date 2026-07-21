import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceCommand = {
  target: string;
  phrases: string[];
};

export type UseVoiceNavOptions = {
  commands: VoiceCommand[];
  onCommand: (target: string) => void;
  /** Called with the final transcript when it did NOT match a navigation command. */
  onQuestion?: (text: string) => void;
  lang?: string;
};

export function useVoiceNav({
  commands,
  onCommand,
  onQuestion,
  lang = "en-US",
}: UseVoiceNavOptions) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);

  // Keep callbacks/commands in refs so we don't recreate the recognizer on every render.
  const commandsRef = useRef(commands);
  const onCommandRef = useRef(onCommand);
  const onQuestionRef = useRef(onQuestion);
  commandsRef.current = commands;
  onCommandRef.current = onCommand;
  onQuestionRef.current = onQuestion;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SRClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SRClass) return;
    setSupported(true);

    const rec = new SRClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    let finalBuf = "";

    rec.onstart = () => setListening(true);

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalBuf += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      const display = (finalBuf + interim).trim();
      setTranscript(display);
    };

    rec.onerror = (e: any) => {
      if (e?.error === "no-speech" || e?.error === "aborted") return;
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      const finalText = finalBuf.trim();
      finalBuf = "";
      if (!finalText) return;
      const clean = finalText.toLowerCase();
      const match = commandsRef.current.find((c) =>
        c.phrases.some((p) => clean.includes(p.toLowerCase())),
      );
      if (match) {
        onCommandRef.current?.(match.target);
      } else if (onQuestionRef.current) {
        onQuestionRef.current(finalText);
      }
    };

    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
      recRef.current = null;
    };
  }, [lang]);

  const start = useCallback(async () => {
    const rec = recRef.current;
    if (!rec || listening) return;
    // Prompt/verify microphone permission proactively so UI errors are clear.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      return;
    }
    setTranscript("");
    try {
      rec.start();
      setListening(true);
    } catch {}
  }, [listening]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
  }, []);

  return { listening, transcript, supported, start, stop };
}
