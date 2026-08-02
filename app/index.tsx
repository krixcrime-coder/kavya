import { useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlwaysListening, ListenState } from "../src/hooks/useAlwaysListening";
import { sendTextMessage, AssistantTurn } from "../src/services/geminiService";
import { speak } from "../src/services/ttsService";
import { parseAction, executeAction } from "../src/services/deviceActions";
import { askAboutScreen } from "../src/services/visionService";
import { router } from "expo-router";

export default function KavyaScreen() {
  const [history, setHistory] = useState<AssistantTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true); // mic on/off master switch
  const historyRef = useRef<AssistantTurn[]>([]);
  historyRef.current = history;
  const scrollRef = useRef<ScrollView>(null);

  const handleSpeechFinal = useCallback(async (text: string) => {
    setErrorMsg(null);
    setHistory((prev) => [...prev, { role: "user", text }]);

    try {
      const reply = await sendTextMessage(text, historyRef.current);
      const { cleanText, action } = parseAction(reply);
      setHistory((prev) => [...prev, { role: "model", text: cleanText }]);
      setState("speaking");
      speak(cleanText, () => {
        restartListening();
      });
      if (action) {
        if (action.type === "scan") {
          router.push("/scan");
        } else if (action.type === "look_screen") {
          try {
            const screenReply = await askAboutScreen(action.question);
            setHistory((prev) => [...prev, { role: "model", text: screenReply }]);
            speak(screenReply, () => restartListening());
          } catch (e: any) {
            setErrorMsg(e.message);
          }
        } else {
          executeAction(action).catch((e) =>
            setErrorMsg(`Couldn't complete that action: ${e.message}`)
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setState("error");
      // still resume listening after a brief pause so one failure
      // doesn't permanently kill the hands-free loop
      setTimeout(() => restartListening(), 1200);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const { state, setState, partialText, restartListening } = useAlwaysListening({
    onSpeechFinal: handleSpeechFinal,
    enabled,
  });

  const statusLabel: Record<ListenState, string> = {
    idle: "Paused — tap orb to resume",
    listening: partialText ? partialText : "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
    error: "Had a hiccup — retrying...",
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>KAVYA 2.0</Text>
      <Text style={styles.subtitle}>Just speak — no button needed</Text>

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {history.length === 0 && (
          <Text style={styles.placeholder}>Say something to get started...</Text>
        )}
        {history.map((turn, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              turn.role === "user" ? styles.userBubble : styles.modelBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{turn.text}</Text>
          </View>
        ))}
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </ScrollView>

      <Pressable
        onPress={() => setEnabled((v) => !v)}
        style={[
          styles.orb,
          state === "listening" && styles.orbListening,
          state === "thinking" && styles.orbThinking,
          state === "speaking" && styles.orbSpeaking,
        ]}
      >
        <Text style={styles.orbLabel}>{enabled ? "●" : "○"}</Text>
      </Pressable>
      <Text style={styles.status}>{statusLabel[state]}</Text>
    </SafeAreaView>
  );
}

const PURPLE = "#b478ff";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08061A",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 12,
    letterSpacing: 3,
  },
  subtitle: {
    color: "#7a7590",
    fontSize: 12,
    marginTop: 4,
  },
  chat: {
    flex: 1,
    width: "100%",
    marginTop: 16,
  },
  placeholder: {
    color: "#555",
    textAlign: "center",
    marginTop: 40,
  },
  bubble: {
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#2b1f4a",
    alignSelf: "flex-end",
  },
  modelBubble: {
    backgroundColor: "#1a1730",
    alignSelf: "flex-start",
  },
  bubbleText: {
    color: "#fff",
    fontSize: 15,
  },
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 10,
  },
  orb: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  orbListening: {
    backgroundColor: "rgba(180,120,255,0.25)",
  },
  orbThinking: {
    backgroundColor: "rgba(255,200,80,0.2)",
    borderColor: "#ffc850",
  },
  orbSpeaking: {
    backgroundColor: "rgba(120,255,180,0.2)",
    borderColor: "#78ffb4",
  },
  orbLabel: {
    fontSize: 26,
    color: PURPLE,
  },
  status: {
    color: "#888",
    marginBottom: 24,
    fontSize: 13,
  },
});
