import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import mobileAds, { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// Production AdMob IDs
const PRODUCTION_APP_ID = 'ca-app-pub-9873123247401502~2062931178';
const PRODUCTION_INTERSTITIAL_ID = 'ca-app-pub-9873123247401502/6521050938';

// Use test ID for debug builds
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : PRODUCTION_INTERSTITIAL_ID;

export const ADMOB_CONFIG = {
  APP_ID: PRODUCTION_APP_ID,
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: PRODUCTION_INTERSTITIAL_ID,
};

interface AdContextType {
  showInterstitial: () => Promise<void>;
  isInterstitialReady: boolean;
  isMobile: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

// Native version - real AdMob ads
export function AdProvider({ children }: { children: React.ReactNode }) {
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const loadingRef = useRef(false);

  // Initialize AdMob
  useEffect(() => {
    const init = async () => {
      try {
        console.log('[AdMob] Initializing...');
        await mobileAds().initialize();
        setIsInitialized(true);
        console.log('[AdMob] ✅ Initialized successfully');
      } catch (error) {
        console.warn('[AdMob] ❌ Initialization error:', error);
      }
    };
    init();
  }, []);

  // Load interstitial when initialized
  useEffect(() => {
    if (!isInitialized) return;
    loadInterstitial();
  }, [isInitialized]);

  const loadInterstitial = useCallback(() => {
    if (loadingRef.current) {
      console.log('[AdMob] Already loading interstitial, skipping...');
      return;
    }

    loadingRef.current = true;
    console.log('[AdMob] Loading interstitial with ID:', INTERSTITIAL_AD_UNIT_ID);
    console.log('[AdMob] Is DEV mode:', __DEV__);

    try {
      const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] ✅ Interstitial loaded');
        setIsInterstitialReady(true);
        loadingRef.current = false;
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[AdMob] ❌ Interstitial error:', JSON.stringify(error));
        setIsInterstitialReady(false);
        loadingRef.current = false;
        // Retry after 30 seconds
        setTimeout(loadInterstitial, 30000);
      });

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial closed by user');
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
    } catch (error) {
      console.warn('[AdMob] ❌ Error creating interstitial:', error);
      loadingRef.current = false;
    }
  }, []);

  const showInterstitial = useCallback(async () => {
    console.log('[AdMob] Show interstitial requested, ready:', isInterstitialReady);
    
    if (!interstitialRef.current) {
      console.log('[AdMob] No interstitial instance');
      return;
    }
    
    if (!isInterstitialReady) {
      console.log('[AdMob] Interstitial not ready yet');
      return;
    }

    try {
      console.log('[AdMob] Showing interstitial...');
      await interstitialRef.current.show();
      console.log('[AdMob] ✅ Interstitial shown');
    } catch (error) {
      console.warn('[AdMob] ❌ Error showing interstitial:', error);
    }
  }, [isInterstitialReady]);

  return (
    <AdContext.Provider value={{
      showInterstitial,
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
