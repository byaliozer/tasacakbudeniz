import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// AdMob IDs - Production IDs
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-9873123247401502~2062931178',
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: 'ca-app-pub-9873123247401502/6521050938',
  // Test IDs (use these for development)
  TEST_BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  TEST_INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
};

interface AdContextType {
  showInterstitial: () => Promise<void>;
  bannerAdId: string;
  interstitialAdId: string;
  isInterstitialReady: boolean;
  isMobile: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

// Dynamic import for react-native-google-mobile-ads (only works in native builds)
let MobileAds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;

// Try to import the native ads module
if (Platform.OS !== 'web') {
  try {
    const adsModule = require('react-native-google-mobile-ads');
    MobileAds = adsModule.default;
    InterstitialAd = adsModule.InterstitialAd;
    AdEventType = adsModule.AdEventType;
    console.log('[AdMob] Native ads module loaded successfully');
  } catch (error) {
    console.log('[AdMob] Native ads module not available (expected in Expo Go)');
  }
}

export function AdProvider({ children }: { children: React.ReactNode }) {
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const interstitialRef = useRef<any>(null);

  // Initialize AdMob
  useEffect(() => {
    const initializeAds = async () => {
      if (!isMobile || !MobileAds) {
        console.log('[AdMob] Skipping initialization (web or module not available)');
        return;
      }

      try {
        await MobileAds.initialize();
        setIsInitialized(true);
        console.log('[AdMob] Initialized successfully');
        
        // Load interstitial ad
        loadInterstitial();
      } catch (error) {
        console.warn('[AdMob] Initialization error:', error);
      }
    };

    initializeAds();

    return () => {
      // Cleanup
      if (interstitialRef.current) {
        interstitialRef.current = null;
      }
    };
  }, [isMobile]);

  const loadInterstitial = useCallback(() => {
    if (!InterstitialAd || !AdEventType) {
      console.log('[AdMob] InterstitialAd not available');
      return;
    }

    try {
      // Use production ID
      const adUnitId = ADMOB_CONFIG.INTERSTITIAL_ID;
      
      interstitialRef.current = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      // Set up event listeners
      interstitialRef.current.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] Interstitial loaded');
        setIsInterstitialReady(true);
      });

      interstitialRef.current.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('[AdMob] Interstitial error:', error);
        setIsInterstitialReady(false);
        // Retry loading after error
        setTimeout(loadInterstitial, 30000);
      });

      interstitialRef.current.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial closed');
        setIsInterstitialReady(false);
        // Load next ad
        loadInterstitial();
      });

      // Load the ad
      interstitialRef.current.load();
      console.log('[AdMob] Loading interstitial...');
    } catch (error) {
      console.warn('[AdMob] Error setting up interstitial:', error);
    }
  }, []);

  const showInterstitial = useCallback(async () => {
    console.log('[AdMob] Show interstitial requested');
    
    if (!isMobile) {
      console.log('[AdMob] Skipping interstitial on web');
      return;
    }

    if (!interstitialRef.current) {
      console.log('[AdMob] Interstitial not initialized');
      return;
    }

    if (!isInterstitialReady) {
      console.log('[AdMob] Interstitial not ready yet');
      return;
    }

    try {
      await interstitialRef.current.show();
      console.log('[AdMob] Interstitial shown');
    } catch (error) {
      console.warn('[AdMob] Error showing interstitial:', error);
    }
  }, [isMobile, isInterstitialReady]);

  return (
    <AdContext.Provider value={{
      showInterstitial,
      bannerAdId: ADMOB_CONFIG.BANNER_ID,
      interstitialAdId: ADMOB_CONFIG.INTERSTITIAL_ID,
      isInterstitialReady,
      isMobile,
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
