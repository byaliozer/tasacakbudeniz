import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAds } from '../context/AdContext';

interface BannerAdProps {
  style?: object;
}

export function BannerAd({ style }: BannerAdProps) {
  const { bannerAdId } = useAds();
  const [AdComponent, setAdComponent] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only load AdMob on native platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      import('react-native-google-mobile-ads').then((module) => {
        setAdComponent(() => module.BannerAd);
        setBannerAdSize(module.BannerAdSize);
        setIsLoaded(true);
      }).catch(err => {
        console.log('AdMob not available:', err);
      });
    }
  }, []);

  // Web or Expo Go placeholder
  if (Platform.OS === 'web' || !isLoaded || !AdComponent) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
      </View>
    );
  }

  // Native mobile - render actual AdMob banner
  return (
    <View style={[styles.container, style]}>
      <AdComponent
        unitId={bannerAdId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          keywords: ['quiz', 'game', 'entertainment', 'tv series', 'turkish'],
        }}
        onAdLoaded={() => console.log('Banner ad loaded')}
        onAdFailedToLoad={(error: any) => console.log('Banner ad failed:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    minHeight: 50,
  },
  placeholder: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
  },
});
