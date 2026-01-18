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
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Don't render anything if ad failed to load (no-fill is normal)
  if (hasError) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <GoogleBannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('[BannerAd] ✅ Loaded successfully');
          setLoaded(true);
        }}
        onAdFailedToLoad={(err) => {
          // no-fill is normal - just hide the ad space
          console.log('[BannerAd] No ad available:', err.code);
          setHasError(true);
        }}
      />
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
});
