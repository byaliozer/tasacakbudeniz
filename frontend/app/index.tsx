import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd } from '../src/components/BannerAd';

const { width } = Dimensions.get('window');

export default function MainMenu() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../assets/banner.png')}
            style={styles.banner}
            resizeMode="cover"
          />
          <View style={styles.titleOverlay}>
            <Text style={styles.title}>Taşacak Bu Deniz</Text>
            <Text style={styles.subtitle}>Quiz Oyunu</Text>
          </View>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.episodeButton]}
            onPress={() => router.push('/episodes')}
          >
            <Ionicons name="play-circle" size={28} color="#fff" />
            <Text style={styles.menuButtonText}>Bölüm Modu</Text>
            <Text style={styles.menuButtonHint}>14 bölüm, her biri 25 soru</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.mixedButton]}
            onPress={() => router.push('/quiz?mode=mixed')}
          >
            <Ionicons name="shuffle" size={28} color="#fff" />
            <Text style={styles.menuButtonText}>Karışık Mod</Text>
            <Text style={styles.menuButtonHint}>Sonsuz mod, tüm sorular</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.leaderboardButton]}
            onPress={() => router.push('/leaderboard')}
          >
            <Ionicons name="trophy" size={28} color="#fff" />
            <Text style={styles.menuButtonText}>Liderlik Tablosu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.settingsButton]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings" size={28} color="#fff" />
            <Text style={styles.menuButtonText}>Ayarlar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner Ad */}
      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bannerContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#2d2d44',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#009688',
    marginTop: 2,
  },
  menuContainer: {
    gap: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  episodeButton: {
    backgroundColor: '#009688',
  },
  mixedButton: {
    backgroundColor: '#e91e63',
  },
  leaderboardButton: {
    backgroundColor: '#ff9800',
  },
  settingsButton: {
    backgroundColor: '#607d8b',
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  menuButtonHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    position: 'absolute',
    bottom: 8,
    left: 56,
  },
});
