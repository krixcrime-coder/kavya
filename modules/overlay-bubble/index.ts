import { requireNativeModule } from "expo-modules-core";

interface OverlayBubbleModule {
  hasPermission(): boolean;
  requestPermission(): void;
  show(): void;
  hide(): void;
}

const OverlayBubble = requireNativeModule<OverlayBubbleModule>("OverlayBubble");

export default OverlayBubble;
