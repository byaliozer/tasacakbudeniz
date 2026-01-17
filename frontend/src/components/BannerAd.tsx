import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ADMOB_CONFIG } from '../context/AdContext';

interface BannerAdProps {
  style?: object;
}

// Native banner component - will be imported dynamically only on native
let NativeBannerAd: React.ComponentType<any> | null = null;

export function BannerAd({ style }: BannerAdProps) {
  // Always show placeholder on web
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
      </View>
    );
  }

  // On native, try to render real banner
  return <NativeBanner style={style} />;
}

// Separate component for native banner to isolate the native-only import
function NativeBanner({ style }: { style?: object }) {
  const [AdComponent, setAdComponent] = React.useState<any>(null);
  const [adSize, setAdSize] = React.useState<any>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    // Only try to import on native platforms
    if (Platform.OS !== 'web') {
      try {
        const adsModule = require('react-native-google-mobile-ads');
        setAdComponent(() => adsModule.BannerAd);
        setAdSize(adsModule.BannerAdSize);
      } catch (e) {
        console.log('[BannerAd] Native module not available:', e);
        setError(true);
      }
    }
  }, []);

  if (error || !AdComponent || !adSize) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>📢 Reklam Alanı</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <AdComponent
        unitId={ADMOB_CONFIG.BANNER_ID}
        size={adSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('[BannerAd] Ad loaded');
        }}
        onAdFailedToLoad={(err: any) => {
          console.warn('[BannerAd] Failed to load:', err);
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
