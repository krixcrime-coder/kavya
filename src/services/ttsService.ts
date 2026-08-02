/**
 * ttsService.ts
 * -------------
 * Speaks Gemini's reply out loud. Accepts an onDone callback so the
 * always-listening loop knows exactly when it's safe to start
 * listening again (prevents Kavya from hearing/responding to itself).
 */
import * as Speech from "expo-speech";

export function speak(text: string, onDone?: () => void) {
  Speech.stop();
  Speech.speak(text, {
    rate: 1.0,
    pitch: 1.05,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
