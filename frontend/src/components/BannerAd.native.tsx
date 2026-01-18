import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Production AdMob Banner ID
const PRODUCTION_BANNER_ID = 'ca-app-pub-9873123247401502/9749849505';

// Always use test IDs first to verify ads are working
// Once verified, switch to: __DEV__ ? TestIds.BANNER : PRODUCTION_BANNER_ID
const BANNER_AD_UNIT_ID = TestIds.BANNER;

interface BannerAdProps {
  style?: object;
}

// Native version - real AdMob ads
export function BannerAd({ style }: BannerAdProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('[BannerAd] Initializing with unit ID:', BANNER_AD_UNIT_ID);
    console.log('[BannerAd] Is DEV mode:', __DEV__);
    console.log('[BannerAd] Test ID being used:', TestIds.BANNER);
  }, []);

  const handleRetry = () => {
    if (retryCount < 3) {
      setError(null);
      setRetryCount(prev => prev + 1);
    }
  };

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
          <Text style={styles.errorDetail}>{error}</Text>
          {retryCount < 3 && (
            <Text style={styles.retryText} onPress={handleRetry}>Tekrar dene</Text>
          )}
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
            console.warn('[BannerAd] ❌ Failed to load:', JSON.stringify(err));
            setError(err.message || 'Bilinmeyen hata');
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
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#999',
    fontSize: 11,
  },
  errorDetail: {
    color: '#777',
    fontSize: 9,
    marginTop: 2,
  },
  retryText: {
    color: '#009688',
    fontSize: 11,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
});
