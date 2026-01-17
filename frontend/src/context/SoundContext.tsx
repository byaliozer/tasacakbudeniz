import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playCorrectSound: () => void;
  playWrongSound: () => void;
  playBonusSound: () => void;
  playTickSound: () => void;
  playGameOverSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (Platform.OS === 'web') {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return audioContextRef.current;
    }
    return null;
  }, []);

  const playWebSound = useCallback((frequencies: number[], durations: number[], waveType: OscillatorType = 'sine') => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    let time = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(freq, time);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
      
      oscillator.start(time);
      oscillator.stop(time + durations[i]);
      
      time += durations[i] * 0.8;
    });
  }, [isMuted, getAudioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const playCorrectSound = useCallback(() => {
    // Happy ascending melody: C5, E5, G5, C6
    playWebSound([523.25, 659.25, 783.99, 1046.50], [0.15, 0.15, 0.15, 0.3], 'sine');
  }, [playWebSound]);

  const playWrongSound = useCallback(() => {
    // Sad descending sound
    playWebSound([400, 350, 300, 250], [0.15, 0.15, 0.15, 0.3], 'sawtooth');
  }, [playWebSound]);

  const playBonusSound = useCallback(() => {
    // Special arpeggio: C5, E5, G5, C6, E6
    playWebSound([523.25, 659.25, 783.99, 1046.50, 1318.51], [0.1, 0.1, 0.1, 0.1, 0.2], 'triangle');
  }, [playWebSound]);

  const playTickSound = useCallback(() => {
    // Short tick sound
    playWebSound([880], [0.05], 'square');
  }, [playWebSound]);

  const playGameOverSound = useCallback(() => {
    // Dramatic descending: G4 -> C4
    playWebSound([392.00, 349.23, 329.63, 293.66, 261.63], [0.2, 0.2, 0.2, 0.2, 0.4], 'triangle');
  }, [playWebSound]);

  return (
    <SoundContext.Provider value={{
      isMuted,
      toggleMute,
      playCorrectSound,
      playWrongSound,
      playBonusSound,
      playTickSound,
      playGameOverSound,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
