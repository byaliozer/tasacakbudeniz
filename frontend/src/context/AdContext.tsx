import React, { createContext, useContext, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// AdMob IDs
export const ADMOB_CONFIG = {
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: 'ca-app-pub-9873123247401502/6521050938',
};

interface AdContextType {
  isMobile: boolean;
  bannerAdId: string;
  interstitialAdId: string;
  showInterstitial: () => Promise<void>;
  isInterstitialReady: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export function AdProvider({ children }: { children: React.ReactNode }) {
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [isInterstitialReady] = useState(false);

  const showInterstitial = useCallback(async () => {
    // This is a placeholder for web
    // Real implementation happens in native mobile app
    console.log('[Ad] Interstitial reklam gösterilecek (mobil cihazda)');
  }, []);

  return (
    <AdContext.Provider value={{
      isMobile,
      bannerAdId: ADMOB_CONFIG.BANNER_ID,
      interstitialAdId: ADMOB_CONFIG.INTERSTITIAL_ID,
      showInterstitial,
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
