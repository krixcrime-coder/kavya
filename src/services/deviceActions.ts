/**
 * deviceActions.ts
 * ----------------
 * Opens native apps/intents based on recognized intent from Gemini's reply.
 * Gemini is instructed (via system prompt) to prefix action replies with
 * a machine-readable tag like [ACTION:CALL:9876543210] which we parse here.
 */
import { Linking } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Calendar from "expo-calendar";
import OverlayBubble from "../../modules/overlay-bubble";
import { findContactByName } from "./contactsService";

export type ParsedAction =
  | { type: "call"; number: string }
  | { type: "sms"; number: string; body?: string }
  | { type: "whatsapp"; number?: string; text: string }
  | { type: "maps"; query: string }
  | { type: "browser"; url: string }
  | { type: "youtube"; query: string }
  | { type: "alarm"; hour: number; minute: number; label?: string }
  | { type: "timer"; seconds: number; label?: string }
  | { type: "event"; title: string; isoDateTime: string }
  | { type: "scan" }
  | { type: "overlay_on" }
  | { type: "overlay_off" }
  | { type: "look_screen"; question: string }
  | { type: "spotify"; query: string }
  | { type: "contact_call"; contactName: string }
  | null;

const ACTION_REGEX = /\[ACTION:([A-Z]+):?([^\]]*)\]/;

export function parseAction(reply: string): {
  cleanText: string;
  action: ParsedAction;
} {
  const match = reply.match(ACTION_REGEX);
  if (!match) return { cleanText: reply, action: null };

  const [full, type, payload] = match;
  const cleanText = reply.replace(full, "").trim();
  const parts = payload.split("|");

  switch (type) {
    case "CALL":
      return { cleanText, action: { type: "call", number: parts[0] } };
    case "SMS":
      return {
        cleanText,
        action: { type: "sms", number: parts[0], body: parts[1] },
      };
    case "WHATSAPP":
      return {
        cleanText,
        action: { type: "whatsapp", number: parts[0] || undefined, text: parts[1] || "" },
      };
    case "MAPS":
      return { cleanText, action: { type: "maps", query: parts[0] } };
    case "BROWSER":
      return { cleanText, action: { type: "browser", url: parts[0] } };
    case "YOUTUBE":
      return { cleanText, action: { type: "youtube", query: parts[0] } };
    case "ALARM":
      return {
        cleanText,
        action: {
          type: "alarm",
          hour: parseInt(parts[0], 10),
          minute: parseInt(parts[1], 10),
          label: parts[2],
        },
      };
    case "TIMER":
      return {
        cleanText,
        action: { type: "timer", seconds: parseInt(parts[0], 10), label: parts[1] },
      };
    case "EVENT":
      return {
        cleanText,
        action: { type: "event", title: parts[0], isoDateTime: parts[1] },
      };
    case "SCAN":
      return { cleanText, action: { type: "scan" } };
    case "OVERLAY":
      return {
        cleanText,
        action: parts[0] === "OFF" ? { type: "overlay_off" } : { type: "overlay_on" },
      };
    case "LOOK":
      return { cleanText, action: { type: "look_screen", question: parts[0] || "" } };
    case "SPOTIFY":
      return { cleanText, action: { type: "spotify", query: parts[0] } };
    case "CONTACT_CALL":
      return { cleanText, action: { type: "contact_call", contactName: parts[0] } };
    default:
      return { cleanText, action: null };
  }
}

export async function executeAction(action: ParsedAction): Promise<void> {
  if (!action) return;

  switch (action.type) {
    case "call":
      await Linking.openURL(`tel:${action.number}`);
      break;
    case "sms":
      await Linking.openURL(
        `sms:${action.number}${action.body ? `?body=${encodeURIComponent(action.body)}` : ""}`
      );
      break;
    case "whatsapp":
      if (action.number) {
        await Linking.openURL(
          `whatsapp://send?phone=${action.number}&text=${encodeURIComponent(action.text)}`
        );
      } else {
        await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(action.text)}`);
      }
      break;
    case "maps":
      await Linking.openURL(`geo:0,0?q=${encodeURIComponent(action.query)}`);
      break;
    case "browser":
      await Linking.openURL(action.url);
      break;
    case "youtube":
      await Linking.openURL(
        `vnd.youtube:${encodeURIComponent(action.query)}`
      ).catch(() =>
        Linking.openURL(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(action.query)}`
        )
      );
      break;
    case "alarm":
      await IntentLauncher.startActivityAsync("android.intent.action.SET_ALARM", {
        extra: {
          "android.intent.extra.alarm.HOUR": action.hour,
          "android.intent.extra.alarm.MINUTES": action.minute,
          "android.intent.extra.alarm.MESSAGE": action.label ?? "Kavya alarm",
          "android.intent.extra.alarm.SKIP_UI": true,
        },
      });
      break;
    case "timer":
      await IntentLauncher.startActivityAsync("android.intent.action.SET_TIMER", {
        extra: {
          "android.intent.extra.alarm.LENGTH": action.seconds,
          "android.intent.extra.alarm.MESSAGE": action.label ?? "Kavya timer",
          "android.intent.extra.alarm.SKIP_UI": true,
        },
      });
      break;
    case "event": {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") throw new Error("Calendar permission not granted");
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      const defaultCal =
        calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (!defaultCal) throw new Error("No writable calendar found on device");
      const startDate = new Date(action.isoDateTime);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // default 1hr
      await Calendar.createEventAsync(defaultCal.id, {
        title: action.title,
        startDate,
        endDate,
      });
      break;
    }
    case "overlay_on":
      if (!OverlayBubble.hasPermission()) {
        OverlayBubble.requestPermission();
      } else {
        OverlayBubble.show();
      }
      break;
    case "overlay_off":
      OverlayBubble.hide();
      break;
    case "spotify":
      await Linking.openURL(
        `spotify:search:${encodeURIComponent(action.query)}`
      ).catch(() =>
        Linking.openURL(`https://open.spotify.com/search/${encodeURIComponent(action.query)}`)
      );
      break;
    case "contact_call": {
      const contact = await findContactByName(action.contactName);
      if (!contact || contact.phones.length === 0) {
        throw new Error(`Contact "${action.contactName}" not found or has no phone number`);
      }
      await Linking.openURL(`tel:${contact.phones[0]}`);
      break;
    }
  }
}
