import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SoundProvider } from "../src/context/SoundContext";

export default function RootLayout() {
  return (
    <SoundProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1CB0F6" },
          animation: "slide_from_right",
        }}
      />
    </SoundProvider>
  );
}
