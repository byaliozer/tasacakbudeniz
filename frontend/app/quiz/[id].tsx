import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { startQuiz, Question, QuizResponse } from '../../src/services/api';
import { useSound } from '../../src/context/SoundContext';
import { useAds } from '../../src/context/AdContext';
import { BannerAd } from '../../src/components/BannerAd';

const { width } = Dimensions.get('window');
const TIMER_DURATION = 20;
const BONUS_TIME = 5;

type AnswerState = 'none' | 'correct' | 'wrong' | 'timeout';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isMuted, toggleMute, playCorrectSound, playWrongSound, playBonusSound, playTickSound, playGameOverSound } = useSound();
  const { showInterstitial } = useAds();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [answerState, setAnswerState] = useState<AnswerState>('none');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showBonus, setShowBonus] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [bonusCount, setBonusCount] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bonusAnim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (quiz && answerState === 'none' && !gameOver) {
      startTimer();
      animateQuestion();
      setQuestionStartTime(Date.now());
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, quiz, gameOver]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await startQuiz(parseInt(id || '1'), 20);
      setQuiz(data);
    } catch (err: any) {
      setError(err.message || 'Quiz yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const animateQuestion = () => {
    questionAnim.setValue(0);
    Animated.spring(questionAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const startTimer = () => {
    setTimeLeft(TIMER_DURATION);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        // Play tick sound in last 10 seconds
        if (prev <= 11) {
          playTickSound();
        }
        // Shake animation in last 10 seconds
        if (prev <= 11) {
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          ]).start();
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    setAnswerState('timeout');
    playWrongSound();
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      endGame(true); // Game over due to lives
    } else {
      setTimeout(() => nextQuestion(), 2000);
    }
  };

  const handleAnswer = (optionId: string) => {
    if (answerState !== 'none' || gameOver) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const question = quiz?.questions[currentIndex];
    if (!question) return;
    
    setSelectedAnswer(optionId);
    const isCorrect = optionId === question.correct_option;
    const answerTime = (Date.now() - questionStartTime) / 1000;
    const isBonus = answerTime <= BONUS_TIME;
    
    if (isCorrect) {
      setAnswerState('correct');
      let points = question.points;
      setCorrectCount(prev => prev + 1);
      
      if (isBonus) {
        points += 5;
        setBonusCount(prev => prev + 1);
        setShowBonus(true);
        playBonusSound();
        // Bonus animation
        Animated.sequence([
          Animated.timing(bonusAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(1500),
          Animated.timing(bonusAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setShowBonus(false));
      } else {
        playCorrectSound();
      }
      
      setScore(prev => prev + points);
      // Score pop animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      
      setTimeout(() => nextQuestion(), 2000);
    } else {
      setAnswerState('wrong');
      playWrongSound();
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        setTimeout(() => endGame(true), 1500); // Game over due to lives
      } else {
        setTimeout(() => nextQuestion(), 2000);
      }
    }
  };

  const nextQuestion = () => {
    if (!quiz) return;
    
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswerState('none');
      setSelectedAnswer(null);
    } else {
      endGame(false); // Completed all questions
    }
  };

  const endGame = async (isGameOver: boolean) => {
    setGameOver(true);
    
    if (isGameOver) {
      playGameOverSound();
    }
    
    // Show interstitial ad when game ends (game over or completed)
    await showInterstitial();
    
    router.replace({
      pathname: '/result',
      params: {
        episodeId: id,
        episodeName: quiz?.episode_name || '',
        score: score.toString(),
        correctCount: correctCount.toString(),
        totalQuestions: (currentIndex + 1).toString(),
        bonusCount: bonusCount.toString(),
        maxScore: quiz?.max_possible_score.toString() || '0',
        livesLeft: (isGameOver ? 0 : lives).toString(),
      },
    });
  };

  const handleExit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return '#FF4B4B';
    if (timeLeft <= 10) return '#FFC800';
    return '#58CC02';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: { [key: string]: { text: string; color: string } } = {
      kolay: { text: 'Kolay', color: '#58CC02' },
      easy: { text: 'Kolay', color: '#58CC02' },
      orta: { text: 'Orta', color: '#FFC800' },
      medium: { text: 'Orta', color: '#FFC800' },
      zor: { text: 'Zor', color: '#FF4B4B' },
      hard: { text: 'Zor', color: '#FF4B4B' },
    };
    return labels[difficulty.toLowerCase()] || { text: 'Orta', color: '#FFC800' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC800" />
          <Text style={styles.loadingText}>Quiz yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="warning" size={64} color="#FF4B4B" />
          <Text style={styles.errorText}>{error || 'Quiz yüklenemedi'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = (currentIndex + 1) / quiz.questions.length;
  const difficultyInfo = getDifficultyLabel(currentQuestion.difficulty);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        
        <View style={styles.livesContainer}>
          {[...Array(3)].map((_, i) => (
            <Ionicons
              key={i}
              name="heart"
              size={22}
              color={i < lives ? '#FF4B4B' : '#555'}
            />
          ))}
        </View>
        
        <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scaleAnim }] }]}>
          <FontAwesome5 name="star" size={18} color="#FFC800" />
          <Text style={styles.scoreText}>{score}</Text>
        </Animated.View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Info */}
        <View style={styles.questionInfo}>
          <Text style={styles.questionNumber}>Soru {currentIndex + 1}/{quiz.questions.length}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyInfo.color }]}>
            <Text style={styles.difficultyText}>{difficultyInfo.text} • {currentQuestion.points} puan</Text>
          </View>
        </View>

        {/* Timer */}
        <Animated.View style={[styles.timerContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={[styles.timerCircle, { borderColor: getTimerColor() }]}>
            <Ionicons name="alarm" size={24} color={getTimerColor()} />
            <Text style={[styles.timerText, { color: getTimerColor() }]}>{timeLeft}</Text>
          </View>
          <Text style={styles.bonusHint}>
            <FontAwesome5 name="bolt" size={12} color="#FFC800" /> 5 saniyede cevapla = +5 bonus!
          </Text>
        </Animated.View>

        {/* Question Card */}
        <Animated.View style={[
          styles.questionCard,
          { opacity: questionAnim, transform: [{ translateY: questionAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }
        ]}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentQuestion.correct_option;
            let optionStyle = styles.optionButton;
            let textStyle = styles.optionText;
            
            if (answerState !== 'none') {
              if (isCorrect) {
                optionStyle = { ...styles.optionButton, ...styles.correctOption };
                textStyle = { ...styles.optionText, ...styles.selectedText };
              } else if (isSelected && !isCorrect) {
                optionStyle = { ...styles.optionButton, ...styles.wrongOption };
                textStyle = { ...styles.optionText, ...styles.selectedText };
              }
            }
            
            return (
              <TouchableOpacity
                key={option.id}
                style={optionStyle}
                onPress={() => handleAnswer(option.id)}
                disabled={answerState !== 'none'}
                activeOpacity={0.8}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>{option.id}</Text>
                </View>
                <Text style={textStyle}>{option.text}</Text>
                {answerState !== 'none' && isCorrect && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.optionIcon} />
                )}
                {answerState !== 'none' && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={24} color="#fff" style={styles.optionIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Message */}
        {answerState !== 'none' && (
          <View style={styles.feedbackContainer}>
            {answerState === 'correct' && (
              <Text style={styles.correctFeedback}>
                🎉 Doğru! +{currentQuestion.points}{showBonus ? '+5 bonus' : ''} puan
              </Text>
            )}
            {answerState === 'wrong' && (
              <Text style={styles.wrongFeedback}>
                😔 Yanlış!
              </Text>
            )}
            {answerState === 'timeout' && (
              <Text style={styles.timeoutFeedback}>
                ⏰ Süre doldu!
              </Text>
            )}
          </View>
        )}

        {/* Sound Toggle */}
        <TouchableOpacity style={styles.soundButton} onPress={toggleMute}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Banner Ad at bottom */}
      <View style={styles.adContainer}>
        <BannerAd />
      </View>

      {/* Bonus Popup */}
      {showBonus && (
        <Animated.View style={[
          styles.bonusPopup,
          {
            opacity: bonusAnim,
            transform: [{ scale: bonusAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]}>
          <FontAwesome5 name="bolt" size={32} color="#FFC800" />
          <Text style={styles.bonusTitle}>⚡ SÜPER ZEKA!</Text>
          <Text style={styles.bonusSubtitle}>Yıldırım hızında cevapladın</Text>
          <Text style={styles.bonusPoints}>+5 BONUS PUAN!</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1CB0F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FFC800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  exitButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 5,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  scoreText: {
    color: '#FFC800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  questionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bonusHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
  },
  questionCard: {
    backgroundColor: '#1899D6',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    borderBottomWidth: 4,
    borderBottomColor: '#E0E0E0',
  },
  correctOption: {
    backgroundColor: '#58CC02',
    borderBottomColor: '#46A302',
  },
  wrongOption: {
    backgroundColor: '#FF4B4B',
    borderBottomColor: '#E64040',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  optionIcon: {
    marginLeft: 8,
  },
  feedbackContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  correctFeedback: {
    backgroundColor: '#58CC02',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  wrongFeedback: {
    backgroundColor: '#FF4B4B',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  timeoutFeedback: {
    backgroundColor: '#FFC800',
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  soundButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  bonusPopup: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  bonusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1CB0F6',
    marginTop: 12,
  },
  bonusSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  bonusPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFC800',
    marginTop: 12,
  },
});
