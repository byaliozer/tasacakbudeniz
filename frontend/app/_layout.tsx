import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SoundProvider } from '../src/context/SoundContext';
import { AdProvider } from '../src/context/AdContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { hasUsername } from '../src/services/api';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkUsername();
  }, []);

  useEffect(() => {
    if (!isLoading && needsUsername && segments[0] !== 'username') {
      router.replace('/username');
    }
  }, [isLoading, needsUsername, segments]);

  const checkUsername = async () => {
    const has = await hasUsername();
    setNeedsUsername(!has);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#009688" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="username" options={{ gestureEnabled: false }} />
      <Stack.Screen name="episodes" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="result" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SoundProvider>
      <AdProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </AdProvider>
    </SoundProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
