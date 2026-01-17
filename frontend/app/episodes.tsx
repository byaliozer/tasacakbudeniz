import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getEpisodes, getPlayerStats, Episode } from '../src/services/api';
import { BannerAd } from '../src/components/BannerAd';

export default function EpisodesScreen() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeScores, setEpisodeScores] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eps, stats] = await Promise.all([
        getEpisodes(),
        getPlayerStats()
      ]);
      setEpisodes(eps);
      if (stats) {
        setEpisodeScores(stats.episode_scores || {});
      }
    } catch (e) {
      console.error('Error loading episodes:', e);
    }
    setLoading(false);
  };

  const renderEpisode = ({ item }: { item: Episode }) => {
    const score = episodeScores[item.id];
    const hasScore = score !== undefined && score > 0;

    return (
      <TouchableOpacity
        style={styles.episodeCard}
        onPress={() => router.push(`/quiz?mode=episode&episode=${item.id}`)}
      >
        <View style={styles.episodeNumber}>
          <Text style={styles.episodeNumberText}>{item.id}</Text>
        </View>
        <View style={styles.episodeInfo}>
          <Text style={styles.episodeName}>{item.name}</Text>
          <Text style={styles.episodeQuestions}>25 Soru</Text>
        </View>
        {hasScore && (
          <View style={styles.scoreContainer}>
            <Ionicons name="star" size={16} color="#ffc107" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bölüm Seçin</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#009688" />
        </View>
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEpisode}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BannerAd />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  episodeNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#009688',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  episodeQuestions: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,193,7,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffc107',
  },
});
