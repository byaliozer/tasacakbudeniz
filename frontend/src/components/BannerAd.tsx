import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAds } from '../context/AdContext';

interface BannerAdProps {
  style?: object;
}

export function BannerAd({ style }: BannerAdProps) {
  const { isMobile, bannerAdId } = useAds();
  const [AdComponent, setAdComponent] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);

  useEffect(() => {
    if (isMobile) {
      // Dynamic import for mobile
      import('react-native-google-mobile-ads').then((module) => {
        setAdComponent(() => module.BannerAd);
        setBannerAdSize(module.BannerAdSize);
      }).catch(err => {
        console.log('BannerAd import error:', err);
      });
    }
  }, [isMobile]);

  // Web placeholder
  if (!isMobile) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
      </View>
    );
  }

  // Mobile - waiting for component to load
  if (!AdComponent || !BannerAdSize) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>Reklam yükleniyor...</Text>
      </View>
    );
  }

  // Mobile - render actual ad
  return (
    <View style={[styles.container, style]}>
      <AdComponent
        unitId={bannerAdId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
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
  },
  placeholder: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
  },
});
