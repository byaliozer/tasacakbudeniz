import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Production AdMob Banner ID
const PRODUCTION_BANNER_ID = 'ca-app-pub-9873123247401502/9749849505';

// Use production ID - interstitial works so AdMob account is verified
const BANNER_AD_UNIT_ID = PRODUCTION_BANNER_ID;

interface BannerAdProps {
  style?: object;
}

// Native version - real AdMob ads
export function BannerAd({ style }: BannerAdProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log('[BannerAd] Using production ID:', BANNER_AD_UNIT_ID);
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
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <GoogleBannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log('[BannerAd] ✅ Loaded successfully');
            setLoaded(true);
            setError(null);
          }}
          onAdFailedToLoad={(err) => {
            console.warn('[BannerAd] ❌ Failed:', err.code, err.message);
            setError(err.message || 'Reklam yüklenemedi');
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
    minHeight: 50,
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
    color: '#888',
    fontSize: 10,
  },
});
