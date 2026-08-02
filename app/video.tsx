import { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function VideoScreen() {
  const [videoUrl] = useState<string | null>(null);
  const player = useVideoPlayer(videoUrl || "", (p) => {
    p.play();
  });

  if (!videoUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>No video URL provided</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView style={styles.video} player={player} />
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    flex: 1,
    width: "100%",
  },
  text: { color: "#fff", marginBottom: 16 },
  button: {
    backgroundColor: "#b478ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
