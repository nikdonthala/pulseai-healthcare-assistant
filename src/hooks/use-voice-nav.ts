import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceCommand = {
  target: string;
  phrases: string[];
  /** Optional payload extractor from the matched transcript (e.g. search term). */
  extract?: (transcript: string, phrase: string) => string | undefined;
};

export type VoiceMatch = {
  target: string;
  transcript: string;
  payload?: string;
};

export type UseVoiceNavOptions = {
  commands: VoiceCommand[];
  onCommand: (match: VoiceMatch) => void;
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
  const [recognized, setRecognized] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const wantListenRef = useRef(false);
  const firedRef = useRef(false);

  const commandsRef = useRef(commands);
  const onCommandRef = useRef(onCommand);
  const onQuestionRef = useRef(onQuestion);
  commandsRef.current = commands;
  onCommandRef.current = onCommand;
  onQuestionRef.current = onQuestion;

  const tryMatch = useCallback((text: string): VoiceMatch | null => {
    const clean = text.toLowerCase().trim();
    if (!clean) return null;
    for (const c of commandsRef.current) {
      for (const p of c.phrases) {
        const phrase = p.toLowerCase();
        if (clean.includes(phrase)) {
          const payload = c.extract?.(clean, phrase);
          return { target: c.target, transcript: text, payload };
        }
      }
    }
    return null;
  }, []);

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
      let newFinal = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) newFinal += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      finalBuf += newFinal;
      const display = (finalBuf + interim).trim();
      setTranscript(display);

      // Immediate command execution on interim OR final results.
      if (!firedRef.current) {
        const match = tryMatch(display);
        if (match) {
          firedRef.current = true;
          setRecognized(display);
          onCommandRef.current?.(match);
          // Reset for next utterance.
          finalBuf = "";
          setTimeout(() => {
            firedRef.current = false;
            setTranscript("");
          }, 900);
        }
      }
    };

    rec.onerror = (e: any) => {
      if (e?.error === "no-speech" || e?.error === "aborted") return;
      setListening(false);
    };

    rec.onend = () => {
      const finalText = finalBuf.trim();
      finalBuf = "";
      if (!firedRef.current && finalText) {
        const match = tryMatch(finalText);
        if (match) {
          setRecognized(finalText);
          onCommandRef.current?.(match);
        } else if (onQuestionRef.current) {
          onQuestionRef.current(finalText);
        }
      }
      firedRef.current = false;
      // Auto-restart if user still wants to listen (browsers stop after ~60s).
      if (wantListenRef.current) {
        try {
          rec.start();
          return;
        } catch {}
      }
      setListening(false);
    };

    recRef.current = rec;
    return () => {
      wantListenRef.current = false;
      try {
        rec.abort();
      } catch {}
      recRef.current = null;
    };
  }, [lang, tryMatch]);

  const start = useCallback(async () => {
    const rec = recRef.current;
    if (!rec || listening) return;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      return;
    }
    setTranscript("");
    setRecognized("");
    wantListenRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {}
  }, [listening]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    wantListenRef.current = false;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
  }, []);

  return { listening, transcript, recognized, supported, start, stop };
}
