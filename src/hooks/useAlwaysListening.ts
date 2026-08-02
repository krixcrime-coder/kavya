/**
 * useAlwaysListening.ts
 * ---------------------
 * Hands-free voice loop:
 *   listen -> (user speaks) -> recognizer auto-detects end of speech
 *   -> onSpeechFinal(text) fires -> caller processes it (Gemini + TTS)
 *   -> caller calls restartListening() when done speaking -> loop repeats
 *
 * Uses @react-native-voice/voice, which wraps Android's SpeechRecognizer.
 * That recognizer already does automatic silence/end-of-speech detection,
 * so no manual button press is needed — you just talk.
 *
 * Requires: npm install @react-native-voice/voice
 * NOTE: needs a native/dev build (won't work in plain Expo Go) since it's
 * a native module — build via `npx expo run:android` or the GitHub Actions
 * workflow, not Expo Go.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

export type ListenState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface Options {
  onSpeechFinal: (text: string) => void | Promise<void>;
  enabled: boolean;
  locale?: string; // e.g. "en-IN", "hi-IN"
}

export function useAlwaysListening({
  onSpeechFinal,
  enabled,
  locale = "en-IN",
}: Options) {
  const [state, setState] = useState<ListenState>("idle");
  const [partialText, setPartialText] = useState("");
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const busyRef = useRef(false); // true while thinking/speaking — ignore stray results

  const restartListening = useCallback(async () => {
    if (!enabledRef.current) return;
    busyRef.current = false;
    try {
      await Voice.start(locale);
      setState("listening");
    } catch {
      // Sometimes throws if a session is already active — retry shortly.
      setTimeout(() => {
        if (enabledRef.current) restartListening();
      }, 400);
    }
  }, [locale]);

  useEffect(() => {
    Voice.onSpeechResults = async (e: SpeechResultsEvent) => {
      if (busyRef.current) return;
      const text = e.value?.[0]?.trim();
      setPartialText("");
      if (!text) {
        restartListening();
        return;
      }
      busyRef.current = true;
      setState("thinking");
      await onSpeechFinal(text);
      // caller must call restartListening() once it's done speaking
    };

    Voice.onSpeechPartialResults = (e) => {
      setPartialText(e.value?.[0] ?? "");
    };

    Voice.onSpeechError = (_e: SpeechErrorEvent) => {
      // Common on timeout / no speech detected — just listen again quietly.
      if (!busyRef.current) restartListening();
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onSpeechFinal, restartListening]);

  useEffect(() => {
    if (enabled) {
      restartListening();
    } else {
      Voice.stop().catch(() => {});
      setState("idle");
    }
  }, [enabled, restartListening]);

  return { state, setState, partialText, restartListening };
}
