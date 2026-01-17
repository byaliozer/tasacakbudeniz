import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import mobileAds, { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

// AdMob IDs - Production IDs
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-9873123247401502~2062931178',
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: 'ca-app-pub-9873123247401502/6521050938',
};

interface AdContextType {
  showInterstitial: () => Promise<void>;
  bannerAdId: string;
  interstitialAdId: string;
  isInterstitialReady: boolean;
  isMobile: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

// Native version - real AdMob ads
export function AdProvider({ children }: { children: React.ReactNode }) {
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);

  // Initialize AdMob
  useEffect(() => {
    const init = async () => {
      try {
        await mobileAds().initialize();
        setIsInitialized(true);
        console.log('[AdMob] Initialized successfully');
      } catch (error) {
        console.warn('[AdMob] Initialization error:', error);
      }
    };
    init();
  }, []);

  // Load interstitial when initialized
  useEffect(() => {
    if (!isInitialized) return;

    const loadInterstitial = () => {
      const interstitial = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] Interstitial loaded');
        setIsInterstitialReady(true);
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[AdMob] Interstitial error:', error);
        setIsInterstitialReady(false);
        // Retry after 30 seconds
        setTimeout(loadInterstitial, 30000);
      });

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial closed');
        setIsInterstitialReady(false);
        // Load next ad
        loadInterstitial();
      });

      interstitial.load();
      interstitialRef.current = interstitial;

      return () => {
        unsubscribeLoaded();
        unsubscribeError();
        unsubscribeClosed();
      };
    };

    const cleanup = loadInterstitial();
    return cleanup;
  }, [isInitialized]);

  const showInterstitial = useCallback(async () => {
    if (!interstitialRef.current || !isInterstitialReady) {
      console.log('[AdMob] Interstitial not ready');
      return;
    }

    try {
      await interstitialRef.current.show();
      console.log('[AdMob] Interstitial shown');
    } catch (error) {
      console.warn('[AdMob] Error showing interstitial:', error);
    }
  }, [isInterstitialReady]);

  return (
    <AdContext.Provider value={{
      showInterstitial,
      bannerAdId: ADMOB_CONFIG.BANNER_ID,
      interstitialAdId: ADMOB_CONFIG.INTERSTITIAL_ID,
      isInterstitialReady,
      isMobile: true,
    }}>
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}
