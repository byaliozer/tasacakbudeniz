import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// AdMob IDs
const ADMOB_CONFIG = {
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: 'ca-app-pub-9873123247401502/6521050938',
};

interface AdContextType {
  isMobile: boolean;
  bannerAdId: string;
  interstitialAdId: string;
  showInterstitial: () => Promise<void>;
  isInterstitialReady: boolean;
  isInterstitialLoading: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [isMobile] = useState(Platform.OS === 'ios' || Platform.OS === 'android');
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);
  const interstitialRef = useRef<any>(null);

  // Load interstitial ad on mobile
  useEffect(() => {
    if (isMobile) {
      loadInterstitial();
    }
  }, [isMobile]);

  const loadInterstitial = useCallback(async () => {
    if (!isMobile) return;
    
    try {
      setIsInterstitialLoading(true);
      // Dynamic import for mobile only
      const { InterstitialAd, AdEventType } = await import('react-native-google-mobile-ads');
      
      const interstitial = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
        keywords: ['quiz', 'game', 'entertainment', 'tv series'],
      });
      
      interstitialRef.current = interstitial;
      
      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        setIsInterstitialReady(true);
        setIsInterstitialLoading(false);
      });
      
      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        setIsInterstitialReady(false);
        // Reload for next time
        loadInterstitial();
      });
      
      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('Interstitial ad error:', error);
        setIsInterstitialLoading(false);
        // Retry after delay
        setTimeout(loadInterstitial, 30000);
      });
      
      interstitial.load();
      
      return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
      };
    } catch (error) {
      console.log('AdMob not available:', error);
      setIsInterstitialLoading(false);
    }
  }, [isMobile]);

  const showInterstitial = useCallback(async () => {
    if (!isMobile) {
      console.log('[Ad] Interstitial would show here (web preview)');
      return;
    }
    
    if (isInterstitialReady && interstitialRef.current) {
      try {
        await interstitialRef.current.show();
      } catch (error) {
        console.log('Error showing interstitial:', error);
      }
    } else {
      console.log('Interstitial not ready');
    }
  }, [isMobile, isInterstitialReady]);

  return (
    <AdContext.Provider value={{
      isMobile,
      bannerAdId: ADMOB_CONFIG.BANNER_ID,
      interstitialAdId: ADMOB_CONFIG.INTERSTITIAL_ID,
      showInterstitial,
      isInterstitialReady,
      isInterstitialLoading,
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
