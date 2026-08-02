/**
 * geminiService.ts
 * -----------------
 * Sends the recognized speech text (from on-device speech recognition)
 * to Gemini and returns a spoken-style reply. Text-only calls are fast
 * and cheap, which keeps the always-listening loop feeling responsive.
 */

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface AssistantTurn {
  role: "user" | "model";
  text: string;
}

const SYSTEM_INSTRUCTION = `You are Kavya, a helpful, warm personal voice assistant.
Keep replies short and conversational (1-3 sentences) since they will be spoken aloud —
avoid long lists, markdown, or symbols. You are a personal automation app, not a generic
chatbot: be direct and practical. If the user's message seems like a misheard fragment
(speech recognition can be imperfect), do your best to interpret intent naturally.

When the user asks you to DO something on their phone, end your reply with exactly one
machine-readable action tag (still keep the spoken sentence natural before it):
[ACTION:CALL:<phone_number>]
[ACTION:SMS:<phone_number>|<message>]
[ACTION:WHATSAPP:<phone_number_or_empty>|<message>]
[ACTION:MAPS:<place_or_address>]
[ACTION:BROWSER:<full_url>]
[ACTION:YOUTUBE:<search_query>]
[ACTION:ALARM:<hour_24h>:<minute>:<label>]
[ACTION:TIMER:<seconds>:<label>]
[ACTION:EVENT:<title>|<ISO_datetime>]
[ACTION:SCAN]
[ACTION:OVERLAY:ON] or [ACTION:OVERLAY:OFF]
[ACTION:LOOK:<question_about_the_screen>]
[ACTION:SPOTIFY:<song_or_artist_or_playlist_name>]
[ACTION:CONTACT_CALL:<contact_name>]
Only include a tag if the user clearly asked for that action. Never invent phone numbers —
if you don't know the number, ask the user for it instead of using a tag.
For ALARM, convert any time the user says (e.g. "7:30 am") into 24-hour hour/minute.
For EVENT, convert relative dates ("tomorrow 5pm") into a full ISO datetime using the
current date/time given below.`;;

export async function sendTextMessage(
  message: string,
  history: AssistantTurn[]
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_GEMINI_API_KEY — add it to your .env file (see .env.example)."
    );
  }

  const contents = [
    ...history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          { text: SYSTEM_INSTRUCTION },
          { text: `Current date/time: ${new Date().toISOString()}` },
        ],
      },
      contents,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
