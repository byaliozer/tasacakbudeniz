import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getLeaderboard, LeaderboardEntry, LeaderboardResponse } from '../../src/services/api';

export default function LeaderboardScreen() {
  const { id, player_name } = useLocalSearchParams<{ id: string; player_name?: string }>();
  const router = useRouter();

  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard(parseInt(id || '1'), player_name);
      setLeaderboard(data);
      
      // Initialize animations for each item
      itemAnims.current = data.top_10.map(() => new Animated.Value(0));
      
      // Stagger animations
      data.top_10.forEach((_, index) => {
        Animated.timing(itemAnims.current[index], {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    } catch (err) {
      setError('Sıralama yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FontAwesome5 name="crown" size={20} color="#FFD700" />;
      case 2:
        return <FontAwesome5 name="medal" size={20} color="#C0C0C0" />;
      case 3:
        return <FontAwesome5 name="medal" size={20} color="#CD7F32" />;
      default:
        return <Text style={styles.rankNumber}>{rank}</Text>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return styles.goldRow;
      case 2:
        return styles.silverRow;
      case 3:
        return styles.bronzeRow;
      default:
        return {};
    }
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const animValue = itemAnims.current[index] || new Animated.Value(1);
    
    return (
      <Animated.View
        style={[
          styles.leaderboardItem,
          getRankStyle(item.rank),
          {
            opacity: animValue,
            transform: [{
              translateX: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }],
          },
        ]}
      >
        <View style={styles.rankContainer}>
          {getRankIcon(item.rank)}
        </View>
        <Text style={styles.playerName} numberOfLines={1}>{item.player_name}</Text>
        <View style={styles.scoreContainer}>
          <FontAwesome5 name="star" size={14} color="#FFC800" />
          <Text style={styles.scoreValue}>{item.score}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy" size={32} color="#FFC800" />
          <Text style={styles.title}>Sıralama</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFC800" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="warning" size={64} color="#FF4B4B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLeaderboard}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Total Players */}
          <Text style={styles.totalPlayers}>
            Toplam {leaderboard?.total_players || 0} oyuncu
          </Text>

          {/* Top 10 List */}
          {leaderboard && leaderboard.top_10.length > 0 ? (
            <FlatList
              data={leaderboard.top_10}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.player_name}-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                leaderboard.player_rank && leaderboard.player_rank > 10 && leaderboard.player_entry ? (
                  <View style={styles.playerSection}>
                    <Text style={styles.playerSectionTitle}>Senin Sıran</Text>
                    <View style={[styles.leaderboardItem, styles.playerItem]}>
                      <View style={styles.rankContainer}>
                        <Text style={styles.rankNumber}>{leaderboard.player_rank}</Text>
                      </View>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {leaderboard.player_entry.player_name}
                      </Text>
                      <View style={styles.scoreContainer}>
                        <FontAwesome5 name="star" size={14} color="#FFC800" />
                        <Text style={styles.scoreValue}>{leaderboard.player_entry.score}</Text>
                      </View>
                    </View>
                  </View>
                ) : null
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyText}>Henüz kimse oynamamış!</Text>
              <Text style={styles.emptySubtext}>İlk sen ol!</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => router.replace(`/quiz/${id}`)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => router.replace('/')}
            >
              <Ionicons name="home" size={20} color="#1CB0F6" />
              <Text style={styles.secondaryButtonText}>Ana Sayfa</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1CB0F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFC800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalPlayers: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  leaderboardItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goldRow: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  silverRow: {
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  bronzeRow: {
    backgroundColor: '#FFF5EE',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  playerSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  playerSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  playerItem: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#FFC800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  buttonsContainer: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#46A302',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#1CB0F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
