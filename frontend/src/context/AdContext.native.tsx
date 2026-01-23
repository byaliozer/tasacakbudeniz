import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import mobileAds, { InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// Production AdMob IDs
const PRODUCTION_APP_ID = 'ca-app-pub-9873123247401502~2062931178';
const PRODUCTION_INTERSTITIAL_ID = 'ca-app-pub-9873123247401502/6521050938';
const PRODUCTION_REWARDED_ID = 'ca-app-pub-9873123247401502/8879082930';

// Use production IDs (test IDs for dev mode)
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : PRODUCTION_INTERSTITIAL_ID;
const REWARDED_AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : PRODUCTION_REWARDED_ID;

export const ADMOB_CONFIG = {
  APP_ID: PRODUCTION_APP_ID,
  BANNER_ID: 'ca-app-pub-9873123247401502/9749849505',
  INTERSTITIAL_ID: PRODUCTION_INTERSTITIAL_ID,
  REWARDED_ID: PRODUCTION_REWARDED_ID,
};

interface AdContextType {
  showInterstitial: () => Promise<void>;
  showRewardedAd: (onRewarded: () => void) => Promise<boolean>;
  isInterstitialReady: boolean;
  isRewardedReady: boolean;
  isMobile: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

// Native version - real AdMob ads
export function AdProvider({ children }: { children: React.ReactNode }) {
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const [isRewardedReady, setIsRewardedReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const rewardedRef = useRef<RewardedAd | null>(null);
  const loadingInterstitialRef = useRef(false);
  const loadingRewardedRef = useRef(false);
  const rewardCallbackRef = useRef<(() => void) | null>(null);

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

  // Load ads when initialized
  useEffect(() => {
    if (!isInitialized) return;
    loadInterstitial();
    loadRewarded();
  }, [isInitialized]);

  const loadInterstitial = useCallback(() => {
    if (loadingInterstitialRef.current) {
      console.log('[AdMob] Already loading interstitial, skipping...');
      return;
    }

    loadingInterstitialRef.current = true;
    console.log('[AdMob] Loading interstitial with ID:', INTERSTITIAL_AD_UNIT_ID);

    try {
      const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] ✅ Interstitial loaded');
        setIsInterstitialReady(true);
        loadingInterstitialRef.current = false;
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[AdMob] ❌ Interstitial error:', JSON.stringify(error));
        setIsInterstitialReady(false);
        loadingInterstitialRef.current = false;
        setTimeout(loadInterstitial, 30000);
      });

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial closed by user');
        setIsInterstitialReady(false);
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
      loadingInterstitialRef.current = false;
    }
  }, []);

  const loadRewarded = useCallback(() => {
    if (loadingRewardedRef.current) {
      console.log('[AdMob] Already loading rewarded, skipping...');
      return;
    }

    loadingRewardedRef.current = true;
    console.log('[AdMob] Loading rewarded with ID:', REWARDED_AD_UNIT_ID);

    try {
      const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('[AdMob] ✅ Rewarded ad loaded');
        setIsRewardedReady(true);
        loadingRewardedRef.current = false;
      });

      const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('[AdMob] ✅ User earned reward:', reward);
        if (rewardCallbackRef.current) {
          rewardCallbackRef.current();
          rewardCallbackRef.current = null;
        }
      });

      const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[AdMob] ❌ Rewarded error:', JSON.stringify(error));
        setIsRewardedReady(false);
        loadingRewardedRef.current = false;
        setTimeout(loadRewarded, 30000);
      });

      const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Rewarded closed by user');
        setIsRewardedReady(false);
        loadRewarded();
      });

      rewarded.load();
      rewardedRef.current = rewarded;

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeError();
        unsubscribeClosed();
      };
    } catch (error) {
      console.warn('[AdMob] ❌ Error creating rewarded:', error);
      loadingRewardedRef.current = false;
    }
  }, []);

  const showInterstitial = useCallback(async () => {
    console.log('[AdMob] Show interstitial requested, ready:', isInterstitialReady);
    
    if (!interstitialRef.current || !isInterstitialReady) {
      console.log('[AdMob] Interstitial not ready');
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

  const showRewardedAd = useCallback(async (onRewarded: () => void): Promise<boolean> => {
    console.log('[AdMob] Show rewarded requested, ready:', isRewardedReady);
    
    if (!rewardedRef.current || !isRewardedReady) {
      console.log('[AdMob] Rewarded not ready');
      return false;
    }

    try {
      rewardCallbackRef.current = onRewarded;
      console.log('[AdMob] Showing rewarded...');
      await rewardedRef.current.show();
      console.log('[AdMob] ✅ Rewarded shown');
      return true;
    } catch (error) {
      console.warn('[AdMob] ❌ Error showing rewarded:', error);
      return false;
    }
  }, [isRewardedReady]);

  return (
    <AdContext.Provider value={{
      showInterstitial,
      showRewardedAd,
      isInterstitialReady,
      isRewardedReady,
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
