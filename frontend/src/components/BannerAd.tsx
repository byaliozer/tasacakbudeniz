import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAds } from '../context/AdContext';

interface BannerAdProps {
  style?: object;
}

export function BannerAd({ style }: BannerAdProps) {
  const { isMobile } = useAds();

  // Web placeholder - shows where ad will appear
  if (!isMobile) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı (Mobilde görünecek)</Text>
      </View>
    );
  }

  // Mobile - placeholder that will be replaced with actual ad in production build
  // react-native-google-mobile-ads requires native build
  return (
    <View style={[styles.container, style]}>
      <View style={styles.adPlaceholder}>
        <Text style={styles.adText}>📱 AdMob Banner</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    minHeight: 60,
  },
  placeholder: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
  },
  adPlaceholder: {
    height: 50,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  adText: {
    color: '#888',
    fontSize: 12,
  },
});
