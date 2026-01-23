import React, { createContext, useContext, useCallback, useState } from 'react';

// AdMob IDs - Production IDs
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-9873123247401502~2062931178',
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: 'ca-app-pub-9873123247401502/6521050938',
  REWARDED_ID: 'ca-app-pub-9873123247401502/8879082930',
};

interface AdContextType {
  showInterstitial: () => Promise<void>;
  showRewardedAd: (onRewarded: () => void) => Promise<boolean>;
  isInterstitialReady: boolean;
  isRewardedReady: boolean;
  isMobile: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

// Web version - no real ads
export function AdProvider({ children }: { children: React.ReactNode }) {
  const [isInterstitialReady] = useState(false);
  const [isRewardedReady] = useState(false);

  const showInterstitial = useCallback(async () => {
    console.log('[AdMob Web] Interstitial not available on web');
  }, []);

  const showRewardedAd = useCallback(async (onRewarded: () => void): Promise<boolean> => {
    console.log('[AdMob Web] Rewarded not available on web');
    return false;
  }, []);

  return (
    <AdContext.Provider value={{
      showInterstitial,
      showRewardedAd,
      isInterstitialReady,
      isRewardedReady,
      isMobile: false,
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
