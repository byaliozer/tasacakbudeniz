import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getEpisodeQuiz,
  getMixedQuiz,
  submitEpisodeScore,
  submitMixedScore,
  getSettings,
  QuizResponse,
  Question,
} from '../src/services/api';
import { useSound } from '../src/context/SoundContext';

export default function QuizScreen() {
  const params = useLocalSearchParams();
  const mode = (params.mode as string) || 'episode';
  const episodeId = parseInt(params.episode as string) || 1;
  const router = useRouter();
  const { playCorrectSound, playWrongSound, playBonusSound, playTickSound, isMuted } = useSound();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(20);
  const [answerState, setAnswerState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bonusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQuiz();
    loadSettings();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();
    setVibrationEnabled(settings.vibrationEnabled);
  };

  const loadQuiz = async () => {
    try {
      const data = mode === 'mixed' 
        ? await getMixedQuiz() 
        : await getEpisodeQuiz(episodeId);
      setQuiz(data);
      startTimer();
    } catch (e) {
      console.error('Error loading quiz:', e);
    }
    setLoading(false);
  };

  const startTimer = () => {
    questionStartTime.current = Date.now();
    setTimer(20);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        // Tick sound in last 5 seconds
        if (prev <= 6 && prev > 1 && !isMuted) {
          playTickSound();
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    if (answerState !== 'none') return;
    setAnswerState('wrong');
    loseLife();
    setTimeout(nextQuestion, 1500);
  };

  const handleAnswer = (optionId: string) => {
    if (answerState !== 'none' || gameOver || !quiz) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    const question = quiz.questions[currentIndex];
    const timeTaken = (Date.now() - questionStartTime.current) / 1000;
    const isSpeedBonus = timeTaken <= 5;
    
    const normalizedSelected = String(optionId).trim().toUpperCase();
    const normalizedCorrect = String(question.correct_option).trim().toUpperCase();
    const isCorrect = normalizedSelected === normalizedCorrect;
    
    setSelectedAnswer(optionId);
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      let points = question.points;
      if (isSpeedBonus) {
        points += 5;
        setSpeedBonus((prev) => prev + 5);
        showBonusAnimation();
        playBonusSound();
      } else {
        playCorrectSound();
      }
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
      
      // Scale animation for correct
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else {
      playWrongSound();
      if (vibrationEnabled && Platform.OS !== 'web') {
        Vibration.vibrate(200);
      }
      loseLife();
      
      // Shake animation for wrong
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    
    setTimeout(nextQuestion, 1500);
  };

  const showBonusAnimation = () => {
    bonusAnim.setValue(0);
    Animated.sequence([
      Animated.timing(bonusAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(bonusAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const loseLife = () => {
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameOver(true);
      endGame();
    }
  };

  const nextQuestion = () => {
    if (gameOver || !quiz) return;
    
    const nextIdx = currentIndex + 1;
    
    // Episode mode: 25 questions max
    if (mode === 'episode' && nextIdx >= 25) {
      endGame();
      return;
    }
    
    // Mixed mode: endless until lives run out
    if (nextIdx >= quiz.questions.length) {
      endGame();
      return;
    }
    
    setCurrentIndex(nextIdx);
    setAnswerState('none');
    setSelectedAnswer(null);
    startTimer();
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      if (mode === 'mixed') {
        const result = await submitMixedScore(score, correctCount, speedBonus, currentIndex + 1);
        router.replace({
          pathname: '/result',
          params: {
            mode: 'mixed',
            score: score.toString(),
            correctCount: correctCount.toString(),
            speedBonus: speedBonus.toString(),
            questionsAnswered: (currentIndex + 1).toString(),
            isNewRecord: result.is_new_record ? '1' : '0',
            bestScore: result.best_score.toString(),
          },
        });
      } else {
        const result = await submitEpisodeScore(episodeId, score, correctCount, speedBonus);
        router.replace({
          pathname: '/result',
          params: {
            mode: 'episode',
            episodeId: episodeId.toString(),
            score: score.toString(),
            correctCount: correctCount.toString(),
            speedBonus: speedBonus.toString(),
            totalQuestions: '25',
            isNewRecord: result.is_new_record ? '1' : '0',
            bestScore: result.best_score.toString(),
          },
        });
      }
    } catch (e) {
      console.error('Error saving score:', e);
      router.replace('/');
    }
  };

  if (loading || !quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#009688" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = mode === 'episode' ? 25 : quiz.questions.length;
  const isSpeedBonusActive = timer > 15;
  const timerDanger = timer <= 5;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Lives */}
        <View style={styles.livesContainer}>
          {[1, 2, 3].map((i) => (
            <Ionicons
              key={i}
              name={i <= lives ? 'heart' : 'heart-outline'}
              size={24}
              color={i <= lives ? '#ff6b6b' : '#444'}
            />
          ))}
        </View>
        
        {/* Score */}
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={20} color="#ffc107" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
        
        {/* Question Counter */}
        <Text style={styles.questionCounter}>
          {currentIndex + 1} / {totalQuestions}
        </Text>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <View style={[styles.timerBar, { width: `${(timer / 20) * 100}%` }, timerDanger && styles.timerDanger]} />
        <Text style={[styles.timerText, timerDanger && styles.timerTextDanger]}>{timer}s</Text>
      </View>

      {/* Speed Bonus Indicator */}
      {isSpeedBonusActive && answerState === 'none' && (
        <View style={styles.speedBonusIndicator}>
          <Text style={styles.speedBonusText}>🔥 +5 HIZLI CEVAP</Text>
        </View>
      )}

      {/* Floating Bonus Animation */}
      <Animated.View
        style={[
          styles.floatingBonus,
          {
            opacity: bonusAnim,
            transform: [{ translateY: bonusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }],
          },
        ]}
      >
        <Text style={styles.floatingBonusText}>+5 SÜPER ZEKA!</Text>
      </Animated.View>

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{currentQuestion.difficulty.toUpperCase()}</Text>
        </View>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
      </Animated.View>

      {/* Options */}
      <Animated.View style={[styles.optionsContainer, { transform: [{ scale: scaleAnim }] }]}>
        {currentQuestion.options.map((option) => {
          const normalizedOptionId = String(option.id).trim().toUpperCase();
          const normalizedCorrectId = String(currentQuestion.correct_option).trim().toUpperCase();
          const normalizedSelectedId = selectedAnswer ? String(selectedAnswer).trim().toUpperCase() : null;
          
          const isSelected = normalizedSelectedId === normalizedOptionId;
          const isCorrectOption = normalizedOptionId === normalizedCorrectId;
          
          let optionStyle = [styles.optionButton];
          let textStyle = [styles.optionText];
          
          if (answerState !== 'none') {
            if (isCorrectOption) {
              optionStyle.push(styles.correctOption);
              textStyle.push(styles.selectedText);
            } else if (isSelected) {
              optionStyle.push(styles.wrongOption);
              textStyle.push(styles.selectedText);
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
              <Text style={textStyle} numberOfLines={2}>{option.text}</Text>
              {answerState !== 'none' && isCorrectOption && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.optionIcon} />
              )}
              {answerState !== 'none' && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={24} color="#fff" style={styles.optionIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,193,7,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  questionCounter: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  timerContainer: {
    height: 8,
    backgroundColor: '#2d2d44',
    marginHorizontal: 16,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#009688',
    borderRadius: 4,
  },
  timerDanger: {
    backgroundColor: '#ff6b6b',
  },
  timerText: {
    position: 'absolute',
    right: 8,
    top: -20,
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  timerTextDanger: {
    color: '#ff6b6b',
  },
  speedBonusIndicator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,152,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  speedBonusText: {
    color: '#ff9800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  floatingBonus: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
  },
  floatingBonusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  questionContainer: {
    padding: 20,
    marginTop: 16,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  difficultyText: {
    color: '#009688',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 28,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctOption: {
    backgroundColor: '#2e7d32',
    borderColor: '#4caf50',
  },
  wrongOption: {
    backgroundColor: '#c62828',
    borderColor: '#f44336',
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  selectedText: {
    fontWeight: '600',
  },
  optionIcon: {
    marginLeft: 'auto',
  },
});
