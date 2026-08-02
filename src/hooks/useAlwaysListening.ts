/**
 * useAlwaysListening.ts
 * ---------------------
 * Hands-free voice loop:
 *   listen -> (user speaks) -> recognizer auto-detects end of speech
 *   -> onSpeechFinal(text) fires -> caller processes it (Gemini + TTS)
 *   -> caller calls restartListening() when done speaking -> loop repeats
 *
 * Uses expo-speech-recognition, which wraps Android's SpeechRecognizer.
 * That recognizer already does automatic silence/end-of-speech detection,
 * so no manual button press is needed — you just talk.
 *
 * NOTE: needs a native/dev build (won't work in plain Expo Go) since it's
 * a native module — build via `npx expo run:android` or the GitHub Actions
 * workflow, not Expo Go.
 *
 * Replaces the previously used @react-native-voice/voice, which is
 * abandoned and no longer builds against modern Gradle/AGP versions.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

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
  const onSpeechFinalRef = useRef(onSpeechFinal);
  onSpeechFinalRef.current = onSpeechFinal;

  const restartListening = useCallback(() => {
    if (!enabledRef.current) return;
    busyRef.current = false;
    try {
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
      setState("listening");
    } catch {
      // Sometimes throws if a session is already active — retry shortly.
      setTimeout(() => {
        if (enabledRef.current) restartListening();
      }, 400);
    }
  }, [locale]);

  useEffect(() => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => {});
  }, []);

  useSpeechRecognitionEvent("result", (event) => {
    if (busyRef.current) return;
    const text = event.results?.[0]?.transcript?.trim();

    if (!event.isFinal) {
      setPartialText(text ?? "");
      return;
    }

    setPartialText("");
    if (!text) {
      restartListening();
      return;
    }
    busyRef.current = true;
    setState("thinking");
    Promise.resolve(onSpeechFinalRef.current(text));
    // caller must call restartListening() once it's done speaking
  });

  useSpeechRecognitionEvent("error", () => {
    // Common on timeout / no speech detected — just listen again quietly.
    if (!busyRef.current) restartListening();
  });

  useSpeechRecognitionEvent("end", () => {
    // Android's recognizer stops after each utterance even with continuous:true
    // in some OEM builds — restart automatically if we're not busy processing.
    if (!busyRef.current && enabledRef.current) restartListening();
  });

  useEffect(() => {
    if (enabled) {
      restartListening();
    } else {
      ExpoSpeechRecognitionModule.stop();
      setState("idle");
    }
  }, [enabled, restartListening]);

  return { state, setState, partialText, restartListening };
}
