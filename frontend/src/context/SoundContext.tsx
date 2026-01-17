import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // Web Audio API context (for web only)
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // expo-av sound objects (for native)
  const soundsRef = useRef<{
    correct?: Audio.Sound;
    wrong?: Audio.Sound;
    bonus?: Audio.Sound;
    tick?: Audio.Sound;
    gameOver?: Audio.Sound;
  }>({});

  // Initialize audio on mount
  useEffect(() => {
    const initAudio = async () => {
      if (Platform.OS !== 'web') {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
          setIsAudioReady(true);
          console.log('[Sound] Audio initialized for native');
        } catch (error) {
          console.warn('[Sound] Failed to initialize audio:', error);
        }
      } else {
        setIsAudioReady(true);
      }
    };
    
    initAudio();
    
    // Cleanup sounds on unmount
    return () => {
      Object.values(soundsRef.current).forEach(sound => {
        if (sound) {
          sound.unloadAsync().catch(() => {});
        }
      });
    };
  }, []);

  // Web Audio API context getter
  const getAudioContext = useCallback(() => {
    if (Platform.OS === 'web') {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return audioContextRef.current;
    }
    return null;
  }, []);

  // Play sound using Web Audio API (for web)
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

  // Play sound using expo-av (for native)
  const playNativeSound = useCallback(async (
    frequencies: number[], 
    durations: number[],
    soundKey: string
  ) => {
    if (isMuted || !isAudioReady || Platform.OS === 'web') return;
    
    try {
      // Create a simple tone using expo-av
      // Since we can't generate tones directly, we'll use a workaround
      // by creating short sounds programmatically
      
      const { sound } = await Audio.Sound.createAsync(
        // Use a simple approach - play a beep pattern
        { uri: generateToneDataUri(frequencies[0], durations[0] * 1000) },
        { shouldPlay: true, volume: isMuted ? 0 : 0.5 }
      );
      
      // Store reference for cleanup
      soundsRef.current[soundKey as keyof typeof soundsRef.current] = sound;
      
      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      // Fallback: just log the error, don't crash
      console.warn('[Sound] Native sound error:', error);
    }
  }, [isMuted, isAudioReady]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const playCorrectSound = useCallback(() => {
    if (Platform.OS === 'web') {
      // Happy ascending melody: C5, E5, G5, C6
      playWebSound([523.25, 659.25, 783.99, 1046.50], [0.15, 0.15, 0.15, 0.3], 'sine');
    } else {
      playNativeSound([523.25, 659.25, 783.99], [0.15, 0.15, 0.2], 'correct');
    }
  }, [playWebSound, playNativeSound]);

  const playWrongSound = useCallback(() => {
    if (Platform.OS === 'web') {
      // Sad descending sound
      playWebSound([400, 350, 300, 250], [0.15, 0.15, 0.15, 0.3], 'sawtooth');
    } else {
      playNativeSound([400, 300], [0.2, 0.3], 'wrong');
    }
  }, [playWebSound, playNativeSound]);

  const playBonusSound = useCallback(() => {
    if (Platform.OS === 'web') {
      // Special arpeggio: C5, E5, G5, C6, E6
      playWebSound([523.25, 659.25, 783.99, 1046.50, 1318.51], [0.1, 0.1, 0.1, 0.1, 0.2], 'triangle');
    } else {
      playNativeSound([523.25, 783.99, 1046.50], [0.1, 0.1, 0.15], 'bonus');
    }
  }, [playWebSound, playNativeSound]);

  const playTickSound = useCallback(() => {
    if (Platform.OS === 'web') {
      // Short tick sound
      playWebSound([880], [0.05], 'square');
    } else {
      playNativeSound([880], [0.05], 'tick');
    }
  }, [playWebSound, playNativeSound]);

  const playGameOverSound = useCallback(() => {
    if (Platform.OS === 'web') {
      // Dramatic descending: G4 -> C4
      playWebSound([392.00, 349.23, 329.63, 293.66, 261.63], [0.2, 0.2, 0.2, 0.2, 0.4], 'triangle');
    } else {
      playNativeSound([392.00, 293.66, 261.63], [0.25, 0.25, 0.4], 'gameOver');
    }
  }, [playWebSound, playNativeSound]);

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

// Helper function to generate a simple tone as data URI
// This creates a WAV file with a sine wave
function generateToneDataUri(frequency: number, durationMs: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * (durationMs / 1000));
  const numChannels = 1;
  const bitsPerSample = 16;
  
  // WAV header
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Generate sine wave samples
  const volume = 0.3;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Apply envelope (fade in/out)
    const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (numSamples - i) / (sampleRate * 0.01)));
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }
  
  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
