import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SoundProvider } from "../src/context/SoundContext";
import { AdProvider } from "../src/context/AdContext";

export default function RootLayout() {
  return (
    <AdProvider>
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
    </AdProvider>
  );
}
