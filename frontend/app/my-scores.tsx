import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPlayerStats, getUsername, getLocalMixedBestScore, PlayerStats } from '../src/services/api';
import { EPISODES } from '../src/data/quizData';
import { BannerAd } from '../src/components/BannerAd';

export default function MyScoresScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [mixedBest, setMixedBest] = useState(0);
  const [username, setUsernameState] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [playerStats, name, mixed] = await Promise.all([
        getPlayerStats(),
        getUsername(),
        getLocalMixedBestScore(),
      ]);
      setStats(playerStats);
      setUsernameState(name || 'Oyuncu');
      setMixedBest(mixed);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const episodeScores = stats?.episode_scores || {};
  const totalEpisodeScore = Object.values(episodeScores).reduce((sum, s) => sum + s, 0);
  const completedCount = Object.keys(episodeScores).length;
  const openEpisodes = EPISODES.filter(ep => !ep.isLocked);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skorlarım</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Player Card */}
        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <Text style={styles.playerName}>{username}</Text>
          <View style={styles.totalScoreContainer}>
            <Ionicons name="star" size={24} color="#ffc107" />
            <Text style={styles.totalScore}>{totalEpisodeScore + mixedBest}</Text>
          </View>
          <Text style={styles.totalScoreLabel}>Toplam Puan</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-done" size={28} color="#4caf50" />
            <Text style={styles.summaryValue}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>Oynanan Bölüm</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="shuffle" size={28} color="#e91e63" />
            <Text style={styles.summaryValue}>{mixedBest}</Text>
            <Text style={styles.summaryLabel}>Karışık En İyi</Text>
          </View>
        </View>

        {/* Episode Scores */}
        <Text style={styles.sectionTitle}>Bölüm Skorları</Text>
        
        {openEpisodes.map(ep => {
          const score = episodeScores[ep.id];
          const hasScore = score !== undefined && score > 0;

          return (
            <View key={ep.id} style={styles.episodeRow}>
              <View style={[styles.episodeNumberCircle, hasScore && styles.episodeCompletedCircle]}>
                {hasScore ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={styles.episodeNumberText}>{ep.id}</Text>
                )}
              </View>
              <View style={styles.episodeInfo}>
                <Text style={styles.episodeName}>{ep.name}</Text>
                <Text style={styles.episodeQuestionCount}>{ep.questionCount} soru</Text>
              </View>
              {hasScore ? (
                <View style={styles.episodeScoreContainer}>
                  <Ionicons name="star" size={14} color="#ffc107" />
                  <Text style={styles.episodeScore}>{score}</Text>
                </View>
              ) : (
                <Text style={styles.notPlayed}>—</Text>
              )}
            </View>
          );
        })}

        {/* Locked Episodes */}
        {EPISODES.filter(ep => ep.isLocked).map(ep => (
          <View key={ep.id} style={[styles.episodeRow, styles.lockedRow]}>
            <View style={styles.lockedCircle}>
              <Ionicons name="lock-closed" size={14} color="#666" />
            </View>
            <View style={styles.episodeInfo}>
              <Text style={styles.lockedName}>{ep.name}</Text>
              <Text style={styles.lockedSub}>Yakında</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

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
  scrollContent: {
    padding: 16,
  },
  // Player Card
  playerCard: {
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  playerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#009688',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  totalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  totalScoreLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  // Episode Rows
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  episodeNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3d3d54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeCompletedCircle: {
    backgroundColor: '#4caf50',
  },
  episodeNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#aaa',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  episodeQuestionCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  episodeScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  episodeScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  notPlayed: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  lockedRow: {
    opacity: 0.5,
  },
  lockedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  lockedSub: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 1,
  },
});
