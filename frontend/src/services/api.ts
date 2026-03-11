import AsyncStorage from '@react-native-async-storage/async-storage';
import { EPISODES, QUESTIONS, getAllQuestions, LocalQuestion } from '../data/quizData';

// Storage keys
const STORAGE_KEYS = {
  USERNAME: '@denizquiz_username',
  SETTINGS: '@denizquiz_settings',
  EPISODE_SCORES: '@denizquiz_episode_scores',
  MIXED_BEST_SCORE: '@denizquiz_mixed_best',
  EPISODE_BEST_SCORES: '@denizquiz_episode_bests',
};

// === TYPES ===

export interface Episode {
  id: number;
  name: string;
  question_count: number;
  is_locked: boolean;
  description: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correct_option: string;
  difficulty: string;
  points: number;
}

export interface QuizResponse {
  episode_id: number | null;
  episode_name: string;
  questions: Question[];
  total_questions: number;
  max_possible_score: number;
  mode: 'episode' | 'mixed';
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// === USERNAME MANAGEMENT ===

export async function getUsername(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USERNAME);
  } catch {
    return null;
  }
}

export async function setUsername(name: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, name);
}

export async function hasUsername(): Promise<boolean> {
  const name = await getUsername();
  return name !== null && name.length > 0;
}

// === SETTINGS MANAGEMENT ===

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return { soundEnabled: true, vibrationEnabled: true };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// === LOCAL SCORE MANAGEMENT ===

export async function getLocalEpisodeScores(): Promise<Record<number, number>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EPISODE_BEST_SCORES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {};
}

async function saveLocalEpisodeBestScore(episodeId: number, score: number): Promise<{ is_new_record: boolean; best_score: number }> {
  const scores = await getLocalEpisodeScores();
  const currentBest = scores[episodeId] || 0;
  const isNewRecord = score > currentBest;
  
  if (isNewRecord) {
    scores[episodeId] = score;
    await AsyncStorage.setItem(STORAGE_KEYS.EPISODE_BEST_SCORES, JSON.stringify(scores));
  }
  
  return {
    is_new_record: isNewRecord,
    best_score: isNewRecord ? score : currentBest,
  };
}

export async function getLocalMixedBestScore(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.MIXED_BEST_SCORE);
    if (stored) {
      return parseInt(stored, 10) || 0;
    }
  } catch {}
  return 0;
}

async function saveLocalMixedBestScore(score: number): Promise<{ is_new_record: boolean; best_score: number }> {
  const currentBest = await getLocalMixedBestScore();
  const isNewRecord = score > currentBest;
  
  if (isNewRecord) {
    await AsyncStorage.setItem(STORAGE_KEYS.MIXED_BEST_SCORE, score.toString());
  }
  
  return {
    is_new_record: isNewRecord,
    best_score: isNewRecord ? score : currentBest,
  };
}

// === HELPER: Convert local question format to game format with shuffled options ===

function convertQuestion(q: LocalQuestion): Question {
  // Create options with their original IDs for tracking
  const originalOptions = [
    { originalId: 'A', text: q.A },
    { originalId: 'B', text: q.B },
    { originalId: 'C', text: q.C },
    { originalId: 'D', text: q.D },
  ];

  // Shuffle options randomly
  const shuffled = shuffleArray(originalOptions);

  // Assign new position IDs (A, B, C, D) and find new correct answer position
  const positionIds = ['A', 'B', 'C', 'D'];
  let newCorrect = 'A';
  const options = shuffled.map((opt, idx) => {
    if (opt.originalId === q.correct) {
      newCorrect = positionIds[idx];
    }
    return { id: positionIds[idx], text: opt.text };
  });

  return {
    id: q.id,
    text: q.text,
    options,
    correct_option: newCorrect,
    difficulty: q.difficulty,
    points: q.points,
  };
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// === OFFLINE DATA FUNCTIONS ===

export async function getEpisodes(): Promise<Episode[]> {
  console.log('[API] Loading episodes from local data');
  return EPISODES.map(ep => ({
    id: ep.id,
    name: ep.name,
    question_count: ep.questionCount,
    is_locked: ep.isLocked,
    description: ep.description,
  }));
}

export async function getEpisodeQuiz(episodeId: number): Promise<QuizResponse> {
  console.log('[API] Loading episode quiz from local data, episode:', episodeId);
  
  const localQuestions = QUESTIONS[episodeId];
  if (!localQuestions || localQuestions.length === 0) {
    throw new Error('Bu bölüm için soru bulunamadı');
  }
  
  const episode = EPISODES.find(ep => ep.id === episodeId);
  // Shuffle question order so they appear in random order each time
  const shuffledQuestions = shuffleArray(localQuestions);
  const questions = shuffledQuestions.map(convertQuestion);
  
  return {
    episode_id: episodeId,
    episode_name: episode?.name || `${episodeId}. Bölüm`,
    questions,
    total_questions: questions.length,
    max_possible_score: questions.reduce((sum, q) => sum + q.points + 5, 0),
    mode: 'episode',
  };
}

export async function getMixedQuiz(): Promise<QuizResponse> {
  console.log('[API] Loading mixed quiz from local data');
  
  const allLocalQuestions = getAllQuestions();
  const shuffled = shuffleArray(allLocalQuestions);
  const questions = shuffled.map(convertQuestion);
  
  return {
    episode_id: null,
    episode_name: 'Karışık Mod',
    questions,
    total_questions: questions.length,
    max_possible_score: questions.reduce((sum, q) => sum + q.points + 5, 0),
    mode: 'mixed',
  };
}

// === SCORE FUNCTIONS (Local Only) ===

export async function submitEpisodeScore(
  episodeId: number,
  score: number,
  _correctCount: number,
  _speedBonus: number
): Promise<{ success: boolean; is_new_record: boolean; best_score: number }> {
  console.log('[API] Saving episode score locally:', { episodeId, score });
  const result = await saveLocalEpisodeBestScore(episodeId, score);
  return { success: true, ...result };
}

export async function submitMixedScore(
  score: number,
  _correctCount: number,
  _speedBonus: number,
  _questionsAnswered: number
): Promise<{ success: boolean; is_new_record: boolean; best_score: number }> {
  console.log('[API] Saving mixed score locally:', { score });
  const result = await saveLocalMixedBestScore(score);
  return { success: true, ...result };
}

// === PLAYER STATS (Local) ===

export interface PlayerStats {
  player_name: string;
  global_score: number;
  episodes_completed: number;
  episode_scores: Record<number, number>;
  mixed_best_score: number;
}

export async function getPlayerStats(): Promise<PlayerStats | null> {
  const username = await getUsername();
  if (!username) return null;
  
  const episodeScores = await getLocalEpisodeScores();
  const mixedBest = await getLocalMixedBestScore();
  
  const globalScore = Object.values(episodeScores).reduce((sum, s) => sum + s, 0) + mixedBest;
  const episodesCompleted = Object.keys(episodeScores).length;
  
  return {
    player_name: username,
    global_score: globalScore,
    episodes_completed: episodesCompleted,
    episode_scores: episodeScores,
    mixed_best_score: mixedBest,
  };
}
