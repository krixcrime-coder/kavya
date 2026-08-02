/**
 * visionService.ts
 * ----------------
 * Takes a screenshot (via the screen-capture native module) and asks
 * Gemini a question about what's on screen — e.g. "what does this error mean".
 */
import * as FileSystem from "expo-file-system";
import ScreenCapture from "../../modules/screen-capture";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function askAboutScreen(question: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY.");
  }

  const filePath = await ScreenCapture.captureScreen();
  const base64 = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: "image/png", data: base64 } },
            { text: question || "What's on my screen right now?" },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini vision error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}
