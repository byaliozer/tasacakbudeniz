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
  isMobile: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const interstitialRef = useRef<any>(null);

  const showInterstitial = useCallback(async () => {
    console.log('[Ad] Interstitial ad triggered');
    // Actual implementation will be in native build
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
