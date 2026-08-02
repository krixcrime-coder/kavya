import { requireNativeModule } from "expo-modules-core";

interface ScreenCaptureModule {
  captureScreen(): Promise<string>; // resolves to a local file path (PNG)
}

const ScreenCapture = requireNativeModule<ScreenCaptureModule>("ScreenCapture");

export default ScreenCapture;
