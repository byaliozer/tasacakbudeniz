import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// AdMob IDs
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
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const interstitialRef = useRef<any>(null);
  const adsModuleRef = useRef<any>(null);

  useEffect(() => {
    // Load AdMob only on native platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      loadAdsModule();
    }
  }, []);

  const loadAdsModule = async () => {
    try {
      const adsModule = await import('react-native-google-mobile-ads');
      adsModuleRef.current = adsModule;
      loadInterstitial(adsModule);
    } catch (error) {
      console.log('AdMob module not available:', error);
    }
  };

  const loadInterstitial = async (adsModule?: any) => {
    const module = adsModule || adsModuleRef.current;
    if (!module) return;

    try {
      const { InterstitialAd, AdEventType } = module;
      
      const interstitial = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['quiz', 'game', 'entertainment', 'tv series'],
      });
      
      interstitialRef.current = interstitial;
      
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
        setIsInterstitialReady(true);
      });
      
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Interstitial ad closed');
        setIsInterstitialReady(false);
        // Reload for next time
        setTimeout(() => loadInterstitial(), 1000);
      });
      
      interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.log('Interstitial ad error:', error);
        // Retry after delay
        setTimeout(() => loadInterstitial(), 30000);
      });
      
      interstitial.load();
    } catch (error) {
      console.log('Error loading interstitial:', error);
    }
  };

  const showInterstitial = useCallback(async () => {
    // Only show on native platforms
    if (Platform.OS === 'web') {
      console.log('[Ad] Interstitial would show here (web)');
      return;
    }
    
    if (isInterstitialReady && interstitialRef.current) {
      try {
        await interstitialRef.current.show();
      } catch (error) {
        console.log('Error showing interstitial:', error);
      }
    } else {
      console.log('Interstitial not ready yet');
    }
  }, [isInterstitialReady]);

  return (
    <AdContext.Provider value={{
      showInterstitial,
      bannerAdId: ADMOB_CONFIG.BANNER_ID,
      interstitialAdId: ADMOB_CONFIG.INTERSTITIAL_ID,
      isInterstitialReady,
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
