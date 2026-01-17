import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ADMOB_CONFIG } from '../context/AdContext';

interface BannerAdProps {
  style?: object;
}

export function BannerAd({ style }: BannerAdProps) {
  const [NativeAd, setNativeAd] = React.useState<any>(null);
  const [AdSize, setAdSize] = React.useState<any>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    // Only try to load native ads module on native platforms
    if (Platform.OS !== 'web') {
      try {
        // Dynamic require at runtime using eval to prevent Metro bundling for web
        // eslint-disable-next-line no-eval
        const adsModule = eval("require('react-native-google-mobile-ads')");
        setNativeAd(() => adsModule.BannerAd);
        setAdSize(adsModule.BannerAdSize);
      } catch (e) {
        console.log('[BannerAd] Native ads module not available');
        setError(true);
      }
    }
  }, []);

  // Web placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
      </View>
    );
  }

  // Native but module not loaded or error
  if (error || !NativeAd || !AdSize) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
      </View>
    );
  }

  // Native with module available
  return (
    <View style={[styles.container, style]}>
      <NativeAd
        unitId={ADMOB_CONFIG.BANNER_ID}
        size={AdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('[BannerAd] Loaded');
        }}
        onAdFailedToLoad={(err: any) => {
          console.warn('[BannerAd] Failed:', err);
          setError(true);
        }}
      />
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
