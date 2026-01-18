import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Production AdMob Banner ID
const PRODUCTION_BANNER_ID = 'ca-app-pub-9873123247401502/9749849505';

// Use test ID for debug builds, production ID for release
const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : PRODUCTION_BANNER_ID;

interface BannerAdProps {
  style?: object;
}

// Native version - real AdMob ads
export function BannerAd({ style }: BannerAdProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log('[BannerAd] Using unit ID:', BANNER_AD_UNIT_ID);
    console.log('[BannerAd] Is DEV mode:', __DEV__);
  }, []);

  return (
    <View style={[styles.container, style]}>
      {!loaded && !error && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Reklam yükleniyor...</Text>
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Reklam yüklenemedi</Text>
        </View>
      ) : (
        <GoogleBannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log('[BannerAd] ✅ Loaded successfully');
            setLoaded(true);
            setError(null);
          }}
          onAdFailedToLoad={(err) => {
            console.warn('[BannerAd] ❌ Failed to load:', JSON.stringify(err));
            setError(err.message || 'Unknown error');
            setLoaded(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minHeight: 60,
    width: '100%',
  },
  loadingContainer: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    color: '#666',
    fontSize: 12,
  },
  errorContainer: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  errorText: {
    color: '#999',
    fontSize: 11,
  },
});
