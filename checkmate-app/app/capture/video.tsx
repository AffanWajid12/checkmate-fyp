import RecorderScreen from "@/components/RecorderScreen";
import { View } from "react-native";

export default function VideoCaptureScreen() {
  return (
    <View style={{ flex: 1 }}>
      <RecorderScreen />
    </View>
  );
}
