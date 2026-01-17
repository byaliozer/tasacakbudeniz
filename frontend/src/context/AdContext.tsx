import React, { createContext, useContext, useCallback, useState } from 'react';
import { Platform } from 'react-native';

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

export function AdProvider({ children }: { children: React.ReactNode }) {
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);

  // Interstitial will be loaded in native builds only
  // The actual implementation is done at runtime to avoid bundling issues
  const showInterstitial = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[AdMob] Interstitial not available on web');
      return;
    }
    
    // On native, this will be handled by the native module
    // which is loaded dynamically at runtime
    console.log('[AdMob] Interstitial show requested');
    
    try {
      // Dynamic require only happens at runtime on native
      // Using eval to prevent Metro from bundling this for web
      // eslint-disable-next-line @typescript-eslint/no-var-requires, no-eval
      const adsModule = eval("require('react-native-google-mobile-ads')");
      const { InterstitialAd, AdEventType } = adsModule;
      
      const interstitial = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      
      return new Promise<void>((resolve) => {
        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          resolve();
        });
        
        interstitial.addAdEventListener(AdEventType.ERROR, () => {
          resolve();
        });
        
        interstitial.addAdEventListener(AdEventType.LOADED, () => {
          interstitial.show();
        });
        
        interstitial.load();
      });
    } catch (error) {
      console.warn('[AdMob] Error showing interstitial:', error);
    }
  }, []);

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
