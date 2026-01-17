import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ADMOB_CONFIG } from '../context/AdContext';

interface BannerAdProps {
  style?: object;
}

// Dynamic import for native banner ads
let BannerAdComponent: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const adsModule = require('react-native-google-mobile-ads');
    BannerAdComponent = adsModule.BannerAd;
    BannerAdSize = adsModule.BannerAdSize;
    console.log('[BannerAd] Native module loaded');
  } catch (error) {
    console.log('[BannerAd] Native module not available');
  }
}

export function BannerAd({ style }: BannerAdProps) {
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Show native banner ad on mobile
  if (Platform.OS !== 'web' && BannerAdComponent && BannerAdSize) {
    return (
      <View style={[styles.container, style]}>
        <BannerAdComponent
          unitId={ADMOB_CONFIG.BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log('[BannerAd] Ad loaded');
            setAdLoaded(true);
            setAdError(false);
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('[BannerAd] Failed to load:', error);
            setAdError(true);
          }}
        />
        {adError && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
          </View>
        )}
      </View>
    );
  }

  // Placeholder for web or when native module is not available
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    minHeight: 50,
  },
  placeholder: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    width: '100%',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
  },
});
