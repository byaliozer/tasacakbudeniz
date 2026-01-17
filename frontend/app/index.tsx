import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getEpisodes, Episode } from '../src/services/api';

const { width } = Dimensions.get('window');
const BANNER_URL = 'https://customer-assets.emergentagent.com/job_denizquiz/artifacts/3342mhiv_image.png';

export default function HomeScreen() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEpisodes();
      setEpisodes(data);
    } catch (err) {
      setError('Bölümler yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodePress = (episode: Episode) => {
    if (episode.is_locked) {
      alert('Bu bölüm henüz açılmadı!');
      return;
    }
    router.push(`/quiz/${episode.id}`);
  };

  const openEpisodes = episodes.filter(e => !e.is_locked);
  const lockedEpisodes = episodes.filter(e => e.is_locked);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: BANNER_URL }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.logoContainer}>
              <FontAwesome5 name="brain" size={32} color="#FFC800" />
              <Text style={styles.logoText}>BİLGİ YARIŞMASI</Text>
            </View>
            <Text style={styles.title}>Taşacak Bu Deniz</Text>
          </View>
        </View>

        {/* Info Buttons */}
        <View style={styles.infoRow}>
          <View style={styles.infoButton}>
            <View style={styles.heartsContainer}>
              <Ionicons name="heart" size={24} color="#FF4B4B" />
              <Ionicons name="heart" size={24} color="#FF4B4B" />
              <Ionicons name="heart" size={24} color="#FF4B4B" />
            </View>
            <Text style={styles.infoButtonText}>3 Can</Text>
          </View>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => router.push('/leaderboard/1')}
          >
            <Ionicons name="trophy" size={28} color="#FFC800" />
            <Text style={styles.infoButtonText}>Sıralama</Text>
          </TouchableOpacity>
        </View>

        {/* Loading/Error State */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#FFC800" />
            <Text style={styles.loadingText}>Bölümler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadEpisodes}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Open Episodes */}
            {openEpisodes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="play-circle" size={20} color="#58CC02" /> Açık Bölümler
                </Text>
                {openEpisodes.map(episode => (
                  <TouchableOpacity
                    key={episode.id}
                    style={styles.episodeCard}
                    onPress={() => handleEpisodePress(episode)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.episodeIconContainer}>
                      <Ionicons name="play" size={24} color="#fff" />
                    </View>
                    <View style={styles.episodeInfo}>
                      <Text style={styles.episodeName}>{episode.name}</Text>
                      <Text style={styles.episodeDetail}>
                        {episode.question_count} soru • {episode.description}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#58CC02" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Locked Episodes */}
            {lockedEpisodes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="lock-closed" size={20} color="#8B8B8B" /> Kilitli Bölümler
                </Text>
                {lockedEpisodes.map(episode => (
                  <TouchableOpacity
                    key={episode.id}
                    style={[styles.episodeCard, styles.lockedCard]}
                    onPress={() => handleEpisodePress(episode)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.episodeIconContainer, styles.lockedIcon]}>
                      <Ionicons name="lock-closed" size={24} color="#8B8B8B" />
                    </View>
                    <View style={styles.episodeInfo}>
                      <Text style={[styles.episodeName, styles.lockedText]}>{episode.name}</Text>
                      <Text style={[styles.episodeDetail, styles.lockedText]}>
                        {episode.description || 'Yakında'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#8B8B8B" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1CB0F6',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  logoText: {
    color: '#FFC800',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  infoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heartsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  centerContent: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FFC800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  episodeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedCard: {
    backgroundColor: '#E5E5E5',
  },
  episodeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lockedIcon: {
    backgroundColor: '#AFAFAF',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  episodeDetail: {
    fontSize: 14,
    color: '#666',
  },
  lockedText: {
    color: '#8B8B8B',
  },
});
