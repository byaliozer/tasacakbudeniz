import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BannerAdProps {
  style?: object;
}

/**
 * Banner Ad Placeholder Component
 * Expo Go'da placeholder gösterir
 * Production build'de gerçek AdMob reklamı gösterecek
 * 
 * AdMob IDs:
 * - Banner: ca-app-pub-9873123247401502/9749849505
 * - Interstitial: ca-app-pub-9873123247401502/6521050938
 */
export function BannerAd({ style }: BannerAdProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>📢 Reklam Alanı</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  text: {
    color: '#888',
    fontSize: 12,
  },
});
