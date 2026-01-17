import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { saveScore } from '../src/services/api';
import { BannerAd } from '../src/components/BannerAd';

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    episodeId: string;
    episodeName: string;
    score: string;
    correctCount: string;
    totalQuestions: string;
    bonusCount: string;
    maxScore: string;
    livesLeft: string;
  }>();
  const router = useRouter();

  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef([...Array(20)].map(() => ({
    x: new Animated.Value(Math.random() * 400 - 200),
    y: new Animated.Value(-50),
    rotation: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  const score = parseInt(params.score || '0');
  const correctCount = parseInt(params.correctCount || '0');
  const totalQuestions = parseInt(params.totalQuestions || '0');
  const bonusCount = parseInt(params.bonusCount || '0');
  const maxScore = parseInt(params.maxScore || '0');
  const livesLeft = parseInt(params.livesLeft || '0');
  const episodeId = parseInt(params.episodeId || '1');

  const isGameOver = livesLeft <= 0;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    // Animate score counting up
    Animated.timing(scoreAnim, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Show confetti for high scores
    if (percentage >= 70 && !isGameOver) {
      setShowConfetti(true);
      animateConfetti();
    }
  }, []);

  const animateConfetti = () => {
    confettiAnims.forEach((anim, i) => {
      const delay = i * 100;
      Animated.parallel([
        Animated.timing(anim.y, {
          toValue: 600,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, {
          toValue: 360,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(delay + 2000),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const getMessage = () => {
    if (isGameOver) return { icon: 'heart-dislike', text: 'Canların Bitti!', color: '#FF4B4B' };
    if (percentage >= 90) return { icon: 'trophy', text: 'Mükemmel!', color: '#FFC800' };
    if (percentage >= 70) return { icon: 'star', text: 'Harika!', color: '#FFC800' };
    if (percentage >= 50) return { icon: 'thumbs-up', text: 'İyi!', color: '#58CC02' };
    return { icon: 'refresh', text: 'Tekrar Dene!', color: '#1CB0F6' };
  };

  const handleSave = async () => {
    if (!playerName.trim()) {
      Alert.alert('Hata', 'Lütfen isminizi girin');
      return;
    }
    if (playerName.length > 15) {
      Alert.alert('Hata', 'İsim en fazla 15 karakter olabilir');
      return;
    }

    try {
      setSaving(true);
      await saveScore(episodeId, playerName.trim(), score);
      setSaved(true);
      Alert.alert('Başarılı', 'Puanınız kaydedildi!');
    } catch (err) {
      Alert.alert('Hata', 'Puan kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handlePlayAgain = () => {
    router.replace(`/quiz/${episodeId}`);
  };

  const handleLeaderboard = () => {
    router.push(`/leaderboard/${episodeId}?player_name=${encodeURIComponent(playerName)}`);
  };

  const handleHome = () => {
    router.replace('/');
  };

  const messageInfo = getMessage();
  const animatedScore = scoreAnim.interpolate({
    inputRange: [0, score],
    outputRange: ['0', score.toString()],
  });

  const confettiColors = ['#FF4B4B', '#FFC800', '#58CC02', '#1CB0F6', '#FF9F1A', '#CE82FF'];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Confetti */}
          {showConfetti && (
            <View style={styles.confettiContainer}>
              {confettiAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      backgroundColor: confettiColors[i % confettiColors.length],
                      transform: [
                        { translateX: anim.x },
                        { translateY: anim.y },
                        { rotate: anim.rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
                      ],
                      opacity: anim.opacity,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: messageInfo.color }]}>
            <Ionicons name={messageInfo.icon as any} size={48} color="#fff" />
          </View>

          {/* Message */}
          <Text style={[styles.message, { color: messageInfo.color }]}>{messageInfo.text}</Text>

          {/* Episode Name */}
          <Text style={styles.episodeName}>{params.episodeName}</Text>

          {/* Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>PUANINIZ</Text>
            <Animated.Text style={styles.scoreValue}>
              {animatedScore}
            </Animated.Text>
            <Text style={styles.maxScore}>/ {maxScore} puan</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#58CC02" />
              <Text style={styles.statValue}>{correctCount}</Text>
              <Text style={styles.statLabel}>Doğru</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="help-circle" size={24} color="#1CB0F6" />
              <Text style={styles.statValue}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Toplam Soru</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="bolt" size={20} color="#FFC800" />
              <Text style={styles.statValue}>{bonusCount}</Text>
              <Text style={styles.statLabel}>Süper Zeka</Text>
            </View>
          </View>

          {/* Name Input */}
          {!saved && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İsminizi girin (max 15 karakter)</Text>
              <TextInput
                style={styles.input}
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="İsminiz..."
                placeholderTextColor="#999"
                maxLength={15}
              />
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {saved && (
            <View style={styles.savedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#58CC02" />
              <Text style={styles.savedText}>Puanınız kaydedildi!</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handlePlayAgain}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLeaderboard}>
              <Ionicons name="trophy" size={20} color="#FFC800" />
              <Text style={styles.secondaryButtonText}>Sıralama</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tertiaryButton} onPress={handleHome}>
              <Ionicons name="home" size={20} color="#1CB0F6" />
              <Text style={styles.tertiaryButtonText}>Ana Sayfa</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Banner Ad at bottom */}
      <View style={styles.adContainer}>
        <BannerAd />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1CB0F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    left: '50%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  episodeName: {
    fontSize: 18,
    color: '#fff',
    marginTop: 8,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFC800',
  },
  maxScore: {
    fontSize: 16,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  statItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    width: '100%',
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#46A302',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#AFAFAF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 204, 2, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  savedText: {
    color: '#58CC02',
    fontWeight: '600',
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 24,
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
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  tertiaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
});
