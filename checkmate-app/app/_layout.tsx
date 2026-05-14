import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(); // Ignore all log notifications

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
