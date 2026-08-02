import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { speak } from "../src/services/ttsService";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setResult(data);
    speak(`Scanned: ${data}`);
  }, [scanned]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kavya needs camera access to scan.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />
      <View style={styles.overlay}>
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{result}</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {result.startsWith("http") && (
                <Pressable
                  style={styles.button}
                  onPress={() => Linking.openURL(result)}
                >
                  <Text style={styles.buttonText}>Open link</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.button}
                onPress={() => {
                  setScanned(false);
                  setResult(null);
                }}
              >
                <Text style={styles.buttonText}>Scan again</Text>
              </Pressable>
            </View>
          </View>
        )}
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", marginBottom: 16, textAlign: "center", paddingHorizontal: 24 },
  overlay: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  resultBox: {
    backgroundColor: "#1a1730",
    padding: 16,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
    gap: 10,
  },
  resultText: { color: "#fff", fontSize: 14, textAlign: "center" },
  button: {
    backgroundColor: "#b478ff",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
