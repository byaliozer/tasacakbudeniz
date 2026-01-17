const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://denizquiz.emergent.host';

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
  episode_id: number;
  episode_name: string;
  questions: Question[];
  total_questions: number;
  max_possible_score: number;
}

export interface LeaderboardEntry {
  rank: number;
  player_name: string;
  score: number;
  timestamp: string;
}

export interface LeaderboardResponse {
  top_10: LeaderboardEntry[];
  player_rank: number | null;
  player_entry: LeaderboardEntry | null;
  total_players: number;
}

export async function getEpisodes(): Promise<Episode[]> {
  const response = await fetch(`${API_URL}/api/episodes`);
  if (!response.ok) throw new Error('Failed to fetch episodes');
  return response.json();
}

// Transform API response to normalized format
function normalizeQuizResponse(data: any): QuizResponse {
  const questions: Question[] = data.questions.map((q: any, qIndex: number) => {
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    // Check if options have 'id' field (new format) or 'is_correct' field (old format)
    const hasId = q.options[0]?.id !== undefined;
    const hasIsCorrect = q.options[0]?.is_correct !== undefined;
    
    let normalizedOptions: QuestionOption[];
    let correctOption: string;
    
    if (hasId && q.correct_option) {
      // New format: options have id and correct_option is provided
      normalizedOptions = q.options.map((opt: any) => ({
        id: String(opt.id).trim().toUpperCase(),
        text: opt.text
      }));
      correctOption = String(q.correct_option).trim().toUpperCase();
    } else if (hasIsCorrect) {
      // Old format: options have is_correct boolean
      normalizedOptions = q.options.map((opt: any, idx: number) => ({
        id: optionLetters[idx],
        text: opt.text
      }));
      // Find the correct option
      const correctIdx = q.options.findIndex((opt: any) => opt.is_correct === true);
      correctOption = correctIdx >= 0 ? optionLetters[correctIdx] : 'A';
    } else {
      // Fallback: assume first option is correct (should not happen)
      normalizedOptions = q.options.map((opt: any, idx: number) => ({
        id: optionLetters[idx],
        text: typeof opt === 'string' ? opt : opt.text
      }));
      correctOption = 'A';
    }
    
    // Ensure difficulty is normalized
    const difficultyMap: { [key: string]: string } = {
      'easy': 'kolay',
      'medium': 'orta', 
      'hard': 'zor'
    };
    const difficulty = difficultyMap[q.difficulty?.toLowerCase()] || q.difficulty || 'orta';
    
    // Ensure points is a number
    const points = typeof q.points === 'number' ? q.points : 
                   (difficulty === 'kolay' || difficulty === 'easy' ? 10 : 
                    difficulty === 'orta' || difficulty === 'medium' ? 20 : 50);
    
    console.log(`[API] Question ${qIndex + 1}: correct_option = ${correctOption}, options =`, normalizedOptions.map(o => o.id));
    
    return {
      id: q.id || `q_${qIndex}`,
      text: q.text,
      options: normalizedOptions,
      correct_option: correctOption,
      difficulty: difficulty,
      points: points
    };
  });
  
  return {
    episode_id: data.episode_id,
    episode_name: data.episode_name || `Bölüm ${data.episode_id}`,
    questions: questions,
    total_questions: data.total_questions || questions.length,
    max_possible_score: data.max_possible_score || questions.reduce((sum, q) => sum + q.points + 5, 0)
  };
}

export async function startQuiz(episodeId: number, count: number = 20): Promise<QuizResponse> {
  const response = await fetch(`${API_URL}/api/quiz/${episodeId}?count=${count}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start quiz');
  }
  const data = await response.json();
  console.log('[API] Raw quiz data received:', JSON.stringify(data).substring(0, 500));
  return normalizeQuizResponse(data);
}

export async function saveScore(episodeId: number, playerName: string, score: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ episode_id: episodeId, player_name: playerName, score }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to save score');
  }
}

export async function getLeaderboard(episodeId: number, playerName?: string): Promise<LeaderboardResponse> {
  let url = `${API_URL}/api/leaderboard/${episodeId}`;
  if (playerName) url += `?player_name=${encodeURIComponent(playerName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}
